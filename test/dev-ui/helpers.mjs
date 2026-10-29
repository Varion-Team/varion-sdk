import crypto from 'node:crypto';
import net from 'node:net';

// VARION_DEV_UI_TEST_PORT_BASE=<n> takes n, n+1, ...; otherwise the system picks
export function testPort(offset) {
  const base = Number(process.env.VARION_DEV_UI_TEST_PORT_BASE || 0);
  return base ? base + offset : 0;
}

export function acceptKey(key) {
  return crypto
    .createHash('sha1')
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest('base64');
}

// unmasked frames from a server: [messages, rest of the buffer]
function readFrames(buffer) {
  const messages = [];
  let at = 0;
  for (;;) {
    if (buffer.length - at < 2) break;
    const opcode = buffer[at] & 0x0f;
    let length = buffer[at + 1] & 0x7f;
    let header = 2;
    if (length === 126) {
      if (buffer.length - at < 4) break;
      length = buffer.readUInt16BE(at + 2);
      header = 4;
    } else if (length === 127) {
      if (buffer.length - at < 10) break;
      length = Number(buffer.readBigUInt64BE(at + 2));
      header = 10;
    }
    if (buffer.length - at < header + length) break;
    if (opcode === 1)
      messages.push(buffer.subarray(at + header, at + header + length).toString('utf8'));
    at += header + length;
  }
  return [messages, buffer.subarray(at)];
}

export function connectWebSocket(url, { protocol } = {}) {
  const target = new URL(url);
  const key = crypto.randomBytes(16).toString('base64');
  return new Promise((resolve, reject) => {
    const socket = net.connect(Number(target.port), target.hostname.replace(/^\[|\]$/g, ''));
    let buffer = Buffer.alloc(0);
    let open = false;
    const messages = [];
    const waiters = [];
    const settle = () => {
      for (const waiter of [...waiters]) {
        const found = messages.find(waiter.predicate);
        if (found !== undefined) {
          waiters.splice(waiters.indexOf(waiter), 1);
          clearTimeout(waiter.timer);
          waiter.resolve(found);
        }
      }
    };
    const client = {
      messages,
      next(predicate, ms = 10000) {
        const found = messages.find(predicate);
        if (found !== undefined) return Promise.resolve(found);
        return new Promise((done, fail) => {
          const waiter = { predicate, resolve: done };
          waiter.timer = setTimeout(() => {
            waiters.splice(waiters.indexOf(waiter), 1);
            fail(
              new Error(
                `no such WebSocket message within ${ms} ms; got ${JSON.stringify(messages)}`,
              ),
            );
          }, ms);
          waiters.push(waiter);
        });
      },
      close() {
        socket.destroy();
      },
    };
    socket.on('connect', () => {
      socket.write(
        `GET ${target.pathname}${target.search} HTTP/1.1\r\nHost: ${target.host}\r\nUpgrade: websocket\r\n` +
          `Connection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n` +
          `Origin: http://${target.host}\r\n` +
          (protocol ? `Sec-WebSocket-Protocol: ${protocol}\r\n` : '') +
          '\r\n',
      );
    });
    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (!open) {
        const end = buffer.indexOf('\r\n\r\n');
        if (end < 0) return;
        const head = buffer.subarray(0, end).toString('latin1');
        buffer = buffer.subarray(end + 4);
        if (!/^HTTP\/1\.1 101/.test(head) || !head.includes(acceptKey(key))) {
          socket.destroy();
          reject(new Error(`no WebSocket handshake: ${head.split('\r\n')[0]}`));
          return;
        }
        open = true;
        resolve(client);
      }
      const [frames, rest] = readFrames(buffer);
      buffer = rest;
      messages.push(...frames);
      settle();
    });
    socket.on('error', (error) => {
      if (!open) reject(error);
    });
  });
}

export function acceptWebSocket(req, socket, text) {
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${acceptKey(req.headers['sec-websocket-key'])}\r\n\r\n`,
  );
  const payload = Buffer.from(text, 'utf8');
  socket.write(Buffer.concat([Buffer.from([0x81, payload.length]), payload]));
}

export async function listen(server, port) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return `http://127.0.0.1:${server.address().port}`;
}
