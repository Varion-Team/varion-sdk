import type { IncomingMessage, ServerResponse } from 'node:http';

export interface DevUiOptions {
  shims?: string | readonly string[];
  fallback?: string | URL;
}
/** The hooks this SDK plugin uses; no runtime or type dependency on Vite is required. */
export interface DevUiServer {
  config: { logger: { warn(message: string): void } };
  middlewares: {
    use(handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void): unknown;
  };
  watcher: {
    add(files: string[]): unknown;
    on(event: 'change', handler: (path: string) => void): unknown;
  };
  hot?: { send(message: { type: 'full-reload'; path: string }): void };
  ws?: { send(message: { type: 'full-reload'; path: string }): void };
}
export interface DevUiPlugin {
  name: 'varion-dev-ui';
  apply: 'serve';
  configResolved(config: { root: string }): void;
  configureServer(server: DevUiServer): (() => void) | undefined;
  transformIndexHtml: { order: 'post'; handler(html: string): string };
}
export function varionDevUi(options?: DevUiOptions): DevUiPlugin;
