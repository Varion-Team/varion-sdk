import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { VarionError } from './errors.mjs';

// windows reports these for a moment while antivirus or another handle holds the file
const TRANSIENT = new Set(['EBUSY', 'EPERM', 'EACCES', 'ENOTEMPTY', 'EMFILE', 'ENFILE']);

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

export async function sha256File(file) {
  const hash = crypto.createHash('sha256');
  let size = 0;
  for await (const chunk of fs.createReadStream(file, { highWaterMark: 1 << 20 })) {
    hash.update(chunk);
    size += chunk.length;
  }
  return { sha256: hash.digest('hex'), size };
}

export function randomTag() {
  return crypto.randomBytes(4).toString('hex');
}

export function utcStamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
}

export function toPosix(relative) {
  return relative.split(path.sep).join('/');
}

export function ensureDir(dir, mode) {
  fs.mkdirSync(dir, { recursive: true, ...(mode ? { mode } : {}) });
  return dir;
}

export function isInside(parent, child) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export function walkFiles(dir, { skip, strict = false } = {}) {
  const files = [];
  const visit = (absolute, relative) => {
    let entries;
    try {
      entries = fs.readdirSync(absolute, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT' && !relative) return;
      throw error;
    }
    for (const entry of entries) {
      const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
      const isDirectory = entry.isDirectory();
      if (skip?.(childRelative, isDirectory)) continue;
      if (isDirectory) visit(path.join(absolute, entry.name), childRelative);
      else if (entry.isFile() || (!strict && entry.isSymbolicLink())) files.push(childRelative);
      else if (strict) {
        throw new VarionError(
          t('{path}: not a file or a folder (a link?)', { path: childRelative }),
          {
            code: 'not-a-file',
          },
        );
      }
    }
  };
  visit(dir, '');
  return files.sort();
}

export function writeFileAtomic(file, data, { mode } = {}) {
  ensureDir(path.dirname(file));
  const temp = `${file}.${process.pid}.${randomTag()}.tmp`;
  fs.writeFileSync(temp, data, mode ? { mode } : undefined);
  for (let attempt = 1; ; attempt++) {
    try {
      fs.renameSync(temp, file);
      return;
    } catch (error) {
      if (!TRANSIENT.has(error.code) || attempt >= 40) {
        fs.rmSync(temp, { force: true });
        throw error;
      }
      sleepSync(50);
    }
  }
}

export function writeJsonAtomic(file, value, options) {
  writeFileAtomic(file, `${JSON.stringify(value, null, 2)}\n`, options);
}

export function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function readJson(file, fallback) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT' && fallback !== undefined) return fallback;
    throw error;
  }
  try {
    return JSON.parse(stripBom(text));
  } catch (error) {
    throw new VarionError(t('{file}: broken JSON ({reason})', { file, reason: error.message }), {
      code: 'bad-json',
    });
  }
}

export function tryReadJson(file, fallback) {
  try {
    return readJson(file, fallback);
  } catch {
    return fallback;
  }
}

export function readText(file, fallback = '') {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

export async function renameWithRetry(from, to, { attempts = 40, delayMs = 250 } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      fs.renameSync(from, to);
      return;
    } catch (error) {
      if (!TRANSIENT.has(error.code) || attempt >= attempts) throw error;
      await sleep(delayMs);
    }
  }
}

export function removeTree(target) {
  fs.rmSync(target, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
}

export function tryRemoveTree(target) {
  try {
    removeTree(target);
    return true;
  } catch {
    return false;
  }
}

export function linkOrCopy(source, target, { replace = false } = {}) {
  if (replace) {
    ensureDir(path.dirname(target));
    fs.rmSync(target, { force: true });
  }
  try {
    fs.linkSync(source, target);
    return 'link';
  } catch (error) {
    if (error.code === 'EEXIST') throw error;
    fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
    return 'copy';
  }
}

export function linkTree(source, target) {
  ensureDir(target);
  let files = 0;
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) files += linkTree(from, to);
    else if (entry.isFile()) {
      linkOrCopy(from, to);
      files++;
    } else {
      throw new VarionError(t('{path}: not a file or a folder (a link?)', { path: from }), {
        code: 'not-a-file',
      });
    }
  }
  return files;
}

export function copyIfChanged(from, to) {
  const source = fs.statSync(from);
  let target = null;
  try {
    target = fs.statSync(to);
  } catch {}
  if (target && target.size === source.size && Math.abs(target.mtimeMs - source.mtimeMs) < 1) {
    return false;
  }
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
  fs.utimesSync(to, source.atime, source.mtime);
  return true;
}

export function mirrorDir(from, to, { skip } = {}) {
  const wanted = walkFiles(from, { skip });
  const wantedSet = new Set(wanted);
  let copied = 0;
  let removed = 0;
  for (const relative of wanted) {
    if (copyIfChanged(path.join(from, relative), path.join(to, relative))) copied++;
  }
  for (const relative of walkFiles(to)) {
    if (!wantedSet.has(relative)) {
      fs.rmSync(path.join(to, relative), { force: true });
      removed++;
    }
  }
  removeEmptyDirs(to);
  return { copied, removed, files: wanted.length };
}

export function removeEmptyDirs(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const child = path.join(dir, entry.name);
    removeEmptyDirs(child);
    try {
      if (fs.readdirSync(child).length === 0) fs.rmdirSync(child);
    } catch {}
  }
}
