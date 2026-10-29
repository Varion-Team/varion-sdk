import type { Player } from '../../types/varion-server';
import { emitAllClients, emitClient, onClient, onRpc } from './net';
import { addClick, clicksOf, closeStorage, openStorage } from './storage';

// [config] from varion.toml
interface Config {
  clicksPerSecond?: number;
  spawnX?: number;
  spawnY?: number;
  spawnZ?: number;
  spawnHeading?: number;
  spawnModel?: string;
}

const TITLE = '__TITLE_TS__';
const GREETING = 'Welcome';
const RESOURCE: string = varion.resourceName;
const config = varion.getResourceConfig() as Config;
const startedAt = Date.now();
const spawnPoint = {
  x: config.spawnX ?? 211.0,
  y: config.spawnY ?? -816.3,
  z: config.spawnZ ?? 30.7,
};

// a real mode should key players by their verified account, not by name
const keyOf = (player: Player): string => player.name || `player-${player.id}`;

async function welcome(player: Player): Promise<void> {
  emitClient(player, '__NAME__:welcome', {
    title: TITLE,
    greeting: GREETING,
    name: player.name,
    online: varion.getPlayerCount(),
    clicks: await clicksOf(keyOf(player)),
  });
}

const recentClicks = new Map<string, number[]>();

function clickAllowed(key: string): boolean {
  const now = Date.now();
  const recent = (recentClicks.get(key) ?? []).filter((at) => now - at < 1000);
  if (recent.length >= (config.clicksPerSecond ?? 5)) return false;
  recent.push(now);
  recentClicks.set(key, recent);
  return true;
}

varion.on('resourceStart', () => {
  void openStorage().then(
    (where) => varion.log(`[${RESOURCE}] storage: ${where}`),
    (error) => varion.logError(`[${RESOURCE}] storage is unavailable: ${error}`),
  );
  varion.log(`[${RESOURCE}] mode started: ${TITLE}`);
  // restarted on the fly: players are already in the world
  for (const player of varion.getPlayers()) {
    if (player.isReady) void welcome(player);
  }
});

varion.on('playerReady', (player) => {
  player.spawn(spawnPoint, config.spawnHeading ?? 157, config.spawnModel ?? 'mp_m_freemode_01');
  void welcome(player);
  emitAllClients('__NAME__:online', varion.getPlayerCount());
});

varion.on('playerDisconnect', (player, reason) => {
  recentClicks.delete(keyOf(player));
  varion.log(`[${RESOURCE}] ${player.name} left: ${reason || 'connection closed'}`);
  emitAllClients('__NAME__:online', varion.getPlayers().filter((other) => other !== player).length);
});

// the client part was restarted and its page needs the state again
onClient('__NAME__:hello', (player) => {
  if (player.isReady) void welcome(player);
});

onClient('__NAME__:ping', (player, sentAt) => {
  if (typeof sentAt !== 'number') return; // never trust what a client sends
  emitClient(player, '__NAME__:pong', sentAt, Date.now());
});

onRpc('__NAME__:click', async (player) => {
  const key = keyOf(player);
  if (!clickAllowed(key)) throw new Error('too many clicks');
  return { clicks: await addClick(key) };
});

onRpc('__NAME__:status', (player) => ({
  playerId: Number(player.id),
  online: varion.getPlayerCount(),
  uptimeSec: Math.round((Date.now() - startedAt) / 1000),
}));

varion.on('resourceStop', () => {
  void closeStorage();
});
