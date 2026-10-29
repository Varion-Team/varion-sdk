import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { canonicalJson } from '../../../src/host/request.mjs';
import { serverExecutableName } from '../../../src/shared/engine.mjs';
import { sha256, utcStamp } from '../../../src/shared/fs.mjs';
import { buildZip } from './zip-writer.mjs';

export { sha256 };

export function tempDir(prefix = 'varion-host-test-') {
  const base = process.env.VARION_HOST_TEST_TMP || os.tmpdir();
  fs.mkdirSync(base, { recursive: true });
  return fs.mkdtempSync(path.join(base, prefix));
}

export function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}

// publicKeyBase64 is the raw 32 bytes, as `varion keys show` prints it
export function generateKeyPair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  const raw = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32);
  return {
    privateKey,
    publicKey,
    publicKeyBase64: raw.toString('base64'),
    publicKeyPem: publicKey.export({ format: 'pem', type: 'spki' }),
  };
}

let releaseCounter = 0;

export function newReleaseId(date = new Date()) {
  const when = new Date(date.getTime() + releaseCounter++ * 1000);
  return `${utcStamp(when)}-${crypto.randomBytes(4).toString('hex')}`;
}

export function makeRequest({
  action = 'activate',
  env,
  project,
  releaseId,
  serverId,
  sha256: zipSha256,
  issuedAt = new Date().toISOString(),
  nonce = crypto.randomBytes(16).toString('base64url'),
}) {
  return { action, env, issuedAt, nonce, project, releaseId, serverId, sha256: zipSha256 };
}

export function signRequest(request, keys) {
  const signature = crypto
    .sign(null, Buffer.from(canonicalJson(request), 'utf8'), keys.privateKey)
    .toString('base64');
  return { request, signature, publicKey: keys.publicKeyBase64 };
}

export function serverToml({
  name = 'Test Server',
  host = '127.0.0.1',
  port = 7960,
  httpPort = 7961,
  resources = [],
  gamemode = '',
  extra = '',
} = {}) {
  const lines = [
    `name = ${JSON.stringify(name)}`,
    `host = ${JSON.stringify(host)}`,
    `port = ${port}`,
    `httpPort = ${httpPort}`,
    'maxPlayers = 8',
    'announce = false',
    'encryptTransport = true',
  ];
  if (gamemode) lines.push(`gamemode = ${JSON.stringify(gamemode)}`);
  lines.push(
    'modules = []',
    'resources = [',
    ...resources.map((name) => `    ${JSON.stringify(name)},`),
    ']',
  );
  if (extra) lines.push(extra);
  return `${lines.join('\n')}\n`;
}

export function buildBundle({
  project = 'host-test',
  env = 'test',
  releaseId = newReleaseId(),
  engine = { version: '1.0.75', channel: 'rc' },
  toml = serverToml(),
  resources = {},
  assets = [],
  mutate,
  extraEntries = [],
  createdAt = new Date().toISOString(),
} = {}) {
  const contents = new Map([['server.toml', Buffer.from(toml, 'utf8')]]);
  for (const [relative, content] of Object.entries(resources))
    contents.set(
      `resources/${relative}`,
      Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8'),
    );
  const files = [...contents.entries()]
    .map(([path, data]) => ({ path, size: data.length, sha256: sha256(data) }))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const manifest = { format: 1, project, releaseId, env, createdAt, engine, files, assets };
  if (mutate) mutate(manifest);
  const entries = [{ name: 'release.json', data: `${JSON.stringify(manifest, null, 2)}\n` }];
  for (const [path, data] of contents) entries.push({ name: path, data });
  entries.push(...extraEntries);
  const zip = buildZip(entries);
  return { zip, sha256: sha256(zip), manifest, releaseId };
}

export function buildEnginePackage({
  version = '1.0.75',
  releaseKeys,
  files = {},
  mutateZipEntries,
} = {}) {
  const content = new Map([
    [
      serverExecutableName(),
      Buffer.from('not a real server: the tests start fixtures/fake-server.mjs instead\n'),
    ],
    ['host/varion-host.cjs', Buffer.from('// fake host\n')],
    ...Object.entries(files).map(([path, data]) => [
      path,
      Buffer.isBuffer(data) ? data : Buffer.from(data),
    ]),
  ]);
  const manifest = {
    schemaVersion: 1,
    product: 'varion-server',
    version,
    protocol: 25,
    channel: 'rc',
    files: [...content.entries()].map(([path, data]) => ({
      path,
      size: data.length,
      sha256: sha256(data),
    })),
  };
  const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 4), 'utf8');
  const signature = crypto.sign(null, manifestBytes, releaseKeys.privateKey).toString('base64');
  let entries = [...content.entries()].map(([path, data]) => ({
    name: `Varion-Server/${path}`,
    data,
  }));
  entries.push({ name: 'Varion-Server/server-manifest.json', data: manifestBytes });
  if (mutateZipEntries) entries = mutateZipEntries(entries);
  return { manifest, manifestBytes, signature, zip: buildZip(entries) };
}
