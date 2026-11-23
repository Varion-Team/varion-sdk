import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test, { after } from 'node:test';
import {
  createBuilder,
  formatErrors,
  nonAsciiConfigKeys,
  parseBuildOutput,
} from '../../src/cli/build.mjs';
import { loadProject } from '../../src/cli/config.mjs';
import { CliError, createMemoryOutput } from '../../src/cli/output.mjs';
import { cleanupTempDirs, FAKE_TOOLS, tempDir, writeFiles } from './helpers.mjs';

after(cleanupTempDirs);

const TOML = `
[project]
name = "city"

[engine]
version = "1.0.97"

[build]
typecheck = false
copy = ["data", "LICENSE.txt", "missing"]

[config]
greeting = "hello"

[dev]
watch = ["extra"]
`;

function project(files = {}, toml = TOML) {
  const root = path.join(tempDir(), 'city');
  writeFiles(root, {
    'varion.toml': toml,
    'src/server/index.ts': 'export const side = "server";\n',
    'src/client/index.ts': 'export const side = "client";\n',
    'src/ui/index.html': '<html></html>\n',
    'data/spawns.json': '[]\n',
    'LICENSE.txt': 'mine\n',
    ...FAKE_TOOLS,
    ...files,
  });
  return loadProject(root);
}

function builderFor(loaded, options = {}) {
  const output = createMemoryOutput();
  const builder = createBuilder(loaded, output, {
    outDir: loaded.paths.server,
    mapsDir: loaded.paths.maps,
    ...options,
  });
  return { builder, output };
}

const read = (...parts) => fs.readFileSync(path.join(...parts), 'utf8');

test('a standard build writes the three parts, resource.toml and the copied files', async () => {
  const loaded = project();
  const { builder, output } = builderFor(loaded);
  const built = await builder.build();
  await builder.dispose();

  assert.equal(built.ok, true);
  assert.deepEqual(built.results.map((result) => result.part).sort(), ['client', 'server', 'ui']);
  const resource = builder.resourceDir;
  assert.equal(resource, path.join(loaded.paths.server, 'resources', 'city'));
  assert.match(read(resource, 'server', 'index.js'), /^\/\/ cjs node "development"/);
  assert.match(read(resource, 'client', 'index.js'), /^\/\/ esm neutral "development"/);
  assert.equal(read(resource, 'ui', 'index.html'), '<!-- development -->');
  // the server bundle is CommonJS whatever the project's package.json says
  assert.deepEqual(JSON.parse(read(resource, 'server', 'package.json')), {
    type: 'commonjs',
    private: true,
  });
  // the client's map is kept beside the build, not inside the resource
  assert.equal(fs.existsSync(path.join(resource, 'client', 'index.js.map')), false);
  assert.equal(read(loaded.paths.maps, 'client.js.map'), '{}');

  const toml = read(resource, 'resource.toml');
  assert.match(toml, /^main = "server\/index\.js"$/m);
  assert.match(toml, /^client-main = "client\/index\.js"$/m);
  assert.match(toml, /^client-files = \["client\/\*\*", "ui\/\*\*"\]$/m);
  assert.match(toml, /^greeting = "hello"$/m);
  assert.equal(read(resource, 'data', 'spawns.json'), '[]\n');
  assert.equal(read(resource, 'LICENSE.txt'), 'mine\n');

  const events = output.events();
  assert.equal(events.filter((event) => event.type === 'build' && event.ok).length, 3);
  assert.ok(events.some((event) => event.type === 'warn' && /copy: missing/.test(event.text)));
});

test('a release build is a production build without a client map', async () => {
  const loaded = project();
  const { builder } = builderFor(loaded, { mode: 'release', mapsDir: null });
  assert.equal((await builder.build()).ok, true);
  await builder.dispose();
  assert.match(read(builder.resourceDir, 'server', 'index.js'), /"production"/);
  assert.equal(read(builder.resourceDir, 'ui', 'index.html'), '<!-- production -->');
  assert.equal(fs.existsSync(loaded.paths.maps), false);
});

test('a part that does not bundle is reported with its place, and nothing is written', async () => {
  const loaded = project({ 'src/server/index.ts': 'export const side =\n    BROKEN;\n' });
  const { builder, output } = builderFor(loaded, { failureNote: 'the old build stays' });
  const built = await builder.build();
  await builder.dispose();

  assert.equal(built.ok, false);
  const failed = built.results.find((result) => !result.ok);
  assert.equal(failed.part, 'server');
  assert.equal(failed.stage, 'bundle');
  assert.deepEqual(failed.errors, [
    { file: 'src/server/index.ts', line: 2, column: 5, text: 'Unexpected "BROKEN"' },
  ]);
  assert.equal(fs.existsSync(path.join(builder.resourceDir, 'resource.toml')), false);
  const event = output.events().find((item) => item.type === 'build' && !item.ok);
  assert.equal(event.part, 'server');
});

test('a page that does not build is reported by the first line of its error', async () => {
  const loaded = project({ 'src/ui/index.html': '<html>BROKEN</html>\n' });
  const { builder } = builderFor(loaded);
  const built = await builder.build(['ui']);
  await builder.dispose();
  assert.deepEqual(built.results, [
    {
      part: 'ui',
      ok: false,
      ms: built.results[0].ms,
      errors: [{ file: 'src/ui/index.html', line: 3, column: 1, text: 'page is broken' }],
      stage: 'bundle',
    },
  ]);
});

test('only the parts that are asked for are built', async () => {
  const loaded = project();
  const { builder } = builderFor(loaded);
  const built = await builder.build(['client']);
  await builder.dispose();
  assert.deepEqual(
    built.results.map((result) => result.part),
    ['client'],
  );
  assert.equal(fs.existsSync(path.join(builder.resourceDir, 'server')), false);
});

test('a missing server entry stops the build; a missing client or page is left out', () => {
  const loaded = project();
  fs.rmSync(path.join(loaded.root, 'src', 'client'), { recursive: true });
  const { builder, output } = builderFor(loaded);
  assert.deepEqual(builder.parts, ['server', 'ui']);
  assert.ok(output.events().some((event) => /client: .* does not exist/.test(event.text)));

  fs.rmSync(path.join(loaded.root, 'src', 'server'), { recursive: true });
  assert.throws(
    () => builderFor(loaded),
    (error) => {
      assert.ok(error instanceof CliError);
      assert.match(error.message, /\[build\] server: .* does not exist/);
      return true;
    },
  );
});

test('a changed file names the parts to build again', () => {
  const loaded = project();
  const { builder } = builderFor(loaded);
  assert.deepEqual(builder.partsFor('src/server/jobs/taxi.ts'), ['server']);
  assert.deepEqual(builder.partsFor('src/client/hud.ts'), ['client']);
  assert.deepEqual(builder.partsFor('src/ui/app.css'), ['ui']);
  assert.deepEqual(builder.partsFor('data/spawns.json'), ['copy']);
  // shared code belongs to every part
  assert.deepEqual(builder.partsFor('src/shared/events.ts'), ['server', 'client', 'ui']);
});

test('the watched folders are the sources, the copied files and [dev] watch', () => {
  const loaded = project();
  const { builder } = builderFor(loaded);
  const watched = builder.watchDirs().map((dir) => path.relative(loaded.root, dir));
  assert.deepEqual(
    watched.map((dir) => dir.split(path.sep).join('/')),
    ['src/server', 'src/client', 'src/ui', 'src', 'data', 'LICENSE.txt', 'missing', 'extra'],
  );
});

test('copyOnly refreshes the copied files without a build', async () => {
  const loaded = project();
  const { builder } = builderFor(loaded);
  await builder.build();
  await builder.dispose();
  fs.writeFileSync(path.join(loaded.root, 'data', 'spawns.json'), '[1]\n');
  builder.copyOnly();
  assert.equal(read(builder.resourceDir, 'data', 'spawns.json'), '[1]\n');
});

test('a transform of resource.toml is applied at once, kept by later builds and taken back', async () => {
  const loaded = project();
  const { builder } = builderFor(loaded);
  await builder.build();
  const file = path.join(builder.resourceDir, 'resource.toml');
  const plain = read(file);
  const declare = (text) => `${text}\n[dev-ui]\nurl = "http://127.0.0.1:7935/"\n`;

  builder.setResourceTransform(declare);
  assert.equal(read(file), declare(plain));
  await builder.build();
  assert.equal(read(file), declare(plain));
  builder.setResourceTransform(null);
  assert.equal(read(file), plain);
  await builder.dispose();
});

test('clean removes the built resource', async () => {
  const loaded = project();
  const { builder } = builderFor(loaded);
  await builder.build();
  await builder.dispose();
  builder.clean();
  assert.equal(fs.existsSync(builder.resourceDir), false);
});

const STEPS = `
[project]
name = "city"

[engine]
version = "1.0.97"

[build.steps.server]
run = "node tools/step.mjs {resource} {mode}"
watch = ["src/server"]

[build.steps.client]
run = "node tools/step.mjs {resource} fail"
watch = ["src/client"]
`;

const STEP = `
import fs from 'node:fs';
import path from 'node:path';
const [resource, mode] = process.argv.slice(2);
if (mode === 'fail') {
  console.error('src/client/index.ts(4,7): error TS2322: wrong type');
  process.exit(3);
}
fs.mkdirSync(resource, { recursive: true });
fs.writeFileSync(path.join(resource, 'resource.toml'), 'type = "js"\\nmode = "' + mode + '"\\n');
`;

test("a build of the project's own steps runs them in order and stops at a failure", async () => {
  const loaded = project({ 'tools/step.mjs': STEP }, STEPS);
  const { builder } = builderFor(loaded);
  assert.deepEqual(builder.parts, ['server', 'client']);
  assert.deepEqual(builder.partsFor('src/client/hud.ts'), ['client']);
  assert.deepEqual(builder.watchDirs(), [
    path.join(loaded.root, 'src', 'server'),
    path.join(loaded.root, 'src', 'client'),
  ]);

  const built = await builder.build();
  assert.equal(built.ok, false);
  const [server, client] = built.results;
  assert.equal(server.ok, true);
  assert.equal(read(builder.resourceDir, 'resource.toml'), 'type = "js"\nmode = "dev"\n');
  assert.equal(client.ok, false);
  assert.deepEqual(client.errors, [
    { file: 'src/client/index.ts', line: 4, column: 7, text: 'TS2322: wrong type' },
  ]);
  assert.match(client.output, /error TS2322/);
});

test('a transform reaches the resource.toml a step of the project wrote', async () => {
  const loaded = project({ 'tools/step.mjs': STEP }, STEPS);
  const { builder } = builderFor(loaded);
  builder.setResourceTransform((text) => `${text}live = true\n`);
  await builder.build(['server']);
  assert.match(read(builder.resourceDir, 'resource.toml'), /^live = true$/m);
  builder.setResourceTransform(null, { undo: (text) => text.replace('live = true\n', '') });
  assert.doesNotMatch(read(builder.resourceDir, 'resource.toml'), /live/);
});

test('build output is read for the place of each error', () => {
  const root = path.resolve('project');
  const text = [
    'src/server/index.ts(3,9): error TS2304: Cannot find name "x".',
    '✘ [ERROR] Could not resolve "./missing"',
    '',
    '    src/client/index.ts:1:19:',
    'nothing of interest',
  ].join('\n');
  assert.deepEqual(parseBuildOutput(text, root), [
    { file: 'src/server/index.ts', line: 3, column: 9, text: 'TS2304: Cannot find name "x".' },
    { file: 'src/client/index.ts', line: 1, column: 19, text: 'Could not resolve "./missing"' },
  ]);
  assert.deepEqual(parseBuildOutput('all good', root), []);
});

test('errors are printed with their count, a note and at most twenty lines', () => {
  const output = createMemoryOutput({ json: false, prefix: 'dev' });
  const one = formatErrors(
    'build of server',
    [{ file: 'a.ts', line: 1, column: 2, text: 'bad' }],
    output,
  );
  assert.equal(one, '[dev] build of server: 1 error\n  a.ts:1:2  bad');

  const many = Array.from({ length: 23 }, (_, index) => ({
    file: null,
    line: 0,
    column: 0,
    text: `e${index}`,
  }));
  const lines = formatErrors('type check of ui', many, output, 'kept').split('\n');
  assert.equal(lines[0], '[dev] type check of ui: 23 errors; kept');
  assert.equal(lines.length, 22);
  assert.equal(lines.at(-1), '  ... and 3 more');
  assert.equal(formatErrors('x', [], output), '[dev] x: 1 error');
});

test('config keys with text outside ASCII are found at any depth', () => {
  assert.deepEqual(
    nonAsciiConfigKeys({
      name: 'city',
      title: 'Город',
      tags: ['rp', 'рп'],
      nested: { motd: 'Привет', port: 7788, deeper: { again: 'ёж' } },
      list: [1, 2],
    }),
    ['title', 'tags', 'nested.motd', 'nested.deeper.again'],
  );
  assert.deepEqual(nonAsciiConfigKeys(undefined), []);
});
