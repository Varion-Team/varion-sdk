import crypto from 'node:crypto';
import dgram from 'node:dgram';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { EngineStore } from '../shared/engine.mjs';
import { errorMessage } from '../shared/errors.mjs';
import { formatBytes } from '../shared/format.mjs';
import {
  ensureDir,
  randomTag,
  readJson,
  renameWithRetry,
  sleep,
  tryRemoveTree,
  writeJsonAtomic,
} from '../shared/fs.mjs';
import { isAlive } from '../shared/process.mjs';
import { AssetCache } from './assets.mjs';
import { Cabinet, cabinetAddress, HOST_ID, isPermanentRefusal } from './cabinet.mjs';
import { HostError, RequestRejected } from './errors.mjs';
import { Instance } from './instance.mjs';
import { loadTrust } from './keys.mjs';
import { readHostToken } from './pairing.mjs';
import { hostCommand, hostLayout, instanceNameFor, isInstanceName } from './paths.mjs';
import { LIMITS, RELEASE_MARKER, unpackBundle, verifyReleaseDir } from './release.mjs';
import { NonceStore, PREVIEW_SERVER, verifySignedRequest } from './request.mjs';

const FINAL = new Set(['active', 'failed', 'rolled-back']);
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

export function parsePortRange(text) {
  const match = /^(\d{1,5})-(\d{1,5})$/.exec(String(text || '').trim());
  const from = match ? Number(match[1]) : NaN;
  const to = match ? Number(match[2]) : NaN;
  if (!match || from < 1024 || to > 65535 || to - from < 1) {
    throw new HostError(
      t(
        '--preview-ports: expected a range like 7962-7999 (each preview takes a game port and the next one for HTTP)',
      ),
      'usage',
    );
  }
  return [from, to];
}

function udpFree(port) {
  return new Promise((resolve) => {
    const socket = dgram.createSocket('udp4');
    socket.once('error', () => {
      socket.close();
      resolve(false);
    });
    socket.bind(port, '127.0.0.1', () => socket.close(() => resolve(true)));
  });
}

function tcpFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.listen({ port, host: '127.0.0.1', exclusive: true }, () =>
      server.close(() => resolve(true)),
    );
  });
}

function restartText(result) {
  if (result.mode === 'hot') {
    const names = result.restarted.map((item) => item.name).join(', ');
    return t('resources restarted: {resources}', { resources: names || '-' });
  }
  return result.mode === 'full' ? t('full restart') : t('no restart');
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
    this.busy = null;
    this.cabinetKeys = { keys: [], state: '', checkedAt: 0, fetchedAt: 0, skipped: 0 };
    this.untrustedWarned = false;
  }

  // ---- start ----

  async init() {
    const { layout } = this;
    ensureDir(layout.root);
    ensureDir(layout.trustDir, 0o700);
    ensureDir(layout.stateDir, 0o700);
    ensureDir(layout.downloads);
    ensureDir(layout.engineDir);
    ensureDir(layout.assetsDir);
    ensureDir(layout.instancesDir);
    ensureDir(layout.logsDir);
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
    // the owner bound this machine to the server by entering its code
    const pairedServer = paired?.serverId ? [paired.serverId] : null;
    this.serverIds = this.options.serverIds?.length
      ? this.options.serverIds
      : pairedServer || (Array.isArray(hostJson.serverIds) ? hostJson.serverIds.map(String) : []);
    this.previewPorts =
      this.options.previewPorts ||
      (hostJson.previewPorts ? parsePortRange(hostJson.previewPorts) : null);
    this.nonces = new NonceStore(layout.nonces);
    this.nonces.prune(this.now());
    this.deploys = readJson(layout.deploys, { format: 1, deploys: {} });
    this.outbox = readJson(layout.outbox, { format: 1, statuses: [] });
    this.engines = new EngineStore({
      root: layout.engineDir,
      cdn: this.options.engineCdn,
      releaseKey: this.options.releaseKey,
      log: this.log,
    });
    this.assets = new AssetCache({ dir: layout.assetsDir, log: this.log });
    this.cabinet =
      this.options.cabinet ||
      new Cabinet({
        url: this.options.cabinetUrl,
        token: this.options.token || paired?.token,
        hostId: this.hostId,
      });
    for (const name of fs.readdirSync(layout.downloads))
      tryRemoveTree(path.join(layout.downloads, name));
    fs.rmSync(layout.stopRequest, { force: true });
    for (const entry of fs.readdirSync(layout.instancesDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || !isInstanceName(entry.name)) continue;
      const instance = Instance.load(this, entry.name);
      if (instance) this.instances.set(entry.name, instance);
    }
    this.closeInterruptedDeploys();
    const trusted = loadTrust(layout.trustFile);
    const summary = [
      t(
        'host {hostId} in {root}: cabinet {cabinet}, trusted keys: {keys}, instances: {instances}',
        {
          hostId: this.hostId,
          root: this.root,
          cabinet: this.cabinet.base?.origin || t('(custom)'),
          keys: trusted.length,
          instances: this.instances.size,
        },
      ),
    ];
    if (this.serverIds.length)
      summary.push(t('servers: {servers}', { servers: this.serverIds.join(', ') }));
    summary.push(
      this.previewPorts
        ? t('previews on ports {ports}', { ports: this.previewPorts.join('-') })
        : t('previews off'),
    );
    this.log.info(
      summary.join(', '),
      {
        hostId: this.hostId,
        root: this.root,
        trusted: trusted.length,
        instances: this.instances.size,
      },
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

  closeInterruptedDeploys() {
    for (const [deployId, record] of Object.entries(this.deploys.deploys)) {
      if (FINAL.has(record.phase)) continue;
      const name = this.safeInstanceName(record);
      const currentFile = path.join(this.layout.instancesDir, name, 'current');
      const current =
        name && fs.existsSync(currentFile) ? fs.readFileSync(currentFile, 'utf8').trim() : '';
      const error = current
        ? t('the host restarted during the deploy (phase {phase}); {releaseId} is active', {
            phase: record.phase,
            releaseId: current,
          })
        : t('the host restarted during the deploy (phase {phase})', { phase: record.phase });
      Object.assign(record, { phase: 'failed', error, at: new Date().toISOString() });
      this.outbox.statuses = this.outbox.statuses
        .filter((item) => item.deployId !== deployId)
        .concat([{ deployId, phase: 'failed', error }]);
      this.log.warn(
        t('deploy {deployId}: {error}', { deployId, error }),
        { deployId },
        'deploy-interrupted',
      );
    }
    writeJsonAtomic(this.layout.deploys, this.deploys);
    writeJsonAtomic(this.layout.outbox, this.outbox);
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
    await this.flushOutbox();
  }

  // ---- loop ----

  async run() {
    await this.init();
    this.startTimers();
    this.writeStatus();
    await this.bootInstances();
    this.writeStatus();
    await this.refreshCabinetKeys();
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
      if (!failed && !this.stopping) await this.refreshCabinetKeys();
      for (const item of items) {
        if (this.stopping) break;
        await this.handle(item);
        this.writeStatus();
      }
      if (this.stopping) break;
      await this.flushOutbox();
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
    this.cabinetKeys.checkedAt = 0;
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

  async refreshCabinetKeys() {
    const known = this.cabinetKeys;
    const now = Date.now();
    if (now - known.checkedAt < this.options.keysRefreshMs) return;
    known.checkedAt = now;
    let fetched;
    try {
      fetched = await this.cabinet.approvedKeys();
    } catch (error) {
      this.cabinetKeysFailed(error, now);
      return;
    }
    known.fetchedAt = now;
    this.useCabinetKeys(fetched.keys, 'ok');
    if (fetched.skipped && fetched.skipped !== known.skipped) {
      this.log.warn(
        t('the cabinet sent {count} keys that are not Ed25519 public keys; they are not trusted', {
          count: fetched.skipped,
        }),
        {},
        'cabinet-keys-skipped',
      );
    }
    known.skipped = fetched.skipped;
  }

  cabinetKeysFailed(error, now) {
    const known = this.cabinetKeys;
    if (error?.status === 404) {
      if (known.state !== 'unsupported') {
        this.log.info(
          t('the cabinet hands out no approved keys: only the keys trusted here count'),
          {},
          'cabinet-keys',
        );
      }
      this.useCabinetKeys([], 'unsupported');
      return;
    }
    // a key revoked in the cabinet must not stay trusted for long while the cabinet is away
    const lost = isPermanentRefusal(error) || now - known.fetchedAt > this.options.keysStaleMs;
    const state = lost ? 'lost' : 'stale';
    if (known.state !== state) {
      const params = { error: errorMessage(error) };
      this.log.warn(
        lost
          ? t(
              'the keys approved in the cabinet are not trusted until the cabinet hands them out again ({error})',
              params,
            )
          : t(
              'could not refresh the keys approved in the cabinet ({error}); the last list stays for a few minutes',
              params,
            ),
        {},
        'cabinet-keys-failed',
      );
    }
    if (lost) this.useCabinetKeys([], state);
    else known.state = state;
  }

  useCabinetKeys(keys, state) {
    const known = this.cabinetKeys;
    const list = (entries) =>
      entries
        .map((entry) => entry.publicKey)
        .sort()
        .join();
    const announce = state === 'ok' && (list(keys) !== list(known.keys) || known.state !== 'ok');
    known.keys = keys;
    known.state = state;
    if (announce) {
      this.log.info(
        keys.length
          ? t('keys approved in the cabinet: {count} ({names})', {
              count: keys.length,
              names: keys.map((entry) => entry.name).join(', '),
            })
          : t('no keys are approved in the cabinet for this server'),
        { keys: keys.map(({ name, publicKey, accountId }) => ({ name, publicKey, accountId })) },
        'cabinet-keys',
      );
    }
    let none = false;
    try {
      none = !keys.length && !loadTrust(this.layout.trustFile).length;
    } catch {}
    if (none && !this.untrustedWarned) {
      this.log.warn(
        t(
          'no trusted keys: every deploy request will be refused (approve a developer key for this server in the cabinet, or add one with varion host trust <key>)',
        ),
      );
    }
    this.untrustedWarned = none;
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

  // ---- requests ----

  async handle(item) {
    const deployId = item.deployId;
    const known = deployId ? this.deploys.deploys[deployId] : null;
    // handed over again after a lost answer: say again how it ended
    if (known && known.signature === item.signature && FINAL.has(known.phase)) {
      await this.report(deployId, known.phase, {
        error: known.error,
        port: known.port,
        final: true,
      });
      return;
    }
    let verified;
    try {
      verified = verifySignedRequest(item, { trusted: this.trustedKeys(), now: this.now() });
      const used = this.nonces.get(verified.request.nonce);
      if (used) {
        if (deployId && used.deployId === deployId && known) {
          await this.report(deployId, known.phase, {
            error: known.error,
            port: known.port,
            final: FINAL.has(known.phase),
          });
          return;
        }
        throw new RequestRejected(t('replayed request: its nonce was already used'), 'replay');
      }
      this.checkScope(verified.request);
      this.checkSignerRights(verified.signer, verified.request);
      this.nonces.add(verified.request.nonce, {
        issuedAt: verified.issuedAtMs,
        deployId,
        seenAt: this.now(),
      });
    } catch (error) {
      const reason = errorMessage(error);
      this.log.warn(
        deployId
          ? t('request {deployId} refused: {error}', { deployId, error: reason })
          : t('request without a deployId refused: {error}', { error: reason }),
        { deployId, code: error.code },
        'request-rejected',
      );
      if (deployId)
        await this.finish(deployId, 'failed', { error: reason, signature: item.signature });
      return;
    }
    const { request, signer } = verified;
    this.log.info(
      t('request {deployId}: {action} {releaseId} for {project}/{env} (key "{key}")', {
        deployId,
        action: request.action,
        releaseId: request.releaseId,
        project: request.project,
        env: request.env,
        key: signer.name,
      }),
      { deployId, ...request, signer: signer.name },
      'request-accepted',
    );
    this.record(deployId, {
      phase: 'accepted',
      signature: item.signature,
      nonce: request.nonce,
      action: request.action,
      releaseId: request.releaseId,
      project: request.project,
      env: request.env,
      serverId: request.serverId,
    });
    this.busy = {
      deployId,
      action: request.action,
      releaseId: request.releaseId,
      since: new Date().toISOString(),
    };
    try {
      const outcome =
        request.action === 'activate'
          ? await this.activateRequest(deployId, request)
          : await this.rollbackRequest(deployId, request);
      await this.finish(deployId, outcome.phase, { port: outcome.port, signature: item.signature });
    } catch (error) {
      const phase = request.action === 'activate' && error.revertedTo ? 'rolled-back' : 'failed';
      this.log.error(
        t('deploy {deployId}: {error}', { deployId, error: errorMessage(error) }),
        { deployId, code: error.code, phase },
        'deploy-failed',
      );
      const instance = this.instances.get(this.safeInstanceName(request));
      await this.finish(deployId, phase, {
        error: errorMessage(error),
        port: instance?.ports()?.port,
        signature: item.signature,
      });
    } finally {
      this.busy = null;
    }
  }

  safeInstanceName(request) {
    try {
      return instanceNameFor(request.project, request.env);
    } catch {
      return '';
    }
  }

  // a key the cabinet approved deploys only where its account may
  checkSignerRights(signer, request) {
    if (!signer.rights) return;
    const prod = request.env === 'prod';
    if (prod ? signer.rights.prod : signer.rights.test) return;
    throw new RequestRejected(
      prod
        ? t('key "{name}" may not deploy to prod on this server', { name: signer.name })
        : t('key "{name}" may not deploy to test and previews on this server', {
            name: signer.name,
          }),
      'key-rights',
    );
  }

  // test and prod only for this host's own --server-id, never on the cabinet's word
  checkScope(request) {
    const { env, serverId } = request;
    const own = this.serverIds.includes(serverId);
    const serverIds = this.serverIds.join(', ');
    if (env.startsWith('preview-')) {
      if (!this.previewPorts) {
        throw new RequestRejected(
          t('previews are off on this host (no --preview-ports)'),
          'previews-off',
        );
      }
      if (serverId === PREVIEW_SERVER || own) return;
      throw new RequestRejected(
        serverIds
          ? t('the request is for server {serverId}, this host serves {serverIds}', {
              serverId,
              serverIds,
            })
          : t('the preview is for server {serverId}, this host has no --server-id', { serverId }),
        'wrong-server',
      );
    }
    if (!serverIds) {
      throw new RequestRejected(
        t(
          'this host has no --server-id: {env} deploys are refused (the request is for server {serverId})',
          { env, serverId },
        ),
        'no-server-id',
      );
    }
    if (!own) {
      throw new RequestRejected(
        t('the request is for server {serverId}, this host serves {serverIds}', {
          serverId,
          serverIds,
        }),
        'wrong-server',
      );
    }
  }

  instanceFor(request) {
    const name = instanceNameFor(request.project, request.env);
    const instance = this.instances.get(name);
    // a preview may name its server "preview" or by id: the same instance either way
    const otherServer =
      instance && !instance.meta.preview && instance.meta.serverId !== request.serverId;
    if (instance && (otherServer || instance.meta.project !== request.project)) {
      throw new HostError(
        t('instance {name} belongs to {project} on server {serverId}', {
          name,
          project: instance.meta.project,
          serverId: instance.meta.serverId,
        }),
        'wrong-instance',
      );
    }
    return { name, instance };
  }

  async activateRequest(deployId, request) {
    const { name, instance: existing } = this.instanceFor(request);
    let instance = existing;
    let created = false;
    if (!instance) {
      const preview = request.env.startsWith('preview-');
      const ports = preview ? await this.allocatePreviewPorts() : null;
      instance = Instance.create(this, {
        name,
        project: request.project,
        env: request.env,
        serverId: request.serverId,
        preview,
        ports,
      });
      this.instances.set(name, instance);
      created = true;
      this.log.info(
        ports
          ? t('instance {name} created (ports {port}/{httpPort})', {
              name,
              port: ports.port,
              httpPort: ports.httpPort,
            })
          : t('instance {name} created', { name }),
        { instance: name, ports },
        'instance-created',
      );
    }
    try {
      return await this.activateOn(instance, deployId, request);
    } catch (error) {
      // a first deploy that never got a release leaves no instance behind
      if (created && !instance.currentId) {
        await instance
          .exclusive(() => instance.remove(t('the first deploy failed')))
          .catch(() => {});
        this.instances.delete(name);
      }
      throw error;
    }
  }

  async activateOn(instance, deployId, request) {
    const { name } = instance;
    return instance.exclusive(async () => {
      await this.obtainRelease(instance, request.releaseId, request.sha256, deployId);
      const release = instance.readRelease(request.releaseId);
      const engine = await this.engines.ensure(release.engine, { recheck: true });
      await this.progress(deployId, 'activating', instance);
      const result = await instance.activate(request.releaseId, { engine });
      instance.pushStack({
        releaseId: request.releaseId,
        sha256: request.sha256,
        action: 'activate',
        deployId,
        at: new Date(this.now()).toISOString(),
      });
      instance.meta.lastDeployAt = new Date(this.now()).toISOString();
      instance.saveMeta();
      const pruned = instance.pruneReleases(this.options.keepReleases);
      const params = { instance: name, releaseId: request.releaseId, how: restartText(result) };
      this.log.info(
        pruned.length
          ? t('{instance}: release {releaseId} is active ({how}); old releases removed: {pruned}', {
              ...params,
              pruned: pruned.join(', '),
            })
          : t('{instance}: release {releaseId} is active ({how})', params),
        {
          deployId,
          instance: name,
          releaseId: request.releaseId,
          mode: result.mode,
          restarted: result.restarted,
          reasons: result.reasons,
          pruned,
        },
        'deploy-active',
      );
      return { phase: 'active', port: instance.ports()?.port };
    });
  }

  async rollbackRequest(deployId, request) {
    const { name, instance } = this.instanceFor(request);
    if (!instance) {
      throw new HostError(
        t('there is no instance {name} on this host: nothing to roll back', { name }),
        'no-instance',
      );
    }
    return instance.exclusive(async () => {
      // only the active release rolls back, one step down the stack each time
      const stack = instance.meta.stack;
      const top = stack[stack.length - 1];
      const current = instance.currentId;
      if (!top || top.releaseId !== current) {
        throw new HostError(t('rollback: {name} has no deploy history', { name }), 'no-history');
      }
      if (request.releaseId !== current) {
        throw new HostError(
          t(
            'rollback: the request rolls back {releaseId}, but {current} is active on {name}; only the active release can be rolled back',
            { releaseId: request.releaseId, current, name },
          ),
          'rollback-not-current',
        );
      }
      if (request.sha256 !== top.sha256) {
        throw new HostError(
          t('rollback: the SHA-256 in the request does not match the active release'),
          'rollback-mismatch',
        );
      }
      const index = stack.length - 2;
      if (index < 0) {
        throw new HostError(
          t('rollback: nothing was active on {name} before {current}', { name, current }),
          'no-previous',
        );
      }
      const target = stack[index];
      await this.obtainRelease(instance, target.releaseId, target.sha256, deployId);
      const release = instance.readRelease(target.releaseId);
      const engine = await this.engines.ensure(release.engine, { recheck: true });
      await this.progress(deployId, 'activating', instance);
      const result = await instance.activate(target.releaseId, { engine });
      instance.meta.stack = stack.slice(0, index + 1);
      instance.meta.lastDeployAt = new Date(this.now()).toISOString();
      instance.saveMeta();
      this.log.info(
        t('{instance}: rolled back from {from} to {releaseId} ({how})', {
          instance: name,
          from: top.releaseId,
          releaseId: target.releaseId,
          how: restartText(result),
        }),
        {
          deployId,
          instance: name,
          from: top.releaseId,
          releaseId: target.releaseId,
          mode: result.mode,
          restarted: result.restarted,
        },
        'deploy-rolled-back',
      );
      return { phase: 'rolled-back', port: instance.ports()?.port };
    });
  }

  async obtainRelease(instance, releaseId, sha256, deployId) {
    const dir = instance.releaseDir(releaseId);
    if (fs.existsSync(dir)) {
      const marker = instance.releaseMarker(releaseId);
      if (marker?.zipSha256 === sha256) {
        await this.progress(deployId, 'verifying', instance);
        try {
          await verifyReleaseDir(dir, instance.readRelease(releaseId));
          this.log.info(
            t('{instance}: release {releaseId} is already on disk and matches', {
              instance: instance.name,
              releaseId,
            }),
            { instance: instance.name, releaseId },
            'release-cached',
          );
          return;
        } catch (error) {
          this.log.warn(
            t(
              '{instance}: the copy of release {releaseId} does not match ({error}); downloading it again',
              { instance: instance.name, releaseId, error: errorMessage(error) },
            ),
            { instance: instance.name },
            'release-damaged',
          );
        }
      }
      const aside = path.join(instance.paths.releases, `.staging-replaced-${randomTag()}`);
      await renameWithRetry(dir, aside);
      tryRemoveTree(aside);
    }
    await this.progress(deployId, 'downloading', instance);
    ensureDir(this.layout.downloads);
    const zipFile = path.join(this.layout.downloads, `${releaseId}-${randomTag()}.zip`);
    const staging = path.join(instance.paths.releases, `.staging-${releaseId}-${randomTag()}`);
    try {
      const downloaded = await this.cabinet.downloadRelease(releaseId, zipFile, {
        maxBytes: LIMITS.bundleBytes,
      });
      if (downloaded.sha256 !== sha256) {
        throw new HostError(
          t('the bundle SHA-256 ({found}...) does not match the signed one ({expected}...)', {
            found: downloaded.sha256.slice(0, 12),
            expected: sha256.slice(0, 12),
          }),
          'zip-hash',
        );
      }
      await this.progress(deployId, 'verifying', instance);
      const release = await unpackBundle(zipFile, staging, {
        project: instance.meta.project,
        env: instance.meta.env,
        releaseId,
      });
      const placed = await this.assets.place(staging, release);
      writeJsonAtomic(path.join(staging, RELEASE_MARKER), {
        zipSha256: sha256,
        size: downloaded.size,
        verifiedAt: new Date().toISOString(),
      });
      await renameWithRetry(staging, dir);
      const params = {
        instance: instance.name,
        releaseId,
        size: formatBytes(downloaded.size),
        files: release.files.size,
        engine: release.engine.version,
      };
      this.log.info(
        release.assets.length
          ? t(
              '{instance}: release {releaseId} verified (bundle {size}, files: {files}, assets: {assets}, downloaded: {downloaded}, engine {engine})',
              { ...params, assets: placed.placed, downloaded: placed.downloaded },
            )
          : t(
              '{instance}: release {releaseId} verified (bundle {size}, files: {files}, engine {engine})',
              params,
            ),
        {
          instance: instance.name,
          releaseId,
          size: downloaded.size,
          files: release.files.size,
          assets: release.assets.length,
        },
        'release-verified',
      );
    } catch (error) {
      tryRemoveTree(staging);
      throw error;
    } finally {
      fs.rmSync(zipFile, { force: true });
    }
  }

  async allocatePreviewPorts() {
    const [from, to] = this.previewPorts;
    const used = new Set();
    for (const instance of this.instances.values()) {
      const ports = instance.ports();
      if (ports) {
        used.add(ports.port);
        used.add(ports.httpPort);
      }
    }
    for (let port = from; port + 1 <= to; port += 2) {
      if (used.has(port) || used.has(port + 1)) continue;
      if ((await udpFree(port)) && (await tcpFree(port + 1))) return { port, httpPort: port + 1 };
    }
    throw new HostError(t('no free preview ports in {from}-{to}', { from, to }), 'no-ports');
  }

  checkPortConflicts(instance, settings) {
    const mine = new Set([settings.port, settings.httpPort]);
    for (const other of this.instances.values()) {
      if (other === instance) continue;
      const ports = other.ports();
      if (!ports || !other.currentId) continue;
      for (const port of [ports.port, ports.httpPort]) {
        if (mine.has(port)) {
          throw new HostError(
            t('port {port} is already taken by instance {name} of this host', {
              port,
              name: other.name,
            }),
            'port-conflict',
          );
        }
      }
    }
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

  record(deployId, fields) {
    if (!deployId) return;
    const deploys = this.deploys.deploys;
    deploys[deployId] = { ...(deploys[deployId] || {}), ...fields, at: new Date().toISOString() };
    const ids = Object.keys(deploys);
    if (ids.length > 500) for (const id of ids.slice(0, ids.length - 500)) delete deploys[id];
    writeJsonAtomic(this.layout.deploys, this.deploys);
  }

  async progress(deployId, phase, instance) {
    if (!deployId) return;
    this.record(deployId, { phase });
    await this.report(deployId, phase, { port: instance?.ports()?.port });
  }

  async finish(deployId, phase, { error, port, signature }) {
    this.record(deployId, {
      phase,
      error: error || undefined,
      port: port ?? undefined,
      ...(signature ? { signature } : {}),
    });
    await this.report(deployId, phase, { error, port, final: true });
  }

  async report(deployId, phase, { error, port, final = false } = {}) {
    const status = {
      deployId,
      phase,
      ...(error ? { error } : {}),
      ...(Number.isInteger(port) ? { port } : {}),
    };
    let line = t('status {deployId}: {phase}', { deployId, phase });
    if (error) line += ` - ${error}`;
    if (Number.isInteger(port)) line += ` (${t('port {port}', { port })})`;
    this.log.info(line, { ...status }, 'status');
    try {
      await this.cabinet.reportStatus(status);
    } catch (problem) {
      if (!final) return;
      if (isPermanentRefusal(problem)) {
        this.log.warn(
          t('the cabinet refused the status of {deployId} ({error})', {
            deployId,
            error: errorMessage(problem),
          }),
          { deployId },
          'status-refused',
        );
        return;
      }
      this.outbox.statuses = this.outbox.statuses
        .filter((item) => item.deployId !== deployId)
        .concat([status])
        .slice(-200);
      writeJsonAtomic(this.layout.outbox, this.outbox);
      this.log.warn(
        t('the status of {deployId} did not reach the cabinet ({error}); will send it later', {
          deployId,
          error: errorMessage(problem),
        }),
        { deployId },
        'status-queued',
      );
    }
  }

  async flushOutbox() {
    if (!this.outbox.statuses.length) return;
    const left = [];
    for (const status of this.outbox.statuses) {
      try {
        await this.cabinet.reportStatus(status);
      } catch (problem) {
        if (!isPermanentRefusal(problem)) left.push(status);
      }
    }
    if (left.length !== this.outbox.statuses.length) {
      this.outbox.statuses = left;
      writeJsonAtomic(this.layout.outbox, this.outbox);
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
        root: this.root,
        startedAt: this.startedAt,
        heartbeatAt: new Date().toISOString(),
        stopped,
        cabinet: this.cabinet?.base?.origin || null,
        serverIds: this.serverIds || [],
        previewPorts: this.previewPorts ? this.previewPorts.join('-') : null,
        lastPoll: this.lastPoll,
        busy: this.busy,
        outbox: this.outbox?.statuses.length || 0,
        cabinetKeys: this.cabinetKeys.keys.map(({ name, publicKey }) => ({ name, publicKey })),
        instances: this.instanceSummaries(),
      });
    } catch {}
  }
}
