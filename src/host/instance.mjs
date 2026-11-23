import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { errorMessage } from '../shared/errors.mjs';
import {
  ensureDir,
  linkTree,
  randomTag,
  readJson,
  readText,
  renameWithRetry,
  tryReadJson,
  tryRemoveTree,
  utcStamp,
  writeFileAtomic,
  writeJsonAtomic,
} from '../shared/fs.mjs';
import { commandLineOf } from '../shared/process.mjs';
import { HostError } from './errors.mjs';
import { instanceLayout } from './paths.mjs';
import { reapPids, serverEnvironment, ServerProcess } from './process.mjs';
import { readReleaseDir, RELEASE_MARKER, verifyReleaseDir } from './release.mjs';
import { effectiveServerToml, readServerSettings } from './servertoml.mjs';

const STACK_LIMIT = 30;
const SERVER_LOGS_KEPT = 20;

const seconds = (ms) => Math.round(ms / 1000);

function rotateServerLogs(dir, keep) {
  try {
    const logs = fs
      .readdirSync(dir)
      .filter((name) => /^server-\d{8}-\d{6}.*\.log$/.test(name))
      .sort();
    for (const name of logs.slice(0, Math.max(0, logs.length - keep + 1)))
      fs.rmSync(path.join(dir, name), { force: true });
  } catch {
    // old logs that stay do no harm
  }
}

export class Instance {
  constructor(host, name, meta) {
    this.host = host;
    this.log = host.log;
    this.name = name;
    this.paths = instanceLayout(host.root, name);
    this.meta = meta;
    this.proc = null;
    this.state = 'stopped';
    this.wantRunning = false;
    this.restarts = 0;
    this.backoffMs = 0;
    this.restartTimer = null;
    this.nextStartAt = 0;
    this.startedAt = 0;
    this.lastExit = null;
    this.lastError = '';
    this.queue = Promise.resolve();
  }

  static load(host, name) {
    const paths = instanceLayout(host.root, name);
    const meta = readJson(paths.meta, null);
    if (!meta || meta.format !== 1 || meta.name !== name) return null;
    if (!Array.isArray(meta.stack)) meta.stack = [];
    return new Instance(host, name, meta);
  }

  static create(host, { name, project, env, serverId, preview, ports }) {
    const paths = instanceLayout(host.root, name);
    const createdByHost = !fs.existsSync(paths.dir);
    ensureDir(paths.releases);
    ensureDir(paths.logs);
    const meta = {
      format: 1,
      name,
      project,
      env,
      serverId,
      preview: !!preview,
      createdByHost,
      createdAt: new Date(host.now()).toISOString(),
      lastDeployAt: null,
      ports: ports || null,
      stack: [],
    };
    writeJsonAtomic(paths.meta, meta);
    if (preview && fs.existsSync(host.layout.previewEnv) && !fs.existsSync(paths.env)) {
      fs.copyFileSync(host.layout.previewEnv, paths.env);
      try {
        fs.chmodSync(paths.env, 0o600);
      } catch {
        // Windows has no file modes
      }
      meta.envFromTemplate = true;
      writeJsonAtomic(paths.meta, meta);
    }
    return new Instance(host, name, meta);
  }

  saveMeta() {
    writeJsonAtomic(this.paths.meta, this.meta);
  }

  exclusive(work) {
    const run = this.queue.then(work, work);
    this.queue = run.then(
      () => {},
      () => {},
    );
    return run;
  }

  get currentId() {
    return readText(this.paths.current).trim();
  }

  writeCurrent(releaseId) {
    if (releaseId) writeFileAtomic(this.paths.current, `${releaseId}\n`);
    else fs.rmSync(this.paths.current, { force: true });
  }

  releaseDir(releaseId) {
    return path.join(this.paths.releases, releaseId);
  }

  readRelease(releaseId) {
    return readReleaseDir(this.releaseDir(releaseId), {
      project: this.meta.project,
      env: this.meta.env,
      releaseId,
    });
  }

  releaseMarker(releaseId) {
    return tryReadJson(path.join(this.releaseDir(releaseId), RELEASE_MARKER), null);
  }

  // The prod server is the one players come to. It tells the platform it runs under the token
  // the host was given when its owner connected it, so nothing about the list is written into
  // varion.toml by hand; whether players see it there is the cabinet's switch and the review.
  listing() {
    if (this.meta.preview || this.meta.env !== 'prod') return null;
    const cabinet = this.host.cabinet;
    if (!cabinet?.token || typeof cabinet.endpoint !== 'function') return null;
    return { url: String(cabinet.endpoint('/api')).replace(/\/+$/, ''), token: cabinet.token };
  }

  overrides() {
    const keys = [['resourcesDir', 'resources']];
    // ports the host gave this instance: a preview always has them, a test server once its own
    // would have run into another instance of this host
    if (this.meta.ports) {
      keys.push(['port', this.meta.ports.port], ['httpPort', this.meta.ports.httpPort]);
    }
    if (this.meta.preview) keys.push(['announce', false]);
    const listing = this.listing();
    if (listing) keys.push(['announce', true], ['masterListUrl', listing.url]);
    return keys;
  }

  // the server reads its token from this file; it never goes into server.toml or a log
  writeListingToken() {
    const listing = this.listing();
    if (!listing) return;
    writeFileAtomic(path.join(this.paths.dir, 'data', 'masterlist-token.txt'), listing.token, {
      mode: 0o600,
    });
  }

  effectiveToml(releaseId) {
    return effectiveServerToml(
      fs.readFileSync(path.join(this.releaseDir(releaseId), 'server.toml'), 'utf8'),
      this.overrides(),
    );
  }

  settings() {
    const text = readText(this.paths.serverToml, '');
    return text ? readServerSettings(text) : null;
  }

  ports() {
    const settings = this.settings();
    if (settings && settings.port && settings.httpPort)
      return { port: settings.port, httpPort: settings.httpPort };
    return this.meta.ports || null;
  }

  isRunning() {
    return !!this.proc && !this.proc.exited && this.state === 'running';
  }

  expiresAt() {
    if (!this.meta.preview) return null;
    const last = Date.parse(this.meta.lastDeployAt || this.meta.createdAt);
    return new Date(last + this.host.options.previewTtlMs).toISOString();
  }

  summary() {
    const ports = this.ports();
    return {
      name: this.name,
      project: this.meta.project,
      env: this.meta.env,
      serverId: this.meta.serverId,
      preview: this.meta.preview,
      releaseId: this.currentId || null,
      // the cabinet reads status, varion host status reads state
      status: this.state,
      state: this.state,
      pid: this.proc && !this.proc.exited ? this.proc.pid : null,
      childPids: this.proc && !this.proc.exited ? this.proc.childPids : [],
      port: ports?.port ?? null,
      httpPort: ports?.httpPort ?? null,
      restarts: this.restarts,
      startedAt: this.startedAt ? new Date(this.startedAt).toISOString() : null,
      lastDeployAt: this.meta.lastDeployAt,
      expiresAt: this.expiresAt(),
      lastError: this.lastError || null,
    };
  }

  // ---- what the server runs ----

  // real folders of hard links: the engine refuses resource files that resolve elsewhere
  linkResources(releaseId, target, resource = null) {
    const source = resource
      ? path.join(this.releaseDir(releaseId), 'resources', resource)
      : path.join(this.releaseDir(releaseId), 'resources');
    if (fs.existsSync(source)) return linkTree(source, target);
    ensureDir(target);
    return 0;
  }

  tmp(name) {
    ensureDir(this.paths.tmp);
    return path.join(this.paths.tmp, name);
  }

  cleanupTmp() {
    if (!fs.existsSync(this.paths.tmp)) return;
    for (const name of fs.readdirSync(this.paths.tmp)) {
      tryRemoveTree(path.join(this.paths.tmp, name));
    }
    try {
      fs.rmdirSync(this.paths.tmp);
    } catch {
      // not empty: something in it is still in use
    }
  }

  async installStopped(releaseId) {
    const tag = `${utcStamp()}-${randomTag()}`;
    const staged = this.tmp(`resources-${tag}`);
    this.linkResources(releaseId, staged);
    const toml = this.effectiveToml(releaseId);
    if (fs.existsSync(this.paths.resources))
      await renameWithRetry(this.paths.resources, this.tmp(`old-resources-${tag}`));
    await renameWithRetry(staged, this.paths.resources);
    writeFileAtomic(this.paths.serverToml, toml);
    this.writeCurrent(releaseId);
  }

  // ---- the process ----

  async startServer(engine, reason) {
    this.writeListingToken();
    ensureDir(this.paths.logs);
    rotateServerLogs(this.paths.logs, SERVER_LOGS_KEPT);
    const logFile = path.join(this.paths.logs, `server-${utcStamp()}-${randomTag()}.log`);
    const { command, args } = this.host.launcher(engine.exe, ['--config', this.paths.serverToml], {
      instance: this,
    });
    const proc = new ServerProcess({
      command,
      args,
      cwd: this.paths.dir,
      env: serverEnvironment(),
      logFile,
    });
    this.proc = proc;
    this.state = 'starting';
    this.wantRunning = true;
    proc.on('exit', (info) => this.onExit(proc, info));
    try {
      await proc.start({
        readyTimeoutMs: this.host.options.readyTimeoutMs,
        settleMs: this.host.options.settleMs,
      });
    } catch (error) {
      await proc.stop({ graceful: false, timeoutMs: 5000 }).catch(() => {});
      if (this.proc === proc) this.proc = null;
      this.state = 'stopped';
      this.lastError = errorMessage(error);
      throw error;
    }
    this.state = 'running';
    this.startedAt = Date.now();
    this.lastError = '';
    writeJsonAtomic(this.paths.pidFile, {
      pid: proc.pid,
      exe: engine.exe,
      config: this.paths.serverToml,
      log: logFile,
      startedAt: new Date().toISOString(),
    });
    proc.collectChildren().catch(() => {});
    const ports = this.ports();
    this.log.info(
      t(
        '{name}: server started ({reason}): pid {pid}, ports {port}/{httpPort}, release {releaseId}',
        {
          name: this.name,
          reason,
          pid: proc.pid,
          port: ports?.port,
          httpPort: ports?.httpPort,
          releaseId: this.currentId,
        },
      ),
      {
        instance: this.name,
        pid: proc.pid,
        port: ports?.port,
        httpPort: ports?.httpPort,
        releaseId: this.currentId,
        log: logFile,
      },
      'server-started',
    );
  }

  onExit(proc, info) {
    if (this.proc !== proc) return;
    const wasRunning = this.state === 'running';
    this.proc = null;
    this.lastExit = info;
    fs.rmSync(this.paths.pidFile, { force: true });
    if (proc.stopping || !wasRunning) {
      if (this.state !== 'starting') this.state = 'stopped';
      return;
    }
    // its js host may still hold the ports: recover() waits for it before the next start
    this.orphans = [...proc.childPids];
    this.orphanMarker = proc.childMarker;
    this.restarts++;
    if (Date.now() - this.startedAt >= this.host.options.stableAfterMs) this.backoffMs = 0;
    this.backoffMs = Math.min(
      this.backoffMs ? this.backoffMs * 2 : this.host.options.backoffInitialMs,
      this.host.options.backoffMaxMs,
    );
    this.lastError = t('the server crashed with code {code}', {
      code: info.code ?? info.signal ?? info.error,
    });
    this.log.warn(
      t('{name}: {error}; restarting in {seconds} s', {
        name: this.name,
        error: this.lastError,
        seconds: seconds(this.backoffMs),
      }),
      {
        instance: this.name,
        code: info.code,
        signal: info.signal,
        restarts: this.restarts,
        backoffMs: this.backoffMs,
      },
      'server-crashed',
    );
    this.scheduleRecover(this.backoffMs);
  }

  scheduleRecover(ms) {
    clearTimeout(this.restartTimer);
    this.state = 'backoff';
    this.nextStartAt = Date.now() + ms;
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      this.exclusive(() => this.recover()).catch(() => {});
    }, ms);
  }

  async recover() {
    if (!this.wantRunning || this.proc || this.host.stopping) return;
    const releaseId = this.currentId;
    if (!releaseId) return;
    if (this.orphans?.length) {
      await reapPids(this.orphans, 8000, { mustInclude: this.orphanMarker });
      this.orphans = [];
    }
    try {
      const release = this.readRelease(releaseId);
      const engine = await this.host.engines.ensure(release.engine, { recheck: false });
      await this.startServer(engine, t('restart after crash #{count}', { count: this.restarts }));
    } catch (error) {
      this.lastError = errorMessage(error);
      this.backoffMs = Math.min(
        this.backoffMs ? this.backoffMs * 2 : this.host.options.backoffInitialMs,
        this.host.options.backoffMaxMs,
      );
      this.logStartFailure();
      this.scheduleRecover(this.backoffMs);
    }
  }

  logStartFailure() {
    this.log.error(
      t('{name}: the server did not start ({error}); next attempt in {seconds} s', {
        name: this.name,
        error: this.lastError,
        seconds: seconds(this.backoffMs),
      }),
      { instance: this.name },
      'server-start-failed',
    );
  }

  async stopServer(reason, { graceful = true } = {}) {
    clearTimeout(this.restartTimer);
    this.restartTimer = null;
    const proc = this.proc;
    if (!proc) {
      if (this.state !== 'failed') this.state = 'stopped';
      return;
    }
    this.state = 'stopping';
    const loaded = this.settings()?.loaded || [];
    const pid = proc.pid;
    const result = await proc.stop({
      graceful,
      resources: loaded,
      timeoutMs: this.host.options.stopTimeoutMs,
    });
    if (this.proc === proc) this.proc = null;
    this.state = 'stopped';
    fs.rmSync(this.paths.pidFile, { force: true });
    this.log.info(
      t('{name}: server stopped ({reason}): pid {pid}', { name: this.name, reason, pid }),
      { instance: this.name, pid, code: result?.code ?? null },
      'server-stopped',
    );
  }

  async killLeftover() {
    const record = tryReadJson(this.paths.pidFile, null);
    if (!record?.pid) return;
    const line = await commandLineOf(record.pid);
    const config = this.paths.serverToml;
    const ours =
      line &&
      (process.platform === 'win32'
        ? line.toLowerCase().includes(config.toLowerCase())
        : line.includes(config));
    if (ours) {
      this.log.warn(
        t('{name}: a server from the previous host run is still running (pid {pid}); stopping it', {
          name: this.name,
          pid: record.pid,
        }),
        { instance: this.name, pid: record.pid },
        'leftover',
      );
      try {
        process.kill(record.pid, 'SIGTERM');
      } catch {
        // already gone
      }
      await reapPids([record.pid], 15_000, { mustInclude: config });
    }
    fs.rmSync(this.paths.pidFile, { force: true });
  }

  async boot() {
    const releaseId = this.currentId;
    if (!releaseId) {
      this.state = 'empty';
      return;
    }
    await this.killLeftover();
    this.cleanupTmp();
    let engine;
    try {
      const release = this.readRelease(releaseId);
      await verifyReleaseDir(this.releaseDir(releaseId), release);
      engine = await this.host.engines.ensure(release.engine, { recheck: true });
      await this.installStopped(releaseId);
    } catch (error) {
      this.state = 'failed';
      this.lastError = errorMessage(error);
      this.log.error(
        t(
          '{name}: release {releaseId} failed its check at host start ({error}); the server stays stopped until the next deploy',
          { name: this.name, releaseId, error: this.lastError },
        ),
        { instance: this.name },
        'boot-failed',
      );
      return;
    }
    try {
      await this.startServer(engine, t('host start'));
    } catch (error) {
      this.lastError = errorMessage(error);
      this.backoffMs = this.host.options.backoffInitialMs;
      this.logStartFailure();
      this.wantRunning = true;
      this.scheduleRecover(this.backoffMs);
    } finally {
      this.cleanupTmp();
    }
  }

  // ---- history and cleanup ----

  pushStack(entry) {
    const top = this.meta.stack[this.meta.stack.length - 1];
    if (top && top.releaseId === entry.releaseId) this.meta.stack.pop();
    this.meta.stack.push(entry);
    if (this.meta.stack.length > STACK_LIMIT)
      this.meta.stack.splice(0, this.meta.stack.length - STACK_LIMIT);
  }

  pruneReleases(keep) {
    const keepIds = new Set([this.currentId]);
    for (let index = this.meta.stack.length - 1; index >= 0 && keepIds.size < keep; index--)
      keepIds.add(this.meta.stack[index].releaseId);
    let entries;
    try {
      entries = fs.readdirSync(this.paths.releases, { withFileTypes: true });
    } catch {
      return [];
    }
    const removed = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(this.paths.releases, entry.name);
      if (entry.name.startsWith('.staging-')) {
        tryRemoveTree(dir);
        continue;
      }
      if (keepIds.has(entry.name) || !fs.existsSync(path.join(dir, RELEASE_MARKER))) continue;
      if (tryRemoveTree(dir)) removed.push(entry.name);
    }
    return removed;
  }

  async shutdown(reason) {
    this.wantRunning = false;
    clearTimeout(this.restartTimer);
    this.restartTimer = null;
    await this.stopServer(reason);
  }

  async remove(reason) {
    await this.shutdown(reason);
    // a folder the owner made keeps their files: only the host's entries go
    if (this.meta.createdByHost) {
      if (!tryRemoveTree(this.paths.dir)) {
        throw new HostError(
          t('{dir}: could not remove it (a file is in use)', { dir: this.paths.dir }),
          'remove',
        );
      }
      return 'folder';
    }
    for (const target of [
      this.paths.releases,
      this.paths.resources,
      this.paths.serverToml,
      this.paths.current,
      this.paths.tmp,
      this.paths.pidFile,
    ])
      tryRemoveTree(target);
    if (this.meta.envFromTemplate) tryRemoveTree(this.paths.env);
    tryRemoveTree(this.paths.meta);
    return 'entries';
  }
}
