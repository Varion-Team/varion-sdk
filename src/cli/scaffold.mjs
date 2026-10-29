import fs from 'node:fs';
import path from 'node:path';
import { getLocale, t } from '../i18n/index.mjs';
import { walkFiles } from '../shared/fs.mjs';
import { DEFAULT_CABINET, RESOURCE_NAME } from './config.mjs';
import { CliError } from './output.mjs';
import { tomlString } from './toml.mjs';

export const SDK_TYPE_FILES = ['varion-server.d.ts', 'varion-client.d.ts', 'varion-natives.d.ts'];

// the engine a new project starts on
export const DEFAULT_ENGINE = { version: '1.0.76', channel: 'rc' };

// what the template is tested with
export const TEMPLATE_VERSIONS = {
  esbuild: '^0.28.2',
  vite: '^8.3.5',
  typescript: '^5.9.3',
  '@types/node': '^24.19.2',
  mysql2: '^3.24.6',
};

const RENAMES = { _gitignore: '.gitignore', _github: '.github' };

function sdkPackage(sdkDir) {
  return JSON.parse(fs.readFileSync(path.join(sdkDir, 'package.json'), 'utf8'));
}

// the repository when the SDK is installed, the folder itself in a checkout
export function sdkSpec(sdkDir) {
  const pkg = sdkPackage(sdkDir);
  if (sdkDir.split(path.sep).includes('node_modules')) {
    const repository = String(pkg.repository?.url || pkg.repository || '').replace(/^git\+/, '');
    return `git+${repository}`;
  }
  return `file:${path.resolve(sdkDir).split(path.sep).join('/')}`;
}

export function copySdkTypes(sdkDir, projectDir) {
  const source = path.join(sdkDir, 'types');
  const target = path.join(projectDir, 'types');
  fs.mkdirSync(target, { recursive: true });
  const written = [];
  for (const file of SDK_TYPE_FILES) {
    fs.copyFileSync(path.join(source, file), path.join(target, file));
    written.push(`types/${file}`);
  }
  return { source, written };
}

const escapeHtml = (text) =>
  text.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
const escapeSingleQuoted = (text) =>
  text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n');

export function fillPlaceholders(text, { name, title, db }) {
  const out = text
    .replace(/__TITLE_HTML__/g, escapeHtml(title))
    .replace(/__TITLE_TS__/g, escapeSingleQuoted(title))
    .replace(/__TITLE__/g, title)
    .replace(/__NAME__/g, name);
  // <!-- if db --> ... <!-- end db --> stays (without the markers) only in --db projects
  return out.replace(/\n?<!-- if db -->([\s\S]*?)<!-- end db -->/g, (whole, inner) =>
    db ? inner.replace(/\n$/, '') : '',
  );
}

const comment = (text) => `# ${text}`;

export function varionTomlText({ name, title, engine, port, db, dbPort }) {
  const httpPort = port + 1;
  const lines = [
    comment(t('{title}: a Varion game mode. The only settings file of the project.', { title })),
    comment(t('Everything varion makes goes to .varion (not in git, safe to delete).')),
    comment(t('Secrets go to .env, not here (.env.example lists them).')),
    '',
    '[project]',
    comment(t('Resource name and event prefix: lowercase letters, digits, _ and -.')),
    `name = ${tomlString(name)}`,
    `title = ${tomlString(title)}`,
    '',
    '[engine]',
  ];
  if (engine.path) {
    lines.push(
      comment(t('A server folder of your own build instead of the CDN package.')),
      `path = ${tomlString(engine.path.split(path.sep).join('/'))}`,
    );
  } else {
    lines.push(
      comment(t('varion dev downloads this version from the CDN and checks its signature.')),
      `version = ${tomlString(engine.version)}`,
      `channel = ${tomlString(engine.channel)}`,
    );
  }
  lines.push(
    '',
    '[server]',
    `name = ${tomlString(`${title} (local)`)}`,
    comment(
      t(
        '"127.0.0.1": this computer only; "0.0.0.0": let players in (open UDP {port} and TCP {httpPort}).',
        {
          port,
          httpPort,
        },
      ),
    ),
    'host = "127.0.0.1"',
    `port = ${port}`,
    `httpPort = ${httpPort}`,
    'maxPlayers = 32',
    `language = ${tomlString(getLocale())}`,
    comment(t('true: list the server in the launcher.')),
    'announce = false',
    comment(t('Where a player waits to join (x, y, z); the mode spawns them with player.spawn.')),
    'spawn = [211.0, -816.3, 30.7]',
    '',
    '[build]',
    'server = "src/server/index.ts"',
    'client = "src/client/index.ts"',
    'ui = "src/ui"',
    '',
    '[config]',
    comment(t('Read by the server with varion.getResourceConfig().')),
    'clicksPerSecond = 5',
    'spawnX = 211.0',
    'spawnY = -816.3',
    'spawnZ = 30.7',
    'spawnHeading = 157.0',
    'spawnModel = "mp_m_freemode_01"',
  );
  if (db) {
    lines.push(
      '',
      '[database]',
      comment(
        t(
          'Without .env, varion dev sets up MariaDB in .varion/db (127.0.0.1 only) and loads the seed.',
        ),
      ),
      `port = ${dbPort}`,
      `name = ${tomlString(name.replace(/-/g, '_'))}`,
      `user = ${tomlString(name.replace(/-/g, '_').slice(0, 32))}`,
      'seed = "db/seed.sql"',
    );
  }
  lines.push(
    '',
    '[dev]',
    comment(t('true: start the game and join the server once it is up.')),
    'play = false',
    '',
    comment(t('Deployment environments, applied over [server] and [config].')),
    '[env.test]',
    `name = ${tomlString(`${title} (test)`)}`,
    'host = "0.0.0.0"',
    '',
    '[env.prod]',
    `name = ${tomlString(title)}`,
    'host = "0.0.0.0"',
    'maxPlayers = 128',
    '',
    comment(
      t(
        'Branch previews (preview-<branch>): the host picks the port, the launcher does not list them.',
      ),
    ),
    '[env.preview]',
    `name = ${tomlString(`${title} (preview)`)}`,
    'host = "0.0.0.0"',
    '',
    '[deploy]',
    `cabinet = ${tomlString(DEFAULT_CABINET)}`,
    '',
    '[deploy.test]',
    comment(t('Server id from the cabinet; sign in with varion login (CI: VARION_DEPLOY_TOKEN).')),
    '# server = "<server id>"',
  );
  return `${lines.join('\n')}\n`;
}

export function packageJsonText({ name, spec, db }) {
  const pkg = {
    name,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'varion dev',
      check: 'varion check',
      build: 'varion build --release',
      ui: 'vite src/ui',
    },
    ...(db ? { dependencies: { mysql2: TEMPLATE_VERSIONS.mysql2 } } : {}),
    devDependencies: {
      '@types/node': TEMPLATE_VERSIONS['@types/node'],
      '@varion/sdk': spec,
      esbuild: TEMPLATE_VERSIONS.esbuild,
      typescript: TEMPLATE_VERSIONS.typescript,
      vite: TEMPLATE_VERSIONS.vite,
    },
    engines: { node: '>=22.12' },
  };
  return `${JSON.stringify(pkg, null, 2)}\n`;
}

export function envExampleText({ name, db, dbPort }) {
  const lines = [comment(t('Secrets of the mode. Copy to .env; .env stays out of git.'))];
  if (db) {
    lines.push(
      comment(t('varion dev fills these in when it sets up the project database.')),
      'DB_HOST=127.0.0.1',
      `DB_PORT=${dbPort}`,
      `DB_NAME=${name.replace(/-/g, '_')}`,
      `DB_USER=${name.replace(/-/g, '_').slice(0, 32)}`,
      'DB_PASSWORD=',
    );
  }
  lines.push(
    comment(t('Developer token from the Varion cabinet, for varion deploy:')),
    '# VARION_DEPLOY_TOKEN=',
  );
  return `${lines.join('\n')}\n`;
}

// README.ru.md wins over README.md for Russian, and is dropped otherwise
function localized(files) {
  const locale = getLocale();
  for (const relative of [...files.keys()]) {
    const match = /^(.*)\.([a-z]{2})\.md$/.exec(relative);
    if (!match) continue;
    const [, base, lang] = match;
    if (lang === locale) files.set(`${base}.md`, files.get(relative));
    files.delete(relative);
  }
  return files;
}

export function generateProject({
  dir,
  name,
  title,
  engine,
  port,
  db = false,
  dbPort = 3317,
  sdkDir,
  spec,
}) {
  if (!RESOURCE_NAME.test(name)) {
    throw new CliError(
      t(
        'name "{name}": lowercase letters, digits, _ and -, starting with a letter, up to 64 characters',
        {
          name,
        },
      ),
    );
  }
  if (!Number.isInteger(port) || port < 1 || port > 65534) {
    throw new CliError(
      t('--port {port}: use a port from 1 to 65534 (the next one is for HTTP)', { port }),
    );
  }
  if (fs.existsSync(dir) && fs.readdirSync(dir).length) {
    throw new CliError(t('{dir} already exists and is not empty', { dir }));
  }
  fs.mkdirSync(dir, { recursive: true });

  const written = [];
  const write = (relative, text) => {
    const target = path.join(dir, ...relative.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text, 'utf8');
    written.push(relative);
  };

  const templates = [path.join(sdkDir, 'templates', 'mode')];
  if (db) templates.push(path.join(sdkDir, 'templates', 'mode-db'));
  const files = new Map();
  for (const template of templates) {
    for (const relative of walkFiles(template)) files.set(relative, path.join(template, relative));
  }
  for (const [relative, source] of localized(files)) {
    const target = relative
      .split('/')
      .map((part) => RENAMES[part] || part)
      .join('/');
    write(target, fillPlaceholders(fs.readFileSync(source, 'utf8'), { name, title, db }));
  }
  write('varion.toml', varionTomlText({ name, title, engine, port, db, dbPort }));
  write('package.json', packageJsonText({ name, spec: spec || sdkSpec(sdkDir), db }));
  write('.env.example', envExampleText({ name, db, dbPort }));
  written.push(...copySdkTypes(sdkDir, dir).written);
  return written.sort();
}
