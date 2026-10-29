// vite.config: plugins: [varionDevUi({ shims: ['./page-shim.js'], fallback })]
// fallback: http://127.0.0.1:<http port>/assets/<resource>/<root>, for files Vite does not have
import path from 'node:path';
import { injectFirstScripts, shimUrl } from './html.mjs';
import { answerFromFallback, loopbackHttpUrl, shimHandler } from './serve.mjs';

export function varionDevUi(options = {}) {
  const shims = [].concat(options.shims || []).map(String);
  const fallback = options.fallback
    ? loopbackHttpUrl(options.fallback, 'varionDevUi fallback')
    : null;
  let files = shims.map((file) => path.resolve(file));
  return {
    name: 'varion-dev-ui',
    apply: 'serve',
    configResolved(config) {
      files = shims.map((file) => path.resolve(config.root, file));
    },
    configureServer(server) {
      const log = (line) => server.config.logger.warn(`[varion dev-ui] ${line}`);
      server.middlewares.use(shimHandler(() => files, log));
      if (files.length) {
        server.watcher.add(files);
        server.watcher.on('change', (changed) => {
          if (!files.includes(path.resolve(changed))) return;
          const hot = server.hot || server.ws;
          if (hot) hot.send({ type: 'full-reload', path: '*' });
        });
      }
      if (!fallback) return undefined;
      // runs after Vite's own middlewares; pages stay with Vite's SPA fallback
      return () => {
        server.middlewares.use((req, res, next) => {
          const pathname = (req.url || '/').split('?')[0];
          const page =
            /\.html?$|\/$/i.test(pathname) ||
            /\btext\/html\b/i.test(String(req.headers.accept || ''));
          if ((req.method !== 'GET' && req.method !== 'HEAD') || page) return next();
          answerFromFallback(fallback, req, res, (error) => {
            log(`${fallback.href}: ${error.code || error.message}`);
            if (!res.headersSent) next();
          });
          return undefined;
        });
      };
    },
    transformIndexHtml: {
      // last, so the shims land before what other plugins put into <head>
      order: 'post',
      handler(html) {
        return injectFirstScripts(
          html,
          files.map((_, index) => shimUrl(index)),
        );
      },
    },
  };
}
