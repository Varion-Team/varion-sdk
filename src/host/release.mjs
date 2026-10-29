import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { ensureDir, isInside, sha256File, stripBom, walkFiles } from '../shared/fs.mjs';
import { checkUrl } from '../shared/http.mjs';
import { checkEntryPath, foldPath, openZip, ZipError } from '../shared/zip.mjs';
import { HostError } from './errors.mjs';

const MiB = 1024 * 1024;
const GiB = 1024 * MiB;

export const LIMITS = Object.freeze({
  bundleBytes: 512 * MiB, // the cabinet's limit
  files: 100_000, // the server's own limits from here on
  fileBytes: 2 * GiB,
  totalBytes: 8 * GiB,
  releaseJsonBytes: 32 * MiB,
  assets: 512,
  assetBytes: 32 * GiB,
});

export const RESOURCE_NAME = /^[A-Za-z0-9._-]{1,128}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const ENGINE_VERSION = /^\d{1,4}\.\d{1,4}\.\d{1,6}(?:[-+][0-9A-Za-z.-]{1,32})?$/;
const ENGINE_CHANNEL = /^[a-z0-9][a-z0-9-]{0,31}$/;

export const RELEASE_MARKER = '.verified';

const bad = (message, code = 'bad-release') => {
  throw new HostError(`release.json: ${message}`, code);
};

const pathText = (error) => (error instanceof ZipError ? error.message : String(error));

export function validateRelease(manifest, expected = null, limits = LIMITS) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest))
    bad(t('not a JSON object'));
  if (manifest.format !== 1) {
    bad(
      t('format {format} is not supported (this host reads format 1)', {
        format: JSON.stringify(manifest.format),
      }),
      'release-format',
    );
  }
  for (const key of ['project', 'env', 'releaseId']) {
    if (typeof manifest[key] !== 'string' || !manifest[key])
      bad(t('the {key} field is missing', { key }));
    if (expected && manifest[key] !== expected[key]) {
      bad(
        t('{key} is "{value}" but the signed request says "{expected}"', {
          key,
          value: manifest[key],
          expected: expected[key],
        }),
        'release-mismatch',
      );
    }
  }
  const engine = manifest.engine;
  if (!engine || typeof engine !== 'object') bad(t('no engine { version, channel }'));
  if (typeof engine.version !== 'string' || !ENGINE_VERSION.test(engine.version)) {
    bad(
      t('engine.version "{version}" is not an engine version like 1.0.75', {
        version: engine.version,
      }),
    );
  }
  const channel = engine.channel === undefined ? 'rc' : engine.channel;
  if (typeof channel !== 'string' || !ENGINE_CHANNEL.test(channel)) {
    bad(
      t('engine.channel "{channel}" may have only lowercase Latin letters, digits and -', {
        channel,
      }),
    );
  }

  if (!Array.isArray(manifest.files)) bad(t('the files list is missing'));
  if (manifest.files.length > limits.files) {
    bad(
      t('{count} files, more than {limit}', { count: manifest.files.length, limit: limits.files }),
    );
  }
  const files = new Map();
  const folded = new Set();
  const folders = new Set();
  let total = 0;
  for (const file of manifest.files) {
    if (!file || typeof file !== 'object') bad(t('an entry of files is not an object'));
    let checked;
    try {
      checked = checkEntryPath(file.path);
    } catch (error) {
      bad(`files: ${pathText(error)}`, 'bad-path');
    }
    if (checked.directory) bad(`files: ${file.path}: ${t('a folder, not a file')}`, 'bad-path');
    const relative = checked.path;
    if (relative === 'release.json') bad(t('files must not list release.json itself'));
    const parts = relative.split('/');
    if (relative !== 'server.toml' && !(parts[0] === 'resources' && parts.length >= 3)) {
      bad(
        `files: ${relative}: ${t('a release holds only server.toml and resources/<resource>/...')}`,
        'bad-path',
      );
    }
    if (parts[0] === 'resources' && !RESOURCE_NAME.test(parts[1])) {
      bad(
        `files: ${t('resource name "{name}" may have only Latin letters, digits, . _ -', {
          name: parts[1],
        })}`,
        'bad-path',
      );
    }
    if (!Number.isSafeInteger(file.size) || file.size < 0 || file.size > limits.fileBytes)
      bad(`files: ${relative}: ${t('bad size {size}', { size: file.size })}`);
    if (typeof file.sha256 !== 'string' || !SHA256.test(file.sha256))
      bad(`files: ${relative}: ${t('sha256 must be 64 lowercase hex digits')}`);
    const key = foldPath(relative);
    if (folded.has(key)) {
      bad(`files: ${relative}: ${t('listed twice (case-insensitively)')}`, 'bad-path');
    }
    folded.add(key);
    for (let index = 1; index < parts.length; index++)
      folders.add(foldPath(parts.slice(0, index).join('/')));
    total += file.size;
    files.set(relative, { size: file.size, sha256: file.sha256 });
  }
  if (!files.has('server.toml')) bad(t('the release has no server.toml'));
  for (const key of folded) {
    if (folders.has(key)) bad(`files: ${key}: ${t('both a file and a folder')}`, 'bad-path');
  }
  if (total > limits.totalBytes) {
    bad(
      t('the release files take {size} bytes, more than {limit}', {
        size: total,
        limit: limits.totalBytes,
      }),
    );
  }

  const assets = [];
  const assetList = manifest.assets === undefined ? [] : manifest.assets;
  if (!Array.isArray(assetList)) bad(t('assets is not a list'));
  if (assetList.length > limits.assets) {
    bad(t('{count} assets, more than {limit}', { count: assetList.length, limit: limits.assets }));
  }
  for (const asset of assetList) {
    if (!asset || typeof asset !== 'object') bad(t('an entry of assets is not an object'));
    if (typeof asset.name !== 'string' || !RESOURCE_NAME.test(asset.name)) {
      bad(
        `assets: ${t('name "{name}" is not a resource name (Latin letters, digits, . _ -)', {
          name: asset.name,
        })}`,
      );
    }
    if (typeof asset.sha256 !== 'string' || !SHA256.test(asset.sha256))
      bad(`assets: ${asset.name}: ${t('sha256 must be 64 lowercase hex digits')}`);
    if (!Number.isSafeInteger(asset.size) || asset.size < 0 || asset.size > limits.assetBytes)
      bad(`assets: ${asset.name}: ${t('bad size {size}', { size: asset.size })}`);
    try {
      checkUrl(asset.url, `assets: ${asset.name}: url`);
    } catch (error) {
      bad(error.message);
    }
    // a DLC pack's usual place unless the CLI names one
    const placement = asset.file === undefined ? `resources/${asset.name}/dlc.rpf` : asset.file;
    let checked;
    try {
      checked = checkEntryPath(placement);
    } catch (error) {
      bad(`assets: ${asset.name}: ${pathText(error)}`, 'bad-path');
    }
    if (checked.directory || !checked.path.startsWith(`resources/${asset.name}/`)) {
      bad(
        `assets: ${asset.name}: ${t('an asset goes under resources/{name}/, not at "{path}"', {
          name: asset.name,
          path: placement,
        })}`,
        'bad-path',
      );
    }
    const key = foldPath(checked.path);
    if (folded.has(key) || folders.has(key)) {
      bad(
        `assets: ${asset.name}: ${t('"{path}" is already taken by a file of the release', {
          path: checked.path,
        })}`,
        'bad-path',
      );
    }
    const parts = checked.path.split('/');
    for (let index = 1; index < parts.length; index++) {
      if (folded.has(foldPath(parts.slice(0, index).join('/'))))
        bad(`assets: ${asset.name}: ${t('the path goes through a file')}`, 'bad-path');
    }
    folded.add(key);
    for (let index = 1; index < parts.length; index++)
      folders.add(foldPath(parts.slice(0, index).join('/')));
    assets.push({
      name: asset.name,
      sha256: asset.sha256,
      size: asset.size,
      url: String(asset.url),
      file: checked.path,
    });
  }

  const resources = new Map();
  const place = (relative, digest) => {
    const parts = relative.split('/');
    if (parts[0] !== 'resources') return;
    if (!resources.has(parts[1])) resources.set(parts[1], new Map());
    resources.get(parts[1]).set(parts.slice(2).join('/'), digest);
  };
  for (const [relative, file] of files) place(relative, file.sha256);
  for (const asset of assets) place(asset.file, asset.sha256);

  return {
    project: manifest.project,
    env: manifest.env,
    releaseId: manifest.releaseId,
    createdAt: typeof manifest.createdAt === 'string' ? manifest.createdAt : '',
    engine: { version: engine.version, channel },
    files,
    assets,
    resources,
  };
}

export async function unpackBundle(zipFile, dir, expected, limits = LIMITS) {
  const zip = await openZip(zipFile, { maxEntries: limits.files + 1024 });
  try {
    const byPath = new Map();
    const folded = new Set();
    for (const entry of zip.entries) {
      const { name } = entry;
      if (entry.encrypted) {
        throw new HostError(t('the archive has an encrypted file: {name}', { name }), 'bad-bundle');
      }
      if (entry.isSymlink || entry.isSpecial) {
        throw new HostError(
          t('the archive has a link or a special file: {name}', { name }),
          'bad-bundle',
        );
      }
      let checked;
      try {
        checked = checkEntryPath(name);
      } catch (error) {
        throw new HostError(
          t('the archive has a path that is not allowed: {reason}', { reason: error.message }),
          'bad-path',
        );
      }
      if (checked.directory) {
        if (entry.size !== 0) {
          throw new HostError(
            t('the archive has a folder with data: {name}', { name }),
            'bad-bundle',
          );
        }
        continue;
      }
      if (entry.isDirectory) {
        throw new HostError(
          t('the archive has a folder without a slash at the end of its name: {name}', { name }),
          'bad-bundle',
        );
      }
      const key = foldPath(checked.path);
      if (folded.has(key)) {
        throw new HostError(
          t('the archive has a file twice (case-insensitively): {path}', { path: checked.path }),
          'bad-bundle',
        );
      }
      folded.add(key);
      byPath.set(checked.path, entry);
    }
    const releaseEntry = byPath.get('release.json');
    if (!releaseEntry) {
      throw new HostError(t('the archive has no release.json at its root'), 'bad-bundle');
    }
    const releaseBytes = await zip.readBuffer(releaseEntry, limits.releaseJsonBytes);
    let manifest;
    try {
      manifest = JSON.parse(stripBom(releaseBytes.toString('utf8')));
    } catch (error) {
      bad(t('not JSON ({reason})', { reason: error.message }));
    }
    const release = validateRelease(manifest, expected, limits);
    for (const relative of byPath.keys()) {
      if (relative !== 'release.json' && !release.files.has(relative)) {
        throw new HostError(
          t('the archive has a file release.json does not list: {path}', { path: relative }),
          'extra-file',
        );
      }
    }
    for (const [relative, file] of release.files) {
      const entry = byPath.get(relative);
      if (!entry) {
        throw new HostError(
          t('the archive lacks a file release.json lists: {path}', { path: relative }),
          'missing-file',
        );
      }
      if (entry.size !== file.size) {
        throw new HostError(
          t('the size differs from release.json: {path}', { path: relative }),
          'file-mismatch',
        );
      }
    }
    await zip.checkLayout([...byPath.values()]);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'release.json'), releaseBytes, { flag: 'wx' });
    for (const [relative, file] of release.files) {
      const target = path.join(dir, ...relative.split('/'));
      if (path.resolve(target) === path.resolve(dir) || !isInside(dir, target)) {
        throw new HostError(
          t('the path leaves the release folder: {path}', { path: relative }),
          'bad-path',
        );
      }
      ensureDir(path.dirname(target));
      try {
        await zip.extractTo(byPath.get(relative), target, {
          expectedSize: file.size,
          expectedSha256: file.sha256,
        });
      } catch (error) {
        throw new HostError(
          t('a file does not match release.json: {reason}', { reason: error.message }),
          'file-mismatch',
        );
      }
    }
    return release;
  } finally {
    await zip.close();
  }
}

export function readReleaseDir(dir, expected = null) {
  let manifest;
  try {
    manifest = JSON.parse(stripBom(fs.readFileSync(path.join(dir, 'release.json'), 'utf8')));
  } catch (error) {
    throw new HostError(
      t('{dir}: release.json is missing or broken ({reason})', { dir, reason: error.message }),
      'bad-release-dir',
    );
  }
  return validateRelease(manifest, expected);
}

export async function verifyReleaseDir(dir, release) {
  const expected = new Map();
  for (const [relative, file] of release.files) expected.set(relative, file);
  for (const asset of release.assets)
    expected.set(asset.file, { size: asset.size, sha256: asset.sha256 });
  const allowedRoot = new Set(['release.json', RELEASE_MARKER]);
  for (const relative of walkFiles(dir, { strict: true })) {
    if (!expected.has(relative) && !allowedRoot.has(relative)) {
      throw new HostError(
        t('the release folder has an extra file: {path}', { path: relative }),
        'release-dir-extra',
      );
    }
  }
  for (const [relative, file] of expected) {
    const full = path.join(dir, ...relative.split('/'));
    let stat;
    try {
      stat = fs.statSync(full);
    } catch {
      throw new HostError(
        t('the release folder lacks a file: {path}', { path: relative }),
        'release-dir-missing',
      );
    }
    if (stat.size !== file.size || (await sha256File(full)).sha256 !== file.sha256) {
      throw new HostError(
        t('a release file was changed on disk: {path}', { path: relative }),
        'release-dir-changed',
      );
    }
  }
}

const sameTable = (a, b) =>
  a.size === b.size && [...a].every(([key, value]) => b.get(key) === value);

export function planChange(previous, next, previousToml, nextToml) {
  if (!previous) {
    return {
      full: true,
      reasons: [t('the first release of the instance')],
      changed: [],
      added: [...next.resources.keys()],
      removed: [],
    };
  }
  const reasons = [];
  if (previousToml !== nextToml) reasons.push(t('server.toml changed'));
  if (
    previous.engine.version !== next.engine.version ||
    previous.engine.channel !== next.engine.channel
  ) {
    reasons.push(
      t('engine {from} → {to}', { from: previous.engine.version, to: next.engine.version }),
    );
  }
  const added = [...next.resources.keys()].filter((name) => !previous.resources.has(name));
  const removed = [...previous.resources.keys()].filter((name) => !next.resources.has(name));
  if (added.length)
    reasons.push(t('resources added: {resources}', { resources: added.join(', ') }));
  if (removed.length) {
    reasons.push(t('resources removed: {resources}', { resources: removed.join(', ') }));
  }
  const changed = [...next.resources.keys()].filter(
    (name) =>
      previous.resources.has(name) &&
      !sameTable(previous.resources.get(name), next.resources.get(name)),
  );
  // the server reads resource.toml only at start: a console restart would keep the old one
  const manifests = changed.filter(
    (name) =>
      previous.resources.get(name).get('resource.toml') !==
      next.resources.get(name).get('resource.toml'),
  );
  if (manifests.length) {
    reasons.push(t('resource.toml changed: {resources}', { resources: manifests.join(', ') }));
  }
  return { full: reasons.length > 0, reasons, changed, added, removed };
}
