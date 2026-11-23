import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, { after } from 'node:test';
import { hostLayout } from '../../src/host/paths.mjs';
import { hostReport, reportLines } from '../../src/host/status.mjs';

const made = [];
after(() => {
  for (const dir of made) fs.rmSync(dir, { recursive: true, force: true });
});

function hostFolder(files = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'varion-host-status-'));
  made.push(root);
  for (const [relative, content] of Object.entries(files)) {
    const file = path.join(root, ...relative.split('/'));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content));
  }
  return hostLayout(root);
}

const TOKEN = { format: 1, cabinet: 'https://cabinet.example', token: 't'.repeat(32) };
const SHA = 'a'.repeat(64);

test('an empty folder is a host that never ran', () => {
  const layout = hostFolder();
  const report = hostReport(layout);
  assert.deepEqual(report, {
    root: layout.root,
    connection: null,
    host: { running: false, lastSeen: null },
    trustedKeys: [],
    cabinetKeys: [],
    engines: [],
    cachedAssets: 0,
    instances: [],
  });
  assert.deepEqual(reportLines(report), [
    `host folder: ${layout.root}`,
    'not connected to a server by code (varion host does it on its first run)',
    'host: not running',
    'trusted keys: 0; engines: none; cached assets: 0',
    'no instances',
  ]);
});

test('a host that stopped is described by what it left on disk', () => {
  const layout = hostFolder({
    'host-token.json': {
      ...TOKEN,
      serverId: '42',
      serverName: 'City',
      pairedAt: '2026-11-20T10:00:00.000Z',
    },
    'state/status.json': { pid: process.pid, stopped: true, heartbeatAt: '2026-11-22T09:00:00Z' },
    'trust/deploy-keys.json': {
      format: 1,
      keys: [{ name: 'laptop', publicKey: 'A'.repeat(43) + '=', addedAt: '2026-11-20' }],
    },
    'engine/rc/1.0.97/varion-server.exe': '',
    'engine/rc/1.0.96.bad-20261120/varion-server.exe': '',
    'engine/rc/1.0.98.staging-ab12/varion-server.exe': '',
    'engine/beta/1.0.90/varion-server.exe': '',
    [`cache/assets/${SHA}`]: 'pack',
    'cache/assets/.partial-abc': 'half',
    'instances/city-prod/instance.json': {
      project: 'city',
      env: 'prod',
      serverId: '42',
      preview: false,
      lastDeployAt: '2026-11-21T08:00:00.000Z',
    },
    'instances/city-prod/current': '20261121-080000-0123abcd\n',
    'instances/city-prod/server.toml': 'port = 7788\nhttpPort = 7789\n',
    'instances/city-preview-login/instance.json': {
      project: 'city',
      env: 'preview-login',
      preview: true,
      ports: { port: 7962, httpPort: 7963 },
    },
    'instances/not an instance/instance.json': {},
    'instances/city-test/readme.txt': 'no instance.json here',
  });
  const report = hostReport(layout);

  assert.deepEqual(report.connection, {
    cabinet: 'https://cabinet.example',
    serverId: '42',
    serverName: 'City',
    pairedAt: '2026-11-20T10:00:00.000Z',
  });
  assert.deepEqual(report.host, { running: false, lastSeen: '2026-11-22T09:00:00Z' });
  assert.deepEqual(
    report.trustedKeys.map((key) => key.name),
    ['laptop'],
  );
  assert.deepEqual(report.cabinetKeys, []);
  assert.deepEqual(
    report.engines.sort((a, b) => a.channel.localeCompare(b.channel)),
    [
      { version: '1.0.90', channel: 'beta' },
      { version: '1.0.97', channel: 'rc' },
    ],
  );
  assert.equal(report.cachedAssets, 1);
  assert.deepEqual(
    report.instances.map(({ name, releaseId, state, port, httpPort, preview }) => ({
      name,
      releaseId,
      state,
      port,
      httpPort,
      preview,
    })),
    [
      {
        name: 'city-preview-login',
        releaseId: null,
        state: 'stopped',
        port: 7962,
        httpPort: 7963,
        preview: true,
      },
      {
        name: 'city-prod',
        releaseId: '20261121-080000-0123abcd',
        state: 'stopped',
        port: 7788,
        httpPort: 7789,
        preview: false,
      },
    ],
  );

  const lines = reportLines(report);
  assert.equal(lines[1], 'connected to the server City (42) through https://cabinet.example');
  assert.equal(lines[2], 'host: not running (last seen 2026-11-22T09:00:00Z)');
  assert.match(
    lines[3],
    /^trusted keys: 1 \(laptop\); engines: .*1\.0\.97 \(rc\).*; cached assets: 1$/,
  );
  assert.equal(lines[4], '  city-preview-login  [preview]  release -  stopped  port 7962/7963');
  assert.equal(
    lines[5],
    '  city-prod  [prod]  release 20261121-080000-0123abcd  stopped  port 7788/7789',
  );
});

test('a running host is described by its own status file', () => {
  const now = new Date().toISOString();
  const layout = hostFolder({
    'state/status.json': {
      pid: process.pid,
      hostId: 'box-1',
      boxKey: '0123456789abcdef',
      startedAt: now,
      heartbeatAt: now,
      cabinet: 'https://cabinet.example',
      lastPoll: { ok: false, at: now, error: 'HTTP 503' },
      busy: { action: 'activate', releaseId: '20261123-100000-aaaabbbb' },
      outbox: 2,
      previewPorts: '7962-7999',
      serverIds: ['42'],
      cabinetKeys: [{ name: 'ci', publicKey: 'B'.repeat(43) + '=' }],
      instances: [
        {
          name: 'city-prod',
          env: 'prod',
          preview: false,
          releaseId: '20261121-080000-0123abcd',
          state: 'backoff',
          pid: 4242,
          childPids: [4243, 4244],
          port: 7788,
          httpPort: 7789,
          restarts: 3,
          expiresAt: null,
          lastError: 'exit code 1',
        },
        { name: 'city-test', env: 'test', releaseId: null, state: 'empty', port: null },
      ],
    },
  });
  const report = hostReport(layout);
  assert.equal(report.host.running, true);
  assert.equal(report.host.pid, process.pid);
  assert.deepEqual(report.cabinetKeys, [{ name: 'ci', publicKey: 'B'.repeat(43) + '=' }]);

  const lines = reportLines(report);
  assert.match(
    lines[2],
    /^host: running \(pid \d+, id box-1\), cabinet https:\/\/cabinet\.example, last poll: failed: HTTP 503, \d+ s ago, now: activate 20261123-100000-aaaabbbb, key for releases: 0123456789abcdef, unsent statuses: 2$/,
  );
  assert.equal(
    lines[3],
    'trusted keys: 0; approved in the cabinet: 1 (ci); engines: none; cached assets: 0',
  );
  assert.equal(
    lines[4],
    '  city-prod  [prod]  release 20261121-080000-0123abcd  crashed, waiting to restart  port 7788/7789  pid 4242 (+4243, 4244), restarts: 3, error: exit code 1',
  );
  assert.equal(lines[5], '  city-test  [test]  release -  no release  port -');
});

test('a host whose heartbeat is old, or whose process is gone, is not running', () => {
  const old = new Date(Date.now() - 60_000).toISOString();
  const stale = hostFolder({ 'state/status.json': { pid: process.pid, heartbeatAt: old } });
  assert.deepEqual(hostReport(stale).host, { running: false, lastSeen: old });

  const now = new Date().toISOString();
  const gone = hostFolder({ 'state/status.json': { pid: 2 ** 31 - 2, heartbeatAt: now } });
  assert.equal(hostReport(gone).host.running, false);
});

test('a token file that cannot be used is shown as the reason there is no connection', () => {
  const layout = hostFolder({ 'host-token.json': { format: 1, cabinet: 'x' } });
  const report = hostReport(layout);
  assert.match(report.connection.error, /is not a host token file/);
  assert.match(reportLines(report)[1], /is not a host token file/);
});
