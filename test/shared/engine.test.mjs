import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import {
  EngineStore,
  enginePackageName,
  RELEASE_KEY,
  serverExecutableName,
  verifyEngineDir,
} from '../../src/shared/engine.mjs';
import { download, request } from '../../src/shared/http.mjs';
import { startFakeCabinet } from '../host/fixtures/fake-cabinet.mjs';
import {
  buildEnginePackage,
  generateKeyPair,
  removeDir,
  tempDir,
} from '../host/fixtures/fixtures.mjs';

const work = tempDir('varion-engine-test-');
const releaseKeys = generateKeyPair();
let cdn;

before(async () => {
  cdn = await startFakeCabinet({ token: 'unused' });
});
after(async () => {
  await cdn.close();
  removeDir(work);
});

function publish(version, pkg, { signature = pkg.signature, channel = 'rc' } = {}) {
  const base = `/Varion-Server/${channel}/${version}`;
  cdn.serve(`${base}/server-manifest.json`, pkg.manifestBytes);
  cdn.serve(`${base}/server-manifest.json.sig`, Buffer.from(`${signature}\n`));
  cdn.serve(`${base}/${enginePackageName(version)}`, pkg.zip);
}

function store(name, options = {}) {
  const calls = { request: 0, download: 0 };
  const engines = new EngineStore({
    root: path.join(work, name),
    cdn: cdn.url,
    releaseKey: releaseKeys.publicKeyPem,
    request: (...args) => {
      calls.request++;
      return request(...args);
    },
    download: (...args) => {
      calls.download++;
      return download(...args);
    },
    ...options,
  });
  return Object.assign(engines, { calls });
}

describe('EngineStore', () => {
  it('downloads, checks the signed manifest and every file, then reuses the copy', async () => {
    publish(
      '1.0.75',
      buildEnginePackage({ version: '1.0.75', releaseKeys, files: { 'README.txt': 'readme' } }),
    );
    const engines = store('ok');
    const first = await engines.ensure({ version: '1.0.75', channel: 'rc' });
    assert.equal(first.downloaded, true);
    assert.equal(first.files, 3);
    assert.equal(first.dir, path.join(work, 'ok', 'rc', '1.0.75'));
    assert.ok(fs.existsSync(path.join(first.dir, serverExecutableName())));
    const marker = JSON.parse(fs.readFileSync(path.join(first.dir, '.verified'), 'utf8'));
    assert.equal(marker.files, 3);

    const requests = engines.calls.request;
    const second = await engines.ensure({ version: '1.0.75', channel: 'rc' }, { hashes: false });
    assert.equal(second.downloaded, false);
    assert.equal(engines.calls.request, requests, 'a cached engine needs no request');
  });

  it('refuses a manifest not signed by the release key, before fetching the package', async () => {
    publish('1.0.80', buildEnginePackage({ version: '1.0.80', releaseKeys: generateKeyPair() }));
    const engines = store('badsig');
    await assert.rejects(engines.ensure({ version: '1.0.80' }), { code: 'engine-signature' });
    assert.equal(engines.calls.download, 0);
    assert.equal(fs.existsSync(path.join(work, 'badsig', 'rc', '1.0.80')), false);
  });

  it('refuses the real release key for a test-signed manifest', async () => {
    publish('1.0.81', buildEnginePackage({ version: '1.0.81', releaseKeys }));
    const engines = store('realkey', { releaseKey: RELEASE_KEY });
    await assert.rejects(engines.ensure({ version: '1.0.81' }), { code: 'engine-signature' });
  });

  it('refuses a package with a file that differs from the manifest', async () => {
    const pkg = buildEnginePackage({
      version: '1.0.82',
      releaseKeys,
      mutateZipEntries: (entries) =>
        entries.map((entry) =>
          entry.name.endsWith('varion-host.cjs')
            ? { ...entry, data: Buffer.from('// tampered\n') }
            : entry,
        ),
    });
    publish('1.0.82', pkg);
    await assert.rejects(store('tampered').ensure({ version: '1.0.82' }), { code: 'engine-file' });
  });

  it('installs a package written on Windows, every name with backslashes', async () => {
    const pkg = buildEnginePackage({
      version: '1.0.87',
      releaseKeys,
      files: { 'resources/beta-example/resource.toml': 'type = "js"\n' },
      mutateZipEntries: (entries) => [
        { name: 'Varion-Server\\resources\\', data: '' },
        ...entries.map((entry) => ({ ...entry, name: entry.name.replaceAll('/', '\\') })),
      ],
    });
    publish('1.0.87', pkg);
    const { dir, files } = await store('backslashes').ensure({ version: '1.0.87' });
    assert.equal(files, 3);
    assert.ok(fs.existsSync(path.join(dir, 'host', 'varion-host.cjs')));
    assert.ok(fs.existsSync(path.join(dir, 'resources', 'beta-example', 'resource.toml')));
  });

  it('refuses a way out of the folder spelled with backslashes', async () => {
    const pkg = buildEnginePackage({
      version: '1.0.88',
      releaseKeys,
      mutateZipEntries: (entries) => [
        ...entries,
        { name: 'Varion-Server\\..\\..\\escaped.txt', data: 'x' },
      ],
    });
    publish('1.0.88', pkg);
    await assert.rejects(
      store('backslash-escape').ensure({ version: '1.0.88' }),
      /leaves its folder/,
    );
  });

  it('refuses a package with an extra file', async () => {
    const pkg = buildEnginePackage({
      version: '1.0.83',
      releaseKeys,
      mutateZipEntries: (entries) => [...entries, { name: 'Varion-Server/extra.dll', data: 'x' }],
    });
    publish('1.0.83', pkg);
    await assert.rejects(store('extra').ensure({ version: '1.0.83' }), {
      code: 'engine-extra-file',
    });
  });

  it('refuses a manifest of another version or channel', async () => {
    publish('1.0.85', buildEnginePackage({ version: '1.0.84', releaseKeys }));
    await assert.rejects(store('version').ensure({ version: '1.0.85' }), /wrong engine package/);

    // an rc manifest served under beta/
    publish('1.0.89', buildEnginePackage({ version: '1.0.89', releaseKeys }), { channel: 'beta' });
    await assert.rejects(
      store('channel').ensure({ version: '1.0.89', channel: 'beta' }),
      /for the rc channel, expected beta/,
    );
  });

  it('checks a cached copy again: a changed file sets the copy aside and downloads it again', async () => {
    publish('1.0.86', buildEnginePackage({ version: '1.0.86', releaseKeys }));
    const engines = store('recheck');
    const { dir } = await engines.ensure({ version: '1.0.86' });
    fs.writeFileSync(path.join(dir, 'host', 'varion-host.cjs'), '// changed after install\n');
    await assert.rejects(
      verifyEngineDir(dir, { version: '1.0.86', releaseKey: releaseKeys.publicKeyPem }),
      {
        code: 'engine-file',
      },
    );
    const again = await engines.ensure({ version: '1.0.86' }, { recheck: true });
    assert.equal(again.downloaded, true);
    assert.ok(
      fs
        .readdirSync(path.join(work, 'recheck', 'rc'))
        .some((name) => name.startsWith('1.0.86.bad-')),
    );

    fs.writeFileSync(path.join(again.dir, 'planted.dll'), 'x');
    await assert.rejects(
      verifyEngineDir(again.dir, { version: '1.0.86', releaseKey: releaseKeys.publicKeyPem }),
      {
        code: 'engine-extra-file',
      },
    );
  });

  it('with extras off, keeps a copy its server wrote files into, but not one with a changed size', async () => {
    publish('1.0.90', buildEnginePackage({ version: '1.0.90', releaseKeys }));
    const engines = store('in-place', { extras: false });
    const { dir } = await engines.ensure({ version: '1.0.90' });
    fs.mkdirSync(path.join(dir, 'logs'));
    fs.writeFileSync(path.join(dir, 'logs', 'server.log'), 'x');
    const fresh = store('in-place', { extras: false });
    assert.equal((await fresh.ensure({ version: '1.0.90' }, { hashes: false })).downloaded, false);

    fs.appendFileSync(path.join(dir, 'host', 'varion-host.cjs'), '// grown\n');
    assert.equal(
      (await store('in-place', { extras: false }).ensure({ version: '1.0.90' }, { hashes: false }))
        .downloaded,
      true,
    );
  });

  it('refuses a version or channel that could name another folder', async () => {
    const engines = store('names');
    for (const version of ['../1.0.0', '1.0', 'latest']) {
      await assert.rejects(engines.ensure({ version }), { code: 'engine-version' });
    }
    await assert.rejects(engines.ensure({ version: '1.0.0', channel: '../rc' }), {
      code: 'engine-version',
    });
  });
});
