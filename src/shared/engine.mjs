import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { VarionError } from './errors.mjs';
import { formatBytes } from './format.mjs';
import {
  ensureDir,
  randomTag,
  renameWithRetry,
  sha256,
  sha256File,
  stripBom,
  tryReadJson,
  tryRemoveTree,
  utcStamp,
  walkFiles,
  writeJsonAtomic,
} from './fs.mjs';
import { download as httpDownload, request as httpRequest } from './http.mjs';
import { checkEntryPath, foldPath, openZip } from './zip.mjs';
import { SHA256 } from './deploy-format.mjs';

export const RELEASE_KEY =
  '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAEqMpm43saTokcihq6h7TG5JNE8FI4/30i3TpQiH/nOk=\n-----END PUBLIC KEY-----\n';
export const DEFAULT_CDN = 'https://cdn.varionmp.net';

const MANIFEST = 'server-manifest.json';
const SIGNATURE = 'server-manifest.json.sig';
const MARKER = '.verified';

const PACKAGE_ROOT = 'Varion-Server/';
const VERSION = /^\d{1,4}\.\d{1,4}\.\d{1,6}(?:[-+][0-9A-Za-z.-]{1,32})?$/;
const CHANNEL = /^[a-z0-9][a-z0-9-]{0,31}$/;

class EngineError extends VarionError {}

export function serverExecutableName(platform = process.platform) {
  return platform === 'win32' ? 'varion-server.exe' : 'varion-server';
}

export function enginePackageName(version, platform = process.platform, arch = process.arch) {
  const system = platform === 'win32' ? 'win' : platform;
  return `Varion-Server-${version}-${system}-${arch}.zip`;
}

// one CDN folder per version holds every system's package: the Windows manifest
// keeps the first name, any other carries its system
export function engineManifestName(platform = process.platform, arch = process.arch) {
  return platform === 'win32' ? MANIFEST : `server-manifest-${platform}-${arch}.json`;
}

function verifyManifestSignature(manifestBytes, signatureText, releaseKey = RELEASE_KEY) {
  const signature = Buffer.from(String(signatureText).trim(), 'base64');
  if (signature.length !== 64) return false;
  try {
    const key =
      releaseKey instanceof crypto.KeyObject ? releaseKey : crypto.createPublicKey(releaseKey);
    return crypto.verify(null, Buffer.from(manifestBytes), key, signature);
  } catch {
    return false;
  }
}

// The files a manifest lists, by path: their size and SHA-256.
function manifestFiles(manifest) {
  const bad = (message) => new EngineError(message, { code: 'engine-manifest' });
  if (!Array.isArray(manifest.files) || !manifest.files.length) {
    throw bad(t('the engine manifest lists no files'));
  }
  const files = new Map();
  const folded = new Set();
  for (const file of manifest.files) {
    const relative = String(file?.path || '').replace(/\\/g, '/');
    let checked;
    try {
      checked = checkEntryPath(relative);
    } catch (error) {
      throw bad(t('engine manifest: {reason}', { reason: error.message }));
    }
    if (checked.directory || [MANIFEST, SIGNATURE, MARKER].includes(relative)) {
      throw bad(t('engine manifest: "{path}" is not allowed', { path: relative }));
    }
    if (!Number.isSafeInteger(file.size) || file.size < 0 || !SHA256.test(String(file.sha256))) {
      throw bad(t('engine manifest: "{path}" has no valid size or SHA-256', { path: relative }));
    }
    if (folded.has(foldPath(relative))) {
      throw bad(t('engine manifest: "{path}" is listed twice', { path: relative }));
    }
    folded.add(foldPath(relative));
    files.set(relative, { size: file.size, sha256: file.sha256 });
  }
  return files;
}

function parseManifest(manifestBytes, { version, channel, platform = process.platform } = {}) {
  let manifest;
  try {
    manifest = JSON.parse(stripBom(Buffer.from(manifestBytes).toString('utf8')));
  } catch {
    throw new EngineError(t('the engine manifest is not JSON'), { code: 'engine-manifest' });
  }
  if (manifest.product !== 'varion-server' || (version && manifest.version !== version)) {
    throw new EngineError(
      t('wrong engine package: {product} {found}, expected varion-server {version}', {
        product: manifest.product,
        found: manifest.version,
        version,
      }),
      { code: 'engine-manifest' },
    );
  }
  if (channel && manifest.channel && manifest.channel !== channel) {
    throw new EngineError(
      t('the engine manifest is for the {found} channel, expected {channel}', {
        found: manifest.channel,
        channel,
      }),
      { code: 'engine-manifest' },
    );
  }
  const files = manifestFiles(manifest);
  if (!files.has(serverExecutableName(platform))) {
    throw new EngineError(
      t('the engine package {version} has no {exe} (a package for another system?)', {
        version: manifest.version,
        exe: serverExecutableName(platform),
      }),
      { code: 'engine-manifest' },
    );
  }
  return { manifest, files };
}

export async function verifyEngineDir(
  dir,
  {
    version,
    channel,
    releaseKey = RELEASE_KEY,
    hashes = true,
    extras = true,
    platform = process.platform,
  } = {},
) {
  let manifestBytes;
  let signatureText;
  try {
    manifestBytes = fs.readFileSync(path.join(dir, MANIFEST));
    signatureText = fs.readFileSync(path.join(dir, SIGNATURE), 'utf8');
  } catch {
    throw new EngineError(t('{dir} has no signed engine manifest', { dir }), {
      code: 'engine-manifest',
    });
  }
  if (!verifyManifestSignature(manifestBytes, signatureText, releaseKey)) {
    throw new EngineError(
      t('the engine manifest signature does not match the Varion release key'),
      {
        code: 'engine-signature',
      },
    );
  }
  const { manifest, files } = parseManifest(manifestBytes, { version, channel, platform });
  const manifestSha256 = sha256(manifestBytes);
  const marker = tryReadJson(path.join(dir, MARKER), null);
  const fullCheck = hashes || marker?.manifestSha256 !== manifestSha256;
  if (extras) {
    for (const relative of walkFiles(dir, { strict: true })) {
      if (!files.has(relative) && ![MANIFEST, SIGNATURE, MARKER].includes(relative)) {
        throw new EngineError(
          t('the engine package has an extra file: {path}', { path: relative }),
          {
            code: 'engine-extra-file',
          },
        );
      }
    }
  }
  for (const [relative, file] of files) {
    const full = path.join(dir, ...relative.split('/'));
    let stat;
    try {
      stat = fs.statSync(full);
    } catch {
      throw new EngineError(t('the engine package has no {path}', { path: relative }), {
        code: 'engine-missing-file',
      });
    }
    if (stat.size !== file.size || (fullCheck && (await sha256File(full)).sha256 !== file.sha256)) {
      throw new EngineError(
        t('an engine file does not match the manifest: {path}', { path: relative }),
        {
          code: 'engine-file',
        },
      );
    }
  }
  if (fullCheck) writeMarker(dir, { manifest, manifestSha256, files });
  return { manifest, manifestSha256, files: files.size };
}

function writeMarker(dir, { manifest, manifestSha256, files, source }) {
  try {
    writeJsonAtomic(path.join(dir, MARKER), {
      version: manifest.version,
      channel: manifest.channel ?? null,
      manifestSha256,
      files: files.size,
      verifiedAt: new Date().toISOString(),
      ...(source ? { source } : {}),
    });
  } catch {
    // read-only copy: it gets a full check next time
  }
}

export class EngineStore {
  constructor({
    root,
    cdn = DEFAULT_CDN,
    releaseKey = RELEASE_KEY,
    log,
    onProgress,
    extras = true,
    download = httpDownload,
    request = httpRequest,
    platform = process.platform,
    arch = process.arch,
  }) {
    this.root = root;
    this.platform = platform;
    this.arch = arch;
    this.extras = extras;
    this.cdn = String(cdn).replace(/\/+$/, '');
    this.releaseKey = releaseKey;
    this.log = log;
    this.onProgress = onProgress;
    this.download = download;
    this.request = request;
    this.verified = new Map();
    this.inflight = new Map();
  }

  dir({ version, channel = 'rc' }) {
    if (!VERSION.test(String(version))) {
      throw new EngineError(t('engine version "{version}" is not valid', { version }), {
        code: 'engine-version',
      });
    }
    if (!CHANNEL.test(String(channel))) {
      throw new EngineError(t('engine channel "{channel}" is not valid', { channel }), {
        code: 'engine-version',
      });
    }
    return path.join(this.root, channel, version);
  }

  async ensure({ version, channel = 'rc' }, { recheck = true, hashes = true } = {}) {
    const key = `${channel}/${version}|${recheck}|${hashes}`;
    if (this.inflight.has(key)) return this.inflight.get(key);
    const work = this.ensureNow({ version, channel }, { recheck, hashes }).finally(() =>
      this.inflight.delete(key),
    );
    this.inflight.set(key, work);
    return work;
  }

  async ensureNow({ version, channel }, { recheck, hashes }) {
    const dir = this.dir({ version, channel });
    const exe = path.join(dir, serverExecutableName(this.platform));
    const found = (result) => ({
      dir,
      exe,
      version,
      channel,
      downloaded: false,
      files: result.files,
    });
    if (fs.existsSync(dir)) {
      if (!recheck && this.verified.has(dir)) return found(this.verified.get(dir));
      try {
        const result = await verifyEngineDir(dir, {
          version,
          channel,
          releaseKey: this.releaseKey,
          hashes,
          extras: this.extras,
          platform: this.platform,
        });
        this.verified.set(dir, result);
        return found(result);
      } catch (error) {
        this.verified.delete(dir);
        // The last bad copy is kept for inspection; the ones before it only take up the disk.
        // Windows does not let a folder in use be renamed, so a bad copy there runs nothing;
        // elsewhere a server may still be running from one, and it is left alone.
        if (this.platform === 'win32') {
          for (const name of fs.readdirSync(path.dirname(dir))) {
            if (name.startsWith(`${path.basename(dir)}.bad-`))
              tryRemoveTree(path.join(path.dirname(dir), name));
          }
        }
        const aside = `${dir}.bad-${utcStamp()}`;
        try {
          await renameWithRetry(dir, aside, { attempts: 4 });
        } catch {
          throw new EngineError(
            t(
              'engine {version} in {dir} failed its check ({reason}) and is in use: stop the servers running it',
              {
                version,
                dir,
                reason: error.message,
              },
            ),
            { code: 'engine-cache' },
          );
        }
        this.log?.warn(
          t(
            'engine {version} failed its check ({reason}); moved to {aside}, downloading it again',
            {
              version,
              reason: error.message,
              aside,
            },
          ),
          { version, channel, aside },
          'engine-bad-copy',
        );
      }
    }
    return this.fetch({ version, channel, dir, exe });
  }

  async fetch({ version, channel, dir, exe }) {
    const base = `${this.cdn}/Varion-Server/${channel}/${version}`;
    this.log?.info(
      t('engine {version} ({channel}): downloading from {url}', { version, channel, url: base }),
      { version, channel, url: base },
      'engine-download',
    );
    const { manifestBytes, signatureText } = await this.fetchManifest(base, { version, channel });
    const { manifest, files } = parseManifest(manifestBytes, {
      version,
      channel,
      platform: this.platform,
    });
    ensureDir(path.dirname(dir));
    const staging = `${dir}.staging-${randomTag()}`;
    ensureDir(staging);
    try {
      const archive = path.join(staging, 'package.zip');
      await this.downloadPackage(base, archive, { version, channel, files });
      const unpacked = path.join(staging, 'Varion-Server');
      await extractPackage(archive, unpacked, files, this.platform);
      fs.rmSync(archive, { force: true });
      // use the verified manifest, not the copy from the archive
      fs.writeFileSync(path.join(unpacked, MANIFEST), manifestBytes);
      fs.writeFileSync(path.join(unpacked, SIGNATURE), `${signatureText.trim()}\n`);
      // files were already hashed during extraction
      writeMarker(unpacked, {
        manifest,
        manifestSha256: sha256(manifestBytes),
        files,
        source: base,
      });
      const check = {
        version,
        channel,
        releaseKey: this.releaseKey,
        hashes: false,
        platform: this.platform,
      };
      const result = await verifyEngineDir(unpacked, check);
      try {
        await renameWithRetry(unpacked, dir);
      } catch (error) {
        // another process installed it in the meantime
        const other = await verifyEngineDir(dir, { ...check, extras: false }).catch(() => null);
        if (!other) throw error;
      }
      this.verified.set(dir, result);
      this.log?.info(
        t('engine {version}: the release signature and {count} files are verified', {
          version,
          count: result.files,
        }),
        { version, channel, files: result.files, dir },
        'engine-verified',
      );
      return { dir, exe, version, channel, downloaded: true, files: result.files };
    } finally {
      tryRemoveTree(staging);
    }
  }

  // The manifest of a release and its signature, checked against the release key.
  async fetchManifest(base, { version, channel }) {
    const name = engineManifestName(this.platform, this.arch);
    const get = (url, what, maxBytes) => this.request(url, { maxBytes, what, timeoutMs: 60_000 });
    let manifestBytes;
    try {
      manifestBytes = (await get(`${base}/${name}`, t('engine manifest'), 8 << 20)).body;
    } catch (error) {
      // a release made before this system had packages still has the Windows one
      if (error.status !== 404 || name === MANIFEST) throw error;
      throw new EngineError(
        t('engine {version} ({channel}) has no package for {system}', {
          version,
          channel,
          system: `${this.platform} ${this.arch}`,
        }),
        { code: 'engine-platform' },
      );
    }
    const signature = await get(`${base}/${name}.sig`, t('engine manifest signature'), 4096);
    const signatureText = signature.body.toString('utf8');
    if (!verifyManifestSignature(manifestBytes, signatureText, this.releaseKey)) {
      throw new EngineError(
        t(
          'the signature of the engine {version} manifest does not match the Varion release key: the package is not installed',
          { version },
        ),
        { code: 'engine-signature' },
      );
    }
    return { manifestBytes, signatureText };
  }

  async downloadPackage(base, archive, { version, channel, files }) {
    const total = [...files.values()].reduce((sum, file) => sum + file.size, 0);
    let reported = 0;
    const url = `${base}/${enginePackageName(version, this.platform, this.arch)}`;
    await this.download(url, archive, {
      maxBytes: total + (64 << 20),
      what: t('engine package'),
      stallMs: 120_000,
      onProgress: (received, size) => {
        this.onProgress?.(received, size);
        // log every 25%
        const quarter = size ? Math.floor((received / size) * 4) : 0;
        if (quarter <= reported || quarter >= 4) return;
        reported = quarter;
        this.log?.info(
          t('engine {version}: {received} of {total}', {
            version,
            received: formatBytes(received),
            total: formatBytes(size),
          }),
          { version, channel, received, total: size },
          'engine-progress',
        );
      },
    });
  }
}

// The files of the package by their manifest path. Throws on anything the manifest does not
// list, on a file listed and missing, and on entries that are not plain files.
function packageEntries(zip, files) {
  const refuse = (message, code = 'engine-archive') => new EngineError(message, { code });
  const wanted = new Map();
  for (const entry of zip.entries) {
    if (entry.encrypted || entry.isSymlink || entry.isSpecial) {
      throw refuse(t('engine package: entry {name} is not allowed', { name: entry.name }));
    }
    let checked;
    try {
      // packages are built on Windows, hence the backslashes
      checked = checkEntryPath(entry.name, { windowsSeparators: true });
    } catch (error) {
      throw refuse(t('engine package: {reason}', { reason: error.message }));
    }
    const full = checked.directory ? `${checked.path}/` : checked.path;
    if (!full.startsWith(PACKAGE_ROOT)) {
      throw refuse(
        t('engine package: {name} is outside Varion-Server/', { name: entry.name }),
        'engine-extra-file',
      );
    }
    const relative = full.slice(PACKAGE_ROOT.length);
    if (checked.directory || entry.isDirectory || !relative) continue;
    if (relative === MANIFEST || relative === SIGNATURE) continue;
    if (!files.has(relative)) {
      throw refuse(
        t('the engine package has an extra file: {path}', { path: relative }),
        'engine-extra-file',
      );
    }
    if (wanted.has(relative)) {
      throw refuse(t('engine package: {path} is there twice', { path: relative }));
    }
    wanted.set(relative, entry);
  }
  for (const relative of files.keys()) {
    if (!wanted.has(relative)) {
      throw refuse(
        t('the engine package has no {path}', { path: relative }),
        'engine-missing-file',
      );
    }
  }
  return wanted;
}

function isExecutable(relative, entry, platform) {
  return (
    relative === serverExecutableName(platform) ||
    relative === 'node' ||
    relative === 'runtime/node' ||
    (entry.unixMode & 0o111) !== 0
  );
}

async function extractPackage(archive, target, files, platform) {
  const zip = await openZip(archive, { maxEntries: files.size + 1024 });
  try {
    const wanted = packageEntries(zip, files);
    await zip.checkLayout([...wanted.values()]);
    for (const [relative, entry] of wanted) {
      const file = files.get(relative);
      const out = path.join(target, ...relative.split('/'));
      ensureDir(path.dirname(out));
      const mode = isExecutable(relative, entry, platform) ? 0o755 : 0o644;
      try {
        await zip.extractTo(entry, out, {
          expectedSize: file.size,
          expectedSha256: file.sha256,
          mode: process.platform === 'win32' ? undefined : mode,
        });
      } catch (error) {
        throw new EngineError(
          t('an engine file does not match the manifest: {path} ({reason})', {
            path: relative,
            reason: error.message,
          }),
          { code: 'engine-file' },
        );
      }
    }
  } finally {
    await zip.close();
  }
}
