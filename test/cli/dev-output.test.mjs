import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { modeLine, parseServerLine, worthShowing } from '../../src/cli/server.mjs';

// a server's start, as it is printed
const start = [
  '== Varion Engine 1.0.97 ("Genesis") — protocol v26 ==',
  "[2026-11-23 19:19:20.392] [ok] [config] loaded 'D:\\mode\\.varion\\server\\server.toml'",
  '[2026-11-23 19:19:20.434] [info] [clone] VARION_NETPORT_CLONE_SYNC is set but no longer read',
  '[2026-11-23 19:19:20.437] [info] [sync] movement: packet attempts<=13/tick, items<=16384/tick',
  "[2026-11-23 19:19:20.505] [ok] [res] loaded 'my-mode' (type=js, 5 client file(s), 5 read)",
  '[2026-11-23 19:19:22.040] [info] [net] process transport identity: 3109584bbdc82a6e',
  '[2026-11-23 19:19:22.423] [info] [js] [my-mode] [host] loaded resource my-mode',
  '[2026-11-23 19:19:22.423] [info] [js] [my-mode] [my-mode] mode started: my-mode',
  '[2026-11-23 19:19:22.423] [info] [js] [my-mode] [host] started resource my-mode',
  '[2026-11-23 19:19:22.423] [ok] [runtime] JavaScript resources are ready',
];
const shown = (lines, running) =>
  lines.filter((line) => worthShowing(line, parseServerLine(line), running));

describe('varion dev: what of the server is shown', () => {
  it('shows the engine and what the mode says while the server starts', () => {
    assert.deepEqual(shown(start, false), [start[0], start[7]]);
  });

  it('shows a warning and an error whenever they come', () => {
    const bad = [
      '[2026-11-23 19:19:22.100] [warn] [network] the port is taken',
      '[2026-11-23 19:19:22.200] [error] [js] [my-mode] TypeError: x is not a function',
    ];
    assert.deepEqual(shown(bad, false), bad);
  });

  it('shows everything once the server runs', () => {
    const later = ['[2026-11-23 19:25:01.000] [info] [server] player 1 joined', ...start];
    assert.deepEqual(shown(later, true), later);
  });

  it('prints a line of the mode without the time, the level and a second name', () => {
    assert.equal(modeLine(parseServerLine(start[7])), '[my-mode] mode started: my-mode');
    assert.equal(
      modeLine(parseServerLine('[2026-11-23 19:19:22.423] [error] [js] [shop] [bank] no money')),
      '[shop] [bank] no money',
    );
    assert.equal(modeLine(parseServerLine(start[4])), null);
  });

  it('leaves the half-minute count of what was sent to the log', () => {
    const count =
      '[2026-11-23 19:27:59.009] [info] [resource] entityBatch: 275 published in 30 s, 0 entities';
    const pressure =
      '[2026-11-23 19:27:59.009] [warn] [resource] Optional entityBatch pressure (consumer backlog)';
    assert.deepEqual(shown([count, pressure], true), [pressure]);
  });
});
