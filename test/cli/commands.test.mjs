import assert from 'node:assert/strict';
import dgram from 'node:dgram';
import fs from 'node:fs';
import path from 'node:path';
import test, { after } from 'node:test';
import { main } from '../../src/cli/cli.mjs';
import { tcpPortFree } from '../../src/cli/net.mjs';
import { DEFAULT_ENGINE } from '../../src/cli/scaffold.mjs';
import { parseToml } from '../../src/cli/toml.mjs';
import { serverExecutableName } from '../../src/shared/engine.mjs';
import { openZip } from '../../src/shared/zip.mjs';
import { cleanupTempDirs, FAKE_TOOLS, tempDir, writeFiles } from './helpers.mjs';

after(cleanupTempDirs);

// Runs varion as the command line does; --json makes every line of its output an event.
async function varion(...args) {
  let stdout = '';
  let stderr = '';
  const code = await main(args, {
    stdout: { write: (text) => (stdout += text) },
    stderr: { write: (text) => (stderr += text) },
  });
  const events = args.includes('--json')
    ? stdout
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    : [];
  return { code, stdout, stderr, events, find: (type) => events.find((e) => e.type === type) };
}

const toml = ({ engine = 'version = "1.0.97"', extra = '', port = 7790, copy = [] } = {}) => `
[project]
name = "city"

[engine]
${engine}

[server]
port = ${port}

[build]
typecheck = false
copy = ${JSON.stringify(copy)}

[env.test]
name = "City (test)"
${extra}`;

function project(options) {
  const root = path.join(tempDir(), 'city');
  writeFiles(root, {
    'varion.toml': toml(options),
    'src/server/index.ts': 'export const side = "server";\n',
    'src/client/index.ts': 'export const side = "client";\n',
    'src/ui/index.html': '<html></html>\n',
    ...FAKE_TOOLS,
  });
  return root;
}

// A folder that passes for a server build: the name of its program and its version.
function engineFolder(version = '1.0.97') {
  const dir = path.join(tempDir(), 'engine');
  writeFiles(dir, {
    [serverExecutableName()]: 'not a program',
    'version.json': JSON.stringify({ version, channel: 'rc', protocol: 26 }),
  });
  return dir.split(path.sep).join('/');
}

const PACK = ['deploy', 'test', '--pack-only', '--no-validate'];

// what `varion upgrade` says it did to the engine version
const moved = (result) => {
  const { from, to } = result.find('engine-version');
  return { from, to };
};

test('varion without a command prints its help and fails; --help and --version succeed', async () => {
  const none = await varion();
  assert.equal(none.code, 1);
  assert.match(none.stdout, /varion dev \[--env <name>\]/);
  // every option an error message tells to pass is in the help
  assert.match(none.stdout, /--trust-host/);

  const help = await varion('--help');
  assert.equal(help.code, 0);
  assert.equal(help.stdout, none.stdout);
  assert.equal((await varion('dev', '--help')).stdout, none.stdout);

  const version = await varion('--version');
  assert.equal(version.code, 0);
  const pkg = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.equal(version.stdout.trim(), pkg.version);
  assert.equal((await varion('--version', '--json')).find('version').version, pkg.version);
});

test('an unknown command and an unknown option are refused', async () => {
  const unknown = await varion('frobnicate');
  assert.equal(unknown.code, 1);
  assert.match(unknown.stderr, /"frobnicate" is not a varion command/);

  const option = await varion('build', '--nope', '--json');
  assert.notEqual(option.code, 0);
  assert.match(option.find('fatal').text, /--nope/);

  // names every object has are not commands or options either
  for (const word of ['constructor', 'toString', '__proto__']) {
    const command = await varion(word);
    assert.equal(command.code, 1, word);
    assert.match(command.stderr, /is not a varion command/);
    const flag = await varion('build', `--${word}`, 'x', '--json');
    assert.match(flag.find('fatal').text, /unknown option/, word);
  }
});

test('a command outside a project says there is no varion.toml', async () => {
  const outside = await varion('build', '-C', tempDir(), '--json');
  assert.equal(outside.code, 1);
  assert.match(outside.find('fatal').text, /no varion\.toml/);
});

test('varion build writes the resource and says where', async () => {
  const root = project();
  const built = await varion('build', '-C', root, '--json');
  assert.equal(built.code, 0, built.stdout);
  const resource = path.join(root, '.varion', 'server', 'resources', 'city');
  assert.equal(built.find('built').resource, resource);
  assert.ok(fs.existsSync(path.join(resource, 'server', 'index.js')));

  const out = path.join(root, 'dist', 'server');
  const release = await varion('build', '--release', '--env', 'test', '--out', out, '-C', root);
  assert.equal(release.code, 0, release.stderr);
  assert.match(release.stdout, /\[build\] done: /);
  assert.match(
    fs.readFileSync(path.join(out, 'resources', 'city', 'server', 'index.js'), 'utf8'),
    /"production"/,
  );

  const wrongEnv = await varion('build', '--env', 'staging', '-C', root, '--json');
  assert.equal(wrongEnv.code, 1);
  assert.match(wrongEnv.find('fatal').text, /no \[env\.staging\]/);
});

test('varion build fails with the place of the error', async () => {
  const root = project();
  fs.writeFileSync(path.join(root, 'src', 'client', 'index.ts'), 'BROKEN\n');
  const built = await varion('build', '-C', root, '--json');
  assert.equal(built.code, 1);
  const failed = built.events.find((event) => event.type === 'build' && !event.ok);
  assert.equal(failed.part, 'client');
  assert.equal(failed.errors[0].file, 'src/client/index.ts');
  assert.match(built.find('fatal').text, /the build failed/);
});

test('varion deploy --pack-only packs a release that lists every file by its hash', async () => {
  const root = project({ engine: `path = "${engineFolder()}"`, copy: ['logs'] });
  // a folder of the mode that happens to be called like the server's own log folder
  writeFiles(root, { 'logs/readme.txt': 'kept\n' });
  const packed = await varion(...PACK, '-C', root, '--json');
  assert.equal(packed.code, 0, packed.stdout);
  const release = packed.find('release');
  assert.match(release.releaseId, /^\d{8}-\d{6}-[0-9a-f]{8}$/);
  assert.equal(release.env, 'test');
  assert.deepEqual(release.engine, { version: '1.0.97', channel: 'rc' });
  assert.equal(release.assets, 0);

  const zip = await openZip(release.zip);
  try {
    const names = zip.entries.map((entry) => entry.name).sort();
    assert.ok(names.includes('release.json'));
    assert.ok(names.includes('server.toml'));
    assert.ok(names.includes('resources/city/server/index.js'));
    assert.ok(!names.includes('.env'));
    assert.ok(names.includes('resources/city/logs/readme.txt'));
    const entry = zip.entries.find((item) => item.name === 'release.json');
    const manifest = JSON.parse((await zip.readBuffer(entry, 1 << 20)).toString());
    assert.equal(manifest.project, 'city');
    assert.equal(manifest.files.length, names.length - 1);
    assert.equal(release.files, manifest.files.length);
    assert.ok(manifest.files.every((file) => /^[0-9a-f]{64}$/.test(file.sha256)));
  } finally {
    await zip.close();
  }
  // the description of the release stays beside the bundle
  const described = JSON.parse(fs.readFileSync(release.zip.replace(/\.zip$/, '.json'), 'utf8'));
  assert.equal(described.zipSha256, release.sha256);
  assert.equal(described.zipSize, release.size);
  // the server settings of [env.test] are in the bundle's server.toml
  const staged = path.join(root, '.varion', 'deploy', 'test', 'server', 'server.toml');
  assert.match(fs.readFileSync(staged, 'utf8'), /City \(test\)/);
});

test('varion deploy refuses what cannot be a deploy', async () => {
  const root = project({ engine: `path = "${engineFolder()}"` });
  const refused = async (...args) => {
    const result = await varion('deploy', ...args, '-C', root, '--json');
    assert.equal(result.code, 1, result.stdout);
    return result.find('fatal').text;
  };
  assert.match(await refused(), /name the environment/);
  assert.match(await refused('Staging'), /is not test, prod or preview-<branch>/);
  assert.match(await refused('test', '--rollback', '--pack-only'), /does not go with --pack-only/);

  const noVersion = project({ engine: `path = "${engineFolder()}"` });
  const enginePath = parseToml(fs.readFileSync(path.join(noVersion, 'varion.toml'), 'utf8')).engine
    .path;
  fs.rmSync(path.join(enginePath, 'version.json'));
  const result = await varion('deploy', 'test', '--pack-only', '-C', noVersion, '--json');
  assert.equal(result.code, 1);
  assert.match(result.find('fatal').text, /a release needs the engine version/);
});

test('a release build that fails packs nothing', async () => {
  const root = project({ engine: `path = "${engineFolder()}"` });
  fs.writeFileSync(path.join(root, 'src', 'server', 'index.ts'), 'BROKEN\n');
  const result = await varion(...PACK, '-C', root, '--json');
  assert.equal(result.code, 1);
  assert.match(result.find('fatal').text, /the release build failed/);
  assert.equal(fs.existsSync(path.join(root, '.varion', 'releases')), false);
});

test('varion upgrade moves the engine of varion.toml and refreshes the typings', async () => {
  const root = project({ engine: 'version = "1.0.80"\nchannel = "rc"' });
  const upgraded = await varion('upgrade', '--no-install', '--no-check', '-C', root, '--json');
  assert.equal(upgraded.code, 0, upgraded.stdout);
  assert.deepEqual(moved(upgraded), { from: '1.0.80', to: DEFAULT_ENGINE.version });
  const after = parseToml(fs.readFileSync(path.join(root, 'varion.toml'), 'utf8'));
  assert.equal(after.engine.version, DEFAULT_ENGINE.version);
  assert.equal(after.server.port, 7790);
  const typed = upgraded.find('types').files;
  assert.ok(typed.length > 0);
  assert.ok(fs.existsSync(path.join(root, 'types')));

  const again = await varion('upgrade', '--no-install', '--no-check', '-C', root, '--json');
  assert.deepEqual(moved(again), { from: DEFAULT_ENGINE.version, to: DEFAULT_ENGINE.version });
});

test('varion upgrade leaves an engine of your own build alone, and takes no arguments', async () => {
  const root = project({ engine: `path = "${engineFolder('1.0.50')}"` });
  const before = fs.readFileSync(path.join(root, 'varion.toml'), 'utf8');
  const upgraded = await varion('upgrade', '--no-install', '--no-check', '-C', root, '--json');
  assert.equal(upgraded.code, 0, upgraded.stdout);
  assert.equal(upgraded.find('engine-version'), undefined);
  assert.equal(fs.readFileSync(path.join(root, 'varion.toml'), 'utf8'), before);

  const extra = await varion('upgrade', 'now', '-C', root, '--json');
  assert.notEqual(extra.code, 0);
});

test('varion db needs [database], knows its subcommands and tells a database that is down', async () => {
  const none = await varion('db', 'status', '-C', project(), '--json');
  assert.equal(none.code, 1);
  assert.match(none.find('fatal').text, /no \[database\]/);

  const root = project({
    extra: '\n[database]\nmanaged = false\nhost = "127.0.0.1"\nport = 9\nname = "city"\n',
  });
  const unknown = await varion('db', 'explode', '-C', root, '--json');
  assert.equal(unknown.code, 1);
  assert.match(unknown.find('fatal').text, /unknown subcommand "explode" \(there are status, /);

  const status = await varion('db', '-C', root, '--json');
  assert.equal(status.code, 0, status.stdout);
  const { host, port, running, managed, database } = status.find('database');
  assert.deepEqual(
    { host, port, running, managed, database },
    { host: '127.0.0.1', port: 9, running: false, managed: false, database: 'city' },
  );

  const shell = await varion('db', 'shell', '-C', root, '--json');
  assert.equal(shell.code, 1);
  assert.match(shell.find('fatal').text, /no database of its own/);
});

test('varion new makes a project and tells what to do next', async () => {
  const base = tempDir();
  const made = await varion('new', 'my-mode', '--no-install', '--no-git', '-C', base);
  assert.equal(made.code, 0, made.stderr);
  assert.match(made.stdout, /\[new\] created my-mode in /);
  assert.match(made.stdout, /\n {2}npm install\n {2}npm run dev {6}# server on 127\.0\.0\.1:7788/);
  const root = path.join(base, 'my-mode');
  const config = parseToml(fs.readFileSync(path.join(root, 'varion.toml'), 'utf8'));
  assert.equal(config.project.name, 'my-mode');
  assert.equal(config.engine.version, DEFAULT_ENGINE.version);
  assert.ok(fs.existsSync(path.join(root, 'src', 'server', 'index.ts')));

  const custom = await varion(
    'new',
    'other',
    '--no-install',
    '--no-git',
    '--port',
    '7800',
    '--engine-version',
    '1.0.90',
    '--title',
    'Other City',
    '--dir',
    'elsewhere',
    '-C',
    base,
    '--json',
  );
  assert.equal(custom.code, 0, custom.stdout);
  const other = parseToml(fs.readFileSync(path.join(base, 'elsewhere', 'varion.toml'), 'utf8'));
  assert.equal(other.project.title, 'Other City');
  assert.equal(other.server.port, 7800);
  // the README names the address to join, with the port of this project
  const readme = fs.readFileSync(path.join(base, 'elsewhere', 'README.md'), 'utf8');
  assert.ok(readme.includes('varion://127.0.0.1:7800'));
  assert.ok(!readme.includes('__'));
  assert.equal(other.engine.version, '1.0.90');
  assert.deepEqual(custom.find('git'), {
    type: 'git',
    time: custom.find('git').time,
    initialized: false,
    committed: false,
  });

  const nameless = await varion('new', '--json');
  assert.equal(nameless.code, 1);
  assert.match(nameless.find('fatal').text, /usage: varion new <name>/);
});

// A game port nothing listens on, with the HTTP port after it free as well.
async function freePorts() {
  for (;;) {
    const socket = dgram.createSocket('udp4');
    await new Promise((resolve) => socket.bind({ port: 0, address: '127.0.0.1' }, resolve));
    const { port } = socket.address();
    await new Promise((resolve) => socket.close(resolve));
    if (port < 65535 && (await tcpPortFree('127.0.0.1', port + 1))) return port;
  }
}

test('varion dev builds the mode and reports a server that does not start', async () => {
  const port = await freePorts();
  const root = project({ engine: `path = "${engineFolder()}"`, port });
  const dev = await varion('dev', '--no-watch', '-C', root, '--json');
  assert.notEqual(dev.code, 0);
  assert.equal(dev.events.filter((event) => event.type === 'build' && event.ok).length, 3);
  const config = dev.find('config');
  assert.deepEqual(config.resources, ['city']);
  assert.equal(config.port, port);
  assert.match(dev.find('fatal').text, /the server (did not start|exited before it was ready)/);
  assert.equal(fs.existsSync(path.join(root, '.varion', 'server', 'server.toml')), true);

  const noBuild = project({ engine: `path = "${engineFolder()}"`, port });
  const skipped = await varion('dev', '--no-build', '-C', noBuild, '--json');
  assert.equal(skipped.code, 1);
  assert.match(skipped.find('fatal').text, /the resource is not built yet/);

  const wrongEnv = await varion('dev', '--env', 'staging', '-C', root, '--json');
  assert.match(wrongEnv.find('fatal').text, /no \[env\.staging\]/);
});

test('varion engine tells where an engine of your own build is, and refuses a folder without one', async () => {
  const root = project({ engine: `path = "${engineFolder('1.0.96')}"` });
  const found = await varion('engine', '-C', root, '--json');
  assert.equal(found.code, 0, found.stdout);
  const { source, version } = found.find('engine');
  assert.deepEqual({ source, version }, { source: 'path', version: '1.0.96' });

  const empty = project({ engine: `path = "${tempDir().split(path.sep).join('/')}"` });
  const missing = await varion('engine', '-C', empty, '--json');
  assert.equal(missing.code, 1);
  assert.match(missing.find('fatal').text, /there is no varion-server/);
});
