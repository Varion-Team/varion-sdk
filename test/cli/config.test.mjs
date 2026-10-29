import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test, { after } from 'node:test';
import {
  DEPLOY_ENV,
  loadDotenv,
  loadProject,
  normalizeConfig,
  parseDotenv,
  resourceConfig,
  serverSettings,
  stringifyDotenv,
} from '../../src/cli/config.mjs';
import { parseToml } from '../../src/cli/toml.mjs';
import { CliError } from '../../src/cli/output.mjs';
import { cleanupTempDirs, tempDir, writeFiles } from './helpers.mjs';

after(cleanupTempDirs);

const BASE = `
[project]
name = "demo"
[engine]
version = "1.0.75"
[server]
name = "Demo"
port = 7940
httpPort = 7941
useCloudAuth = true
serverPassword = "secret"
spawn = [1.0, 2.0, 3.0]
[config]
title = "Demo"
limit = 5
[env.test]
name = "Demo (test)"
maxPlayers = 64
[env.test.config]
limit = 50
[deploy]
cabinet = "http://127.0.0.1:9999"
[deploy.test]
server = "srv-1"
`;

const normalize = (text, root = process.cwd()) => normalizeConfig(parseToml(text), { root });

test('config: defaults filled in', () => {
  const { config, warnings } = normalize(BASE);
  assert.deepEqual(warnings, []);
  assert.equal(config.project.name, 'demo');
  assert.equal(config.project.title, 'demo');
  assert.equal(config.engine.channel, 'rc');
  assert.equal(config.engine.path, null);
  assert.equal(config.build.kind, 'standard');
  assert.equal(config.build.server, 'src/server/index.ts');
  assert.equal(config.build.typecheck, true);
  assert.equal(config.dev.ui, 'build');
  assert.equal(config.dev.uiPort, 7935);
  assert.equal(config.database, null);
  assert.equal(config.deploy.cabinet, 'http://127.0.0.1:9999');
  assert.equal(config.deploy.envs.test.server, 'srv-1');
});

test('config: [env.<name>] over [server] and [config]', () => {
  const { config } = normalize(BASE);
  const plain = serverSettings(config);
  assert.equal(plain.name, 'Demo');
  assert.equal(plain.maxPlayers, undefined);
  assert.equal(plain.host, '127.0.0.1', 'no host on a developer PC: loopback only');
  assert.equal(
    serverSettings(config, { release: true }).host,
    undefined,
    'a release keeps varion.toml as written',
  );
  const test = serverSettings(config, { envName: 'test' });
  assert.equal(test.name, 'Demo (test)');
  assert.equal(test.maxPlayers, 64);
  assert.equal(test.port, 7940);
  assert.deepEqual(resourceConfig(config, { envName: 'test' }), { title: 'Demo', limit: 50 });
  assert.deepEqual(resourceConfig(config), { title: 'Demo', limit: 5 });
  assert.throws(() => serverSettings(config, { envName: 'nope' }), CliError);
});

test('config: wrong values are errors that name the key', () => {
  const cases = [
    ['[project]\nname = "Bad Name"\n[engine]\nversion = "1.0.75"', /\[project\] name/],
    ['[project]\nname = "x"', /\[engine\]/],
    ['[project]\nname = "x"\n[engine]\nversion = "one"', /is not a version/],
    [
      '[project]\nname = "x"\n[engine]\nversion = "1.0.75"\n[server]\nport = "7940"',
      /\[server\] port/,
    ],
    [
      '[project]\nname = "x"\n[engine]\nversion = "1.0.75"\n[server]\nport = 70000',
      /from 1 to 65535/,
    ],
    [
      '[project]\nname = "x"\n[engine]\nversion = "1.0.75"\n[server]\nresources = ["a"]',
      /is set by varion itself/,
    ],
    ['[project]\nname = "x"\n[engine]\nversion = "1.0.75"\n[server]\nspawn = [1, 2]', /spawn/],
    [
      '[project]\nname = "x"\n[engine]\nversion = "1.0.75"\n[deploy.staging]\nserver = "a"',
      /test, prod or preview/,
    ],
    ['[project]\nname = "x"\n[engine]\nversion = "1.0.75"\n[dev]\nui = "hot"', /\[dev\] ui/],
    [
      '[project]\nname = "x"\n[engine]\nversion = "1.0.75"\n[build.steps.server]\nwatch = ["a"]',
      /needs run/,
    ],
  ];
  for (const [text, message] of cases) {
    assert.throws(
      () => normalize(text),
      (error) => error instanceof CliError && message.test(error.message),
      text,
    );
  }
});

test('config: unknown tables and keys are warnings, a custom build, a managed database', () => {
  const { config, warnings } = normalize(
    `
[project]
name = "rp"
[engine]
path = "engine"
[build.steps.server]
run = "node build.mjs --out {out} --only server"
watch = ["server", "shared"]
[build.steps.client]
run = "node build.mjs --out {out} --only client"
[database]
seed = "db/seed.sql"
[surprise]
x = 1
[dev]
mystery = true
`,
    'C:/proj',
  );
  assert.equal(config.build.kind, 'custom');
  assert.deepEqual(
    config.build.steps.map((step) => step.name),
    ['server', 'client'],
  );
  assert.equal(config.engine.path, path.resolve('C:/proj', 'engine'));
  assert.equal(config.database.managed, true);
  assert.equal(config.database.port, 3317);
  assert.equal(config.database.name, 'rp');
  assert.equal(config.database.seed, path.resolve('C:/proj', 'db/seed.sql'));
  assert.equal(warnings.length, 2);
  assert.match(warnings.join('\n'), /\[surprise\]/);
  assert.match(warnings.join('\n'), /\[dev\]\.mystery/);
  const own = normalize(
    '[project]\nname = "x"\n[engine]\nversion = "1.0.75"\n[database]\nstart = "db/start.ps1"',
  ).config.database;
  assert.equal(own.managed, false);
});

test('deploy environments of the contract', () => {
  for (const name of ['test', 'prod', 'preview-main', 'preview-feat.ui-2'])
    assert.ok(DEPLOY_ENV.test(name), name);
  for (const name of ['staging', 'preview-', 'Prod', 'preview-Main'])
    assert.ok(!DEPLOY_ENV.test(name), name);
});

test('dotenv: parsing, writing, and the files of a run', () => {
  const values = parseDotenv(
    '# c\nA=1\nexport B = two words # note\nC="x\\ny \\"q\\""\nD=\'raw #x\'\nE=a#b\n bad line\n',
  );
  assert.deepEqual(values, { A: '1', B: 'two words', C: 'x\ny "q"', D: 'raw #x', E: 'a#b' });
  assert.deepEqual(parseDotenv(stringifyDotenv(values)), values);

  const root = tempDir();
  writeFiles(root, {
    '.env': 'A=base\nB=base\nC=base\n',
    '.env.staging': 'B=staging\n',
  });
  assert.deepEqual(loadDotenv(root).values, { A: 'base', B: 'base', C: 'base' });
  assert.deepEqual(loadDotenv(root, { envName: 'staging' }).values, {
    A: 'base',
    B: 'staging',
    C: 'base',
  });
  const other = loadDotenv(root, { dotenvFile: 'missing.env' });
  assert.equal(other.baseExists, false);
  assert.deepEqual(other.values, {});
});

test('loadProject finds varion.toml above the current folder', () => {
  const root = tempDir();
  writeFiles(root, { 'varion.toml': BASE, 'src/server/index.ts': '' });
  const project = loadProject(path.join(root, 'src', 'server'));
  assert.equal(project.root, root);
  assert.equal(project.paths.server, path.join(root, '.varion', 'server'));
  assert.equal(loadProject(tempDir(), { requireRoot: false }), null);
  assert.ok(fs.existsSync(project.file));
});
