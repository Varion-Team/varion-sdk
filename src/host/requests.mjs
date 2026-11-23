// A deploy request from the cabinet: checked against the keys this host trusts, then
// carried out, with every step reported back.
import { t } from '../i18n/index.mjs';
import { FINAL } from '../shared/deploy-format.mjs';
import { errorMessage } from '../shared/errors.mjs';
import { HostError, RequestRejected } from './errors.mjs';
import { Instance } from './instance.mjs';
import { obtainRelease } from './obtain.mjs';
import { instanceNameFor, safeInstanceName } from './paths.mjs';
import { PREVIEW_SERVER, verifySignedRequest } from './request.mjs';
import { activate } from './switch.mjs';

function restartText(result) {
  if (result.mode === 'hot') {
    const names = result.restarted.map((item) => item.name).join(', ');
    return t('resources restarted: {resources}', { resources: names || '-' });
  }
  return result.mode === 'full' ? t('full restart') : t('no restart');
}

export async function handleRequest(host, item) {
  const { deployId } = item;
  const known = host.journal.get(deployId);
  // a repeat after a lost answer: report the outcome again
  if (known && known.signature === item.signature && FINAL.has(known.phase)) {
    await host.journal.again(deployId);
    return;
  }
  let verified;
  try {
    verified = verifySignedRequest(item, { trusted: host.trustedKeys(), now: host.now() });
    const used = host.nonces.get(verified.request.nonce);
    if (used) {
      if (deployId && used.deployId === deployId && known) {
        await host.journal.again(deployId);
        return;
      }
      throw new RequestRejected(t('replayed request: its nonce was already used'), 'replay');
    }
    checkScope(host, verified.request);
    checkSignerRights(verified.signer, verified.request);
    host.nonces.add(verified.request.nonce, {
      issuedAt: verified.issuedAtMs,
      deployId,
      seenAt: host.now(),
    });
  } catch (error) {
    await refuse(host, item, error);
    return;
  }
  await carryOut(host, item, verified);
}

async function refuse(host, { deployId, signature }, error) {
  const reason = errorMessage(error);
  host.log.warn(
    deployId
      ? t('request {deployId} refused: {error}', { deployId, error: reason })
      : t('request without a deployId refused: {error}', { error: reason }),
    { deployId, code: error.code },
    'request-rejected',
  );
  if (deployId) await host.journal.finish(deployId, 'failed', { error: reason, signature });
}

async function carryOut(host, item, { request, signer }) {
  const { deployId } = item;
  host.log.info(
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
  host.journal.begin(deployId, request, item.signature);
  try {
    const outcome =
      request.action === 'activate'
        ? await activateRequest(host, deployId, request)
        : await rollbackRequest(host, deployId, request);
    await host.journal.finish(deployId, outcome.phase, {
      port: outcome.port,
      signature: item.signature,
    });
  } catch (error) {
    const phase = request.action === 'activate' && error.revertedTo ? 'rolled-back' : 'failed';
    host.log.error(
      t('deploy {deployId}: {error}', { deployId, error: errorMessage(error) }),
      { deployId, code: error.code, phase },
      'deploy-failed',
    );
    const instance = host.instances.get(safeInstanceName(request));
    await host.journal.finish(deployId, phase, {
      error: errorMessage(error),
      port: instance?.ports()?.port,
      signature: item.signature,
    });
  } finally {
    host.journal.end();
  }
}

// a key the cabinet approved deploys only where its account may
function checkSignerRights(signer, request) {
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
function checkScope(host, request) {
  const { env, serverId } = request;
  const own = host.serverIds.includes(serverId);
  const serverIds = host.serverIds.join(', ');
  if (env.startsWith('preview-')) {
    if (!host.ports.previews) {
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

function instanceFor(host, request) {
  const name = instanceNameFor(request.project, request.env);
  const instance = host.instances.get(name);
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

async function activateRequest(host, deployId, request) {
  const { name, instance: existing } = instanceFor(host, request);
  let instance = existing;
  let created = false;
  if (!instance) {
    const preview = request.env.startsWith('preview-');
    const ports = preview ? await host.ports.forPreview() : null;
    instance = Instance.create(host, {
      name,
      project: request.project,
      env: request.env,
      serverId: request.serverId,
      preview,
      ports,
    });
    host.instances.set(name, instance);
    created = true;
    host.log.info(
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
    return await activateOn(host, instance, deployId, request);
  } catch (error) {
    // a first deploy that never got a release leaves no instance behind
    if (created && !instance.currentId) {
      await instance.exclusive(() => instance.remove(t('the first deploy failed'))).catch(() => {});
      host.instances.delete(name);
    }
    throw error;
  }
}

async function activateOn(host, instance, deployId, request) {
  const { name } = instance;
  return instance.exclusive(async () => {
    await obtainRelease(host, instance, request.releaseId, request.sha256, deployId);
    const release = instance.readRelease(request.releaseId);
    const engine = await host.engines.ensure(release.engine, { recheck: true });
    await host.journal.progress(deployId, 'activating', { port: instance.ports()?.port });
    const result = await activate(instance, request.releaseId, { engine });
    instance.pushStack({
      releaseId: request.releaseId,
      sha256: request.sha256,
      action: 'activate',
      deployId,
      at: new Date(host.now()).toISOString(),
    });
    instance.meta.lastDeployAt = new Date(host.now()).toISOString();
    instance.saveMeta();
    const pruned = instance.pruneReleases(host.options.keepReleases);
    const params = { instance: name, releaseId: request.releaseId, how: restartText(result) };
    host.log.info(
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

async function rollbackRequest(host, deployId, request) {
  const { name, instance } = instanceFor(host, request);
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
    await obtainRelease(host, instance, target.releaseId, target.sha256, deployId);
    const release = instance.readRelease(target.releaseId);
    const engine = await host.engines.ensure(release.engine, { recheck: true });
    await host.journal.progress(deployId, 'activating', { port: instance.ports()?.port });
    const result = await activate(instance, target.releaseId, { engine });
    instance.meta.stack = stack.slice(0, index + 1);
    instance.meta.lastDeployAt = new Date(host.now()).toISOString();
    instance.saveMeta();
    host.log.info(
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
