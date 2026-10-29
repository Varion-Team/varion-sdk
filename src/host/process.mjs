import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { sleep } from '../shared/fs.mjs';
import { childPids, commandLineOf, isAlive } from '../shared/process.mjs';
import { HostError } from './errors.mjs';

// the engine prints this once it listens (plain log style)
export const READY_LINE = /'.*' running \| listen UDP /;
const RING_LINES = 400;

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function serverEnvironment(base = process.env) {
  const env = {};
  for (const [key, value] of Object.entries(base)) {
    // the host's token stays with the host
    if (/^VARION_HOST_/i.test(key)) continue;
    env[key] = value;
  }
  env.VARION_LOG_STYLE = 'plain';
  env.NO_COLOR = '1';
  return env;
}

export async function reapPids(pids, ms, { mustInclude = '' } = {}) {
  const deadline = Date.now() + ms;
  let alive = pids.filter(isAlive);
  while (alive.length && Date.now() < deadline) {
    await sleep(200);
    alive = alive.filter(isAlive);
  }
  const ended = [];
  for (const pid of alive) {
    // the system may have given the pid to another process since
    if (mustInclude) {
      const line = await commandLineOf(pid);
      if (!line || !line.toLowerCase().includes(mustInclude.toLowerCase())) continue;
    }
    try {
      process.kill(pid, 'SIGKILL');
      ended.push(pid);
    } catch {}
  }
  return ended;
}

export class ServerProcess extends EventEmitter {
  constructor({ command, args, cwd, env, logFile }) {
    super();
    this.command = command;
    this.args = args;
    this.cwd = cwd;
    this.env = env;
    this.logFile = logFile;
    this.lines = [];
    this.waiters = new Set();
    this.ready = false;
    this.stopping = false;
    this.exitInfo = null;
    this.childPids = [];
    // its js host runs from the engine folder
    this.childMarker = path.dirname(command);
  }

  get pid() {
    return this.child?.pid ?? null;
  }

  get exited() {
    return this.exitInfo !== null;
  }

  start({ readyTimeoutMs = 120_000, settleMs = 1500 } = {}) {
    this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
    this.exitPromise = new Promise((resolve) => {
      this.resolveExit = resolve;
    });
    return new Promise((resolve, reject) => {
      let settled = false;
      let readyTimer = null;
      const finish = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        clearTimeout(readyTimer);
        this.off('line', onLine);
        this.off('exit', onExit);
        if (error) reject(error);
        else resolve();
      };
      const timeout = setTimeout(() => {
        const message = t('the server did not report ready within {seconds} s', {
          seconds: Math.round(readyTimeoutMs / 1000),
        });
        finish(new HostError(`${message}${this.recentErrors()}`, 'start-timeout'));
      }, readyTimeoutMs);
      const onLine = (line) => {
        if (this.ready || !READY_LINE.test(line)) return;
        this.ready = true;
        this.readyAt = Date.now();
        readyTimer = setTimeout(() => finish(this.exited ? this.exitError() : null), settleMs);
      };
      const onExit = () => finish(this.exitError());
      this.on('line', onLine);
      this.on('exit', onExit);
      try {
        this.child = spawn(this.command, this.args, {
          cwd: this.cwd,
          env: this.env,
          stdio: ['pipe', 'pipe', 'pipe'],
          windowsHide: true,
        });
      } catch (error) {
        this.markExit({ code: null, signal: null, error: error.message });
        return;
      }
      this.child.stdin.on('error', () => {}); // EPIPE once the server is gone
      this.forward(this.child.stdout);
      this.forward(this.child.stderr);
      this.child.on('error', (error) =>
        this.markExit({ code: null, signal: null, error: error.message }),
      );
      this.child.on('exit', (code, signal) => this.markExit({ code, signal }));
      this.child.on('close', () => this.logStream.end());
    });
  }

  exitError() {
    const info = this.exitInfo || {};
    const message = info.error
      ? t('the server did not start: {reason}', { reason: info.error })
      : t('the server exited with code {code}', { code: info.code ?? info.signal });
    return new HostError(`${message}${this.recentErrors()}`, 'server-exit');
  }

  recentErrors() {
    const errors = this.lines
      .map((entry) => entry.text)
      .filter((line) => /\b(error|fatal|failed)\b|ошибк/i.test(line))
      .slice(-3);
    return errors.length ? `: ${errors.map((line) => line.trim().slice(0, 240)).join(' | ')}` : '';
  }

  markExit(info) {
    if (this.exitInfo) return;
    this.exitInfo = { ...info, at: Date.now() };
    const code = info.code ?? info.signal ?? info.error;
    for (const waiter of [...this.waiters]) {
      waiter.fail(new HostError(t('the server exited with code {code}', { code }), 'server-exit'));
    }
    // output may still be in flight; the log closes on 'close'
    if (info.error) this.logStream?.end();
    this.resolveExit?.(this.exitInfo);
    this.emit('exit', this.exitInfo);
  }

  forward(stream) {
    let rest = '';
    stream.on('data', (chunk) => {
      if (this.logStream.writable) this.logStream.write(chunk);
      const parts = (rest + chunk.toString('utf8')).split(/\r?\n/);
      rest = parts.pop();
      if (rest.length > 65536) rest = '';
      for (const line of parts) this.onLine(line);
    });
  }

  onLine(text) {
    this.lines.push({ text, at: Date.now() });
    if (this.lines.length > RING_LINES) this.lines.splice(0, this.lines.length - RING_LINES);
    for (const waiter of [...this.waiters]) waiter.check(text);
    this.emit('line', text);
  }

  waitForLine(patterns, timeoutMs) {
    return new Promise((resolve, reject) => {
      if (this.exited) {
        reject(new HostError(t('the server is not running'), 'server-exit'));
        return;
      }
      const waiter = {
        check: (line) => {
          for (let index = 0; index < patterns.length; index++) {
            const match = patterns[index].exec(line);
            if (match) {
              done();
              resolve({ match, index, line });
              return;
            }
          }
        },
        fail: (error) => {
          done();
          reject(error);
        },
      };
      const timer = setTimeout(() => {
        const message = t('the server did not answer within {seconds} s', {
          seconds: Math.round(timeoutMs / 1000),
        });
        waiter.fail(new HostError(message, 'console-timeout'));
      }, timeoutMs);
      const done = () => {
        clearTimeout(timer);
        this.waiters.delete(waiter);
      };
      this.waiters.add(waiter);
    });
  }

  send(line) {
    if (this.exited || !this.child?.stdin?.writable) {
      throw new HostError(t('the server console is closed'), 'server-exit');
    }
    this.child.stdin.write(`${line}\n`);
  }

  // the js host answers "[host] <op> <resource> (console): server part <result>"
  async consoleCommand(op, resource, timeoutMs = 60_000) {
    const answered = new RegExp(
      `\\[host\\] ${op} ${escapeRegExp(resource)} \\(console\\): server part ([\\w-]+)`,
    );
    const ignored = new RegExp(`\\[console\\] '${op}' ignored: (.+)$`);
    const wait = this.waitForLine([answered, ignored], timeoutMs);
    this.send(`${op} ${resource}`);
    const { match, index } = await wait;
    if (index === 1) {
      throw new HostError(
        t('the server console refused "{command}": {reason}', {
          command: `${op} ${resource}`,
          reason: match[1],
        }),
        'console-ignored',
      );
    }
    return match[1];
  }

  async collectChildren() {
    if (!this.pid || this.exited) return this.childPids;
    const pids = await childPids(this.pid);
    if (!this.exited) this.childPids = pids;
    return this.childPids;
  }

  kill(signal) {
    try {
      this.child?.kill(signal);
    } catch {}
  }

  async stop({ graceful = true, resources = [], timeoutMs = 30_000 } = {}) {
    if (!this.child) return this.exitInfo;
    if (this.exited) {
      await reapPids(this.childPids, 8000, { mustInclude: this.childMarker });
      return this.exitInfo;
    }
    this.stopping = true;
    // asked while the server lives: its children's parent id is surely this server then
    const childrenQuery = childPids(this.pid).catch(() => []);
    let children;
    if (process.platform === 'win32') {
      // no graceful signal on windows: stop the resources first so their resourceStop runs
      if (graceful && this.ready) {
        const deadline = Date.now() + timeoutMs;
        for (const name of [...resources].reverse()) {
          if (this.exited || Date.now() >= deadline) break;
          try {
            await this.consoleCommand(
              'stop',
              name,
              Math.max(1000, Math.min(15_000, deadline - Date.now())),
            );
          } catch {
            break;
          }
        }
      }
      children = await childrenQuery;
      this.kill();
    } else {
      children = await childrenQuery;
      this.kill('SIGTERM');
      const gone = await Promise.race([
        this.exitPromise.then(() => true),
        sleep(timeoutMs).then(() => false),
      ]);
      if (!gone) this.kill('SIGKILL');
    }
    await Promise.race([this.exitPromise, sleep(15_000)]);
    // its js host may stay a while holding ports and files of the resources
    const known = [...new Set([...this.childPids, ...(children || [])])];
    const left = await reapPids(known, 8000, { mustInclude: this.childMarker });
    this.childPids = [];
    return { ...this.exitInfo, killedChildren: left };
  }
}
