// What `varion host status` shows: the host as it last described itself, and what is on disk.
import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { errorMessage } from '../shared/errors.mjs';
import { readJson, walkFiles } from '../shared/fs.mjs';
import { isAlive } from '../shared/process.mjs';
import { loadTrust } from './keys.mjs';
import { readHostToken } from './pairing.mjs';
import { isInstanceName } from './paths.mjs';
import { readServerSettings } from './servertoml.mjs';

function readInstancesFromDisk(layout) {
  const list = [];
  let names = [];
  try {
    names = fs.readdirSync(layout.instancesDir);
  } catch {
    // no instances yet
  }
  for (const name of names.filter(isInstanceName).sort()) {
    const dir = path.join(layout.instancesDir, name);
    const meta = readJson(path.join(dir, 'instance.json'), null);
    if (!meta) continue;
    let current = '';
    try {
      current = fs.readFileSync(path.join(dir, 'current'), 'utf8').trim();
    } catch {
      // no release was activated yet
    }
    let settings = null;
    try {
      settings = readServerSettings(fs.readFileSync(path.join(dir, 'server.toml'), 'utf8'));
    } catch {
      // no server.toml yet
    }
    const pid = readJson(path.join(dir, 'server.pid'), null)?.pid;
    const alive = isAlive(pid);
    list.push({
      name,
      project: meta.project,
      env: meta.env,
      serverId: meta.serverId,
      preview: meta.preview,
      releaseId: current || null,
      state: alive ? 'running?' : 'stopped',
      pid: alive ? pid : null,
      childPids: [],
      port: settings?.port ?? meta.ports?.port ?? null,
      httpPort: settings?.httpPort ?? meta.ports?.httpPort ?? null,
      restarts: 0,
      lastDeployAt: meta.lastDeployAt,
      expiresAt: null,
      lastError: null,
    });
  }
  return list;
}

function listDirs(dir) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

function listEngines(engineDir) {
  const engines = [];
  for (const channel of listDirs(engineDir)) {
    for (const version of listDirs(path.join(engineDir, channel))) {
      // copies set aside after a failed check, or still being unpacked
      if (/^\d/.test(version) && !/\.(bad|staging)-/.test(version))
        engines.push({ version, channel });
    }
  }
  return engines;
}

function stateText(state) {
  const text = {
    running: t('running'),
    starting: t('starting'),
    stopping: t('stopping'),
    stopped: t('stopped'),
    backoff: t('crashed, waiting to restart'),
    failed: t('not started (error)'),
    empty: t('no release'),
    'running?': t('process alive (host not running)'),
  };
  return text[state] || state;
}

const quietly = (read, fallback) => {
  try {
    return read();
  } catch {
    return fallback;
  }
};

export function hostReport(layout) {
  const status = readJson(layout.status, null);
  const running =
    !!status &&
    !status.stopped &&
    isAlive(status.pid) &&
    Date.now() - Date.parse(status.heartbeatAt) < 30_000;
  let connection = null;
  try {
    const paired = readHostToken(layout.tokenFile);
    if (paired) {
      const { cabinet, serverId, serverName, pairedAt } = paired;
      connection = { cabinet, serverId, serverName, pairedAt };
    }
  } catch (error) {
    connection = { error: errorMessage(error) };
  }
  const host = running
    ? {
        running: true,
        pid: status.pid,
        hostId: status.hostId,
        boxKey: status.boxKey || null,
        startedAt: status.startedAt,
        heartbeatAt: status.heartbeatAt,
        cabinet: status.cabinet,
        lastPoll: status.lastPoll,
        busy: status.busy,
        outbox: status.outbox,
        previewPorts: status.previewPorts,
        serverIds: status.serverIds,
      }
    : { running: false, lastSeen: status?.heartbeatAt || null };
  const packs = quietly(() => walkFiles(layout.assetsDir), []);
  return {
    root: layout.root,
    connection,
    host,
    trustedKeys: quietly(() => loadTrust(layout.trustFile), []).map(({ name, publicKey }) => ({
      name,
      publicKey,
    })),
    cabinetKeys: running && Array.isArray(status.cabinetKeys) ? status.cabinetKeys : [],
    engines: listEngines(layout.engineDir),
    cachedAssets: packs.filter((name) => /^[0-9a-f]{64}$/.test(name)).length,
    instances: running ? status.instances : readInstancesFromDisk(layout),
  };
}

function connectionLine(connection) {
  if (!connection) {
    return t('not connected to a server by code (varion host does it on its first run)');
  }
  if (connection.error) return connection.error;
  return t('connected to the server {name} ({serverId}) through {cabinet}', {
    name: connection.serverName || connection.serverId || '-',
    serverId: connection.serverId || '-',
    cabinet: connection.cabinet,
  });
}

function hostLine(host) {
  if (!host.running) {
    return host.lastSeen
      ? t('host: not running (last seen {time})', { time: host.lastSeen })
      : t('host: not running');
  }
  const { lastPoll, busy } = host;
  const seconds = lastPoll ? Math.round((Date.now() - Date.parse(lastPoll.at)) / 1000) : 0;
  const poll = !lastPoll
    ? t('not yet')
    : lastPoll.ok
      ? t('ok, {seconds} s ago', { seconds })
      : t('failed: {error}, {seconds} s ago', { error: lastPoll.error, seconds });
  return [
    t('host: running (pid {pid}, id {hostId}), cabinet {cabinet}, last poll: {poll}', {
      pid: host.pid,
      hostId: host.hostId,
      cabinet: host.cabinet,
      poll,
    }),
    busy && t('now: {action} {releaseId}', { action: busy.action, releaseId: busy.releaseId }),
    host.boxKey && t('key for releases: {fingerprint}', { fingerprint: host.boxKey }),
    host.outbox && t('unsent statuses: {count}', { count: host.outbox }),
  ]
    .filter(Boolean)
    .join(', ');
}

function storeLine({ host, trustedKeys, cabinetKeys, engines, cachedAssets }) {
  const counted = (text, keys) => {
    const names = keys.map((key) => key.name).join(', ');
    return `${text}${names ? ` (${names})` : ''}`;
  };
  const engineList = engines.map(({ version, channel }) => `${version} (${channel})`).join(', ');
  return [
    counted(t('trusted keys: {count}', { count: trustedKeys.length }), trustedKeys),
    host.running &&
      counted(t('approved in the cabinet: {count}', { count: cabinetKeys.length }), cabinetKeys),
    engineList ? t('engines: {engines}', { engines: engineList }) : t('engines: none'),
    t('cached assets: {count}', { count: cachedAssets }),
  ]
    .filter(Boolean)
    .join('; ');
}

function instanceLine(item) {
  const children = item.childPids?.length ? ` (+${item.childPids.join(', ')})` : '';
  const extra = [
    item.pid ? `pid ${item.pid}${children}` : '',
    item.restarts ? t('restarts: {count}', { count: item.restarts }) : '',
    item.expiresAt ? t('expires {time}', { time: item.expiresAt }) : '',
    item.lastError ? `${t('error')}: ${item.lastError}` : '',
  ];
  const columns = [
    item.name,
    `[${item.preview ? t('preview') : item.env}]`,
    t('release {releaseId}', { releaseId: item.releaseId || '-' }),
    stateText(item.state),
    item.port
      ? t('port {port}/{httpPort}', { port: item.port, httpPort: item.httpPort })
      : t('port {port}', { port: '-' }),
    extra.filter(Boolean).join(', '),
  ];
  return `  ${columns.filter(Boolean).join('  ')}`;
}

export function reportLines(report) {
  return [
    t('host folder: {dir}', { dir: report.root }),
    connectionLine(report.connection),
    hostLine(report.host),
    storeLine(report),
    ...(report.instances.length ? report.instances.map(instanceLine) : [t('no instances')]),
  ];
}
