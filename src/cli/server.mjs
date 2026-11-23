import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { StringDecoder } from 'node:string_decoder';
import { t } from '../i18n/index.mjs';
import { toPosix, utcStamp } from '../shared/fs.mjs';
import { isAlive, killTree } from '../shared/process.mjs';
import { CliError } from './output.mjs';
import { leftoverProcess, writePidFile } from './proc.mjs';

const LINE = /^\[([^\]]*)\] \[(\w+)\] \[([^\]]*)\] (.*)$/;
const LEVELS = {
  error: 'error',
  fatal: 'error',
  warn: 'warn',
  warning: 'warn',
  ok: 'info',
  success: 'info',
  info: 'info',
  debug: 'debug',
  trace: 'debug',
};

export function parseServerLine(line) {
  const match = LINE.exec(line);
  if (!match)
    return {
      level: /\berror\b|failed/i.test(line) ? 'error' : 'info',
      component: null,
      text: line,
    };
  return { level: LEVELS[match[2].toLowerCase()] || 'info', component: match[3], text: match[4] };
}

// In brief mode the start of the server shows only its banner, problems and the mode's own
// output; the rest stays in the log file. Once the server runs, everything is shown.
export function worthShowing(line, parsed, running) {
  if (parsed.level === 'warn' || parsed.level === 'error') return true;
  // the periodic sync counter, and the prompt line that varion dev prints itself
  if (running) return !/^(?:entityBatch: \d+ published in |Ready for commands\b)/.test(parsed.text);
  if (/^== .* ==$/.test(line)) return true;
  return parsed.component === 'js' && !/\[host\] (?:loaded|started) resource /.test(parsed.text);
}

// A mode's line without the server's timestamp and level, with the resource named once.
export function modeLine(parsed) {
  if (parsed.component !== 'js') return null;
  return parsed.text.replace(/^\[([^\]]+)\] \[\1\] /, '[$1] ');
}

export function parseLeakLine(parsed) {
  const match = /^resource '([^']+)' (stopped|failed to load) but left open: (.*)$/.exec(
    parsed.text,
  );
  if (!match || (parsed.component && parsed.component !== 'res')) return null;
  return {
    resource: match[1],
    after: match[2] === 'stopped' ? 'stop' : 'load-failure',
    summary: match[3],
  };
}

export function sourceLocation(text, root) {
  const at = /((?:[A-Za-z]:)?[\\/][^():\n]+?\.(?:tsx?|mts|cts|jsx?|mjs|cjs)):(\d+):(\d+)/.exec(
    text,
  );
  if (!at) return undefined;
  const file = path.resolve(at[1]);
  const relative = path.relative(root, file);
  if (relative.startsWith('..') || path.isAbsolute(relative) || /node_modules/.test(relative))
    return undefined;
  return { file: toPosix(relative), line: Number(at[2]), column: Number(at[3]) };
}

export async function stopLeftoverServer(serverDir, output) {
  const pidFile = path.join(serverDir, 'server.pid');
  const pid = await leftoverProcess(pidFile, path.join(serverDir, 'server.toml'));
  if (!pid) return false;
  output.warn(t('the server of an earlier run is still running (PID {pid}); stopping it', { pid }));
  killTree(pid);
  fs.rmSync(pidFile, { force: true });
  return true;
}

function launch(exe, serverDir, env) {
  const notStarted = () => new CliError(t('the server did not start: {exe}', { exe }));
  let child;
  try {
    child = spawn(exe, ['--config', path.join(serverDir, 'server.toml')], {
      cwd: serverDir,
      env: {
        ...process.env,
        ...env,
        VARION_LOG_STYLE: 'plain',
        NODE_OPTIONS: [process.env.NODE_OPTIONS, '--enable-source-maps'].filter(Boolean).join(' '),
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
  } catch {
    // a file that is not a program
    throw notStarted();
  }
  // a failed spawn also emits 'error'; the missing pid below reports it
  child.on('error', () => {});
  child.stdin.on('error', () => {});
  if (!child.pid) throw notStarted();
  return child;
}

function eachLine(stream, onChunk, onLine) {
  let rest = '';
  // a character may arrive split between two chunks
  const decoder = new StringDecoder('utf8');
  stream.on('data', (chunk) => {
    onChunk(chunk);
    const lines = (rest + decoder.write(chunk)).split(/\r?\n/);
    rest = lines.pop();
    for (const line of lines) onLine(line);
  });
  stream.on('end', () => {
    rest += decoder.end();
    if (rest) onLine(rest);
    rest = '';
  });
}

function echoLine(output, line, parsed, { stream, root, brief, running }) {
  if (output.json) {
    output.event('log', {
      source: 'server',
      level: parsed.level,
      component: parsed.component,
      text: parsed.text,
      location: sourceLocation(parsed.text, root),
    });
    return;
  }
  if (brief && !worthShowing(line, parsed, running)) return;
  const color = parsed.level === 'error' ? 'red' : parsed.level === 'warn' ? 'yellow' : null;
  const text = (brief && modeLine(parsed)) || line;
  output.line(color ? output.paint(color, text) : text, stream);
}

function reportResource(output, parsed, { root, resourceName }) {
  const started = /\[host\] started resource (\S+)/.exec(parsed.text);
  if (started) {
    const [, name] = started;
    const text =
      name === resourceName && !output.json
        ? output.paint('green', `[${output.prefix}] ${t('resource {name} started', { name })}`)
        : undefined;
    output.event('resource', { name, state: 'started' }, text);
  }
  const failed = /\[host\] resource (\S+) (?:failed: |cannot start: )(.*)$/.exec(parsed.text);
  if (failed) {
    const [, name, text] = failed;
    output.event('resource', {
      name,
      state: 'failed',
      text,
      location: sourceLocation(text, root),
    });
  }
  const leak = parseLeakLine(parsed);
  if (leak) {
    const params = { name: leak.resource, summary: leak.summary };
    const text =
      leak.after === 'load-failure'
        ? t(
            'leak: resource {name} failed to load but left open: {summary}; close it in resourceStop',
            params,
          )
        : t(
            'leak: resource {name} stopped but left open: {summary}; close it in resourceStop',
            params,
          );
    output.event('leak', leak, output.paint('red', `[${output.prefix}] ${text}`));
  }
}

export function startServer({
  exe,
  serverDir,
  env = {},
  output,
  root,
  echo = true,
  brief = false,
  resourceName,
}) {
  fs.mkdirSync(path.join(serverDir, 'logs'), { recursive: true });
  const logFile = path.join(serverDir, 'logs', `server-${utcStamp()}.log`);
  const pidFile = path.join(serverDir, 'server.pid');
  const child = launch(exe, serverDir, env);
  const log = fs.createWriteStream(logFile);
  writePidFile(pidFile, { pid: child.pid, exe, config: path.join(serverDir, 'server.toml') });

  let isReady = false;
  const ready = Promise.withResolvers();
  ready.promise.catch(() => {});
  const exited = new Promise((resolve) => {
    child.on('exit', (code) => {
      fs.rmSync(pidFile, { force: true });
      if (!isReady) {
        ready.reject(
          new CliError(
            t('the server exited before it was ready (code {code}); log: {log}', {
              code,
              log: logFile,
            }),
          ),
        );
      }
      resolve(code ?? -1);
    });
  });
  // output can still come after 'exit'
  child.on('close', () => log.end());

  const handleLine = (line, stream) => {
    if (!line) return;
    const parsed = parseServerLine(line);
    const running = isReady;
    if (!isReady && /'.*' running \|/.test(line)) {
      isReady = true;
      ready.resolve();
    }
    if (echo) echoLine(output, line, parsed, { stream, root, brief, running });
    reportResource(output, parsed, { root, resourceName });
  };
  for (const stream of ['stdout', 'stderr'])
    eachLine(
      child[stream],
      (chunk) => log.write(chunk),
      (line) => handleLine(line, stream),
    );

  return {
    child,
    pid: child.pid,
    logFile,
    ready: ready.promise,
    exited,
    send(line) {
      if (child.exitCode === null && child.stdin.writable) child.stdin.write(`${line}\n`);
    },
    async stop(graceMs = 0) {
      if (child.exitCode !== null) return child.exitCode;
      if (graceMs > 0) {
        const done = await Promise.race([
          exited,
          new Promise((resolve) => setTimeout(() => resolve(null), graceMs)),
        ]);
        if (done !== null) return done;
      }
      if (isAlive(child.pid)) killTree(child.pid);
      return exited;
    },
  };
}
