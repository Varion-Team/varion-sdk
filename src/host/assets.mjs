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
  constructor({ dir, log, download = httpDownload }) {
    this.dir = dir;
    this.log = log;
    this.download = download;
  }

  blob(sha256) {
    return path.join(this.dir, sha256);
  }

  async ensure(asset) {
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
    this.log?.info(
      t('asset {name}: downloading {size} from {url}', {
        name: asset.name,
        size: formatBytes(asset.size),
        url: asset.url,
      }),
      { asset: asset.name, size: asset.size },
      'asset-download',
    );
    try {
      const { sha256 } = await this.download(asset.url, partial, {
        maxBytes: asset.size,
        expectedSize: asset.size,
        what: t('asset {name}', { name: asset.name }),
        stallMs: 120_000,
      });
      if (sha256 !== asset.sha256) {
        throw new HostError(
          t('asset {name}: the SHA-256 of the download does not match release.json', {
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

  async place(dir, release) {
    let downloaded = 0;
    for (const asset of release.assets) {
      const { file, downloaded: fresh } = await this.ensure(asset);
      if (fresh) downloaded++;
      const target = path.join(dir, ...asset.file.split('/'));
      ensureDir(path.dirname(target));
      linkOrCopy(file, target);
    }
    return { placed: release.assets.length, downloaded };
  }
}
