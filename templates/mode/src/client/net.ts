import type { VarionEventHandle, WebView } from '../../types/varion-client';
import type {
  ClientToServer,
  ClientToUi,
  ServerRpc,
  ServerToClient,
  UiToClient,
} from '../shared/events';

export function emitServer<K extends keyof ClientToServer>(
  name: K,
  ...args: ClientToServer[K]
): void {
  varion.emitServer(name, ...args);
}

export function onServer<K extends keyof ServerToClient>(
  name: K,
  handler: (...args: ServerToClient[K]) => void,
): VarionEventHandle {
  return varion.onServer(name, handler as (...args: any[]) => void);
}

// rejects with the server's error, or after 30 s without an answer
export function callServer<K extends keyof ServerRpc>(
  name: K,
  ...args: ServerRpc[K]['args']
): Promise<ServerRpc[K]['result']> {
  return varion.callServer(name, ...args);
}

export interface Page {
  readonly view: WebView;
  emit<K extends keyof ClientToUi>(name: K, ...args: ClientToUi[K]): void;
  on<K extends keyof UiToClient>(
    name: K,
    handler: (...args: UiToClient[K]) => void,
  ): VarionEventHandle;
}

export function page(view: WebView): Page {
  return {
    view,
    emit(name, ...args) {
      // keep a single event under 16 KB of JSON
      view.emit(name, ...args);
    },
    on(name, handler) {
      return view.on(name, handler as (...args: any[]) => void);
    },
  };
}
