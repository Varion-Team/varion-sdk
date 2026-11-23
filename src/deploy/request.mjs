import crypto from 'node:crypto';
import { t } from '../i18n/index.mjs';
import { canonicalJson } from '../shared/canonical-json.mjs';
import { DeployError } from './errors.mjs';
import { keysDir, loadKey, rawPublicKey } from './keys.mjs';
import {
  DEPLOY_ENV,
  ED25519_SPKI,
  PROJECT,
  RELEASE_ID,
  SERVER_ID,
  SHA256,
} from '../shared/deploy-format.mjs';

export { canonicalJson };

export function buildDeployRequest({
  action = 'activate',
  env,
  project,
  releaseId,
  serverId,
  sha256,
  issuedAt = new Date().toISOString(),
  nonce = crypto.randomBytes(16).toString('base64url'),
}) {
  const bad = (message) => {
    throw new DeployError(message, { code: 'bad_request' });
  };
  if (action !== 'activate' && action !== 'rollback') {
    bad(t('deploy request: action must be activate or rollback'));
  }
  if (typeof env !== 'string' || !DEPLOY_ENV.test(env)) {
    bad(t('deploy request: env "{env}" must be test, prod or preview-<branch>', { env }));
  }
  if (typeof project !== 'string' || !PROJECT.test(project)) {
    bad(
      t('deploy request: project "{project}" may only have Latin letters, digits and . _ -', {
        project,
      }),
    );
  }
  if (typeof releaseId !== 'string' || !RELEASE_ID.test(releaseId)) {
    bad(
      t('deploy request: releaseId "{releaseId}" must look like YYYYMMDD-HHMMSS-<8 hex digits>', {
        releaseId,
      }),
    );
  }
  if (typeof serverId !== 'string' || !SERVER_ID.test(serverId)) {
    bad(
      t('deploy request: serverId "{serverId}" must be a cabinet server number or preview', {
        serverId,
      }),
    );
  }
  if (typeof sha256 !== 'string' || !SHA256.test(sha256)) {
    bad(t('deploy request: sha256 must be the SHA-256 of the release bundle (64 hex digits)'));
  }
  if (serverId === 'preview' && !env.startsWith('preview-')) {
    bad(t('deploy request: serverId preview is only for preview-<branch> environments'));
  }
  if (typeof issuedAt !== 'string' || !Number.isFinite(Date.parse(issuedAt))) {
    bad(t('deploy request: issuedAt must be an ISO time'));
  }
  if (typeof nonce !== 'string' || Buffer.from(nonce, 'base64url').length !== 16) {
    bad(t('deploy request: nonce must be 16 bytes in base64url'));
  }
  return { action, env, issuedAt, nonce, project, releaseId, serverId, sha256 };
}

export function signDeployRequest(input, { privateKey, env = process.env, dir } = {}) {
  const request = buildDeployRequest(input);
  let key;
  if (!privateKey) key = loadKey(dir || keysDir(env), env).key;
  else if (privateKey instanceof crypto.KeyObject) key = privateKey;
  else key = crypto.createPrivateKey(privateKey);
  if (key.asymmetricKeyType !== 'ed25519') {
    throw new DeployError(t('the signing key is not an Ed25519 key'), { code: 'bad_key' });
  }
  const signature = crypto
    .sign(null, Buffer.from(canonicalJson(request), 'utf8'), key)
    .toString('base64');
  return { request, signature, publicKey: rawPublicKey(key).toString('base64') };
}

export function verifyDeployRequest(envelope) {
  try {
    const { request: input, signature, publicKey } = envelope;
    const request = buildDeployRequest(input);
    const raw = Buffer.from(String(publicKey), 'base64');
    const sig = Buffer.from(String(signature), 'base64');
    if (raw.length !== 32 || sig.length !== 64) return false;
    const key = crypto.createPublicKey({
      key: Buffer.concat([ED25519_SPKI, raw]),
      format: 'der',
      type: 'spki',
    });
    return crypto.verify(null, Buffer.from(canonicalJson(request), 'utf8'), key, sig);
  } catch {
    return false;
  }
}

// "feature/Login page" -> "preview-feature-login-page"
export function previewEnv(branch) {
  const slug = String(branch ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[^a-z0-9]+/, '')
    .slice(0, 63)
    .replace(/[._-]+$/, '');
  const env = `preview-${slug}`;
  if (!slug || !DEPLOY_ENV.test(env)) {
    throw new DeployError(t('branch "{branch}" does not give a preview name', { branch }), {
      code: 'bad_request',
    });
  }
  return env;
}
