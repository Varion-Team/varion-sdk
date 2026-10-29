import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { DEFAULT_CDN, EngineStore, serverExecutableName } from '../shared/engine.mjs';
import { tryReadJson } from '../shared/fs.mjs';
import { CliError } from './output.mjs';

function readVersion(dir) {
  const info = tryReadJson(path.join(dir, 'version.json'), null);
  return info && typeof info.version === 'string' ? info : null;
}

// 1.0.75 and older pass [config] to Node in the ANSI code page, so non-ASCII text gets garbled
export function engineGarblesConfigText(engine) {
  const version = engine.path ? readVersion(engine.path)?.version : engine.version;
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version || '');
  if (!match) return false;
  const [major, minor, patch] = match.slice(1, 4).map(Number);
  return major === 0 || (major === 1 && minor === 0 && patch <= 75);
}

function localEngine(dir, output) {
  const exe = path.join(dir, serverExecutableName());
  if (!fs.existsSync(exe)) {
    throw new CliError(
      t('[engine] path = {dir}: there is no {exe} (point it at a built server folder)', {
        dir,
        exe: serverExecutableName(),
      }),
    );
  }
  const info = readVersion(dir);
  output.event(
    'engine',
    { source: 'path', dir, version: info?.version ?? null, downloaded: false },
    `[${output.prefix}] ${
      info
        ? t('engine from {dir} ({version}, protocol {protocol})', {
            dir,
            version: info.version,
            protocol: info.protocol,
          })
        : t('engine from {dir}', { dir })
    }`,
  );
  return {
    exe,
    dir,
    version: info?.version ?? null,
    channel: info?.channel ?? null,
    source: 'path',
    downloaded: false,
  };
}

export async function resolveEngine(
  project,
  output,
  { verifyHashes = false, cdn, releaseKey } = {},
) {
  const { engine } = project.config;
  if (engine.path) return localEngine(engine.path, output);

  const root = process.env.VARION_ENGINE_CACHE
    ? path.resolve(process.env.VARION_ENGINE_CACHE)
    : project.paths.engine;
  let lastUrl = null;
  const store = new EngineStore({
    root,
    cdn: cdn || process.env.VARION_CDN || DEFAULT_CDN,
    ...(releaseKey ? { releaseKey } : {}),
    // the server writes logs and caches next to itself
    extras: false,
    log: {
      info(text, data = {}, event) {
        if (event === 'engine-progress') {
          output.event(
            'download',
            { url: lastUrl, received: data.received, total: data.total },
            `[${output.prefix}] ${text}`,
          );
          return;
        }
        if (event === 'engine-download') lastUrl = data.url ?? null;
        output.info(text, data);
      },
      warn(text, data) {
        output.warn(text, data);
      },
    },
  });

  const found = await store.ensure(
    { version: engine.version, channel: engine.channel },
    { hashes: verifyHashes },
  );
  const text =
    !found.downloaded && verifyHashes
      ? `[${output.prefix}] ${t('engine {version}: every file matches the signed manifest', { version: found.version })}`
      : undefined;
  output.event(
    'engine',
    {
      source: 'cdn',
      version: found.version,
      channel: found.channel,
      dir: found.dir,
      downloaded: found.downloaded,
      files: found.files,
    },
    text,
  );
  return { ...found, source: 'cdn' };
}
