import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import {
  boxFingerprint,
  isBoxPublicKey,
  newBoxKeys,
  openFile,
  sealedSize,
} from '../shared/box.mjs';
import { EngineStore } from '../shared/engine.mjs';
import { errorMessage } from '../shared/errors.mjs';
import {
  ensureDir,
  readJson,
  sleep,
  tryReadJson,
  tryRemoveTree,
  writeJsonAtomic,
} from '../shared/fs.mjs';
import { isAlive } from '../shared/process.mjs';
import { AssetCache } from './assets.mjs';
import { Cabinet, cabinetAddress, HOST_ID } from './cabinet.mjs';
import { CabinetKeys } from './cabinet-keys.mjs';
import { HostError } from './errors.mjs';
import { Instance } from './instance.mjs';
import { DeployJournal } from './journal.mjs';
import { loadTrust } from './keys.mjs';
import { readHostToken } from './pairing.mjs';
import { hostCommand, hostLayout, isInstanceName } from './paths.mjs';
import { parsePortRange, Ports } from './ports.mjs';
import { NonceStore } from './request.mjs';
import { handleRequest } from './requests.mjs';

const DAY = 24 * 60 * 60 * 1000;

export const DEFAULT_OPTIONS = Object.freeze({
  pollIntervalMs: 5000,
  pollWaitS: 25,
  pollTimeoutMs: 75_000,
  keepReleases: 5,
  previewTtlMs: 7 * DAY,
  readyTimeoutMs: 180_000,
  settleMs: 1500,
  stopTimeoutMs: 30_000,
  consoleTimeoutMs: 90_000,
  backoffInitialMs: 2000,
  backoffMaxMs: 120_000,
  stableAfterMs: 60_000,
  statusIntervalMs: 5000,
  housekeepingIntervalMs: 60_000,
  keysRefreshMs: 10_000,
  keysStaleMs: 5 * 60_000,
});

export function readHostJson(layout) {
  const hostJson = readJson(layout.hostJson, {}) || {};
  if (!hostJson.hostId) {
    hostJson.format = 1;
    hostJson.hostId = crypto.randomUUID();
    writeJsonAtomic(layout.hostJson, hostJson);
  }
  return hostJson;
}

// The key releases are sealed with for this machine. It is made once and stays here: the
// public half goes to the cabinet with every poll, the private half never leaves this file.
function readBoxKeys(layout) {
  const saved = tryReadJson(layout.boxFile, null);
  if (saved && isBoxPublicKey(saved.publicKey) && typeof saved.privateKey === 'string')
    return saved;
  const keys = { format: 1, ...newBoxKeys() };
  writeJsonAtomic(layout.boxFile, keys, { mode: 0o600 });
  return keys;
}

export class Host {
  constructor(options) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.root = path.resolve(options.root);
    this.layout = hostLayout(this.root);
    this.log = options.log;
    this.now = options.now || (() => Date.now());
    this.launcher = options.launcher || ((exe, args) => ({ command: exe, args }));
    this.instances = new Map();
    this.stopping = false;
    this.timers = [];
    this.stopSignal = new Promise((resolve) => {
      this.resolveStop = resolve;
    });
    this.lastPoll = null;
    this.pollFailures = 0;
    this.startedAt = new Date().toISOString();
    this.cabinetKeys = new CabinetKeys({
      fetch: () => this.cabinet.approvedKeys(),
      trustFile: this.layout.trustFile,
      log: this.log,
      options: this.options,
    });
  }

  // ---- start ----

  async init() {
    const { layout } = this;
    this.makeFolders();
    this.takeLock();
    const hostJson = readHostJson(layout);
    this.hostId = this.options.hostId || hostJson.hostId;
    if (!HOST_ID.test(this.hostId)) {
      throw new HostError(
        t('host id "{hostId}" is not valid: 1-64 characters A-Z a-z 0-9 . _ : -', {
          hostId: this.hostId,
        }),
        'usage',
      );
    }
    const paired =
      this.options.token || !this.options.tokenFile ? null : readHostToken(this.options.tokenFile);
    this.serverIds = this.serversFor(hostJson, paired);
    this.ports = new Ports({
      instances: this.instances,
      log: this.log,
      previews:
        this.options.previewPorts ||
        (hostJson.previewPorts ? parsePortRange(hostJson.previewPorts) : null),
    });
    this.nonces = new NonceStore(layout.nonces);
    this.nonces.prune(this.now());
    this.engines = new EngineStore({
      root: layout.engineDir,
      cdn: this.options.engineCdn,
      releaseKey: this.options.releaseKey,
      log: this.log,
    });
    this.assets = new AssetCache({
      dir: layout.assetsDir,
      dropDir: layout.packsDir,
      log: this.log,
      relay: (asset, file, { releaseId }) => this.takeAsset(asset, file, releaseId),
    });
    this.box = readBoxKeys(layout);
    this.cabinet =
      this.options.cabinet ||
      new Cabinet({
        url: this.options.cabinetUrl,
        token: this.options.token || paired?.token,
        hostId: this.hostId,
        boxKey: this.box.publicKey,
      });
    this.journal = new DeployJournal({
      layout,
      log: this.log,
      reportStatus: (status) => this.cabinet.reportStatus(status),
    });
    this.loadInstances();
    this.journal.closeInterrupted();
    this.announceStart();
  }

  makeFolders() {
    const { layout } = this;
    ensureDir(layout.root);
    ensureDir(layout.trustDir, 0o700);
    ensureDir(layout.stateDir, 0o700);
    for (const dir of [
      layout.downloads,
      layout.engineDir,
      layout.assetsDir,
      layout.instancesDir,
      layout.logsDir,
    ])
      ensureDir(dir);
    // what an interrupted run left behind
    for (const name of fs.readdirSync(layout.downloads))
      tryRemoveTree(path.join(layout.downloads, name));
    fs.rmSync(layout.stopRequest, { force: true });
  }

  // The command line names the servers first, then the pairing code, then host.json.
  serversFor(hostJson, paired) {
    if (this.options.serverIds?.length) return this.options.serverIds;
    if (paired?.serverId) return [paired.serverId];
    return Array.isArray(hostJson.serverIds) ? hostJson.serverIds.map(String) : [];
  }

  loadInstances() {
    const dir = this.layout.instancesDir;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || !isInstanceName(entry.name)) continue;
      const instance = Instance.load(this, entry.name);
      if (instance) this.instances.set(entry.name, instance);
    }
  }

  announceStart() {
    const trusted = loadTrust(this.layout.trustFile).length;
    const summary = [
      t(
        'host {hostId} in {root}: cabinet {cabinet}, trusted keys: {keys}, instances: {instances}',
        {
          hostId: this.hostId,
          root: this.root,
          cabinet: this.cabinet.base?.origin || t('(custom)'),
          keys: trusted,
          instances: this.instances.size,
        },
      ),
    ];
    if (this.serverIds.length)
      summary.push(t('servers: {servers}', { servers: this.serverIds.join(', ') }));
    summary.push(
      this.ports.previews
        ? t('previews on ports {ports}', { ports: this.ports.previews.join('-') })
        : t('previews off'),
    );
    this.log.info(
      summary.join(', '),
      { hostId: this.hostId, root: this.root, trusted, instances: this.instances.size },
      'host-start',
    );
    if (!this.serverIds.length) {
      this.log.warn(
        t(
          'no --server-id (the server id in the cabinet): test and prod deploys are refused, only previews for server "preview" are taken',
        ),
      );
    }
  }

  takeLock() {
    const lock = readJson(this.layout.lock, null);
    if (lock?.pid && lock.pid !== process.pid && isAlive(lock.pid)) {
      const status = readJson(this.layout.status, null);
      const fresh =
        status?.pid === lock.pid && Date.now() - Date.parse(status.heartbeatAt || 0) < 60_000;
      if (fresh) {
        throw new HostError(
          t(
            'a host is already running in this folder (pid {pid}); stop it first: varion host stop',
            {
              pid: lock.pid,
            },
          ),
          'locked',
        );
      }
    }
    writeJsonAtomic(this.layout.lock, { pid: process.pid, startedAt: this.startedAt });
  }

  async bootInstances() {
    for (const instance of this.instances.values()) {
      if (this.stopping) break;
      await instance.exclusive(() => instance.boot());
    }
  }

  startTimers() {
    let lastStatus = 0;
    let lastHousekeeping = Date.now();
    const tick = setInterval(() => {
      if (fs.existsSync(this.layout.stopRequest)) {
        this.log.info(t('asked to stop (varion host stop)'), {}, 'stop-request');
        this.requestStop();
      }
      const now = Date.now();
      if (now - lastStatus >= this.options.statusIntervalMs) {
        lastStatus = now;
        this.writeStatus();
      }
      if (now - lastHousekeeping >= this.options.housekeepingIntervalMs) {
        lastHousekeeping = now;
        this.housekeeping().catch((error) =>
          this.log.error(t('housekeeping failed: {error}', { error: errorMessage(error) })),
        );
      }
    }, 1000);
    this.timers.push(tick);
  }

  async housekeeping() {
    if (this.stopping) return;
    this.nonces.prune(this.now());
    await this.expirePreviews();
    await this.journal.sendUnsent();
  }

  // ---- loop ----

  async run() {
    await this.init();
    this.startTimers();
    this.writeStatus();
    await this.bootInstances();
    this.writeStatus();
    await this.cabinetKeys.refresh();
    while (!this.stopping) {
      const started = Date.now();
      let items = [];
      let failed = false;
      let retryNow = false;
      let pollAfterMs = null;
      try {
        const poll = this.cabinet.poll(this.instanceSummaries(), {
          wait: this.options.pollWaitS,
          timeoutMs: this.options.pollTimeoutMs,
        });
        // the stop signal may win the race; the poll must not reject unhandled then
        poll.catch(() => {});
        const answer = await Promise.race([poll, this.stopSignal.then(() => null)]);
        if (answer === null) break;
        items = answer.items;
        pollAfterMs = answer.pollAfterMs;
        this.noteCabinetServer(answer.serverId);
        if (this.pollFailures) this.log.info(t('the cabinet answers again'), {}, 'poll-ok');
        this.pollFailures = 0;
        this.lastPoll = { at: new Date().toISOString(), ok: true, items: items.length };
      } catch (error) {
        failed = true;
        this.pollFailures++;
        this.lastPoll = { at: new Date().toISOString(), ok: false, error: errorMessage(error) };
        const refused =
          (error?.status === 401 || error?.status === 403) && !!this.options.tokenFile;
        if (refused && this.reloadToken()) {
          retryNow = true;
        } else if (this.pollFailures === 1 || this.pollFailures % 20 === 0) {
          const params = { error: errorMessage(error), command: hostCommand(this.root, 'pair') };
          this.log.warn(
            refused
              ? t(
                  'the cabinet refuses the host token ({error}); if this machine was disconnected in the cabinet, connect it again: {command}',
                  params,
                )
              : t('cabinet poll failed ({error}); retrying', params),
            { failures: this.pollFailures },
            'poll-failed',
          );
        }
      }
      if (!failed && !this.stopping) await this.cabinetKeys.refresh();
      for (const item of items) {
        if (this.stopping) break;
        await handleRequest(this, item);
        this.writeStatus();
      }
      if (this.stopping) break;
      await this.journal.sendUnsent();
      const elapsed = Date.now() - started;
      const interval =
        pollAfterMs === null
          ? this.options.pollIntervalMs
          : Math.min(60_000, Math.max(1000, pollAfterMs));
      // a long poll already waited part of the interval
      const wait = retryNow
        ? 0
        : failed
          ? Math.min(60_000, 2000 * 2 ** Math.min(this.pollFailures - 1, 5))
          : items.length
            ? 0
            : Math.max(0, interval - elapsed);
      if (wait) await Promise.race([sleep(wait), this.stopSignal]);
    }
    await this.shutdown();
  }

  // the cabinet's word: shown as a hint, never trusted
  noteCabinetServer(serverId) {
    if (!serverId || serverId === this.cabinetServerId) return;
    this.cabinetServerId = serverId;
    if (!this.serverIds.length) {
      this.log.warn(
        t(
          'the cabinet says the host token belongs to server {serverId}; the host does not take its word for it: to accept test and prod deploys, run with --server-id {serverId}',
          { serverId },
        ),
        { cabinetServerId: serverId },
        'server-id-hint',
      );
    } else if (!this.serverIds.includes(serverId)) {
      this.log.warn(
        t(
          'the cabinet says the host token belongs to server {serverId}, but the host runs with --server-id {serverIds}: check the token',
          { serverId, serverIds: this.serverIds.join(', ') },
        ),
        { cabinetServerId: serverId },
        'server-id-mismatch',
      );
    }
  }

  // varion host pair may have saved a new token while this host runs
  reloadToken() {
    if (this.options.token || !this.options.tokenFile || !this.cabinet.base) return false;
    let saved;
    try {
      saved = readHostToken(this.options.tokenFile);
      if (!saved || saved.token === this.cabinet.token) return false;
      if (cabinetAddress(saved.cabinet) !== cabinetAddress(this.cabinet.base)) return false;
    } catch {
      return false;
    }
    this.cabinet.token = saved.token;
    if (!this.options.serverIds?.length && saved.serverId) this.serverIds = [saved.serverId];
    this.cabinetKeys.forget();
    this.log.info(
      t('picked up the new host token from {file}', { file: this.options.tokenFile }),
      { serverId: saved.serverId },
      'token-reloaded',
    );
    return true;
  }

  // ---- trust ----

  trustedKeys() {
    return [...loadTrust(this.layout.trustFile), ...this.cabinetKeys.keys];
  }

  requestStop() {
    if (this.stopping) return;
    this.stopping = true;
    this.resolveStop();
  }

  async shutdown() {
    if (this.shutdownDone) return this.shutdownDone;
    this.stopping = true;
    this.resolveStop();
    this.shutdownDone = (async () => {
      for (const timer of this.timers) clearInterval(timer);
      this.log.info(t('stopping the servers'), {}, 'host-stopping');
      await Promise.all(
        [...this.instances.values()].map((instance) =>
          instance
            .exclusive(() => instance.shutdown(t('the host is stopping')))
            .catch((error) => this.log.error(`${instance.name}: ${errorMessage(error)}`)),
        ),
      );
      this.writeStatus({ stopped: true });
      fs.rmSync(this.layout.lock, { force: true });
      fs.rmSync(this.layout.stopRequest, { force: true });
      this.log.info(t('the host stopped'), {}, 'host-stopped');
    })();
    return this.shutdownDone;
  }

  async expirePreviews() {
    for (const instance of [...this.instances.values()]) {
      if (!instance.meta.preview || this.stopping) continue;
      const lastDeployAt = instance.meta.lastDeployAt || instance.meta.createdAt;
      if (!(this.now() - Date.parse(lastDeployAt) >= this.options.previewTtlMs)) continue;
      this.log.info(
        t('{instance}: the preview expired (last deploy {time}); stopping and removing it', {
          instance: instance.name,
          time: lastDeployAt,
        }),
        { instance: instance.name },
        'preview-expired',
      );
      try {
        const how = await instance.exclusive(() => instance.remove(t('the preview expired')));
        this.instances.delete(instance.name);
        this.log.info(
          how === 'folder'
            ? t('{instance}: removed (the whole folder: the host made it)', {
                instance: instance.name,
              })
            : t('{instance}: removed (only what the host made)', { instance: instance.name }),
          { instance: instance.name, how },
          'preview-removed',
        );
      } catch (error) {
        this.log.error(
          t('{instance}: could not remove it ({error})', {
            instance: instance.name,
            error: errorMessage(error),
          }),
          { instance: instance.name },
          'preview-remove-failed',
        );
      }
    }
    this.writeStatus();
  }

  // ---- reporting ----

  // A pack with no address of its own: the developer who is deploying sends it sealed for this
  // machine, the cabinet hands it on. Resolves the SHA-256 and the size of the pack itself.
  async takeAsset(asset, file, releaseId) {
    const taken = `${file}.sealed`;
    try {
      try {
        await this.cabinet.downloadAsset(releaseId, asset.sha256, taken, {
          maxBytes: sealedSize(asset.size),
        });
      } catch (error) {
        throw new HostError(
          t(
            'asset {name}: it was not sent ({error}). It has to be on the computer that deploys, or put the file into {dir} on this machine and deploy again',
            { name: asset.name, error: errorMessage(error), dir: this.layout.packsDir },
          ),
          'asset-not-sent',
        );
      }
      return await openFile(taken, file, this.box.privateKey);
    } finally {
      fs.rmSync(taken, { force: true });
    }
  }

  instanceSummaries() {
    return [...this.instances.values()].map((instance) => instance.summary());
  }

  writeStatus({ stopped = false } = {}) {
    try {
      writeJsonAtomic(this.layout.status, {
        format: 1,
        pid: process.pid,
        hostId: this.hostId,
        // what a developer compares with the key their deploy names
        boxKey: this.box ? boxFingerprint(this.box.publicKey) : null,
        root: this.root,
        startedAt: this.startedAt,
        heartbeatAt: new Date().toISOString(),
        stopped,
        cabinet: this.cabinet?.base?.origin || null,
        serverIds: this.serverIds || [],
        previewPorts: this.ports?.previews ? this.ports.previews.join('-') : null,
        lastPoll: this.lastPoll,
        busy: this.journal?.current ?? null,
        outbox: this.journal?.unsentCount || 0,
        cabinetKeys: this.cabinetKeys.keys.map(({ name, publicKey }) => ({ name, publicKey })),
        instances: this.instanceSummaries(),
      });
    } catch {
      // the status file only feeds `varion host status`
    }
  }
}
