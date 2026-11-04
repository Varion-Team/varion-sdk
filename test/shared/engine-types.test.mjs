import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { sha256, syncEngineTypes, TYPE_FILES } from '../../tools/sync-engine-types.mjs';

test('published declarations match their recorded engine hashes', () => {
  const types = new URL('../../types/', import.meta.url);
  const manifest = JSON.parse(fs.readFileSync(new URL('engine.json', types), 'utf8'));
  assert.equal(manifest.schemaVersion, 1);
  assert.deepEqual(Object.keys(manifest.files), TYPE_FILES);
  for (const name of TYPE_FILES) {
    assert.equal(sha256(fs.readFileSync(new URL(name, types))), manifest.files[name], name);
  }
});

test('engine type sync detects drift and refuses an incomplete source before writing', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'varion-type-sync-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const engineRoot = path.join(root, 'engine');
  const sdkRoot = path.join(root, 'sdk');
  fs.mkdirSync(path.join(engineRoot, 'sdk', 'types'), { recursive: true });
  fs.writeFileSync(
    path.join(engineRoot, 'version.json'),
    JSON.stringify({
      version: '1.0.76',
      protocol: 25,
      gtaBuild: 3889,
    }),
  );
  for (const name of TYPE_FILES)
    fs.writeFileSync(path.join(engineRoot, 'sdk', 'types', name), 'original');
  syncEngineTypes({ engineRoot, sdkRoot });
  syncEngineTypes({ engineRoot, sdkRoot, check: true });
  fs.writeFileSync(path.join(engineRoot, 'sdk', 'types', TYPE_FILES[0]), 'changed');
  assert.throws(
    () => syncEngineTypes({ engineRoot, sdkRoot, check: true }),
    /differ from the engine/,
  );
  fs.unlinkSync(path.join(engineRoot, 'sdk', 'types', TYPE_FILES[2]));
  assert.throws(() => syncEngineTypes({ engineRoot, sdkRoot }), /ENOENT/);
  assert.equal(fs.readFileSync(path.join(sdkRoot, 'types', TYPE_FILES[0]), 'utf8'), 'original');
});
