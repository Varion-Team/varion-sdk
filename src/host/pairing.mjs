import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { t } from '../i18n/index.mjs';
import { errorMessage } from '../shared/errors.mjs';
import { randomTag, readJson, renameWithRetry } from '../shared/fs.mjs';
import { checkUrl, requestJson } from '../shared/http.mjs';
import { windowsTool } from '../shared/process.mjs';
import { HOST_ID, HOST_VERSION, isPermanentRefusal } from './cabinet.mjs';
import { HostError } from './errors.mjs';

const POLL_S = 5;
const PAIR_CODE = /^[A-Za-z0-9-]{3,32}$/;
const SERVER_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const HOST_TOKEN = /^[A-Za-z0-9._-]{16,512}$/;
const SYSTEM_SID = 'S-1-5-18';
const ADMINISTRATORS_SID = 'S-1-5-32-544';

export function readHostToken(file) {
  let data;
  try {
    data = readJson(file, null);
  } catch (error) {
    throw new HostError(
      t('cannot read the host token {file}: {reason}', { file, reason: errorMessage(error) }),
      'bad-token-file',
    );
  }
  if (data === null) return null;
  const valid =
    data?.format === 1 &&
    typeof data.cabinet === 'string' &&
    typeof data.token === 'string' &&
    HOST_TOKEN.test(data.token);
  if (!valid) {
    throw new HostError(
      t('{file} is not a host token file (connect the machine again: varion host pair)', { file }),
      'bad-token-file',
    );
  }
  return {
    cabinet: data.cabinet,
    token: data.token,
    serverId:
      typeof data.serverId === 'string' && SERVER_ID.test(data.serverId) ? data.serverId : null,
    serverName: typeof data.serverName === 'string' ? data.serverName : '',
    pairedAt: typeof data.pairedAt === 'string' ? data.pairedAt : '',
  };
}

// ProgramData is readable by every user: the token stays with its owner, SYSTEM and Administrators
export function restrictToOwner(file, platform = process.platform) {
  if (platform !== 'win32') return true;
  const user = spawnSync(windowsTool('whoami.exe'), ['/user', '/fo', 'csv', '/nh'], {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 20_000,
  });
  const sid = /"(S-1-[0-9-]+)"\s*$/m.exec(user.stdout || '')?.[1];
  if (!sid) return false;
  const grants = [...new Set([sid, SYSTEM_SID, ADMINISTRATORS_SID])].map((id) => `*${id}:F`);
  const result = spawnSync(
    windowsTool('icacls.exe'),
    [file, '/inheritance:r', '/grant:r', ...grants],
    {
      windowsHide: true,
      stdio: 'ignore',
      timeout: 20_000,
    },
  );
  return result.status === 0;
}

export async function saveHostToken(
  file,
  { cabinet, token, serverId, serverName },
  now = new Date(),
) {
  const data = { format: 1, cabinet, serverId, serverName, token, pairedAt: now.toISOString() };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${randomTag()}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
  const restricted = restrictToOwner(temp);
  try {
    await renameWithRetry(temp, file);
  } catch (error) {
    fs.rmSync(temp, { force: true });
    throw error;
  }
  return restricted;
}

function abortable(promise, signal) {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    if (signal.aborted) onAbort();
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

function checkPair(answer) {
  const { pairId, code, pollSecret } = answer || {};
  const named = [pairId, pollSecret].every((value) => typeof value === 'string' && value);
  if (!named || typeof code !== 'string' || !PAIR_CODE.test(code)) {
    throw new HostError(t('the cabinet answered without a code for this machine'), 'bad-answer');
  }
  const expiresIn = Number(answer.expiresIn) > 0 ? Math.min(Number(answer.expiresIn), 3600) : 600;
  const { verifyUrl } = answer;
  const url = typeof verifyUrl === 'string' && /^https?:\/\//.test(verifyUrl) ? verifyUrl : null;
  const intervalMs = Math.min(30, Math.max(1, Number(answer.interval) || POLL_S)) * 1000;
  return { pairId, code, pollSecret, expiresIn, intervalMs, url };
}

function checkPaired(answer) {
  const { token, serverId } = answer;
  const valid =
    typeof token === 'string' &&
    HOST_TOKEN.test(token) &&
    typeof serverId === 'string' &&
    SERVER_ID.test(serverId);
  if (!valid) {
    throw new HostError(
      t('the cabinet connected the machine but sent no valid token or server id'),
      'bad-answer',
    );
  }
  const serverName = String(answer.serverName ?? '')
    .replace(/[\p{Cc}\p{Cf}]+/gu, ' ')
    .trim()
    .slice(0, 100);
  return { token, serverId, serverName };
}

export async function pairHost({ cabinetUrl, hostId, hostname, log, signal, pollMs }) {
  const base = checkUrl(cabinetUrl, '--cabinet');
  if (!HOST_ID.test(String(hostId || ''))) {
    throw new HostError(
      t('host id "{hostId}" is not valid: 1-64 characters A-Z a-z 0-9 . _ : -', { hostId }),
      'usage',
    );
  }
  const prefix = base.pathname.replace(/\/+$/, '');
  const call = (pathname, json) =>
    abortable(
      requestJson(new URL(`${prefix}${pathname}`, base.origin), {
        method: 'POST',
        headers: { 'user-agent': `varion-host/${HOST_VERSION}` },
        json,
        timeoutMs: 30_000,
        what: t('connecting the machine'),
      }),
      signal,
    );
  let failures = 0;
  for (;;) {
    let pair;
    try {
      pair = checkPair(
        await call('/api/host/pair/start', { hostId, hostname: String(hostname).slice(0, 64) }),
      );
      failures = 0;
    } catch (error) {
      if (signal?.aborted) throw error;
      if (error?.status === 404) {
        throw new HostError(
          t(
            'the cabinet {cabinet} does not connect machines by code: start the host with --token from the cabinet',
            { cabinet: base.origin },
          ),
          'no-pairing',
        );
      }
      if (isPermanentRefusal(error)) throw error;
      failures++;
      if (failures === 1 || failures % 10 === 0) {
        log.warn(
          t('the cabinet gave no code for this machine ({error}); retrying', {
            error: errorMessage(error),
          }),
          { failures },
          'pair-failed',
        );
      }
      await delay(Math.min(60_000, 2000 * 2 ** Math.min(failures - 1, 5)), undefined, { signal });
      continue;
    }
    const url = pair.url || `${base.origin}/cabinet`;
    log.info(
      t(
        'to connect this machine, enter the code {code} in the cabinet on the page of your server: {url} (the code is valid for {minutes} min)',
        { code: pair.code, url, minutes: Math.max(1, Math.round(pair.expiresIn / 60)) },
      ),
      { code: pair.code, url, expiresIn: pair.expiresIn },
      'pair-code',
    );
    const deadline = Date.now() + pair.expiresIn * 1000;
    while (Date.now() < deadline) {
      await delay(pollMs ?? pair.intervalMs, undefined, { signal });
      let answer;
      try {
        answer = await call('/api/host/pair/poll', {
          pairId: pair.pairId,
          pollSecret: pair.pollSecret,
        });
      } catch (error) {
        if (signal?.aborted) throw error;
        if (error?.status === 404) break;
        if (isPermanentRefusal(error)) throw error;
        continue;
      }
      if (answer?.status === 'paired') return checkPaired(answer);
      if (answer?.status === 'expired') break;
    }
    log.info(
      t('the code {code} is no longer valid; asking for a new one', { code: pair.code }),
      { code: pair.code },
      'pair-expired',
    );
  }
}
