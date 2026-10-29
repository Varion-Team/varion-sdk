import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test, { after } from 'node:test';
import { setLocale } from '../../src/i18n/index.mjs';
import { main } from '../../src/cli/cli.mjs';
import { normalizeConfig, serverSettings } from '../../src/cli/config.mjs';
import {
  DEFAULT_ENGINE,
  fillPlaceholders,
  generateProject,
  packageJsonText,
  sdkSpec,
} from '../../src/cli/scaffold.mjs';
import { parseToml } from '../../src/cli/toml.mjs';
import { walkFiles } from '../../src/shared/fs.mjs';
import { CLI_DIR, cleanupTempDirs, tempDir } from './helpers.mjs';

after(cleanupTempDirs);

const ENGINE = { version: '1.0.76', channel: 'rc' };

const read = (dir, relative) => fs.readFileSync(path.join(dir, relative), 'utf8');

test('a new project: every file, no placeholder left, a varion.toml the CLI accepts', () => {
  const dir = path.join(tempDir(), 'my-mode');
  const files = generateProject({
    dir,
    name: 'my-mode',
    title: 'My "mode" <1>',
    engine: ENGINE,
    port: 7940,
    sdkDir: CLI_DIR,
    spec: 'file:../sdk',
  });
  for (const expected of [
    '.env.example',
    '.gitignore',
    '.github/workflows/deploy.yml',
    'README.md',
    'package.json',
    'varion.toml',
    'tsconfig.base.json',
    'src/shared/events.ts',
    'src/server/index.ts',
    'src/server/net.ts',
    'src/server/storage.ts',
    'src/client/index.ts',
    'src/client/net.ts',
    'src/ui/index.html',
    'src/ui/main.ts',
    'src/ui/net.ts',
    'types/varion-server.d.ts',
    'types/varion-client.d.ts',
    'types/varion-natives.d.ts',
  ]) {
    assert.ok(files.includes(expected), expected);
  }
  assert.ok(!files.includes('db/seed.sql'));
  assert.ok(!files.some((file) => file.startsWith('tests/')));
  assert.ok(!files.includes('README.ru.md'));
  assert.ok(!files.some((file) => file.startsWith('_')));

  for (const relative of walkFiles(dir)) {
    const text = read(dir, relative);
    assert.ok(!/__(NAME|TITLE)[A-Z_]*__/.test(text), `${relative}: placeholder left`);
    assert.ok(!/<!-- (if|end) db -->/.test(text), `${relative}: db marker left`);
  }
  assert.match(read(dir, 'src/shared/events.ts'), /'my-mode:welcome': \[welcome: Welcome\]/);
  assert.match(read(dir, 'src/ui/index.html'), /<title>My &quot;mode&quot; &lt;1&gt;<\/title>/);
  assert.match(read(dir, 'src/server/index.ts'), /const TITLE = 'My "mode" <1>';/);
  assert.match(read(dir, 'README.md'), /^# My "mode" <1>$/m);
  assert.match(read(dir, '.github/workflows/deploy.yml'), /npx varion deploy/);

  const { config, warnings } = normalizeConfig(parseToml(read(dir, 'varion.toml')), { root: dir });
  assert.deepEqual(warnings, []);
  assert.equal(config.project.name, 'my-mode');
  assert.equal(config.project.title, 'My "mode" <1>');
  assert.equal(config.engine.version, '1.0.76');
  assert.deepEqual([config.server.port, config.server.httpPort], [7940, 7941]);
  assert.equal(config.server.host, '127.0.0.1');
  assert.equal(config.database, null);
  assert.deepEqual(Object.keys(config.env), ['test', 'prod', 'preview']);
  // test, prod and previews run on a server for other people, not on loopback
  for (const env of ['test', 'prod', 'preview']) {
    assert.equal(serverSettings(config, { envName: env, release: true }).host, '0.0.0.0', env);
  }

  const pkg = JSON.parse(read(dir, 'package.json'));
  assert.equal(pkg.scripts.dev, 'varion dev');
  assert.equal(pkg.devDependencies['@varion/sdk'], 'file:../sdk');
  for (const tool of ['esbuild', 'vite', 'typescript']) assert.ok(pkg.devDependencies[tool], tool);
  assert.equal(pkg.dependencies, undefined);
  assert.match(read(dir, '.gitignore'), /^\.varion\/$/m);
  assert.ok(read(dir, 'types/varion-server.d.ts').includes('declare global'));
});

test('--db: the managed database, its seed, the MariaDB storage and mysql2', () => {
  const dir = path.join(tempDir(), 'city');
  const files = generateProject({
    dir,
    name: 'city',
    title: 'City',
    engine: ENGINE,
    port: 7788,
    db: true,
    dbPort: 3399,
    sdkDir: CLI_DIR,
    spec: 'file:../sdk',
  });
  assert.ok(files.includes('db/seed.sql'));
  const { config } = normalizeConfig(parseToml(read(dir, 'varion.toml')), { root: dir });
  assert.equal(config.database.managed, true);
  assert.equal(config.database.port, 3399);
  assert.equal(config.database.seed, path.join(dir, 'db', 'seed.sql'));
  assert.match(read(dir, 'src/server/storage.ts'), /mysql2\/promise/);
  assert.match(read(dir, '.env.example'), /^DB_PORT=3399$/m);
  assert.match(read(dir, 'README.md'), /MariaDB/);
  assert.ok(JSON.parse(read(dir, 'package.json')).dependencies.mysql2.startsWith('^3'));
});

test('Russian: the README and the varion.toml comments follow the language', () => {
  setLocale('ru');
  try {
    const dir = path.join(tempDir(), 'ru-mode');
    generateProject({
      dir,
      name: 'ru-mode',
      title: 'Режим',
      engine: ENGINE,
      port: 7788,
      sdkDir: CLI_DIR,
      spec: 'x',
    });
    assert.match(read(dir, 'README.md'), /## Локальный запуск/);
    assert.match(read(dir, 'varion.toml'), /^# Режим: режим для Varion/m);
    assert.match(read(dir, 'varion.toml'), /^language = "ru"$/m);
  } finally {
    setLocale('en');
  }
});

test('names, folders and placeholders', () => {
  const generate = (dir, name) =>
    generateProject({
      dir,
      name,
      title: 'x',
      engine: ENGINE,
      port: 7788,
      sdkDir: CLI_DIR,
      spec: 'x',
    });
  assert.throws(() => generate(path.join(tempDir(), 'x'), 'Bad Name'), /name "Bad Name"/);
  const busy = tempDir();
  fs.writeFileSync(path.join(busy, 'file.txt'), 'x');
  assert.throws(() => generate(busy, 'ok'), /is not empty/);
  assert.equal(
    fillPlaceholders("t('__TITLE_TS__')", { name: 'a', title: "it's \\ ok", db: false }),
    "t('it\\'s \\\\ ok')",
  );
  const marked = 'a\n<!-- if db -->\nB\n<!-- end db -->\nc';
  assert.equal(fillPlaceholders(marked, { name: 'a', title: '', db: false }), 'a\nc');
  assert.equal(fillPlaceholders(marked, { name: 'a', title: '', db: true }), 'a\nB\nc');
  assert.equal(
    JSON.parse(packageJsonText({ name: 'n', spec: 's', db: false })).engines.node,
    '>=22.12',
  );
  assert.match(DEFAULT_ENGINE.version, /^\d+\.\d+\.\d+$/);
});

test('the SDK dependency: the repository when installed, the folder in a checkout', () => {
  assert.equal(sdkSpec(CLI_DIR), `file:${CLI_DIR.split(path.sep).join('/')}`);
  const installed = path.join(tempDir(), 'node_modules', '@varion', 'sdk');
  fs.mkdirSync(installed, { recursive: true });
  fs.copyFileSync(path.join(CLI_DIR, 'package.json'), path.join(installed, 'package.json'));
  assert.equal(sdkSpec(installed), 'git+https://github.com/Varion-Team/varion-sdk.git');
});

test('varion new: files, then a git repository with the first commit', async () => {
  const parent = tempDir();
  const lines = [];
  const sink = { write: (chunk) => lines.push(String(chunk)), isTTY: false };
  const code = await main(
    ['new', 'cmd-demo', '--cwd', parent, '--no-install', '--json', '--port', '7800'],
    {
      stdout: sink,
      stderr: sink,
    },
  );
  assert.equal(code, 0);
  const events = lines
    .join('')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const created = events.find((event) => event.type === 'new');
  assert.equal(created.name, 'cmd-demo');
  const dir = path.join(parent, 'cmd-demo');
  assert.ok(fs.existsSync(path.join(dir, 'varion.toml')));

  const gitEvent = events.find((event) => event.type === 'git');
  const hasGit = spawnSync('git', ['--version']).status === 0;
  assert.equal(gitEvent.initialized, hasGit);
  if (gitEvent.committed) {
    const log = spawnSync('git', ['log', '--format=%s'], { cwd: dir, encoding: 'utf8' });
    assert.equal(log.stdout.trim(), 'Initial commit');
    const status = spawnSync('git', ['status', '--porcelain'], { cwd: dir, encoding: 'utf8' });
    assert.equal(status.stdout.trim(), '', 'everything is committed');
  }
});

test('varion new --no-git leaves git alone', async () => {
  const parent = tempDir();
  const sink = { write: () => {}, isTTY: false };
  const code = await main(['new', 'plain', '--cwd', parent, '--no-install', '--no-git', '--json'], {
    stdout: sink,
    stderr: sink,
  });
  assert.equal(code, 0);
  assert.equal(fs.existsSync(path.join(parent, 'plain', '.git')), false);
});
