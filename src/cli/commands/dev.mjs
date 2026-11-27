import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import { t } from '../../i18n/index.mjs';
import { errorMessage } from '../../shared/errors.mjs';
import { isLoopbackHost } from '../../shared/http.mjs';
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
import { writeDevVehicleCatalog } from '../vehicle-catalog.mjs';
import { watchProject } from '../watch.mjs';

const OPTIONS = {
  env: 'string',
  dotenv: 'string',
  'no-build': 'boolean',
  'no-watch': 'boolean',
  play: 'boolean',
  'ui-live': 'boolean',
  verbose: 'boolean',
  yes: 'boolean',
  json: 'boolean',
  cwd: 'string',
};

export async function run(argv, { output: root, cliDir }) {
  const { options } = parseArgs(argv, { command: 'dev', options: OPTIONS, aliases: { C: 'cwd' } });
  const output = root.child('dev');
  const project = openProject(options, output);
  const { config, paths } = project;
  const name = config.project.name;
  const envName = options.env || null;
  checkEnvName(project, envName);

  const dotenv = await prepareDotenv(project, output, { envName, dotenvFile: options.dotenv });
  if (envName) announceEnvironment(output, envName, dotenv);
  const engine = await resolveEngine(project, output);
  await ensureDatabaseRunning(project, dotenv.values, output);
  await stopLeftoverServer(paths.server, output);
  const settings = serverSettings(config, { envName });
  await ensurePortsFree(settings);

  const builder = await firstBuild(project, output, { envName, skip: options.noBuild });
  const uiLive =
    options.uiLive || config.dev.ui === 'live'
      ? await startUiLive({
          project,
          engine,
          settings,
          output,
          cliDir,
          yes: Boolean(options.yes),
          interactive: Boolean(process.stdin.isTTY) && !output.json,
        })
      : null;
  if (uiLive) builder.setResourceTransform(uiLive.declare, { undo: uiLive.undeclare });
  const undeclareUi = () => {
    if (!uiLive) return;
    try {
      builder.setResourceTransform(null, { undo: uiLive.undeclare });
    } catch {
      // the resource folder is already gone
    }
  };

  let server;
  try {
    await writeServerFolder(project, output, { settings, envValues: dotenv.values });
    server = launchServer(project, output, {
      engine,
      env: dotenv.values,
      // the whole of the server's start is in its log; --verbose shows it here too
      brief: !options.verbose,
    });
  } catch (error) {
    undeclareUi();
    await uiLive?.stop();
    await builder.dispose();
    throw error;
  }

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
  const typed = serverConsole(server);
  const cleanup = async () => {
    typed?.close();
    undeclareUi();
    await uiLive?.stop();
    await builder.dispose();
  };

  try {
    await server.ready;
  } catch (error) {
    await cleanup();
    throw error;
  }
  const url = `varion://${connectHost(settings)}:${settings.port}`;
  announceReady(output, { url, name, settings, server, uiLive });
  if (!options.verbose) output.info(t('type server commands here; Ctrl+C stops the server'));

  const followers = startFollowers(project, output, { builder, settings });
  if (options.play || config.dev.play) openGame(url, output);
  const watcher = options.noWatch
    ? null
    : startWatching(project, builder, server, output, followers.gameLogs, {
        uiLive: Boolean(uiLive),
        partRestart: engineKnowsPartRestart(engine),
      });

  const code = await server.exited;
  watcher?.close();
  followers.stop();
  await cleanup();
  output.event('stopped', { code }, `[dev] ${t('server stopped (code {code})', { code })}`);
  return stopping ? 0 : code || 1;
}

function announceEnvironment(output, envName, dotenv) {
  const files = dotenv.files.map((file) => path.basename(file)).join(' + ');
  output.info(
    dotenv.files.length > 1
      ? t('environment {env}: [env.{env}] over [server], {files}', { env: envName, files })
      : t('environment {env}: [env.{env}] over [server]', { env: envName }),
  );
}

async function firstBuild(project, output, { envName, skip }) {
  const builder = createBuilder(project, output, {
    outDir: project.paths.server,
    mapsDir: project.paths.maps,
    mode: 'dev',
    envName,
    typecheckCache: project.paths.tsc,
    failureNote: t('the server keeps running the previous build'),
  });
  if (skip) {
    if (!fs.existsSync(path.join(builder.resourceDir, 'resource.toml')))
      throw new CliError(t('--no-build: the resource is not built yet; run without --no-build'));
    return builder;
  }
  const built = await builder.build();
  if (!built.ok) {
    await builder.dispose();
    throw new CliError(t('the game mode did not build: see the errors above'));
  }
  return builder;
}

async function writeServerFolder(project, output, { settings, envValues }) {
  const serverDir = project.paths.server;
  const resources = await populateServerFolder(project, output, { serverDir, settings, envValues });
  writeDevVehicleCatalog(project, serverDir, isLoopbackHost(settings.host));
  const { port, httpPort } = settings;
  output.event(
    'config',
    { serverToml: path.join(serverDir, 'server.toml'), resources, port, httpPort },
    `[dev] ${t('server.toml: port {port} (HTTP {httpPort}), resources: {count}', {
      port,
      httpPort,
      count: resources.length,
    })}`,
  );
}

function launchServer(project, output, { engine, env, brief }) {
  const server = startServer({
    exe: engine.exe,
    serverDir: project.paths.server,
    env,
    output,
    root: project.root,
    resourceName: project.config.project.name,
    brief,
  });
  output.event(
    'server',
    { pid: server.pid, cliPid: process.pid, exe: engine.exe, log: server.logFile },
    `[dev] ${t('server: PID {pid}, log {log}', {
      pid: server.pid,
      log: path.relative(project.root, server.logFile),
    })}`,
  );
  return server;
}

// What is typed here goes to the server console.
function serverConsole(server) {
  if (process.stdin.destroyed) return null;
  const lines = readline.createInterface({ input: process.stdin, terminal: false });
  lines.on('line', (line) => {
    if (line.trim()) server.send(line.trim());
  });
  lines.on('error', () => {});
  return lines;
}

function announceReady(output, { url, name, settings, server, uiLive }) {
  const text = uiLive
    ? t('server ready: {url} (the {name} page comes from {uiUrl})', {
        url,
        name,
        uiUrl: uiLive.url,
      })
    : t('server ready: {url}', { url });
  output.event(
    'ready',
    {
      url,
      port: settings.port,
      httpPort: settings.httpPort,
      pid: server.pid,
      uiLive: uiLive ? uiLive.url : null,
    },
    output.paint('green', `[dev] ${text}`),
  );
}

function startFollowers(project, output, { builder, settings }) {
  const { dev, project: about } = project.config;
  const gameLogs = dev.gameLogs
    ? followGameLogs({
        dir: gameLogsDir(),
        output,
        root: project.root,
        resourceName: about.name,
        mapFile: path.join(project.paths.maps, 'client.js.map'),
        mapBase: path.join(builder.resourceDir, 'client'),
      })
    : null;
  const slow = dev.slowHandlers ? followSlowHandlers({ port: settings.httpPort, output }) : null;
  return {
    gameLogs,
    stop() {
      gameLogs?.stop();
      slow?.stop();
    },
  };
}

function openGame(url, output) {
  if (process.platform === 'win32') {
    spawn('cmd.exe', ['/c', 'start', '""', url], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    }).unref();
  }
  output.info(t('opening the game'));
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

const onlySide = (parts, side) => parts.every((part) => side.has(part));

async function rebuild(builder, parts) {
  const code = parts.filter((part) => part !== 'copy');
  if (code.length && !(await builder.build(code)).ok) return false;
  if (parts.includes('copy')) builder.copyOnly();
  return true;
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

  const restart = (parts, started) => {
    const command = restartCommand(parts, name, partRestart);
    const oneSide = onlySide(parts, CLIENT_PARTS) || onlySide(parts, SERVER_PARTS);
    if (!partRestart && !toldWholeRestart && oneSide) {
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
  };

  const flush = async () => {
    if (busy || pending.size === 0) return;
    // with the live UI the page reloads itself from its dev server
    const parts = [...pending].filter((part) => !(uiLive && part === 'ui'));
    pending = new Set();
    if (!parts.length) return;
    busy = true;
    const started = Date.now();
    output.event(
      'change',
      { parts },
      `[dev] ${t('change: rebuilding {parts}', { parts: parts.join(', ') })}`,
    );
    try {
      if (await rebuild(builder, parts)) {
        if (parts.includes('client')) gameLogs?.resetSourceMap();
        restart(parts, started);
      }
    } catch (error) {
      // a build tool that is gone, say: the server keeps running what it has
      output.error(errorMessage(error));
    } finally {
      busy = false;
    }
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
