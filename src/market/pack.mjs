import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { matchesAny } from '../cli/glob.mjs';
import { parseToml, stringifyToml } from '../cli/toml.mjs';
import { t } from '../i18n/index.mjs';
import { VarionError } from '../shared/errors.mjs';
import { readText, walkFiles } from '../shared/fs.mjs';

export const MARKET_NAME = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
export const MARKET_VERSION = /^\d{1,4}\.\d{1,4}\.\d{1,6}(?:-[0-9A-Za-z.]{1,24})?$/;
const SAFE_PATH = /^(?!\/)(?!.*(?:^|\/)\.{1,2}(?:\/|$))[A-Za-z0-9._@+\-/ ]{1,200}$/;
const MAX_FILES = 2000;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_BUNDLE_BYTES = 32 * 1024 * 1024;

export class PackError extends VarionError {}

const list = (value) =>
  Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
const first = (table, ...keys) =>
  keys.map((key) => table[key]).find((value) => typeof value === 'string' && value) || '';
const fail = (message, code) => new PackError(message, { code });

// Reads resource.toml and checks its [market] table: the name and version to sell under.
function readResource(dir, versionOption) {
  const tomlFile = path.join(dir, 'resource.toml');
  if (!fs.existsSync(tomlFile)) {
    throw fail(t('{dir}: no resource.toml here', { dir }), 'no-resource');
  }
  const toml = parseToml(readText(tomlFile), { source: 'resource.toml' });
  const market = toml.market && typeof toml.market === 'object' ? toml.market : null;
  if (!market) {
    throw fail(
      t(
        'resource.toml has no [market] table: add name = "<name on the platform>" and version = "1.0.0" there',
      ),
      'no-market',
    );
  }
  const name = String(market.name || '');
  const version = String(versionOption || market.version || '');
  if (!MARKET_NAME.test(name)) {
    throw fail(
      t(
        '[market] name "{name}": 3 to 40 lower-case letters, digits and dashes, as the resource is named on the platform',
        { name },
      ),
      'bad-name',
    );
  }
  if (!MARKET_VERSION.test(version)) {
    throw fail(
      t('the version is three numbers with dots, like 1.2.0 (got "{version}")', { version }),
      'bad-version',
    );
  }
  if (String(toml.type || 'js').toLowerCase() !== 'js') {
    throw fail(t('a resource is sold with a JavaScript server side (type = "js")'), 'bad-type');
  }
  return { toml, market, name, version };
}

// The files of the resource by who gets them: the server and the clients sealed, the rest open.
function sortFiles(dir, { clientGlobs, streamGlobs, openGlobs, excludeGlobs }) {
  const sides = { server: [], client: [], open: [] };
  const skipped = [];
  const all = walkFiles(dir, {
    // a link could carry a file from outside the resource into the package
    strict: true,
    skip: (relative, isDirectory) => {
      const base = relative.split('/').pop();
      if (base.startsWith('.')) return true;
      if (isDirectory && base === 'node_modules' && !matchesAny(`${relative}/x`, openGlobs)) {
        skipped.push(relative);
        return true;
      }
      return false;
    },
  });
  for (const relative of all) {
    if (relative === 'resource.toml' || relative.endsWith('.vpack')) continue;
    if (matchesAny(relative, excludeGlobs)) continue;
    if (matchesAny(relative, openGlobs) || matchesAny(relative, streamGlobs))
      sides.open.push(relative);
    else if (matchesAny(relative, clientGlobs)) sides.client.push(relative);
    else sides.server.push(relative);
  }
  return { sides, skipped };
}

function checkEntryPoints({ main, clientMain }, sides) {
  if (main && !sides.server.includes(main)) {
    throw fail(
      t('main = "{main}" is not among the files that are packed for the server', { main }),
      'no-main',
    );
  }
  if (clientMain && !sides.client.includes(clientMain)) {
    throw fail(
      t('client-main = "{main}" is not among the files that are packed for the clients', {
        main: clientMain,
      }),
      'no-main',
    );
  }
  if (!main && !clientMain) {
    throw fail(
      t('resource.toml names no main and no client-main: there is nothing to run'),
      'no-main',
    );
  }
}

// The buyer's resource.toml: no code entries, and only the client files that stay open.
function buyerToml(toml, name, { clientGlobs, clientMain, open }) {
  const shell = { ...toml, type: 'js', license: name };
  for (const key of ['main', 'client-main', 'clientMain', 'market', 'clientFiles', 'client-files'])
    delete shell[key];
  const openClient = clientGlobs.filter(
    (glob) => glob !== clientMain && open.some((file) => matchesAny(file, [glob])),
  );
  if (openClient.length) shell['client-files'] = openClient;
  return stringifyToml(shell);
}

// Reads one file for the package, refusing an unsafe name or a file over the size limit.
function readFile(dir, relative, side) {
  const full = path.join(dir, relative);
  if (!SAFE_PATH.test(relative)) {
    throw fail(
      t('{path}: a packed path holds only Latin letters, digits, spaces and . _ @ + - /', {
        path: relative,
      }),
      'bad-path',
    );
  }
  if (fs.statSync(full).size > MAX_FILE_BYTES) {
    throw fail(
      t('{path} is larger than 8 MB: a package takes smaller files', { path: relative }),
      'too-large',
    );
  }
  return { path: relative, side, data: fs.readFileSync(full) };
}

function checkLimits(files) {
  const total = files.reduce((sum, file) => sum + file.data.length, 0);
  if (files.length > MAX_FILES) {
    throw fail(t('{count} files: a package takes up to 2000', { count: files.length }), 'too-many');
  }
  if (total > MAX_BUNDLE_BYTES) {
    throw fail(
      t(
        'the files add up to {mb} MB: a package takes up to 32 MB (leave big assets out with [market] exclude)',
        { mb: (total / 1048576).toFixed(1) },
      ),
      'too-large',
    );
  }
}

export function packResource(dir, { version: versionOption } = {}) {
  const { toml, market, name, version } = readResource(dir, versionOption);
  const main = first(toml, 'main').replace(/\\/g, '/');
  const clientMain = first(toml, 'client-main', 'clientMain').replace(/\\/g, '/');
  const clientGlobs = [
    ...list(toml['client-files']),
    ...list(toml.clientFiles),
    ...(clientMain ? [clientMain] : []),
  ];
  const { sides, skipped } = sortFiles(dir, {
    clientGlobs,
    streamGlobs: ['stream/**', ...list(toml['stream-files']), ...list(toml.streamFiles)],
    openGlobs: list(market.open),
    excludeGlobs: list(market.exclude),
  });
  checkEntryPoints({ main, clientMain }, sides);

  const read = (side) => (relative) => readFile(dir, relative, side);
  const shell = buyerToml(toml, name, { clientGlobs, clientMain, open: sides.open });
  const files = [
    ...sides.server.map(read('server')),
    ...sides.client.map(read('client')),
    { path: 'resource.toml', side: 'open', data: Buffer.from(shell, 'utf8') },
    ...sides.open.map(read('open')),
  ];
  checkLimits(files);

  const body = {
    format: 1,
    name,
    version,
    main,
    clientMain,
    files: files.map((file) => ({
      path: file.path,
      data: file.data.toString('base64'),
      ...(file.side === 'server' ? {} : { side: file.side }),
    })),
  };
  return {
    name,
    version,
    bundle: zlib.gzipSync(Buffer.from(JSON.stringify(body), 'utf8')),
    files: files.map((file) => ({ path: file.path, side: file.side, size: file.data.length })),
    skipped,
  };
}

// for varion publish --file
export function readPacked(bytes) {
  let parsed;
  try {
    parsed = JSON.parse(zlib.gunzipSync(bytes).toString('utf8'));
  } catch {
    throw new PackError(t('the file is not a package made by varion pack'), {
      code: 'bad-package',
    });
  }
  if (!parsed || parsed.format !== 1 || !Array.isArray(parsed.files)) {
    throw new PackError(t('the file is not a package made by varion pack'), {
      code: 'bad-package',
    });
  }
  return {
    name: String(parsed.name || ''),
    version: String(parsed.version || ''),
    files: parsed.files.length,
  };
}
