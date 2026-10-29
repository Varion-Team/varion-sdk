import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import {
  planChange,
  unpackBundle,
  validateRelease,
  verifyReleaseDir,
} from '../../src/host/release.mjs';
import {
  effectiveServerToml,
  parseServerToml,
  readServerSettings,
} from '../../src/host/servertoml.mjs';
import {
  buildBundle,
  newReleaseId,
  removeDir,
  serverToml,
  sha256,
  tempDir,
} from './fixtures/fixtures.mjs';

const work = tempDir('varion-host-release-');
after(() => removeDir(work));

let counter = 0;
const expectedOf = (bundle) => ({
  project: bundle.manifest.project,
  env: bundle.manifest.env,
  releaseId: bundle.releaseId,
});

async function unpack(bundle, expected = expectedOf(bundle)) {
  const zipFile = path.join(work, `b${counter}.zip`);
  const dir = path.join(work, `r${counter++}`);
  fs.writeFileSync(zipFile, bundle.zip);
  const release = await unpackBundle(zipFile, dir, expected);
  return { release, dir };
}

const resources = {
  'mode/resource.toml': 'type = "js"\nmain = "server/main.js"\n',
  'mode/server/main.js': 'console.log("v1")\n',
  'mode/version.txt': 'v1',
};

describe('unpackBundle', () => {
  it('unpacks exactly the listed files, each checked', async () => {
    const bundle = buildBundle({ resources });
    const { release, dir } = await unpack(bundle);
    assert.equal(release.files.size, 4);
    assert.equal(
      fs.readFileSync(path.join(dir, 'resources', 'mode', 'server', 'main.js'), 'utf8'),
      'console.log("v1")\n',
    );
    assert.ok(fs.existsSync(path.join(dir, 'release.json')));
    await verifyReleaseDir(dir, release);
  });

  it('refuses a file the release.json does not list', async () => {
    const bundle = buildBundle({
      resources,
      extraEntries: [{ name: 'resources/mode/extra.js', data: 'evil' }],
    });
    await assert.rejects(unpack(bundle), { code: 'extra-file' });
  });

  it('refuses a listed file missing from the archive', async () => {
    const bundle = buildBundle({
      resources,
      mutate: (manifest) =>
        manifest.files.push({ path: 'resources/mode/ghost.js', size: 1, sha256: sha256('x') }),
    });
    await assert.rejects(unpack(bundle), { code: 'missing-file' });
  });

  it('refuses content that does not match release.json', async () => {
    const bundle = buildBundle({
      resources,
      mutate: (manifest) => {
        const file = manifest.files.find((item) => item.path.endsWith('main.js'));
        file.sha256 = sha256('something else');
      },
    });
    await assert.rejects(unpack(bundle), { code: 'file-mismatch' });
  });

  it('refuses a release.json for another release, project or env than the signed request', async () => {
    const bundle = buildBundle({ resources });
    await assert.rejects(unpack(bundle, { ...expectedOf(bundle), releaseId: newReleaseId() }), {
      code: 'release-mismatch',
    });
    await assert.rejects(unpack(bundle, { ...expectedOf(bundle), env: 'prod' }), {
      code: 'release-mismatch',
    });
    await assert.rejects(unpack(bundle, { ...expectedOf(bundle), project: 'other' }), {
      code: 'release-mismatch',
    });
  });

  it('refuses paths outside server.toml and resources/<name>/, and traversal', async () => {
    for (const bad of [
      'varion-server.exe',
      '.env',
      'resources/loose.js',
      'resources/../escape.js',
      'resources/a/../../x.js',
    ]) {
      const bundle = buildBundle({
        resources,
        extraEntries: [{ name: bad, data: 'x' }],
        mutate: (manifest) => manifest.files.push({ path: bad, size: 1, sha256: sha256('x') }),
      });
      await assert.rejects(
        unpack(bundle),
        (error) => ['bad-path', 'bad-release'].includes(error.code),
        bad,
      );
    }
  });

  it('refuses entries that collide without regard to case (Windows would merge them)', async () => {
    const bundle = buildBundle({ resources: { ...resources, 'mode/Server/Main.js': 'x' } });
    await assert.rejects(unpack(bundle), /twice|both a file and a folder/);
  });

  it('refuses a release.json format it does not know', async () => {
    const bundle = buildBundle({ resources, mutate: (manifest) => (manifest.format = 2) });
    await assert.rejects(unpack(bundle), { code: 'release-format' });
  });

  it('notices a file changed on disk after unpacking (hard-linked resources written in place)', async () => {
    const bundle = buildBundle({ resources });
    const { release, dir } = await unpack(bundle);
    fs.appendFileSync(path.join(dir, 'resources', 'mode', 'server', 'main.js'), '// changed');
    await assert.rejects(verifyReleaseDir(dir, release), { code: 'release-dir-changed' });
  });
});

describe('assets in release.json', () => {
  const asset = {
    name: 'cars',
    sha256: 'c'.repeat(64),
    size: 10,
    url: 'https://cdn.example.net/cars.rpf',
  };
  const manifest = (assets) => buildBundle({ resources, assets }).manifest;

  it('places a pack at resources/<name>/dlc.rpf unless `file` says where', () => {
    assert.equal(validateRelease(manifest([asset])).assets[0].file, 'resources/cars/dlc.rpf');
    assert.equal(
      validateRelease(manifest([{ ...asset, file: 'resources/cars/stream/cars.rpf' }])).assets[0]
        .file,
      'resources/cars/stream/cars.rpf',
    );
  });

  it('refuses a pack placed outside its resource, over a listed file, or from a non-https URL', () => {
    assert.throws(
      () => validateRelease(manifest([{ ...asset, file: 'resources/mode/server/main.js' }])),
      /goes under|already taken/,
    );
    assert.throws(
      () =>
        validateRelease(
          manifest([{ ...asset, name: 'mode', file: 'resources/mode/server/main.js' }]),
        ),
      /already taken/,
    );
    assert.throws(
      () => validateRelease(manifest([{ ...asset, url: 'http://cdn.example.net/cars.rpf' }])),
      /https/,
    );
    assert.throws(
      () => validateRelease(manifest([{ ...asset, url: 'file:///etc/passwd' }])),
      /https/,
    );
    assert.doesNotThrow(() =>
      validateRelease(manifest([{ ...asset, url: 'http://127.0.0.1:9000/cars.rpf' }])),
    );
  });
});

describe('planChange', () => {
  const release = (files, engine = '1.0.75') =>
    validateRelease(
      buildBundle({ resources: files, engine: { version: engine, channel: 'rc' } }).manifest,
    );
  const toml = serverToml({ resources: ['mode', 'chat'] });

  it('only resources changed: a console restart of exactly those', () => {
    const before = release({ ...resources, 'chat/x.js': '1' });
    const after = release({ ...resources, 'mode/server/main.js': 'v2', 'chat/x.js': '1' });
    const plan = planChange(before, after, toml, toml);
    assert.equal(plan.full, false);
    assert.deepEqual(plan.changed, ['mode']);
  });

  it('server.toml, the engine, the resource set or a resource.toml changed: a full restart', () => {
    const before = release(resources);
    assert.equal(planChange(before, release(resources), toml, `${toml}# changed\n`).full, true);
    assert.equal(planChange(before, release(resources, '1.0.76'), toml, toml).full, true);
    assert.equal(
      planChange(before, release({ ...resources, 'chat/x.js': '1' }), toml, toml).full,
      true,
    );
    assert.equal(
      planChange(release({ ...resources, 'chat/x.js': '1' }), before, toml, toml).full,
      true,
    );
    assert.equal(
      planChange(
        before,
        release({ ...resources, 'mode/resource.toml': 'type = "js"\nmain = "server/other.js"\n' }),
        toml,
        toml,
      ).full,
      true,
    );
    assert.equal(planChange(null, before, null, toml).full, true);
  });

  it('nothing changed: no restart at all', () => {
    const plan = planChange(release(resources), release(resources), toml, toml);
    assert.equal(plan.full, false);
    assert.deepEqual(plan.changed, []);
  });
});

describe('server.toml', () => {
  it('reads keys as the engine does: comments, quotes, multi-line arrays, last value wins', () => {
    const text = [
      'name = "A # not a comment" # a comment',
      "password = 'x#y'",
      'port = 7000',
      'resources = [',
      '  "a", # first',
      '  "b,c",',
      ']',
      '[server]',
      'port = 7960',
      'gamemode = "a"',
    ].join('\r\n');
    const values = parseServerToml(text);
    assert.equal(values.get('password'), "'x#y'");
    const settings = readServerSettings(text);
    assert.equal(settings.name, 'A # not a comment');
    assert.equal(settings.port, 7960);
    assert.equal(settings.httpPort, 7789);
    assert.deepEqual(settings.resources, ['a', 'b,c']);
    assert.deepEqual(settings.loaded, ['a', 'b,c']);
  });

  it('appends the host keys so they win', () => {
    const text = effectiveServerToml(serverToml({ port: 7960, httpPort: 7961, resources: ['m'] }), [
      ['resourcesDir', 'resources'],
      ['port', 7962],
      ['httpPort', 7963],
      ['announce', false],
    ]);
    const settings = readServerSettings(text);
    assert.equal(settings.port, 7962);
    assert.equal(settings.httpPort, 7963);
    assert.equal(parseServerToml(text).get('announce'), 'false');
    assert.equal(parseServerToml(text).get('resourcesDir'), '"resources"');
  });
});
