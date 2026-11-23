// Putting a release in place of the running one: on the fly when only resources changed,
// by a full restart otherwise, and back to the previous release when the new one fails.
import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { errorMessage } from '../shared/errors.mjs';
import { randomTag, readText, renameWithRetry, utcStamp, writeFileAtomic } from '../shared/fs.mjs';
import { HostError } from './errors.mjs';
import { planChange } from './release.mjs';
import { readServerSettings } from './servertoml.mjs';

// names the folders one switch moves aside, so that two switches never collide
const moveTag = () => `${utcStamp()}-${randomTag()}`;

function revertedError(message, revertedTo) {
  const error = new HostError(message, 'reverted');
  error.revertedTo = revertedTo;
  return error;
}

function readPrevious(instance, previousId) {
  if (!previousId) return null;
  try {
    return instance.readRelease(previousId);
  } catch {
    // a release that can no longer be read is compared as no release at all
    return null;
  }
}

export async function activate(instance, targetId, { engine }) {
  const previousId = instance.currentId;
  const next = instance.readRelease(targetId);
  const previous = previousId === targetId ? next : readPrevious(instance, previousId);
  const { ports } = instance.host;
  await ports.settle(instance, readServerSettings(instance.effectiveToml(targetId)));
  const nextToml = instance.effectiveToml(targetId);
  ports.checkFree(instance, readServerSettings(nextToml));
  const previousToml = fs.existsSync(instance.paths.serverToml)
    ? readText(instance.paths.serverToml)
    : null;
  const plan = planChange(previous, next, previousToml, nextToml);
  try {
    if (previousId === targetId) {
      return await switchFull(instance, targetId, {
        revertTo: null,
        engine,
        reasons: [t('the active release deployed again')],
      });
    }
    if (!instance.isRunning() || plan.full) {
      const reasons = instance.isRunning()
        ? plan.reasons
        : [t('the server was not running'), ...plan.reasons];
      return await switchFull(instance, targetId, { revertTo: previousId, engine, reasons });
    }
    if (!plan.changed.length) {
      instance.writeCurrent(targetId);
      return { mode: 'none', restarted: [], reasons: [t('no resource files changed')] };
    }
    return await switchHot(instance, targetId, { previousId, plan, engine });
  } finally {
    instance.cleanupTmp();
  }
}

async function switchFull(instance, targetId, { revertTo, engine, reasons }) {
  instance.log.info(
    t('{name}: full restart for release {releaseId} ({reasons})', {
      name: instance.name,
      releaseId: targetId,
      reasons: reasons.join('; '),
    }),
    { instance: instance.name, releaseId: targetId, reasons },
    'full-restart',
  );
  const tag = moveTag();
  const staged = instance.tmp(`resources-${tag}`);
  instance.linkResources(targetId, staged);
  const toml = instance.effectiveToml(targetId);
  await instance.stopServer(t('deploy'));
  const before = {
    resources: fs.existsSync(instance.paths.resources)
      ? instance.tmp(`old-resources-${tag}`)
      : null,
    toml: fs.existsSync(instance.paths.serverToml) ? readText(instance.paths.serverToml) : null,
  };
  if (before.resources) await renameWithRetry(instance.paths.resources, before.resources);
  await renameWithRetry(staged, instance.paths.resources);
  writeFileAtomic(instance.paths.serverToml, toml);
  instance.writeCurrent(targetId);
  try {
    await instance.startServer(engine, t('deploy'));
  } catch (error) {
    if (revertTo) {
      throw await revertFull(instance, revertTo, { failed: targetId, error, before, tag });
    }
    instance.lastError = errorMessage(error);
    instance.backoffMs = instance.host.options.backoffInitialMs;
    keepTrying(instance);
    throw new HostError(
      t('the server did not start: {reason} (the host keeps trying)', {
        reason: errorMessage(error),
      }),
      'start-failed',
    );
  }
  return { mode: 'full', restarted: [], reasons };
}

// Puts the previous release back after a full restart that failed. Returns the error that
// says how it ended, for the caller to throw.
async function revertFull(instance, revertTo, { failed, error, before, tag }) {
  instance.log.warn(
    t('{name}: release {releaseId} did not start ({error}); going back to {previous}', {
      name: instance.name,
      releaseId: failed,
      error: errorMessage(error),
      previous: revertTo,
    }),
    { instance: instance.name },
    'revert',
  );
  await instance.stopServer(t('rollback'), { graceful: false });
  await renameWithRetry(instance.paths.resources, instance.tmp(`failed-resources-${tag}`));
  if (before.resources) await renameWithRetry(before.resources, instance.paths.resources);
  else instance.linkResources(revertTo, instance.paths.resources);
  writeFileAtomic(instance.paths.serverToml, before.toml ?? instance.effectiveToml(revertTo));
  instance.writeCurrent(revertTo);
  try {
    const engine = await engineOf(instance, revertTo);
    await instance.startServer(engine, t('rollback to {releaseId}', { releaseId: revertTo }));
  } catch (again) {
    keepTrying(instance);
    return new HostError(
      t(
        'the new release did not start: {error}; the previous release {previous} did not start either: {again}',
        { error: errorMessage(error), previous: revertTo, again: errorMessage(again) },
      ),
      'revert-failed',
    );
  }
  return revertedError(
    t('the new release did not start: {error}; went back to {previous}', {
      error: errorMessage(error),
      previous: revertTo,
    }),
    revertTo,
  );
}

function keepTrying(instance) {
  instance.wantRunning = true;
  instance.scheduleRecover(instance.host.options.backoffInitialMs);
}

function engineOf(instance, releaseId) {
  const { engine } = instance.readRelease(releaseId);
  return instance.host.engines.ensure(engine, { recheck: false });
}

async function switchHot(instance, targetId, { previousId, plan, engine }) {
  const tag = moveTag();
  const toRestart = instance.settings().loaded.filter((name) => plan.changed.includes(name));
  let swapBack;
  try {
    swapBack = await swapResources(instance, targetId, plan.changed, tag);
  } catch (error) {
    return switchFull(instance, targetId, {
      revertTo: previousId,
      engine,
      reasons: [
        t('a resource could not be swapped while running: {error}', {
          error: errorMessage(error),
        }),
      ],
    });
  }
  instance.writeCurrent(targetId);
  const changed = plan.changed.join(', ');
  instance.log.info(
    toRestart.length
      ? t('{name}: only resources changed ({changed}); restarting on the fly: {restart}', {
          name: instance.name,
          changed,
          restart: toRestart.join(', '),
        })
      : t('{name}: only resources changed ({changed}); none of them is loaded', {
          name: instance.name,
          changed,
        }),
    { instance: instance.name, releaseId: targetId, changed: plan.changed, restart: toRestart },
    'hot-restart',
  );
  try {
    return {
      mode: 'hot',
      restarted: await restartResources(instance, toRestart),
      reasons: [t('only resources changed: {resources}', { resources: changed })],
    };
  } catch (error) {
    throw await revertHot(instance, previousId, { error, swapBack, toRestart });
  }
}

// Puts the changed resources of a release in place of the live ones, one by one. Resolves a
// function that undoes it; when a folder cannot be moved, undoes what was moved and throws.
async function swapResources(instance, releaseId, names, tag) {
  const swapped = [];
  const swapBack = async () => {
    for (const item of swapped.reverse()) {
      await renameWithRetry(item.live, instance.tmp(`failed-res-${item.name}-${tag}`));
      await renameWithRetry(item.old, item.live);
    }
  };
  // windows will not rename a folder while a file in it is open
  const patient = { attempts: 16, delayMs: 250 };
  try {
    for (const name of names) {
      const staged = instance.tmp(`res-${name}-${tag}`);
      instance.linkResources(releaseId, staged, name);
      const live = path.join(instance.paths.resources, name);
      const old = instance.tmp(`old-res-${name}-${tag}`);
      await renameWithRetry(live, old, patient);
      try {
        await renameWithRetry(staged, live, patient);
      } catch (error) {
        await renameWithRetry(old, live);
        throw error;
      }
      swapped.push({ name, live, old });
    }
  } catch (error) {
    await swapBack();
    throw error;
  }
  return swapBack;
}

// Restarts one resource on the server console; resolves what became of its server part.
function restartOnConsole(instance, name) {
  return instance.proc.consoleCommand('restart', name, instance.host.options.consoleTimeoutMs);
}

async function restartResources(instance, names) {
  const restarted = [];
  for (const name of names) {
    const part = await restartOnConsole(instance, name);
    instance.log.info(
      t('{name}: restart {resource}: server part {part}', {
        name: instance.name,
        resource: name,
        part,
      }),
      { instance: instance.name, resource: name, part },
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
  return restarted;
}

// Puts the previous resources back and restarts them, by a full restart when the server no
// longer answers. Returns the error that says how it ended, for the caller to throw.
async function revertHot(instance, previousId, { error, swapBack, toRestart }) {
  instance.log.warn(
    t('{name}: {error}; going back to {previous}', {
      name: instance.name,
      error: errorMessage(error),
      previous: previousId,
    }),
    { instance: instance.name },
    'revert',
  );
  await swapBack();
  instance.writeCurrent(previousId);
  try {
    await restartPrevious(instance, toRestart);
  } catch (again) {
    instance.log.warn(
      t(
        '{name}: the previous resources cannot be restarted on the fly ({error}); full restart for release {previous}',
        { name: instance.name, error: errorMessage(again), previous: previousId },
      ),
      { instance: instance.name },
      'revert',
    );
    try {
      await switchFull(instance, previousId, {
        revertTo: null,
        engine: await engineOf(instance, previousId),
        reasons: [t('rollback')],
      });
    } catch (fatal) {
      return new HostError(
        t('the resource restart failed: {error}; going back to {previous} failed too: {again}', {
          error: errorMessage(error),
          previous: previousId,
          again: errorMessage(fatal),
        }),
        'revert-failed',
      );
    }
  }
  return revertedError(
    t('the resource restart failed: {error}; went back to {previous}', {
      error: errorMessage(error),
      previous: previousId,
    }),
    previousId,
  );
}

async function restartPrevious(instance, names) {
  if (!instance.isRunning()) throw new HostError(t('the server is not running'), 'server-exit');
  for (const name of names) {
    if ((await restartOnConsole(instance, name)) === 'failed') {
      throw new HostError(
        t('resource {resource} of the previous release did not restart either', {
          resource: name,
        }),
        'restart-failed',
      );
    }
  }
}
