import fs from 'node:fs';
import { t } from '../i18n/index.mjs';
import {
  boxFingerprint,
  isBoxPublicKey,
  sealedSize,
  sealFile,
  sealStream,
} from '../shared/box.mjs';
import { FINAL, RELEASE_ID, SHA256 } from '../shared/deploy-format.mjs';
import { randomTag, sha256File, sleep } from '../shared/fs.mjs';
import { DeployError } from './errors.mjs';
import { knownHost, rememberHost } from './hosts.mjs';
import { keyFingerprint } from './keys.mjs';
import { buildDeployRequest, signDeployRequest } from './request.mjs';
import {
  RETRY_DELAYS_MS,
  checkTarget,
  endpoint,
  refusal,
  send,
  serverPath,
  withRetries,
} from './transport.mjs';

export async function listReleases({
  cabinetUrl,
  serverId,
  token,
  retries = 2,
  allowInsecureHttp = false,
}) {
  checkTarget({ serverId, token });
  const url = endpoint(cabinetUrl, `${serverPath(serverId)}/releases`, { allowInsecureHttp });
  const answer = await withRetries(() => send({ url, token }), retries);
  if (
    answer.status !== 200 ||
    !answer.body ||
    typeof answer.body !== 'object' ||
    Array.isArray(answer.body)
  ) {
    throw refusal(answer, t('cannot list the releases'));
  }
  return answer.body;
}

// Where a deploy to the server goes: whether its host is online, and the key a bundle is
// sealed with so that only that machine can open it.
export async function deployTarget({ cabinetUrl, serverId, token, allowInsecureHttp = false }) {
  checkTarget({ serverId, token });
  const url = endpoint(cabinetUrl, `${serverPath(serverId)}/deploy-target`, { allowInsecureHttp });
  const answer = await withRetries(() => send({ url, token }));
  if (answer.status === 404 && !(answer.body && answer.body.code)) {
    throw new DeployError(
      t('the cabinet {host} cannot relay releases to the host: it is older than this SDK', {
        host: url.host,
      }),
      { code: 'cabinet_outdated', status: 404 },
    );
  }
  if (answer.status !== 200 || !answer.body || typeof answer.body !== 'object') {
    throw refusal(answer, t('cannot ask where the deploy goes'));
  }
  const { online, hostId, boxKey } = answer.body;
  return {
    online: online === true,
    hostId: typeof hostId === 'string' ? hostId : '',
    boxKey: isBoxPublicKey(boxKey) ? boxKey : '',
  };
}

// Sends the bundle to the host through the cabinet, sealed for the host's machine. The cabinet
// hands it on as it comes and keeps none of it; the call returns once the host has all of it.
// The deploy request that names this release has to be sent first.
export async function uploadRelease({
  cabinetUrl,
  serverId,
  token,
  bundlePath,
  releaseId,
  boxKey,
  onProgress,
  allowInsecureHttp = false,
}) {
  checkTarget({ serverId, token });
  if (typeof releaseId !== 'string' || !RELEASE_ID.test(releaseId)) {
    throw new DeployError(t('no release id for the bundle'), { code: 'bad_request' });
  }
  if (!isBoxPublicKey(boxKey)) {
    throw new DeployError(t('no key of the server machine to seal the release with'), {
      code: 'no_box_key',
    });
  }
  let stat;
  try {
    stat = fs.statSync(bundlePath);
  } catch {
    throw new DeployError(t('no release bundle at {file}', { file: bundlePath }), {
      code: 'no_bundle',
    });
  }
  if (!stat.isFile() || stat.size === 0) {
    throw new DeployError(t('{file} is not a release bundle', { file: bundlePath }), {
      code: 'no_bundle',
    });
  }
  const sealedPath = `${bundlePath}.${randomTag()}.sealed`;
  try {
    const sealed = await sealFile(bundlePath, sealedPath, boxKey);
    const url = endpoint(
      cabinetUrl,
      `${serverPath(serverId)}/releases/${encodeURIComponent(releaseId)}/stream`,
      { allowInsecureHttp },
    );
    // not sent twice: the host takes the bundle once, as it comes
    const answer = await send({
      url,
      method: 'PUT',
      token,
      headers: { 'Content-Type': 'application/octet-stream' },
      file: { path: sealedPath, size: sealed.size },
      idleMs: 150_000,
      onProgress,
    });
    if (answer.status !== 200) throw refusal(answer, t('the release did not reach the server'));
    return { releaseId, size: stat.size, sealedSize: sealed.size };
  } finally {
    fs.rmSync(sealedPath, { force: true });
  }
}

// The packs of a release the host is waiting for right now: the ones it does not have yet.
export async function assetWants({
  cabinetUrl,
  serverId,
  token,
  releaseId,
  allowInsecureHttp = false,
}) {
  checkTarget({ serverId, token });
  const url = endpoint(
    cabinetUrl,
    `${serverPath(serverId)}/releases/${encodeURIComponent(releaseId)}/asset-wants`,
    { allowInsecureHttp },
  );
  const answer = await send({ url, token });
  if (answer.status !== 200)
    throw refusal(answer, t('the cabinet did not say which packs to send'));
  const wants = Array.isArray(answer.body?.wants) ? answer.body.wants : [];
  return wants.filter((sha256) => typeof sha256 === 'string' && SHA256.test(sha256));
}

// Sends one pack to the host that asked for it, sealed for its machine as it is read: no second
// copy of a big file is made on this disk, and the cabinet keeps none of it.
export async function uploadAsset({
  cabinetUrl,
  serverId,
  token,
  releaseId,
  sha256,
  file,
  boxKey,
  onProgress,
  allowInsecureHttp = false,
}) {
  checkTarget({ serverId, token });
  if (!isBoxPublicKey(boxKey)) {
    throw new DeployError(t('no key of the server machine to seal the release with'), {
      code: 'no_box_key',
    });
  }
  const { size } = fs.statSync(file);
  const url = endpoint(
    cabinetUrl,
    `${serverPath(serverId)}/releases/${encodeURIComponent(releaseId)}/assets/${sha256}/stream`,
    { allowInsecureHttp },
  );
  const answer = await send({
    url,
    method: 'PUT',
    token,
    headers: { 'Content-Type': 'application/octet-stream' },
    file: {
      size: sealedSize(size),
      open: () => {
        const sealed = sealStream(boxKey);
        const source = fs.createReadStream(file);
        source.on('error', (error) => sealed.destroy(error));
        sealed.on('close', () => source.destroy());
        return source.pipe(sealed);
      },
    },
    idleMs: 150_000,
    onProgress,
  });
  if (answer.status !== 200) throw refusal(answer, t('the pack did not reach the server'));
  return { sha256, size };
}

// Signs a deploy request and sends it to the cabinet. A rollback names the active release, and
// the host goes back to the one before it.
export async function requestDeploy({
  cabinetUrl,
  serverId,
  token,
  action = 'activate',
  env,
  project,
  releaseId,
  sha256,
  relaySize,
  keysDir: dir,
  privateKey,
  allowInsecureHttp = false,
}) {
  checkTarget({ serverId, token });
  const request = buildDeployRequest({ action, env, project, releaseId, serverId, sha256 });
  // `relay.size`: the sealed bundle follows this request, this many bytes of it
  const body = {
    ...signDeployRequest(request, { privateKey, dir }),
    ...(relaySize ? { relay: { size: relaySize } } : {}),
  };
  const url = endpoint(cabinetUrl, `${serverPath(serverId)}/deploys`, { allowInsecureHttp });
  const accepted = (deployId, status = 'queued') => {
    if (typeof deployId !== 'string' || !deployId || typeof status !== 'string' || !status) {
      throw new DeployError(t('the cabinet returned invalid deploy metadata'), {
        code: 'bad_answer',
      });
    }
    return {
      deployId,
      status,
      request,
      publicKey: body.publicKey,
      fingerprint: keyFingerprint(body.publicKey),
    };
  };
  let answer;
  let resent = false;
  try {
    answer = await send({ url, method: 'POST', token, json: body });
  } catch (error) {
    if (!(error instanceof DeployError) || error.code !== 'network') throw error;
    // the answer may be what got lost; a resend is refused as a replay and found by nonce
    await sleep(RETRY_DELAYS_MS[0]);
    answer = await send({ url, method: 'POST', token, json: body });
    resent = true;
  }
  if (answer.status === 409 && answer.body && answer.body.code === 'replay' && resent) {
    const list = await withRetries(() => send({ url, token }));
    const found =
      list.status === 200 && Array.isArray(list.body && list.body.deploys)
        ? list.body.deploys.find((deploy) => deploy.nonce === request.nonce)
        : null;
    if (found) return accepted(found.deployId, found.status);
  }
  if (answer.status !== 202 && answer.status !== 201 && answer.status !== 200) {
    throw refusal(answer, t('the deploy request was refused'));
  }
  const deployId = answer.body && answer.body.deployId;
  if (typeof deployId !== 'string' || !deployId) {
    throw new DeployError(t('the cabinet accepted the request but named no deployId'), {
      code: 'bad_answer',
    });
  }
  return accepted(deployId, answer.body.status);
}

export async function getDeploy({
  cabinetUrl,
  serverId,
  token,
  deployId,
  allowInsecureHttp = false,
}) {
  checkTarget({ serverId, token });
  if (typeof deployId !== 'string' || !deployId) {
    throw new DeployError(t('no deployId'), { code: 'bad_request' });
  }
  const url = endpoint(
    cabinetUrl,
    `${serverPath(serverId)}/deploys/${encodeURIComponent(deployId)}`,
    { allowInsecureHttp },
  );
  const answer = await withRetries(() => send({ url, token }));
  if (answer.status !== 200 || !answer.body || typeof answer.body.status !== 'string') {
    throw refusal(answer, t('cannot read the deploy status'));
  }
  return { ...answer.body, phase: answer.body.status };
}

export async function waitDeploy({
  cabinetUrl,
  serverId,
  token,
  deployId,
  onStatus,
  intervalMs = 2_000,
  timeoutMs = 20 * 60_000,
  allowInsecureHttp = false,
}) {
  const started = Date.now();
  let last = '';
  let seen = null;
  for (;;) {
    let status = null;
    try {
      status = await getDeploy({ cabinetUrl, serverId, token, deployId, allowInsecureHttp });
    } catch (error) {
      // a cabinet out of reach for a moment does not end the wait, a refusal does
      const passing =
        error instanceof DeployError &&
        (error.code === 'network' || error.status >= 500 || error.status === 429);
      if (!passing) throw error;
    }
    if (status) {
      seen = status;
      if (status.status === 'queued' && status.hostOnline === false) {
        status.hint = t("the server's host is offline: the request waits for it up to 10 minutes");
      }
      const shape = [status.status, status.error, status.link, status.hostOnline].join('|');
      if (shape !== last) {
        last = shape;
        if (onStatus) onStatus(status);
      }
      if (FINAL.has(status.status)) return status;
    }
    if (Date.now() - started > timeoutMs) {
      const minutes = Math.round(timeoutMs / 60_000);
      const message = seen
        ? t(
            "deploy {deployId} did not finish in {minutes} min (now: {status}); follow it in the server's cabinet",
            { deployId, minutes, status: seen.status },
          )
        : t('deploy {deployId}: no status from the cabinet in {minutes} min', {
            deployId,
            minutes,
          });
      throw new DeployError(message, { code: 'timeout', data: seen || undefined });
    }
    await sleep(intervalMs);
  }
}

// The key the bundle is sealed with: the one of the server's machine, which has to be online
// and has to be the machine this computer deployed to before.
async function sealingKey({ cabinetUrl, serverId, token, allowInsecureHttp }, trustNewHost) {
  const target = await deployTarget({ cabinetUrl, serverId, token, allowInsecureHttp });
  if (!target.online) {
    throw new DeployError(t('the host of server {serverId} is offline', { serverId }), {
      code: 'host_offline',
    });
  }
  if (!target.boxKey) {
    throw new DeployError(
      t('the host of server {serverId} runs an older SDK: update it', { serverId }),
      { code: 'host_outdated' },
    );
  }
  const known = knownHost(cabinetUrl, serverId);
  if (known && known.boxKey !== target.boxKey && !trustNewHost) {
    throw new DeployError(
      t('the machine of server {serverId} has another key now ({now}, was {was})', {
        serverId,
        now: boxFingerprint(target.boxKey),
        was: boxFingerprint(known.boxKey),
      }),
      { code: 'host_key_changed' },
    );
  }
  if (!known || known.boxKey !== target.boxKey) rememberHost(cabinetUrl, serverId, target);
  return target.boxKey;
}

// The whole of a deploy from a script: the bundle is sealed for the server's machine, the signed
// request goes first, the bundle follows it to the host. The machine's key is remembered the
// first time and has to stay the same afterwards (`trustNewHost` accepts a new one).
export async function deployRelease({
  cabinetUrl,
  serverId,
  token,
  bundlePath,
  releaseId,
  env,
  project,
  wait = true,
  trustNewHost = false,
  onProgress,
  onStatus,
  keysDir: dir,
  privateKey,
  timeoutMs,
  intervalMs,
  allowInsecureHttp = false,
}) {
  const cabinet = { cabinetUrl, serverId, token, allowInsecureHttp };
  const boxKey = await sealingKey(cabinet, trustNewHost);
  const { sha256, size } = await sha256File(bundlePath);
  const { deployId } = await requestDeploy({
    ...cabinet,
    action: 'activate',
    env,
    project,
    releaseId,
    sha256,
    relaySize: sealedSize(size),
    keysDir: dir,
    privateKey,
  });
  const upload = await uploadRelease({ ...cabinet, bundlePath, releaseId, boxKey, onProgress });
  if (!wait) return { upload, deployId, final: null };
  const final = await waitDeploy({
    ...cabinet,
    deployId,
    onStatus,
    ...(timeoutMs ? { timeoutMs } : {}),
    ...(intervalMs ? { intervalMs } : {}),
  });
  return { upload, deployId, final };
}
