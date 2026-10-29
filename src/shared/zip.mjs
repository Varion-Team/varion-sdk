import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import zlib from 'node:zlib';
import { t } from '../i18n/index.mjs';
import { VarionError } from './errors.mjs';

export class ZipError extends VarionError {
  constructor(message) {
    super(message, { code: 'zip' });
  }
}

const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_END = 0x06054b50;
const SIG_END64 = 0x06064b50;
const SIG_LOCATOR64 = 0x07064b50;

// same limits the server applies to resource paths
export const MAX_PATH_BYTES = 4096;
export const MAX_PATH_COMPONENTS = 64;

// eslint-disable-next-line no-control-regex
const BAD_CHARACTER = /[\u0000-\u001f\u007f<>:"|?*\\]/;
const DEVICE_NAME = /^(con|prn|aux|nul|conin\$|conout\$|com[0-9¹²³]|lpt[0-9¹²³])$/i;
// 8.3 aliases like PROGRA~1 can point to a different folder
const SHORT_ALIAS = /^[^~.]{1,6}~[0-9]+(\.[^.]*)?$/;

const shown = (text) => JSON.stringify(String(text)).slice(1, -1).slice(0, 160);

export function checkEntryPath(raw, { windowsSeparators = false } = {}) {
  if (typeof raw !== 'string' || !raw) throw new ZipError(t('empty file name'));
  let name = windowsSeparators ? raw.replaceAll('\\', '/') : raw;
  let directory = false;
  if (name.endsWith('/')) {
    directory = true;
    name = name.slice(0, -1);
  }
  const quoted = shown(raw);
  if (!name) throw new ZipError(t('empty file name "{path}"', { path: quoted }));
  if (Buffer.byteLength(name, 'utf8') > MAX_PATH_BYTES) {
    throw new ZipError(t('path "{path}" is too long', { path: `${quoted.slice(0, 80)}...` }));
  }
  if (BAD_CHARACTER.test(name)) {
    throw new ZipError(
      t(
        'path "{path}" has a character Windows does not allow (\\ : < > " | ? * or a control character)',
        {
          path: quoted,
        },
      ),
    );
  }
  if (name.startsWith('/')) throw new ZipError(t('path "{path}" is absolute', { path: quoted }));
  const parts = name.split('/');
  if (parts.length > MAX_PATH_COMPONENTS) {
    throw new ZipError(t('path "{path}" is too deep', { path: `${quoted.slice(0, 80)}...` }));
  }
  for (const part of parts) {
    if (!part) throw new ZipError(t('path "{path}" has an empty part', { path: quoted }));
    if (part === '.' || part === '..') {
      throw new ZipError(t('path "{path}" leaves its folder', { path: quoted }));
    }
    if (/[. ]$/.test(part)) {
      throw new ZipError(
        t('path "{path}" has a name ending in a dot or a space (Windows drops them)', {
          path: quoted,
        }),
      );
    }
    if (DEVICE_NAME.test(part.split('.')[0])) {
      throw new ZipError(t('path "{path}" has a Windows device name', { path: quoted }));
    }
    if (SHORT_ALIAS.test(part)) {
      throw new ZipError(t('path "{path}" has a Windows short (8.3) name', { path: quoted }));
    }
    if (Buffer.byteLength(part, 'utf8') > 255) {
      throw new ZipError(
        t('path "{path}" has a name over 255 bytes', { path: `${quoted.slice(0, 80)}...` }),
      );
    }
  }
  return { path: name, directory };
}

export const foldPath = (value) => value.normalize('NFC').toLowerCase();

function readBig(buffer, at) {
  const value = buffer.readBigUInt64LE(at);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new ZipError(t('a ZIP64 value is too large'));
  return Number(value);
}

async function readExactly(handle, buffer, position) {
  let done = 0;
  while (done < buffer.length) {
    const { bytesRead } = await handle.read(buffer, done, buffer.length - done, position + done);
    if (bytesRead === 0) throw new ZipError(t('the archive is truncated'));
    done += bytesRead;
  }
  return buffer;
}

async function* readRange(handle, start, length) {
  const chunkSize = 1 << 20;
  let position = start;
  let left = length;
  while (left > 0) {
    const size = Math.min(chunkSize, left);
    const chunk = await readExactly(handle, Buffer.allocUnsafe(size), position);
    position += size;
    left -= size;
    yield chunk;
  }
}

const utf8Strict = new TextDecoder('utf-8', { fatal: true });

function decodeName(bytes, utf8Flag) {
  if (!utf8Flag && bytes.some((byte) => byte >= 0x80)) {
    throw new ZipError(t('a file name in the archive is not UTF-8'));
  }
  try {
    return utf8Strict.decode(bytes);
  } catch {
    throw new ZipError(t('a file name in the archive is broken UTF-8'));
  }
}

async function findEnd(handle, fileSize) {
  const tailSize = Math.min(fileSize, 22 + 0xffff);
  const tailStart = fileSize - tailSize;
  const tail = await readExactly(handle, Buffer.alloc(tailSize), tailStart);
  for (let at = tailSize - 22; at >= 0; at--) {
    if (tail.readUInt32LE(at) === SIG_END && at + 22 + tail.readUInt16LE(at + 20) === tailSize) {
      return { tail, end: at, endPosition: tailStart + at };
    }
  }
  throw new ZipError(t('not a ZIP archive (no end of central directory)'));
}

function parseEntry(directory, at) {
  if (at + 46 > directory.length || directory.readUInt32LE(at) !== SIG_CENTRAL) {
    throw new ZipError(t('the central directory is broken'));
  }
  const madeBy = directory.readUInt16LE(at + 4);
  const flags = directory.readUInt16LE(at + 8);
  const method = directory.readUInt16LE(at + 10);
  const crc = directory.readUInt32LE(at + 16);
  let compressedSize = directory.readUInt32LE(at + 20);
  let size = directory.readUInt32LE(at + 24);
  const nameLength = directory.readUInt16LE(at + 28);
  const extraLength = directory.readUInt16LE(at + 30);
  const commentLength = directory.readUInt16LE(at + 32);
  let startDisk = directory.readUInt16LE(at + 34);
  const externalAttributes = directory.readUInt32LE(at + 38);
  let localOffset = directory.readUInt32LE(at + 42);
  const next = at + 46 + nameLength + extraLength + commentLength;
  if (next > directory.length) throw new ZipError(t('the central directory is broken'));
  const nameBytes = Buffer.from(directory.subarray(at + 46, at + 46 + nameLength));
  let extra = at + 46 + nameLength;
  const extraEnd = extra + extraLength;
  while (extra + 4 <= extraEnd) {
    const id = directory.readUInt16LE(extra);
    const length = directory.readUInt16LE(extra + 2);
    if (extra + 4 + length > extraEnd)
      throw new ZipError(t('an extra field of an entry is broken'));
    if (id === 0x0001) {
      // zip64 extra holds only the fields that were 0xffffffff, in this order
      let field = extra + 4;
      const fieldEnd = field + length;
      const take = (bytes) => {
        if (field + bytes > fieldEnd) throw new ZipError(t('a ZIP64 field is broken'));
        const value = bytes === 8 ? readBig(directory, field) : directory.readUInt32LE(field);
        field += bytes;
        return value;
      };
      if (size === 0xffffffff) size = take(8);
      if (compressedSize === 0xffffffff) compressedSize = take(8);
      if (localOffset === 0xffffffff) localOffset = take(8);
      if (startDisk === 0xffff) startDisk = take(4);
    }
    extra += 4 + length;
  }
  if (startDisk !== 0) throw new ZipError(t('multi-volume archives are not supported'));
  const name = decodeName(nameBytes, (flags & 0x0800) !== 0);
  const host = madeBy >> 8;
  const unixMode = host === 3 ? externalAttributes >>> 16 : 0;
  const fileType = unixMode & 0o170000;
  const dosDirectory = host === 0 && (externalAttributes & 0x10) !== 0;
  const entry = {
    name,
    nameBytes,
    method,
    flags,
    crc,
    compressedSize,
    size,
    localOffset,
    unixMode,
    encrypted: (flags & 0x0001) !== 0,
    isDirectory: name.endsWith('/') || fileType === 0o040000 || dosDirectory,
    isSymlink: fileType === 0o120000,
    isSpecial:
      fileType !== 0 && fileType !== 0o100000 && fileType !== 0o040000 && fileType !== 0o120000,
  };
  return { entry, next };
}

export async function openZip(
  file,
  { maxEntries = 100_000, maxCentralDirectoryBytes = 64 << 20 } = {},
) {
  const handle = await fs.promises.open(file, 'r');
  try {
    const { size: fileSize } = await handle.stat();
    if (fileSize < 22) throw new ZipError(t('not a ZIP archive'));
    const { tail, end, endPosition } = await findEnd(handle, fileSize);
    let disk = tail.readUInt16LE(end + 4);
    let directoryDisk = tail.readUInt16LE(end + 6);
    let entriesOnDisk = tail.readUInt16LE(end + 8);
    let count = tail.readUInt16LE(end + 10);
    let directorySize = tail.readUInt32LE(end + 12);
    let directoryOffset = tail.readUInt32LE(end + 16);
    let directoryLimit = endPosition;
    if (
      count === 0xffff ||
      entriesOnDisk === 0xffff ||
      directorySize === 0xffffffff ||
      directoryOffset === 0xffffffff
    ) {
      const locatorPosition = endPosition - 20;
      if (locatorPosition < 0) throw new ZipError(t('no ZIP64 locator'));
      const locator = await readExactly(handle, Buffer.alloc(20), locatorPosition);
      if (locator.readUInt32LE(0) !== SIG_LOCATOR64) throw new ZipError(t('no ZIP64 locator'));
      const recordPosition = readBig(locator, 8);
      if (recordPosition + 56 > locatorPosition) {
        throw new ZipError(t('the ZIP64 record lies outside the archive'));
      }
      const record = await readExactly(handle, Buffer.alloc(56), recordPosition);
      if (record.readUInt32LE(0) !== SIG_END64) throw new ZipError(t('no ZIP64 record'));
      disk = record.readUInt32LE(16);
      directoryDisk = record.readUInt32LE(20);
      entriesOnDisk = readBig(record, 24);
      count = readBig(record, 32);
      directorySize = readBig(record, 40);
      directoryOffset = readBig(record, 48);
      directoryLimit = recordPosition;
    }
    if (disk !== 0 || directoryDisk !== 0 || entriesOnDisk !== count) {
      throw new ZipError(t('multi-volume archives are not supported'));
    }
    if (count > maxEntries) {
      throw new ZipError(
        t('the archive has {count} entries, more than {max}', { count, max: maxEntries }),
      );
    }
    if (directorySize > maxCentralDirectoryBytes) {
      throw new ZipError(t('the central directory is too large'));
    }
    if (directoryOffset + directorySize > directoryLimit) {
      throw new ZipError(t('the central directory lies outside the archive'));
    }
    const directory = await readExactly(handle, Buffer.alloc(directorySize), directoryOffset);
    const entries = [];
    let at = 0;
    for (let index = 0; index < count; index++) {
      const { entry, next } = parseEntry(directory, at);
      entries.push(entry);
      at = next;
    }
    if (at !== directory.length) throw new ZipError(t('extra bytes in the central directory'));
    return new ZipReader(handle, directoryOffset, entries);
  } catch (error) {
    await handle.close().catch(() => {});
    throw error;
  }
}

class ZipReader {
  constructor(handle, directoryOffset, entries) {
    this.handle = handle;
    this.directoryOffset = directoryOffset;
    this.entries = entries;
    this.ranges = new Map();
  }

  async close() {
    await this.handle.close().catch(() => {});
  }

  async dataRange(entry) {
    const known = this.ranges.get(entry);
    if (known) return known;
    const { name } = entry;
    if (entry.encrypted) throw new ZipError(t('{name}: encrypted', { name }));
    if (entry.isSymlink || entry.isSpecial) {
      throw new ZipError(t('{name}: a link or a special file, not a regular file', { name }));
    }
    if (entry.method !== 0 && entry.method !== 8) {
      throw new ZipError(
        t('{name}: compression method {method} is not supported (only stored and deflate)', {
          name,
          method: entry.method,
        }),
      );
    }
    if (entry.method === 0 && entry.compressedSize !== entry.size) {
      throw new ZipError(t('{name}: the sizes of a stored entry differ', { name }));
    }
    if (entry.localOffset + 30 > this.directoryOffset) {
      throw new ZipError(t('{name}: the local header lies outside the data', { name }));
    }
    const header = await readExactly(this.handle, Buffer.alloc(30), entry.localOffset);
    if (header.readUInt32LE(0) !== SIG_LOCAL) {
      throw new ZipError(t('{name}: broken local header', { name }));
    }
    if ((header.readUInt16LE(6) & 0x0001) !== 0) {
      throw new ZipError(t('{name}: encrypted', { name }));
    }
    if (header.readUInt16LE(8) !== entry.method) {
      throw new ZipError(
        t('{name}: the local and central headers differ (compression method)', { name }),
      );
    }
    const nameLength = header.readUInt16LE(26);
    const extraLength = header.readUInt16LE(28);
    const localName = await readExactly(
      this.handle,
      Buffer.alloc(nameLength),
      entry.localOffset + 30,
    );
    if (!localName.equals(entry.nameBytes)) {
      throw new ZipError(t('{name}: the local and central headers differ (name)', { name }));
    }
    const start = entry.localOffset + 30 + nameLength + extraLength;
    const end = start + entry.compressedSize;
    if (end > this.directoryOffset) {
      throw new ZipError(t('{name}: the data runs into the central directory', { name }));
    }
    const range = { start, end };
    this.ranges.set(entry, range);
    return range;
  }

  async checkLayout(entries) {
    const ranges = [];
    for (const entry of entries) {
      ranges.push({ entry, ...(await this.dataRange(entry)), header: entry.localOffset });
    }
    ranges.sort((a, b) => a.header - b.header);
    for (let index = 1; index < ranges.length; index++) {
      if (ranges[index].header < ranges[index - 1].end) {
        throw new ZipError(
          t('entries of the archive overlap: {first} and {second}', {
            first: ranges[index - 1].entry.name,
            second: ranges[index].entry.name,
          }),
        );
      }
    }
  }

  async *chunks(entry) {
    const range = await this.dataRange(entry);
    let source = Readable.from(readRange(this.handle, range.start, range.end - range.start));
    if (entry.method === 8) {
      const inflate = zlib.createInflateRaw();
      // an error on either side destroys inflate and ends the loop
      pipeline(source, inflate).catch(() => {});
      source = inflate;
    }
    let size = 0;
    let crc = 0;
    for await (const chunk of source) {
      size += chunk.length;
      if (size > entry.size) {
        source.destroy();
        throw new ZipError(
          t('{name}: unpacks to more than its declared size', { name: entry.name }),
        );
      }
      crc = zlib.crc32(chunk, crc);
      yield chunk;
    }
    if (size !== entry.size) {
      throw new ZipError(t('{name}: the size differs from the declared one', { name: entry.name }));
    }
    if (crc !== entry.crc) throw new ZipError(t('{name}: CRC differs', { name: entry.name }));
  }

  async readBuffer(entry, maxBytes) {
    if (entry.size > maxBytes) {
      throw new ZipError(
        t('{name}: larger than {bytes} bytes', { name: entry.name, bytes: maxBytes }),
      );
    }
    const chunks = [];
    for await (const chunk of this.chunks(entry)) chunks.push(chunk);
    return Buffer.concat(chunks);
  }

  async extractTo(entry, target, { expectedSize, expectedSha256, mode } = {}) {
    if (expectedSize === undefined || entry.size !== expectedSize) {
      throw new ZipError(
        t('{name}: {size} bytes in the archive, expected {expected}', {
          name: entry.name,
          size: entry.size,
          expected: expectedSize,
        }),
      );
    }
    const hash = crypto.createHash('sha256');
    const out = await fs.promises.open(target, 'wx', mode);
    try {
      const sink = new Writable({
        write(chunk, _encoding, callback) {
          hash.update(chunk);
          out.write(chunk).then(() => callback(), callback);
        },
      });
      await pipeline(Readable.from(this.chunks(entry)), sink);
      const digest = hash.digest('hex');
      if (expectedSha256 && digest !== expectedSha256) {
        throw new ZipError(t('{name}: SHA-256 differs', { name: entry.name }));
      }
      await out.close();
      return { size: entry.size, sha256: digest };
    } catch (error) {
      await out.close().catch(() => {});
      await fs.promises.rm(target, { force: true }).catch(() => {});
      throw error;
    }
  }
}

export async function extractZip(
  file,
  dest,
  { stripRoot = 'auto', windowsSeparators = true, maxEntries } = {},
) {
  const zip = await openZip(file, maxEntries ? { maxEntries } : undefined);
  try {
    const files = [];
    for (const entry of zip.entries) {
      const checked = checkEntryPath(entry.name, { windowsSeparators });
      if (checked.directory || entry.isDirectory) continue;
      files.push({ entry, name: checked.path });
    }
    let strip = '';
    if (stripRoot === 'auto' && files.length) {
      const first = files[0].name.split('/')[0];
      if (files.every(({ name }) => name.startsWith(`${first}/`))) strip = `${first}/`;
    } else if (typeof stripRoot === 'string' && stripRoot !== 'auto') {
      strip = stripRoot.endsWith('/') ? stripRoot : `${stripRoot}/`;
    }
    const seen = new Set();
    for (const item of files) {
      item.relative =
        strip && item.name.startsWith(strip) ? item.name.slice(strip.length) : item.name;
      const key = foldPath(item.relative);
      if (seen.has(key)) {
        throw new ZipError(t('{name}: the archive has this file twice', { name: item.relative }));
      }
      seen.add(key);
    }
    await zip.checkLayout(files.map(({ entry }) => entry));
    for (const { entry, relative } of files) {
      const target = path.join(dest, ...relative.split('/'));
      fs.mkdirSync(path.dirname(target), { recursive: true });
      await zip.extractTo(entry, target, { expectedSize: entry.size });
    }
    return files.map(({ relative }) => relative);
  } finally {
    await zip.close();
  }
}

// ---- writing ----

function dosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  const time =
    (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

// already compressed, store as is
const STORED = /\.(rpf|zip|7z|rar|gz|png|jpe?g|webp|ogg|mp3|mp4|webm|woff2?)$/i;
const STREAM_OVER = 64 << 20;

export class ZipWriter {
  constructor(file, { date = new Date() } = {}) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    this.fd = fs.openSync(file, 'w');
    this.offset = 0;
    this.central = [];
    this.stamp = dosDateTime(date);
  }

  write(bytes) {
    fs.writeSync(this.fd, bytes);
    this.offset += bytes.length;
    if (this.offset > 0xffffffff)
      throw new ZipError(t('the archive is over 4 GB: ZIP64 is not written'));
  }

  header(name, { method, crc, compressedSize, size }) {
    const nameBytes = Buffer.from(name, 'utf8');
    const local = Buffer.alloc(30);
    local.writeUInt32LE(SIG_LOCAL, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(this.stamp.time, 10);
    local.writeUInt16LE(this.stamp.day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressedSize, 18);
    local.writeUInt32LE(size, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    this.central.push({ nameBytes, method, crc, compressedSize, size, offset: this.offset });
    this.write(local);
    this.write(nameBytes);
  }

  addBuffer(name, data, { compress = !STORED.test(name) } = {}) {
    const crc = zlib.crc32(data);
    const packed = compress ? zlib.deflateRawSync(data, { level: 9 }) : data;
    const method = compress && packed.length < data.length ? 8 : 0;
    const body = method === 8 ? packed : data;
    this.header(name, { method, crc, compressedSize: body.length, size: data.length });
    this.write(body);
  }

  addFile(name, file) {
    const { size } = fs.statSync(file);
    if (size <= STREAM_OVER && !STORED.test(name)) {
      this.addBuffer(name, fs.readFileSync(file));
      return;
    }
    // two passes: crc first, then the data
    const chunk = Buffer.alloc(1 << 20);
    const source = fs.openSync(file, 'r');
    try {
      let crc = 0;
      for (let position = 0; position < size;) {
        const read = fs.readSync(source, chunk, 0, chunk.length, position);
        crc = zlib.crc32(chunk.subarray(0, read), crc);
        position += read;
      }
      this.header(name, { method: 0, crc, compressedSize: size, size });
      for (let position = 0; position < size;) {
        const read = fs.readSync(source, chunk, 0, chunk.length, position);
        this.write(chunk.subarray(0, read));
        position += read;
      }
    } finally {
      fs.closeSync(source);
    }
  }

  close() {
    const start = this.offset;
    for (const entry of this.central) {
      const record = Buffer.alloc(46);
      record.writeUInt32LE(SIG_CENTRAL, 0);
      record.writeUInt16LE(0x0314, 4); // made by Unix, version 2.0
      record.writeUInt16LE(20, 6);
      record.writeUInt16LE(0x0800, 8);
      record.writeUInt16LE(entry.method, 10);
      record.writeUInt16LE(this.stamp.time, 12);
      record.writeUInt16LE(this.stamp.day, 14);
      record.writeUInt32LE(entry.crc, 16);
      record.writeUInt32LE(entry.compressedSize, 20);
      record.writeUInt32LE(entry.size, 24);
      record.writeUInt16LE(entry.nameBytes.length, 28);
      record.writeUInt32LE((0o100644 << 16) >>> 0, 38);
      record.writeUInt32LE(entry.offset, 42);
      this.write(record);
      this.write(entry.nameBytes);
    }
    const end = Buffer.alloc(22);
    end.writeUInt32LE(SIG_END, 0);
    end.writeUInt16LE(this.central.length, 8);
    end.writeUInt16LE(this.central.length, 10);
    end.writeUInt32LE(this.offset - start, 12);
    end.writeUInt32LE(start, 16);
    this.write(end);
    fs.closeSync(this.fd);
  }
}
