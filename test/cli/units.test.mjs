// Small pieces: globs, source maps, tool output parsing, server.toml, console lines, args.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test, { after } from 'node:test';
import { findFiles, globToRegExp } from '../../src/cli/glob.mjs';
import { createSourceMapper, decodeVlq } from '../../src/cli/sourcemap.mjs';
import { parseTscOutput } from '../../src/cli/typecheck.mjs';
import { nonAsciiConfigKeys, parseBuildOutput } from '../../src/cli/build.mjs';
import { serverTomlText, writeServerFolder } from '../../src/cli/server-config.mjs';
import { parseLeakLine, parseServerLine, sourceLocation } from '../../src/cli/server.mjs';
import { engineKnowsPartRestart, restartCommand } from '../../src/cli/commands/dev.mjs';
import { engineKnowsDevUi } from '../../src/cli/devui.mjs';
import { engineGarblesConfigText } from '../../src/cli/engine.mjs';
import { parseArgs } from '../../src/cli/args.mjs';
import { databaseEnvKeys } from '../../src/cli/database.mjs';
import { parseToml } from '../../src/cli/toml.mjs';
import { CliError } from '../../src/cli/output.mjs';
import { cleanupTempDirs, tempDir, writeFiles } from './helpers.mjs';

after(cleanupTempDirs);

test('globs', () => {
  const re = globToRegExp('tests/**/*.test.{ts,mjs}');
  for (const ok of ['tests/a.test.ts', 'tests/x/y/b.test.mjs']) assert.ok(re.test(ok), ok);
  for (const no of ['tests/a.test.js', 'src/tests/a.test.ts', 'tests/a.test.ts.bak'])
    assert.ok(!re.test(no), no);
  assert.ok(globToRegExp('client/**').test('client/a/b.js'));
  const root = tempDir();
  writeFiles(root, {
    'tests/a.test.ts': '',
    'tests/deep/b.test.mjs': '',
    'tests/node_modules/c.test.ts': '',
    'tests/helper.ts': '',
  });
  assert.deepEqual(findFiles(root, ['tests/**/*.test.ts', 'tests/**/*.test.mjs']), [
    'tests/a.test.ts',
    'tests/deep/b.test.mjs',
  ]);
});

test('source maps: VLQ and positions', () => {
  assert.deepEqual(decodeVlq('AAAA'), [0, 0, 0, 0]);
  assert.deepEqual(decodeVlq('gBAAiB'), [16, 0, 0, 17]);
  assert.deepEqual(decodeVlq('jBD'), [-17, -1]);
  // line 1: col 0 -> src 0 line 0 col 0; col 4 -> src 0 line 2 col 2
  const mapper = createSourceMapper(
    { sources: ['../../src/a.ts'], mappings: 'AAAA,IAEE' },
    path.join('C:', 'p', 'out', 'client'),
  );
  assert.deepEqual(mapper(1, 5), { file: path.resolve('C:/p/src/a.ts'), line: 3, column: 3 });
  assert.equal(mapper(2, 0), null);
});

test('tool output: tsc and esbuild-style lines', () => {
  const root = path.resolve('C:/proj');
  const tsc = parseTscOutput(
    "src/ui/main.ts(18,61): error TS2345: Argument of type '\"x\"' is not assignable\n  to parameter of type 'y'.\nerror TS5083: Cannot read file",
    root,
  );
  assert.deepEqual(tsc[0], {
    file: 'src/ui/main.ts',
    line: 18,
    column: 61,
    code: 'TS2345',
    text: "Argument of type '\"x\"' is not assignable to parameter of type 'y'.",
  });
  assert.equal(tsc[1].code, 'TS5083');
  const esbuild = parseBuildOutput(
    '✘ [ERROR] Could not resolve "x"\n\n    src/server/index.ts:3:18:\n',
    root,
  );
  assert.deepEqual(esbuild, [
    { file: 'src/server/index.ts', line: 3, column: 18, text: 'Could not resolve "x"' },
  ]);
});

test('server.toml: path keys literal, spawn, resource order without duplicates', () => {
  const text = serverTomlText(
    {
      name: 'Демо "x"',
      host: '127.0.0.1',
      port: 7940,
      dataDir: 'C:\\Servers\\data',
      gtaBuilds: [3889],
      spawn: [1.5, 2, 3],
    },
    { resources: ['rp_cars', 'chat', 'demo'], gamemode: 'demo' },
  );
  const parsed = parseToml(text);
  assert.equal(parsed.name, 'Демо "x"');
  assert.match(text, /^dataDir = 'C:\\Servers\\data'$/m);
  assert.deepEqual([parsed.spawnX, parsed.spawnY, parsed.spawnZ], [1.5, 2, 3]);
  assert.equal(parsed.spawn, undefined);
  assert.deepEqual(parsed.resources, ['rp_cars', 'chat', 'demo']);
  assert.equal(parsed.gamemode, 'demo');
  assert.deepEqual(parsed.modules, []);
  const dir = tempDir();
  writeFiles(dir, { 'resources/packs.txt': 'rp_a\n# comment\nrp_b\n' });
  const order = writeServerFolder(dir, {
    settings: { port: 1, httpPort: 2 },
    gamemode: 'demo',
    assetResources: ['rp_cars'],
    lists: ['resources/packs.txt'],
    extra: ['chat', 'rp_a'],
    envValues: { A: 'x y' },
  });
  assert.deepEqual(order, ['rp_cars', 'rp_a', 'rp_b', 'chat', 'demo']);
  assert.match(fs.readFileSync(path.join(dir, '.env'), 'utf8'), /^A="x y"$/m);
});

test('server log lines: levels, resources, leaks, locations', () => {
  assert.deepEqual(parseServerLine('[2026-10-28 20:14:19.115] [warn] [js] [host] something'), {
    level: 'warn',
    component: 'js',
    text: '[host] something',
  });
  assert.equal(parseServerLine('[t] [ok] [server] up').level, 'info');
  const leak = parseLeakLine(
    parseServerLine(
      "[t] [warn] [res] resource 'varion-rp' stopped but left open: TCP listener 127.0.0.1:3110 (HTTP, 2 connections), 1 interval",
    ),
  );
  assert.deepEqual(leak, {
    resource: 'varion-rp',
    after: 'stop',
    summary: 'TCP listener 127.0.0.1:3110 (HTTP, 2 connections), 1 interval',
  });
  assert.equal(
    parseLeakLine(
      parseServerLine("[t] [warn] [res] resource 'x' failed to load but left open: 1 timer"),
    ).after,
    'load-failure',
  );
  assert.equal(parseLeakLine(parseServerLine('[t] [info] [res] loaded x')), null);
  const root = path.resolve('C:/proj');
  assert.deepEqual(
    sourceLocation(`at f (${path.join(root, 'src', 'server', 'index.ts')}:12:5)`, root),
    { file: 'src/server/index.ts', line: 12, column: 5 },
  );
  assert.equal(
    sourceLocation(`at g (${path.join(root, 'node_modules', 'x', 'i.js')}:1:1)`, root),
    undefined,
  );
});

test('restart after a rebuild: one part when the engine can', () => {
  assert.equal(restartCommand(['client'], 'demo', true), 'restart-client demo');
  assert.equal(restartCommand(['client', 'ui'], 'demo', true), 'restart-client demo');
  assert.equal(restartCommand(['server'], 'demo', true), 'restart-server demo');
  assert.equal(restartCommand(['server', 'client'], 'demo', true), 'restart demo');
  assert.equal(restartCommand(['copy'], 'demo', true), 'restart demo');
  assert.equal(restartCommand(['client'], 'demo', false), 'restart demo');
});

test('what the engine can: [dev-ui] in the server binary, restart-client in its host', () => {
  const dir = tempDir();
  writeFiles(dir, {
    'old/varion-server.exe': 'MZ 1.0.75',
    'new/varion-server.exe': 'MZ .. [dev-ui] left out ..',
    'old/host/varion-host.cjs': '// restart only',
    'new/host/varion-host.cjs': "'restart-client'",
  });
  assert.equal(engineKnowsDevUi(path.join(dir, 'old', 'varion-server.exe')), false);
  assert.equal(engineKnowsDevUi(path.join(dir, 'new', 'varion-server.exe')), true);
  assert.equal(engineKnowsDevUi(path.join(dir, 'missing.exe')), false);
  assert.equal(engineKnowsPartRestart({ dir: path.join(dir, 'old') }), false);
  assert.equal(engineKnowsPartRestart({ dir: path.join(dir, 'new') }), true);
});

test('[config] text that the engine would garble is named', () => {
  assert.deepEqual(nonAsciiConfigKeys({ a: 'ascii', b: 'Привет', c: { d: ['x', 'ё'] }, n: 5 }), [
    'b',
    'c.d',
  ]);
});

test('only an engine up to 1.0.75 garbles [config] text', () => {
  assert.equal(engineGarblesConfigText({ version: '1.0.75' }), true);
  assert.equal(engineGarblesConfigText({ version: '1.0.75-rc.1' }), true);
  assert.equal(engineGarblesConfigText({ version: '1.0.9' }), true);
  assert.equal(engineGarblesConfigText({ version: '0.9.99' }), true);
  assert.equal(engineGarblesConfigText({ version: '1.0.76' }), false);
  assert.equal(engineGarblesConfigText({ version: '1.1.0' }), false);
  assert.equal(engineGarblesConfigText({ version: '2.0.0' }), false);
  const dir = tempDir('varion-cli-engine-version-');
  fs.writeFileSync(path.join(dir, 'version.json'), JSON.stringify({ version: '1.0.76-dev' }));
  assert.equal(
    engineGarblesConfigText({ version: '1.0.75', path: dir }),
    false,
    '[engine] path: its version.json decides',
  );
  assert.equal(
    engineGarblesConfigText({ path: path.join(dir, 'missing') }),
    false,
    'unknown version: taken as fixed',
  );
});

test('arguments', () => {
  const spec = {
    command: 'dev',
    options: { env: 'string', 'no-watch': 'boolean', port: 'number' },
    aliases: { C: 'env' },
  };
  assert.deepEqual(parseArgs(['--env', 'test', '--no-watch', 'x', '--port=7940'], spec), {
    options: { env: 'test', noWatch: true, port: 7940 },
    positionals: ['x'],
  });
  assert.deepEqual(parseArgs(['-C', 'a', '--', '--env'], spec).positionals, ['--env']);
  assert.throws(
    () => parseArgs(['--envv', 'x'], spec),
    (error) => error instanceof CliError && /unknown option --envv/.test(error.message),
  );
  assert.throws(() => parseArgs(['--env'], spec), /needs a value/);
  assert.throws(() => parseArgs(['--port', 'abc'], spec), /needs a number/);
});

test('database .env names follow .env.example', () => {
  assert.deepEqual(databaseEnvKeys({ env: {} }, {}), {
    host: 'DB_HOST',
    port: 'DB_PORT',
    name: 'DB_NAME',
    user: 'DB_USER',
    password: 'DB_PASSWORD',
    url: null,
  });
  const rp = databaseEnvKeys(
    { env: {} },
    { DB_HOST: '', DB_PORT: '', DB_USERNAME: '', DB_PASSWORD: '', DB_DATABASE: '' },
  );
  assert.deepEqual([rp.user, rp.name], ['DB_USERNAME', 'DB_DATABASE']);
  assert.equal(databaseEnvKeys({ env: { name: 'MY_DB' } }, { DB_NAME: '' }).name, 'MY_DB');
  assert.equal(databaseEnvKeys({ env: {} }, { DATABASE_URL: '' }).url, 'DATABASE_URL');
});
