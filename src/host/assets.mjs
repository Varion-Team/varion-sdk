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

  // A file of the hand-brought packs that is this very pack: the size is looked at first, so
  // that big files of other packs are not read.
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
    if (fs.existsSync(blob)) {
      const found = await sha256File(blob);
      if (found.sha256 === asset.sha256 && found.size === asset.size)
        return { file: blob, downloaded: false };
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
    }
    const partial = path.join(this.dir, `.partial-${asset.sha256.slice(0, 16)}-${randomTag()}`);
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
    if (!asset.url && !this.relay) {
      throw new HostError(
        t('asset {name}: it has no address and nobody is sending it', { name: asset.name }),
        'asset-source',
      );
    }
    this.log?.info(
      asset.url
        ? t('asset {name}: downloading {size} from {url}', {
            name: asset.name,
            size: formatBytes(asset.size),
            url: asset.url,
          })
        : t('asset {name}: taking {size} from the developer who is deploying', {
            name: asset.name,
            size: formatBytes(asset.size),
          }),
      { asset: asset.name, size: asset.size },
      'asset-download',
    );
    try {
      const { sha256 } = asset.url
        ? await this.download(asset.url, partial, {
            maxBytes: asset.size,
            expectedSize: asset.size,
            what: t('asset {name}', { name: asset.name }),
            stallMs: 120_000,
          })
        : await this.relay(asset, partial, { releaseId });
      if (sha256 !== asset.sha256) {
        throw new HostError(
          t('asset {name}: the SHA-256 of what came does not match release.json', {
            name: asset.name,
          }),
          'asset-hash',
        );
      }
      await renameWithRetry(partial, blob);
    } catch (error) {
      fs.rmSync(partial, { force: true, maxRetries: 5, retryDelay: 100 });
      throw error;
    }
    return { file: blob, downloaded: true };
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
