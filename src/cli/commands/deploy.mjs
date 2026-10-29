import fs from 'node:fs';
import path from 'node:path';
import {
  DeployError,
  listReleases,
  requestDeploy,
  savedLogin,
  uploadRelease,
  waitDeploy,
} from '../../deploy/client.mjs';
import { t } from '../../i18n/index.mjs';
import { formatBytes } from '../../shared/format.mjs';
import {
  removeTree,
  sha256,
  sha256File,
  utcStamp,
  walkFiles,
  writeJsonAtomic,
} from '../../shared/fs.mjs';
import { ZipWriter } from '../../shared/zip.mjs';
import { parseArgs } from '../args.mjs';
import { CliError } from '../output.mjs';
import { DEFAULT_CABINET, DEPLOY_ENV, loadDotenv, serverSettings } from '../config.mjs';
import { resolveEngine } from '../engine.mjs';
import { createBuilder } from '../build.mjs';
import { assetsActive, readAssetsLock } from '../assets.mjs';
import { runProgram } from '../proc.mjs';
import { openProject, populateServerFolder } from '../prepare.mjs';
import { loginCommand } from './login.mjs';

export function serverPartSha256(files) {
  return sha256(files.map((file) => `${file.path}\0${file.size}\0${file.sha256}\n`).join(''));
}

export function overridesFor(config, env) {
  if (config.env[env]) return env;
  if (env.startsWith('preview-') && config.env.preview) return 'preview';
  return null;
}

export async function writeBundle({
  project,
  env,
  staging,
  engine,
  outDir,
  createdAt = new Date(),
  assets = [],
}) {
  // packs go by hash, and .env stays on each server
  const byHash = new Set(assets.map((asset) => asset.file));
  const files = [];
  const relatives = walkFiles(staging, {
    skip: (name, isDirectory) => isDirectory && /(^|\/)logs$/.test(name),
  });
  for (const relative of relatives) {
    if (
      relative === 'server.pid' ||
      relative === '.env' ||
      relative === 'release.json' ||
      byHash.has(relative) ||
      relative.endsWith('/.varion-asset.json')
    ) {
      continue;
    }
    if (relative !== 'server.toml' && !relative.startsWith('resources/')) continue;
    const { sha256: digest, size } = await sha256File(path.join(staging, ...relative.split('/')));
    files.push({ path: relative, size, sha256: digest });
  }
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const releaseId = `${utcStamp(createdAt)}-${serverPartSha256(files).slice(0, 8)}`;
  const manifest = {
    format: 1,
    project: project.config.project.name,
    releaseId,
    env,
    createdAt: createdAt.toISOString(),
    engine: { version: engine.version, channel: engine.channel },
    files,
    assets,
  };
  const zipFile = path.join(outDir, `${releaseId}.zip`);
  const partial = `${zipFile}.partial`;
  try {
    const zip = new ZipWriter(partial, { date: createdAt });
    zip.addBuffer('release.json', Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8'));
    for (const file of files) zip.addFile(file.path, path.join(staging, ...file.path.split('/')));
    zip.close();
    fs.renameSync(partial, zipFile);
  } catch (error) {
    fs.rmSync(partial, { force: true });
    throw new CliError(t('cannot write the release bundle: {reason}', { reason: error.message }));
  }
  const zipped = await sha256File(zipFile);
  return { releaseId, zip: zipFile, manifest, sha256: zipped.sha256, size: zipped.size };
}

export async function run(argv, { output: root }) {
  const { options, positionals } = parseArgs(argv, {
    command: 'deploy',
    options: {
      'pack-only': 'boolean',
      'no-validate': 'boolean',
      rollback: 'boolean',
      json: 'boolean',
      cwd: 'string',
    },
    aliases: { C: 'cwd' },
  });
  const output = root.child('deploy');
  const env = positionals[0];
  if (!env) throw new CliError(t('name the environment: varion deploy test|prod|preview-<branch>'));
  if (!DEPLOY_ENV.test(env)) {
    throw new CliError(
      t(
        'deploy environment "{env}" is not test, prod or preview-<branch> (lowercase Latin letters, digits, . _ -)',
        { env },
      ),
    );
  }
  if (options.rollback && options.packOnly) {
    throw new CliError(t('--rollback sends no release, so it does not go with --pack-only'));
  }
  const project = openProject(options, output);
  // no token or no server shows up before a long build
  const target = options.packOnly ? null : deployTarget(project, env);
  if (options.rollback) return rollback({ project, env, output, target });
  const { config, paths } = project;
  const overrides = overridesFor(config, env);
  if (overrides) {
    output.info(t('environment {env}: [env.{overrides}] over [server]', { env, overrides }));
  }

  const engine = await resolveEngine(project, output);
  if (!engine.version) {
    throw new CliError(
      t(
        'a release needs the engine version: [engine] version, or version.json in the [engine] path folder',
      ),
    );
  }
  const work = path.join(paths.deploy, env);
  const staging = path.join(work, 'server');
  removeTree(work);
  const settings = serverSettings(config, { envName: overrides, release: true });
  const builder = createBuilder(project, output, {
    outDir: staging,
    mapsDir: path.join(work, 'maps'),
    mode: 'release',
    envName: overrides,
  });
  try {
    const built = await builder.build();
    if (!built.ok) throw new CliError(t('the release build failed (errors above)'));
    await populateServerFolder(project, output, { serverDir: staging, settings, writeEnv: false });
  } finally {
    await builder.dispose();
  }

  if (!options.noValidate) {
    const packOut = path.join(work, 'pack-check');
    const check = runProgram(
      engine.exe,
      ['--config', path.join(staging, 'server.toml'), '--pack-resources', '--pack-output', packOut],
      { cwd: staging, env: { ...process.env, VARION_LOG_STYLE: 'plain' } },
    );
    removeTree(packOut);
    if (check.code !== 0) {
      const tail = `${check.stdout}${check.stderr}`.trim().split(/\r?\n/).slice(-15).join('\n');
      const refused = t(
        'the server refused the release resources (--pack-resources, exit code {code})',
        {
          code: check.code,
        },
      );
      throw new CliError(`${refused}:\n${tail}`);
    }
    output.info(t('the server itself checked the release resources (--pack-resources)'));
  }

  // the host fetches DLC packs by URL; a resource archive is already in the bundle
  const assets = [];
  if (assetsActive(project)) {
    for (const asset of readAssetsLock(config.assets.lock).assets) {
      if (asset.kind !== 'dlc') continue;
      if (!asset.url) {
        throw new CliError(
          t(
            '{name}: no url in {lock}, so the server cannot download it (upload the pack, then run varion assets lock with [assets] url)',
            { name: asset.name, lock: path.basename(config.assets.lock) },
          ),
        );
      }
      assets.push({
        name: asset.name,
        sha256: asset.sha256,
        size: asset.size,
        url: asset.url,
        file: `resources/${asset.name}/dlc.rpf`,
      });
    }
  }

  const bundle = await writeBundle({
    project,
    env,
    staging,
    engine,
    outDir: path.join(paths.releases, env),
    assets,
  });
  writeJsonAtomic(path.join(paths.releases, env, `${bundle.releaseId}.json`), {
    ...bundle.manifest,
    zipSha256: bundle.sha256,
    zipSize: bundle.size,
  });
  const described = {
    releaseId: bundle.releaseId,
    env,
    files: bundle.manifest.files.length,
    size: formatBytes(bundle.size),
    zip: path.relative(project.root, bundle.zip),
    assets: assets.length,
  };
  const releaseText = assets.length
    ? t(
        'release {releaseId} ({env}): {files} files, {size}, in {zip}; packs by hash: {assets}',
        described,
      )
    : t('release {releaseId} ({env}): {files} files, {size}, in {zip}', described);
  output.event(
    'release',
    {
      releaseId: bundle.releaseId,
      env,
      zip: bundle.zip,
      sha256: bundle.sha256,
      size: bundle.size,
      files: bundle.manifest.files.length,
      assets: assets.length,
      engine: bundle.manifest.engine,
    },
    output.paint('green', `[deploy] ${releaseText}`),
  );
  if (options.packOnly) return 0;
  return upload({ project, env, bundle, output, target });
}

export function deployTarget(project, env, vars = process.env) {
  const { config } = project;
  const target = config.deploy.envs[env] || {};
  const cabinetUrl =
    target.cabinet || config.deploy.cabinet || vars.VARION_CABINET_URL || DEFAULT_CABINET;
  const given = vars.VARION_DEPLOY_TOKEN || loadDotenv(project.root).values.VARION_DEPLOY_TOKEN;
  const login = given ? null : savedLogin(cabinetUrl, { env: vars });
  if (!given && !login) {
    throw new CliError(
      t(
        'no developer token: sign in with {command}, or set VARION_DEPLOY_TOKEN (for CI; in .env or in the environment)',
        { command: loginCommand(cabinetUrl) },
      ),
    );
  }
  const preview = env.startsWith('preview-');
  // "preview" names the server of a developer token; a signed-in account may have several
  const serverId =
    target.server || (preview ? (login ? config.deploy.envs.test?.server : 'preview') : null);
  if (!serverId) {
    throw new CliError(
      preview
        ? t(
            '{env} has no server: previews of a signed-in computer go to [deploy.test] server, which is not set (or set [deploy.{env}] server)',
            { env },
          )
        : t('[deploy.{env}] server is missing: the number of the cabinet server to deploy to', {
            env,
          }),
    );
  }
  return { cabinetUrl, serverId, token: given || login.token, signedIn: !!login };
}

async function cabinetCall(target, call) {
  try {
    return await call();
  } catch (error) {
    if (target.signedIn && error instanceof DeployError && error.status === 401) {
      const hint = t('the sign-in of this computer is no longer valid: {command}', {
        command: loginCommand(target.cabinetUrl),
      });
      throw new CliError(`${error.message} (${hint})`, { code: 'signed_out' });
    }
    throw error;
  }
}

async function upload({ project, env, bundle, output, target }) {
  const { cabinetUrl, serverId, token } = target;
  const { releaseId } = bundle;
  output.info(
    t('uploading {releaseId} to {cabinet} (server {serverId})', {
      releaseId,
      cabinet: cabinetUrl,
      serverId,
    }),
  );
  const uploaded = await cabinetCall(target, () =>
    uploadRelease({ cabinetUrl, serverId, token, bundlePath: bundle.zip }),
  );
  output.event(
    'upload',
    { env, serverId, releaseId, ...uploaded },
    `[deploy] ${t('uploaded {releaseId}', { releaseId })}`,
  );
  const release = { project: project.config.project.name, releaseId, sha256: bundle.sha256 };
  return sendRequest({ env, output, target, action: 'activate', release });
}

async function rollback({ project, env, output, target }) {
  const { cabinetUrl, serverId, token } = target;
  const listed = await cabinetCall(target, () => listReleases({ cabinetUrl, serverId, token }));
  const releases = Array.isArray(listed.releases) ? listed.releases : [];
  const active = releases.find((release) => release?.env === env && release.active === true);
  if (!active) {
    throw new CliError(
      t('the cabinet knows no active release in {env} on server {serverId}: nothing to roll back', {
        env,
        serverId,
      }),
      { code: 'nothing_active' },
    );
  }
  const { name } = project.config.project;
  if (active.project !== name) {
    throw new CliError(
      t('{env} on server {serverId} runs the project {other}, not {project} of this folder', {
        env,
        serverId,
        other: active.project,
        project: name,
      }),
      { code: 'other_project' },
    );
  }
  output.info(
    t('rolling back {releaseId}, the active release of {env} on server {serverId}', {
      releaseId: active.releaseId,
      env,
      serverId,
    }),
  );
  return sendRequest({ env, output, target, action: 'rollback', release: active });
}

async function sendRequest({ env, output, target, action, release }) {
  const { cabinetUrl, serverId, token } = target;
  const { releaseId } = release;
  const { deployId } = await cabinetCall(target, () =>
    requestDeploy({
      cabinetUrl,
      serverId,
      token,
      action,
      env,
      project: release.project,
      releaseId,
      sha256: release.sha256,
    }),
  );
  output.event(
    'deploy',
    {
      env,
      serverId,
      releaseId,
      deployId,
      action,
      ...(action === 'activate' && { uploaded: true }),
    },
    `[deploy] ${t('deploy request signed and sent ({deployId})', { deployId })}`,
  );
  const final = await cabinetCall(target, () =>
    waitDeploy({
      cabinetUrl,
      serverId,
      token,
      deployId,
      onStatus: (status) =>
        output.event('deploy-status', { env, ...status }, `[deploy] ${status.phase}`),
    }),
  );
  const { phase, link, error } = final;
  // the host reports its own successful rollback as rolled-back
  const done =
    action === 'rollback' ? phase === 'rolled-back' || phase === 'active' : phase === 'active';
  let text;
  if (done && action === 'rollback') {
    text = t('{releaseId} is rolled back on {serverId}: the release before it runs again', {
      releaseId,
      serverId,
    });
  } else if (done) {
    text = link
      ? t('{releaseId} is running on {serverId}: {link}', { releaseId, serverId, link })
      : t('{releaseId} is running on {serverId}', { releaseId, serverId });
  } else {
    text = error
      ? t('deploy ended: {phase} ({error})', { phase, error })
      : t('deploy ended: {phase}', { phase });
  }
  output.event(
    'deployed',
    { env, serverId, releaseId, action, ...final },
    output.paint(done ? 'green' : 'red', `[deploy] ${text}`),
  );
  return done ? 0 : 1;
}
