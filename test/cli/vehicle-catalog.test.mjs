import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test, { after } from 'node:test';
import { deflateRawSync } from 'node:zlib';
import { inspectVehiclePack, writeDevVehicleCatalog } from '../../src/cli/vehicle-catalog.mjs';
import { cleanupTempDirs, sha256, tempDir, writeFiles } from './helpers.mjs';

after(cleanupTempDirs);

function pack(files) {
  const items = Object.entries(files);
  const tables = Buffer.alloc(16 + (items.length + 1) * 16);
  const names = Buffer.from(`\0${items.map(([name]) => name).join('\0')}\0`);
  assert.ok(tables.length + names.length <= 512);
  tables.writeUInt32LE(0x52504637, 0);
  tables.writeUInt32LE(items.length + 1, 4);
  tables.writeUInt32LE(names.length, 8);
  tables.writeUInt32LE(0x4e45504f, 12);
  tables.writeUInt32LE(0x7fffff00, 20);
  tables.writeUInt32LE(1, 24);
  tables.writeUInt32LE(items.length, 28);
  let nameOffset = 1;
  const chunks = items.map(([name, xml], index) => {
    const compressed = deflateRawSync(xml);
    assert.ok(compressed.length <= 512);
    const entry = 32 + index * 16;
    tables.writeUInt16LE(nameOffset, entry);
    tables.writeUIntLE(compressed.length, entry + 2, 3);
    tables.writeUIntLE(index + 1, entry + 5, 3);
    tables.writeUInt32LE(Buffer.byteLength(xml), entry + 8);
    nameOffset += Buffer.byteLength(name) + 1;
    return Buffer.concat([compressed, Buffer.alloc(512 - compressed.length)]);
  });
  return Buffer.concat([
    tables,
    names,
    Buffer.alloc(512 - tables.length - names.length),
    ...chunks,
  ]);
}

test('catalog reads only registered vehicle metadata and keeps aliases for identical packs', () => {
  const root = tempDir();
  const rpf = pack({
    'content.xml':
      '<Item><filename>dlc_original:/custom.meta</filename><fileType>VEHICLE_METADATA_FILE</fileType></Item>',
    'custom.meta':
      '<InitDatas><Item><modelName> RealCar </modelName></Item><!-- <modelName>fake</modelName> --><Item><modelName>OtherCar</modelName></Item></InitDatas>',
    'vehicles.meta': '<InitDatas><modelName>unused</modelName></InitDatas>',
  });
  const hash = sha256(rpf);
  const lock = path.join(root, 'assets.lock.json');
  writeFiles(root, {
    'assets.lock.json': JSON.stringify({
      schemaVersion: 1,
      assets: ['car1', 'original'].map((name) => ({
        name,
        kind: 'dlc',
        sha256: hash,
        size: rpf.length,
      })),
    }),
  });
  const serverDir = path.join(root, 'server');
  const staged = path.join(serverDir, 'resources', 'car1');
  fs.mkdirSync(staged, { recursive: true });
  const archive = path.join(staged, 'dlc.rpf');
  fs.writeFileSync(archive, rpf);
  assert.deepEqual(inspectVehiclePack(archive), ['othercar', 'realcar']);
  const project = { config: { assets: { lock } }, paths: { work: root } };
  writeDevVehicleCatalog(project, serverDir, true);
  const catalog = path.join(serverDir, 'vehicle-catalog.json');
  assert.deepEqual(JSON.parse(fs.readFileSync(catalog, 'utf8')), {
    packs: [{ aliases: ['car1', 'original'], models: ['othercar', 'realcar'] }],
  });
  writeDevVehicleCatalog(project, serverDir, false);
  assert.equal(fs.existsSync(catalog), false);
});

test('archive inspection rejects encrypted or truncated metadata tables', () => {
  const root = tempDir();
  const archive = path.join(root, 'dlc.rpf');
  const rpf = pack({ 'vehicles.meta': '<InitDatas><modelName>car</modelName></InitDatas>' });
  fs.writeFileSync(archive, rpf.subarray(0, 18));
  assert.throws(() => inspectVehiclePack(archive), /outside the archive/);
  rpf.writeUInt32LE(0x0fefffff, 12);
  fs.writeFileSync(archive, rpf);
  assert.throws(() => inspectVehiclePack(archive), /Encrypted RPF/);
});
