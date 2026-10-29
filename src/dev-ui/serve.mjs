import fs from 'node:fs';
import http from 'node:http';
import { t } from '../i18n/index.mjs';
import { SHIM_PREFIX } from './html.mjs';

// the game loads pages only from a dev server on this computer, so nothing listens wider
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

export function isLoopbackHost(host) {
  return LOOPBACK_HOSTS.has(String(host || '').toLowerCase());
}

export function loopbackHttpUrl(text, what) {
  let url;
  try {
    url = new URL(String(text));
  } catch {
    throw new Error(t('{what}: "{url}" is not a URL', { what, url: text }));
  }
  if (url.protocol !== 'http:' || !isLoopbackHost(url.hostname) || !url.port) {
    throw new Error(
      t('{what}: needs http://127.0.0.1:<port> (or localhost, [::1]), not {url}', {
        what,
        url: text,
      }),
    );
  }
  return url;
}

// the shims are read at every request, so an edit shows on the next page load
export function shimHandler(files, log = () => {}) {
  return (req, res, next) => {
    const path = (req.url || '').split('?')[0];
    if (!path.startsWith(SHIM_PREFIX) || (req.method !== 'GET' && req.method !== 'HEAD'))
      return next();
    const match = /^(\d+)\.js$/.exec(path.slice(SHIM_PREFIX.length));
    const file = match ? files()[Number(match[1])] : undefined;
    if (!file) return next();
    fs.readFile(file, (error, body) => {
      if (error) {
        const reason = error.code || error.message;
        log(t('the page will not get the shim {file}: {reason}', { file, reason }));
        res.writeHead(500, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        res.end(`varion dev-ui: ${file}: ${reason}\n`);
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Content-Length': body.length,
        'Cache-Control': 'no-store',
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    });
  };
}

export function answerFromFallback(base, req, res, onError) {
  const relative = String(req.url || '/').replace(/^\/+/, '');
  const target = new URL(relative, base.href.endsWith('/') ? base.href : `${base.href}/`);
  const upstream = http.request(
    {
      host: target.hostname.replace(/^\[|\]$/g, ''),
      port: target.port,
      method: req.method,
      path: target.pathname + target.search,
      headers: { accept: req.headers.accept || '*/*', 'accept-encoding': 'identity' },
    },
    (answer) => {
      const headers = { ...answer.headers };
      headers['cache-control'] = 'no-store';
      res.writeHead(answer.statusCode || 502, headers);
      answer.pipe(res);
    },
  );
  upstream.on('error', (error) => onError(error));
  upstream.end();
}
