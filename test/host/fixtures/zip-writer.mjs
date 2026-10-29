import zlib from 'node:zlib';

// localName, encrypted and declaredSize make the broken archives the host must refuse
export function buildZip(entries, { zip64 = false } = {}) {
  const parts = [];
  const central = [];
  let offset = 0;
  for (const entry of entries) {
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data ?? '', 'utf8');
    const method = entry.method ?? (data.length > 64 ? 8 : 0);
    const body = method === 8 ? zlib.deflateRawSync(data) : data;
    const nameBytes = Buffer.from(entry.name, 'utf8');
    const localNameBytes = Buffer.from(entry.localName ?? entry.name, 'utf8');
    const flags = (entry.utf8 === false ? 0 : 0x0800) | (entry.encrypted ? 1 : 0);
    const size = entry.declaredSize ?? data.length;
    const crc = zlib.crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(size, 22);
    local.writeUInt16LE(localNameBytes.length, 26);
    parts.push(local, localNameBytes, body);
    central.push({
      nameBytes,
      method,
      flags,
      crc,
      compressedSize: body.length,
      size,
      offset,
      unixMode: entry.unixMode,
    });
    offset += 30 + localNameBytes.length + body.length;
  }
  const directoryStart = offset;
  for (const item of central) {
    let extra = Buffer.alloc(0);
    let compressedSize = item.compressedSize;
    let size = item.size;
    let localOffset = item.offset;
    if (zip64) {
      extra = Buffer.alloc(28);
      extra.writeUInt16LE(0x0001, 0);
      extra.writeUInt16LE(24, 2);
      extra.writeBigUInt64LE(BigInt(size), 4);
      extra.writeBigUInt64LE(BigInt(compressedSize), 12);
      extra.writeBigUInt64LE(BigInt(localOffset), 20);
      compressedSize = 0xffffffff;
      size = 0xffffffff;
      localOffset = 0xffffffff;
    }
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(item.unixMode ? 0x0314 : 20, 4);
    record.writeUInt16LE(zip64 ? 45 : 20, 6);
    record.writeUInt16LE(item.flags, 8);
    record.writeUInt16LE(item.method, 10);
    record.writeUInt32LE(item.crc, 16);
    record.writeUInt32LE(compressedSize, 20);
    record.writeUInt32LE(size, 24);
    record.writeUInt16LE(item.nameBytes.length, 28);
    record.writeUInt16LE(extra.length, 30);
    record.writeUInt32LE(item.unixMode ? (item.unixMode << 16) >>> 0 : 0, 38);
    record.writeUInt32LE(localOffset, 42);
    parts.push(record, item.nameBytes, extra);
    offset += 46 + item.nameBytes.length + extra.length;
  }
  const directorySize = offset - directoryStart;
  if (zip64) {
    const record = Buffer.alloc(56);
    record.writeUInt32LE(0x06064b50, 0);
    record.writeBigUInt64LE(44n, 4);
    record.writeUInt16LE(45, 12);
    record.writeUInt16LE(45, 14);
    record.writeBigUInt64LE(BigInt(central.length), 24);
    record.writeBigUInt64LE(BigInt(central.length), 32);
    record.writeBigUInt64LE(BigInt(directorySize), 40);
    record.writeBigUInt64LE(BigInt(directoryStart), 48);
    const locator = Buffer.alloc(20);
    locator.writeUInt32LE(0x07064b50, 0);
    locator.writeBigUInt64LE(BigInt(offset), 8);
    locator.writeUInt32LE(1, 16);
    parts.push(record, locator);
  }
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(zip64 ? 0xffff : central.length, 8);
  end.writeUInt16LE(zip64 ? 0xffff : central.length, 10);
  end.writeUInt32LE(zip64 ? 0xffffffff : directorySize, 12);
  end.writeUInt32LE(zip64 ? 0xffffffff : directoryStart, 16);
  parts.push(end);
  return Buffer.concat(parts);
}
