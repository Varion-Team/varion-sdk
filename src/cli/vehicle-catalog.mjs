import fs from 'node:fs';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { tryReadJson, writeJsonAtomic } from '../shared/fs.mjs';
import { readAssetsLock } from './assets.mjs';

const RPF7 = 0x52504637;
const OPEN = 0x4e45504f;
const DIRECTORY = 0x7fffff00;
const MAX_TABLE_BYTES = 8 * 1024 * 1024;
const MAX_XML_BYTES = 2 * 1024 * 1024;
const CACHE_VERSION = 1;

function readAt(fd, length, offset, end) {
  if (offset < 0 || length > end - offset) throw new Error('RPF entry outside the archive');
  const bytes = Buffer.alloc(length);
  if (fs.readSync(fd, bytes, 0, length, offset) !== length) throw new Error('Incomplete RPF');
  return bytes;
}

function indexArchive(fd, start, end) {
  const header = readAt(fd, 16, start, end);
  if (header.readUInt32LE(0) !== RPF7) throw new Error('RPF7 header expected');
  const encryption = header.readUInt32LE(12);
  if (encryption !== 0 && encryption !== OPEN) throw new Error('Encrypted RPF tables');
  const count = header.readUInt32LE(4);
  const nameField = header.readUInt32LE(8);
  const namesLength = nameField & 0x0fffffff;
  const nameShift = (nameField >>> 28) & 7;
  const entriesLength = count * 16;
  if (!count || entriesLength + namesLength > MAX_TABLE_BYTES)
    throw new Error('Invalid RPF tables');
  const tables = readAt(fd, entriesLength + namesLength, start + 16, end);
  const names = tables.subarray(entriesLength);
  const files = new Map();
  const folders = [{ entry: 0, folder: '' }];
  const seen = new Set([0]);
  for (const { entry, folder } of folders) {
    const at = entry * 16;
    if (tables.readUInt32LE(at + 4) !== DIRECTORY) throw new Error('Invalid RPF directory');
    const first = tables.readUInt32LE(at + 8);
    const total = tables.readUInt32LE(at + 12);
    if (first + total > count) throw new Error('Invalid RPF directory range');
    for (let child = first; child < first + total; child++) {
      if (seen.has(child)) throw new Error('Repeated RPF entry');
      seen.add(child);
      const pos = child * 16;
      const kind = tables.readUInt32LE(pos + 4);
      const directory = kind === DIRECTORY;
      if (!directory && kind >>> 31) continue;
      const nameOffset = directory
        ? tables.readUInt32LE(pos)
        : tables.readUInt16LE(pos) << nameShift;
      const nameBytes = names.subarray(nameOffset, nameOffset + 256);
      const nameEnd = nameBytes.indexOf(0);
      if (nameEnd <= 0) throw new Error('Invalid RPF name');
      const name = nameBytes.toString('latin1', 0, nameEnd).toLowerCase();
      const key = `${folder}${name}`;
      if (key.length > 1024 || /[\\/:]/.test(name) || name === '.' || name === '..')
        throw new Error('Invalid RPF path');
      if (directory) {
        folders.push({ entry: child, folder: `${key}/` });
      } else {
        if (files.has(key)) throw new Error('Duplicate RPF file path');
        files.set(key, {
          offset: start + tables.readUIntLE(pos + 5, 3) * 512,
          packed: tables.readUIntLE(pos + 2, 3),
          size: tables.readUInt32LE(pos + 8),
          encrypted: tables.readUInt32LE(pos + 12) !== 0,
          end,
        });
      }
    }
  }
  return files;
}

function readXml(fd, entry) {
  if (entry.encrypted || entry.size > MAX_XML_BYTES || entry.packed > MAX_XML_BYTES)
    throw new Error('Encrypted or oversized DLC metadata');
  const bytes = readAt(fd, entry.packed || entry.size, entry.offset, entry.end);
  const xml = entry.packed ? inflateRawSync(bytes, { maxOutputLength: MAX_XML_BYTES }) : bytes;
  if (xml.length !== entry.size) throw new Error('Invalid DLC metadata size');
  return xml.toString('utf8').replace(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>/g, '');
}

function findMetadata(fd, files, name, depth = 0) {
  if (files.has(name)) return files.get(name);
  const split = name.indexOf('.rpf/');
  if (split < 0 || depth >= 4) return undefined;
  const nested = files.get(name.slice(0, split + 4));
  if (!nested || nested.encrypted || nested.packed || nested.size > nested.end - nested.offset)
    return undefined;
  const nestedFiles = indexArchive(fd, nested.offset, nested.offset + nested.size);
  return findMetadata(fd, nestedFiles, name.slice(split + 5), depth + 1);
}

export function inspectVehiclePack(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const files = indexArchive(fd, 0, fs.fstatSync(fd).size);
    const content = files.get('content.xml');
    const registered = content
      ? [
          ...readXml(fd, content).matchAll(
            /<Item>\s*<filename>[^<]*?:\/([^<]+)<\/filename>\s*<fileType>\s*VEHICLE_METADATA_FILE\s*<\/fileType>/gi,
          ),
        ].map((match) => match[1].trim().replaceAll('\\', '/').toLowerCase())
      : [];
    const paths = new Set(
      registered.length
        ? registered
        : [...files.keys()].filter((name) => path.posix.basename(name) === 'vehicles.meta'),
    );
    if (paths.size > 64) throw new Error('Too many vehicle metadata files');
    const models = new Set();
    for (const name of paths) {
      const entry = findMetadata(fd, files, name);
      if (!entry) throw new Error('Registered vehicle metadata not found');
      const xml = readXml(fd, entry);
      const init = /<InitDatas\b[^>]*>([\s\S]*?)<\/InitDatas\s*>/i.exec(xml);
      if (!init) continue;
      for (const [, model] of init[1].matchAll(
        /<modelName>\s*([a-z0-9_-]{1,63})\s*<\/modelName>/gi,
      ))
        models.add(model.toLowerCase());
    }
    return [...models].sort();
  } finally {
    fs.closeSync(fd);
  }
}

export function writeDevVehicleCatalog(project, serverDir, enabled) {
  const catalogFile = path.join(serverDir, 'vehicle-catalog.json');
  if (!enabled) {
    fs.rmSync(catalogFile, { force: true });
    return;
  }
  const { assets } = readAssetsLock(project.config.assets.lock);
  const cacheFile = path.join(project.paths.work, 'vehicle-catalog-cache.json');
  const previous = tryReadJson(cacheFile, null);
  const previousPacks = previous?.version === CACHE_VERSION ? previous.packs : {};
  const cache = {};
  const packs = new Map();
  for (const asset of assets) {
    if (asset.kind !== 'dlc') continue;
    const known = packs.get(asset.sha256);
    if (known) {
      known.aliases.push(asset.name);
      continue;
    }
    let inspection = previousPacks?.[asset.sha256];
    if (!Array.isArray(inspection?.models)) {
      try {
        const file = path.join(serverDir, 'resources', asset.name, 'dlc.rpf');
        inspection = { models: inspectVehiclePack(file) };
      } catch (error) {
        inspection = { models: [], issue: error instanceof Error ? error.message : String(error) };
      }
    }
    if (!inspection.issue) cache[asset.sha256] = inspection;
    packs.set(asset.sha256, { aliases: [asset.name], ...inspection });
  }
  writeJsonAtomic(cacheFile, { version: CACHE_VERSION, packs: cache });
  writeJsonAtomic(catalogFile, { packs: [...packs.values()] });
}
