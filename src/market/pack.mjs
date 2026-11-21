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

export function packResource(dir, { version: versionOption } = {}) {
  const tomlFile = path.join(dir, 'resource.toml');
  if (!fs.existsSync(tomlFile)) {
    throw new PackError(t('{dir}: no resource.toml here', { dir }), { code: 'no-resource' });
  }
  const toml = parseToml(readText(tomlFile), { source: 'resource.toml' });
  const market = toml.market && typeof toml.market === 'object' ? toml.market : null;
  if (!market) {
    throw new PackError(
      t(
        'resource.toml has no [market] table: add name = "<name on the platform>" and version = "1.0.0" there',
      ),
      { code: 'no-market' },
    );
  }
  const name = String(market.name || '');
  const version = String(versionOption || market.version || '');
  if (!MARKET_NAME.test(name)) {
    throw new PackError(
      t(
        '[market] name "{name}": 3 to 40 lower-case letters, digits and dashes, as the resource is named on the platform',
        { name },
      ),
      { code: 'bad-name' },
    );
  }
  if (!MARKET_VERSION.test(version)) {
    throw new PackError(
      t('the version is three numbers with dots, like 1.2.0 (got "{version}")', { version }),
      {
        code: 'bad-version',
      },
    );
  }
  if (String(toml.type || 'js').toLowerCase() !== 'js') {
    throw new PackError(t('a resource is sold with a JavaScript server side (type = "js")'), {
      code: 'bad-type',
    });
  }

  const main = first(toml, 'main').replace(/\\/g, '/');
  const clientMain = first(toml, 'client-main', 'clientMain').replace(/\\/g, '/');
  const clientGlobs = [
    ...list(toml['client-files']),
    ...list(toml.clientFiles),
    ...(clientMain ? [clientMain] : []),
  ];
  const streamGlobs = ['stream/**', ...list(toml['stream-files']), ...list(toml.streamFiles)];
  const openGlobs = list(market.open);
  const excludeGlobs = list(market.exclude);

  const sides = { server: [], client: [], open: [] };
  const skipped = [];
  const all = walkFiles(dir, {
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
    if (
      relative === 'resource.toml' ||
      relative.endsWith('.vpack') ||
      matchesAny(relative, excludeGlobs)
    )
      continue;
    if (matchesAny(relative, openGlobs) || matchesAny(relative, streamGlobs))
      sides.open.push(relative);
    else if (matchesAny(relative, clientGlobs)) sides.client.push(relative);
    else sides.server.push(relative);
  }
  if (main && !sides.server.includes(main)) {
    throw new PackError(
      t('main = "{main}" is not among the files that are packed for the server', { main }),
      {
        code: 'no-main',
      },
    );
  }
  if (clientMain && !sides.client.includes(clientMain)) {
    throw new PackError(
      t('client-main = "{main}" is not among the files that are packed for the clients', {
        main: clientMain,
      }),
      { code: 'no-main' },
    );
  }
  if (!main && !clientMain) {
    throw new PackError(
      t('resource.toml names no main and no client-main: there is nothing to run'),
      {
        code: 'no-main',
      },
    );
  }

  // the buyer's resource.toml: no code entries
  const shell = { ...toml, type: 'js', license: name };
  for (const key of ['main', 'client-main', 'clientMain', 'market', 'clientFiles'])
    delete shell[key];
  const openClient = clientGlobs.filter(
    (glob) => glob !== clientMain && sides.open.some((file) => matchesAny(file, [glob])),
  );
  if (openClient.length) shell['client-files'] = openClient;
  else delete shell['client-files'];

  const files = [];
  let total = 0;
  const add = (relative, side, data) => {
    if (!SAFE_PATH.test(relative)) {
      throw new PackError(
        t('{path}: a packed path holds only Latin letters, digits, spaces and . _ @ + - /', {
          path: relative,
        }),
        { code: 'bad-path' },
      );
    }
    if (data.length > MAX_FILE_BYTES) {
      throw new PackError(
        t('{path} is larger than 8 MB: a package takes smaller files', { path: relative }),
        {
          code: 'too-large',
        },
      );
    }
    total += data.length;
    files.push({ path: relative, side, data });
  };
  for (const relative of sides.server)
    add(relative, 'server', fs.readFileSync(path.join(dir, relative)));
  for (const relative of sides.client)
    add(relative, 'client', fs.readFileSync(path.join(dir, relative)));
  add('resource.toml', 'open', Buffer.from(stringifyToml(shell), 'utf8'));
  for (const relative of sides.open)
    add(relative, 'open', fs.readFileSync(path.join(dir, relative)));
  if (files.length > MAX_FILES) {
    throw new PackError(t('{count} files: a package takes up to 2000', { count: files.length }), {
      code: 'too-many',
    });
  }
  if (total > MAX_BUNDLE_BYTES) {
    throw new PackError(
      t(
        'the files add up to {mb} MB: a package takes up to 32 MB (leave big assets out with [market] exclude)',
        {
          mb: (total / 1048576).toFixed(1),
        },
      ),
      { code: 'too-large' },
    );
  }

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
