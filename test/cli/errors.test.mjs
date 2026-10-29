import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test, { after } from 'node:test';
import { CLI_DIR, cleanupTempDirs, tempDir } from './helpers.mjs';

after(cleanupTempDirs);

test('a DeployError is shown as a message with exit code 1, not as an internal error', () => {
  const keys = tempDir('varion-cli-keys-');
  const result = spawnSync(
    process.execPath,
    [path.join(CLI_DIR, 'bin', 'varion.mjs'), 'keys', 'show'],
    {
      encoding: 'utf8',
      env: { ...process.env, VARION_KEYS_DIR: keys },
    },
  );
  assert.equal(result.status, 1, result.stderr);
  const said = `${result.stdout}${result.stderr}`;
  assert.match(said, /varion keys init/);
  assert.doesNotMatch(said, /internal error/);
  assert.doesNotMatch(said, /\n\s+at /);
});

test('with --json the DeployError is one fatal event carrying its code', () => {
  const keys = tempDir('varion-cli-keys-');
  const result = spawnSync(
    process.execPath,
    [path.join(CLI_DIR, 'bin', 'varion.mjs'), 'keys', 'show', '--json'],
    {
      encoding: 'utf8',
      env: { ...process.env, VARION_KEYS_DIR: keys },
    },
  );
  assert.equal(result.status, 1, result.stderr);
  const events = result.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const fatal = events.find((event) => event.type === 'fatal');
  assert.ok(fatal, result.stdout);
  assert.match(fatal.text, /varion keys init/);
  assert.equal(typeof fatal.code, 'string');
});
