import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { formatBytes } from '../shared/format.mjs';
import {
  ensureDir,
  linkOrCopy,
  readJson,
  removeTree,
  renameWithRetry,
  sha256File,
  tryReadJson,
  writeJsonAtomic,
} from '../shared/fs.mjs';
import { download } from '../shared/http.mjs';
import { extractZip } from '../shared/zip.mjs';
import { CliError, downloadProgress } from './output.mjs';
import { assetCacheDir } from './paths.mjs';

const NAME = /^[a-z0-9][a-z0-9_.-]{0,63}$/;
const KINDS = ['dlc', 'resource'];
const PLACED = '.varion-asset.json';

export function assetsActive(project) {
  return project.config.assets.declared || fs.existsSync(project.config.assets.lock);
}

export function readAssetsLock(file) {
  if (!fs.existsSync(file)) return { schemaVersion: 1, assets: [] };
  const lockName = path.basename(file);
  const lock = readJson(file);
  if (lock?.schemaVersion !== 1 || !Array.isArray(lock.assets)) {
    throw new CliError(
      t('{file}: expected { "schemaVersion": 1, "assets": [...] }', { file: lockName }),
    );
  }
  const names = new Set();
  for (const asset of lock.assets) {
    const where = `${lockName}: ${asset?.name || t('(no name)')}`;
    const fail = (message) => {
      throw new CliError(`${where}: ${message}`);
    };
    if (!NAME.test(String(asset?.name))) fail(t('the name must be lowercase a-z, digits, _ . -'));
    if (names.has(asset.name)) fail(t('the name is used twice'));
    names.add(asset.name);
    if (!KINDS.includes(asset.kind)) fail(t('kind must be "dlc" or "resource"'));
    if (!/^[0-9a-f]{64}$/.test(String(asset.sha256))) fail(t('sha256 must be 64 hex digits'));
    if (!Number.isSafeInteger(asset.size) || asset.size < 0) {
      fail(t('size must be the size in bytes'));
    }
    if (
      asset.url !== undefined &&
      asset.url !== null &&
      !/^https:\/\//.test(asset.url) &&
      !/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(asset.url)
    ) {
      fail(t('url must be an https:// address'));
    }
    if (
      asset.kind === 'dlc' &&
      asset.mount !== undefined &&
      !/^[a-z0-9_]{1,90}$/.test(asset.mount)
    ) {
      fail(t('mount must be lowercase a-z, digits and _'));
    }
  }
  return lock;
}

export function writeAssetsLock(file, lock) {
  writeJsonAtomic(file, { schemaVersion: 1, assets: lock.assets });
}

function localSource(project, asset) {
  const root = project.config.assets.source;
  if (!root) return null;
  const candidates = asset.source
    ? [asset.source]
    : asset.kind === 'dlc'
      ? [`${asset.name}.rpf`, `${asset.name}/dlc.rpf`]
      : [`${asset.name}.zip`];
  for (const candidate of candidates) {
    const full = path.resolve(root, candidate);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  }
  return null;
}

async function hashCached(project, file) {
  const cacheFile = path.join(project.paths.work, 'assets-hashes.json');
  const cache = tryReadJson(cacheFile, {});
  const stat = fs.statSync(file);
  const known = cache[file];
  if (known && known.size === stat.size && known.mtimeMs === stat.mtimeMs) return known.sha256;
  const { sha256 } = await sha256File(file);
  cache[file] = { size: stat.size, mtimeMs: stat.mtimeMs, sha256 };
  writeJsonAtomic(cacheFile, cache);
  return sha256;
}

export async function obtainAsset(
  project,
  asset,
  output,
  { env = process.env, offline = false } = {},
) {
  const local = localSource(project, asset);
  if (local) {
    const hash = await hashCached(project, local);
    if (hash !== asset.sha256 || fs.statSync(local).size !== asset.size) {
      output.warn(
        t(
          '{name}: {file} does not match {lock}, using it as it is (update the lock: varion assets lock)',
          {
            name: asset.name,
            file: local,
            lock: path.basename(project.config.assets.lock),
          },
        ),
      );
    }
    return { file: local, from: 'source' };
  }
  const cacheDir = assetCacheDir(env);
  const cached = path.join(cacheDir, asset.sha256);
  if (fs.existsSync(cached) && fs.statSync(cached).size === asset.size)
    return { file: cached, from: 'cache' };
  if (offline) {
    throw new CliError(t('{name}: not in the cache {dir}', { name: asset.name, dir: cacheDir }));
  }
  if (!asset.url) {
    throw new CliError(
      t('{name}: not in the cache or in [assets] source, and the lock has no url for it', {
        name: asset.name,
      }),
    );
  }
  const partial = `${cached}.download-${process.pid}`;
  output.info(
    t('{name}: downloading {size} from {url}', {
      name: asset.name,
      size: formatBytes(asset.size),
      url: asset.url,
    }),
  );
  ensureDir(cacheDir);
  fs.rmSync(partial, { force: true });
  try {
    const { sha256 } = await download(asset.url, partial, {
      what: asset.name,
      expectedSize: asset.size,
      onProgress: downloadProgress(output, asset.url, asset.name),
    });
    if (sha256 !== asset.sha256) {
      throw new CliError(
        t('{name}: the SHA-256 of the download ({sha256}) does not match the lock, file refused', {
          name: asset.name,
          sha256,
        }),
      );
    }
    await renameWithRetry(partial, cached);
  } catch (error) {
    fs.rmSync(partial, { force: true });
    throw error;
  }
  const text = t('{name}: downloaded and checked (SHA-256)', { name: asset.name });
  output.event(
    'asset',
    { name: asset.name, sha256: asset.sha256, downloaded: true },
    `[${output.prefix}] ${text}`,
  );
  return { file: cached, from: 'download' };
}

export async function placeAsset(serverDir, asset, file) {
  const dir = path.join(serverDir, 'resources', asset.name);
  const marker = path.join(dir, PLACED);
  const placed = tryReadJson(marker, null);
  if (placed && placed.sha256 === asset.sha256 && placed.kind === asset.kind) {
    const main = asset.kind === 'dlc' ? path.join(dir, 'dlc.rpf') : null;
    if (!main || (fs.existsSync(main) && fs.statSync(main).size === asset.size)) return 'kept';
  }
  removeTree(dir);
  ensureDir(dir);
  let how = 'unpacked';
  if (asset.kind === 'dlc') {
    how = linkOrCopy(file, path.join(dir, 'dlc.rpf'), { replace: true });
    const mount = asset.mount || asset.name.replace(/[^a-z0-9_]/g, '_');
    const comment = t('Pack {name} ({sha256}) from assets.lock.json, placed by varion.', {
      name: asset.name,
      sha256: asset.sha256.slice(0, 12),
    });
    fs.writeFileSync(path.join(dir, '__stream.cfg'), '{"files":["dlc.rpf"]}', 'utf8');
    fs.writeFileSync(
      path.join(dir, 'resource.toml'),
      `# ${comment}\ntype = "rpf"\nmain = "__stream.cfg"\ndlc-mount = "${mount}"\ndeps = []\n`,
      'utf8',
    );
  } else {
    await extractZip(file, dir, { windowsSeparators: true });
    if (!fs.existsSync(path.join(dir, 'resource.toml'))) {
      throw new CliError(
        t(
          '{name}: the archive has no resource.toml (kind "resource" is a ZIP of a ready resource folder)',
          {
            name: asset.name,
          },
        ),
      );
    }
  }
  writeJsonAtomic(marker, { name: asset.name, kind: asset.kind, sha256: asset.sha256 });
  return how;
}

export async function ensureAssets(
  project,
  output,
  { serverDir, env = process.env, offline = false } = {},
) {
  if (!assetsActive(project)) return [];
  const lock = readAssetsLock(project.config.assets.lock);
  const names = [];
  for (const asset of lock.assets) {
    const { file, from } = await obtainAsset(project, asset, output, { env, offline });
    const how = await placeAsset(serverDir, asset, file);
    if (how !== 'kept') {
      const notes = [from === 'source' ? t('from [assets] source') : t('from the cache')];
      if (how === 'link') notes.push(t('hard link'));
      const text = t('{name}: placed in resources/ ({how})', {
        name: asset.name,
        how: notes.join(', '),
      });
      output.event('asset', { name: asset.name, from, placed: how }, `[${output.prefix}] ${text}`);
    }
    names.push(asset.name);
  }
  return names;
}

export async function lockAssets(project, output) {
  const { source, url, lock: lockFile } = project.config.assets;
  if (!source) {
    throw new CliError(
      t('nothing to lock: [assets] source (the folder with your packs) is not set'),
    );
  }
  if (!fs.existsSync(source)) {
    throw new CliError(t('[assets] source: no folder {dir}', { dir: source }));
  }
  const lock = readAssetsLock(lockFile);
  const known = new Map(lock.assets.map((asset) => [asset.name, asset]));
  const found = [];
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.isFile() && /\.rpf$/i.test(entry.name))
      found.push({ kind: 'dlc', file: entry.name, name: entry.name.replace(/\.rpf$/i, '') });
    else if (entry.isFile() && /\.zip$/i.test(entry.name))
      found.push({ kind: 'resource', file: entry.name, name: entry.name.replace(/\.zip$/i, '') });
    else if (entry.isDirectory() && fs.existsSync(path.join(source, entry.name, 'dlc.rpf')))
      found.push({ kind: 'dlc', file: `${entry.name}/dlc.rpf`, name: entry.name });
  }
  let changed = 0;
  for (const item of found) {
    const name = item.name.toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
    const asset = known.get(name) || { name, kind: item.kind };
    const { sha256, size } = await sha256File(path.join(source, item.file));
    if (asset.sha256 === sha256 && asset.size === size) continue;
    Object.assign(asset, { sha256, size, source: item.file });
    if (url)
      asset.url = url
        .replace(/\{sha256\}/g, sha256)
        .replace(/\{name\}/g, name)
        .replace(/\{file\}/g, path.basename(item.file));
    if (!known.has(name)) {
      known.set(name, asset);
      lock.assets.push(asset);
    }
    changed++;
    output.event(
      'asset',
      { name, sha256, size, locked: true },
      `[${output.prefix}] ${name}: ${sha256.slice(0, 12)}…, ${formatBytes(size)}`,
    );
  }
  writeAssetsLock(lockFile, lock);
  output.success(
    t('{file}: {count} assets, {changed} changed', {
      file: path.basename(lockFile),
      count: lock.assets.length,
      changed,
    }),
  );
  return lock;
}
