import { t } from '../i18n/index.mjs';
import { checkUrl, download, requestJson } from '../shared/http.mjs';
import { HostError } from './errors.mjs';
import { cabinetTrust } from './keys.mjs';

export const HOST_VERSION = '1.0.0';
export const HOST_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;
const MAX_ITEMS = 32;
const POLL_WAIT_S = 25;

const text = (value) =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : '';

export function cabinetAddress(url) {
  const parsed = checkUrl(url, '--cabinet');
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
}

export function normalizePollItems(data) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.deploys)
      ? data.deploys
      : Array.isArray(data?.requests)
        ? data.requests
        : Array.isArray(data?.items)
          ? data.items
          : [];
  return list.slice(0, MAX_ITEMS).map((item) => {
    const signed =
      item && typeof item.signed === 'object' && item.signed ? item.signed : item || {};
    const size = Number(item?.release?.size);
    return {
      deployId: text(item?.deployId ?? item?.id ?? signed.deployId),
      request: signed.request,
      signature: signed.signature,
      publicKey: signed.publicKey,
      // a hint only: not signed
      sizeHint: Number.isSafeInteger(size) && size > 0 ? size : null,
    };
  });
}

export class Cabinet {
  constructor({ url, token, hostId }) {
    this.base = checkUrl(url, '--cabinet');
    if (!token || /\s/.test(token)) {
      throw new HostError(
        t('a host token is required: --token, --token-file or VARION_HOST_TOKEN'),
        'no-token',
      );
    }
    if (!HOST_ID.test(String(hostId || ''))) {
      throw new HostError(
        t('host id "{hostId}" is not valid: 1-64 characters A-Z a-z 0-9 . _ : -', { hostId }),
        'usage',
      );
    }
    this.token = token;
    this.hostId = hostId;
  }

  endpoint(pathname) {
    const prefix = this.base.pathname.replace(/\/+$/, '');
    return new URL(`${prefix}${pathname}`, this.base.origin);
  }

  headers(extra = {}) {
    return {
      authorization: `Bearer ${this.token}`,
      'user-agent': `varion-host/${HOST_VERSION}`,
      ...extra,
    };
  }

  // a long poll: the cabinet holds an empty answer up to `wait` seconds
  async poll(instances, { wait = POLL_WAIT_S, timeoutMs = (POLL_WAIT_S + 45) * 1000 } = {}) {
    const answer = await requestJson(this.endpoint('/api/servers/agent/deploy/poll'), {
      method: 'POST',
      headers: this.headers(),
      json: { hostId: this.hostId, instances, wait },
      timeoutMs,
      what: t('cabinet poll'),
    });
    const after = Number(answer?.pollAfterMs);
    return {
      items: normalizePollItems(answer),
      serverId: typeof answer?.serverId === 'string' ? answer.serverId : null,
      pollAfterMs: Number.isFinite(after) && after >= 0 ? after : null,
      previews: Array.isArray(answer?.previews) ? answer.previews : [],
    };
  }

  async downloadRelease(releaseId, file, { maxBytes, expectedSize } = {}) {
    return download(
      this.endpoint(`/api/servers/agent/releases/${encodeURIComponent(releaseId)}`),
      file,
      {
        headers: this.headers(),
        maxBytes,
        expectedSize,
        what: t('release {releaseId}', { releaseId }),
        stallMs: 120_000,
      },
    );
  }

  async approvedKeys() {
    const answer = await requestJson(this.endpoint('/api/servers/agent/keys'), {
      method: 'GET',
      headers: this.headers(),
      timeoutMs: 15_000,
      what: t('approved keys'),
    });
    return cabinetTrust(answer);
  }

  async reportStatus({ deployId, phase, error, port }) {
    const body = { deployId, phase, hostId: this.hostId };
    if (error) body.error = String(error).slice(0, 1000);
    if (Number.isInteger(port)) body.port = port;
    await requestJson(this.endpoint('/api/servers/agent/deploy/status'), {
      method: 'POST',
      headers: this.headers(),
      json: body,
      timeoutMs: 30_000,
      what: t('deploy status'),
    });
  }
}

export function isPermanentRefusal(error) {
  const match = /^http-(\d{3})$/.exec(String(error?.code || ''));
  if (!match) return false;
  const status = Number(match[1]);
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
}
