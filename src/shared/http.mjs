import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { t } from '../i18n/index.mjs';
import { VarionError } from './errors.mjs';

const REDIRECTS = new Set([301, 302, 303, 307, 308]);

export class HttpError extends VarionError {
  constructor(message, { code = 'http', status, cause } = {}) {
    super(message, { code, cause });
    if (status !== undefined) this.status = status;
  }
}

export function isLoopbackHost(hostname) {
  const host = String(hostname)
    .replace(/^\[|\]$/g, '')
    .toLowerCase();
  return host === 'localhost' || host === '::1' || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
}

export function checkUrl(text, what) {
  let url;
  try {
    url = text instanceof URL ? text : new URL(String(text));
  } catch {
    throw new HttpError(t('{what}: "{url}" is not a URL', { what, url: text }), {
      code: 'bad-url',
    });
  }
  if (url.username || url.password) {
    throw new HttpError(t('{what}: a password in the URL is not accepted', { what }), {
      code: 'bad-url',
    });
  }
  if (url.protocol === 'https:') return url;
  if (url.protocol === 'http:' && isLoopbackHost(url.hostname)) return url;
  throw new HttpError(
    t('{what}: https:// is required (http:// only for 127.0.0.1 and localhost): {origin}', {
      what,
      origin: url.origin,
    }),
    { code: 'bad-url' },
  );
}

function snippet(buffer) {
  const text = buffer.toString('utf8').replace(/\s+/g, ' ').trim();
  return text ? `- ${text.slice(0, 300)}` : '';
}

function send(url, { method = 'GET', headers = {}, body, timeoutMs = 30_000 }) {
  return new Promise((resolve, reject) => {
    const library = url.protocol === 'https:' ? https : http;
    const request = library.request(url, { method, headers, agent: false }, resolve);
    // idle timeout, not a total one
    request.setTimeout(timeoutMs, () => {
      request.destroy(
        new HttpError(
          t('{host}: no answer for {seconds} s', {
            host: url.host,
            seconds: Math.round(timeoutMs / 1000),
          }),
          { code: 'timeout' },
        ),
      );
    });
    request.on('error', (error) => {
      if (error instanceof VarionError) reject(error);
      else {
        reject(
          new HttpError(`${url.host}: ${error.code || error.message}`, {
            code: 'network',
            cause: error,
          }),
        );
      }
    });
    request.end(body);
  });
}

async function readBody(response, maxBytes) {
  const chunks = [];
  let total = 0;
  for await (const chunk of response) {
    total += chunk.length;
    if (total > maxBytes) {
      response.destroy();
      throw new HttpError(t('the answer is larger than {bytes} bytes', { bytes: maxBytes }), {
        code: 'too-big',
      });
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function follow(target, { method, headers, body, timeoutMs, redirects, what }) {
  let url = checkUrl(target, what);
  const currentHeaders = { ...headers };
  for (let hop = 0; ; hop++) {
    const response = await send(url, { method, headers: currentHeaders, body, timeoutMs });
    if (!REDIRECTS.has(response.statusCode) || !response.headers.location) return { url, response };
    response.resume();
    if (hop >= redirects) {
      throw new HttpError(t('{what}: too many redirects', { what }), { code: 'redirects' });
    }
    const next = checkUrl(new URL(response.headers.location, url), what);
    // never send the token to another origin
    if (next.origin !== url.origin) {
      for (const key of Object.keys(currentHeaders)) {
        if (key.toLowerCase() === 'authorization') delete currentHeaders[key];
      }
    }
    if (url.protocol === 'https:' && next.protocol === 'http:') {
      throw new HttpError(t('{what}: redirect from https to http', { what }), {
        code: 'redirects',
      });
    }
    url = next;
  }
}

function statusError(what, response, url, data) {
  return new HttpError(
    `${t('{what}: HTTP {status} {path}', { what, status: response.statusCode, path: url.pathname })} ${snippet(data)}`.trim(),
    { code: `http-${response.statusCode}`, status: response.statusCode },
  );
}

export async function request(
  target,
  {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 30_000,
    maxBytes = 16 << 20,
    redirects = 5,
    what = t('request'),
  } = {},
) {
  const { url, response } = await follow(target, {
    method,
    headers,
    body,
    timeoutMs,
    redirects,
    what,
  });
  const data = await readBody(response, maxBytes);
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw statusError(what, response, url, data);
  }
  return { status: response.statusCode, headers: response.headers, body: data };
}

export async function requestJson(
  target,
  { method = 'POST', headers = {}, json, timeoutMs, maxBytes = 4 << 20, redirects = 0, what } = {},
) {
  const body = json === undefined ? undefined : Buffer.from(JSON.stringify(json), 'utf8');
  const allHeaders = { accept: 'application/json', ...headers };
  if (body) {
    Object.assign(allHeaders, {
      'content-type': 'application/json',
      'content-length': String(body.length),
    });
  }
  const answer = await request(target, {
    method,
    headers: allHeaders,
    body,
    timeoutMs,
    maxBytes,
    redirects,
    what,
  });
  if (!answer.body.length) return null;
  try {
    return JSON.parse(answer.body.toString('utf8'));
  } catch {
    throw new HttpError(t('{what}: the answer is not JSON', { what }), { code: 'bad-json' });
  }
}

export async function download(
  target,
  file,
  {
    headers = {},
    maxBytes,
    expectedSize,
    stallMs = 60_000,
    redirects = 5,
    what = t('download'),
    onProgress,
  } = {},
) {
  const { url, response } = await follow(target, {
    method: 'GET',
    headers,
    timeoutMs: stallMs,
    redirects,
    what,
  });
  if (response.statusCode < 200 || response.statusCode >= 300) {
    const data = await readBody(response, 4096).catch(() => Buffer.alloc(0));
    throw statusError(what, response, url, data);
  }
  const declared =
    response.headers['content-length'] === undefined
      ? NaN
      : Number(response.headers['content-length']);
  if (Number.isFinite(declared)) {
    if (expectedSize !== undefined && declared !== expectedSize) {
      response.destroy();
      throw new HttpError(
        t('{what}: {size} bytes, expected {expected}', {
          what,
          size: declared,
          expected: expectedSize,
        }),
        { code: 'size' },
      );
    }
    if (maxBytes !== undefined && declared > maxBytes) {
      response.destroy();
      throw new HttpError(
        t('{what}: {size} bytes, over the limit of {limit}', {
          what,
          size: declared,
          limit: maxBytes,
        }),
        { code: 'too-big' },
      );
    }
  }
  const total = Number.isFinite(declared) ? declared : expectedSize || 0;
  const hash = crypto.createHash('sha256');
  let size = 0;
  // open before try: an existing file must stay untouched
  let fd;
  try {
    fd = fs.openSync(file, 'wx');
  } catch (error) {
    response.destroy();
    throw error;
  }
  const limit = new Transform({
    transform(chunk, _encoding, callback) {
      size += chunk.length;
      if (maxBytes !== undefined && size > maxBytes) {
        callback(
          new HttpError(t('{what}: over the limit of {limit} bytes', { what, limit: maxBytes }), {
            code: 'too-big',
          }),
        );
        return;
      }
      if (expectedSize !== undefined && size > expectedSize) {
        callback(
          new HttpError(
            t('{what}: more than the expected {expected} bytes', { what, expected: expectedSize }),
            {
              code: 'size',
            },
          ),
        );
        return;
      }
      hash.update(chunk);
      onProgress?.(size, total);
      callback(null, chunk);
    },
  });
  try {
    await pipeline(response, limit, fs.createWriteStream(null, { fd }));
    if (expectedSize !== undefined && size !== expectedSize) {
      throw new HttpError(
        t('{what}: received {size} bytes, expected {expected}', {
          what,
          size,
          expected: expectedSize,
        }),
        { code: 'size' },
      );
    }
  } catch (error) {
    fs.rmSync(file, { force: true, maxRetries: 5, retryDelay: 100 });
    if (error instanceof VarionError) throw error;
    throw new HttpError(`${what}: ${error.message}`, {
      code: error.code || 'download',
      cause: error,
    });
  }
  return { size, sha256: hash.digest('hex') };
}
