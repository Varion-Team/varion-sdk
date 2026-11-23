import crypto from 'node:crypto';
import fs from 'node:fs';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// A release on its way from the developer's PC to the machine of the game server is sealed for
// that machine alone: whoever carries it sees bytes and their count, nothing else.
//
// The machine has an X25519 key pair; its public half is what the developer seals to. Each
// bundle gets a key pair of its own, so two bundles never share a key:
//
//   "VRNBOX" 0x01 0x00 | sender's public key (32) | frames
//   frame: length (4, big-endian) | AES-256-GCM(chunk) with its tag (16)
//
// The key is HKDF-SHA256 of the shared secret, salted with both public keys. A frame's nonce is
// its number; its associated data says whether it is the last one, and a sealed bundle always
// ends with a frame marked last, so a bundle cut short does not open.

const MAGIC = Buffer.from([0x56, 0x52, 0x4e, 0x42, 0x4f, 0x58, 0x01, 0x00]);
const KEY_BYTES = 32;
const TAG_BYTES = 16;
const CHUNK_BYTES = 64 * 1024;
const HEADER_BYTES = MAGIC.length + KEY_BYTES;
const INFO = Buffer.from('varion deploy box v1');
const X25519_SPKI = Buffer.from('302a300506032b656e032100', 'hex');
const MORE = Buffer.from([0]);
const LAST = Buffer.from([1]);

class BoxError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BoxError';
    this.code = 'box';
  }
}

const rawPublic = (key) => key.export({ type: 'spki', format: 'der' }).subarray(X25519_SPKI.length);

function publicKeyOf(text) {
  const raw = typeof text === 'string' ? Buffer.from(text, 'base64') : null;
  if (!raw || raw.length !== KEY_BYTES || raw.toString('base64') !== text) {
    throw new BoxError('the public key of the machine is not 32 bytes in base64');
  }
  return crypto.createPublicKey({
    key: Buffer.concat([X25519_SPKI, raw]),
    format: 'der',
    type: 'spki',
  });
}

function privateKeyOf(text) {
  try {
    return crypto.createPrivateKey({
      key: Buffer.from(String(text), 'base64'),
      format: 'der',
      type: 'pkcs8',
    });
  } catch {
    throw new BoxError('the private key of the machine cannot be read');
  }
}

// { publicKey, privateKey }, both base64: the public one is 32 raw bytes, the private one PKCS#8.
export function newBoxKeys() {
  const pair = crypto.generateKeyPairSync('x25519');
  return {
    publicKey: rawPublic(pair.publicKey).toString('base64'),
    privateKey: pair.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64'),
  };
}

export function isBoxPublicKey(text) {
  try {
    publicKeyOf(text);
    return true;
  } catch {
    return false;
  }
}

// What a person compares by eye: the first 16 hex characters of the key's SHA-256.
export function boxFingerprint(publicKey) {
  const digest = crypto.createHash('sha256').update(Buffer.from(publicKey, 'base64')).digest('hex');
  return `box:${digest.slice(0, 16)}`;
}

function sessionKey(shared, senderPublic, machinePublic) {
  return Buffer.from(
    crypto.hkdfSync('sha256', shared, Buffer.concat([senderPublic, machinePublic]), INFO, 32),
  );
}

function nonceOf(counter) {
  const nonce = Buffer.alloc(12);
  nonce.writeBigUInt64BE(counter, 4);
  return nonce;
}

// How many bytes a bundle of `size` bytes takes once sealed.
export function sealedSize(size) {
  const frames = Math.floor(size / CHUNK_BYTES) + 1;
  return HEADER_BYTES + size + frames * (4 + TAG_BYTES);
}

// A stream that seals what is written to it for the machine with this public key.
export function sealStream(machinePublicKey) {
  const machine = publicKeyOf(machinePublicKey);
  const sender = crypto.generateKeyPairSync('x25519');
  const senderPublic = rawPublic(sender.publicKey);
  const key = sessionKey(
    crypto.diffieHellman({ privateKey: sender.privateKey, publicKey: machine }),
    senderPublic,
    rawPublic(machine),
  );
  let counter = 0n;
  let held = Buffer.alloc(0);
  let started = false;
  const frame = (chunk, last) => {
    const cipher = crypto.createCipheriv('aes-256-gcm', key, nonceOf(counter));
    counter += 1n;
    cipher.setAAD(last ? LAST : MORE);
    const body = Buffer.concat([cipher.update(chunk), cipher.final(), cipher.getAuthTag()]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.length);
    return Buffer.concat([length, body]);
  };
  return new Transform({
    transform(chunk, _encoding, callback) {
      if (!started) {
        started = true;
        this.push(Buffer.concat([MAGIC, senderPublic]));
      }
      held = held.length ? Buffer.concat([held, chunk]) : chunk;
      while (held.length > CHUNK_BYTES) {
        this.push(frame(held.subarray(0, CHUNK_BYTES), false));
        held = held.subarray(CHUNK_BYTES);
      }
      callback();
    },
    flush(callback) {
      if (!started) this.push(Buffer.concat([MAGIC, senderPublic]));
      // a full last chunk goes as an ordinary frame, so the closing frame is never over the size
      if (held.length === CHUNK_BYTES) {
        this.push(frame(held, false));
        held = Buffer.alloc(0);
      }
      this.push(frame(held, true));
      callback();
    },
  });
}

// A stream that opens what was sealed for the machine with this private key.
function openStream(machinePrivateKey) {
  const machine = privateKeyOf(machinePrivateKey);
  const machinePublic = rawPublic(crypto.createPublicKey(machine));
  let held = Buffer.alloc(0);
  let key = null;
  let counter = 0n;
  let ended = false;
  const fail = (message) => new BoxError(message);
  return new Transform({
    transform(chunk, _encoding, callback) {
      held = held.length ? Buffer.concat([held, chunk]) : chunk;
      try {
        if (!key) {
          if (held.length < HEADER_BYTES) return callback();
          if (!held.subarray(0, MAGIC.length).equals(MAGIC)) {
            throw fail('this is not a sealed release');
          }
          const senderPublic = Buffer.from(held.subarray(MAGIC.length, HEADER_BYTES));
          const sender = crypto.createPublicKey({
            key: Buffer.concat([X25519_SPKI, senderPublic]),
            format: 'der',
            type: 'spki',
          });
          key = sessionKey(
            crypto.diffieHellman({ privateKey: machine, publicKey: sender }),
            senderPublic,
            machinePublic,
          );
          held = held.subarray(HEADER_BYTES);
        }
        while (held.length >= 4) {
          const length = held.readUInt32BE(0);
          if (length < TAG_BYTES || length > CHUNK_BYTES + TAG_BYTES) {
            throw fail('the sealed release is damaged');
          }
          if (held.length < 4 + length) break;
          if (ended) throw fail('the sealed release goes on after its end');
          const body = held.subarray(4, 4 + length - TAG_BYTES);
          const tag = held.subarray(4 + length - TAG_BYTES, 4 + length);
          held = held.subarray(4 + length);
          // a frame is the last one or it is not: it opens under exactly one of the two marks
          let opened = null;
          for (const mark of [MORE, LAST]) {
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonceOf(counter));
            decipher.setAAD(mark);
            decipher.setAuthTag(tag);
            try {
              opened = Buffer.concat([decipher.update(body), decipher.final()]);
              ended = mark === LAST;
              break;
            } catch {
              opened = null;
            }
          }
          if (!opened)
            throw fail('the sealed release was not made for this machine, or is damaged');
          counter += 1n;
          if (opened.length) this.push(opened);
        }
        return callback();
      } catch (error) {
        return callback(error);
      }
    },
    flush(callback) {
      if (!ended || held.length) return callback(fail('the sealed release is cut short'));
      return callback();
    },
  });
}

// Whether a file starts the way a sealed release does.
export function isSealed(file) {
  const head = Buffer.alloc(MAGIC.length);
  const handle = fs.openSync(file, 'r');
  try {
    return fs.readSync(handle, head, 0, head.length, 0) === head.length && head.equals(MAGIC);
  } finally {
    fs.closeSync(handle);
  }
}

// Seals a file into another; resolves the size of the sealed file.
export async function sealFile(source, target, machinePublicKey) {
  await pipeline(
    fs.createReadStream(source),
    sealStream(machinePublicKey),
    fs.createWriteStream(target, { mode: 0o600 }),
  );
  return { size: fs.statSync(target).size };
}

// Opens a sealed file into another; resolves the SHA-256 and the size of what was inside.
export async function openFile(source, target, machinePrivateKey) {
  const hash = crypto.createHash('sha256');
  let size = 0;
  const meter = new Transform({
    transform(chunk, _encoding, callback) {
      hash.update(chunk);
      size += chunk.length;
      callback(null, chunk);
    },
  });
  await pipeline(
    fs.createReadStream(source),
    openStream(machinePrivateKey),
    meter,
    fs.createWriteStream(target, { mode: 0o600 }),
  );
  return { sha256: hash.digest('hex'), size };
}
