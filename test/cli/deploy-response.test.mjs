import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import test, { after } from 'node:test';
import { requestDeploy, uploadRelease } from '../../src/deploy/client.mjs';
import { cleanupTempDirs, tempDir } from './helpers.mjs';

after(cleanupTempDirs);
const token = `varion_dev_${'a'.repeat(64)}`;
const bytes = Buffer.from('bundle fixture');
const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
const release = { releaseId: '20261029-120000-0123abcd', project: 'demo', env: 'test', sha256 };

async function cabinet(t, answer) {
  const server = http.createServer((req, res) => {
    req.on('error', () => {});
    req.on('end', () => res.end(JSON.stringify(answer(req))));
    req.resume();
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
    cabinetUrl: `http://127.0.0.1:${server.address().port}`,
    serverId: 'srv-1',
    token,
    allowInsecureHttp: true,
  };
}

for (const existing of [false, true]) {
  for (const change of [{ releaseId: undefined }, { env: 'invalid' }, { project: '../demo' }]) {
    test(`upload rejects malformed ${existing ? 'existing' : 'new'} release metadata: ${Object.keys(change)[0]}`, async (t) => {
      const invalid = { ...release, ...change };
      const options = await cabinet(t, (req) =>
        req.method === 'GET' ? { releases: existing ? [invalid] : [] } : invalid,
      );
      const bundlePath = path.join(tempDir(), 'bundle.zip');
      fs.writeFileSync(bundlePath, bytes);
      await assert.rejects(
        uploadRelease({ ...options, bundlePath, retries: 0 }),
        (error) => error.code === 'bad_answer',
      );
    });
  }
}

test('a deploy response must contain a string status', async (t) => {
  const options = await cabinet(t, () => ({ deployId: 'deploy-1', status: 42 }));
  const { privateKey } = crypto.generateKeyPairSync('ed25519');
  await assert.rejects(
    requestDeploy({ ...options, ...release, privateKey }),
    (error) => error.code === 'bad_answer',
  );
});

test('an upload progress callback error rejects the operation', { timeout: 2000 }, async (t) => {
  const options = await cabinet(t, (req) => (req.method === 'GET' ? { releases: [] } : release));
  const bundlePath = path.join(tempDir(), 'bundle.zip');
  fs.writeFileSync(bundlePath, bytes);
  const error = new Error('progress callback failed');
  await assert.rejects(
    uploadRelease({
      ...options,
      bundlePath,
      retries: 0,
      onProgress: () => {
        throw error;
      },
    }),
    (actual) => actual === error,
  );
});
