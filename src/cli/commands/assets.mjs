import fs from 'node:fs';
import path from 'node:path';
import { t } from '../../i18n/index.mjs';
import { formatBytes } from '../../shared/format.mjs';
import { parseArgs } from '../args.mjs';
import { assetsActive, lockAssets, obtainAsset, readAssetsLock } from '../assets.mjs';
import { CliError } from '../output.mjs';
import { assetCacheDir } from '../paths.mjs';
import { openProject } from '../prepare.mjs';

export async function run(argv, { output: root }) {
  const { options, positionals } = parseArgs(argv, {
    command: 'assets',
    options: { json: 'boolean', cwd: 'string' },
    aliases: { C: 'cwd' },
  });
  const output = root.child('assets');
  const project = openProject(options, output);
  const action = positionals[0] || 'status';
  if (action === 'lock') {
    await lockAssets(project, output);
    return 0;
  }
  const lockName = path.basename(project.config.assets.lock);
  if (!assetsActive(project)) {
    throw new CliError(
      t('the project has no [assets] in varion.toml and no {file}', { file: lockName }),
    );
  }
  const lock = readAssetsLock(project.config.assets.lock);
  if (action === 'status') {
    const cache = assetCacheDir();
    for (const asset of lock.assets) {
      const cached = fs.existsSync(path.join(cache, asset.sha256));
      const params = { name: asset.name, kind: asset.kind, size: formatBytes(asset.size) };
      const text = cached
        ? t('{name} ({kind}, {size}): in the cache', params)
        : t('{name} ({kind}, {size}): not in the cache', params);
      output.event(
        'asset',
        { name: asset.name, kind: asset.kind, sha256: asset.sha256, size: asset.size, cached },
        `[${output.prefix}] ${text}`,
      );
    }
    output.info(
      t('{file}: {count} assets; cache: {dir}', {
        file: lockName,
        count: lock.assets.length,
        dir: cache,
      }),
    );
    return 0;
  }
  if (action === 'fetch') {
    for (const asset of lock.assets) await obtainAsset(project, asset, output);
    output.success(t('all {count} assets are in place and checked', { count: lock.assets.length }));
    return 0;
  }
  throw new CliError(
    t('{command}: unknown subcommand "{name}" (there are {list})', {
      command: 'varion assets',
      name: action,
      list: 'status, fetch, lock',
    }),
  );
}
