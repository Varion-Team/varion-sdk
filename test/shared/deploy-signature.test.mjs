import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import {
  buildDeployRequest,
  signDeployRequest,
  verifyDeployRequest,
} from '../../src/deploy/client.mjs';
import { canonicalRequest } from '../../src/host/request.mjs';

const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
const request = () =>
  buildDeployRequest({
    env: 'test',
    project: 'demo',
    serverId: 'srv-1',
    releaseId: '20261029-120000-0123abcd',
    sha256: 'a'.repeat(64),
  });

test('signing uses exactly the fields the VARION host verifies', () => {
  const input = { ...request(), note: 'not part of the signed protocol' };
  const signed = signDeployRequest(input, { privateKey });
  assert.equal(
    crypto.verify(
      null,
      Buffer.from(canonicalRequest(signed.request)),
      publicKey,
      Buffer.from(signed.signature, 'base64'),
    ),
    true,
  );
  assert.equal(Object.hasOwn(signed.request, 'note'), false);
});

test('a signed request is independent of subsequent changes to its input', () => {
  const input = request();
  const signed = signDeployRequest(input, { privateKey });
  input.sha256 = 'b'.repeat(64);
  assert.equal(verifyDeployRequest(signed), true);
  assert.equal(signed.request.sha256, 'a'.repeat(64));
});

test('signature verification returns false for malformed envelopes', () => {
  for (const input of [null, undefined, [], {}, 'text', { request: null }]) {
    assert.equal(verifyDeployRequest(input), false);
  }
});
