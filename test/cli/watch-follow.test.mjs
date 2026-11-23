import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import test, { after } from 'node:test';
import { followGameLogs, followSlowHandlers } from '../../src/cli/follow.mjs';
import { createMemoryOutput } from '../../src/cli/output.mjs';
import { watchProject } from '../../src/cli/watch.mjs';
import { cleanupTempDirs, tempDir, writeFiles } from './helpers.mjs';

after(cleanupTempDirs);

async function until(condition, what, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = condition();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.fail(`timed out waiting for ${what}`);
}

test('a saved file reaches the watcher once, by its path in the project', async () => {
  const root = tempDir();
  writeFiles(root, { 'src/server/index.ts': '1', 'varion.toml': '' });
  const batches = [];
  const watcher = watchProject(
    root,
    [path.join(root, 'src'), path.join(root, 'varion.toml'), path.join(root, 'missing')],
    (files) => batches.push(files),
    { debounceMs: 60 },
  );
  try {
    fs.writeFileSync(path.join(root, 'src', 'server', 'index.ts'), '2');
    fs.writeFileSync(path.join(root, 'src', 'server', 'index.ts'), '3');
    // some systems also name the folder the file is in, and may split two saves in two batches
    await until(() => batches.flat().includes('src/server/index.ts'), 'the saved file');

    fs.writeFileSync(path.join(root, 'varion.toml'), '[project]');
    await until(() => batches.flat().includes('varion.toml'), 'the settings file');
    assert.ok(batches.flat().every((file) => !path.isAbsolute(file) && !file.includes('\\')));
  } finally {
    watcher.close();
  }
});

test('editor leftovers and folders of tools are not watched', async () => {
  const root = tempDir();
  writeFiles(root, { 'src/a.ts': '1' });
  const batches = [];
  const watcher = watchProject(root, [path.join(root, 'src')], (files) => batches.push(files), {
    debounceMs: 60,
  });
  try {
    writeFiles(root, {
      'src/node_modules/x/index.js': '',
      'src/.git/HEAD': '',
      'src/a.ts~': '',
      'src/a.ts.swp': '',
      'src/a.tmp': '',
      'src/b.ts': '2',
    });
    await until(() => batches.length, 'a batch');
    assert.deepEqual(
      batches.flat().filter((file) => file !== 'src'),
      ['src/b.ts'],
    );
  } finally {
    watcher.close();
  }
  const seen = batches.length;
  fs.writeFileSync(path.join(root, 'src', 'a.ts'), 'after close');
  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.equal(batches.length, seen);
});

const SCRIPTS = 'varion_client_scripts.log';

function follow(dir, extra = {}) {
  const output = createMemoryOutput();
  const follower = followGameLogs({
    dir,
    output,
    root: dir,
    resourceName: 'city',
    mapFile: path.join(dir, 'missing.map'),
    mapBase: dir,
    intervalMs: 20,
    ...extra,
  });
  return { output, follower };
}

test('only what the game writes after the start is shown, and only the lines of modes', async () => {
  const dir = tempDir();
  fs.writeFileSync(path.join(dir, SCRIPTS), 'JS_LOG level=info resource=city old line\n');
  const { output, follower } = follow(dir);
  try {
    fs.appendFileSync(
      path.join(dir, SCRIPTS),
      [
        'JS_LOG level=info resource=city hello',
        'JS_LOG level=info resource=(core) chatter',
        'JS_LOG level=info resource=city NATIVE_CALL_TRACE x',
        'not a script line',
        '',
        'JS_LOG level=error resource=other boom',
        'JS_LOG level=warn resource=city half a li',
      ].join('\n'),
    );
    await until(() => output.events().length === 2, 'two lines');
    fs.appendFileSync(path.join(dir, SCRIPTS), 'ne\n');
    await until(() => output.events().length === 3, 'the line that was cut in two');
  } finally {
    follower.stop();
  }
  assert.deepEqual(
    output.events().map(({ source, level, resource, text }) => ({ source, level, resource, text })),
    [
      { source: 'game', level: 'info', resource: 'city', text: 'hello' },
      { source: 'game', level: 'error', resource: 'other', text: 'boom' },
      { source: 'game', level: 'warn', resource: 'city', text: 'half a line' },
    ],
  );
});

test('errors and crashes of the game are shown whole, and a new log is read from its start', async () => {
  const dir = tempDir();
  fs.writeFileSync(path.join(dir, 'varion_crash.log'), 'an old crash that is long enough\n');
  const { output, follower } = follow(dir);
  try {
    fs.writeFileSync(path.join(dir, 'varion_game_error.log'), 'script error\n');
    // shorter than what was there: the game started a new log
    fs.writeFileSync(path.join(dir, 'varion_crash.log'), 'new crash\n');
    await until(() => output.events().length === 2, 'both lines');
  } finally {
    follower.stop();
  }
  const events = output.events().map(({ source, level, text }) => ({ source, level, text }));
  assert.deepEqual(
    events.sort((a, b) => a.source.localeCompare(b.source)),
    [
      { source: 'crash', level: 'error', text: 'new crash' },
      { source: 'game-error', level: 'error', text: 'script error' },
    ],
  );
});

test('a place in the client bundle is shown as it stands when there is no source map', async () => {
  const dir = tempDir();
  const { output, follower } = follow(dir);
  try {
    fs.writeFileSync(
      path.join(dir, SCRIPTS),
      'JS_LOG level=error resource=city TypeError at client/index.js:12:5\n',
    );
    await until(() => output.events().length === 1, 'the line');
    follower.resetSourceMap();
  } finally {
    follower.stop();
  }
  assert.equal(output.events()[0].text, 'TypeError at client/index.js:12:5');
});

async function serverInfo(answers) {
  let hit = 0;
  const server = http.createServer((request, response) => {
    const body = answers[Math.min(hit++, answers.length - 1)];
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(body));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { port: server.address().port, close: () => new Promise((done) => server.close(done)) };
}

test('slow handlers are reported by how many slow calls were added since the last look', async () => {
  const slow = (slowCalls, peakMicros = 40_000) => ({
    worldSync: {
      slowResourceThresholdMicros: 25_000,
      slowResources: [{ resource: 'city', slowCalls, peakMicros, slowestCallback: 'onTick' }],
    },
  });
  // 3 slow calls, the same again, then a restart of the resource that counts from zero
  const info = await serverInfo([slow(3), slow(3), slow(1, 90_000), {}]);
  const output = createMemoryOutput();
  const follower = followSlowHandlers({ port: info.port, output, intervalMs: 20 });
  try {
    await until(() => output.events().length === 2, 'two reports');
    await new Promise((resolve) => setTimeout(resolve, 80));
  } finally {
    follower.stop();
    await info.close();
  }
  assert.deepEqual(
    output.events().map(({ type, time: _time, ...rest }) => ({ type, ...rest })),
    [
      { type: 'slow', resource: 'city', callback: 'onTick', added: 3, peakMs: 40, thresholdMs: 25 },
      { type: 'slow', resource: 'city', callback: 'onTick', added: 1, peakMs: 90, thresholdMs: 25 },
    ],
  );
});

test('a server that does not answer is not an error for the watcher of slow handlers', async () => {
  const info = await serverInfo([{}]);
  await info.close();
  const output = createMemoryOutput();
  const follower = followSlowHandlers({ port: info.port, output, intervalMs: 20 });
  await new Promise((resolve) => setTimeout(resolve, 100));
  follower.stop();
  assert.deepEqual(output.lines, []);
});

test('a line of the game that names a source file of the project carries its place', async () => {
  const dir = tempDir();
  const { output, follower } = follow(dir);
  try {
    fs.writeFileSync(
      path.join(dir, SCRIPTS),
      [
        'JS_LOG level=error resource=city TypeError: x is not a function at src/client/hud.ts:3:9',
        'JS_LOG level=info resource=city no place in this one',
        '',
      ].join('\n'),
    );
    await until(() => output.events().length === 2, 'both lines');
  } finally {
    follower.stop();
  }
  const [withPlace, without] = output.events();
  assert.deepEqual(withPlace.location, { file: 'src/client/hud.ts', line: 3, column: 9 });
  assert.equal(without.location, undefined);
});
