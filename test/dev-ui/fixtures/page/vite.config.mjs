// `vite` here serves the example page on the address a resource's [dev-ui]
// url would name; the game loads it in place of the resource's built folder.
import { fileURLToPath } from 'node:url';
import { varionDevUi } from '../../../../src/dev-ui/vite.mjs';

export default {
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [varionDevUi({ shims: ['./page-shim.js'] })],
  server: { host: '127.0.0.1', port: 7935, strictPort: true },
};
