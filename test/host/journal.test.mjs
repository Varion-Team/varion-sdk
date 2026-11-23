import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { HostError } from '../../src/host/errors.mjs';
import { DeployJournal } from '../../src/host/journal.mjs';
import { hostLayout } from '../../src/host/paths.mjs';
import { Ports } from '../../src/host/ports.mjs';

const made = [];
after(() => {
  for (const dir of made) fs.rmSync(dir, { recursive: true, force: true });
});

// A journal in a fresh host folder, with a cabinet that answers as `answer` says.
function journal(answer = async () => {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'varion-host-journal-'));
  made.push(root);
  const layout = hostLayout(root);
  fs.mkdirSync(layout.stateDir, { recursive: true });
  const sent = [];
  const said = [];
  const log = {
    info: (text, data, code) => said.push(code),
    warn: (text, data, code) => said.push(code),
  };
  const open = () =>
    new DeployJournal({
      layout,
      log,
      reportStatus: async (status) => {
        await answer(status);
        sent.push(status);
      },
    });
  return { journal: open(), reopen: open, layout, sent, said };
}

const refusal = (status) => Object.assign(new Error(`HTTP ${status}`), { code: `http-${status}` });
const onDisk = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

describe('the journal of deploys', () => {
  it('follows a deploy from its request to its end, and survives a restart', async () => {
    const { journal: first, reopen, layout, sent } = journal();
    const request = {
      nonce: 'n1',
      action: 'activate',
      releaseId: '20261123-100000-aaaabbbb',
      project: 'city',
      env: 'prod',
      serverId: '42',
    };
    first.begin('d1', request, 'sig');
    assert.equal(first.current.deployId, 'd1');
    assert.equal(first.get('d1').phase, 'accepted');

    await first.progress('d1', 'downloading', { port: 7788 });
    await first.finish('d1', 'active', { port: 7788, signature: 'sig' });
    first.end();
    assert.equal(first.current, null);
    assert.deepEqual(sent, [
      { deployId: 'd1', phase: 'downloading', port: 7788 },
      { deployId: 'd1', phase: 'active', port: 7788 },
    ]);

    const later = reopen();
    const { at, ...record } = later.get('d1');
    assert.ok(Date.parse(at) > 0);
    assert.deepEqual(record, { ...request, phase: 'active', signature: 'sig', port: 7788 });
    assert.equal(later.get('unknown'), null);
    assert.equal(later.get(undefined), null);
    assert.equal(onDisk(layout.deploys).deploys.d1.phase, 'active');
  });

  it('says again how a deploy ended when the cabinet asks a second time', async () => {
    const { journal: book, sent } = journal();
    await book.finish('d1', 'failed', { error: 'no disk space', signature: 'sig' });
    sent.length = 0;
    await book.again('d1');
    assert.deepEqual(sent, [{ deployId: 'd1', phase: 'failed', error: 'no disk space' }]);
  });

  it('keeps the last status of a deploy until the cabinet has it', async () => {
    let reachable = false;
    const cabinet = async () => {
      if (!reachable) throw new Error('ECONNREFUSED');
    };
    const { journal: book, layout, sent, said } = journal(cabinet);
    // a status in between is not kept: the next one follows soon
    await book.progress('d1', 'verifying');
    assert.equal(book.unsentCount, 0);

    await book.finish('d1', 'rolled-back', { error: 'did not start' });
    await book.finish('d1', 'failed', { error: 'did not start' });
    assert.equal(book.unsentCount, 1);
    assert.deepEqual(onDisk(layout.outbox).statuses, [
      { deployId: 'd1', phase: 'failed', error: 'did not start' },
    ]);
    assert.ok(said.includes('status-queued'));

    await book.sendUnsent();
    assert.equal(book.unsentCount, 1);
    reachable = true;
    await book.sendUnsent();
    assert.equal(book.unsentCount, 0);
    assert.deepEqual(onDisk(layout.outbox).statuses, []);
    assert.deepEqual(sent, [{ deployId: 'd1', phase: 'failed', error: 'did not start' }]);
  });

  it('drops a status the cabinet refuses for good', async () => {
    const { journal: book, said } = journal(async () => {
      throw refusal(404);
    });
    await book.finish('d1', 'active', {});
    assert.equal(book.unsentCount, 0);
    assert.ok(said.includes('status-refused'));

    // one that was queued while the cabinet was away is dropped on the next try too
    let answer = new Error('ETIMEDOUT');
    const { journal: other } = journal(async () => {
      throw answer;
    });
    await other.finish('d2', 'active', {});
    assert.equal(other.unsentCount, 1);
    answer = refusal(410);
    await other.sendUnsent();
    assert.equal(other.unsentCount, 0);
    // a cabinet that is busy is asked again later
    answer = refusal(429);
    await other.finish('d3', 'active', {});
    assert.equal(other.unsentCount, 1);
  });

  it('closes the deploys a run of the host left unfinished', async () => {
    const offline = async () => {
      throw new Error('offline');
    };
    const { journal: first, reopen, layout, said } = journal(offline);
    first.begin('d1', { project: 'city', env: 'prod', action: 'activate' }, 'sig');
    await first.progress('d1', 'activating');
    await first.finish('d0', 'active', {});
    fs.mkdirSync(path.join(layout.instancesDir, 'city-prod'), { recursive: true });
    fs.writeFileSync(path.join(layout.instancesDir, 'city-prod', 'current'), 'r-old\n');

    const next = reopen();
    next.closeInterrupted();
    assert.equal(next.get('d1').phase, 'failed');
    assert.equal(
      next.get('d1').error,
      'the host restarted during the deploy (phase activating); r-old is active',
    );
    assert.equal(next.get('d0').phase, 'active');
    assert.ok(said.includes('deploy-interrupted'));
    assert.deepEqual(
      onDisk(layout.outbox).statuses.map((status) => `${status.deployId}:${status.phase}`),
      ['d0:active', 'd1:failed'],
    );
  });

  it('keeps a status that is queued while the earlier ones are being sent', async () => {
    let cabinetUp = false;
    let release;
    const held = new Promise((resolve) => {
      release = resolve;
    });
    const cabinet = async (status) => {
      if (!cabinetUp) throw new Error('offline');
      if (status.deployId === 'd1') await held;
    };
    const { journal: book, layout, sent } = journal(cabinet);
    await book.finish('d1', 'active', {});
    cabinetUp = true;
    // the timer and the poll loop both start a round: there is one
    const round = book.sendUnsent();
    assert.equal(book.sendUnsent(), round);
    cabinetUp = false;
    await book.finish('d2', 'failed', { error: 'x' });
    cabinetUp = true;
    release();
    await round;
    assert.deepEqual(
      onDisk(layout.outbox).statuses.map((status) => status.deployId),
      ['d2'],
    );
    await book.sendUnsent();
    assert.equal(book.unsentCount, 0);
    assert.deepEqual(
      sent.map((status) => status.deployId),
      ['d1', 'd2'],
    );
  });

  it('remembers the last five hundred deploys', () => {
    const { journal: book } = journal();
    for (let index = 0; index < 505; index++) book.record(`d${index}`, { phase: 'active' });
    assert.equal(book.get('d4'), null);
    assert.equal(book.get('d5').phase, 'active');
    assert.equal(book.get('d504').phase, 'active');
    book.record('', { phase: 'active' });
    assert.equal(Object.keys(book.records.deploys).length, 500);
  });
});

describe('ports of the host', () => {
  const instance = (name, ports, running = true) => ({
    name,
    meta: {},
    currentId: running ? 'release' : null,
    ports: () => ports,
  });
  const portsOf = (instances, previews = null) =>
    new Ports({
      instances: new Map(instances.map((item) => [item.name, item])),
      log: { info() {} },
      previews,
    });

  it('gives a preview the first pair no instance holds', async () => {
    const taken = instance('city-preview-a', { port: 47962, httpPort: 47963 }, false);
    const ports = portsOf([taken], [47962, 47967]);
    assert.deepEqual(await ports.forPreview(), { port: 47964, httpPort: 47965 });
  });

  it('refuses a preview when the range is used up', async () => {
    const taken = instance('city-preview-a', { port: 47962, httpPort: 47963 });
    await assert.rejects(portsOf([taken], [47962, 47963]).forPreview(), (error) => {
      assert.ok(error instanceof HostError);
      assert.equal(error.code, 'no-ports');
      return true;
    });
  });

  it('refuses a release whose ports another running instance holds', () => {
    const prod = instance('city-prod', { port: 47788, httpPort: 47789 });
    const idle = instance('other-prod', { port: 47800, httpPort: 47801 }, false);
    const mine = instance('city-test', null);
    const ports = portsOf([prod, idle, mine]);
    assert.throws(
      () => ports.checkFree(mine, { port: 47789, httpPort: 47790 }),
      /port 47789 is already taken by instance city-prod/,
    );
    ports.checkFree(mine, { port: 47800, httpPort: 47801 });
    ports.checkFree(prod, { port: 47788, httpPort: 47789 });
  });
});
