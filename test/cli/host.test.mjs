import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test, { after } from 'node:test';
import { CLI_DIR, cleanupTempDirs, tempDir } from './helpers.mjs';

after(cleanupTempDirs);

const varion = (args) =>
  spawnSync(process.execPath, [path.join(CLI_DIR, 'bin', 'varion.mjs'), ...args], {
    encoding: 'utf8',
  });

test('varion host --help is the help of varion host', () => {
  const result = varion(['host', '--help']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /varion host .*the server side of varion deploy/);
  assert.match(result.stdout, /varion host trust <key>/);
});

test('varion host trust and trust --list work on a host folder', () => {
  const root = tempDir('varion-cli-host-');
  const raw = crypto
    .generateKeyPairSync('ed25519')
    .publicKey.export({ format: 'der', type: 'spki' })
    .subarray(-32);
  const trusted = varion([
    'host',
    'trust',
    raw.toString('base64'),
    '--name',
    'alice',
    '--root',
    root,
  ]);
  assert.equal(trusted.status, 0, trusted.stderr);
  const listed = varion(['host', 'trust', '--list', '--root', root]);
  assert.equal(listed.status, 0, listed.stderr);
  assert.match(listed.stdout, /alice/);
  assert.equal(varion(['host', 'no-such-command']).status, 2);
});
