import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { formatBytes } from '../shared/format.mjs';
import {
  ensureDir,
  linkOrCopy,
  randomTag,
  renameWithRetry,
  sha256File,
  tryRemoveTree,
} from '../shared/fs.mjs';
import { download as httpDownload } from '../shared/http.mjs';
import { HostError } from './errors.mjs';

export class AssetCache {
  // `relay(asset, file, { releaseId })` fetches a pack that has no address: from the developer
  // who is deploying, through the cabinet. Resolves the SHA-256 of what was written.
  // `dropDir` is where packs are put on this machine by hand: one that is there is not asked
  // for from anywhere.
  constructor({ dir, log, download = httpDownload, relay = null, dropDir = null }) {
    this.dir = dir;
    this.dropDir = dropDir;
    this.log = log;
    this.download = download;
    this.relay = relay;
  }

  blob(sha256) {
    return path.join(this.dir, sha256);
  }

  // Finds this pack among the ones brought by hand. Sizes are compared first, so that other
  // big files are not hashed.
  async brought(asset) {
    if (!this.dropDir || !fs.existsSync(this.dropDir)) return null;
    const candidates = [];
    for (const entry of fs.readdirSync(this.dropDir, { withFileTypes: true })) {
      const full = path.join(this.dropDir, entry.name);
      if (entry.isFile()) candidates.push(full);
      else if (entry.isDirectory()) {
        for (const inner of fs.readdirSync(full, { withFileTypes: true })) {
          if (inner.isFile()) candidates.push(path.join(full, inner.name));
        }
      }
    }
    for (const file of candidates) {
      try {
        if (fs.statSync(file).size !== asset.size) continue;
        if ((await sha256File(file)).sha256 === asset.sha256) return file;
      } catch {
        // a file that is still being copied is not a pack yet
      }
    }
    return null;
  }

  async ensure(asset, { releaseId } = {}) {
    ensureDir(this.dir);
    const blob = this.blob(asset.sha256);
    if (await this.cached(asset, blob)) return { file: blob, downloaded: false };
    const byHand = await this.brought(asset);
    if (byHand) {
      linkOrCopy(byHand, blob);
      this.log?.info(
        t('asset {name}: taken from {file}, where it was put by hand', {
          name: asset.name,
          file: byHand,
        }),
        { asset: asset.name, size: asset.size },
        'asset-by-hand',
      );
      return { file: blob, downloaded: false };
    }
    await this.fetch(asset, blob, releaseId);
    return { file: blob, downloaded: true };
  }

  // True when the pack is in the cache and intact. A damaged copy is removed.
  async cached(asset, blob) {
    if (!fs.existsSync(blob)) return false;
    const found = await sha256File(blob);
    if (found.sha256 === asset.sha256 && found.size === asset.size) return true;
    this.log?.warn(
      t('asset {name}: the cached copy ({sha256}) is damaged; downloading it again', {
        name: asset.name,
        sha256: `${asset.sha256.slice(0, 12)}...`,
      }),
    );
    if (!tryRemoveTree(blob)) {
      throw new HostError(
        t('asset {name}: the damaged copy {file} cannot be removed (it is in use)', {
          name: asset.name,
          file: blob,
        }),
        'asset-cache',
      );
    }
    return false;
  }

  // Brings the pack into the cache: from its address, or from the developer who is deploying.
  async fetch(asset, blob, releaseId) {
    const { name, size, url } = asset;
    if (!url && !this.relay) {
      throw new HostError(
        t('asset {name}: it has no download address and no deploy is sending it', { name }),
        'asset-source',
      );
    }
    this.log?.info(
      url
        ? t('asset {name}: downloading {size} from {url}', { name, size: formatBytes(size), url })
        : t('asset {name}: taking {size} from the developer who is deploying', {
            name,
            size: formatBytes(size),
          }),
      { asset: name, size },
      'asset-download',
    );
    const partial = path.join(this.dir, `.partial-${asset.sha256.slice(0, 16)}-${randomTag()}`);
    try {
      const { sha256 } = url
        ? await this.download(url, partial, {
            maxBytes: size,
            expectedSize: size,
            what: t('asset {name}', { name }),
            stallMs: 120_000,
          })
        : await this.relay(asset, partial, { releaseId });
      if (sha256 !== asset.sha256) {
        throw new HostError(
          t('asset {name}: the SHA-256 of what came does not match release.json', { name }),
          'asset-hash',
        );
      }
      await renameWithRetry(partial, blob);
    } catch (error) {
      fs.rmSync(partial, { force: true, maxRetries: 5, retryDelay: 100 });
      throw error;
    }
  }

  async place(dir, release, { releaseId } = {}) {
    let downloaded = 0;
    for (const asset of release.assets) {
      const { file, downloaded: fresh } = await this.ensure(asset, { releaseId });
      if (fresh) downloaded++;
      const target = path.join(dir, ...asset.file.split('/'));
      ensureDir(path.dirname(target));
      linkOrCopy(file, target);
    }
    return { placed: release.assets.length, downloaded };
  }
}
