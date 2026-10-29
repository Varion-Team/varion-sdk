import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import { t } from '../../i18n/index.mjs';
import { killTree } from '../../shared/process.mjs';
import { parseArgs } from '../args.mjs';
import { createBuilder } from '../build.mjs';
import { serverSettings } from '../config.mjs';
import { ensureDatabaseRunning } from '../database.mjs';
import { startUiLive } from '../devui.mjs';
import { resolveEngine } from '../engine.mjs';
import { followGameLogs, followSlowHandlers } from '../follow.mjs';
import { CliError } from '../output.mjs';
import { gameLogsDir } from '../paths.mjs';
import {
  checkEnvName,
  connectHost,
  ensurePortsFree,
  openProject,
  populateServerFolder,
  prepareDotenv,
} from '../prepare.mjs';
import { startServer, stopLeftoverServer } from '../server.mjs';
import { watchProject } from '../watch.mjs';

export async function run(argv, { output: root, cliDir }) {
  const { options } = parseArgs(argv, {
    command: 'dev',
    options: {
      env: 'string',
      dotenv: 'string',
      'no-build': 'boolean',
      'no-watch': 'boolean',
      play: 'boolean',
      'ui-live': 'boolean',
      yes: 'boolean',
      json: 'boolean',
      cwd: 'string',
    },
    aliases: { C: 'cwd' },
  });
  const output = root.child('dev');
  const project = openProject(options, output);
  const { config, paths } = project;
  const name = config.project.name;
  const envName = options.env || null;
  checkEnvName(project, envName);

  const dotenv = await prepareDotenv(project, output, { envName, dotenvFile: options.dotenv });
  if (envName) {
    const files = dotenv.files.map((file) => path.basename(file)).join(' + ');
    output.info(
      dotenv.files.length > 1
        ? t('environment {env}: [env.{env}] over [server], {files}', { env: envName, files })
        : t('environment {env}: [env.{env}] over [server]', { env: envName }),
    );
  }
  const engine = await resolveEngine(project, output);
  await ensureDatabaseRunning(project, dotenv.values, output);

  await stopLeftoverServer(paths.server, output);
  const settings = serverSettings(config, { envName });
  await ensurePortsFree(settings);

  const builder = createBuilder(project, output, {
    outDir: paths.server,
    mapsDir: paths.maps,
    mode: 'dev',
    envName,
    typecheckCache: paths.tsc,
    failureNote: t('the server keeps running the previous build'),
  });
  if (!options.noBuild) {
    const built = await builder.build();
    if (!built.ok) {
      await builder.dispose();
      throw new CliError(t('the game mode did not build: see the errors above'));
    }
  } else if (!fs.existsSync(path.join(builder.resourceDir, 'resource.toml'))) {
    throw new CliError(t('--no-build: the resource is not built yet; run without --no-build'));
  }

  let uiLive = null;
  if (options.uiLive || config.dev.ui === 'live') {
    uiLive = await startUiLive({
      project,
      engine,
      settings,
      output,
      cliDir,
      yes: Boolean(options.yes),
      interactive: Boolean(process.stdin.isTTY) && !output.json,
    });
    if (uiLive) builder.setResourceTransform(uiLive.declare, { undo: uiLive.undeclare });
  }
  const undeclareUi = () => {
    if (!uiLive) return;
    try {
      builder.setResourceTransform(null, { undo: uiLive.undeclare });
    } catch {}
  };

  const resources = await populateServerFolder(project, output, {
    serverDir: paths.server,
    settings,
    envValues: dotenv.values,
  });
  output.event(
    'config',
    {
      serverToml: path.join(paths.server, 'server.toml'),
      resources,
      port: settings.port,
      httpPort: settings.httpPort,
    },
    `[dev] ${t('server.toml: port {port} (HTTP {httpPort}), resources: {count}', {
      port: settings.port,
      httpPort: settings.httpPort,
      count: resources.length,
    })}`,
  );

  const server = startServer({
    exe: engine.exe,
    serverDir: paths.server,
    env: dotenv.values,
    output,
    root: project.root,
    resourceName: name,
  });
  output.event(
    'server',
    { pid: server.pid, cliPid: process.pid, exe: engine.exe, log: server.logFile },
    `[dev] ${t('server: PID {pid}, log {log}', {
      pid: server.pid,
      log: path.relative(project.root, server.logFile),
    })}`,
  );

  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    output.info(t('stopping the server'));
    // ctrl+c reached the server too, it usually stops by itself
    void server.stop(10000);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  process.on('exit', () => {
    undeclareUi();
    if (server.child.exitCode === null) killTree(server.pid);
  });

  let console_ = null;
  if (!process.stdin.destroyed) {
    console_ = readline.createInterface({ input: process.stdin, terminal: false });
    console_.on('line', (line) => {
      if (line.trim()) server.send(line.trim());
    });
    console_.on('error', () => {});
  }

  try {
    await server.ready;
  } catch (error) {
    await builder.dispose();
    console_?.close();
    undeclareUi();
    await uiLive?.stop();
    throw error;
  }
  const url = `varion://${connectHost(settings)}:${settings.port}`;
  output.event(
    'ready',
    {
      url,
      port: settings.port,
      httpPort: settings.httpPort,
      pid: server.pid,
      uiLive: uiLive ? uiLive.url : null,
    },
    output.paint(
      'green',
      `[dev] ${
        uiLive
          ? t('server ready: {url} (the {name} page comes from {uiUrl})', {
              url,
              name,
              uiUrl: uiLive.url,
            })
          : t('server ready: {url}', { url })
      }`,
    ),
  );

  const followers = [];
  if (config.dev.gameLogs) {
    followers.push(
      followGameLogs({
        dir: gameLogsDir(),
        output,
        root: project.root,
        resourceName: name,
        mapFile: path.join(paths.maps, 'client.js.map'),
        mapBase: path.join(builder.resourceDir, 'client'),
      }),
    );
  }
  if (config.dev.slowHandlers)
    followers.push(followSlowHandlers({ port: settings.httpPort, output }));
  if (options.play || config.dev.play) {
    if (process.platform === 'win32')
      spawn('cmd.exe', ['/c', 'start', '""', url], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      }).unref();
    output.info(t('opening the game'));
  }

  let watcher = null;
  if (!options.noWatch) {
    watcher = startWatching(project, builder, server, output, followers[0], {
      uiLive: Boolean(uiLive),
      partRestart: engineKnowsPartRestart(engine),
    });
  }

  const code = await server.exited;
  watcher?.close();
  for (const follower of followers) follower.stop();
  console_?.close();
  undeclareUi();
  await uiLive?.stop();
  await builder.dispose();
  output.event('stopped', { code }, `[dev] ${t('server stopped (code {code})', { code })}`);
  return stopping ? 0 : code || 1;
}

export function engineKnowsPartRestart(engine) {
  try {
    return fs
      .readFileSync(path.join(engine.dir, 'host', 'varion-host.cjs'), 'utf8')
      .includes('restart-client');
  } catch {
    return false;
  }
}

const CLIENT_PARTS = new Set(['client', 'ui']);
const SERVER_PARTS = new Set(['server']);

export function restartCommand(parts, name, partRestart) {
  if (partRestart && parts.length) {
    if (parts.every((part) => CLIENT_PARTS.has(part))) return `restart-client ${name}`;
    if (parts.every((part) => SERVER_PARTS.has(part))) return `restart-server ${name}`;
  }
  return `restart ${name}`;
}

function startWatching(
  project,
  builder,
  server,
  output,
  gameLogs,
  { uiLive = false, partRestart = false } = {},
) {
  const name = project.config.project.name;
  let pending = new Set();
  let busy = false;
  let toldWholeRestart = false;
  const flush = async () => {
    if (busy || pending.size === 0) return;
    busy = true;
    // with the live UI the page reloads itself from its dev server
    const parts = [...pending].filter((part) => !(uiLive && part === 'ui'));
    pending = new Set();
    if (!parts.length) {
      busy = false;
      return;
    }
    const started = Date.now();
    output.event(
      'change',
      { parts },
      `[dev] ${t('change: rebuilding {parts}', { parts: parts.join(', ') })}`,
    );
    let ok;
    if (parts.length === 1 && parts[0] === 'copy') {
      builder.copyOnly();
      ok = true;
    } else {
      ok = (await builder.build(parts.filter((part) => part !== 'copy'))).ok;
      if (ok && parts.includes('copy')) builder.copyOnly();
    }
    if (ok) {
      if (parts.includes('client')) gameLogs?.resetSourceMap();
      const command = restartCommand(parts, name, partRestart);
      if (
        !partRestart &&
        !toldWholeRestart &&
        (parts.every((part) => CLIENT_PARTS.has(part)) ||
          parts.every((part) => SERVER_PARTS.has(part)))
      ) {
        toldWholeRestart = true;
        output.info(
          t(
            'this engine cannot restart one part of a resource (restart-client and restart-server need an engine newer than 1.0.75): restarting the whole resource',
          ),
        );
      }
      server.send(command);
      const ms = Date.now() - started;
      const params = { name, seconds: (ms / 1000).toFixed(1) };
      const text = command.startsWith('restart-client')
        ? t('{name}: client part restarted ({seconds} s)', params)
        : command.startsWith('restart-server')
          ? t('{name}: server part restarted ({seconds} s)', params)
          : t('{name}: resource restarted ({seconds} s)', params);
      output.event(
        'restart',
        { resource: name, parts, command, ms },
        output.paint('green', `[dev] ${text}`),
      );
    }
    busy = false;
    if (pending.size) setTimeout(flush, 100);
  };
  const dirs = [...builder.watchDirs(), project.file];
  const watcher = watchProject(project.root, dirs, (files) => {
    for (const file of files) {
      if (file === 'varion.toml') {
        output.warn(t('varion.toml changed: restart varion dev to apply the server settings'));
        continue;
      }
      for (const part of builder.partsFor(file)) pending.add(part);
    }
    void flush();
  });
  const shown = dirs
    .map((dir) => path.relative(project.root, dir).split(path.sep).join('/') || '.')
    .filter((dir) => dir !== 'varion.toml');
  output.event(
    'watch',
    { dirs: shown },
    `[dev] ${t('watching {dirs}: save a file and the resource restarts by itself', {
      dirs: shown.map((dir) => `${dir}/`).join(', '),
    })}`,
  );
  return watcher;
}
