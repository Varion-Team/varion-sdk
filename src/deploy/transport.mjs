import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { t } from '../i18n/index.mjs';
import { SERVER_ID } from '../shared/deploy-format.mjs';
import { sleep } from '../shared/fs.mjs';
import { isLoopbackHost } from '../shared/http.mjs';
import { DeployError } from './errors.mjs';

export const DEPLOY_TOKEN = /^varion_(dev|cli)_[0-9a-f]{64}$/;
const MAX_ANSWER_BYTES = 4 * 1024 * 1024;
export const RETRY_DELAYS_MS = [1_000, 3_000, 8_000];

export function endpoint(cabinetUrl, pathname, { allowInsecureHttp = false } = {}) {
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

export const serverPath = (serverId) => `/api/panel/servers/${encodeURIComponent(serverId)}`;

export function checkTarget({ serverId, token }) {
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

function parseJson(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

// An answer over the limit is cut short, and then it no longer parses as JSON.
async function readAnswer(res, maxBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of res) {
    size += chunk.length;
    if (size <= maxBytes) chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return { status: res.statusCode, headers: res.headers, body: parseJson(text), text };
}

function upload(file, req, onProgress, reject) {
  const stream = file.open ? file.open() : fs.createReadStream(file.path);
  let sent = 0;
  stream.on('data', (chunk) => {
    sent += chunk.length;
    try {
      onProgress?.({ sent, total: file.size });
    } catch (error) {
      reject(error);
      stream.destroy();
      req.destroy();
    }
  });
  stream.on('error', (error) => req.destroy(error));
  req.on('close', () => stream.destroy());
  stream.pipe(req);
}

// Resolves with any answer; rejects only when the cabinet is out of reach.
export function send({
  url,
  method = 'GET',
  token,
  headers = {},
  json,
  file,
  idleMs = 60_000,
  maxAnswerBytes = MAX_ANSWER_BYTES,
  onProgress,
}) {
  const payload = json === undefined ? null : Buffer.from(JSON.stringify(json), 'utf8');
  const all = {
    Accept: 'application/json',
    'User-Agent': `varion-deploy-client/1 node/${process.versions.node}`,
    ...headers,
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(payload && { 'Content-Type': 'application/json', 'Content-Length': payload.length }),
    ...(file && { 'Content-Length': file.size }),
  };
  const { promise, resolve, reject } = Promise.withResolvers();
  const unreachable = (message) => new DeployError(message, { code: 'network' });
  const { host } = url;
  let answered = false;
  const transport = url.protocol === 'https:' ? https : http;
  const req = transport.request(url, { method, headers: all }, (res) => {
    answered = true;
    readAnswer(res, maxAnswerBytes).then(resolve, (error) =>
      reject(
        unreachable(
          t('the cabinet {host} broke off its answer: {reason}', { host, reason: error.message }),
        ),
      ),
    );
  });
  req.setTimeout(idleMs, () => {
    const seconds = Math.round(idleMs / 1000);
    req.destroy(unreachable(t('{host}: no answer for {seconds} s', { host, seconds })));
  });
  req.on('error', (error) => {
    // a refusal may come before the whole upload was read, and then it is the answer
    if (answered) return;
    reject(
      error instanceof DeployError
        ? error
        : unreachable(
            t('the cabinet {host} is out of reach: {reason}', { host, reason: error.message }),
          ),
    );
  });
  if (file) upload(file, req, onProgress, reject);
  else req.end(payload ?? undefined);
  return promise;
}

export function refusal(answer, what) {
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

export async function withRetries(exchange, retries = 2) {
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

export function cabinetBase(cabinetUrl, { allowInsecureHttp = false } = {}) {
  const url = endpoint(cabinetUrl, '', { allowInsecureHttp });
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
}
