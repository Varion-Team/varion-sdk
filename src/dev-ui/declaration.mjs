import { t } from '../i18n/index.mjs';
import { loopbackHttpUrl } from './serve.mjs';

function plainFolder(text) {
  return text
    .split('/')
    .every(
      (segment) => segment && segment !== '.' && segment !== '..' && !/[%\\:\s]/.test(segment),
    );
}

// the game's own rules, so a mistake shows here and not as a page that stays the built one
export function devUiUrl(text) {
  const url = loopbackHttpUrl(text, '[dev-ui] url');
  if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost' && url.hostname !== '[::1]') {
    throw new Error(t('[dev-ui] url: {url} is not on this computer', { url: text }));
  }
  if (url.search || url.hash || url.username || url.password) {
    throw new Error(
      t('[dev-ui] url: no query, fragment or user name allowed: {url}', { url: text }),
    );
  }
  const folder = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
  if (folder !== '/' && !plainFolder(folder.slice(1, -1)))
    throw new Error(t('[dev-ui] url: {folder} is not a plain folder', { folder }));
  return `${url.protocol}//${url.host}${folder}`;
}

export function devUiRoot(text) {
  const folder = String(text || '').replace(/^\/+/, '');
  if (!folder) return '';
  const withSlash = folder.endsWith('/') ? folder : `${folder}/`;
  if (!plainFolder(withSlash.slice(0, -1)))
    throw new Error(t('[dev-ui] root: a folder of the resource, not {root}', { root: text }));
  return withSlash;
}

export function devUiTable({ url, root }) {
  return (
    '# Written by the Varion dev tool while the UI dev server runs: the pages\n' +
    '# below come from it in the game of a developer on this computer who\n' +
    '# named it in VARION_DEV_UI. Development only -- never ship it.\n' +
    `[dev-ui]\nurl = "${devUiUrl(url)}"\nroot = "${devUiRoot(root)}"\n`
  );
}

const TABLE_COMMENT =
  /^# (Written by the Varion dev tool|below come from it in the game|named it in VARION_DEV_UI)/;

export function withoutDevUiTable(toml) {
  const kept = [];
  let inTable = false;
  for (const line of String(toml).split(/\r?\n/)) {
    const header = /^\s*\[([^\]]*)\]\s*(#.*)?$/.exec(line);
    if (header) {
      inTable = header[1].trim() === 'dev-ui';
      if (inTable) while (kept.length && TABLE_COMMENT.test(kept[kept.length - 1])) kept.pop();
    }
    if (!inTable) kept.push(line);
  }
  while (kept.length && kept[kept.length - 1].trim() === '') kept.pop();
  return kept.length ? `${kept.join('\n')}\n` : '';
}

export function withDevUiTable(toml, declaration) {
  const rest = withoutDevUiTable(toml);
  return `${rest}${rest ? '\n' : ''}${devUiTable(declaration)}`;
}

// VARION_DEV_UI: dev server origins, comma-separated
export function devUiOptIn(urls) {
  const origins = [];
  for (const text of [].concat(urls)) {
    const url = new URL(devUiUrl(text));
    const origin = `${url.protocol}//${url.host}`;
    if (!origins.includes(origin)) origins.push(origin);
  }
  return origins.join(',');
}
