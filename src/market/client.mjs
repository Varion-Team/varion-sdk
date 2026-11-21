import { cabinetBase, CLI_TOKEN, DeployError } from '../deploy/client.mjs';
import { t } from '../i18n/index.mjs';

async function ask(cabinetUrl, pathname, { token, method = 'GET', body, what }) {
  if (typeof token !== 'string' || !CLI_TOKEN.test(token)) {
    throw new DeployError(
      t('the sign-in token must look like varion_cli_...: sign in again with varion login'),
      {
        code: 'bad_token',
      },
    );
  }
  const url = `${cabinetBase(cabinetUrl)}${pathname}`;
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': `varion-market-client/1 node/${process.versions.node}`,
        ...(body ? { 'Content-Type': 'application/octet-stream' } : {}),
      },
      body,
      redirect: 'error',
      signal: AbortSignal.timeout(120_000),
    });
  } catch (error) {
    const reason = error?.cause?.message || error?.message || String(error);
    throw new DeployError(
      t('the cabinet {host} is out of reach: {reason}', { host: new URL(url).host, reason }),
      {
        code: 'network',
      },
    );
  }
  const text = await response.text();
  let answer = null;
  try {
    answer = text ? JSON.parse(text) : null;
  } catch {}
  if (!response.ok) {
    const said =
      answer && typeof answer.error === 'string' && answer.error
        ? answer.error
        : text.trim().slice(0, 200);
    const reason = said || t('the cabinet answered HTTP {status}', { status: response.status });
    throw new DeployError(`${what}: ${reason}`, {
      code:
        answer && typeof answer.code === 'string' && answer.code
          ? answer.code
          : `http_${response.status}`,
      status: response.status,
      data: answer || {},
    });
  }
  return answer || {};
}

export async function publishVersion({
  cabinetUrl,
  token,
  name,
  version,
  bundle,
  beta = false,
  notes = '',
}) {
  const query = new URLSearchParams({ version });
  if (beta) query.set('channel', 'beta');
  if (notes) query.set('notes', notes);
  const answer = await ask(
    cabinetUrl,
    `/api/cli/market/resources/${encodeURIComponent(name)}/versions?${query}`,
    {
      token,
      method: 'POST',
      body: bundle,
      what: t('the version was not published'),
    },
  );
  return answer.version || {};
}

export async function fetchInstall({ cabinetUrl, token, name, version = '' }) {
  const query = version ? `?${new URLSearchParams({ version })}` : '';
  const answer = await ask(
    cabinetUrl,
    `/api/cli/market/install/${encodeURIComponent(name)}${query}`,
    {
      token,
      what: t('the resource was not installed'),
    },
  );
  const files = Array.isArray(answer.files) ? answer.files : [];
  return {
    resource: String(answer.resource || name),
    title: String(answer.title || ''),
    version: String(answer.version || ''),
    files: files
      .filter((file) => file && typeof file.path === 'string' && typeof file.data === 'string')
      .map((file) => ({ path: file.path, data: Buffer.from(file.data, 'base64') })),
  };
}
