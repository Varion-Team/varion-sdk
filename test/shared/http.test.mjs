import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { sha256 } from '../../src/shared/fs.mjs';
import { checkUrl, download, request, requestJson } from '../../src/shared/http.mjs';

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'varion-http-test-'));
const body = Buffer.alloc(200_000, 0x61);
let server;
let base;
const seen = [];

before(async () => {
  server = http.createServer((req, res) => {
    seen.push({ url: req.url, authorization: req.headers.authorization });
    if (req.url === '/file') return res.end(body);
    if (req.url === '/json') {
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({ ok: true }));
    }
    if (req.url === '/missing') {
      res.statusCode = 404;
      return res.end('no such thing');
    }
    if (req.url === '/redirect') {
      res.statusCode = 302;
      res.setHeader('location', `http://localhost:${server.address().port}/file`);
      return res.end();
    }
    res.statusCode = 500;
    return res.end();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(work, { recursive: true, force: true });
});

describe('checkUrl', () => {
  it('takes https and loopback http only', () => {
    assert.equal(checkUrl('https://cdn.varionmp.net/a', 'cdn').host, 'cdn.varionmp.net');
    assert.equal(checkUrl('http://127.0.0.1:80/a', 'local').hostname, '127.0.0.1');
    assert.throws(() => checkUrl('http://example.com/a', 'remote'), { code: 'bad-url' });
    assert.throws(() => checkUrl('https://user:secret@example.com/', 'creds'), { code: 'bad-url' });
    assert.throws(() => checkUrl('not a url', 'junk'), { code: 'bad-url' });
  });
});

describe('download', () => {
  it('streams to a file, reports progress and returns the hash', async () => {
    const file = path.join(work, 'a.bin');
    let last = 0;
    const result = await download(`${base}/file`, file, {
      onProgress: (received) => {
        last = received;
      },
    });
    assert.deepEqual(result, { size: body.length, sha256: sha256(body) });
    assert.equal(last, body.length);
    assert.ok(fs.readFileSync(file).equals(body));
  });

  it('refuses more than the limit or a different size, and leaves no partial file', async () => {
    const tooBig = path.join(work, 'big.bin');
    await assert.rejects(download(`${base}/file`, tooBig, { maxBytes: 1000 }), { code: 'too-big' });
    assert.equal(fs.existsSync(tooBig), false);
    const wrong = path.join(work, 'wrong.bin');
    await assert.rejects(download(`${base}/file`, wrong, { expectedSize: 10 }), { code: 'size' });
    assert.equal(fs.existsSync(wrong), false);
  });

  it('never overwrites an existing file', async () => {
    const file = path.join(work, 'exists.bin');
    fs.writeFileSync(file, 'keep');
    await assert.rejects(download(`${base}/file`, file), { code: 'EEXIST' });
    assert.equal(fs.readFileSync(file, 'utf8'), 'keep');
  });

  it('drops the token on a redirect to another origin', async () => {
    seen.length = 0;
    const file = path.join(work, 'redirected.bin');
    await download(`${base}/redirect`, file, { headers: { Authorization: 'Bearer secret' } });
    assert.equal(seen[0].authorization, 'Bearer secret');
    assert.equal(seen[1].authorization, undefined);
  });
});

describe('request', () => {
  it('parses JSON and turns a bad status into an error with its code', async () => {
    assert.deepEqual(await requestJson(`${base}/json`, { method: 'GET' }), { ok: true });
    await assert.rejects(request(`${base}/missing`), { code: 'http-404', status: 404 });
  });
});
