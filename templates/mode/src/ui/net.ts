// In the game the client provides window.varion.emit; the page defines window.varion.trigger.
// In a browser (npm run ui) there is no game: emitClient only logs and simulate() fakes the client.
import type { ClientToUi, UiToClient } from '../shared/events';

type Listener = (...args: any[]) => void;

interface PageBridge {
  emit?: (name: string, ...args: unknown[]) => void;
  trigger?: (name: string, ...args: unknown[]) => void;
}

declare global {
  interface Window {
    varion?: PageBridge;
  }
}

const bridge: PageBridge = (window.varion ??= {});
const nativeEmit = typeof bridge.emit === 'function' ? bridge.emit.bind(bridge) : null;
const listeners = new Map<string, Set<Listener>>();

bridge.trigger = (name, ...args) => {
  for (const listener of listeners.get(name) ?? []) {
    try {
      listener(...args);
    } catch (error) {
      console.error(error);
    }
  }
};

export const inGame = nativeEmit !== null;

export function emitClient<K extends keyof UiToClient>(name: K, ...args: UiToClient[K]): void {
  if (nativeEmit) nativeEmit(name, ...args);
  else console.info('[page ->]', name, ...args);
}

export function onClient<K extends keyof ClientToUi>(
  name: K,
  handler: (...args: ClientToUi[K]) => void,
): () => void {
  let set = listeners.get(name);
  if (!set) listeners.set(name, (set = new Set()));
  set.add(handler as Listener);
  return () => set.delete(handler as Listener);
}

export function simulate<K extends keyof ClientToUi>(name: K, ...args: ClientToUi[K]): void {
  bridge.trigger?.(name, ...args);
}
