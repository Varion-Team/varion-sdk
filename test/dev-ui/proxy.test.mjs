import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { startDevUiProxy } from '../../src/dev-ui/proxy.mjs';
import { acceptWebSocket, connectWebSocket, listen, testPort } from './helpers.mjs';

const PAGE =
  '<!doctype html><html><head><meta charset="utf-8"><title>x</title></head><body><script src="/static/js/bundle.js"></script></body></html>';

function devServer() {
  const seen = [];
  const server = http.createServer((req, res) => {
    seen.push({
      method: req.method,
      url: req.url,
      host: req.headers.host,
      encoding: req.headers['accept-encoding'],
    });
    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        ETag: '"page"',
        'X-Dev': 'yes',
      });
      res.end(PAGE);
    } else if (req.url === '/static/js/bundle.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript', 'X-Dev': 'yes' });
      res.end('console.log("bundle");');
    } else if (req.url === '/echo' && req.method === 'POST') {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        res.writeHead(201, { 'Content-Type': 'text/plain' });
        res.end(Buffer.concat(chunks));
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('not here');
    }
  });
  server.on('upgrade', (req, socket) => {
    seen.push({ upgrade: req.url, host: req.headers.host });
    acceptWebSocket(req, socket, `{"type":"hot-update","path":"${req.url}"}`);
  });
  return { server, seen };
}

test('pages, shims, the rest, hot reload and the game server fallback', async (t) => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'varion-dev-ui-'));
  t.after(() => fs.rmSync(folder, { recursive: true, force: true }));
  const shim = path.join(folder, 'page-shim.js');
  fs.writeFileSync(shim, 'window.shim = 1;');

  const dev = devServer();
  const devUrl = await listen(dev.server, testPort(0));
  t.after(() => dev.server.close());
  const game = http.createServer((req, res) => {
    if (req.url === '/assets/rp/ui/img/logo.png') {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  const gameUrl = await listen(game, testPort(1));
  t.after(() => game.close());

  const proxy = await startDevUiProxy({
    upstream: devUrl,
    port: testPort(2),
    shims: [shim],
    fallback: `${gameUrl}/assets/rp/ui/`,
  });
  t.after(() => proxy.close());

  let response = await fetch(`${proxy.url}index.html`);
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.ok(
    body.startsWith(
      '<!doctype html><html><head><script src="/__varion/page-shim/0.js"></script><meta',
    ),
    body,
  );
  assert.equal(Number(response.headers.get('content-length')), Buffer.byteLength(body));
  assert.equal(response.headers.get('etag'), null);
  assert.equal(response.headers.get('x-dev'), 'yes');
  assert.equal(dev.seen.at(-1).encoding, 'identity');
  assert.equal(dev.seen.at(-1).host, new URL(devUrl).host);

  response = await fetch(`${proxy.url}__varion/page-shim/0.js`);
  assert.equal(await response.text(), 'window.shim = 1;');
  assert.match(response.headers.get('content-type'), /javascript/);
  fs.writeFileSync(shim, 'window.shim = 2;');
  assert.equal(
    await (await fetch(`${proxy.url}__varion/page-shim/0.js`)).text(),
    'window.shim = 2;',
  );
  assert.equal((await fetch(`${proxy.url}__varion/page-shim/1.js`)).status, 404);

  response = await fetch(`${proxy.url}static/js/bundle.js`);
  assert.equal(await response.text(), 'console.log("bundle");');
  assert.equal(response.headers.get('x-dev'), 'yes');
  response = await fetch(`${proxy.url}echo`, { method: 'POST', body: 'payload' });
  assert.equal(response.status, 201);
  assert.equal(await response.text(), 'payload');

  response = await fetch(`${proxy.url}img/logo.png`);
  assert.equal(response.status, 200);
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [0x89, 0x50, 0x4e, 0x47]);
  response = await fetch(`${proxy.url}img/missing.png`);
  assert.equal(response.status, 404);

  const socket = await connectWebSocket(`${proxy.url.replace('http:', 'ws:')}ws?token=abc`);
  t.after(() => socket.close());
  assert.equal(
    await socket.next((text) => text.includes('hot-update')),
    '{"type":"hot-update","path":"/ws?token=abc"}',
  );
  assert.equal(dev.seen.find((entry) => entry.upgrade).host, new URL(devUrl).host);
});

test('a dev server that is not running: 502, which the game retries', async (t) => {
  const closed = http.createServer();
  const closedUrl = await listen(closed, testPort(3));
  await new Promise((resolve) => closed.close(resolve));
  const proxy = await startDevUiProxy({ upstream: closedUrl, port: testPort(4) });
  t.after(() => proxy.close());
  const response = await fetch(`${proxy.url}index.html`);
  assert.equal(response.status, 502);
  assert.match(await response.text(), /not answering/);
});

test('only this computer: the proxy, its dev server and its fallback', async () => {
  await assert.rejects(
    startDevUiProxy({ upstream: 'http://127.0.0.1:7936', host: '0.0.0.0' }),
    /127\.0\.0\.1/,
  );
  await assert.rejects(startDevUiProxy({ upstream: 'http://192.168.1.20:7936' }), /upstream/);
  await assert.rejects(startDevUiProxy({ upstream: 'https://127.0.0.1:7936' }), /upstream/);
  await assert.rejects(
    startDevUiProxy({
      upstream: 'http://127.0.0.1:7936',
      fallback: 'http://game.example:7901/assets/rp/',
    }),
    /fallback/,
  );
});
