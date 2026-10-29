import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DEFAULT_CABINET } from '../cli/config.mjs';
import { t } from '../i18n/index.mjs';
import { errorMessage, VarionError } from '../shared/errors.mjs';
import { readJson, sleep, walkFiles, writeFileAtomic } from '../shared/fs.mjs';
import { isAlive } from '../shared/process.mjs';
import { HOST_BIN, taskName, taskXml, windowsCommandLine, windowsSystem } from './autostart.mjs';
import { cabinetAddress, HOST_VERSION } from './cabinet.mjs';
import { HostError } from './errors.mjs';
import { DEFAULT_OPTIONS, Host, parsePortRange, readHostJson } from './host.mjs';
import { loadTrust, trustKey, untrustKey } from './keys.mjs';
import { createLogger } from './log.mjs';
import { pairHost, readHostToken, saveHostToken } from './pairing.mjs';
import { defaultRoot, hostCommand, hostLayout, isInstanceName } from './paths.mjs';
import { readServerSettings } from './servertoml.mjs';

function usage() {
  return `varion host ${HOST_VERSION}: ${t('the server side of varion deploy')}

  varion host [run] [--cabinet <url>] [--root <dir>]
                                             ${t('run the host; on the first run it connects this machine to a server with a code from the cabinet')}
        [--server-id <id>]...                ${t('the cabinet servers this host serves')}
        [--preview-ports 7962-7999]          ${t('run branch previews on ports from this range')}
        [--preview-ttl 7d]                   ${t('how long a preview lives after its last deploy')}
        [--keep-releases 5] [--engine-cdn <url>] [--poll-interval 5] [--host-id <id>] [--json]
  varion host pair [--cabinet <url>]         ${t('connect this machine to a server again, with a new code')}
  varion host install [<run options>]        ${t('start the host when Windows starts (a scheduled task)')}
  varion host uninstall                      ${t('remove that scheduled task')}
  varion host trust <key> [--name <name>]    ${t('trust a developer key (the base64 that `varion keys show` prints)')}
  varion host trust --list                   ${t('list the trusted keys')}
  varion host untrust <key|name>             ${t('stop trusting a key')}
  varion host status [--json]                ${t('what runs here, on which release and port')}
  varion host stop [--wait 90]               ${t('stop the running host (servers are stopped gracefully)')}

  --cabinet <url>  ${t('the cabinet (default: {url})', { url: DEFAULT_CABINET })}
  --root <dir>  ${t('the host folder (default: VARION_HOST_ROOT, else {dir})', { dir: defaultRoot() })}
  ${t('the host token can also come from --token <token>, --token-file <file> or VARION_HOST_TOKEN')}
  ${t('besides the keys trusted here, the host trusts the keys approved in the cabinet for its server')}
`;
}

const RUN_OPTIONS = {
  cabinet: 'string',
  token: 'string',
  'token-file': 'string',
  root: 'string',
  'server-id': 'list',
  'preview-ports': 'string',
  'preview-ttl': 'string',
  'keep-releases': 'string',
  'engine-cdn': 'string',
  'poll-interval': 'string',
  'host-id': 'string',
  json: 'boolean',
};

const SPECS = {
  trust: { name: 'string', list: 'boolean', root: 'string', json: 'boolean' },
  untrust: { root: 'string', json: 'boolean' },
  run: RUN_OPTIONS,
  pair: { cabinet: 'string', root: 'string', 'host-id': 'string', json: 'boolean' },
  install: RUN_OPTIONS,
  uninstall: { root: 'string', json: 'boolean' },
  status: { root: 'string', json: 'boolean' },
  stop: { root: 'string', wait: 'string', json: 'boolean' },
};

const PASSED_TO_TASK = [
  'preview-ports',
  'preview-ttl',
  'keep-releases',
  'engine-cdn',
  'poll-interval',
  'host-id',
];

const SIGNALS = [
  'SIGINT',
  'SIGTERM',
  'SIGHUP',
  ...(process.platform === 'win32' ? ['SIGBREAK'] : []),
];

export function parseArgs(argv, spec) {
  const options = {};
  const positionals = [];
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      positionals.push(arg);
      continue;
    }
    const eq = arg.indexOf('=');
    const key = eq >= 0 ? arg.slice(2, eq) : arg.slice(2);
    const type = spec[key];
    if (!type) throw new HostError(t('unknown option --{option}', { option: key }), 'usage');
    if (type === 'boolean') {
      if (eq >= 0) throw new HostError(t('--{option} takes no value', { option: key }), 'usage');
      options[key] = true;
      continue;
    }
    const value = eq >= 0 ? arg.slice(eq + 1) : argv[++index];
    if (value === undefined || (eq < 0 && value.startsWith('--')))
      throw new HostError(t('--{option} needs a value', { option: key }), 'usage');
    if (type === 'list')
      options[key] = [
        ...(options[key] || []),
        ...value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      ];
    else options[key] = value;
  }
  return { options, positionals };
}

export function parseDuration(text, what) {
  const match = /^(\d+(?:\.\d+)?)(s|m|h|d)?$/.exec(String(text).trim());
  if (!match) {
    throw new HostError(
      t('{option}: expected a duration like 7d, 12h, 90m or 45s', { option: what }),
      'usage',
    );
  }
  const unit = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2] || 'd'];
  return Math.round(Number(match[1]) * unit);
}

function positiveInt(text, what, { min = 1, max = 1_000_000 } = {}) {
  const value = Number(text);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new HostError(
      t('{option}: expected a whole number from {min} to {max}', { option: what, min, max }),
      'usage',
    );
  }
  return value;
}

function noExtraArguments(positionals) {
  if (positionals.length) {
    throw new HostError(
      t('unexpected arguments: {args}', { args: positionals.join(' ') }),
      'usage',
    );
  }
}

const rootOf = (options) => (options.root ? path.resolve(options.root) : defaultRoot());

function hostSettings(options) {
  return {
    hostId: options['host-id'],
    serverIds: options['server-id'] || [],
    previewPorts: options['preview-ports'] ? parsePortRange(options['preview-ports']) : null,
    previewTtlMs: options['preview-ttl']
      ? parseDuration(options['preview-ttl'], '--preview-ttl')
      : DEFAULT_OPTIONS.previewTtlMs,
    keepReleases: options['keep-releases']
      ? positiveInt(options['keep-releases'], '--keep-releases', { min: 2, max: 100 })
      : DEFAULT_OPTIONS.keepReleases,
    engineCdn: options['engine-cdn'],
    pollIntervalMs: options['poll-interval']
      ? positiveInt(options['poll-interval'], '--poll-interval', { max: 3600 }) * 1000
      : DEFAULT_OPTIONS.pollIntervalMs,
  };
}

function runningHost(layout) {
  const status = readJson(layout.status, null);
  return status && !status.stopped && isAlive(status.pid) ? status : null;
}

function trustCommand(positionals, options, out) {
  const layout = hostLayout(rootOf(options));
  if (options.list) {
    const keys = loadTrust(layout.trustFile);
    if (options.json) {
      const list = keys.map(({ name, publicKey, addedAt }) => ({ name, publicKey, addedAt }));
      out.write(`${JSON.stringify(list, null, 2)}\n`);
    } else if (!keys.length) {
      out.write(`${t('no trusted keys ({file})', { file: layout.trustFile })}\n`);
    } else {
      for (const key of keys) {
        out.write(`${key.name}  ${key.publicKey}  ${t('added {time}', { time: key.addedAt })}\n`);
      }
    }
    return 0;
  }
  if (positionals.length !== 1) {
    throw new HostError(
      t('usage: {usage}', { usage: 'varion host trust <key> [--name <name>]' }),
      'usage',
    );
  }
  fs.mkdirSync(layout.trustDir, { recursive: true, mode: 0o700 });
  const { entry, added } = trustKey(layout.trustFile, positionals[0], options.name);
  if (options.json) {
    out.write(
      `${JSON.stringify({ added, name: entry.name, publicKey: entry.publicKey, file: layout.trustFile })}\n`,
    );
    return 0;
  }
  const params = { name: entry.name, key: entry.publicKey };
  const done = added
    ? t('key added: {name} {key}', params)
    : t('key already trusted, name updated: {name} {key}', params);
  const hint = t('a running host picks it up with the next request');
  out.write(`${done}\n  ${layout.trustFile}\n  ${hint}\n`);
  return 0;
}

function untrustCommand(positionals, options, out) {
  const layout = hostLayout(rootOf(options));
  if (positionals.length !== 1) {
    throw new HostError(t('usage: {usage}', { usage: 'varion host untrust <key|name>' }), 'usage');
  }
  const removed = untrustKey(layout.trustFile, positionals[0]);
  if (!removed.length) {
    throw new HostError(t('no trusted key matches {key}', { key: positionals[0] }), 'not-found');
  }
  for (const key of removed) {
    out.write(`${t('no longer trusted: {name} {key}', { name: key.name, key: key.publicKey })}\n`);
  }
  return 0;
}

function readTokenFile(file) {
  try {
    return fs.readFileSync(path.resolve(file), 'utf8').trim();
  } catch (error) {
    throw new HostError(
      t('cannot read the token file {file}: {reason}', { file, reason: error.message }),
      'no-token',
    );
  }
}

function readToken(options) {
  const token =
    options.token || (options['token-file'] ? readTokenFile(options['token-file']) : '');
  return token || (process.env.VARION_HOST_TOKEN || '').trim();
}

async function connectMachine({ layout, cabinet, options, log, signal }) {
  const hostId = options['host-id'] || readHostJson(layout).hostId;
  const paired = await pairHost({
    cabinetUrl: cabinet,
    hostId,
    hostname: os.hostname(),
    log,
    signal,
  });
  const file = layout.tokenFile;
  const restricted = await saveHostToken(file, { cabinet: cabinetAddress(cabinet), ...paired });
  log.info(
    t('connected to the server {name} ({serverId}); the host token is saved in {file}', {
      name: paired.serverName || paired.serverId,
      serverId: paired.serverId,
      file,
    }),
    { serverId: paired.serverId, serverName: paired.serverName, file },
    'paired',
  );
  if (!restricted) {
    log.warn(t('could not limit who may read {file}: check its permissions', { file }));
  }
  return paired;
}

async function pairedConnection(options, layout, log, signal) {
  const saved = readHostToken(layout.tokenFile);
  const cabinet = options.cabinet || saved?.cabinet || DEFAULT_CABINET;
  if (saved && cabinetAddress(saved.cabinet) === cabinetAddress(cabinet)) {
    return { cabinet, tokenFile: layout.tokenFile };
  }
  if (saved) {
    log.warn(
      t('this machine is connected through {old}; connecting it through {cabinet} instead', {
        old: saved.cabinet,
        cabinet,
      }),
    );
  }
  await connectMachine({ layout, cabinet, options, log, signal });
  return { cabinet, tokenFile: layout.tokenFile };
}

function onSignals(handler) {
  for (const signal of SIGNALS) process.on(signal, handler);
  return () => {
    for (const signal of SIGNALS) process.off(signal, handler);
  };
}

async function runCommand(positionals, options, out) {
  noExtraArguments(positionals);
  const root = rootOf(options);
  const layout = hostLayout(root);
  const settings = hostSettings(options);
  const log = createLogger({ json: !!options.json, file: layout.hostLog, out });
  const abort = new AbortController();
  let host = null;
  const off = onSignals((signal) => {
    log.info(t('got {signal}: stopping the servers and exiting', { signal }), { signal }, 'signal');
    abort.abort();
    host?.requestStop();
  });
  try {
    const token = readToken(options);
    let connection;
    try {
      connection = token
        ? { cabinet: options.cabinet || DEFAULT_CABINET, token }
        : await pairedConnection(options, layout, log, abort.signal);
    } catch (error) {
      if (!abort.signal.aborted) throw error;
    }
    if (abort.signal.aborted) {
      log.info(t('stopped before the machine was connected'), {}, 'pair-stopped');
      return 1;
    }
    host = new Host({
      root,
      cabinetUrl: connection.cabinet,
      token: connection.token,
      tokenFile: connection.tokenFile,
      ...settings,
      log,
    });
    await host.run();
  } finally {
    off();
  }
  return 0;
}

async function pairCommand(positionals, options, out) {
  noExtraArguments(positionals);
  const layout = hostLayout(rootOf(options));
  let saved = null;
  try {
    saved = readHostToken(layout.tokenFile);
  } catch {}
  const cabinet = options.cabinet || saved?.cabinet || DEFAULT_CABINET;
  const log = createLogger({ json: !!options.json, file: layout.hostLog, out });
  const abort = new AbortController();
  const off = onSignals(() => abort.abort());
  try {
    await connectMachine({ layout, cabinet, options, log, signal: abort.signal });
  } catch (error) {
    if (!abort.signal.aborted) throw error;
    log.info(t('stopped before the machine was connected'), {}, 'pair-stopped');
    return 1;
  } finally {
    off();
  }
  log.info(
    t('a running host picks up the new token by itself; otherwise start it: {command}', {
      command: hostCommand(layout.root, ''),
    }),
  );
  return 0;
}

function needsWindows(system) {
  if (system.platform !== 'win32') {
    throw new HostError(
      t(
        'varion host install sets up a Windows scheduled task; on Linux run varion host as a systemd service',
      ),
      'usage',
    );
  }
}

async function installCommand(positionals, options, out, system) {
  noExtraArguments(positionals);
  needsWindows(system);
  if (options.token) {
    throw new HostError(
      t(
        'a scheduled task would show --token to anyone who can read it: connect the machine (varion host pair) or use --token-file',
      ),
      'usage',
    );
  }
  // options that would fail the task at every start of Windows fail here
  hostSettings(options);
  if (!system.elevated()) {
    throw new HostError(
      t('a task that starts with Windows can only be installed from an administrator terminal'),
      'not-admin',
    );
  }
  const root = rootOf(options);
  const layout = hostLayout(root);
  const args = ['run', '--root', root];
  if (options['token-file']) {
    const tokenFile = path.resolve(options['token-file']);
    if (!readTokenFile(tokenFile)) {
      throw new HostError(t('the token file {file} is empty', { file: tokenFile }), 'no-token');
    }
    args.push('--token-file', tokenFile, '--cabinet', options.cabinet || DEFAULT_CABINET);
  } else {
    const log = createLogger({ json: !!options.json, file: layout.hostLog, out });
    const abort = new AbortController();
    const off = onSignals(() => abort.abort());
    try {
      await pairedConnection(options, layout, log, abort.signal);
    } catch (error) {
      if (!abort.signal.aborted) throw error;
      log.info(t('stopped before the machine was connected'), {}, 'pair-stopped');
      return 1;
    } finally {
      off();
    }
  }
  for (const id of options['server-id'] || []) args.push('--server-id', id);
  for (const option of PASSED_TO_TASK) {
    if (options[option]) args.push(`--${option}`, options[option]);
  }
  const name = taskName(root);
  const command = [process.execPath, HOST_BIN, ...args];
  system.createTask(
    name,
    taskXml({
      command: process.execPath,
      args: [HOST_BIN, ...args],
      cwd: root,
      description: t('varion host: applies deploys from the Varion cabinet ({root})', { root }),
    }),
  );
  const running = runningHost(layout);
  const started = !running && system.runTask(name);
  if (options.json) {
    const report = {
      task: name,
      commandLine: windowsCommandLine(command),
      started,
      log: layout.hostLog,
    };
    out.write(`${JSON.stringify(report)}\n`);
    return 0;
  }
  const lines = [
    t('installed the scheduled task "{name}": it starts the host as SYSTEM when Windows starts', {
      name,
    }),
    `  ${windowsCommandLine(command)}`,
    running
      ? t(
          'a host already runs in this folder (pid {pid}); the task starts it after the next restart of Windows',
          { pid: running.pid },
        )
      : started
        ? t('the task started the host now; its log: {file}', { file: layout.hostLog })
        : t('the task did not start now; it starts the host with the next start of Windows'),
    t('to remove it: {command} (or schtasks /Delete /TN "{name}" /F)', {
      command: hostCommand(root, 'uninstall'),
      name,
    }),
  ];
  out.write(`${lines.join('\n')}\n`);
  return 0;
}

function uninstallCommand(positionals, options, out, system) {
  noExtraArguments(positionals);
  needsWindows(system);
  const root = rootOf(options);
  const name = taskName(root);
  if (!system.elevated()) {
    throw new HostError(
      t('the scheduled task can only be removed from an administrator terminal'),
      'not-admin',
    );
  }
  if (!system.hasTask(name)) {
    if (options.json) out.write(`${JSON.stringify({ task: name, removed: false })}\n`);
    else out.write(`${t('there is no scheduled task "{name}": nothing to remove', { name })}\n`);
    return 0;
  }
  system.deleteTask(name);
  const running = runningHost(hostLayout(root));
  if (options.json) {
    out.write(`${JSON.stringify({ task: name, removed: true, running: !!running })}\n`);
    return 0;
  }
  out.write(
    `${t('removed the scheduled task "{name}": the host no longer starts with Windows', { name })}\n`,
  );
  if (running) {
    out.write(
      `${t('the host that runs now (pid {pid}) keeps running; to stop it: {command}', {
        pid: running.pid,
        command: hostCommand(root, 'stop'),
      })}\n`,
    );
  }
  return 0;
}

function readInstancesFromDisk(layout) {
  const list = [];
  let names = [];
  try {
    names = fs.readdirSync(layout.instancesDir);
  } catch {}
  for (const name of names.filter(isInstanceName).sort()) {
    const dir = path.join(layout.instancesDir, name);
    const meta = readJson(path.join(dir, 'instance.json'), null);
    if (!meta) continue;
    let current = '';
    try {
      current = fs.readFileSync(path.join(dir, 'current'), 'utf8').trim();
    } catch {}
    let settings = null;
    try {
      settings = readServerSettings(fs.readFileSync(path.join(dir, 'server.toml'), 'utf8'));
    } catch {}
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

function statusCommand(positionals, options, out) {
  noExtraArguments(positionals);
  const layout = hostLayout(rootOf(options));
  const status = readJson(layout.status, null);
  const running =
    !!status &&
    !status.stopped &&
    isAlive(status.pid) &&
    Date.now() - Date.parse(status.heartbeatAt) < 30_000;
  const instances = running ? status.instances : readInstancesFromDisk(layout);
  let trusted = [];
  try {
    trusted = loadTrust(layout.trustFile);
  } catch {}
  let connection = null;
  let unreadable = '';
  try {
    connection = readHostToken(layout.tokenFile);
  } catch (error) {
    unreadable = errorMessage(error);
  }
  const cabinetKeys = running && Array.isArray(status.cabinetKeys) ? status.cabinetKeys : [];
  const engines = listEngines(layout.engineDir);
  let cachedAssets = 0;
  try {
    cachedAssets = walkFiles(layout.assetsDir).filter((name) => /^[0-9a-f]{64}$/.test(name)).length;
  } catch {}
  const report = {
    root: layout.root,
    connection: connection
      ? {
          cabinet: connection.cabinet,
          serverId: connection.serverId,
          serverName: connection.serverName,
          pairedAt: connection.pairedAt,
        }
      : unreadable
        ? { error: unreadable }
        : null,
    host: running
      ? {
          running: true,
          pid: status.pid,
          hostId: status.hostId,
          startedAt: status.startedAt,
          heartbeatAt: status.heartbeatAt,
          cabinet: status.cabinet,
          lastPoll: status.lastPoll,
          busy: status.busy,
          outbox: status.outbox,
          previewPorts: status.previewPorts,
          serverIds: status.serverIds,
        }
      : { running: false, lastSeen: status?.heartbeatAt || null },
    trustedKeys: trusted.map(({ name, publicKey }) => ({ name, publicKey })),
    cabinetKeys,
    engines,
    cachedAssets,
    instances,
  };
  if (options.json) {
    out.write(`${JSON.stringify(report, null, 2)}\n`);
    return 0;
  }
  out.write(`${t('host folder: {dir}', { dir: layout.root })}\n`);
  out.write(
    `${
      connection
        ? t('connected to the server {name} ({serverId}) through {cabinet}', {
            name: connection.serverName || connection.serverId || '-',
            serverId: connection.serverId || '-',
            cabinet: connection.cabinet,
          })
        : unreadable ||
          t('not connected to a server by code (varion host does it on its first run)')
    }\n`,
  );
  if (running) {
    const { lastPoll } = status;
    const seconds = lastPoll ? Math.round((Date.now() - Date.parse(lastPoll.at)) / 1000) : 0;
    const poll = !lastPoll
      ? t('not yet')
      : lastPoll.ok
        ? t('ok, {seconds} s ago', { seconds })
        : t('failed: {error}, {seconds} s ago', { error: lastPoll.error, seconds });
    const parts = [
      t('host: running (pid {pid}, id {hostId}), cabinet {cabinet}, last poll: {poll}', {
        pid: status.pid,
        hostId: status.hostId,
        cabinet: status.cabinet,
        poll,
      }),
    ];
    if (status.busy) {
      parts.push(
        t('now: {action} {releaseId}', {
          action: status.busy.action,
          releaseId: status.busy.releaseId,
        }),
      );
    }
    if (status.outbox) parts.push(t('unsent statuses: {count}', { count: status.outbox }));
    out.write(`${parts.join(', ')}\n`);
  } else {
    const line = status?.heartbeatAt
      ? t('host: not running (last seen {time})', { time: status.heartbeatAt })
      : t('host: not running');
    out.write(`${line}\n`);
  }
  const names = trusted.map((key) => key.name).join(', ');
  const keysText = [
    `${t('trusted keys: {count}', { count: trusted.length })}${names ? ` (${names})` : ''}`,
  ];
  if (running) {
    const approved = cabinetKeys.map((key) => key.name).join(', ');
    keysText.push(
      `${t('approved in the cabinet: {count}', { count: cabinetKeys.length })}${approved ? ` (${approved})` : ''}`,
    );
  }
  const engineList = engines.map(({ version, channel }) => `${version} (${channel})`).join(', ');
  const enginesText = engineList
    ? t('engines: {engines}', { engines: engineList })
    : t('engines: none');
  const assetsText = t('cached assets: {count}', { count: cachedAssets });
  out.write(`${[...keysText, enginesText, assetsText].join('; ')}\n`);
  if (!instances.length) {
    out.write(`${t('no instances')}\n`);
    return 0;
  }
  for (const item of instances) {
    const children = item.childPids?.length ? ` (+${item.childPids.join(', ')})` : '';
    const extra = [
      item.pid ? `pid ${item.pid}${children}` : '',
      item.restarts ? t('restarts: {count}', { count: item.restarts }) : '',
      item.expiresAt ? t('expires {time}', { time: item.expiresAt }) : '',
      item.lastError ? `${t('error')}: ${item.lastError}` : '',
    ]
      .filter(Boolean)
      .join(', ');
    const columns = [
      item.name,
      `[${item.preview ? t('preview') : item.env}]`,
      t('release {releaseId}', { releaseId: item.releaseId || '-' }),
      stateText(item.state),
      item.port
        ? t('port {port}/{httpPort}', { port: item.port, httpPort: item.httpPort })
        : t('port {port}', { port: '-' }),
      extra,
    ];
    out.write(`  ${columns.filter(Boolean).join('  ')}\n`);
  }
  return 0;
}

async function stopCommand(positionals, options, out) {
  noExtraArguments(positionals);
  const layout = hostLayout(rootOf(options));
  const status = runningHost(layout);
  if (!status) {
    out.write(`${t('the host is not running')}\n`);
    return 0;
  }
  writeFileAtomic(layout.stopRequest, `${new Date().toISOString()}\n`);
  const waitMs = options.wait
    ? positiveInt(options.wait, '--wait', { min: 0, max: 3600 }) * 1000
    : 120_000;
  out.write(`${t('asked the host (pid {pid}) to stop', { pid: status.pid })}\n`);
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    if (!isAlive(status.pid)) {
      out.write(`${t('the host stopped')}\n`);
      return 0;
    }
    await sleep(500);
  }
  if (!waitMs) return 0;
  out.write(
    `${t('the host is still running after {seconds} s (pid {pid})', {
      seconds: Math.round(waitMs / 1000),
      pid: status.pid,
    })}\n`,
  );
  return 1;
}

export async function main(
  argv,
  { out = process.stdout, err = process.stderr, system = windowsSystem } = {},
) {
  const args = [...argv];
  // the word host in front is optional: `varion-host host run` works too
  if (args[0] === 'host') args.shift();
  const first = args[0];
  if (first === 'help' || first === '--help' || first === '-h') {
    out.write(usage());
    return 0;
  }
  if (first === '--version' || first === 'version') {
    out.write(`${HOST_VERSION}\n`);
    return 0;
  }
  const command = first === undefined || first.startsWith('--') ? 'run' : args.shift();
  const spec = SPECS[command];
  if (!spec) {
    err.write(
      `varion host: ${t('"{command}" is not a varion host command', { command })}\n\n${usage()}`,
    );
    return 2;
  }
  try {
    const { options, positionals } = parseArgs(args, spec);
    if (command === 'trust') return trustCommand(positionals, options, out);
    if (command === 'untrust') return untrustCommand(positionals, options, out);
    if (command === 'run') return await runCommand(positionals, options, out);
    if (command === 'pair') return await pairCommand(positionals, options, out);
    if (command === 'install') return await installCommand(positionals, options, out, system);
    if (command === 'uninstall') return uninstallCommand(positionals, options, out, system);
    if (command === 'status') return statusCommand(positionals, options, out);
    return await stopCommand(positionals, options, out);
  } catch (error) {
    err.write(`varion host ${command}: ${errorMessage(error)}\n`);
    if (!(error instanceof VarionError)) err.write(`${error?.stack || error}\n`);
    return error?.code === 'usage' ? 2 : 1;
  }
}
