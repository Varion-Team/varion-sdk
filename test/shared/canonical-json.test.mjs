import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalJson as clientJson } from '../../src/deploy/client.mjs';
import { canonicalJson as hostJson } from '../../src/host/request.mjs';

test('client and host serialize the same JSON values identically', () => {
  const shared = { z: 'value', a: 1 };
  for (const value of [null, true, 3, 'text', [], { b: undefined, a: 1 }, [shared, shared]]) {
    const encoded = clientJson(value);
    assert.equal(encoded, hostJson(value));
    assert.deepEqual(JSON.parse(encoded), JSON.parse(JSON.stringify(value)));
  }
  assert.equal(clientJson({ z: 1, a: { b: 2, a: 3 } }), '{"a":{"a":3,"b":2},"z":1}');
});

test('unsupported values never produce malformed or silently changed signed JSON', () => {
  const cycle = {};
  cycle.self = cycle;
  const cases = [
    undefined,
    NaN,
    Infinity,
    1n,
    Symbol('x'),
    () => {},
    [undefined],
    new Array(2),
    { x: NaN },
    cycle,
    new Map([['x', 1]]),
    new Date(),
  ];
  for (const encode of [clientJson, hostJson]) {
    for (const value of cases) assert.throws(() => encode(value), TypeError);
  }
});
