import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import test, { after } from 'node:test';
import zlib from 'node:zlib';
import { main } from '../../src/cli/cli.mjs';
import { parseToml } from '../../src/cli/toml.mjs';
import { saveLogin } from '../../src/deploy/client.mjs';
import { packResource, PackError } from '../../src/market/pack.mjs';
import { cleanupTempDirs, tempDir, writeFiles } from './helpers.mjs';

after(cleanupTempDirs);

const TOKEN = `varion_cli_${'a'.repeat(64)}`;

function resource(extra = {}) {
  const dir = tempDir();
  writeFiles(dir, {
    'resource.toml': [
      'type = "js"',
      'main = "server/main.js"',
      'client-main = "client/main.js"',
      'client-files = ["client/**", "ui/**"]',
      'dependencies = ["core"]',
      '',
      '[market]',
      'name = "garages"',
      'version = "1.2.0"',
      'open = ["config.json", "ui/theme.css"]',
      'exclude = ["docs/**"]',
      '',
    ].join('\n'),
    'server/main.js': "module.exports = require('./lib/a');\n",
    'server/lib/a.js': 'module.exports = 1;\n',
    'server/data.sql': 'select 1;\n',
    'client/main.js': 'varion.log(1);\n',
    'ui/index.html': '<p>ui</p>\n',
    'ui/theme.css': 'p { color: red }\n',
    'config.json': '{"slots":7}\n',
    'docs/notes.md': 'not packed\n',
    'node_modules/dep/index.js': 'module.exports = 2;\n',
    '.env': 'SECRET=1\n',
    ...extra,
  });
  return dir;
}

const unpack = (bundle) => JSON.parse(zlib.gunzipSync(bundle).toString('utf8'));

test("a resource is packed in three sides, and the buyer's resource.toml names no code", () => {
  const packed = packResource(resource());
  const body = unpack(packed.bundle);
  const side = (name) =>
    body.files.filter((file) => (file.side || 'server') === name).map((file) => file.path);
  assert.deepEqual(
    [body.name, body.version, body.main, body.clientMain],
    ['garages', '1.2.0', 'server/main.js', 'client/main.js'],
  );
  assert.deepEqual(side('server'), ['server/data.sql', 'server/lib/a.js', 'server/main.js']);
  assert.deepEqual(side('client'), ['client/main.js', 'ui/index.html']);
  assert.deepEqual(side('open'), ['resource.toml', 'config.json', 'ui/theme.css']);
  assert.deepEqual(packed.skipped, ['node_modules']);

  const shell = parseToml(
    Buffer.from(body.files.find((file) => file.path === 'resource.toml').data, 'base64').toString(),
  );
  assert.equal(shell.license, 'garages');
  assert.equal(shell.type, 'js');
  assert.equal(shell.main, undefined);
  assert.equal(shell['client-main'], undefined);
  assert.equal(shell.market, undefined);
  // of the client globs only the one whose files stay in the folder is kept
  assert.deepEqual(shell['client-files'], ['ui/**']);
  assert.deepEqual(shell.dependencies, ['core']);
});

test('what cannot be sold is refused with the reason', () => {
  const refuse = (files, code) =>
    assert.throws(
      () => packResource(resource(files)),
      (error) => error instanceof PackError && error.code === code,
    );
  refuse({ 'resource.toml': 'type = "js"\nmain = "server/main.js"\n' }, 'no-market');
  refuse(
    {
      'resource.toml':
        'type = "js"\nmain = "server/main.js"\n[market]\nname = "Garages"\nversion = "1.0.0"\n',
    },
    'bad-name',
  );
  refuse(
    {
      'resource.toml':
        'type = "js"\nmain = "server/main.js"\n[market]\nname = "garages"\nversion = "one"\n',
    },
    'bad-version',
  );
  refuse(
    {
      'resource.toml':
        'type = "js"\nmain = "server/gone.js"\n[market]\nname = "garages"\nversion = "1.0.0"\n',
    },
    'no-main',
  );
  // an entry left open would not be sealed
  refuse(
    {
      'resource.toml':
        'type = "js"\nmain = "server/main.js"\n[market]\nname = "garages"\nversion = "1.0.0"\nopen = ["server/**"]\n',
    },
    'no-main',
  );
  refuse({ 'server/big.bin': Buffer.alloc(8 * 1024 * 1024 + 1) }, 'too-large');
});

// A cabinet that takes a version and hands out the open part, as varion-masterlist does.
async function cabinet() {
  const seen = { uploads: [], installs: [] };
  let stored = null;
  const server = http.createServer((request, response) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      const url = new URL(request.url, 'http://x');
      const reply = (status, body) =>
        response
          .writeHead(status, { 'content-type': 'application/json' })
          .end(JSON.stringify(body));
      if (request.headers.authorization !== `Bearer ${TOKEN}`) return reply(401, { error: 'no' });
      if (
        request.method === 'POST' &&
        url.pathname === '/api/cli/market/resources/garages/versions'
      ) {
        stored = Buffer.concat(chunks);
        seen.uploads.push({ query: Object.fromEntries(url.searchParams), bytes: stored.length });
        return reply(201, { version: { id: 'v1', version: url.searchParams.get('version') } });
      }
      if (request.method === 'GET' && url.pathname === '/api/cli/market/install/garages') {
        seen.installs.push(Object.fromEntries(url.searchParams));
        if (!stored) return reply(404, { error: 'У ресурса ещё нет версии.', code: 'no_version' });
        const open = unpack(stored).files.filter((file) => file.side === 'open');
        return reply(200, { resource: 'garages', title: 'Garages', version: '1.2.0', files: open });
      }
      return reply(404, { error: 'Такого ресурса нет.', code: 'no_resource' });
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    seen,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function varion(argv, home) {
  const out = [];
  const sink = { write: (chunk) => out.push(String(chunk)), isTTY: false };
  const before = { ...process.env };
  process.env.VARION_CONFIG_DIR = home;
  try {
    const code = await main(argv, { stdout: sink, stderr: sink });
    return { code, text: out.join('') };
  } finally {
    for (const key of ['VARION_CONFIG_DIR']) {
      if (before[key] === undefined) delete process.env[key];
      else process.env[key] = before[key];
    }
  }
}

test('varion publish sends the package up, varion install brings the open part down', async (t) => {
  const shop = await cabinet();
  t.after(shop.close);
  const home = tempDir();
  const env = { ...process.env, VARION_CONFIG_DIR: home };
  const dir = resource();

  const unsigned = await varion(['publish', dir, '--cabinet', shop.url], home);
  assert.equal(unsigned.code, 1);
  assert.match(unsigned.text, /not signed in/);

  saveLogin(shop.url, { token: TOKEN, account: { id: 'a', name: 'author' } }, { env });
  const published = await varion(
    ['publish', dir, '--cabinet', shop.url, '--beta', '--notes', 'first'],
    home,
  );
  assert.equal(published.code, 0, published.text);
  assert.match(published.text, /garages 1\.2\.0 is published as a beta/);
  assert.deepEqual(shop.seen.uploads[0].query, {
    version: '1.2.0',
    channel: 'beta',
    notes: 'first',
  });

  const packedTo = path.join(tempDir(), 'out.vpack');
  assert.equal(
    (await varion(['pack', dir, '--out', packedTo, '--version', '1.3.0'], home)).code,
    0,
  );
  assert.equal(unpack(fs.readFileSync(packedTo)).version, '1.3.0');
  assert.equal(
    (await varion(['publish', '--file', packedTo, '--cabinet', shop.url], home)).code,
    0,
  );
  assert.equal(shop.seen.uploads[1].query.version, '1.3.0');

  const serverDir = tempDir();
  const installed = await varion(
    ['install', 'garages', '-C', serverDir, '--cabinet', shop.url, '--version', '1.2.0'],
    home,
  );
  assert.equal(installed.code, 0, installed.text);
  const folder = path.join(serverDir, 'resources', 'garages');
  const toml = parseToml(fs.readFileSync(path.join(folder, 'resource.toml'), 'utf8'));
  assert.equal(toml.license, 'garages');
  assert.equal(toml['license-version'], '1.2.0');
  assert.equal(fs.readFileSync(path.join(folder, 'config.json'), 'utf8'), '{"slots":7}\n');
  assert.ok(!fs.existsSync(path.join(folder, 'server')), 'no code comes with the folder');
  assert.deepEqual(shop.seen.installs[0], { version: '1.2.0' });

  // the owner's edits stay at the next install, unless told otherwise
  fs.writeFileSync(path.join(folder, 'config.json'), '{"slots":99}\n');
  const again = await varion(
    ['install', 'garages', '-C', serverDir, '--cabinet', shop.url, '--version', '1.2.0'],
    home,
  );
  assert.match(again.text, /kept as they are here.*config\.json/);
  assert.equal(fs.readFileSync(path.join(folder, 'config.json'), 'utf8'), '{"slots":99}\n');
  await varion(['install', 'garages', '-C', serverDir, '--cabinet', shop.url, '--force'], home);
  assert.equal(fs.readFileSync(path.join(folder, 'config.json'), 'utf8'), '{"slots":7}\n');

  const unknown = await varion(
    ['install', 'nothing-here', '-C', serverDir, '--cabinet', shop.url],
    home,
  );
  assert.equal(unknown.code, 1);
  assert.match(unknown.text, /the resource was not installed: Такого ресурса нет\./);
});

test('an answer that is not from the cabinet installs nothing', async (t) => {
  // a proxy in front of the cabinet answering with its own page
  const proxy = http.createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/html' }).end('<html>maintenance</html>');
  });
  await new Promise((resolve) => proxy.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => proxy.close(resolve)));
  const url = `http://127.0.0.1:${proxy.address().port}`;
  const home = tempDir();
  saveLogin(
    url,
    { token: TOKEN, account: { id: 'a', name: 'author' } },
    { env: { ...process.env, VARION_CONFIG_DIR: home } },
  );

  const serverDir = tempDir();
  const installed = await varion(['install', 'garages', '-C', serverDir, '--cabinet', url], home);
  assert.equal(installed.code, 1, installed.text);
  assert.match(installed.text, /the resource was not installed: the answer is not JSON/);
  assert.equal(fs.existsSync(path.join(serverDir, 'resources')), false);
});

test('a link inside a resource is not packed', () => {
  const dir = resource();
  const outside = tempDir();
  writeFiles(outside, { 'secret.txt': 'not for sale\n' });
  // a junction needs no rights on Windows; elsewhere it is an ordinary link
  fs.symlinkSync(outside, path.join(dir, 'server', 'linked'), 'junction');
  assert.throws(() => packResource(dir), /server\/linked: not a file or a folder/);
});
