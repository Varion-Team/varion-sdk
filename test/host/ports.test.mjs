import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Host } from '../../src/host/host.mjs';

// settlePorts needs of a host only its instances and its log
function hostWith(instances) {
  const said = [];
  return {
    said,
    instances: new Map(instances.map((instance) => [instance.name, instance])),
    log: { info: (text, data, code) => said.push(code) },
    settle: Host.prototype.settlePorts,
  };
}

function instance(name, env, ports, { preview = false, running = true } = {}) {
  const self = {
    name,
    meta: { env, preview },
    currentId: running ? 'release' : null,
    saved: 0,
    ports: () => self.meta.ports || ports,
    saveMeta: () => {
      self.saved += 1;
    },
  };
  return self;
}

describe('ports of a test server next to the main one', () => {
  it('takes the next free pair when its own are taken, and keeps them', async () => {
    const prod = instance('mode-prod', 'prod', { port: 47788, httpPort: 47789 });
    const test = instance('mode-test', 'test', null, { running: false });
    const host = hostWith([prod, test]);
    await host.settle(test, { port: 47788, httpPort: 47789 });
    assert.deepEqual(test.meta.ports, { port: 47790, httpPort: 47791 });
    assert.equal(test.saved, 1);
    assert.deepEqual(host.said, ['ports-moved']);
  });

  it('stays where it is when nothing is in the way', async () => {
    const prod = instance('mode-prod', 'prod', { port: 47788, httpPort: 47789 });
    const test = instance('mode-test', 'test', null, { running: false });
    const host = hostWith([prod, test]);
    await host.settle(test, { port: 47800, httpPort: 47801 });
    assert.equal(test.meta.ports, undefined);
    // an instance that runs nothing yet holds no ports
    const idle = instance(
      'other-prod',
      'prod',
      { port: 47800, httpPort: 47801 },
      { running: false },
    );
    await hostWith([idle, test]).settle(test, { port: 47800, httpPort: 47801 });
    assert.equal(test.meta.ports, undefined);
  });

  it('the main server and previews are never moved by it', async () => {
    const test = instance('mode-test', 'test', { port: 47788, httpPort: 47789 });
    const prod = instance('mode-prod', 'prod', null, { running: false });
    await hostWith([test, prod]).settle(prod, { port: 47788, httpPort: 47789 });
    assert.equal(
      prod.meta.ports,
      undefined,
      'players and firewalls know the ports of the main server',
    );
    const preview = instance('mode-preview-a', 'preview-a', null, {
      preview: true,
      running: false,
    });
    await hostWith([test, preview]).settle(preview, { port: 47788, httpPort: 47789 });
    assert.equal(preview.meta.ports, undefined);
  });
});
