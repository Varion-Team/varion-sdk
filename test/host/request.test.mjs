import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { RequestRejected } from '../../src/host/errors.mjs';
import { loadTrust, trustKey, untrustKey } from '../../src/host/keys.mjs';
import {
  canonicalJson,
  canonicalRequest,
  NonceStore,
  verifySignedRequest,
} from '../../src/host/request.mjs';
import {
  generateKeyPair,
  makeRequest,
  removeDir,
  signRequest,
  tempDir,
} from './fixtures/fixtures.mjs';

const work = tempDir('varion-host-request-');
after(() => removeDir(work));

const developer = generateKeyPair();
const stranger = generateKeyPair();
const trustFile = path.join(work, 'trust', 'deploy-keys.json');
fs.mkdirSync(path.dirname(trustFile), { recursive: true });
trustKey(trustFile, developer.publicKeyBase64, 'dev laptop');

const base = {
  env: 'prod',
  project: 'my-mode',
  releaseId: '20261028-201501-0a1b2c3d',
  serverId: 'srv-1',
  sha256: 'a'.repeat(64),
};

describe('canonical JSON', () => {
  it('sorts keys and has no spaces', () => {
    const request = {
      sha256: 'f'.repeat(64),
      action: 'activate',
      serverId: 's',
      releaseId: 'r',
      project: 'p',
      nonce: 'n',
      issuedAt: 't',
      env: 'test',
    };
    assert.equal(
      canonicalRequest(request),
      `{"action":"activate","env":"test","issuedAt":"t","nonce":"n","project":"p","releaseId":"r","serverId":"s","sha256":"${'f'.repeat(64)}"}`,
    );
    assert.equal(
      canonicalJson({ b: [2, { d: 1, c: 'x' }], a: null }),
      '{"a":null,"b":[2,{"c":"x","d":1}]}',
    );
  });

  it('signs only the contract fields: what a relay adds does not change the signed string', () => {
    const request = makeRequest(base);
    assert.equal(
      canonicalRequest({ ...request, deployId: 'x', note: 'added by a relay' }),
      canonicalRequest(request),
    );
  });
});

describe('verifySignedRequest', () => {
  const trusted = () => loadTrust(trustFile);

  it('accepts a fresh request signed by a trusted key', () => {
    const signed = signRequest(makeRequest(base), developer);
    const result = verifySignedRequest(signed, { trusted: trusted() });
    assert.equal(result.request.releaseId, base.releaseId);
    assert.equal(result.signer.name, 'dev laptop');
  });

  it('refuses a key that is not trusted', () => {
    const signed = signRequest(makeRequest(base), stranger);
    assert.throws(
      () => verifySignedRequest(signed, { trusted: trusted() }),
      (error) => error instanceof RequestRejected && error.code === 'untrusted-key',
    );
  });

  it('refuses a changed field (the cabinet cannot forge or edit a request)', () => {
    for (const field of ['action', 'env', 'releaseId', 'serverId', 'sha256', 'project', 'nonce']) {
      const signed = signRequest(makeRequest(base), developer);
      const edited = { ...signed, request: { ...signed.request } };
      edited.request[field] =
        field === 'action'
          ? 'rollback'
          : field === 'env'
            ? 'test'
            : field === 'sha256'
              ? 'b'.repeat(64)
              : field === 'releaseId'
                ? '20261028-201502-0a1b2c3d'
                : field === 'nonce'
                  ? crypto.randomBytes(16).toString('base64url')
                  : `${signed.request[field]}x`;
      assert.throws(
        () => verifySignedRequest(edited, { trusted: trusted() }),
        (error) => error.code === 'bad-signature',
        field,
      );
    }
  });

  it('refuses a signature made by a trusted key over another request', () => {
    const one = signRequest(makeRequest(base), developer);
    const other = signRequest(
      makeRequest({ ...base, releaseId: '20261028-201509-0a1b2c3d' }),
      developer,
    );
    assert.throws(
      () => verifySignedRequest({ ...one, signature: other.signature }, { trusted: trusted() }),
      { code: 'bad-signature' },
    );
  });

  it('refuses requests older than 10 minutes and ones from the future', () => {
    const now = Date.now();
    const old = signRequest(
      makeRequest({ ...base, issuedAt: new Date(now - 10 * 60 * 1000 - 1000).toISOString() }),
      developer,
    );
    assert.throws(() => verifySignedRequest(old, { trusted: trusted(), now }), { code: 'stale' });
    const almost = signRequest(
      makeRequest({ ...base, issuedAt: new Date(now - 9 * 60 * 1000).toISOString() }),
      developer,
    );
    assert.doesNotThrow(() => verifySignedRequest(almost, { trusted: trusted(), now }));
    const future = signRequest(
      makeRequest({ ...base, issuedAt: new Date(now + 6 * 60 * 1000).toISOString() }),
      developer,
    );
    assert.throws(() => verifySignedRequest(future, { trusted: trusted(), now }), {
      code: 'future',
    });
    const skewed = signRequest(
      makeRequest({ ...base, issuedAt: new Date(now + 4 * 60 * 1000).toISOString() }),
      developer,
    );
    assert.doesNotThrow(
      () => verifySignedRequest(skewed, { trusted: trusted(), now }),
      'a PC clock 4 minutes ahead (the cabinet allows 5)',
    );
  });

  it('checks the fields themselves', () => {
    const cases = [
      { action: 'delete' },
      { env: 'staging' },
      { env: 'prod', serverId: 'preview' },
      { serverId: 'srv/1' },
      { releaseId: '../../etc' },
      { sha256: 'XYZ' },
      { nonce: 'short' },
      { issuedAt: 'yesterday' },
      { project: '../x' },
    ];
    for (const change of cases) {
      const signed = signRequest(makeRequest({ ...base, ...change }), developer);
      assert.throws(
        () => verifySignedRequest(signed, { trusted: trusted() }),
        { code: 'bad-request' },
        JSON.stringify(change),
      );
    }
    // a preview names its server "preview" or by its own id
    const preview = signRequest(
      makeRequest({ ...base, env: 'preview-feat-login', serverId: 'preview' }),
      developer,
    );
    assert.doesNotThrow(() => verifySignedRequest(preview, { trusted: trusted() }));
    const previewById = signRequest(
      makeRequest({ ...base, env: 'preview-feat-login', serverId: 'srv-1' }),
      developer,
    );
    assert.doesNotThrow(() => verifySignedRequest(previewById, { trusted: trusted() }));
  });
});

describe('NonceStore', () => {
  it('remembers used nonces on disk and forgets them only after they could not pass anyway', () => {
    const file = path.join(work, 'nonces.json');
    const store = new NonceStore(file);
    const now = Date.now();
    store.add('n1', { issuedAt: now, deployId: 'd1' });
    store.add('n0', { issuedAt: now - 3 * 60 * 60 * 1000, deployId: 'd0' });
    const again = new NonceStore(file);
    assert.equal(again.get('n1').deployId, 'd1');
    assert.equal(again.prune(now), 1);
    assert.equal(again.get('n0'), null);
    assert.equal(new NonceStore(file).get('n1').deployId, 'd1');
  });

  it('refuses to start on a damaged file instead of forgetting every nonce', () => {
    const file = path.join(work, 'broken-nonces.json');
    fs.writeFileSync(file, '{"format":1,"nonces":');
    assert.throws(() => new NonceStore(file));
  });
});

describe('trust store', () => {
  it('adds, renames and removes keys; refuses a malformed key', () => {
    const file = path.join(work, 'trust2.json');
    const keys = generateKeyPair();
    assert.equal(trustKey(file, keys.publicKeyBase64, 'a').added, true);
    assert.equal(trustKey(file, keys.publicKeyBase64, 'b').added, false);
    assert.equal(loadTrust(file)[0].name, 'b');
    assert.throws(() => trustKey(file, 'not-a-key'), /32 bytes/);
    assert.equal(untrustKey(file, 'b').length, 1);
    assert.equal(loadTrust(file).length, 0);
  });
});
