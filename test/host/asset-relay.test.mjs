import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { AssetCache } from '../../src/host/assets.mjs';

const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');

function cacheWith(relay) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'varion-asset-relay-'));
  const asked = [];
  const cache = new AssetCache({
    dir: path.join(dir, 'cache'),
    download: async () => {
      throw new Error('a pack without an address is not downloaded');
    },
    relay: relay
      ? async (asset, file, { releaseId }) => {
          asked.push([asset.name, releaseId]);
          return relay(asset, file);
        }
      : null,
  });
  return { dir, cache, asked };
}

describe('a pack without an address', () => {
  const data = Buffer.from('PACK BYTES');
  const asset = {
    name: 'urus',
    sha256: sha256(data),
    size: data.length,
    file: 'resources/urus/dlc.rpf',
  };

  it('is taken from the developer once and kept by its hash', async () => {
    const { dir, cache, asked } = cacheWith(async (_asset, file) => {
      fs.writeFileSync(file, data);
      return { sha256: sha256(data), size: data.length };
    });
    const release = { assets: [asset] };
    const first = await cache.place(path.join(dir, 'a'), release, { releaseId: 'r1' });
    assert.deepEqual(first, { placed: 1, downloaded: 1 });
    assert.deepEqual(fs.readFileSync(path.join(dir, 'a', 'resources', 'urus', 'dlc.rpf')), data);
    const second = await cache.place(path.join(dir, 'b'), release, { releaseId: 'r2' });
    assert.deepEqual(second, { placed: 1, downloaded: 0 });
    assert.deepEqual(asked, [['urus', 'r1']]);
  });

  it('is refused when other bytes come, and nothing of them stays', async () => {
    const { dir, cache } = cacheWith(async (_asset, file) => {
      fs.writeFileSync(file, 'SOMETHING ELSE');
      return { sha256: sha256('SOMETHING ELSE'), size: 14 };
    });
    await assert.rejects(
      cache.place(path.join(dir, 'a'), { assets: [asset] }, { releaseId: 'r1' }),
      (error) => error.code === 'asset-hash',
    );
    assert.deepEqual(fs.readdirSync(path.join(dir, 'cache')), []);
  });

  it('fails in plain words on a host that nobody can send to', async () => {
    const { dir, cache } = cacheWith(null);
    await assert.rejects(
      cache.place(path.join(dir, 'a'), { assets: [asset] }, { releaseId: 'r1' }),
      (error) => error.code === 'asset-source',
    );
  });
});

describe('a pack brought to the server by hand', () => {
  it('is used as it lies, and nothing is asked of anyone', async () => {
    const data = Buffer.from('BROUGHT BY HAND');
    const asset = {
      name: 'maps',
      sha256: sha256(data),
      size: data.length,
      file: 'resources/maps/dlc.rpf',
    };
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'varion-asset-hand-'));
    const drop = path.join(dir, 'packs');
    fs.mkdirSync(path.join(drop, 'maps'), { recursive: true });
    // another file of the same size, and the pack itself one folder down
    fs.writeFileSync(path.join(drop, 'other.rpf'), 'OTHER PACK HERE');
    fs.writeFileSync(path.join(drop, 'maps', 'dlc.rpf'), data);
    const cache = new AssetCache({
      dir: path.join(dir, 'cache'),
      dropDir: drop,
      download: async () => {
        throw new Error('not downloaded');
      },
      relay: async () => {
        throw new Error('not asked for');
      },
    });
    const placed = await cache.place(path.join(dir, 'a'), {
      assets: [{ ...asset, url: 'https://cdn.example/maps.rpf' }],
    });
    assert.deepEqual(placed, { placed: 1, downloaded: 0 });
    assert.deepEqual(fs.readFileSync(path.join(dir, 'a', 'resources', 'maps', 'dlc.rpf')), data);
  });
});
