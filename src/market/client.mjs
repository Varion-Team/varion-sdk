import { Readable } from 'node:stream';
import { DeployError } from '../deploy/errors.mjs';
import { checkCliToken } from '../deploy/login.mjs';
import { endpoint, refusal, send } from '../deploy/transport.mjs';
import { t } from '../i18n/index.mjs';

// a bought resource comes back whole in one answer
const MAX_ANSWER_BYTES = 256 * 1024 * 1024;

async function ask(cabinetUrl, pathname, { token, method = 'GET', body, what }) {
  checkCliToken(token);
  const answer = await send({
    url: endpoint(cabinetUrl, pathname),
    method,
    token,
    idleMs: 120_000,
    maxAnswerBytes: MAX_ANSWER_BYTES,
    ...(body && {
      headers: { 'Content-Type': 'application/octet-stream' },
      file: { size: body.length, open: () => Readable.from([body]) },
    }),
  });
  if (answer.status < 200 || answer.status >= 300) throw refusal(answer, what);
  // a page from a proxy, or an answer cut short, is not what the cabinet says
  if (!answer.body || typeof answer.body !== 'object' || Array.isArray(answer.body)) {
    throw new DeployError(t('{what}: the answer is not JSON', { what }), { code: 'bad_answer' });
  }
  return answer.body;
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
