import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { CliError } from './output.mjs';
import { projectPaths } from './paths.mjs';
import { parseToml, TomlError } from './toml.mjs';

export const CONFIG_FILE = 'varion.toml';
export const RESOURCE_NAME = /^[a-z][a-z0-9_-]{0,63}$/;
export const DEFAULT_SERVER_PORT = 7788;
export const DEFAULT_MANAGED_DB_PORT = 3317;
export const DEFAULT_ASSETS_LOCK = 'assets.lock.json';
export const DEFAULT_CABINET = 'https://api.varionmp.net';
export const DEPLOY_ENV = /^(test|prod|preview-[a-z0-9][a-z0-9._-]{0,62})$/;

const KNOWN_TABLES = [
  'project',
  'engine',
  'server',
  'build',
  'resources',
  'config',
  'database',
  'assets',
  'dev',
  'deploy',
  'env',
];

export function findProjectRoot(start = process.cwd()) {
  let dir = path.resolve(start);
  for (;;) {
    if (fs.existsSync(path.join(dir, CONFIG_FILE))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function loadProject(start = process.cwd(), { requireRoot = true } = {}) {
  const root = findProjectRoot(start);
  if (!root) {
    if (!requireRoot) return null;
    throw new CliError(
      t('no varion.toml in {dir} or any folder above it (a new project: varion new <name>)', {
        dir: path.resolve(start),
      }),
    );
  }
  const file = path.join(root, CONFIG_FILE);
  const parsed = readToml(file);
  const { config, warnings } = normalizeConfig(parsed, { root });
  return { root, file, paths: projectPaths(root), config, warnings };
}

export function readToml(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    throw new CliError(t('cannot read {file}: {reason}', { file, reason: error.message }));
  }
  try {
    return parseToml(text, { source: path.basename(file) });
  } catch (error) {
    if (error instanceof TomlError) throw new CliError(error.message, { code: error.code });
    throw error;
  }
}

// ---- validation ----

class Checker {
  constructor() {
    this.warnings = [];
  }

  fail(message) {
    throw new CliError(`varion.toml: ${message}`);
  }

  warn(message) {
    this.warnings.push(`varion.toml: ${message}`);
  }

  table(value, where) {
    if (value === undefined) return {};
    if (!isPlainObject(value)) this.fail(t('{key} must be a table [...]', { key: where }));
    return value;
  }

  unknown(table, known, where) {
    for (const key of Object.keys(table)) {
      if (!known.includes(key))
        this.warn(t('unknown key {key}, ignored', { key: `${where}.${key}` }));
    }
  }

  string(table, key, where, { fallback, allowEmpty = true } = {}) {
    const value = table[key];
    if (value === undefined) return fallback;
    const name = `${where} ${key}`;
    if (typeof value !== 'string') {
      this.fail(
        t('{key} must be a quoted string, not {value}', { key: name, value: describe(value) }),
      );
    }
    if (!allowEmpty && !value.trim()) this.fail(t('{key} cannot be empty', { key: name }));
    return value;
  }

  bool(table, key, where, fallback) {
    const value = table[key];
    if (value === undefined) return fallback;
    if (typeof value !== 'boolean') {
      this.fail(
        t('{key} must be true or false, not {value}', {
          key: `${where} ${key}`,
          value: describe(value),
        }),
      );
    }
    return value;
  }

  int(table, key, where, { fallback, min = -Infinity, max = Infinity } = {}) {
    const value = table[key];
    if (value === undefined) return fallback;
    if (!Number.isInteger(value) || value < min || value > max) {
      const params = { key: `${where} ${key}`, value: describe(value), min, max };
      if (Number.isFinite(min) && Number.isFinite(max)) {
        this.fail(t('{key} must be an integer from {min} to {max}, not {value}', params));
      }
      if (Number.isFinite(min)) {
        this.fail(t('{key} must be an integer of at least {min}, not {value}', params));
      }
      this.fail(t('{key} must be an integer, not {value}', params));
    }
    return value;
  }

  port(table, key, where, fallback) {
    return this.int(table, key, where, { fallback, min: 1, max: 65535 });
  }

  strings(table, key, where, fallback = []) {
    const value = table[key];
    if (value === undefined) return fallback;
    if (typeof value === 'string') return [value];
    if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
      this.fail(
        t('{key} must be a list of strings ["a", "b"], not {value}', {
          key: `${where} ${key}`,
          value: describe(value),
        }),
      );
    }
    return value;
  }
}

function describe(value) {
  if (Array.isArray(value)) return t('a list');
  if (isPlainObject(value)) return t('a table');
  if (typeof value === 'string') return t('the string "{text}"', { text: value });
  return String(value);
}

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeConfig(raw, { root = process.cwd() } = {}) {
  const check = new Checker();
  for (const key of Object.keys(raw)) {
    if (!KNOWN_TABLES.includes(key))
      check.warn(t('unknown table [{table}], ignored', { table: key }));
  }
  const resolve = (value) => (value ? path.resolve(root, value) : null);

  const projectTable = check.table(raw.project, '[project]');
  check.unknown(projectTable, ['name', 'title', 'version'], '[project]');
  const name = check.string(projectTable, 'name', '[project]');
  if (name === undefined) {
    check.fail(
      t(
        '[project] needs name: the resource name of the game mode (lowercase a-z, digits, _ and -)',
      ),
    );
  }
  if (!RESOURCE_NAME.test(name)) {
    const rule = t(
      'name "{name}": lowercase letters, digits, _ and -, starting with a letter, up to 64 characters',
      { name },
    );
    check.fail(`[project] ${rule}`);
  }
  const project = {
    name,
    title: check.string(projectTable, 'title', '[project]', { fallback: name }),
    version: check.string(projectTable, 'version', '[project]', { fallback: '0.0.0' }),
  };

  const engineTable = check.table(raw.engine, '[engine]');
  check.unknown(engineTable, ['version', 'channel', 'path'], '[engine]');
  const engine = {
    version: check.string(engineTable, 'version', '[engine]'),
    channel: check.string(engineTable, 'channel', '[engine]', { fallback: 'rc' }),
    path: resolve(check.string(engineTable, 'path', '[engine]')),
  };
  if (!engine.path && !engine.version) {
    check.fail(
      t(
        '[engine] needs version (an engine from the CDN) or path (a folder with your own server build)',
      ),
    );
  }
  if (engine.version && !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(engine.version)) {
    check.fail(
      t('[engine] version "{version}" is not a version like 1.0.75', { version: engine.version }),
    );
  }
  if (!/^[a-z0-9-]+$/.test(engine.channel)) {
    check.fail(
      t('[engine] channel "{channel}" is not a channel name (rc, beta, ...)', {
        channel: engine.channel,
      }),
    );
  }

  const server = { ...check.table(raw.server, '[server]') };
  checkServerTable(check, server, '[server]');
  server.port ??= DEFAULT_SERVER_PORT;
  server.httpPort ??= server.port + 1;
  if (server.port === server.httpPort) {
    check.fail(
      t('{table} port and httpPort are the same ({port})', {
        table: '[server]',
        port: server.port,
      }),
    );
  }

  const buildTable = check.table(raw.build, '[build]');
  check.unknown(
    buildTable,
    [
      'server',
      'client',
      'ui',
      'typecheck',
      'copy',
      'clientFiles',
      'deps',
      'external',
      'loadscreen',
      'steps',
      'target',
    ],
    '[build]',
  );
  const stepsTable = check.table(buildTable.steps, '[build.steps]');
  const steps = Object.entries(stepsTable).map(([stepName, stepRaw]) => {
    const where = `[build.steps.${stepName}]`;
    const step = check.table(stepRaw, where);
    check.unknown(step, ['run', 'watch', 'cwd'], where);
    return {
      name: stepName,
      run:
        check.string(step, 'run', where, { allowEmpty: false }) ??
        check.fail(t('{table} needs run: the build command', { table: where })),
      watch: check.strings(step, 'watch', where),
      cwd: resolve(check.string(step, 'cwd', where)) || root,
    };
  });
  const build = {
    kind: steps.length ? 'custom' : 'standard',
    server: optionalEntry(check.string(buildTable, 'server', '[build]'), 'src/server/index.ts'),
    client: optionalEntry(check.string(buildTable, 'client', '[build]'), 'src/client/index.ts'),
    ui: optionalEntry(check.string(buildTable, 'ui', '[build]'), 'src/ui'),
    typecheck: check.bool(buildTable, 'typecheck', '[build]', true),
    copy: check.strings(buildTable, 'copy', '[build]'),
    clientFiles: check.strings(buildTable, 'clientFiles', '[build]'),
    deps: check.strings(buildTable, 'deps', '[build]'),
    external: check.strings(buildTable, 'external', '[build]'),
    loadscreen: check.string(buildTable, 'loadscreen', '[build]', { fallback: null }),
    target: check.string(buildTable, 'target', '[build]', { fallback: 'node22' }),
    steps,
  };

  const resourcesTable = check.table(raw.resources, '[resources]');
  check.unknown(resourcesTable, ['extra', 'lists', 'dir'], '[resources]');
  const resources = {
    extra: check.strings(resourcesTable, 'extra', '[resources]'),
    lists: check.strings(resourcesTable, 'lists', '[resources]'),
    dir: path.resolve(
      root,
      check.string(resourcesTable, 'dir', '[resources]', { fallback: 'resources' }),
    ),
  };
  for (const extra of resources.extra) {
    if (!/^[A-Za-z0-9_.-]+$/.test(extra)) {
      check.fail(t('[resources] extra "{name}" is not a resource name', { name: extra }));
    }
  }

  const resourceConfig = check.table(raw.config, '[config]');

  let database = null;
  if (raw.database !== undefined) {
    const db = check.table(raw.database, '[database]');
    check.unknown(
      db,
      ['managed', 'port', 'host', 'name', 'user', 'seed', 'start', 'env'],
      '[database]',
    );
    const start = check.string(db, 'start', '[database]', { fallback: null });
    const envNames = check.table(db.env, '[database.env]');
    check.unknown(envNames, ['host', 'port', 'name', 'user', 'password', 'url'], '[database.env]');
    const defaultName = name.replace(/-/g, '_');
    database = {
      managed: check.bool(db, 'managed', '[database]', !start),
      host: check.string(db, 'host', '[database]', { fallback: '127.0.0.1' }),
      port: check.port(db, 'port', '[database]', DEFAULT_MANAGED_DB_PORT),
      name: check.string(db, 'name', '[database]', { fallback: defaultName }),
      user: check.string(db, 'user', '[database]', { fallback: defaultName.slice(0, 32) }),
      seed: resolve(check.string(db, 'seed', '[database]')),
      start: resolve(start),
      env: Object.fromEntries(
        ['host', 'port', 'name', 'user', 'password', 'url'].map((key) => [
          key,
          check.string(envNames, key, '[database.env]', { fallback: null }),
        ]),
      ),
    };
    for (const key of ['name', 'user']) {
      if (!/^[A-Za-z0-9_]{1,64}$/.test(database[key])) {
        check.fail(
          t('[database] {key} "{value}": only Latin letters, digits and _', {
            key,
            value: database[key],
          }),
        );
      }
    }
  }

  const assetsTable = check.table(raw.assets, '[assets]');
  check.unknown(assetsTable, ['lock', 'source', 'url'], '[assets]');
  const assets = {
    declared: raw.assets !== undefined,
    lock: path.resolve(
      root,
      check.string(assetsTable, 'lock', '[assets]', { fallback: DEFAULT_ASSETS_LOCK }),
    ),
    source: resolve(check.string(assetsTable, 'source', '[assets]')),
    url: check.string(assetsTable, 'url', '[assets]', { fallback: null }),
  };

  const devTable = check.table(raw.dev, '[dev]');
  check.unknown(
    devTable,
    [
      'play',
      'gameLogs',
      'slowHandlers',
      'watch',
      'ui',
      'uiPort',
      'uiRoot',
      'uiShims',
      'uiCommand',
      'uiUpstreamPort',
    ],
    '[dev]',
  );
  const dev = {
    play: check.bool(devTable, 'play', '[dev]', false),
    gameLogs: check.bool(devTable, 'gameLogs', '[dev]', true),
    slowHandlers: check.bool(devTable, 'slowHandlers', '[dev]', true),
    watch: check.strings(devTable, 'watch', '[dev]'),
    ui: check.string(devTable, 'ui', '[dev]', { fallback: 'build' }),
    uiPort: check.port(devTable, 'uiPort', '[dev]', 7935),
    uiRoot: check.string(devTable, 'uiRoot', '[dev]', { fallback: 'ui/' }),
    uiShims: check.strings(devTable, 'uiShims', '[dev]'),
    uiCommand: check.string(devTable, 'uiCommand', '[dev]', { fallback: null }),
    uiUpstreamPort: check.port(devTable, 'uiUpstreamPort', '[dev]', 7936),
  };
  if (!['build', 'live'].includes(dev.ui)) {
    check.fail(
      t('[dev] ui must be "build" or "live" (the page from its dev server), not "{value}"', {
        value: dev.ui,
      }),
    );
  }

  const envTable = check.table(raw.env, '[env]');
  const env = {};
  for (const [envName, overridesRaw] of Object.entries(envTable)) {
    const where = `[env.${envName}]`;
    const overrides = check.table(overridesRaw, where);
    const serverOverrides = {};
    for (const [key, value] of Object.entries(overrides)) {
      if (key === 'config') continue;
      if (isPlainObject(value)) {
        check.warn(
          t('{key}: an environment cannot hold nested tables, ignored', { key: `${where}.${key}` }),
        );
        continue;
      }
      serverOverrides[key] = value;
    }
    checkServerTable(check, serverOverrides, where);
    env[envName] = {
      server: serverOverrides,
      config: { ...check.table(overrides.config, `${where}.config`) },
    };
  }

  const deployTable = check.table(raw.deploy, '[deploy]');
  const deploy = { cabinet: null, envs: {} };
  for (const [key, value] of Object.entries(deployTable)) {
    if (key === 'cabinet') {
      deploy.cabinet = check.string(deployTable, 'cabinet', '[deploy]', { fallback: null });
      continue;
    }
    if (!isPlainObject(value)) {
      check.warn(t('unknown key {key}, ignored', { key: `[deploy].${key}` }));
      continue;
    }
    if (!DEPLOY_ENV.test(key)) {
      check.fail(
        t('[deploy.{name}]: a deploy environment is test, prod or preview-<branch>', { name: key }),
      );
    }
    const where = `[deploy.${key}]`;
    check.unknown(value, ['server', 'cabinet'], where);
    deploy.envs[key] = {
      server: check.string(value, 'server', where, { fallback: null }),
      cabinet: check.string(value, 'cabinet', where, { fallback: null }),
    };
  }

  const config = {
    project,
    engine,
    server,
    build,
    resources,
    config: resourceConfig,
    database,
    assets,
    dev,
    env,
    deploy,
  };
  return { config, warnings: check.warnings };
}

function optionalEntry(value, fallback) {
  if (value === undefined) return fallback;
  return value.trim() ? value : null;
}

function checkServerTable(check, table, where) {
  const ints = { maxPlayers: 1, tickRate: 1, streamingDistance: 1, migrationDistance: 1 };
  for (const [key, value] of Object.entries(table)) {
    const name = `${where} ${key}`;
    if (key === 'port' || key === 'httpPort') check.port(table, key, where);
    else if (key in ints) check.int(table, key, where, { min: ints[key] });
    else if (['name', 'host', 'language', 'description', 'website'].includes(key))
      check.string(table, key, where);
    else if (['announce', 'encryptTransport'].includes(key)) check.bool(table, key, where);
    else if (key === 'spawn') {
      if (
        !Array.isArray(value) ||
        value.length !== 3 ||
        !value.every((item) => typeof item === 'number')
      ) {
        check.fail(t('{key} must be [x, y, z]: three numbers', { key: name }));
      }
    } else if (key === 'gtaBuilds') {
      if (!Array.isArray(value) || !value.every((item) => Number.isInteger(item)))
        check.fail(t('{key} must be a list of build numbers [3889]', { key: name }));
    } else if (key === 'resources' || key === 'gamemode' || key === 'resourcesDir') {
      check.fail(
        t('{key} is set by varion itself (from [resources] extra and [project] name)', {
          key: name,
        }),
      );
    } else if (isPlainObject(value)) {
      check.fail(t('{key} is a table; server.toml does not take tables', { key: name }));
    }
  }
}

// ---- settings for one run ----

export function serverSettings(config, { envName = null, release = false } = {}) {
  let settings = { ...config.server };
  if (envName) {
    const overrides = config.env[envName];
    if (!overrides) throw new CliError(t('varion.toml has no [env.{name}]', { name: envName }));
    settings = { ...settings, ...overrides.server };
  }
  // listening on every interface brings up the windows firewall prompt for each engine folder
  if (!release && (settings.host === undefined || settings.host === ''))
    settings.host = '127.0.0.1';
  settings.name ??= config.project.title;
  return settings;
}

export function resourceConfig(config, { envName = null } = {}) {
  const base = { ...config.config };
  if (envName && config.env[envName]) Object.assign(base, config.env[envName].config);
  return base;
}

// ---- dotenv ----

export function parseDotenv(text) {
  const values = {};
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2];
    if (value.startsWith('"')) {
      let out = '';
      let i = 1;
      for (; i < value.length && value[i] !== '"'; i++) {
        if (value[i] === '\\' && i + 1 < value.length) {
          const next = value[++i];
          out += { n: '\n', r: '\r', t: '\t' }[next] ?? next;
        } else {
          out += value[i];
        }
      }
      value = out;
    } else if (value.startsWith("'")) {
      const end = value.indexOf("'", 1);
      value = end > 0 ? value.slice(1, end) : value.slice(1);
    } else {
      // " #" starts a comment after an unquoted value, "a#b" stays as it is
      const comment = value.search(/\s#/);
      if (comment >= 0) value = value.slice(0, comment);
      value = value.trim();
    }
    values[match[1]] = value;
  }
  return values;
}

export function dotenvValue(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_./:@+,=-]*$/.test(text)) return text;
  return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`;
}

export function stringifyDotenv(values, { header = '' } = {}) {
  const lines = header ? header.split('\n').map((line) => `# ${line}`) : [];
  for (const [key, value] of Object.entries(values)) lines.push(`${key}=${dotenvValue(value)}`);
  return `${lines.join('\n')}\n`;
}

export function loadDotenv(root, { envName = null, dotenvFile = null } = {}) {
  const base = dotenvFile ? path.resolve(root, dotenvFile) : path.join(root, '.env');
  const candidates = [base];
  if (envName) candidates.push(path.join(root, `.env.${envName}`));
  const values = {};
  const files = [];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    Object.assign(values, parseDotenv(fs.readFileSync(file, 'utf8')));
    files.push(file);
  }
  return { values, files, baseFile: base, baseExists: fs.existsSync(base) };
}
