import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { main } from '../../src/host/cli.mjs';
import { createLogger } from '../../src/host/log.mjs';
import { pairHost, readHostToken } from '../../src/host/pairing.mjs';
import { hostLayout } from '../../src/host/paths.mjs';
import { sleep } from '../../src/shared/fs.mjs';
import { windowsTool } from '../../src/shared/process.mjs';
import { startFakeCabinet } from './fixtures/fake-cabinet.mjs';
import { removeDir, tempDir } from './fixtures/fixtures.mjs';

const work = tempDir('varion-host-pair-');
const root = path.join(work, 'host root');
const layout = hostLayout(root);
let cabinet;

before(async () => {
  cabinet = await startFakeCabinet({ serverId: 'srv-9', serverName: 'Arena' });
});

after(async () => {
  await cabinet.close();
  removeDir(work);
});

function capture() {
  const records = [];
  const log = createLogger({ quiet: true });
  log.listen((record) => records.push(record));
  return { log, records };
}

function sink() {
  const chunks = [];
  return {
    write: (chunk) => chunks.push(String(chunk)),
    text: () => chunks.join(''),
    records: () =>
      chunks
        .join('')
        .split('\n')
        .filter((line) => line.startsWith('{'))
        .map((line) => JSON.parse(line)),
  };
}

async function until(check, what, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (!check()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await sleep(50);
  }
}

const pollsWith = (token) => cabinet.polls.filter((poll) => poll.token === token).length;

async function stopHost(running) {
  fs.writeFileSync(layout.stopRequest, 'stop\n');
  return running;
}

describe('connecting a host by code', { timeout: 180_000 }, () => {
  it('shows a code, asks for a new one when it expires, returns the token once the owner enters it', async () => {
    const { log, records } = capture();
    let started = 0;
    cabinet.onPairStart = (pair) => {
      started++;
      if (started === 1) cabinet.expirePair(pair.code);
      else cabinet.pair(pair.code);
    };
    const paired = await pairHost({
      cabinetUrl: cabinet.url,
      hostId: 'host-1',
      hostname: 'box',
      log,
      pollMs: 20,
    });
    const codes = records.filter((record) => record.event === 'pair-code');
    assert.equal(codes.length, 2);
    assert.match(codes[0].code, /^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
    assert.notEqual(codes[0].code, codes[1].code);
    assert.equal(codes[0].url, `${cabinet.url}/cabinet`);
    assert.ok(records.some((record) => record.event === 'pair-expired'));
    assert.equal(paired.serverId, 'srv-9');
    assert.equal(paired.serverName, 'Arena');
    assert.match(paired.token, /^varion_srv_[0-9a-f]{64}$/);
    assert.deepEqual(
      cabinet.pairStarts.map((pair) => [pair.hostId, pair.hostname]),
      [
        ['host-1', 'box'],
        ['host-1', 'box'],
      ],
    );
  });

  it('stops waiting when it is asked to stop, and says so when the cabinet cannot pair', async () => {
    cabinet.onPairStart = null;
    const abort = new AbortController();
    const waiting = pairHost({
      cabinetUrl: cabinet.url,
      hostId: 'host-1',
      hostname: 'box',
      log: capture().log,
      signal: abort.signal,
      pollMs: 20,
    });
    setTimeout(() => abort.abort(), 100);
    await assert.rejects(waiting, { name: 'AbortError' });

    cabinet.pairing = false;
    try {
      await assert.rejects(
        pairHost({
          cabinetUrl: cabinet.url,
          hostId: 'host-1',
          hostname: 'box',
          log: capture().log,
        }),
        (error) => error.code === 'no-pairing' && /--token/.test(error.message),
      );
    } finally {
      cabinet.pairing = true;
    }
  });

  it('varion host run without a token connects the host, keeps the token from others and runs', async () => {
    cabinet.onPairStart = (pair) => cabinet.pair(pair.code);
    const out = sink();
    const running = main(['run', '--root', root, '--cabinet', cabinet.url, '--json'], {
      out,
      err: out,
    });
    await until(() => fs.existsSync(layout.tokenFile), 'the token file');
    const saved = readHostToken(layout.tokenFile);
    await until(() => pollsWith(saved.token) > 0, 'a poll with the new token');
    assert.equal(await stopHost(running), 0, out.text());

    assert.equal(saved.cabinet, cabinet.url);
    assert.equal(saved.serverId, 'srv-9');
    assert.equal(saved.serverName, 'Arena');
    assert.ok(!out.text().includes(saved.token), 'the token is never printed');
    assert.ok(!fs.readFileSync(layout.hostLog, 'utf8').includes(saved.token));
    const records = out.records();
    const code = records.find((record) => record.event === 'pair-code');
    assert.match(code.text, new RegExp(code.code));
    assert.ok(records.some((record) => record.event === 'paired' && record.serverId === 'srv-9'));
    const status = JSON.parse(fs.readFileSync(layout.status, 'utf8'));
    assert.deepEqual(status.serverIds, ['srv-9'], 'the host serves the server it was connected to');
    if (process.platform === 'win32') {
      const acl = spawnSync(windowsTool('icacls.exe'), [layout.tokenFile], {
        encoding: 'utf8',
      }).stdout;
      assert.doesNotMatch(acl, /\(I\)/, `no permissions inherited from the folder:\n${acl}`);
    } else {
      assert.equal(fs.statSync(layout.tokenFile).mode & 0o777, 0o600);
    }
  });

  it('the next run takes the saved token and cabinet: no new code', async () => {
    const { token } = readHostToken(layout.tokenFile);
    const pairs = cabinet.pairStarts.length;
    const polls = pollsWith(token);
    const out = sink();
    const running = main(['--root', root, '--json'], { out, err: out });
    await until(() => pollsWith(token) > polls, 'a poll with the saved token');
    assert.equal(await stopHost(running), 0, out.text());
    assert.equal(cabinet.pairStarts.length, pairs);

    const report = sink();
    assert.equal(await main(['status', '--root', root, '--json'], { out: report }), 0);
    const { connection } = JSON.parse(report.text());
    assert.deepEqual(
      [connection.serverId, connection.serverName, connection.cabinet],
      ['srv-9', 'Arena', cabinet.url],
    );
    assert.ok(!report.text().includes(token));
  });

  it('a host disconnected in the cabinet: varion host pair saves a new token, the running host takes it', async () => {
    const old = readHostToken(layout.tokenFile).token;
    const polls = pollsWith(old);
    const out = sink();
    const running = main(['run', '--root', root, '--json'], { out, err: out });
    await until(() => pollsWith(old) > polls, 'a poll with the old token');
    cabinet.revokeHostToken(old);
    cabinet.onPairStart = (pair) => cabinet.pair(pair.code);
    const paired = sink();
    assert.equal(await main(['pair', '--root', root], { out: paired, err: paired }), 0);
    const fresh = readHostToken(layout.tokenFile).token;
    assert.notEqual(fresh, old);
    await until(() => pollsWith(fresh) > 0, 'a poll with the new token');
    assert.equal(await stopHost(running), 0, out.text());
    const records = out.records();
    assert.ok(
      records.some(
        (record) => record.event === 'poll-failed' && /varion host pair/.test(record.text),
      ),
    );
    assert.ok(records.some((record) => record.event === 'token-reloaded'));
  });
});
