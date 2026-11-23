import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { Cabinet } from '../../src/host/cabinet.mjs';
import { Instance } from '../../src/host/instance.mjs';
import { effectiveServerToml } from '../../src/host/servertoml.mjs';

const TOKEN = `varion_srv_${'a'.repeat(64)}`;

function hostAt(root, cabinetUrl = 'https://api.example.test') {
  return {
    root,
    log: () => {},
    cabinet: new Cabinet({ url: cabinetUrl, token: TOKEN, hostId: 'host-1' }),
  };
}

describe('the list: the prod server announces itself under the host token', () => {
  it('prod gets announce and the platform address over whatever the release says, and its token in a file', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'varion-listing-'));
    try {
      const prod = new Instance(hostAt(root), 'prod', { env: 'prod', project: 'mode' });
      assert.deepEqual(prod.overrides(), [
        ['resourcesDir', 'resources'],
        ['announce', true],
        ['masterListUrl', 'https://api.example.test/api'],
      ]);
      // the last value of a key counts: a template's announce = false does not keep the server out
      const toml = effectiveServerToml('name = "Mode"\nannounce = false\n', prod.overrides());
      assert.match(
        toml,
        /announce = true\s+masterListUrl = "https:\/\/api\.example\.test\/api"\s*$/,
      );
      assert.equal(toml.includes(TOKEN), false, 'the token is not written into server.toml');

      prod.writeListingToken();
      const file = path.join(prod.paths.dir, 'data', 'masterlist-token.txt');
      assert.equal(fs.readFileSync(file, 'utf8'), TOKEN);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('a cabinet under a path keeps its path', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'varion-listing-'));
    try {
      const prod = new Instance(hostAt(root, 'http://127.0.0.1:7800/base/'), 'prod', {
        env: 'prod',
      });
      assert.equal(prod.listing().url, 'http://127.0.0.1:7800/base/api');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('test and preview servers stay out of it: no announce, no token file', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'varion-listing-'));
    try {
      const test = new Instance(hostAt(root), 'test', { env: 'test' });
      assert.deepEqual(test.overrides(), [['resourcesDir', 'resources']]);
      test.writeListingToken();
      assert.equal(fs.existsSync(path.join(test.paths.dir, 'data', 'masterlist-token.txt')), false);

      const preview = new Instance(hostAt(root), 'preview-a', {
        env: 'prod',
        preview: true,
        ports: { port: 7962, httpPort: 7963 },
      });
      assert.deepEqual(preview.overrides(), [
        ['resourcesDir', 'resources'],
        ['port', 7962],
        ['httpPort', 7963],
        ['announce', false],
      ]);
      assert.equal(preview.listing(), null);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
