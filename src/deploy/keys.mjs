import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { ensureDir, sha256 as sha256Hex, utcStamp } from '../shared/fs.mjs';
import { DeployError } from './errors.mjs';

const KEY_VARIABLE = 'VARION_DEPLOY_KEY';
const PRIVATE_FILE = 'deploy-ed25519.pem';
const PUBLIC_FILE = 'deploy-ed25519.pub';

export function configDir(env = process.env, platform = process.platform) {
  if (env.VARION_CONFIG_DIR) return path.resolve(env.VARION_CONFIG_DIR);
  if (platform !== 'win32') return path.join(os.homedir(), '.config', 'varion');
  const appData = env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  return path.join(appData, 'Varion');
}

export function keysDir(env = process.env, platform = process.platform) {
  if (env.VARION_KEYS_DIR) return path.resolve(env.VARION_KEYS_DIR);
  return path.join(configDir(env, platform), 'keys');
}

export const rawPublicKey = (key) =>
  crypto.createPublicKey(key).export({ format: 'der', type: 'spki' }).subarray(-32);

export function keyFingerprint(publicKey) {
  return `sha256:${sha256Hex(Buffer.from(publicKey, 'base64')).slice(0, 16)}`;
}

function keyFromEnv(env) {
  const text = String(env[KEY_VARIABLE] ?? '').trim();
  // CI variables often hold the PEM on one line with \n escapes
  return text.includes('\n') ? text : text.replaceAll('\\n', '\n');
}

function parseKey(pem, source) {
  let key;
  try {
    key = crypto.createPrivateKey(pem);
  } catch {
    throw new DeployError(t('{source} is not a PEM private key', { source }), { code: 'bad_key' });
  }
  if (key.asymmetricKeyType !== 'ed25519') {
    throw new DeployError(
      t('{source}: the key type is {type}, but deploy requests are signed with Ed25519', {
        source,
        type: key.asymmetricKeyType,
      }),
      { code: 'bad_key' },
    );
  }
  return key;
}

export function loadKey(dir, env) {
  const pem = keyFromEnv(env);
  if (pem) return { key: parseKey(pem, KEY_VARIABLE), source: 'env' };
  const file = path.join(dir, PRIVATE_FILE);
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new DeployError(
        t(
          'no developer key yet ({file}): create one with varion keys init, or set VARION_DEPLOY_KEY',
          {
            file,
          },
        ),
        { code: 'no_key' },
      );
    }
    throw new DeployError(
      t('cannot read the developer key {file}: {reason}', { file, reason: error.message }),
      { code: 'bad_key' },
    );
  }
  return { key: parseKey(text, file), source: 'file' };
}

function describeKey(key, source, dir) {
  const publicKey = rawPublicKey(key).toString('base64');
  const files =
    source === 'file'
      ? {
          dir,
          privateKeyPath: path.join(dir, PRIVATE_FILE),
          publicKeyPath: path.join(dir, PUBLIC_FILE),
        }
      : {};
  return {
    publicKey,
    fingerprint: keyFingerprint(publicKey),
    source,
    ...files,
    trust: `varion host trust ${publicKey} --name <name>`,
  };
}

// the .pub file is only a copy for convenience and follows the private key
function syncPublicFile({ publicKeyPath, publicKey }) {
  try {
    if (fs.readFileSync(publicKeyPath, 'utf8').trim() === publicKey) return;
  } catch {
    // no copy yet: write it
  }
  try {
    fs.writeFileSync(publicKeyPath, `${publicKey}\n`);
  } catch {
    // the key works without its copy
  }
}

export function showKey({ env = process.env, dir = keysDir(env) } = {}) {
  const { key, source } = loadKey(dir, env);
  const shown = describeKey(key, source, dir);
  if (source === 'file') syncPublicFile(shown);
  return shown;
}

export function initKeys({ env = process.env, dir = keysDir(env), force = false } = {}) {
  if (keyFromEnv(env)) {
    if (force) {
      throw new DeployError(t('VARION_DEPLOY_KEY is set and wins over a new key: unset it first'), {
        code: 'env_key',
      });
    }
    return { ...showKey({ env, dir }), created: false };
  }
  const privatePath = path.join(dir, PRIVATE_FILE);
  const publicPath = path.join(dir, PUBLIC_FILE);
  if (fs.existsSync(privatePath) && !force) return { ...showKey({ env, dir }), created: false };
  ensureDir(dir, 0o700);
  let replaced = '';
  if (fs.existsSync(privatePath)) {
    // hosts may still trust the old key, so it is kept
    const stamp = utcStamp();
    replaced = `${privatePath}.replaced-${stamp}`;
    fs.renameSync(privatePath, replaced);
    if (fs.existsSync(publicPath)) fs.renameSync(publicPath, `${publicPath}.replaced-${stamp}`);
  }
  const { privateKey } = crypto.generateKeyPairSync('ed25519');
  try {
    fs.writeFileSync(privatePath, privateKey.export({ format: 'pem', type: 'pkcs8' }), {
      mode: 0o600,
      flag: 'wx',
    });
  } catch (error) {
    // another keys init got there first
    if (error.code === 'EEXIST') return { ...showKey({ env, dir }), created: false };
    throw new DeployError(
      t('cannot write the developer key {file}: {reason}', {
        file: privatePath,
        reason: error.message,
      }),
      { code: 'bad_key' },
    );
  }
  const shown = describeKey(privateKey, 'file', dir);
  fs.writeFileSync(publicPath, `${shown.publicKey}\n`, { mode: 0o644 });
  return { ...shown, created: true, ...(replaced ? { replaced } : {}) };
}
