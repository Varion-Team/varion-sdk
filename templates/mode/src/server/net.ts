import type { Player } from '../../types/varion-server';
import type { ClientToServer, ServerRpc, ServerToClient } from '../shared/events';

type RpcArgs<K extends keyof ServerRpc> = ServerRpc[K]['args'];
type RpcResult<K extends keyof ServerRpc> = ServerRpc[K]['result'];

export function emitClient<K extends keyof ServerToClient>(
  player: Player,
  name: K,
  ...args: ServerToClient[K]
): void {
  player.emit(name as string, ...args);
}

export function emitAllClients<K extends keyof ServerToClient>(
  name: K,
  ...args: ServerToClient[K]
): void {
  varion.emitAllClients(name as string, ...args);
}

// types describe what a client should send, not what it does: validate the values
export function onClient<K extends keyof ClientToServer>(
  name: K,
  handler: (player: Player, ...args: ClientToServer[K]) => void,
): void {
  varion.onClient(name, handler as (player: Player, ...args: any[]) => void);
}

// the returned value is the answer, a thrown error is sent back as the error
export function onRpc<K extends keyof ServerRpc>(
  name: K,
  handler: (player: Player, ...args: RpcArgs<K>) => RpcResult<K> | Promise<RpcResult<K>>,
): void {
  varion.onRpc(name as string, handler as (player: Player, ...args: any[]) => any);
}
