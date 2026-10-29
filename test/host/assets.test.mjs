import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { AssetCache } from '../../src/host/assets.mjs';
import { startFakeCabinet } from './fixtures/fake-cabinet.mjs';
import { removeDir, sha256, tempDir } from './fixtures/fixtures.mjs';

const work = tempDir('varion-host-assets-');
let cdn;

before(async () => {
  cdn = await startFakeCabinet({ token: 'unused' });
});
after(async () => {
  await cdn.close();
  removeDir(work);
});

describe('AssetCache', () => {
  it('fetches by hash once, checks it, and links it into a release', async () => {
    const data = Buffer.from('a big pack '.repeat(1000));
    cdn.serve('/packs/cars.rpf', data);
    const cache = new AssetCache({ dir: path.join(work, 'assets') });
    const asset = {
      name: 'cars',
      sha256: sha256(data),
      size: data.length,
      url: `${cdn.url}/packs/cars.rpf`,
      file: 'resources/cars/dlc.rpf',
    };
    const release = { assets: [asset] };
    const target = path.join(work, 'release-a');
    assert.deepEqual(await cache.place(target, release), { placed: 1, downloaded: 1 });
    assert.deepEqual(fs.readFileSync(path.join(target, 'resources', 'cars', 'dlc.rpf')), data);
    const second = path.join(work, 'release-b');
    assert.deepEqual(await cache.place(second, release), { placed: 1, downloaded: 0 });
  });

  it('refuses a download whose hash or size is not the one in release.json', async () => {
    cdn.serve('/packs/evil.rpf', Buffer.from('evil'));
    const cache = new AssetCache({ dir: path.join(work, 'assets-bad') });
    await assert.rejects(
      cache.ensure({
        name: 'evil',
        sha256: sha256('good!'),
        size: 4,
        url: `${cdn.url}/packs/evil.rpf`,
      }),
      { code: 'asset-hash' },
    );
    await assert.rejects(
      cache.ensure({
        name: 'evil',
        sha256: sha256('evil'),
        size: 3,
        url: `${cdn.url}/packs/evil.rpf`,
      }),
      { code: 'size' },
    );
    assert.deepEqual(fs.readdirSync(path.join(work, 'assets-bad')), []);
  });
});
