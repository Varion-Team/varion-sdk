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
import { planChange, readReleaseDir, RELEASE_MARKER, verifyReleaseDir } from './release.mjs';
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
  } catch {}
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
      } catch {}
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

  overrides() {
    const keys = [['resourcesDir', 'resources']];
    if (this.meta.preview && this.meta.ports) {
      keys.push(
        ['port', this.meta.ports.port],
        ['httpPort', this.meta.ports.httpPort],
        ['announce', false],
      );
    }
    return keys;
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
    } catch {}
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
      } catch {}
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

  // ---- activation ----

  async activate(targetId, { engine, previousEngine = null }) {
    const previousId = this.currentId;
    const next = this.readRelease(targetId);
    let previous = null;
    if (previousId === targetId) previous = next;
    else if (previousId) {
      try {
        previous = this.readRelease(previousId);
      } catch {
        previous = null;
      }
    }
    const nextToml = this.effectiveToml(targetId);
    this.host.checkPortConflicts(this, readServerSettings(nextToml));
    const previousToml = fs.existsSync(this.paths.serverToml)
      ? readText(this.paths.serverToml)
      : null;
    const plan = planChange(previous, next, previousToml, nextToml);
    try {
      if (previousId === targetId) {
        return await this.switchFull(targetId, {
          revertTo: null,
          engine,
          previousEngine,
          reasons: [t('the active release deployed again')],
        });
      }
      if (!this.isRunning() || plan.full) {
        const reasons = this.isRunning()
          ? plan.reasons
          : [t('the server was not running'), ...plan.reasons];
        return await this.switchFull(targetId, {
          revertTo: previousId && previousId !== targetId ? previousId : null,
          engine,
          previousEngine,
          reasons,
        });
      }
      if (!plan.changed.length) {
        this.writeCurrent(targetId);
        return { mode: 'none', restarted: [], reasons: [t('no resource files changed')] };
      }
      return await this.switchHot(targetId, { previousId, plan, engine, previousEngine });
    } finally {
      this.cleanupTmp();
    }
  }

  async switchFull(targetId, { revertTo, engine, previousEngine, reasons }) {
    this.log.info(
      t('{name}: full restart for release {releaseId} ({reasons})', {
        name: this.name,
        releaseId: targetId,
        reasons: reasons.join('; '),
      }),
      { instance: this.name, releaseId: targetId, reasons },
      'full-restart',
    );
    const tag = `${utcStamp()}-${randomTag()}`;
    const staged = this.tmp(`resources-${tag}`);
    this.linkResources(targetId, staged);
    const toml = this.effectiveToml(targetId);
    await this.stopServer(t('deploy'));
    const backup = this.tmp(`old-resources-${tag}`);
    const hadResources = fs.existsSync(this.paths.resources);
    const oldToml = fs.existsSync(this.paths.serverToml) ? readText(this.paths.serverToml) : null;
    if (hadResources) await renameWithRetry(this.paths.resources, backup);
    await renameWithRetry(staged, this.paths.resources);
    writeFileAtomic(this.paths.serverToml, toml);
    this.writeCurrent(targetId);
    try {
      await this.startServer(engine, t('deploy'));
      return { mode: 'full', restarted: [], reasons };
    } catch (error) {
      if (!revertTo) {
        this.lastError = errorMessage(error);
        this.wantRunning = true;
        this.backoffMs = this.host.options.backoffInitialMs;
        this.scheduleRecover(this.backoffMs);
        throw new HostError(
          t('the server did not start: {reason} (the host keeps trying)', {
            reason: errorMessage(error),
          }),
          'start-failed',
        );
      }
      this.log.warn(
        t('{name}: release {releaseId} did not start ({error}); going back to {previous}', {
          name: this.name,
          releaseId: targetId,
          error: errorMessage(error),
          previous: revertTo,
        }),
        { instance: this.name },
        'revert',
      );
      await this.stopServer(t('rollback'), { graceful: false });
      await renameWithRetry(this.paths.resources, this.tmp(`failed-resources-${tag}`));
      if (hadResources) await renameWithRetry(backup, this.paths.resources);
      else this.linkResources(revertTo, this.paths.resources);
      writeFileAtomic(this.paths.serverToml, oldToml ?? this.effectiveToml(revertTo));
      this.writeCurrent(revertTo);
      try {
        const engineBack =
          previousEngine ||
          (await this.host.engines.ensure(this.readRelease(revertTo).engine, { recheck: false }));
        await this.startServer(engineBack, t('rollback to {releaseId}', { releaseId: revertTo }));
      } catch (again) {
        this.wantRunning = true;
        this.scheduleRecover(this.host.options.backoffInitialMs);
        throw new HostError(
          t(
            'the new release did not start: {error}; the previous release {previous} did not start either: {again}',
            { error: errorMessage(error), previous: revertTo, again: errorMessage(again) },
          ),
          'revert-failed',
        );
      }
      const reverted = new HostError(
        t('the new release did not start: {error}; went back to {previous}', {
          error: errorMessage(error),
          previous: revertTo,
        }),
        'reverted',
      );
      reverted.revertedTo = revertTo;
      throw reverted;
    }
  }

  async switchHot(targetId, { previousId, plan, engine, previousEngine }) {
    const tag = `${utcStamp()}-${randomTag()}`;
    const settings = this.settings();
    const swapped = [];
    const swapBack = async () => {
      for (const item of swapped.reverse()) {
        await renameWithRetry(item.live, this.tmp(`failed-res-${item.name}-${tag}`));
        await renameWithRetry(item.old, item.live);
      }
    };
    try {
      for (const name of plan.changed) {
        const staged = this.tmp(`res-${name}-${tag}`);
        this.linkResources(targetId, staged, name);
        const live = path.join(this.paths.resources, name);
        const old = this.tmp(`old-res-${name}-${tag}`);
        await renameWithRetry(live, old, { attempts: 16, delayMs: 250 });
        try {
          await renameWithRetry(staged, live, { attempts: 16, delayMs: 250 });
        } catch (error) {
          await renameWithRetry(old, live);
          throw error;
        }
        swapped.push({ name, live, old });
      }
    } catch (error) {
      // windows will not rename a folder while a file in it is open
      await swapBack();
      return this.switchFull(targetId, {
        revertTo: previousId,
        engine,
        previousEngine,
        reasons: [
          t('a resource could not be swapped while running: {error}', {
            error: errorMessage(error),
          }),
        ],
      });
    }
    this.writeCurrent(targetId);
    const toRestart = settings.loaded.filter((name) => plan.changed.includes(name));
    const changed = plan.changed.join(', ');
    this.log.info(
      toRestart.length
        ? t('{name}: only resources changed ({changed}); restarting on the fly: {restart}', {
            name: this.name,
            changed,
            restart: toRestart.join(', '),
          })
        : t('{name}: only resources changed ({changed}); none of them is loaded', {
            name: this.name,
            changed,
          }),
      { instance: this.name, releaseId: targetId, changed: plan.changed, restart: toRestart },
      'hot-restart',
    );
    const restarted = [];
    try {
      for (const name of toRestart) {
        const part = await this.proc.consoleCommand(
          'restart',
          name,
          this.host.options.consoleTimeoutMs,
        );
        this.log.info(
          t('{name}: restart {resource}: server part {part}', {
            name: this.name,
            resource: name,
            part,
          }),
          { instance: this.name, resource: name, part },
          'resource-restarted',
        );
        if (part === 'failed') {
          throw new HostError(
            t('resource {resource} did not restart (server part failed)', { resource: name }),
            'restart-failed',
          );
        }
        restarted.push({ name, part });
      }
      return {
        mode: 'hot',
        restarted,
        reasons: [t('only resources changed: {resources}', { resources: changed })],
      };
    } catch (error) {
      this.log.warn(
        t('{name}: {error}; going back to {previous}', {
          name: this.name,
          error: errorMessage(error),
          previous: previousId,
        }),
        { instance: this.name },
        'revert',
      );
      await swapBack();
      this.writeCurrent(previousId);
      try {
        if (!this.isRunning()) throw new HostError(t('the server is not running'), 'server-exit');
        for (const name of toRestart) {
          const part = await this.proc.consoleCommand(
            'restart',
            name,
            this.host.options.consoleTimeoutMs,
          );
          if (part === 'failed') {
            throw new HostError(
              t('resource {resource} of the previous release did not restart either', {
                resource: name,
              }),
              'restart-failed',
            );
          }
        }
      } catch (again) {
        this.log.warn(
          t(
            '{name}: the previous resources cannot be restarted on the fly ({error}); full restart for release {previous}',
            { name: this.name, error: errorMessage(again), previous: previousId },
          ),
          { instance: this.name },
          'revert',
        );
        try {
          const engineBack =
            previousEngine ||
            (await this.host.engines.ensure(this.readRelease(previousId).engine, {
              recheck: false,
            }));
          await this.switchFull(previousId, {
            revertTo: null,
            engine: engineBack,
            reasons: [t('rollback')],
          });
        } catch (fatal) {
          throw new HostError(
            t(
              'the resource restart failed: {error}; going back to {previous} failed too: {again}',
              { error: errorMessage(error), previous: previousId, again: errorMessage(fatal) },
            ),
            'revert-failed',
          );
        }
      }
      const reverted = new HostError(
        t('the resource restart failed: {error}; went back to {previous}', {
          error: errorMessage(error),
          previous: previousId,
        }),
        'reverted',
      );
      reverted.revertedTo = previousId;
      throw reverted;
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
