import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test, { after } from 'node:test';
import { overridesFor, serverPartSha256, writeBundle } from '../../src/cli/commands/deploy.mjs';
import {
  buildDeployRequest,
  DeployError,
  initKeys,
  showKey,
  signDeployRequest,
  verifyDeployRequest,
} from '../../src/deploy/client.mjs';
import { openZip } from '../../src/shared/zip.mjs';
import {
  ensureAssets,
  lockAssets,
  obtainAsset,
  placeAsset,
  readAssetsLock,
} from '../../src/cli/assets.mjs';
import { loadProject } from '../../src/cli/config.mjs';
import { createMemoryOutput } from '../../src/cli/output.mjs';
import { CLI_DIR, cleanupTempDirs, serve, sha256, tempDir, writeFiles } from './helpers.mjs';

after(cleanupTempDirs);

const TOML =
  '[project]\nname = "demo"\n[engine]\nversion = "1.0.75"\n[env.test]\nname = "T"\n[env.preview]\nname = "P"\n';

test('deploy bundle: release.json format 1, sorted files, no secrets, packs by hash only', async () => {
  const root = tempDir();
  writeFiles(root, { 'varion.toml': TOML });
  const project = loadProject(root);
  const staging = path.join(root, 'staging');
  writeFiles(staging, {
    'server.toml': 'name = "T"\n',
    '.env': 'DB_PASSWORD=secret\n',
    'server.pid': '{}',
    'logs/server.log': 'log',
    'resources/demo/resource.toml': 'type = "js"\n',
    'resources/demo/server/index.js': 'x',
    'resources/demo/client/index.js': 'y',
    'resources/rp_cars/resource.toml': 'type = "rpf"\n',
    'resources/rp_cars/__stream.cfg': '{}',
    'resources/rp_cars/dlc.rpf': 'BIG',
    'resources/rp_cars/.varion-asset.json': '{}',
  });
  const assets = [
    {
      name: 'rp_cars',
      sha256: sha256(Buffer.from('BIG')),
      size: 3,
      url: 'https://cdn.example/x',
      file: 'resources/rp_cars/dlc.rpf',
    },
  ];
  const createdAt = new Date('2026-10-28T19:05:07Z');
  const bundle = await writeBundle({
    project,
    env: 'test',
    staging,
    engine: { version: '1.0.75', channel: 'rc' },
    outDir: path.join(root, 'out'),
    createdAt,
    assets,
  });
  assert.match(bundle.releaseId, /^20261028-190507-[0-9a-f]{8}$/);
  const bytes = fs.readFileSync(bundle.zip);
  assert.equal(bundle.sha256, sha256(bytes));
  assert.equal(bundle.size, bytes.length);
  const zip = await openZip(bundle.zip);
  try {
    const { entries } = zip;
    assert.equal(entries[0].name, 'release.json');
    const manifest = JSON.parse((await zip.readBuffer(entries[0], 1 << 20)).toString('utf8'));
    assert.deepEqual(Object.keys(manifest), [
      'format',
      'project',
      'releaseId',
      'env',
      'createdAt',
      'engine',
      'files',
      'assets',
    ]);
    assert.equal(manifest.format, 1);
    assert.equal(manifest.project, 'demo');
    assert.equal(manifest.env, 'test');
    assert.equal(manifest.releaseId, bundle.releaseId);
    assert.deepEqual(manifest.engine, { version: '1.0.75', channel: 'rc' });
    const paths = manifest.files.map((file) => file.path);
    assert.deepEqual(paths, [
      'resources/demo/client/index.js',
      'resources/demo/resource.toml',
      'resources/demo/server/index.js',
      'resources/rp_cars/__stream.cfg',
      'resources/rp_cars/resource.toml',
      'server.toml',
    ]);
    assert.deepEqual(
      manifest.files.map((file) => Object.keys(file)),
      paths.map(() => ['path', 'size', 'sha256']),
    );
    assert.deepEqual(
      entries.slice(1).map((entry) => entry.name),
      paths,
      'the bundle holds the files in the order of release.json',
    );
    for (const file of manifest.files) {
      const entry = entries.find((item) => item.name === file.path);
      const content = await zip.readBuffer(entry, 1 << 20);
      assert.equal(content.length, file.size);
      assert.equal(sha256(content), file.sha256);
    }
    assert.deepEqual(manifest.assets, assets);
    assert.equal(bundle.releaseId.slice(-8), serverPartSha256(manifest.files).slice(0, 8));
  } finally {
    await zip.close();
  }
  assert.equal(overridesFor(project.config, 'test'), 'test');
  assert.equal(overridesFor(project.config, 'preview-feat-x'), 'preview');
  assert.equal(overridesFor(project.config, 'prod'), null);
});

const ed25519Pem = () =>
  crypto.generateKeyPairSync('ed25519').privateKey.export({ format: 'pem', type: 'pkcs8' });

test('deploy key: VARION_DEPLOY_KEY wins over the keys folder and signs requests', () => {
  const dir = tempDir('varion-cli-keys-');
  const folderKey = initKeys({ env: {}, dir });
  assert.equal(folderKey.created, true);
  assert.equal(folderKey.source, 'file');
  const pem = ed25519Pem();
  const env = { VARION_DEPLOY_KEY: pem };
  const shown = showKey({ env, dir });
  assert.equal(shown.source, 'env');
  assert.notEqual(shown.publicKey, folderKey.publicKey);
  assert.equal(shown.privateKeyPath, undefined);
  const oneLine = { VARION_DEPLOY_KEY: pem.trim().replaceAll('\n', '\\n') };
  assert.equal(showKey({ env: oneLine, dir }).publicKey, shown.publicKey);

  const request = buildDeployRequest({
    env: 'test',
    project: 'demo',
    releaseId: '20261028-190507-0123abcd',
    serverId: '42',
    sha256: 'a'.repeat(64),
  });
  const signed = signDeployRequest(request, { env, dir });
  assert.equal(signed.publicKey, shown.publicKey);
  assert.ok(verifyDeployRequest(signed));

  assert.deepEqual(initKeys({ env, dir }), { ...shown, created: false });
  assert.throws(
    () => initKeys({ env, dir, force: true }),
    (error) => error instanceof DeployError && error.code === 'env_key',
  );
  assert.equal(showKey({ env: {}, dir }).publicKey, folderKey.publicKey, 'the folder key stays');
});

test('deploy key: a wrong VARION_DEPLOY_KEY is refused, a missing key names both places', () => {
  const dir = tempDir('varion-cli-keys-');
  assert.throws(
    () => showKey({ env: { VARION_DEPLOY_KEY: 'not a key' }, dir }),
    (error) =>
      error instanceof DeployError &&
      error.code === 'bad_key' &&
      /VARION_DEPLOY_KEY is not a PEM private key/.test(error.message),
  );
  const ec = crypto
    .generateKeyPairSync('ec', { namedCurve: 'P-256' })
    .privateKey.export({ format: 'pem', type: 'pkcs8' });
  assert.throws(() => showKey({ env: { VARION_DEPLOY_KEY: ec }, dir }), /key type is ec/);
  assert.throws(
    () => showKey({ env: {}, dir }),
    (error) => error.code === 'no_key' && /varion keys init.*VARION_DEPLOY_KEY/.test(error.message),
  );
});

test('varion keys show says when the key comes from VARION_DEPLOY_KEY', () => {
  const result = spawnSync(
    process.execPath,
    [path.join(CLI_DIR, 'bin', 'varion.mjs'), 'keys', 'show', '--json'],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        VARION_KEYS_DIR: tempDir('varion-cli-keys-'),
        VARION_DEPLOY_KEY: ed25519Pem(),
      },
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const events = result.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  assert.equal(events.find((event) => event.type === 'key')?.source, 'env');
  assert.ok(
    events.some((event) => event.type === 'info' && /VARION_DEPLOY_KEY/.test(event.text)),
    result.stdout,
  );
});

test('assets: downloaded by URL into the per-PC cache, checked, placed; wrong bytes are refused', async () => {
  const home = tempDir();
  const previousHome = process.env.VARION_HOME;
  process.env.VARION_HOME = home;
  const pack = crypto.randomBytes(4096);
  const http = await serve({
    '/packs/cars.rpf': pack,
    '/packs/bad.rpf': Buffer.from('not the pack'),
  });
  try {
    const root = tempDir();
    const lock = {
      schemaVersion: 1,
      assets: [
        {
          name: 'rp_cars',
          kind: 'dlc',
          sha256: sha256(pack),
          size: pack.length,
          url: `${http.base}/packs/cars.rpf`,
          mount: 'cars',
        },
      ],
    };
    writeFiles(root, {
      'varion.toml': `${TOML}[assets]\n`,
      'assets.lock.json': JSON.stringify(lock),
    });
    const project = loadProject(root);
    const output = createMemoryOutput();
    const serverDir = path.join(root, '.varion', 'server');
    assert.deepEqual(await ensureAssets(project, output, { serverDir }), ['rp_cars']);
    const cached = path.join(home, 'cache', 'assets', sha256(pack));
    assert.ok(fs.readFileSync(cached).equals(pack));
    const placed = path.join(serverDir, 'resources', 'rp_cars');
    assert.ok(fs.readFileSync(path.join(placed, 'dlc.rpf')).equals(pack));
    assert.match(
      fs.readFileSync(path.join(placed, 'resource.toml'), 'utf8'),
      /type = "rpf"[\s\S]*dlc-mount = "cars"/,
    );
    assert.equal(
      fs.readFileSync(path.join(placed, '__stream.cfg'), 'utf8'),
      '{"files":["dlc.rpf"]}',
    );
    const hits = http.hits.length;
    assert.equal(await placeAsset(serverDir, lock.assets[0], cached), 'kept');
    await ensureAssets(project, output, { serverDir });
    assert.equal(http.hits.length, hits, 'cached: no second download');

    const bad = {
      name: 'rp_bad',
      kind: 'dlc',
      sha256: sha256(pack),
      size: 12,
      url: `${http.base}/packs/bad.rpf`,
    };
    await assert.rejects(obtainAsset(project, bad, output), /SHA-256 of the download/);
    assert.deepEqual(
      fs.readdirSync(path.join(home, 'cache', 'assets')),
      [sha256(pack)],
      'nothing else in the cache',
    );
    assert.deepEqual(readAssetsLock(path.join(root, 'nope.json')).assets, []);
    fs.writeFileSync(
      path.join(root, 'broken.json'),
      JSON.stringify({
        schemaVersion: 1,
        assets: [{ name: 'X Y', kind: 'dlc', sha256: 'z', size: 1 }],
      }),
    );
    assert.throws(() => readAssetsLock(path.join(root, 'broken.json')), /name must be lowercase/);
  } finally {
    if (previousHome === undefined) delete process.env.VARION_HOME;
    else process.env.VARION_HOME = previousHome;
    await http.close();
  }
});

test('assets: an author locks the files of the source folder and uses them directly', async () => {
  const home = tempDir();
  const previousHome = process.env.VARION_HOME;
  process.env.VARION_HOME = home;
  try {
    const root = tempDir();
    writeFiles(root, {
      'varion.toml': `${TOML}[assets]\nsource = "packs"\nurl = "https://cdn.example/demo/{sha256}"\n`,
      'packs/rp_maps.rpf': 'MAPS',
      'packs/rp_peds/dlc.rpf': 'PEDS',
      'packs/notes.txt': 'skip',
    });
    const project = loadProject(root);
    const output = createMemoryOutput();
    const lock = await lockAssets(project, output);
    assert.deepEqual(
      lock.assets.map((asset) => [asset.name, asset.kind, asset.size, asset.source]).sort(),
      [
        ['rp_maps', 'dlc', 4, 'rp_maps.rpf'],
        ['rp_peds', 'dlc', 4, 'rp_peds/dlc.rpf'],
      ],
    );
    const maps = lock.assets.find((asset) => asset.name === 'rp_maps');
    assert.equal(maps.url, `https://cdn.example/demo/${sha256(Buffer.from('MAPS'))}`);
    assert.deepEqual(
      readAssetsLock(project.config.assets.lock),
      JSON.parse(fs.readFileSync(project.config.assets.lock, 'utf8')),
    );
    const serverDir = path.join(root, '.varion', 'server');
    assert.deepEqual((await ensureAssets(project, output, { serverDir })).sort(), [
      'rp_maps',
      'rp_peds',
    ]);
    assert.equal(
      fs.readFileSync(path.join(serverDir, 'resources', 'rp_peds', 'dlc.rpf'), 'utf8'),
      'PEDS',
    );
    assert.equal(
      fs.existsSync(path.join(home, 'cache', 'assets')),
      false,
      "the author's own files are not copied into the cache",
    );
    // an edited pack is still used, with a warning
    fs.writeFileSync(path.join(root, 'packs', 'rp_maps.rpf'), 'MAPS v2');
    await ensureAssets(project, output, { serverDir });
    assert.ok(
      output.events().some((event) => event.type === 'warn' && /does not match/.test(event.text)),
    );
  } finally {
    if (previousHome === undefined) delete process.env.VARION_HOME;
    else process.env.VARION_HOME = previousHome;
  }
});
