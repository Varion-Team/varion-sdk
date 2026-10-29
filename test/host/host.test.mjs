import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, describe, it } from 'node:test';
import { main } from '../../src/host/cli.mjs';
import { Host } from '../../src/host/host.mjs';
import { trustKey } from '../../src/host/keys.mjs';
import { createLogger } from '../../src/host/log.mjs';
import { enginePackageName } from '../../src/shared/engine.mjs';
import { sleep } from '../../src/shared/fs.mjs';
import { isAlive } from '../../src/shared/process.mjs';
import { startFakeCabinet } from './fixtures/fake-cabinet.mjs';
import {
  buildBundle,
  buildEnginePackage,
  generateKeyPair,
  makeRequest,
  removeDir,
  serverToml,
  signRequest,
  tempDir,
} from './fixtures/fixtures.mjs';

const FAKE_SERVER = fileURLToPath(new URL('./fixtures/fake-server.mjs', import.meta.url));
const TOKEN = 'varion_srv_test_only_token';
const work = tempDir('varion-host-run-');
const root = path.join(work, 'root');
const releaseKeys = generateKeyPair();
const developer = generateKeyPair();
const stranger = generateKeyPair();
const records = [];
let cabinet;
let host;
let running;

const MAIN = 'host-test-test';
const mainDir = () => path.join(root, 'instances', MAIN);
const instance = (name = MAIN) => host.instances.get(name);
const runs = (name = MAIN) =>
  fs
    .readFileSync(path.join(root, 'instances', name, 'fake-runs.log'), 'utf8')
    .trim()
    .split('\n');
const live = (file) =>
  fs.readFileSync(path.join(mainDir(), 'resources', ...file.split('/')), 'utf8');
const current = (name = MAIN) =>
  fs.readFileSync(path.join(root, 'instances', name, 'current'), 'utf8').trim();

const modeFiles = (version, extra = {}) => ({
  'mode/resource.toml': 'type = "js"\nmain = "server/main.js"\n',
  'mode/server/main.js': `console.log(${JSON.stringify(version)})\n`,
  'mode/version.txt': version,
  'chat/version.txt': 'chat-1',
  ...extra,
});
const baseToml = serverToml({
  port: 42010,
  httpPort: 42011,
  resources: ['chat', 'mode'],
  gamemode: 'mode',
});

/** A bundle the cabinet holds; returns it. */
function release({ env = 'test', resources = modeFiles('v1'), toml = baseToml } = {}) {
  const bundle = buildBundle({ project: 'host-test', env, resources, toml });
  cabinet.addRelease(bundle.releaseId, bundle.zip);
  return bundle;
}

async function deploy(
  bundle,
  {
    action = 'activate',
    env = bundle.manifest.env,
    serverId = 'srv-1',
    releaseId = bundle.releaseId,
    sha256 = bundle.sha256,
    ...options
  } = {},
) {
  const deployId = cabinet.deploy(
    { action, env, project: 'host-test', releaseId, serverId, sha256 },
    options,
  );
  try {
    return { ...(await cabinet.waitFinal(deployId, 60_000)), deployId };
  } catch (error) {
    // a timeout says nothing; show what the host was doing
    const tail = records
      .slice(-15)
      .map((record) => `${record.time} ${record.level} ${record.text}`)
      .join('\n');
    throw new Error(`${error.message}\nhost log:\n${tail}\npolls: ${cabinet.polls.length}`, {
      cause: error,
    });
  }
}

before(async () => {
  cabinet = await startFakeCabinet({
    token: TOKEN,
    developer,
    serverId: 'srv-1',
    pollAfterMs: 100,
  });
  const pkg = buildEnginePackage({ version: '1.0.75', releaseKeys });
  cabinet.serve('/Varion-Server/rc/1.0.75/server-manifest.json', pkg.manifestBytes);
  cabinet.serve('/Varion-Server/rc/1.0.75/server-manifest.json.sig', Buffer.from(pkg.signature));
  cabinet.serve(`/Varion-Server/rc/1.0.75/${enginePackageName('1.0.75')}`, pkg.zip);
  fs.mkdirSync(path.join(root, 'trust'), { recursive: true });
  trustKey(
    path.join(root, 'trust', 'deploy-keys.json'),
    developer.publicKeyBase64,
    'test developer',
  );
  const log = createLogger({ quiet: true, file: path.join(root, 'logs', 'host.log') });
  log.listen((record) => records.push(record));
  host = new Host({
    root,
    cabinetUrl: cabinet.url,
    token: TOKEN,
    serverIds: ['srv-1'],
    previewPorts: [42100, 42199],
    engineCdn: cabinet.url,
    releaseKey: releaseKeys.publicKeyPem,
    launcher: (exe, args) => ({ command: process.execPath, args: [FAKE_SERVER, ...args] }),
    log,
    pollIntervalMs: 100,
    pollWaitS: 1,
    readyTimeoutMs: 20_000,
    settleMs: 200,
    stopTimeoutMs: 5000,
    consoleTimeoutMs: 10_000,
    backoffInitialMs: 300,
    statusIntervalMs: 300,
    housekeepingIntervalMs: 3_600_000,
  });
  running = host.run();
});

after(async () => {
  host.requestStop();
  await running;
  await cabinet.close();
  removeDir(work);
});

describe('varion host run', { timeout: 300_000 }, () => {
  let pid;
  let bundleA;
  let bundleB;
  let bundleC;

  it('activates a first release: downloaded, verified, the engine checked, started, active with its port', async () => {
    bundleA = release({ resources: modeFiles('v1') });
    const status = await deploy(bundleA);
    assert.equal(status.phase, 'active', status.error);
    assert.equal(status.port, 42010);
    assert.deepEqual(cabinet.phases(status.deployId), [
      'downloading',
      'verifying',
      'activating',
      'active',
    ]);
    assert.equal(current(), bundleA.releaseId);
    assert.equal(live('mode/version.txt'), 'v1');
    assert.equal(instance().state, 'running');
    pid = instance().proc.pid;
    assert.match(runs().at(-1), /start chat@chat-1 mode@v1/);
    const toml = fs.readFileSync(path.join(mainDir(), 'server.toml'), 'utf8');
    assert.match(toml, /resourcesDir = "resources"\s*$/);
    assert.ok(fs.existsSync(path.join(root, 'engine', 'rc', '1.0.75', '.verified')));
    const poll = cabinet.polls.at(-1).body;
    assert.equal(poll.wait, 1);
    assert.ok(poll.hostId);
  });

  it('only a resource changed: `restart <resource>` on the console, the same process keeps running', async () => {
    bundleB = release({ resources: modeFiles('v2') });
    const status = await deploy(bundleB);
    assert.equal(status.phase, 'active', status.error);
    assert.equal(instance().proc.pid, pid, 'no full restart');
    assert.equal(current(), bundleB.releaseId);
    assert.equal(live('mode/version.txt'), 'v2');
    assert.match(runs().at(-1), new RegExp(`^${pid} restart mode@v2$`));
    assert.ok(
      records.some(
        (record) =>
          record.event === 'resource-restarted' &&
          record.resource === 'mode' &&
          record.part === 'restarted',
      ),
    );
    assert.ok(
      !runs().some((line) => /restart chat/.test(line)),
      'an unchanged resource is not restarted',
    );
  });

  it('server.toml changed: a graceful full restart', async () => {
    bundleC = release({
      resources: modeFiles('v3'),
      toml: baseToml.replace('maxPlayers = 8', 'maxPlayers = 16'),
    });
    const status = await deploy(bundleC);
    assert.equal(status.phase, 'active', status.error);
    assert.notEqual(instance().proc.pid, pid);
    assert.equal(isAlive(pid), false, 'the old server is gone');
    pid = instance().proc.pid;
    assert.match(runs().at(-1), /start chat@chat-1 mode@v3/);
  });

  it('rollback names the active release and goes back to the one before it, step by step', async () => {
    const back = await deploy(bundleC, { action: 'rollback' });
    assert.equal(back.phase, 'rolled-back', back.error);
    assert.equal(current(), bundleB.releaseId);
    assert.equal(live('mode/version.txt'), 'v2');
    assert.notEqual(instance().proc.pid, pid, 'server.toml differs: full restart');
    pid = instance().proc.pid;
    const again = await deploy(bundleB, { action: 'rollback' });
    assert.equal(again.phase, 'rolled-back', again.error);
    assert.equal(current(), bundleA.releaseId);
    assert.equal(instance().proc.pid, pid, 'A and B differ only in a resource: console restart');
    assert.match(runs().at(-1), /restart mode@v1/);
    const stale = await deploy(bundleC, { action: 'rollback' });
    assert.equal(stale.phase, 'failed');
    assert.match(stale.error, /only the active release/);
    const nothing = await deploy(bundleA, { action: 'rollback' });
    assert.equal(nothing.phase, 'failed');
    assert.match(nothing.error, /nothing was active/);
    assert.equal(current(), bundleA.releaseId);
  });

  it('a release that does not start is taken back: rolled-back, the previous one runs again', async () => {
    const broken = release({
      resources: modeFiles('v4', { 'mode/CRASH_ON_START': '' }),
      toml: baseToml.replace('maxPlayers = 8', 'maxPlayers = 9'),
    });
    const status = await deploy(broken);
    assert.equal(status.phase, 'rolled-back');
    assert.match(status.error, /did not start.*went back to/);
    assert.equal(current(), bundleA.releaseId);
    assert.equal(instance().state, 'running');
    assert.equal(live('mode/version.txt'), 'v1');
    pid = instance().proc.pid;
  });

  it('a resource restart that fails is taken back on the console', async () => {
    const broken = release({ resources: modeFiles('v5', { 'mode/FAIL_RESTART': '' }) });
    const status = await deploy(broken);
    assert.equal(status.phase, 'rolled-back');
    assert.match(status.error, /did not restart/);
    assert.equal(current(), bundleA.releaseId);
    assert.equal(instance().proc.pid, pid);
    assert.equal(live('mode/version.txt'), 'v1');
    assert.equal(fs.existsSync(path.join(mainDir(), 'resources', 'mode', 'FAIL_RESTART')), false);
  });

  it('refuses what it must not apply, and nothing changes', async () => {
    const bundle = release({ resources: modeFiles('evil') });
    const refused = [];
    refused.push([await deploy(bundle, { keys: stranger }), /not trusted/]);
    refused.push([
      await deploy(bundle, { tamper: (signed) => (signed.request.releaseId = bundleA.releaseId) }),
      /signature/,
    ]);
    refused.push([await deploy(bundle, { serverId: 'srv-2' }), /srv-2/]);
    refused.push([
      await deploy(bundle, { sha256: 'e'.repeat(64) }),
      /does not match the signed one/,
    ]);
    const old = signRequest(
      makeRequest({
        action: 'activate',
        env: 'test',
        project: 'host-test',
        releaseId: bundle.releaseId,
        serverId: 'srv-1',
        sha256: bundle.sha256,
        issuedAt: new Date(Date.now() - 11 * 60_000).toISOString(),
      }),
      developer,
    );
    cabinet.queue({ deployId: '00000000-0000-4000-8000-000000000001', ...old });
    refused.push([
      { ...(await cabinet.waitFinal('00000000-0000-4000-8000-000000000001')) },
      /too old/,
    ]);
    const once = signRequest(
      makeRequest({
        action: 'activate',
        env: 'test',
        project: 'host-test',
        releaseId: bundleA.releaseId,
        serverId: 'srv-1',
        sha256: bundleA.sha256,
      }),
      developer,
    );
    cabinet.queue({ deployId: '00000000-0000-4000-8000-000000000002', ...once });
    await cabinet.waitFinal('00000000-0000-4000-8000-000000000002');
    cabinet.queue({ deployId: '00000000-0000-4000-8000-000000000003', ...once });
    refused.push([await cabinet.waitFinal('00000000-0000-4000-8000-000000000003'), /replayed/]);
    for (const [status, pattern] of refused) {
      assert.equal(status.phase, 'failed', JSON.stringify(status));
      assert.match(status.error, pattern);
    }
    assert.equal(current(), bundleA.releaseId);
    assert.equal(live('mode/version.txt'), 'v1');
  });

  it('a deploy handed over again is answered again, not applied again', async () => {
    const bundle = release({ resources: modeFiles('v6') });
    const signed = signRequest(
      makeRequest({
        action: 'activate',
        env: 'test',
        project: 'host-test',
        releaseId: bundle.releaseId,
        serverId: 'srv-1',
        sha256: bundle.sha256,
      }),
      developer,
    );
    const deployId = '00000000-0000-4000-8000-000000000010';
    cabinet.queue({ deployId, ...signed });
    assert.equal((await cabinet.waitFinal(deployId)).phase, 'active');
    const before = runs().length;
    const statuses = cabinet.statuses.get(deployId).length;
    cabinet.queue({ deployId, ...signed });
    for (let wait = 0; wait < 50 && cabinet.statuses.get(deployId).length === statuses; wait++)
      await sleep(100);
    assert.equal(cabinet.last(deployId).phase, 'active');
    assert.equal(runs().length, before, 'not applied twice');
  });

  it('previews: ports from the range, "preview" or the server id, crash restarts with a growing pause', async () => {
    const alpha = release({ env: 'preview-alpha', resources: modeFiles('alpha') });
    const beta = release({ env: 'preview-beta', resources: modeFiles('beta') });
    const a = await deploy(alpha, { serverId: 'preview' });
    const b = await deploy(beta, { serverId: 'srv-1' });
    assert.equal(a.phase, 'active', a.error);
    assert.equal(b.phase, 'active', b.error);
    assert.deepEqual([a.port, b.port], [42100, 42102]);
    const alphaToml = fs.readFileSync(
      path.join(root, 'instances', 'host-test-preview-alpha', 'server.toml'),
      'utf8',
    );
    assert.match(alphaToml, /port = 42100\nhttpPort = 42101\nannounce = false\n$/);
    const previewInstance = instance('host-test-preview-alpha');
    const crashed = previewInstance.proc.pid;
    process.kill(crashed);
    for (
      let wait = 0;
      wait < 100 && !(previewInstance.state === 'running' && previewInstance.proc?.pid !== crashed);
      wait++
    )
      await sleep(100);
    assert.equal(previewInstance.state, 'running');
    assert.notEqual(previewInstance.proc.pid, crashed);
    assert.equal(previewInstance.restarts, 1);
    const since = Date.now();
    for (let wait = 0; wait < 50 && !(cabinet.polls.at(-1).at > since); wait++) await sleep(100);
    const poll = cabinet.polls
      .at(-1)
      .body.instances.find((item) => item.name === 'host-test-preview-alpha');
    assert.equal(poll.env, 'preview-alpha');
    assert.equal(poll.port, 42100);
    assert.equal(poll.status, 'running');
  });

  it('`varion host status` reads the running host', async () => {
    let text = '';
    const code = await main(['status', '--root', root, '--json'], {
      out: { write: (chunk) => (text += chunk) },
      err: process.stderr,
    });
    assert.equal(code, 0);
    const report = JSON.parse(text);
    assert.equal(report.host.running, true);
    assert.deepEqual(report.instances.map((item) => item.name).sort(), [
      'host-test-preview-alpha',
      'host-test-preview-beta',
      MAIN,
    ]);
    assert.deepEqual(report.engines, [{ version: '1.0.75', channel: 'rc' }]);
  });

  it('expired previews are stopped and removed; the test instance stays', async () => {
    const pids = ['host-test-preview-alpha', 'host-test-preview-beta'].map(
      (name) => instance(name).proc.pid,
    );
    host.options.previewTtlMs = 1;
    await host.expirePreviews();
    for (const name of ['host-test-preview-alpha', 'host-test-preview-beta']) {
      assert.equal(host.instances.has(name), false);
      assert.equal(fs.existsSync(path.join(root, 'instances', name)), false);
    }
    for (const gone of pids) assert.equal(isAlive(gone), false);
    assert.equal(instance().state, 'running');
    host.options.previewTtlMs = 7 * 86_400_000;
  });

  it('keeps only the last releases on disk', () => {
    const kept = fs
      .readdirSync(path.join(mainDir(), 'releases'))
      .filter((name) => !name.startsWith('.'));
    assert.ok(kept.length <= host.options.keepReleases, kept.join(', '));
    assert.ok(kept.includes(current()));
  });
});
