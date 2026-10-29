import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { listen, testPort } from './helpers.mjs';

const BIN = fileURLToPath(new URL('../../bin/varion-dev-ui.mjs', import.meta.url));

function start(args) {
  const child = spawn(process.execPath, [BIN, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  const proc = { child, stdout: '', stderr: '' };
  child.stdout.on('data', (chunk) => (proc.stdout += chunk));
  child.stderr.on('data', (chunk) => (proc.stderr += chunk));
  proc.exited = new Promise((resolve) => child.on('close', (code) => resolve(code)));
  return proc;
}

function waitForOutput(proc, pattern, ms = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => done(new Error(`no ${pattern} within ${ms} ms`)), ms);
    const check = () => {
      const match = pattern.exec(proc.stdout);
      if (match) done(null, match);
    };
    const exited = (code) => done(new Error(`exited with ${code}: ${proc.stdout}${proc.stderr}`));
    const done = (error, match) => {
      clearTimeout(timer);
      proc.child.stdout.off('data', check);
      proc.child.off('exit', exited);
      if (error) reject(error);
      else resolve(match);
    };
    proc.child.stdout.on('data', check);
    proc.child.on('exit', exited);
    check();
  });
}

test('varion-dev-ui serves the pages with the shims first until it is stopped', async (t) => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'varion-dev-ui-bin-'));
  t.after(() => fs.rmSync(folder, { recursive: true, force: true }));
  const shim = path.join(folder, 'page-shim.js');
  fs.writeFileSync(shim, 'window.shim = 1;');
  const upstream = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<!doctype html><html><head><title>x</title></head><body></body></html>');
  });
  const upstreamUrl = await listen(upstream, testPort(8));
  t.after(() => upstream.close());

  const proxy = start(['--upstream', upstreamUrl, `--port=${testPort(9)}`, '--shim', shim]);
  t.after(() => proxy.child.kill());
  const [, url] = await waitForOutput(proxy, /(http:\/\/127\.0\.0\.1:\d+\/) -> /);

  const page = await (await fetch(`${url}index.html`)).text();
  assert.ok(
    page.startsWith(
      '<!doctype html><html><head><script src="/__varion/page-shim/0.js"></script><title>',
    ),
    page,
  );
  assert.equal(await (await fetch(`${url}__varion/page-shim/0.js`)).text(), 'window.shim = 1;');

  proxy.child.kill('SIGTERM');
  await proxy.exited;
  await assert.rejects(fetch(`${url}index.html`));
});

test('varion-dev-ui: help, and wrong arguments', async () => {
  let result = start(['--help']);
  assert.equal(await result.exited, 0);
  assert.match(result.stdout, /--upstream <url>/);

  result = start(['--port', '7935']);
  assert.equal(await result.exited, 1);
  assert.match(result.stderr, /--upstream http:\/\/127\.0\.0\.1:<port>/);

  result = start(['--upstream', 'http://127.0.0.1:7936', 'extra']);
  assert.equal(await result.exited, 1);
  assert.match(result.stderr, /unexpected arguments: extra/);

  result = start(['--upstream', 'http://127.0.0.1:7936', '--nope']);
  assert.equal(await result.exited, 1);
  assert.match(result.stderr, /unknown option --nope/);

  result = start(['--upstream']);
  assert.equal(await result.exited, 1);
  assert.match(result.stderr, /--upstream needs a value/);

  result = start(['--upstream', 'http://192.168.1.20:7936']);
  assert.equal(await result.exited, 1);
  assert.match(result.stderr, /upstream: needs http:\/\/127\.0\.0\.1/);
});
