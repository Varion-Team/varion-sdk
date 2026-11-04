import type { Server } from 'node:http';
export { varionDevUi } from './vite.mjs';
export type { DevUiOptions, DevUiPlugin, DevUiServer } from './vite.mjs';

export const SHIM_PREFIX: string;
export function shimUrl(index: number): string;
export function injectFirstScripts(html: string, sources?: readonly string[]): string;
export function isLoopbackHost(host: string): boolean;
export interface DevUiDeclaration {
  url: string | URL;
  root: string;
}
export interface DevUiProxyOptions {
  upstream: string | URL;
  fallback?: string | URL;
  host?: string;
  port?: number;
  cwd?: string;
  shims?: string | readonly string[];
  log?: (message: string) => void;
}
export function startDevUiProxy(
  options: DevUiProxyOptions,
): Promise<{ url: string; server: Server; close(): Promise<void> }>;
export function devUiUrl(url: string | URL): string;
export function devUiRoot(root: string): string;
export function devUiTable(declaration: DevUiDeclaration): string;
export function devUiOptIn(urls: string | readonly string[]): string;
export function withDevUiTable(toml: string, declaration: DevUiDeclaration): string;
export function withoutDevUiTable(toml: string): string;
