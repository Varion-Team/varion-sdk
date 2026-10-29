import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CLI_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const made = [];
export function tempDir(prefix = 'varion-cli-test-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  made.push(dir);
  return dir;
}

export function cleanupTempDirs() {
  for (const dir of made.splice(0))
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}

export function writeFiles(root, files) {
  for (const [relative, content] of Object.entries(files)) {
    const file = path.join(root, ...relative.split('/'));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
}

/** A throwaway signing key: { publicKeyPem, sign(bytes) -> base64 }. */
export function testKey() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  return {
    publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }),
    sign: (bytes) => crypto.sign(null, Buffer.from(bytes), privateKey).toString('base64'),
  };
}

/** Serves `routes` ({ '/path': Buffer|string }) on 127.0.0.1; returns { base, close, hits }. */
export async function serve(routes) {
  const hits = [];
  const server = http.createServer((request, response) => {
    hits.push(request.url);
    const body = routes[request.url];
    if (body === undefined) {
      response.writeHead(404).end('not found');
      return;
    }
    const bytes = Buffer.isBuffer(body)
      ? body
      : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
    response.writeHead(200, { 'content-length': bytes.length }).end(bytes);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    base: `http://127.0.0.1:${port}`,
    port,
    hits,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

export const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
