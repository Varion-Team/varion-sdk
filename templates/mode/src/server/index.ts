import type { Player } from '../../types/varion-server';
import { CHAT_MAX_LENGTH } from '../shared/events';
import { emitAllClients, emitClient, onClient, onRpc } from './net';
import { addVisit, closeStorage, openStorage } from './storage';

// [config] from varion.toml
interface Config {
  messagesPerSecond?: number;
  spawnX?: number;
  spawnY?: number;
  spawnZ?: number;
  spawnHeading?: number;
  spawnModel?: string;
}

const TITLE = '__TITLE_TS__';
const RESOURCE: string = varion.resourceName;
const config = varion.getResourceConfig() as Config;
const spawnPoint = {
  x: config.spawnX ?? 211.0,
  y: config.spawnY ?? -816.3,
  z: config.spawnZ ?? 30.7,
};

// a real mode should key players by their verified account, not by name
const keyOf = (player: Player): string => player.name || `player-${player.id}`;

const recentMessages = new Map<string, number[]>();

function messageAllowed(key: string): boolean {
  const now = Date.now();
  const recent = (recentMessages.get(key) ?? []).filter((at) => now - at < 1000);
  if (recent.length >= (config.messagesPerSecond ?? 3)) return false;
  recent.push(now);
  recentMessages.set(key, recent);
  return true;
}

varion.on(varion.Event.resourceStart, () => {
  void openStorage().then(
    (where) => varion.log(`[${RESOURCE}] storage: ${where}`),
    (error) => varion.logError(`[${RESOURCE}] storage is unavailable: ${error}`),
  );
  varion.log(`[${RESOURCE}] mode started: ${TITLE}`);
  // restarted on the fly: players are already in the world
  for (const player of varion.getPlayers()) {
    if (player.isReady) emitClient(player, '__NAME__:welcome');
  }
});

varion.on(varion.Event.playerReady, async (player) => {
  // rot is in radians, the spawn faces it
  player.rot = { x: 0, y: 0, z: ((config.spawnHeading ?? 157) * Math.PI) / 180 };
  player.spawn(config.spawnModel ?? 'mp_m_freemode_01', spawnPoint);
  emitClient(player, '__NAME__:welcome');

  let greeting = `Welcome, ${player.name}!`;
  try {
    const visits = await addVisit(keyOf(player));
    if (visits > 1) greeting = `Welcome back, ${player.name}! Visit ${visits}.`;
  } catch (error) {
    varion.logError(`[${RESOURCE}] visits are not counted: ${error}`);
  }
  emitClient(player, '__NAME__:chat', { at: Date.now(), from: '', text: greeting });
});

varion.on(varion.Event.playerDisconnect, (player, reason) => {
  recentMessages.delete(keyOf(player));
  varion.log(`[${RESOURCE}] ${player.name} left: ${reason || 'connection closed'}`);
});

// the client part was restarted: its page is shown again
onClient('__NAME__:hello', (player) => {
  if (player.isReady) emitClient(player, '__NAME__:welcome');
});

// the answer tells the client whether its message went to the chat
onRpc('__NAME__:say', (player, text) => {
  // never trust what a client sends
  if (typeof text !== 'string') return { sent: false };
  const said = text.replace(/\s+/g, ' ').trim().slice(0, CHAT_MAX_LENGTH);
  if (!said || !messageAllowed(keyOf(player))) return { sent: false };
  emitAllClients('__NAME__:chat', { at: Date.now(), from: player.name, text: said });
  return { sent: true };
});

varion.on(varion.Event.resourceStop, () => {
  void closeStorage();
});
