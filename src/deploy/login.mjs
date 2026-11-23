import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { text } from '../shared/format.mjs';
import { ensureDir, sleep, tryReadJson, writeJsonAtomic } from '../shared/fs.mjs';
import { DeployError } from './errors.mjs';
import { configDir, keyFingerprint } from './keys.mjs';
import { cabinetBase, endpoint, refusal, send, withRetries } from './transport.mjs';

export const CLI_TOKEN = /^varion_cli_[0-9a-f]{64}$/;
const LOGIN_FILE = 'login.json';
const LOGIN_POLL_S = 5;

const isWebUrl = (value) => {
  try {
    const { protocol } = new URL(String(value));
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
};

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

export function checkCliToken(token) {
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
