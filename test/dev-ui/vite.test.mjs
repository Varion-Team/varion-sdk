import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startDevUiProxy } from '../../src/dev-ui/proxy.mjs';
import { varionDevUi } from '../../src/dev-ui/vite.mjs';
import { connectWebSocket, testPort } from './helpers.mjs';

const example = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'page');

async function loadVite() {
  try {
    const dir = process.env.VARION_DEV_UI_VITE;
    if (dir) return await import(pathToFileURL(path.join(dir, 'dist', 'node', 'index.js')).href);
    return await import('vite');
  } catch {
    return null;
  }
}

const vite = await loadVite();
const skip = vite ? false : 'no Vite: set VARION_DEV_UI_VITE to a vite package folder';

// the tests edit the page, so each gets its own copy
function copyExample(t) {
  const folder = fs.realpathSync.native(
    fs.mkdtempSync(path.join(os.tmpdir(), 'varion-dev-ui-vite-')),
  );
  t.after(() => fs.rmSync(folder, { recursive: true, force: true }));
  for (const name of ['index.html', 'main.js', 'view.js', 'page-shim.js', 'style.css']) {
    fs.copyFileSync(path.join(example, name), path.join(folder, name));
  }
  return folder;
}

function config(root, port, plugins) {
  return {
    root,
    configFile: false,
    cacheDir: path.join(root, '.vite-cache'),
    logLevel: 'silent',
    plugins,
    server: { host: '127.0.0.1', port, strictPort: true },
  };
}

const firstScriptOf = (html) => /<head[^>]*>\s*<script([^>]*)>/i.exec(html)?.[1] ?? '';

async function editAndWait(socket, file, edit, predicate) {
  // the watcher may start after the server answers, so edit until the update comes
  for (let attempt = 0; attempt < 8; attempt++) {
    fs.writeFileSync(file, edit(fs.readFileSync(file, 'utf8'), attempt));
    try {
      return await socket.next(predicate, 1500);
    } catch {
      /* again */
    }
  }
  return socket.next(predicate, 1);
}

test('the plugin: shim first, served from disk, hot reload as usual', { skip }, async (t) => {
  const root = copyExample(t);
  const server = await vite.createServer(
    config(root, testPort(5), [varionDevUi({ shims: ['./page-shim.js'] })]),
  );
  await server.listen();
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;

  const html = await (
    await fetch(`${base}/index.html`, { headers: { accept: 'text/html' } })
  ).text();
  assert.match(firstScriptOf(html), /src="\/__varion\/page-shim\/0\.js"/, html);
  assert.ok(html.indexOf('/__varion/page-shim/0.js') < html.indexOf('/@vite/client'), html);
  assert.equal(
    await (await fetch(`${base}/__varion/page-shim/0.js`)).text(),
    fs.readFileSync(path.join(root, 'page-shim.js'), 'utf8'),
  );

  const socket = await connectWebSocket(
    `ws://127.0.0.1:${new URL(base).port}/?token=${server.config.webSocketToken}`,
    {
      protocol: 'vite-hmr',
    },
  );
  t.after(() => socket.close());
  await socket.next((text) => text.includes('"connected"'));
  // loading them tells the module graph that main.js accepts view.js
  for (const file of ['/main.js', '/view.js'])
    assert.equal((await fetch(`${base}${file}`)).status, 200);

  const update = await editAndWait(
    socket,
    path.join(root, 'view.js'),
    (text, attempt) => text.replace(/HEADLINE = '[^']*'/, `HEADLINE = 'edited ${attempt}'`),
    (text) => text.includes('"update"') && text.includes('/view.js'),
  );
  assert.match(update, /"acceptedPath":"\/view\.js"/);
  await editAndWait(
    socket,
    path.join(root, 'page-shim.js'),
    (text, attempt) => `${text}\n// edited ${attempt}\n`,
    (text) => text.includes('"full-reload"'),
  );
});

test('vite build leaves the shim out', { skip }, async (t) => {
  const root = copyExample(t);
  const outDir = path.join(root, 'dist');
  await vite.build({
    ...config(root, 0, [varionDevUi({ shims: ['./page-shim.js'] })]),
    build: { outDir, emptyOutDir: true },
  });
  const built = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  assert.ok(!built.includes('/__varion/') && !/<script[^>]*page-shim/i.test(built), built);
  assert.ok(!fs.readdirSync(outDir).includes('page-shim.js'), 'the shim is no file of the build');
});

test(
  'the proxy in front of a Vite without the plugin, hot reload through it',
  { skip },
  async (t) => {
    const root = copyExample(t);
    const server = await vite.createServer(config(root, testPort(6), []));
    await server.listen();
    t.after(() => server.close());
    const upstream = `http://127.0.0.1:${server.httpServer.address().port}`;
    const proxy = await startDevUiProxy({
      upstream,
      port: testPort(7),
      shims: [path.join(root, 'page-shim.js')],
    });
    t.after(() => proxy.close());

    const html = await (
      await fetch(`${proxy.url}index.html`, { headers: { accept: 'text/html' } })
    ).text();
    assert.match(firstScriptOf(html), /src="\/__varion\/page-shim\/0\.js"/, html);
    assert.ok(html.includes('/@vite/client'), html);

    const socket = await connectWebSocket(
      `${proxy.url.replace('http:', 'ws:')}?token=${server.config.webSocketToken}`,
      {
        protocol: 'vite-hmr',
      },
    );
    t.after(() => socket.close());
    await socket.next((text) => text.includes('"connected"'));
    for (const file of ['main.js', 'view.js'])
      assert.equal((await fetch(`${proxy.url}${file}`)).status, 200);
    const update = await editAndWait(
      socket,
      path.join(root, 'view.js'),
      (text, attempt) =>
        text.replace(/HEADLINE = '[^']*'/, `HEADLINE = 'through the proxy ${attempt}'`),
      (text) => text.includes('"update"') && text.includes('/view.js'),
    );
    assert.match(update, /"acceptedPath":"\/view\.js"/);
  },
);
