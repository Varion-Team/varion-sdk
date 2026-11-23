import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test, { after } from 'node:test';
import {
  deployRelease,
  deployTarget,
  knownHost,
  rememberHost,
  requestDeploy,
  uploadRelease,
} from '../../src/deploy/client.mjs';
import { newBoxKeys, openFile, sealedSize } from '../../src/shared/box.mjs';
import { cleanupTempDirs, tempDir } from './helpers.mjs';

after(cleanupTempDirs);
const token = `varion_dev_${'a'.repeat(64)}`;
const bytes = Buffer.from('bundle fixture');
const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
const release = { releaseId: '20261029-120000-0123abcd', project: 'demo', env: 'test', sha256 };
const machine = newBoxKeys();

// A cabinet that answers what `answer` says and keeps what it was sent.
async function cabinet(t, answer) {
  const seen = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('error', () => {});
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const entry = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: Buffer.concat(chunks),
      };
      seen.push(entry);
      const reply = answer(entry);
      res.statusCode = reply?.http || 200;
      res.end(JSON.stringify(reply?.http ? reply.body : reply));
    });
    res.setHeader('Content-Type', 'application/json');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  );
  return {
    seen,
    options: {
      cabinetUrl: `http://127.0.0.1:${server.address().port}`,
      serverId: 'srv-1',
      token,
      allowInsecureHttp: true,
    },
  };
}

function bundle() {
  const bundlePath = path.join(tempDir(), 'bundle.zip');
  fs.writeFileSync(bundlePath, bytes);
  return bundlePath;
}

test('where a deploy goes: the host and its key, and a key that is not one counts as none', async (t) => {
  const good = await cabinet(t, () => ({
    online: true,
    hostId: 'host-1',
    boxKey: machine.publicKey,
  }));
  assert.deepEqual(await deployTarget(good.options), {
    online: true,
    hostId: 'host-1',
    boxKey: machine.publicKey,
  });
  assert.equal(good.seen[0].url, '/api/panel/servers/srv-1/deploy-target');
  const bad = await cabinet(t, () => ({ online: 'yes', hostId: 7, boxKey: 'not a key' }));
  assert.deepEqual(await deployTarget(bad.options), { online: false, hostId: '', boxKey: '' });
  const older = await cabinet(t, () => ({ http: 404, body: { error: 'Not found' } }));
  await assert.rejects(deployTarget(older.options), (error) => error.code === 'cabinet_outdated');
});

test('the bundle goes out sealed for the machine, and only that machine opens it', async (t) => {
  const { seen, options } = await cabinet(t, () => ({ releaseId: release.releaseId, relayed: 1 }));
  const bundlePath = bundle();
  const sent = await uploadRelease({
    ...options,
    bundlePath,
    releaseId: release.releaseId,
    boxKey: machine.publicKey,
  });
  assert.deepEqual(sent, {
    releaseId: release.releaseId,
    size: bytes.length,
    sealedSize: sealedSize(bytes.length),
  });
  const [put] = seen;
  assert.deepEqual(
    [put.method, put.url, put.headers['content-type'], put.headers['content-length']],
    [
      'PUT',
      `/api/panel/servers/srv-1/releases/${release.releaseId}/stream`,
      'application/octet-stream',
      String(sealedSize(bytes.length)),
    ],
  );
  assert.equal(put.body.includes(bytes), false, 'the cabinet sees none of the bundle');
  const dir = tempDir();
  fs.writeFileSync(path.join(dir, 'sealed'), put.body);
  const opened = await openFile(
    path.join(dir, 'sealed'),
    path.join(dir, 'opened'),
    machine.privateKey,
  );
  assert.equal(opened.sha256, sha256);
  // nothing sealed is left beside the bundle
  assert.deepEqual(fs.readdirSync(path.dirname(bundlePath)), ['bundle.zip']);
});

test('a bundle is not sent without the id of its release or the key of the machine', async (t) => {
  const { seen, options } = await cabinet(t, () => ({}));
  const bundlePath = bundle();
  await assert.rejects(
    uploadRelease({ ...options, bundlePath, releaseId: 'nope', boxKey: machine.publicKey }),
    (error) => error.code === 'bad_request',
  );
  await assert.rejects(
    uploadRelease({ ...options, bundlePath, releaseId: release.releaseId, boxKey: 'x' }),
    (error) => error.code === 'no_box_key',
  );
  await assert.rejects(
    uploadRelease({
      ...options,
      bundlePath: path.join(tempDir(), 'missing.zip'),
      releaseId: release.releaseId,
      boxKey: machine.publicKey,
    }),
    (error) => error.code === 'no_bundle',
  );
  assert.equal(seen.length, 0);
});

test('a refusal of the cabinet is the error of the upload, and the sealed copy is removed', async (t) => {
  const { options } = await cabinet(t, () => ({
    http: 504,
    body: { error: 'Хост сервера не забрал выпуск.', code: 'host_did_not_take' },
  }));
  const bundlePath = bundle();
  await assert.rejects(
    uploadRelease({
      ...options,
      bundlePath,
      releaseId: release.releaseId,
      boxKey: machine.publicKey,
    }),
    (error) => error.code === 'host_did_not_take' && error.status === 504,
  );
  assert.deepEqual(fs.readdirSync(path.dirname(bundlePath)), ['bundle.zip']);
});

test('a deploy response must contain a string status', async (t) => {
  const { options } = await cabinet(t, () => ({ deployId: 'deploy-1', status: 42 }));
  const { privateKey } = crypto.generateKeyPairSync('ed25519');
  await assert.rejects(
    requestDeploy({ ...options, ...release, privateKey }),
    (error) => error.code === 'bad_answer',
  );
});

test('the request names the size of the sealed bundle that follows it', async (t) => {
  const { seen, options } = await cabinet(t, () => ({ deployId: 'deploy-1', status: 'queued' }));
  const { privateKey } = crypto.generateKeyPairSync('ed25519');
  await requestDeploy({ ...options, ...release, privateKey, relaySize: 4321 });
  await requestDeploy({ ...options, ...release, action: 'rollback', privateKey });
  const [withBundle, without] = seen.map((entry) => JSON.parse(entry.body.toString('utf8')));
  assert.deepEqual(withBundle.relay, { size: 4321 });
  assert.equal('relay' in without, false);
  assert.deepEqual(Object.keys(withBundle.request).sort(), [
    'action',
    'env',
    'issuedAt',
    'nonce',
    'project',
    'releaseId',
    'serverId',
    'sha256',
  ]);
});

test('an upload progress callback error rejects the operation', { timeout: 2000 }, async (t) => {
  const { options } = await cabinet(t, () => ({ releaseId: release.releaseId, relayed: 1 }));
  const error = new Error('progress callback failed');
  await assert.rejects(
    uploadRelease({
      ...options,
      bundlePath: bundle(),
      releaseId: release.releaseId,
      boxKey: machine.publicKey,
      onProgress: () => {
        throw error;
      },
    }),
    (actual) => actual === error,
  );
});

test('the key of a machine is remembered, and another key later stops the deploy until a person says so', async (t) => {
  const configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'varion-known-hosts-'));
  const before = process.env.VARION_CONFIG_DIR;
  process.env.VARION_CONFIG_DIR = configDir;
  t.after(() => {
    if (before === undefined) delete process.env.VARION_CONFIG_DIR;
    else process.env.VARION_CONFIG_DIR = before;
    fs.rmSync(configDir, { recursive: true, force: true });
  });
  const other = newBoxKeys();
  let key = machine.publicKey;
  const { seen, options } = await cabinet(t, (entry) => {
    if (entry.url.endsWith('/deploy-target'))
      return { online: true, hostId: 'host-1', boxKey: key };
    if (entry.url.endsWith('/deploys'))
      return { http: 202, body: { deployId: 'deploy-1', status: 'queued' } };
    return { releaseId: release.releaseId, relayed: 1 };
  });
  const { privateKey } = crypto.generateKeyPairSync('ed25519');
  const deploy = (extra = {}) =>
    deployRelease({
      ...options,
      bundlePath: bundle(),
      releaseId: release.releaseId,
      env: release.env,
      project: release.project,
      privateKey,
      wait: false,
      ...extra,
    });

  assert.equal(knownHost(options.cabinetUrl, 'srv-1'), null);
  const first = await deploy();
  assert.equal(first.deployId, 'deploy-1');
  assert.equal(knownHost(options.cabinetUrl, 'srv-1').boxKey, machine.publicKey);
  // the request goes before the bundle, and names its sealed size
  assert.deepEqual(
    seen.map((entry) => entry.method),
    ['GET', 'POST', 'PUT'],
  );
  assert.deepEqual(JSON.parse(seen[1].body.toString('utf8')).relay, {
    size: sealedSize(bytes.length),
  });

  key = other.publicKey;
  const sentBefore = seen.length;
  await assert.rejects(deploy(), (error) => error.code === 'host_key_changed');
  assert.equal(
    seen.length,
    sentBefore + 1,
    'nothing is sent to a machine that is not the known one',
  );
  assert.equal(knownHost(options.cabinetUrl, 'srv-1').boxKey, machine.publicKey);
  await deploy({ trustNewHost: true });
  assert.equal(knownHost(options.cabinetUrl, 'srv-1').boxKey, other.publicKey);

  // one server's machine says nothing of another's
  rememberHost(options.cabinetUrl, 'srv-2', { boxKey: machine.publicKey, hostId: 'h2' });
  assert.equal(knownHost(options.cabinetUrl, 'srv-1').boxKey, other.publicKey);
  assert.equal(knownHost('http://127.0.0.1:1', 'srv-1'), null);
});
