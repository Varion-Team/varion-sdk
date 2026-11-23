import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { spawn, spawnSync } from 'node:child_process';
import {
  devUiOptIn,
  devUiRoot,
  devUiUrl,
  varionDevUi,
  withDevUiTable,
  withoutDevUiTable,
} from '../dev-ui/index.mjs';
import { t } from '../i18n/index.mjs';
import { killTree } from '../shared/process.mjs';
import { CliError } from './output.mjs';
import { findViteConfig, loadVite } from './tools.mjs';

export function engineKnowsDevUi(exe) {
  try {
    return fs.readFileSync(exe).includes(Buffer.from('[dev-ui]', 'latin1'));
  } catch {
    return false;
  }
}

// the game reads the user environment (HKCU\Environment), not ours
function readUserEnv(name) {
  if (process.platform !== 'win32') return process.env[name] || '';
  const result = spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `[Environment]::GetEnvironmentVariable('${name}','User')`,
    ],
    { encoding: 'utf8', windowsHide: true, timeout: 15000 },
  );
  return (result.stdout || '').trim();
}

function writeUserEnv(name, value) {
  const result = spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `[Environment]::SetEnvironmentVariable('${name}', '${value.replace(/'/g, "''")}', 'User')`,
    ],
    { encoding: 'utf8', windowsHide: true, timeout: 15000 },
  );
  return result.status === 0;
}

function gameRunning() {
  if (process.platform !== 'win32') return false;
  const result = spawnSync('tasklist', ['/FI', 'IMAGENAME eq GTA5.exe', '/FO', 'CSV', '/NH'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  return /GTA5\.exe/i.test(result.stdout || '');
}

function ask(question) {
  return new Promise((resolve) => {
    const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
    prompt.question(question, (answer) => {
      prompt.close();
      resolve(/^(y|yes|д|да)$/i.test(answer.trim()));
    });
  });
}

function isOptIn(origin) {
  try {
    devUiOptIn(origin);
    return true;
  } catch {
    return false;
  }
}

// The project's own dev server, with the proxy that puts the shims into its pages in front.
function startOwnServer({ project, output, cliDir, url, fallback, shims }) {
  const { dev } = project.config;
  const shown = output.json ? 'ignore' : 'inherit';
  const upstream = spawn(dev.uiCommand, {
    cwd: project.root,
    shell: true,
    windowsHide: true,
    // our stdin is the server console; a pipe that never ends also keeps create-react-app up
    stdio: ['pipe', shown, shown],
    env: { ...process.env, PORT: String(dev.uiUpstreamPort), HOST: '127.0.0.1', BROWSER: 'none' },
  });
  upstream.stdin.on('error', () => {});
  const args = [
    path.join(cliDir, 'bin', 'varion-dev-ui.mjs'),
    '--upstream',
    `http://127.0.0.1:${dev.uiUpstreamPort}`,
    '--port',
    String(dev.uiPort),
    '--fallback',
    fallback,
    ...shims.flatMap((shim) => ['--shim', shim]),
  ];
  const proxy = spawn(process.execPath, args, {
    cwd: project.root,
    windowsHide: true,
    stdio: ['ignore', shown, shown],
  });
  output.info(
    t('live UI: {command} on 127.0.0.1:{port}, behind the proxy at {url}', {
      command: dev.uiCommand,
      port: dev.uiUpstreamPort,
      url,
    }),
  );
  return [
    () => upstream.exitCode === null && killTree(upstream.pid),
    () => proxy.exitCode === null && proxy.kill(),
  ];
}

async function startVite({ project, output, url, fallback, shims }) {
  const { build, dev } = project.config;
  // vite refuses files under an 8.3 path such as RUNNER~1, so give it the long one
  const uiRoot = fs.realpathSync.native(path.resolve(project.root, build.ui));
  const { module: vite } = await loadVite(project.root);
  const configFile = findViteConfig(uiRoot);
  const before = process.stdin.listeners('end');
  const server = await vite.createServer({
    root: uiRoot,
    base: './',
    configFile: configFile || false,
    clearScreen: false,
    logLevel: 'warn',
    plugins: [varionDevUi({ shims, fallback })],
    server: { host: '127.0.0.1', port: dev.uiPort, strictPort: true },
  });
  // Vite ends the whole process when stdin ends; under a task or an editor stdin ends at once,
  // and it is varion dev that decides when to stop
  for (const listener of process.stdin.listeners('end')) {
    if (!before.includes(listener)) process.stdin.off('end', listener);
  }
  await server.listen();
  output.info(t('live UI: Vite at {url}, with hot reload of the page in the game', { url }));
  return [() => server.close()];
}

// The game takes pages only from the origins named in the user's VARION_DEV_UI: adds this one,
// with the person's consent, or tells how to do it by hand.
async function allowOrigin(url, { name, output, yes, interactive }) {
  const wanted = devUiOptIn(url);
  const origins = readUserEnv('VARION_DEV_UI')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (origins.includes(wanted)) {
    output.info(t('VARION_DEV_UI already names {origin}', { origin: wanted }));
    return;
  }
  const value = devUiOptIn([...origins.filter(isOptIn), url]);
  const question = t(
    'the game needs the user environment variable VARION_DEV_UI={value} (the {name} pages come from {url}); set it?',
    { value, name, url },
  );
  const agreed = yes || (interactive && (await ask(`${question} [y/N] `)));
  if (agreed && writeUserEnv('VARION_DEV_UI', value)) {
    output.success(
      gameRunning()
        ? t(
            'VARION_DEV_UI={value} is set for this user; the game is already running: restart it, it reads the variable at startup',
            { value },
          )
        : t('VARION_DEV_UI={value} is set for this user', { value }),
    );
    return;
  }
  output.warn(
    t(
      'for the game to load the page from {url}, run this in PowerShell and restart the game: {command}; to remove it: {remove}',
      {
        url,
        command: `[Environment]::SetEnvironmentVariable('VARION_DEV_UI', '${value}', 'User')`,
        remove: `[Environment]::SetEnvironmentVariable('VARION_DEV_UI', $null, 'User')`,
      },
    ),
  );
}

export async function startUiLive({
  project,
  engine,
  settings,
  output,
  cliDir,
  yes = false,
  interactive = false,
}) {
  const { config } = project;
  const { dev } = config;
  if (!engineKnowsDevUi(engine.exe)) {
    output.warn(
      t(
        'live UI: engine {engine} does not know [dev-ui] (it needs a server and a client newer than 1.0.75); the page comes from the build',
        { engine: engine.version || engine.dir },
      ),
    );
    return null;
  }
  let root;
  try {
    root = devUiRoot(dev.uiRoot);
  } catch {
    throw new CliError(
      t('[dev] uiRoot in varion.toml: a folder of the resource such as "ui/", not "{value}"', {
        value: dev.uiRoot,
      }),
    );
  }
  if (!dev.uiCommand && !config.build.ui) {
    output.warn(
      t('live UI: the project has no [build] ui and no [dev] uiCommand, nothing to start'),
    );
    return null;
  }
  const url = devUiUrl(`http://127.0.0.1:${dev.uiPort}/`);
  const served = {
    project,
    output,
    cliDir,
    url,
    fallback: `http://127.0.0.1:${settings.httpPort}/assets/${config.project.name}/${root}`,
    shims: dev.uiShims.map((shim) => path.resolve(project.root, shim)),
  };
  const stops = dev.uiCommand ? startOwnServer(served) : await startVite(served);
  await allowOrigin(url, { name: config.project.name, output, yes, interactive });

  return {
    url,
    root,
    declare: (text) => withDevUiTable(text, { url, root }),
    undeclare: (text) => withoutDevUiTable(text),
    async stop() {
      for (const stop of [...stops].reverse()) {
        try {
          await stop();
        } catch {
          // one that does not stop must not keep the others running
        }
      }
    },
  };
}
