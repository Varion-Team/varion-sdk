// @varion/sdk/dev-ui: the game takes a mode's page from its dev server, with hot reload
export { SHIM_PREFIX, injectFirstScripts, shimUrl } from './html.mjs';
export { startDevUiProxy } from './proxy.mjs';
export { isLoopbackHost } from './serve.mjs';
export { varionDevUi } from './vite.mjs';
export {
  devUiOptIn,
  devUiRoot,
  devUiTable,
  devUiUrl,
  withDevUiTable,
  withoutDevUiTable,
} from './declaration.mjs';
