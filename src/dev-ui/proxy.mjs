// for dev servers that cannot take the Vite plugin (create-react-app, webpack-dev-server)
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { injectFirstScripts, shimUrl } from './html.mjs';
import { answerFromFallback, isLoopbackHost, loopbackHttpUrl, shimHandler } from './serve.mjs';

function upstreamHeaders(rawHeaders, hostHeader) {
  const headers = {};
  for (let i = 0; i + 1 < rawHeaders.length; i += 2) {
    const name = rawHeaders[i];
    const lower = name.toLowerCase();
    if (lower === 'host' || lower === 'accept-encoding') continue;
    if (headers[name] !== undefined) headers[name] = [].concat(headers[name], rawHeaders[i + 1]);
    else headers[name] = rawHeaders[i + 1];
  }
  headers.host = hostHeader;
  // pages get rewritten here, and over loopback compression buys nothing
  headers['accept-encoding'] = 'identity';
  return headers;
}

function isHtml(headers) {
  return /^\s*text\/html\b/i.test(String(headers['content-type'] || ''));
}

export async function startDevUiProxy(options = {}) {
  const log = options.log || (() => {});
  const upstream = loopbackHttpUrl(options.upstream, 'upstream');
  const fallback = options.fallback ? loopbackHttpUrl(options.fallback, 'fallback') : null;
  const host = options.host || '127.0.0.1';
  if (!isLoopbackHost(host)) {
    throw new Error(
      t('host: the proxy listens only on 127.0.0.1, localhost or ::1, not {host}', { host }),
    );
  }
  const port = Number(options.port ?? 0);
  if (!Number.isInteger(port) || port < 0 || port > 65535)
    throw new Error(t('port: {port} is not a port number', { port: options.port }));
  const cwd = options.cwd || process.cwd();
  const files = [].concat(options.shims || []).map((file) => path.resolve(cwd, String(file)));
  const shimSources = files.map((_, index) => shimUrl(index));
  const upstreamHost = upstream.hostname.replace(/^\[|\]$/g, '');
  const serveShim = shimHandler(() => files, log);

  const fail = (res, target, error) => {
    const text = t('{url} is not answering ({reason})', {
      url: target.href,
      reason: error.code || error.message,
    });
    log(text);
    if (res.headersSent) {
      res.destroy();
      return;
    }
    // the game retries a failed page by itself
    res.writeHead(502, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(`varion dev-ui: ${text}\n`);
  };

  const forward = (req, res) => {
    const request = http.request(
      {
        host: upstreamHost,
        port: upstream.port,
        method: req.method,
        path: req.url,
        headers: upstreamHeaders(req.rawHeaders, upstream.host),
      },
      (answer) => {
        const status = answer.statusCode || 502;
        if (status === 404 && fallback && (req.method === 'GET' || req.method === 'HEAD')) {
          answer.resume();
          answerFromFallback(fallback, req, res, (error) => fail(res, fallback, error));
          return;
        }
        if (
          req.method === 'GET' &&
          status === 200 &&
          isHtml(answer.headers) &&
          shimSources.length > 0
        ) {
          const chunks = [];
          answer.on('data', (chunk) => chunks.push(chunk));
          answer.on('end', () => {
            const page = Buffer.from(
              injectFirstScripts(Buffer.concat(chunks).toString('utf8'), shimSources),
              'utf8',
            );
            const headers = {
              ...answer.headers,
              'content-length': String(page.length),
              'cache-control': 'no-store',
            };
            // not the dev server's bytes any more, so none of its validators
            for (const name of ['transfer-encoding', 'content-encoding', 'etag', 'last-modified'])
              delete headers[name];
            res.writeHead(status, headers);
            res.end(page);
          });
          answer.on('error', () => res.destroy());
          return;
        }
        res.writeHead(status, answer.headers);
        answer.pipe(res);
      },
    );
    request.on('error', (error) => fail(res, upstream, error));
    req.pipe(request);
  };

  const server = http.createServer((req, res) => serveShim(req, res, () => forward(req, res)));
  const sockets = new Set();
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });

  // hot reload: the dev server's WebSocket, passed through as is
  server.on('upgrade', (req, socket, head) => {
    sockets.add(socket);
    const tunnel = net.connect(Number(upstream.port), upstreamHost, () => {
      const lines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];
      for (let i = 0; i + 1 < req.rawHeaders.length; i += 2) {
        const name = req.rawHeaders[i];
        lines.push(
          `${name}: ${name.toLowerCase() === 'host' ? upstream.host : req.rawHeaders[i + 1]}`,
        );
      }
      tunnel.write(`${lines.join('\r\n')}\r\n\r\n`);
      if (head && head.length) tunnel.write(head);
      tunnel.pipe(socket);
      socket.pipe(tunnel);
    });
    sockets.add(tunnel);
    tunnel.on('close', () => {
      sockets.delete(tunnel);
      socket.destroy();
    });
    socket.on('close', () => tunnel.destroy());
    tunnel.on('error', (error) => {
      log(t('UI dev server WebSocket: {reason}', { reason: error.code || error.message }));
      socket.destroy();
    });
    socket.on('error', () => tunnel.destroy());
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve();
    });
  });
  const address = server.address();
  const shownHost = address.family === 'IPv6' ? `[${address.address}]` : address.address;
  const url = `http://${shownHost}:${address.port}/`;
  log(
    files.length
      ? t('pages for the game: {url} -> {upstream} (shims first: {shims})', {
          url,
          upstream: upstream.href,
          shims: files.join(', '),
        })
      : t('pages for the game: {url} -> {upstream}', { url, upstream: upstream.href }),
  );
  return {
    url,
    server,
    close: () =>
      new Promise((resolve) => {
        for (const socket of sockets) socket.destroy();
        server.close(() => resolve());
      }),
  };
}
