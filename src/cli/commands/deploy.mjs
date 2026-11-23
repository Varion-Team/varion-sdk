import fs from 'node:fs';
import path from 'node:path';
import {
  DeployError,
  deployTarget as askDeployTarget,
  knownHost,
  listReleases,
  rememberHost,
  requestDeploy,
  savedLogin,
  assetWants,
  uploadAsset,
  uploadRelease,
  waitDeploy,
} from '../../deploy/client.mjs';
import { boxFingerprint, sealedSize } from '../../shared/box.mjs';
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
import { assetsActive, obtainAsset, readAssetsLock } from '../assets.mjs';
import { runProgram } from '../proc.mjs';
import { openProject, populateServerFolder } from '../prepare.mjs';
import { canAskToSignIn, ensureSignedIn, loginCommand } from './login.mjs';
import { findDeployServer } from '../deploy-server.mjs';

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
      'trust-host': 'boolean',
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
  // the first deploy from a computer signs it in by itself; CI keeps using VARION_DEPLOY_TOKEN
  if (!options.packOnly) await ensureSignedInFor(project, env, root);
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

  // A DLC pack with an address is fetched by the host from there. One without goes from this
  // computer along with the release, if the host does not have it yet. A resource archive is
  // already in the bundle.
  const assets = [];
  const packs = [];
  if (assetsActive(project)) {
    for (const asset of readAssetsLock(config.assets.lock).assets) {
      if (asset.kind !== 'dlc') continue;
      if (!asset.url) {
        // not having it here is no trouble while the server has it already
        const file = await obtainAsset(project, asset, output, { offline: true }).then(
          (found) => found.file,
          () => null,
        );
        packs.push({ name: asset.name, sha256: asset.sha256, size: asset.size, file });
      }
      assets.push({
        name: asset.name,
        sha256: asset.sha256,
        size: asset.size,
        ...(asset.url ? { url: asset.url } : {}),
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
  return upload({ project, env, bundle, packs, output, target, trustHost: !!options.trustHost });
}

async function ensureSignedInFor(project, env, root, vars = process.env) {
  const { config } = project;
  if (vars.VARION_DEPLOY_TOKEN || loadDotenv(project.root).values.VARION_DEPLOY_TOKEN) return;
  const target = config.deploy.envs[env] || {};
  const cabinetUrl =
    target.cabinet || config.deploy.cabinet || vars.VARION_CABINET_URL || DEFAULT_CABINET;
  const login = await ensureSignedIn(cabinetUrl, root, { env: vars });
  // the account knows its servers: the id is not something to copy out of the cabinet by hand
  if (!login || target.server || env.startsWith('preview-')) return;
  const server = await findDeployServer({
    project,
    env,
    login,
    cabinetUrl,
    output: root.child('deploy'),
    interactive: canAskToSignIn(vars),
  });
  config.deploy.envs[env] = { ...target, server };
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

// The machine the release is sealed for. Its key reaches this computer through the cabinet, so
// it is remembered the first time and has to stay the same: a new key is a new machine (the
// host was connected again) or someone in between, and that is for a person to say.
async function serverMachine({ target, output, trustHost }) {
  const { cabinetUrl, serverId, token } = target;
  const machine = await cabinetCall(target, () => askDeployTarget({ cabinetUrl, serverId, token }));
  if (!machine.online) {
    throw new CliError(
      t(
        'the server {serverId} is not on the line: varion host is not running on its machine, or is not connected',
        { serverId },
      ),
      { code: 'host_offline' },
    );
  }
  if (!machine.boxKey) {
    throw new CliError(
      t(
        'varion host on the machine of server {serverId} is outdated: update the SDK there and start the host again',
        {
          serverId,
        },
      ),
      { code: 'host_outdated' },
    );
  }
  const known = knownHost(cabinetUrl, serverId);
  const fingerprint = boxFingerprint(machine.boxKey);
  if (!known) {
    rememberHost(cabinetUrl, serverId, machine);
    output.info(
      t(
        'the release is sealed for the machine of the server, key {fingerprint} (varion host status shows the same)',
        {
          fingerprint,
        },
      ),
    );
  } else if (known.boxKey !== machine.boxKey) {
    if (!trustHost) {
      throw new CliError(
        t(
          'the machine of server {serverId} has another key now: {now}, was {was}. If its host was connected again, check the key with varion host status there and deploy with --trust-host',
          { serverId, now: fingerprint, was: boxFingerprint(known.boxKey) },
        ),
        { code: 'host_key_changed' },
      );
    }
    rememberHost(cabinetUrl, serverId, machine);
    output.warn(t('the new key of the server machine is trusted: {fingerprint}', { fingerprint }));
  }
  return machine;
}

// While the host puts the release together it asks for the packs it lacks; they are sent as it
// asks. Returns the way to stop.
function sendPacksAsAsked({ target, releaseId, packs, boxKey, output }) {
  const { cabinetUrl, serverId, token } = target;
  let on = packs.length > 0;
  const work = (async () => {
    while (on) {
      let wants = [];
      try {
        wants = await assetWants({ cabinetUrl, serverId, token, releaseId });
      } catch {
        // the wait for the deploy itself tells what went wrong
      }
      for (const sha256 of wants) {
        const pack = packs.find((item) => item.sha256 === sha256);
        if (!pack || !on) continue;
        if (!pack.file) {
          if (!pack.told) {
            pack.told = true;
            output.warn(
              t(
                'the server asks for the pack {name}, and it is not on this computer: put it into the packs folder of the project, or onto the server by hand',
                { name: pack.name },
              ),
            );
          }
          continue;
        }
        output.info(
          t('sending the pack {name} ({size}) to the server', {
            name: pack.name,
            size: formatBytes(pack.size),
          }),
        );
        try {
          await uploadAsset({
            cabinetUrl,
            serverId,
            token,
            releaseId,
            sha256,
            file: pack.file,
            boxKey,
          });
          output.event(
            'asset-sent',
            { name: pack.name, sha256, size: pack.size },
            `[deploy] ${t('the pack {name} reached the server', { name: pack.name })}`,
          );
        } catch (error) {
          output.warn(
            t('the pack {name} was not sent: {reason}', { name: pack.name, reason: error.message }),
          );
        }
      }
      if (on) await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  })();
  return async () => {
    on = false;
    await work;
  };
}

async function upload({ project, env, bundle, packs = [], output, target, trustHost }) {
  const { cabinetUrl, serverId, token } = target;
  const { releaseId } = bundle;
  const machine = await serverMachine({ target, output, trustHost });
  const release = { project: project.config.project.name, releaseId, sha256: bundle.sha256 };
  return sendRequest({
    env,
    output,
    target,
    action: 'activate',
    release,
    relaySize: sealedSize(fs.statSync(bundle.zip).size),
    whileWaiting: () =>
      sendPacksAsAsked({ target, releaseId, packs, boxKey: machine.boxKey, output }),
    // the cabinet keeps nothing: the bundle goes to the host while this command waits
    afterRequest: async () => {
      output.info(t('sending {releaseId} to server {serverId}', { releaseId, serverId }));
      const sent = await cabinetCall(target, () =>
        uploadRelease({
          cabinetUrl,
          serverId,
          token,
          bundlePath: bundle.zip,
          releaseId,
          boxKey: machine.boxKey,
        }),
      );
      output.event(
        'upload',
        { env, serverId, ...sent },
        `[deploy] ${t('{releaseId} reached the server', { releaseId })}`,
      );
    },
  });
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

async function sendRequest({
  env,
  output,
  target,
  action,
  release,
  relaySize,
  afterRequest,
  whileWaiting,
}) {
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
      relaySize,
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
  if (afterRequest) await afterRequest();
  const stop = whileWaiting ? whileWaiting() : null;
  let final;
  try {
    final = await cabinetCall(target, () =>
      waitDeploy({
        cabinetUrl,
        serverId,
        token,
        deployId,
        onStatus: (status) =>
          output.event('deploy-status', { env, ...status }, `[deploy] ${status.phase}`),
      }),
    );
  } finally {
    if (stop) await stop();
  }
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
