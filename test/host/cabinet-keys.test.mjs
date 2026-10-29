import assert from 'node:assert/strict';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { main } from '../../src/host/cli.mjs';
import { Host } from '../../src/host/host.mjs';
import { cabinetTrust, trustKey } from '../../src/host/keys.mjs';
import { createLogger } from '../../src/host/log.mjs';
import { sleep } from '../../src/shared/fs.mjs';
import { startFakeCabinet } from './fixtures/fake-cabinet.mjs';
import { generateKeyPair, removeDir, tempDir } from './fixtures/fixtures.mjs';

const TOKEN = 'varion_srv_test_only_token';
const work = tempDir('varion-host-keys-');
const root = path.join(work, 'root');
const developer = generateKeyPair();
const local = generateKeyPair();
const records = [];
let cabinet;
let host;
let running;

before(async () => {
  cabinet = await startFakeCabinet({ token: TOKEN, developer, serverId: 'srv-1', pollAfterMs: 50 });
  const log = createLogger({ quiet: true });
  log.listen((record) => records.push(record));
  host = new Host({
    root,
    cabinetUrl: cabinet.url,
    token: TOKEN,
    serverIds: ['srv-1'],
    log,
    pollIntervalMs: 50,
    pollWaitS: 1,
    keysRefreshMs: 0,
    statusIntervalMs: 200,
    housekeepingIntervalMs: 3_600_000,
  });
  running = host.run();
});

after(async () => {
  host.requestStop();
  await running;
  await cabinet.close();
  removeDir(work);
});

// a rollback of an instance this host never had: it fails only after every check of the request
async function rollback({ env = 'test', ...options } = {}) {
  const deployId = cabinet.deploy(
    {
      action: 'rollback',
      env,
      project: 'keys-test',
      releaseId: '20261029-120000-0123abcd',
      serverId: 'srv-1',
      sha256: 'a'.repeat(64),
    },
    options,
  );
  const status = await cabinet.waitFinal(deployId, 30_000);
  assert.equal(status.phase, 'failed');
  return status.error;
}

const TRUSTED = /nothing to roll back/;
const UNTRUSTED = /is not trusted on this host/;

describe('keys approved in the cabinet', { timeout: 120_000 }, () => {
  it('nobody is trusted until the cabinet approves a key', async () => {
    assert.match(await rollback(), UNTRUSTED);
    assert.ok(
      records.some((record) => record.event === 'cabinet-keys' && /no keys/.test(record.text)),
    );
  });

  it('a key approved in the cabinet is trusted with the next poll; the signature checks stay as strict', async () => {
    cabinet.approveKey(developer.publicKeyBase64, { name: 'dev-pc', accountId: 'acc-1' });
    assert.match(await rollback(), TRUSTED);
    assert.match(
      await rollback({
        tamper: (signed) => (signed.request.releaseId = '20261029-120000-ffffffff'),
      }),
      /signature does not match \(key "dev-pc"\)/,
    );
    assert.match(await rollback({ keys: local }), UNTRUSTED);
    assert.ok(
      records.some((record) => record.event === 'cabinet-keys' && /dev-pc/.test(record.text)),
    );
    let report = null;
    for (let wait = 0; wait < 50 && !report?.cabinetKeys.length; wait++) {
      await sleep(100);
      let text = '';
      await main(['status', '--root', root, '--json'], {
        out: { write: (chunk) => (text += chunk) },
      });
      report = JSON.parse(text);
    }
    assert.deepEqual(report.cabinetKeys, [
      { name: 'dev-pc', publicKey: developer.publicKeyBase64 },
    ]);
  });

  it('a key revoked in the cabinet is not trusted after the next refresh', async () => {
    cabinet.revokeKey(developer.publicKeyBase64);
    assert.match(await rollback(), UNTRUSTED);
  });

  it('while the cabinet cannot hand the keys out, the last list counts for a few minutes only', async () => {
    cabinet.approveKey(developer.publicKeyBase64);
    assert.match(await rollback(), TRUSTED);
    cabinet.keysAnswer = 'failing';
    try {
      assert.match(await rollback(), TRUSTED);
      host.options.keysStaleMs = 0;
      assert.match(await rollback(), UNTRUSTED);
    } finally {
      host.options.keysStaleMs = 5 * 60_000;
      cabinet.keysAnswer = 'keys';
    }
    assert.match(await rollback(), TRUSTED);
  });

  it('a key deploys only where the cabinet says its account may', async () => {
    cabinet.approveKey(developer.publicKeyBase64, {
      rights: { deployTest: true, deployProd: false },
    });
    assert.match(await rollback(), TRUSTED);
    assert.match(await rollback({ env: 'prod' }), /may not deploy to prod/);
    cabinet.approveKey(developer.publicKeyBase64, {
      rights: { deployTest: false, deployProd: true },
    });
    assert.match(await rollback(), /may not deploy to test and previews/);
    assert.match(await rollback({ env: 'prod' }), TRUSTED);
    cabinet.approveKey(developer.publicKeyBase64, { rights: undefined });
  });

  it('a cabinet without approved keys leaves the keys trusted here', async () => {
    cabinet.keysAnswer = 'missing';
    try {
      trustKey(path.join(root, 'trust', 'deploy-keys.json'), local.publicKeyBase64, 'local');
      assert.match(await rollback({ keys: local }), TRUSTED);
      assert.match(await rollback(), UNTRUSTED);
      assert.ok(records.some((record) => /hands out no approved keys/.test(record.text)));
    } finally {
      cabinet.keysAnswer = 'keys';
    }
  });

  it('entries that are not keys are skipped, names come as one plain line', () => {
    const { keys, skipped } = cabinetTrust({
      keys: [
        { publicKey: developer.publicKeyBase64, name: 'dev\u0007pc‮\n', accountId: 'acc-1' },
        { publicKey: 'not a key', name: 'broken' },
        { publicKey: Buffer.alloc(31).toString('base64') },
        null,
      ],
    });
    assert.equal(skipped, 3);
    assert.deepEqual(
      keys.map(({ name, publicKey, accountId, source }) => ({
        name,
        publicKey,
        accountId,
        source,
      })),
      [
        {
          name: 'dev pc',
          publicKey: developer.publicKeyBase64,
          accountId: 'acc-1',
          source: 'cabinet',
        },
      ],
    );
    assert.deepEqual(cabinetTrust({ keys: 'nope' }), { keys: [], skipped: 0 });
  });
});
