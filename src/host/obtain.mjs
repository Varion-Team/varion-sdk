import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { isSealed, openFile } from '../shared/box.mjs';
import { errorMessage } from '../shared/errors.mjs';
import { formatBytes } from '../shared/format.mjs';
import {
  ensureDir,
  randomTag,
  renameWithRetry,
  tryRemoveTree,
  writeJsonAtomic,
} from '../shared/fs.mjs';
import { HostError } from './errors.mjs';
import { LIMITS, RELEASE_MARKER, unpackBundle, verifyReleaseDir } from './release.mjs';

// Brings a release into the instance's folder: downloads its bundle, opens it, checks every
// file against release.json and fetches the packs. A release already on disk is only checked.
export async function obtainRelease(host, instance, releaseId, sha256, deployId) {
  if (await hasRelease(host, instance, releaseId, sha256, deployId)) return;
  await host.journal.progress(deployId, 'downloading', { port: instance.ports()?.port });
  ensureDir(host.layout.downloads);
  const dir = instance.releaseDir(releaseId);
  const zipFile = path.join(host.layout.downloads, `${releaseId}-${randomTag()}.zip`);
  const staging = path.join(instance.paths.releases, `.staging-${releaseId}-${randomTag()}`);
  try {
    const size = await downloadBundle(host, releaseId, zipFile, sha256);
    await host.journal.progress(deployId, 'verifying', { port: instance.ports()?.port });
    const release = await unpackBundle(zipFile, staging, {
      project: instance.meta.project,
      env: instance.meta.env,
      releaseId,
    });
    const placed = await host.assets.place(staging, release, { releaseId });
    writeJsonAtomic(path.join(staging, RELEASE_MARKER), {
      zipSha256: sha256,
      size,
      verifiedAt: new Date().toISOString(),
    });
    await renameWithRetry(staging, dir);
    logVerified(host, instance, releaseId, release, { size, placed });
  } catch (error) {
    tryRemoveTree(staging);
    throw error;
  } finally {
    fs.rmSync(zipFile, { force: true });
  }
}

// True when the release is on disk and intact. A copy that does not match is moved away.
async function hasRelease(host, instance, releaseId, sha256, deployId) {
  const dir = instance.releaseDir(releaseId);
  if (!fs.existsSync(dir)) return false;
  if (instance.releaseMarker(releaseId)?.zipSha256 === sha256) {
    await host.journal.progress(deployId, 'verifying', { port: instance.ports()?.port });
    try {
      await verifyReleaseDir(dir, instance.readRelease(releaseId));
      host.log.info(
        t('{instance}: release {releaseId} is already on disk and matches', {
          instance: instance.name,
          releaseId,
        }),
        { instance: instance.name, releaseId },
        'release-cached',
      );
      return true;
    } catch (error) {
      host.log.warn(
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
  return false;
}

// Downloads the bundle into zipFile, unsealed, and returns its size.
async function downloadBundle(host, releaseId, zipFile, sha256) {
  // the bundle comes sealed for this machine; an older cabinet still hands out a plain zip
  const taken = `${zipFile}.sealed`;
  let downloaded = await host.cabinet.downloadRelease(releaseId, taken, {
    maxBytes: LIMITS.sealedBundleBytes,
  });
  try {
    if (isSealed(taken)) downloaded = await openFile(taken, zipFile, host.box.privateKey);
    else fs.renameSync(taken, zipFile);
  } finally {
    fs.rmSync(taken, { force: true });
  }
  if (downloaded.sha256 !== sha256) {
    throw new HostError(
      t('the bundle SHA-256 ({found}...) does not match the signed one ({expected}...)', {
        found: downloaded.sha256.slice(0, 12),
        expected: sha256.slice(0, 12),
      }),
      'zip-hash',
    );
  }
  return downloaded.size;
}

function logVerified(host, instance, releaseId, release, { size, placed }) {
  const params = {
    instance: instance.name,
    releaseId,
    size: formatBytes(size),
    files: release.files.size,
    engine: release.engine.version,
  };
  host.log.info(
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
      size,
      files: release.files.size,
      assets: release.assets.length,
    },
    'release-verified',
  );
}
