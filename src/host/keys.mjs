import crypto from 'node:crypto';
import { t } from '../i18n/index.mjs';
import { readJson, writeJsonAtomic } from '../shared/fs.mjs';
import { HostError } from './errors.mjs';

const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const KEY_NAME = /^[\p{L}\p{N} ._@+-]{1,64}$/u;
const MAX_CABINET_KEYS = 1000;

const defaultName = (base64) => `key-${base64.replace(/[^A-Za-z0-9]/g, '').slice(0, 8)}`;

// names from the cabinet end up in log lines
const plainText = (value, max) =>
  String(value ?? '')
    .replace(/[\p{Cc}\p{Cf}]+/gu, ' ')
    .trim()
    .slice(0, max);

export function decodeBase64(text, bytes) {
  const value = String(text ?? '').trim();
  if (!value || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(value)) return null;
  const standard = value.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = Buffer.from(standard, 'base64');
  if (bytes !== undefined && decoded.length !== bytes) return null;
  // stray bits in the last character decode to the same bytes
  if (decoded.toString('base64').replace(/=+$/, '') !== standard.replace(/=+$/, '')) return null;
  return decoded;
}

export function publicKeyFromRaw(raw) {
  return crypto.createPublicKey({
    key: Buffer.concat([ED25519_SPKI_PREFIX, raw]),
    format: 'der',
    type: 'spki',
  });
}

export function parsePublicKey(text) {
  const raw = decodeBase64(text, 32);
  if (!raw) {
    throw new HostError(
      t('not a developer key: expected the base64 of 32 bytes that `varion keys show` prints'),
      'bad-key',
    );
  }
  let key;
  try {
    key = publicKeyFromRaw(raw);
  } catch {
    throw new HostError(t('not an Ed25519 public key'), 'bad-key');
  }
  return { raw, base64: raw.toString('base64'), key };
}

export function checkKeyName(name) {
  if (!KEY_NAME.test(name)) {
    throw new HostError(
      t('key name "{name}" is not valid: up to 64 letters, digits, spaces and . _ @ + -', {
        name,
      }),
      'bad-key-name',
    );
  }
  return name;
}

// a broken file stops the host instead of silently trusting nobody
export function loadTrust(file) {
  const data = readJson(file, { format: 1, keys: [] });
  if (!data || data.format !== 1 || !Array.isArray(data.keys)) {
    throw new HostError(
      t('{file}: not a trusted keys file (expected {"format": 1, "keys": [...]})', { file }),
      'bad-trust',
    );
  }
  return data.keys.map((entry, index) => {
    let parsed;
    try {
      parsed = parsePublicKey(entry?.publicKey);
    } catch (error) {
      throw new HostError(
        t('{file}: key {number}: {reason}', { file, number: index + 1, reason: error.message }),
        'bad-trust',
      );
    }
    return {
      name: String(entry.name || ''),
      publicKey: parsed.base64,
      raw: parsed.raw,
      key: parsed.key,
      addedAt: String(entry.addedAt || ''),
    };
  });
}

export function saveTrust(file, keys) {
  const keysOut = keys.map(({ name, publicKey, addedAt }) => ({ name, publicKey, addedAt }));
  writeJsonAtomic(file, { format: 1, keys: keysOut }, { mode: 0o600 });
}

export function cabinetTrust(data) {
  const list = Array.isArray(data?.keys) ? data.keys.slice(0, MAX_CABINET_KEYS) : [];
  const keys = [];
  let skipped = 0;
  for (const entry of list) {
    let parsed;
    try {
      parsed = parsePublicKey(entry?.publicKey);
    } catch {
      skipped++;
      continue;
    }
    const told = typeof entry.deployTest === 'boolean' || typeof entry.deployProd === 'boolean';
    keys.push({
      name: plainText(entry.name, 64) || defaultName(parsed.base64),
      publicKey: parsed.base64,
      raw: parsed.raw,
      key: parsed.key,
      addedAt: '',
      accountId: plainText(entry.accountId, 64),
      source: 'cabinet',
      rights: told ? { test: entry.deployTest === true, prod: entry.deployProd === true } : null,
    });
  }
  return { keys, skipped };
}

export function findTrusted(keys, raw) {
  return keys.find((entry) => entry.raw.equals(raw)) || null;
}

export function trustKey(file, publicKeyText, name, now = new Date()) {
  const parsed = parsePublicKey(publicKeyText);
  const keys = loadTrust(file);
  const existing = findTrusted(keys, parsed.raw);
  const label = name ? checkKeyName(name) : existing?.name || defaultName(parsed.base64);
  if (existing) {
    existing.name = label;
    saveTrust(file, keys);
    return { entry: existing, added: false };
  }
  const entry = {
    name: label,
    publicKey: parsed.base64,
    raw: parsed.raw,
    key: parsed.key,
    addedAt: now.toISOString(),
  };
  keys.push(entry);
  saveTrust(file, keys);
  return { entry, added: true };
}

export function untrustKey(file, keyOrName) {
  const keys = loadTrust(file);
  const raw = decodeBase64(keyOrName, 32);
  const removed = keys.filter((entry) => (raw ? entry.raw.equals(raw) : entry.name === keyOrName));
  if (removed.length)
    saveTrust(
      file,
      keys.filter((entry) => !removed.includes(entry)),
    );
  return removed;
}
