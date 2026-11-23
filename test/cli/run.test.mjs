import assert from 'node:assert/strict';
import dgram from 'node:dgram';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import test, { after } from 'node:test';
import { engineKnowsPartRestart, restartCommand } from '../../src/cli/commands/dev.mjs';
import { loadProject } from '../../src/cli/config.mjs';
import { reachable, tcpPortFree, udpPortFree, waitReachable } from '../../src/cli/net.mjs';
import { CliError, createMemoryOutput } from '../../src/cli/output.mjs';
import {
  checkEnvName,
  connectHost,
  ensurePortsFree,
  openProject,
  populateServerFolder,
} from '../../src/cli/prepare.mjs';
import {
  leftoverProcess,
  runProgram,
  runProgramAsync,
  runShell,
  writePidFile,
} from '../../src/cli/proc.mjs';
import { serverSettings } from '../../src/cli/config.mjs';
import {
  parseLeakLine,
  parseServerLine,
  sourceLocation,
  stopLeftoverServer,
} from '../../src/cli/server.mjs';
import { cleanupTempDirs, tempDir, writeFiles } from './helpers.mjs';

after(cleanupTempDirs);

const node = process.execPath;

async function listening() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { port: server.address().port, close: () => new Promise((done) => server.close(done)) };
}

async function freeUdpPort() {
  const socket = dgram.createSocket('udp4');
  await new Promise((resolve) => socket.bind({ port: 0, address: '127.0.0.1' }, resolve));
  const { port } = socket.address();
  await new Promise((resolve) => socket.close(resolve));
  return port;
}

test('a shell command gets its variables quoted, and its output and exit code come back', async () => {
  const dir = tempDir();
  writeFiles(dir, {
    'echo.mjs': 'console.log(JSON.stringify(process.argv.slice(2))); process.exit(4);',
  });
  const lines = [];
  const result = await runShell('node echo.mjs {name} {missing} {dir}', {
    cwd: dir,
    capture: true,
    vars: { name: 'my mode', dir: 'a&b' },
    onLine: (line) => lines.push(line),
  });
  assert.equal(result.code, 4);
  assert.deepEqual(JSON.parse(result.output), ['my mode', '{missing}', 'a&b']);
  assert.deepEqual(lines, [result.output.trim()]);
});

test('a shell command that does not exist ends with a code, not an exception', async () => {
  const result = await runShell('varion-no-such-command-anywhere', { capture: true });
  assert.notEqual(result.code, 0);
});

test('a program is run with its input, and a missing one is reported', async () => {
  const echoed = runProgram(node, ['-e', 'process.stdin.pipe(process.stdout)'], { input: 'hi' });
  assert.deepEqual({ code: echoed.code, stdout: echoed.stdout }, { code: 0, stdout: 'hi' });

  const failed = runProgram(node, ['-e', 'console.error("no"); process.exit(2)']);
  assert.deepEqual({ code: failed.code, stderr: failed.stderr.trim() }, { code: 2, stderr: 'no' });

  const missing = runProgram(path.join(tempDir(), 'missing.exe'), []);
  assert.equal(missing.code, -1);
  assert.ok(missing.error);

  const later = await runProgramAsync(node, ['-e', 'console.log(1); console.error(2)']);
  assert.deepEqual(
    { code: later.code, stdout: later.stdout.trim(), stderr: later.stderr.trim() },
    { code: 0, stdout: '1', stderr: '2' },
  );
  const never = await runProgramAsync(path.join(tempDir(), 'missing.exe'), []);
  assert.equal(never.code, -1);
});

test('a pid file names a leftover process only while that process is the one it was written for', async () => {
  const dir = tempDir();
  const pidFile = path.join(dir, 'server.pid');
  assert.equal(await leftoverProcess(pidFile, 'anything'), null);

  writePidFile(pidFile, { pid: process.pid, exe: node });
  const record = JSON.parse(fs.readFileSync(pidFile, 'utf8'));
  assert.equal(record.pid, process.pid);
  assert.ok(Date.parse(record.startedAt) > 0);
  // this very test is a node process: its command line names node
  assert.equal(await leftoverProcess(pidFile, path.basename(node)), process.pid);

  // the same pid, but not the program the file was written for
  assert.equal(await leftoverProcess(pidFile, 'a-marker-that-is-not-in-the-command-line'), null);
  assert.equal(fs.existsSync(pidFile), false);

  fs.writeFileSync(pidFile, 'not json');
  assert.equal(await leftoverProcess(pidFile, 'x'), null);
});

test('nothing is stopped when no server of an earlier run is left', async () => {
  const output = createMemoryOutput();
  assert.equal(await stopLeftoverServer(tempDir(), output), false);
  assert.deepEqual(output.lines, []);
});

test('a port is free until something listens on it', async () => {
  const taken = await listening();
  try {
    assert.equal(await tcpPortFree('127.0.0.1', taken.port), false);
    assert.equal(await reachable('127.0.0.1', taken.port), true);
    assert.equal(await waitReachable('127.0.0.1', taken.port, { timeoutMs: 500 }), true);
  } finally {
    await taken.close();
  }
  assert.equal(await tcpPortFree('127.0.0.1', taken.port), true);
  assert.equal(await reachable('127.0.0.1', taken.port, 300), false);
  assert.equal(
    await waitReachable('127.0.0.1', taken.port, {
      timeoutMs: 5000,
      stepMs: 10,
      alive: () => false,
    }),
    false,
  );
  assert.equal(await waitReachable('127.0.0.1', taken.port, { timeoutMs: 60, stepMs: 10 }), false);

  const socket = dgram.createSocket('udp4');
  await new Promise((resolve) =>
    socket.bind({ port: 0, address: '127.0.0.1', exclusive: true }, resolve),
  );
  const udpPort = socket.address().port;
  assert.equal(await udpPortFree(udpPort), false);
  await new Promise((resolve) => socket.close(resolve));
  assert.equal(await udpPortFree(udpPort), true);
});

test('varion dev refuses to start on ports another program holds', async () => {
  const taken = await listening();
  try {
    await assert.rejects(
      ensurePortsFree({ port: await freeUdpPort(), httpPort: taken.port }, '[env.test]'),
      (error) => {
        assert.ok(error instanceof CliError);
        assert.match(error.message, new RegExp(`TCP port ${taken.port} is in use`));
        assert.match(error.message, /change httpPort in \[env\.test\]/);
        return true;
      },
    );
  } finally {
    await taken.close();
  }
  const socket = dgram.createSocket('udp4');
  await new Promise((resolve) =>
    socket.bind({ port: 0, address: '127.0.0.1', exclusive: true }, resolve),
  );
  const { port } = socket.address();
  try {
    await assert.rejects(ensurePortsFree({ port, httpPort: port + 1 }), /UDP port \d+ is in use/);
  } finally {
    await new Promise((resolve) => socket.close(resolve));
  }
  await ensurePortsFree({ port, httpPort: taken.port });
});

test('the game connects to this computer when the server listens on every interface', () => {
  assert.equal(connectHost({ host: '0.0.0.0' }), '127.0.0.1');
  assert.equal(connectHost({ host: '::' }), '127.0.0.1');
  assert.equal(connectHost({}), '127.0.0.1');
  assert.equal(connectHost({ host: '192.168.1.20' }), '192.168.1.20');
});

const TOML = `
[project]
name = "city"

[engine]
version = "1.0.97"

[server]
name = "City"
port = 7790

[unknown]
x = 1

[env.test]
name = "City (test)"
`;

function project() {
  const root = path.join(tempDir(), 'city');
  writeFiles(root, { 'varion.toml': TOML });
  return root;
}

test('opening a project passes its warnings on, and an unknown environment is refused', () => {
  const root = project();
  const output = createMemoryOutput();
  const opened = openProject({ cwd: root }, output);
  assert.equal(opened.config.project.name, 'city');
  assert.deepEqual(
    output.events().map((event) => event.text),
    ['varion.toml: unknown table [unknown], ignored'],
  );
  checkEnvName(opened, null);
  checkEnvName(opened, 'test');
  assert.throws(() => checkEnvName(opened, 'prod'), /no \[env\.prod\] \(there are: test\)/);
  assert.throws(() => openProject({ cwd: tempDir() }, output), /no varion\.toml/);
});

test('the server folder gets server.toml with the mode as its resource', async () => {
  const loaded = loadProject(project());
  const output = createMemoryOutput();
  const serverDir = loaded.paths.server;
  const settings = serverSettings(loaded.config, { envName: 'test' });
  const resources = await populateServerFolder(loaded, output, {
    serverDir,
    settings,
    envValues: { DB_PASSWORD: 'secret' },
  });
  assert.deepEqual(resources, ['city']);
  const toml = fs.readFileSync(path.join(serverDir, 'server.toml'), 'utf8');
  assert.match(toml, /^port = 7790$/m);
  assert.match(toml, /City \(test\)/);
  assert.match(fs.readFileSync(path.join(serverDir, '.env'), 'utf8'), /DB_PASSWORD/);

  // a release carries no .env: it stays on each server
  await populateServerFolder(loaded, output, { serverDir, settings, writeEnv: false });
  assert.equal(fs.existsSync(path.join(serverDir, '.env')), false);
});

test('a line of the server is read for its level, its part and its text', () => {
  assert.deepEqual(parseServerLine('[2026-11-23 19:19:20.392] [ok] [config] loaded'), {
    level: 'info',
    component: 'config',
    text: 'loaded',
  });
  assert.equal(parseServerLine('[t] [FATAL] [runtime] down').level, 'error');
  assert.equal(parseServerLine('[t] [warning] [net] slow').level, 'warn');
  assert.equal(parseServerLine('[t] [trace] [net] x').level, 'debug');
  assert.equal(parseServerLine('[t] [strange] [net] x').level, 'info');
  assert.deepEqual(parseServerLine('== Varion Engine =='), {
    level: 'info',
    component: null,
    text: '== Varion Engine ==',
  });
  assert.equal(parseServerLine('the bundle failed to load').level, 'error');
});

test('a leak the server reports names the resource and what it left open', () => {
  const stopped = parseServerLine(
    "[t] [warn] [res] resource 'city' stopped but left open: 2 timers, 1 socket",
  );
  assert.deepEqual(parseLeakLine(stopped), {
    resource: 'city',
    after: 'stop',
    summary: '2 timers, 1 socket',
  });
  const failed = parseServerLine("resource 'city' failed to load but left open: 1 timer");
  assert.equal(parseLeakLine(failed).after, 'load-failure');
  assert.equal(parseLeakLine(parseServerLine('[t] [info] [res] resource started')), null);
  assert.equal(
    parseLeakLine(parseServerLine("[t] [warn] [js] resource 'city' stopped but left open: x")),
    null,
  );
});

test('a place in a stack trace is shown only when it is a source file of the project', () => {
  const root = path.resolve('project');
  const inside = path.join(root, 'src', 'server', 'index.ts');
  assert.deepEqual(sourceLocation(`TypeError: x\n    at spawn (${inside}:12:5)`, root), {
    file: 'src/server/index.ts',
    line: 12,
    column: 5,
  });
  assert.equal(sourceLocation(`at ${path.resolve('elsewhere', 'a.ts')}:1:1`, root), undefined);
  assert.equal(
    sourceLocation(`at ${path.join(root, 'node_modules', 'x', 'index.js')}:1:1`, root),
    undefined,
  );
  assert.equal(sourceLocation('nothing here', root), undefined);
});

test('a change restarts only the part it touches when the engine can do that', () => {
  assert.equal(restartCommand(['client'], 'city', true), 'restart-client city');
  assert.equal(restartCommand(['client', 'ui'], 'city', true), 'restart-client city');
  assert.equal(restartCommand(['server'], 'city', true), 'restart-server city');
  assert.equal(restartCommand(['server', 'client'], 'city', true), 'restart city');
  assert.equal(restartCommand(['copy'], 'city', true), 'restart city');
  assert.equal(restartCommand(['client'], 'city', false), 'restart city');
  assert.equal(restartCommand([], 'city', true), 'restart city');
});

test('an engine is known to restart parts by what its js host says', () => {
  const dir = tempDir();
  assert.equal(engineKnowsPartRestart({ dir }), false);
  writeFiles(dir, { 'host/varion-host.cjs': 'const ops = ["restart"];' });
  assert.equal(engineKnowsPartRestart({ dir }), false);
  writeFiles(dir, { 'host/varion-host.cjs': 'const ops = ["restart", "restart-client"];' });
  assert.equal(engineKnowsPartRestart({ dir }), true);
});

test('a character that arrives in two pieces is read as one', async () => {
  const dir = tempDir();
  // the two bytes of a Cyrillic letter, written apart
  writeFiles(dir, {
    'split.mjs': [
      "const [first, second] = Buffer.from('Ж');",
      'process.stdout.write(Buffer.from([first]));',
      'setTimeout(() => process.stdout.write(Buffer.from([second, 10])), 150);',
    ].join(String.fromCharCode(10)),
  });
  const lines = [];
  const result = await runShell('node split.mjs', {
    cwd: dir,
    capture: true,
    onLine: (line) => lines.push(line),
  });
  assert.equal(result.code, 0);
  assert.deepEqual(lines, ['Ж']);
  assert.equal(result.output.trim(), 'Ж');
  const later = await runProgramAsync(node, [path.join(dir, 'split.mjs')]);
  assert.equal(later.stdout.trim(), 'Ж');
});

test('the last line of a command is read even without a line end', async () => {
  const dir = tempDir();
  writeFiles(dir, {
    'tail.mjs': "process.stdout.write('first' + String.fromCharCode(10) + 'last');",
  });
  const lines = [];
  await runShell('node tail.mjs', { cwd: dir, capture: true, onLine: (line) => lines.push(line) });
  assert.deepEqual(lines, ['first', 'last']);
});
