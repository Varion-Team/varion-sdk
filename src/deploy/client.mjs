import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { VarionError } from '../shared/errors.mjs';
import { formatBytes } from '../shared/format.mjs';
import {
  ensureDir,
  sha256 as sha256Hex,
  sha256File,
  sleep,
  tryReadJson,
  utcStamp,
  writeJsonAtomic,
} from '../shared/fs.mjs';
import { isLoopbackHost } from '../shared/http.mjs';

export const DEPLOY_ENV = /^(test|prod|preview-[a-z0-9][a-z0-9._-]{0,62})$/;
export const RELEASE_ID = /^\d{8}-\d{6}-[0-9a-f]{8}$/;
export const DEPLOY_TOKEN = /^varion_(dev|cli)_[0-9a-f]{64}$/;
export const CLI_TOKEN = /^varion_cli_[0-9a-f]{64}$/;
const PROJECT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const SERVER_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const FINAL = new Set(['active', 'failed', 'rolled-back']);
const KEY_VARIABLE = 'VARION_DEPLOY_KEY';
const PRIVATE_FILE = 'deploy-ed25519.pem';
const PUBLIC_FILE = 'deploy-ed25519.pub';
const LOGIN_FILE = 'login.json';
const ED25519_SPKI = Buffer.from('302a300506032b6570032100', 'hex');
const MAX_ANSWER_BYTES = 4 * 1024 * 1024;
const RETRY_DELAYS_MS = [1_000, 3_000, 8_000];
const LOGIN_POLL_S = 5;

export class DeployError extends VarionError {
  constructor(message, { code = 'deploy_failed', status = 0, data, cause } = {}) {
    super(message, { code, cause });
    this.status = status;
    this.exitCode = 1;
    if (data !== undefined) this.data = data;
  }
}

// ---- developer key ----

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

const rawPublicKey = (key) =>
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

function loadKey(dir, env) {
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
  } catch {}
  try {
    fs.writeFileSync(publicKeyPath, `${publicKey}\n`);
  } catch {}
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

// ---- signed request ----

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new TypeError('not representable in JSON');
  }
  return JSON.stringify(value);
}

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

export function signDeployRequest(request, { privateKey, env = process.env, dir } = {}) {
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

export function verifyDeployRequest({ request, signature, publicKey }) {
  try {
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

// ---- http ----

function endpoint(cabinetUrl, pathname, { allowInsecureHttp = false } = {}) {
  let base;
  try {
    base = new URL(String(cabinetUrl));
  } catch {
    throw new DeployError(t('cabinet address "{url}" is not a URL', { url: cabinetUrl }), {
      code: 'bad_url',
    });
  }
  if (base.protocol !== 'https:' && base.protocol !== 'http:') {
    throw new DeployError(t('cabinet address "{url}" needs https://', { url: cabinetUrl }), {
      code: 'bad_url',
    });
  }
  if (base.username || base.password) {
    throw new DeployError(t('a cabinet address may not carry a user name or a password'), {
      code: 'bad_url',
    });
  }
  const plain = base.protocol === 'http:' && !isLoopbackHost(base.hostname);
  if (plain && !allowInsecureHttp && process.env.VARION_DEPLOY_ALLOW_HTTP !== '1') {
    throw new DeployError(
      t(
        'http:// is only for a cabinet on this computer: {host} needs https://, or the token would travel in clear text',
        { host: base.host },
      ),
      { code: 'insecure_url' },
    );
  }
  return new URL(`${base.pathname.replace(/\/+$/, '')}${pathname}`, base.origin);
}

const serverPath = (serverId) => `/api/panel/servers/${encodeURIComponent(serverId)}`;

function checkTarget({ serverId, token }) {
  if (typeof serverId !== 'string' || !SERVER_ID.test(serverId)) {
    throw new DeployError(
      t('server "{serverId}" must be a cabinet server number (or preview)', { serverId }),
      { code: 'bad_request' },
    );
  }
  if (typeof token !== 'string' || !DEPLOY_TOKEN.test(token)) {
    throw new DeployError(
      t(
        "the developer token (VARION_DEPLOY_TOKEN) must look like varion_dev_...: the server's cabinet issues it",
      ),
      { code: 'bad_token' },
    );
  }
}

// resolves with any answer, rejects only when the cabinet is out of reach
function send({
  url,
  method = 'GET',
  token,
  headers = {},
  json,
  file,
  idleMs = 60_000,
  onProgress,
}) {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === 'https:' ? https : http;
    const all = {
      Accept: 'application/json',
      'User-Agent': `varion-deploy-client/1 node/${process.versions.node}`,
      ...headers,
    };
    if (token) all.Authorization = `Bearer ${token}`;
    let payload = null;
    if (json !== undefined) {
      payload = Buffer.from(JSON.stringify(json), 'utf8');
      all['Content-Type'] = 'application/json';
      all['Content-Length'] = String(payload.length);
    }
    if (file) all['Content-Length'] = String(file.size);
    let settled = false;
    let answered = false;
    const settle = (fn, value) => {
      if (!settled) {
        settled = true;
        fn(value);
      }
    };
    const networkError = (message) => new DeployError(message, { code: 'network' });
    const req = transport.request(url, { method, headers: all }, (res) => {
      answered = true;
      const chunks = [];
      let size = 0;
      res.on('data', (chunk) => {
        size += chunk.length;
        if (size <= MAX_ANSWER_BYTES) chunks.push(chunk);
      });
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let body = null;
        try {
          body = text ? JSON.parse(text) : null;
        } catch {}
        settle(resolve, { status: res.statusCode, headers: res.headers, body, text });
      });
      res.on('error', (error) => {
        const reason = error.message;
        settle(
          reject,
          networkError(
            t('the cabinet {host} broke off its answer: {reason}', { host: url.host, reason }),
          ),
        );
      });
    });
    req.setTimeout(idleMs, () => {
      const seconds = Math.round(idleMs / 1000);
      req.destroy(
        networkError(t('{host}: no answer for {seconds} s', { host: url.host, seconds })),
      );
    });
    // a refusal may come before the whole upload was read, and then it is the answer
    req.on('error', (error) => {
      if (answered) return;
      const reason = error.message;
      settle(
        reject,
        error instanceof DeployError
          ? error
          : networkError(
              t('the cabinet {host} is out of reach: {reason}', { host: url.host, reason }),
            ),
      );
    });
    if (file) {
      const stream = fs.createReadStream(file.path);
      let sent = 0;
      stream.on('data', (chunk) => {
        sent += chunk.length;
        if (onProgress) onProgress({ sent, total: file.size });
      });
      stream.on('error', (error) => req.destroy(error));
      req.on('close', () => stream.destroy());
      stream.pipe(req);
    } else {
      req.end(payload || undefined);
    }
  });
}

function refusal(answer, what) {
  const body = answer.body && typeof answer.body === 'object' ? answer.body : {};
  const said =
    typeof body.error === 'string' && body.error
      ? body.error
      : (answer.text || '').trim().slice(0, 200);
  const reason = said || t('the cabinet answered HTTP {status}', { status: answer.status });
  return new DeployError(`${what}: ${reason}`, {
    code: typeof body.code === 'string' && body.code ? body.code : `http_${answer.status}`,
    status: answer.status,
    data: body,
  });
}

const retryable = (answerOrError) =>
  answerOrError instanceof DeployError
    ? answerOrError.code === 'network'
    : [429, 502, 503, 504].includes(answerOrError.status);

const retryDelay = (attempt) => RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];

async function withRetries(exchange, retries = 2) {
  for (let attempt = 0; ; attempt++) {
    let outcome;
    try {
      outcome = await exchange();
    } catch (error) {
      if (!(error instanceof DeployError) || !retryable(error) || attempt >= retries) throw error;
      await sleep(retryDelay(attempt));
      continue;
    }
    if (!retryable(outcome) || attempt >= retries) return outcome;
    const after = Number(outcome.headers && outcome.headers['retry-after']);
    await sleep(
      Number.isFinite(after) && after > 0 ? Math.min(after, 60) * 1000 : retryDelay(attempt),
    );
  }
}

// ---- cabinet ----

export async function listReleases({
  cabinetUrl,
  serverId,
  token,
  retries = 2,
  allowInsecureHttp = false,
}) {
  checkTarget({ serverId, token });
  const url = endpoint(cabinetUrl, `${serverPath(serverId)}/releases`, { allowInsecureHttp });
  const answer = await withRetries(() => send({ url, token }), retries);
  if (answer.status !== 200 || !answer.body || typeof answer.body !== 'object') {
    throw refusal(answer, t('cannot list the releases'));
  }
  return answer.body;
}

export async function uploadRelease({
  cabinetUrl,
  serverId,
  token,
  bundlePath,
  onProgress,
  retries = 2,
  allowInsecureHttp = false,
}) {
  checkTarget({ serverId, token });
  let stat;
  try {
    stat = fs.statSync(bundlePath);
  } catch {
    throw new DeployError(t('no release bundle at {file}', { file: bundlePath }), {
      code: 'no_bundle',
    });
  }
  if (!stat.isFile() || stat.size === 0) {
    throw new DeployError(t('{file} is not a release bundle', { file: bundlePath }), {
      code: 'no_bundle',
    });
  }
  const { sha256 } = await sha256File(bundlePath);
  // a refused token or server shows up before a byte of the bundle is sent
  const listed = await listReleases({ cabinetUrl, serverId, token, retries, allowInsecureHttp });
  const known = (Array.isArray(listed.releases) ? listed.releases : []).find(
    (release) => release && release.sha256 === sha256 && release.stored !== false,
  );
  if (known) {
    return {
      releaseId: known.releaseId,
      sha256,
      size: stat.size,
      project: known.project,
      env: known.env,
      existing: true,
    };
  }
  const limit = listed.limits && Number(listed.limits.maxBundleBytes);
  if (limit && stat.size > limit) {
    throw new DeployError(
      t(
        'the release is {size}, over the cabinet limit of {limit}: put big packs in assets, the host downloads them by hash',
        { size: formatBytes(stat.size), limit: formatBytes(limit) },
      ),
      { code: 'too_large' },
    );
  }
  const url = endpoint(cabinetUrl, `${serverPath(serverId)}/releases`, { allowInsecureHttp });
  const answer = await withRetries(
    () =>
      send({
        url,
        method: 'POST',
        token,
        headers: { 'Content-Type': 'application/zip', 'X-Varion-Release-Sha256': sha256 },
        file: { path: bundlePath, size: stat.size },
        idleMs: 120_000,
        onProgress,
      }),
    retries,
  );
  if (answer.status !== 200 && answer.status !== 201) {
    throw refusal(answer, t('the release was not uploaded'));
  }
  const body = answer.body || {};
  if (body.sha256 !== sha256) {
    throw new DeployError(
      t('the cabinet confirmed SHA-256 {confirmed}, but the bundle has {sha256}', {
        confirmed: body.sha256,
        sha256,
      }),
      { code: 'sha256_mismatch' },
    );
  }
  return {
    releaseId: body.releaseId,
    sha256,
    size: Number(body.size) || stat.size,
    project: body.project,
    env: body.env,
    existing: !!body.existing,
  };
}

// a rollback names the active release, and the host goes back to the one before it
export async function requestDeploy({
  cabinetUrl,
  serverId,
  token,
  action = 'activate',
  env,
  project,
  releaseId,
  sha256,
  keysDir: dir,
  privateKey,
  allowInsecureHttp = false,
}) {
  checkTarget({ serverId, token });
  const request = buildDeployRequest({ action, env, project, releaseId, serverId, sha256 });
  const body = signDeployRequest(request, { privateKey, dir });
  const url = endpoint(cabinetUrl, `${serverPath(serverId)}/deploys`, { allowInsecureHttp });
  const accepted = (deployId, status) => ({
    deployId,
    status,
    request,
    publicKey: body.publicKey,
    fingerprint: keyFingerprint(body.publicKey),
  });
  let answer;
  let resent = false;
  try {
    answer = await send({ url, method: 'POST', token, json: body });
  } catch (error) {
    if (!(error instanceof DeployError) || error.code !== 'network') throw error;
    // the answer may be what got lost; a resend is refused as a replay and found by nonce
    await sleep(RETRY_DELAYS_MS[0]);
    answer = await send({ url, method: 'POST', token, json: body });
    resent = true;
  }
  if (answer.status === 409 && answer.body && answer.body.code === 'replay' && resent) {
    const list = await withRetries(() => send({ url, token }));
    const found =
      list.status === 200 && Array.isArray(list.body && list.body.deploys)
        ? list.body.deploys.find((deploy) => deploy.nonce === request.nonce)
        : null;
    if (found) return accepted(found.deployId, found.status);
  }
  if (answer.status !== 202 && answer.status !== 201 && answer.status !== 200) {
    throw refusal(answer, t('the deploy request was refused'));
  }
  const deployId = answer.body && answer.body.deployId;
  if (typeof deployId !== 'string' || !deployId) {
    throw new DeployError(t('the cabinet accepted the request but named no deployId'), {
      code: 'bad_answer',
    });
  }
  return accepted(deployId, answer.body.status || 'queued');
}

export async function getDeploy({
  cabinetUrl,
  serverId,
  token,
  deployId,
  allowInsecureHttp = false,
}) {
  checkTarget({ serverId, token });
  if (typeof deployId !== 'string' || !deployId) {
    throw new DeployError(t('no deployId'), { code: 'bad_request' });
  }
  const url = endpoint(
    cabinetUrl,
    `${serverPath(serverId)}/deploys/${encodeURIComponent(deployId)}`,
    { allowInsecureHttp },
  );
  const answer = await withRetries(() => send({ url, token }));
  if (answer.status !== 200 || !answer.body || typeof answer.body.status !== 'string') {
    throw refusal(answer, t('cannot read the deploy status'));
  }
  return { ...answer.body, phase: answer.body.status };
}

export async function waitDeploy({
  cabinetUrl,
  serverId,
  token,
  deployId,
  onStatus,
  intervalMs = 2_000,
  timeoutMs = 20 * 60_000,
  allowInsecureHttp = false,
}) {
  const started = Date.now();
  let last = '';
  let seen = null;
  for (;;) {
    let status = null;
    try {
      status = await getDeploy({ cabinetUrl, serverId, token, deployId, allowInsecureHttp });
    } catch (error) {
      // a cabinet out of reach for a moment does not end the wait, a refusal does
      const passing =
        error instanceof DeployError &&
        (error.code === 'network' || error.status >= 500 || error.status === 429);
      if (!passing) throw error;
    }
    if (status) {
      seen = status;
      if (status.status === 'queued' && status.hostOnline === false) {
        status.hint = t("the server's host is offline: the request waits for it up to 10 minutes");
      }
      const shape = [status.status, status.error, status.link, status.hostOnline].join('|');
      if (shape !== last) {
        last = shape;
        if (onStatus) onStatus(status);
      }
      if (FINAL.has(status.status)) return status;
    }
    if (Date.now() - started > timeoutMs) {
      const minutes = Math.round(timeoutMs / 60_000);
      const message = seen
        ? t(
            "deploy {deployId} did not finish in {minutes} min (now: {status}); follow it in the server's cabinet",
            { deployId, minutes, status: seen.status },
          )
        : t('deploy {deployId}: no status from the cabinet in {minutes} min', {
            deployId,
            minutes,
          });
      throw new DeployError(message, { code: 'timeout', data: seen || undefined });
    }
    await sleep(intervalMs);
  }
}

export async function deployRelease({
  cabinetUrl,
  serverId,
  token,
  bundlePath,
  action = 'activate',
  wait = true,
  onProgress,
  onStatus,
  keysDir: dir,
  privateKey,
  timeoutMs,
  intervalMs,
  allowInsecureHttp = false,
}) {
  const upload = await uploadRelease({
    cabinetUrl,
    serverId,
    token,
    bundlePath,
    onProgress,
    allowInsecureHttp,
  });
  const requested = await requestDeploy({
    cabinetUrl,
    serverId,
    token,
    action,
    env: upload.env,
    project: upload.project,
    releaseId: upload.releaseId,
    sha256: upload.sha256,
    keysDir: dir,
    privateKey,
    allowInsecureHttp,
  });
  if (!wait) return { upload, deployId: requested.deployId, final: null };
  const final = await waitDeploy({
    cabinetUrl,
    serverId,
    token,
    deployId: requested.deployId,
    onStatus,
    ...(timeoutMs ? { timeoutMs } : {}),
    ...(intervalMs ? { intervalMs } : {}),
    allowInsecureHttp,
  });
  return { upload, deployId: requested.deployId, final };
}

// ---- sign-in ----

const text = (value) =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : '';

const isWebUrl = (value) => {
  try {
    const { protocol } = new URL(String(value));
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
};

export function cabinetBase(cabinetUrl, { allowInsecureHttp = false } = {}) {
  const url = endpoint(cabinetUrl, '', { allowInsecureHttp });
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
}

export function loginFile(env = process.env) {
  return path.join(configDir(env), LOGIN_FILE);
}

function readLogins(env) {
  const data = tryReadJson(loginFile(env), null);
  const cabinets = data?.format === 1 ? data.cabinets : null;
  if (!cabinets || typeof cabinets !== 'object' || Array.isArray(cabinets)) {
    return { format: 1, cabinets: {} };
  }
  return { format: 1, cabinets };
}

export function savedLogin(cabinetUrl, { env = process.env } = {}) {
  const { cabinets } = readLogins(env);
  const base = cabinetBase(cabinetUrl);
  const entry = Object.hasOwn(cabinets, base) ? cabinets[base] : null;
  return entry && typeof entry.token === 'string' && CLI_TOKEN.test(entry.token) ? entry : null;
}

export function saveLogin(
  cabinetUrl,
  { token, account },
  { env = process.env, now = new Date() } = {},
) {
  const logins = readLogins(env);
  logins.cabinets[cabinetBase(cabinetUrl)] = { token, account, signedInAt: now.toISOString() };
  ensureDir(configDir(env), 0o700);
  writeJsonAtomic(loginFile(env), logins, { mode: 0o600 });
}

export function forgetLogin(cabinetUrl, { env = process.env } = {}) {
  const logins = readLogins(env);
  const base = cabinetBase(cabinetUrl);
  if (!Object.hasOwn(logins.cabinets, base)) return false;
  delete logins.cabinets[base];
  if (Object.keys(logins.cabinets).length) {
    writeJsonAtomic(loginFile(env), logins, { mode: 0o600 });
  } else {
    fs.rmSync(loginFile(env), { force: true });
  }
  return true;
}

function checkCliToken(token) {
  if (typeof token !== 'string' || !CLI_TOKEN.test(token)) {
    throw new DeployError(
      t('the sign-in token must look like varion_cli_...: sign in again with varion login'),
      { code: 'bad_token' },
    );
  }
}

function approvedLogin(body) {
  if (typeof body.token !== 'string' || !CLI_TOKEN.test(body.token)) {
    throw new DeployError(t('the cabinet confirmed the sign-in but sent no varion_cli_... token'), {
      code: 'bad_answer',
    });
  }
  return {
    token: body.token,
    account: { id: text(body.account?.id), name: text(body.account?.name) },
  };
}

export async function signIn({ cabinetUrl, name, onCode, intervalMs, allowInsecureHttp = false }) {
  const startUrl = endpoint(cabinetUrl, '/api/cli/login/start', { allowInsecureHttp });
  const pollUrl = endpoint(cabinetUrl, '/api/cli/login/poll', { allowInsecureHttp });
  const started = await withRetries(() => send({ url: startUrl, method: 'POST', json: { name } }));
  if (started.status !== 200 && started.status !== 201) {
    throw refusal(started, t('the cabinet did not start the sign-in'));
  }
  const { deviceId, userCode, verifyUrl, pollSecret, expiresIn, interval } = started.body || {};
  const named = [deviceId, userCode, pollSecret].every(
    (value) => typeof value === 'string' && value,
  );
  if (!named || !isWebUrl(verifyUrl)) {
    throw new DeployError(t('the cabinet started the sign-in but gave no code to confirm'), {
      code: 'bad_answer',
    });
  }
  const lifetimeS = Number(expiresIn) > 0 ? Number(expiresIn) : 600;
  let waitMs = intervalMs ?? Math.min(30, Math.max(1, Number(interval) || LOGIN_POLL_S)) * 1000;
  if (onCode) await onCode({ userCode, verifyUrl, expiresIn: lifetimeS });
  const deadline = Date.now() + lifetimeS * 1000;
  while (Date.now() < deadline) {
    await sleep(waitMs);
    let answer;
    try {
      answer = await send({ url: pollUrl, method: 'POST', json: { deviceId, pollSecret } });
    } catch (error) {
      if (error instanceof DeployError && error.code === 'network') continue;
      throw error;
    }
    if (answer.status === 429) {
      waitMs = Math.min(waitMs + 5_000, 60_000);
      continue;
    }
    if (answer.status >= 500) continue;
    if (answer.status !== 200) throw refusal(answer, t('the sign-in failed'));
    const body = answer.body || {};
    if (body.status === 'approved') return approvedLogin(body);
    if (body.status === 'denied') {
      throw new DeployError(t('the sign-in was declined in the cabinet'), { code: 'login_denied' });
    }
    if (body.status === 'expired') break;
    if (body.status !== 'pending') {
      throw new DeployError(
        t('the cabinet answered the sign-in with "{status}"', { status: text(body.status) }),
        { code: 'bad_answer' },
      );
    }
  }
  throw new DeployError(t('the code was not confirmed in time: run varion login again'), {
    code: 'login_expired',
  });
}

export async function registerKey({
  cabinetUrl,
  token,
  publicKey,
  name,
  allowInsecureHttp = false,
}) {
  checkCliToken(token);
  const url = endpoint(cabinetUrl, '/api/cli/keys', { allowInsecureHttp });
  const answer = await withRetries(() =>
    send({ url, method: 'POST', token, json: { publicKey, name } }),
  );
  if (answer.status !== 200 && answer.status !== 201) {
    throw refusal(answer, t('the developer key was not registered'));
  }
  const key = answer.body?.key || {};
  return { id: text(key.id), fingerprint: text(key.fingerprint) || keyFingerprint(publicKey) };
}

export async function getAccount({ cabinetUrl, token, allowInsecureHttp = false }) {
  checkCliToken(token);
  const url = endpoint(cabinetUrl, '/api/cli/me', { allowInsecureHttp });
  const answer = await withRetries(() => send({ url, token }));
  const body = answer.body;
  if (answer.status !== 200 || !body || typeof body !== 'object') {
    throw refusal(answer, t('cannot read the account'));
  }
  const servers = Array.isArray(body.servers) ? body.servers : [];
  return {
    account: { id: text(body.account?.id), name: text(body.account?.name) },
    servers: servers
      .filter((server) => server && typeof server === 'object')
      .map((server) => ({
        id: text(server.id),
        name: text(server.name),
        deployTest: server.deployTest === true,
        deployProd: server.deployProd === true,
      })),
  };
}
