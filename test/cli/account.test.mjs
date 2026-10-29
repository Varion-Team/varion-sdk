import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test, { after, before } from 'node:test';
import { deployTarget, run as deploy } from '../../src/cli/commands/deploy.mjs';
import { run as login } from '../../src/cli/commands/login.mjs';
import { run as logout } from '../../src/cli/commands/logout.mjs';
import { run as whoami } from '../../src/cli/commands/whoami.mjs';
import { loadProject } from '../../src/cli/config.mjs';
import { CliError, createMemoryOutput } from '../../src/cli/output.mjs';
import {
  DeployError,
  initKeys,
  keysDir,
  loginFile,
  savedLogin,
  saveLogin,
  showKey,
  verifyDeployRequest,
} from '../../src/deploy/client.mjs';
import { startFakeCabinet } from '../host/fixtures/fake-cabinet.mjs';
import { cleanupTempDirs, tempDir, writeFiles } from './helpers.mjs';

const config = tempDir('varion-cli-config-');
for (const name of [
  'VARION_KEYS_DIR',
  'VARION_DEPLOY_KEY',
  'VARION_DEPLOY_TOKEN',
  'VARION_CABINET_URL',
])
  delete process.env[name];
process.env.VARION_CONFIG_DIR = config;

const ACCOUNT = { id: 'acc-1', name: 'Dev' };
const projectToml = (cabinetUrl, name = 'demo') =>
  `[project]\nname = "${name}"\n[engine]\nversion = "1.0.75"\n[deploy]\ncabinet = "${cabinetUrl}"\n[deploy.test]\nserver = "srv-1"\n`;
const newCliToken = () => `varion_cli_${crypto.randomBytes(32).toString('hex')}`;

let cabinet;

before(async () => {
  cabinet = await startFakeCabinet({ serverId: 'srv-1' });
});

after(async () => {
  await cabinet.close();
  cleanupTempDirs();
});

test('varion login: a code to confirm in the browser, the token in the config folder, the key added to the account', async () => {
  cabinet.onLoginStart = (started) => cabinet.approveLogin(started.userCode, ACCOUNT);
  const output = createMemoryOutput();
  const code = await login(['--cabinet', cabinet.url, '--no-browser', '--name', 'dev-pc (home)'], {
    output,
  });
  assert.equal(code, 0, output.lines.join('\n'));
  const events = output.events();
  const shown = events.find((event) => event.type === 'login-code');
  assert.match(shown.userCode, /^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  assert.equal(shown.verifyUrl, `${cabinet.url}/cabinet/device?code=${shown.userCode}`);

  const saved = savedLogin(cabinet.url);
  assert.match(saved.token, /^varion_cli_[0-9a-f]{64}$/);
  assert.deepEqual(saved.account, ACCOUNT);
  assert.equal(path.dirname(loginFile()), config);
  assert.equal(keysDir(), path.join(config, 'keys'));
  assert.ok(!output.lines.some((line) => line.includes(saved.token)), 'the token is never printed');

  const key = showKey();
  assert.deepEqual(
    cabinet.developerKeys.map(({ publicKey, name, accountId, status }) => ({
      publicKey,
      name,
      accountId,
      status,
    })),
    [{ publicKey: key.publicKey, name: 'dev-pc home', accountId: 'acc-1', status: 'pending' }],
  );
  const added = events.find((event) => event.type === 'key');
  assert.equal(added.fingerprint, key.fingerprint);
  assert.match(added.publicKey, /^[A-Za-z0-9+/]{43}=$/);
});

test('varion login: a sign-in declined in the cabinet saves nothing', async () => {
  const before = fs.readFileSync(loginFile(), 'utf8');
  cabinet.onLoginStart = (started) => cabinet.denyLogin(started.userCode);
  await assert.rejects(
    login(['--cabinet', cabinet.url, '--no-browser'], { output: createMemoryOutput() }),
    (error) => error instanceof DeployError && error.code === 'login_denied',
  );
  assert.equal(fs.readFileSync(loginFile(), 'utf8'), before);
});

test('varion whoami: the account and its servers; a revoked sign-in asks to sign in again', async () => {
  const output = createMemoryOutput();
  assert.equal(await whoami(['--cabinet', cabinet.url], { output }), 0);
  const shown = output.events().find((event) => event.type === 'account');
  assert.deepEqual(shown.account, ACCOUNT);
  assert.deepEqual(shown.servers, [
    { id: 'srv-1', name: 'Test server', deployTest: true, deployProd: false },
  ]);

  const { token } = savedLogin(cabinet.url);
  cabinet.revokeCliToken(token);
  await assert.rejects(
    whoami(['--cabinet', cabinet.url], { output: createMemoryOutput() }),
    (error) =>
      error instanceof CliError &&
      error.code === 'signed_out' &&
      error.message.includes(`varion login --cabinet ${cabinet.url}`),
  );
  cabinet.signedIn(token, ACCOUNT);
});

test('varion logout forgets the sign-in to one cabinet and keeps the others', async () => {
  const other = newCliToken();
  saveLogin('https://cabinet.example', { token: other, account: ACCOUNT });
  const output = createMemoryOutput();
  assert.equal(await logout(['--cabinet', cabinet.url], { output }), 0);
  assert.equal(output.events().find((event) => event.type === 'logout').forgotten, true);
  assert.equal(savedLogin(cabinet.url), null);
  assert.equal(savedLogin('https://cabinet.example/').token, other);
  await assert.rejects(
    whoami(['--cabinet', cabinet.url], { output: createMemoryOutput() }),
    (error) => error instanceof CliError && error.code === 'not_signed_in',
  );
  const again = createMemoryOutput();
  await logout(['--cabinet', cabinet.url], { output: again });
  assert.equal(again.events().find((event) => event.type === 'logout').forgotten, false);
});

test('varion deploy takes the stored sign-in when VARION_DEPLOY_TOKEN is not set', () => {
  const root = tempDir();
  writeFiles(root, { 'varion.toml': projectToml(cabinet.url) });
  const project = loadProject(root);
  const vars = { VARION_CONFIG_DIR: config };
  assert.throws(
    () => deployTarget(project, 'test', vars),
    (error) =>
      error instanceof CliError &&
      /varion login --cabinet .*VARION_DEPLOY_TOKEN/.test(error.message),
  );

  const signedIn = newCliToken();
  saveLogin(cabinet.url, { token: signedIn, account: ACCOUNT }, { env: vars });
  assert.deepEqual(deployTarget(project, 'test', vars), {
    cabinetUrl: cabinet.url,
    serverId: 'srv-1',
    token: signedIn,
    signedIn: true,
  });

  const developer = `varion_dev_${'c'.repeat(64)}`;
  assert.equal(
    deployTarget(project, 'test', { ...vars, VARION_DEPLOY_TOKEN: developer }).token,
    developer,
  );
  writeFiles(root, { '.env': `VARION_DEPLOY_TOKEN=${developer}\n` });
  assert.deepEqual(
    [deployTarget(project, 'test', vars).token, deployTarget(project, 'test', vars).signedIn],
    [developer, false],
  );
  assert.equal(deployTarget(project, 'preview-feature-x', vars).serverId, 'preview');
  fs.rmSync(path.join(root, '.env'));
  assert.equal(
    deployTarget(project, 'preview-feature-x', vars).serverId,
    'srv-1',
    'a signed-in preview goes to the test server',
  );

  writeFiles(root, { 'varion.toml': projectToml('http://127.0.0.1:9') });
  assert.throws(
    () => deployTarget(loadProject(root), 'test', vars),
    /varion login --cabinet http:\/\/127\.0\.0\.1:9/,
    'a token of another cabinet is not sent here',
  );
});

test('varion deploy test --rollback: the active release from the cabinet, a signed rollback, the result', async () => {
  const token = newCliToken();
  cabinet.signedIn(token, ACCOUNT);
  saveLogin(cabinet.url, { token, account: ACCOUNT });
  const key = initKeys();
  const root = tempDir();
  writeFiles(root, { 'varion.toml': projectToml(cabinet.url) });
  const release = (releaseId, sha256, env, active) => ({
    serverId: 'srv-1',
    releaseId,
    sha256,
    project: 'demo',
    env,
    active,
    status: active ? 'active' : 'inactive',
    stored: true,
  });
  cabinet.panelReleases.push(
    release('20261029-100000-aaaaaaaa', 'a'.repeat(64), 'test', false),
    release('20261029-110000-bbbbbbbb', 'b'.repeat(64), 'test', true),
    release('20261029-120000-cccccccc', 'c'.repeat(64), 'prod', true),
  );
  let sent = null;
  cabinet.onPanelDeploy = (deploy) => {
    sent = deploy.signed;
    cabinet.finishDeploy(deploy.deployId, 'rolled-back');
  };
  const output = createMemoryOutput();
  assert.equal(
    await deploy(['test', '--rollback', '--cwd', root], { output }),
    0,
    output.lines.join('\n'),
  );

  const { issuedAt, nonce, ...request } = sent.request;
  assert.deepEqual(request, {
    action: 'rollback',
    env: 'test',
    project: 'demo',
    releaseId: '20261029-110000-bbbbbbbb',
    serverId: 'srv-1',
    sha256: 'b'.repeat(64),
  });
  assert.ok(Date.parse(issuedAt) && nonce);
  assert.equal(sent.publicKey, key.publicKey);
  assert.ok(verifyDeployRequest(sent));
  assert.ok(cabinet.panelTokens.length && cabinet.panelTokens.every((used) => used === token));
  const done = output.events().find((event) => event.type === 'deployed');
  assert.deepEqual([done.action, done.phase], ['rollback', 'rolled-back']);
});

test('varion deploy --rollback refuses what it cannot roll back', async () => {
  const root = tempDir();
  writeFiles(root, { 'varion.toml': projectToml(cabinet.url, 'other') });
  const refused = (args, check) =>
    assert.rejects(deploy([...args, '--cwd', root], { output: createMemoryOutput() }), check);
  await refused(['test', '--rollback', '--pack-only'], /--pack-only/);
  await refused(
    ['test', '--rollback'],
    (error) => error.code === 'other_project' && /demo/.test(error.message),
  );
  await refused(['preview-x', '--rollback'], (error) => error.code === 'nothing_active');
  cabinet.revokeCliToken(savedLogin(cabinet.url).token);
  await refused(
    ['test', '--rollback'],
    (error) => error.code === 'signed_out' && /varion login --cabinet/.test(error.message),
  );
});
