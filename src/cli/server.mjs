import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
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

export function startServer({ exe, serverDir, env = {}, output, root, echo = true, resourceName }) {
  fs.mkdirSync(path.join(serverDir, 'logs'), { recursive: true });
  const logFile = path.join(serverDir, 'logs', `server-${utcStamp()}.log`);
  const log = fs.createWriteStream(logFile);
  const configFile = path.join(serverDir, 'server.toml');
  const pidFile = path.join(serverDir, 'server.pid');
  const child = spawn(exe, ['--config', configFile], {
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
  // a failed spawn also emits 'error', after the throw below
  child.on('error', () => {});
  if (!child.pid) throw new CliError(t('the server did not start: {exe}', { exe }));
  writePidFile(pidFile, { pid: child.pid, exe, config: configFile });

  const listeners = [];
  const recent = [];
  let readyResolve;
  let readyReject;
  const ready = new Promise((resolve, reject) => {
    readyResolve = resolve;
    readyReject = reject;
  });
  ready.catch(() => {});
  let isReady = false;
  const exited = new Promise((resolve) => {
    child.on('exit', (code) => {
      fs.rmSync(pidFile, { force: true });
      if (!isReady) {
        readyReject(
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
    recent.push(line);
    if (recent.length > 300) recent.shift();
    const parsed = parseServerLine(line);
    if (!isReady && /'.*' running \|/.test(line)) {
      isReady = true;
      readyResolve();
    }
    const started = /\[host\] started resource (\S+)/.exec(parsed.text);
    const failed = /\[host\] resource (\S+) (?:failed: |cannot start: )(.*)$/.exec(parsed.text);
    if (echo) {
      if (output.json) {
        output.event('log', {
          source: 'server',
          level: parsed.level,
          component: parsed.component,
          text: parsed.text,
          location: sourceLocation(parsed.text, root),
        });
      } else {
        const color = parsed.level === 'error' ? 'red' : parsed.level === 'warn' ? 'yellow' : null;
        output.line(
          color ? output.paint(color, line) : line,
          stream === 'stderr' ? 'stderr' : 'stdout',
        );
      }
    }
    if (started)
      output.event(
        'resource',
        { name: started[1], state: 'started' },
        started[1] === resourceName && !output.json
          ? output.paint(
              'green',
              `[${output.prefix}] ${t('resource {name} started', { name: started[1] })}`,
            )
          : undefined,
      );
    if (failed)
      output.event('resource', {
        name: failed[1],
        state: 'failed',
        text: failed[2],
        location: sourceLocation(failed[2], root),
      });
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
    for (const listener of [...listeners]) listener(line, parsed);
  };

  const forward = (stream, name) => {
    let rest = '';
    stream.on('data', (chunk) => {
      log.write(chunk);
      const lines = (rest + chunk.toString('utf8')).split(/\r?\n/);
      rest = lines.pop();
      for (const line of lines) handleLine(line, name);
    });
    stream.on('end', () => {
      if (rest) handleLine(rest, name);
      rest = '';
    });
  };
  forward(child.stdout, 'stdout');
  forward(child.stderr, 'stderr');
  child.stdin.on('error', () => {});

  return {
    child,
    pid: child.pid,
    logFile,
    ready,
    exited,
    recent,
    send(line) {
      if (child.exitCode === null && child.stdin.writable) child.stdin.write(`${line}\n`);
    },
    onLine(fn) {
      listeners.push(fn);
      return () => {
        const index = listeners.indexOf(fn);
        if (index >= 0) listeners.splice(index, 1);
      };
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
