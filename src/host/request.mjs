import crypto from 'node:crypto';
import { t } from '../i18n/index.mjs';
import { readJson, writeJsonAtomic } from '../shared/fs.mjs';
import { RequestRejected } from './errors.mjs';
import { decodeBase64, findTrusted } from './keys.mjs';

export const REQUEST_FIELDS = Object.freeze([
  'action',
  'env',
  'issuedAt',
  'nonce',
  'project',
  'releaseId',
  'serverId',
  'sha256',
]);
export const MAX_AGE_MS = 10 * 60 * 1000;
// the cabinet allows the same skew
export const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
// stands for the server the host token belongs to
export const PREVIEW_SERVER = 'preview';

export const ENV_PATTERN = /^(test|prod|preview-[a-z0-9][a-z0-9._-]{0,62})$/;
const PROJECT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const RELEASE_ID = /^\d{8}-\d{6}-[0-9a-f]{8}$/;
const SERVER_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const ISO_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/;

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

// the signed fields only: the cabinet may add its own
export function canonicalRequest(request) {
  const picked = {};
  for (const field of REQUEST_FIELDS) picked[field] = request[field];
  return canonicalJson(picked);
}

const reject = (message, code = 'bad-request') => {
  throw new RequestRejected(message, code);
};

export function checkRequestFields(request) {
  if (!request || typeof request !== 'object' || Array.isArray(request))
    reject(t('the deploy request has no "request" object'));
  for (const field of REQUEST_FIELDS) {
    if (typeof request[field] !== 'string' || !request[field])
      reject(t('the deploy request has no "{field}" field', { field }));
  }
  const { action, env, issuedAt, nonce, project, releaseId, serverId, sha256 } = request;
  if (action !== 'activate' && action !== 'rollback')
    reject(t('action "{action}" is not valid: expected activate or rollback', { action }));
  if (!ENV_PATTERN.test(env))
    reject(t('environment "{env}" is not valid: expected test, prod or preview-<branch>', { env }));
  if (!PROJECT.test(project)) {
    reject(
      t('project "{project}" is not valid: up to 64 Latin letters, digits and . _ -', { project }),
    );
  }
  if (!RELEASE_ID.test(releaseId)) {
    reject(
      t('release id "{releaseId}" is not valid: expected YYYYMMDD-hhmmss-<8 hex digits>', {
        releaseId,
      }),
    );
  }
  if (!SERVER_ID.test(serverId)) reject(t('server id "{serverId}" is not valid', { serverId }));
  if (!SHA256.test(sha256))
    reject(t('the bundle SHA-256 is not valid: expected 64 lowercase hex digits'));
  if (!ISO_TIME.test(issuedAt) || !Number.isFinite(Date.parse(issuedAt)))
    reject(t('issuedAt "{issuedAt}" is not an ISO 8601 time', { issuedAt }));
  if (!/^[A-Za-z0-9_-]{22}(==)?$/.test(nonce) || decodeBase64(nonce, 16) === null)
    reject(t('the nonce is not valid: expected the base64url of 16 bytes'));
  if (serverId === PREVIEW_SERVER && !env.startsWith('preview-'))
    reject(t('server id "preview" is only for preview-<branch> environments'));
  const clean = {};
  for (const field of REQUEST_FIELDS) clean[field] = request[field];
  return clean;
}

// the nonce is the caller's to check, once the signature holds
export function verifySignedRequest(signed, { trusted, now = Date.now() }) {
  if (!signed || typeof signed !== 'object') reject(t('the deploy request is empty'));
  const request = checkRequestFields(signed.request);
  const raw = decodeBase64(signed.publicKey, 32);
  if (!raw) reject(t('the request key is not valid: expected the base64 of 32 bytes'), 'bad-key');
  const signer = findTrusted(trusted, raw);
  if (!signer) {
    reject(
      t('key {key} is not trusted on this host (varion host trust <key>)', {
        key: raw.toString('base64'),
      }),
      'untrusted-key',
    );
  }
  const signature = decodeBase64(signed.signature, 64);
  if (!signature) {
    reject(
      t('the request signature is not valid: expected the base64 of 64 bytes'),
      'bad-signature',
    );
  }
  const message = Buffer.from(canonicalRequest(request), 'utf8');
  if (!crypto.verify(null, message, signer.key, signature)) {
    reject(
      t('the request signature does not match (key "{name}")', { name: signer.name }),
      'bad-signature',
    );
  }
  const issuedAtMs = Date.parse(request.issuedAt);
  if (now - issuedAtMs > MAX_AGE_MS) {
    reject(
      t('the request is too old: signed {minutes} min ago, accepted up to {limit} min', {
        minutes: Math.round((now - issuedAtMs) / 60_000),
        limit: MAX_AGE_MS / 60_000,
      }),
      'stale',
    );
  }
  if (issuedAtMs - now > MAX_CLOCK_SKEW_MS) {
    reject(
      t(
        'the request is from the future: signed {seconds} s ahead of the host clock (up to {limit} min is accepted); check the clocks',
        {
          seconds: Math.round((issuedAtMs - now) / 1000),
          limit: MAX_CLOCK_SKEW_MS / 60_000,
        },
      ),
      'future',
    );
  }
  return { request, signer, issuedAtMs };
}

export class NonceStore {
  // kept while a request could still pass, plus an hour for clock steps
  constructor(file, { retentionMs = MAX_AGE_MS + MAX_CLOCK_SKEW_MS + 60 * 60 * 1000 } = {}) {
    this.file = file;
    this.retentionMs = retentionMs;
    const data = readJson(file, { format: 1, nonces: {} });
    if (
      !data ||
      data.format !== 1 ||
      !data.nonces ||
      typeof data.nonces !== 'object' ||
      Array.isArray(data.nonces)
    ) {
      throw new RequestRejected(
        t('{file}: the list of used nonces is damaged; the host will not run without it', {
          file,
        }),
        'bad-nonce-store',
      );
    }
    this.nonces = new Map(Object.entries(data.nonces));
  }

  get(nonce) {
    return this.nonces.get(nonce) || null;
  }

  add(nonce, record) {
    this.nonces.set(nonce, record);
    this.save();
  }

  prune(now = Date.now()) {
    let removed = 0;
    for (const [nonce, record] of this.nonces) {
      if (Number(record.issuedAt) + this.retentionMs < now) {
        this.nonces.delete(nonce);
        removed++;
      }
    }
    if (removed) this.save();
    return removed;
  }

  save() {
    writeJsonAtomic(
      this.file,
      { format: 1, nonces: Object.fromEntries(this.nonces) },
      { mode: 0o600 },
    );
  }
}
