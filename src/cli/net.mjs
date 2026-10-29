import dgram from 'node:dgram';
import net from 'node:net';
import { sleep } from '../shared/fs.mjs';

export function reachable(host, port, timeoutMs = 1000) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: timeoutMs });
    const done = (answer) => {
      socket.destroy();
      resolve(answer);
    };
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

export async function waitReachable(host, port, { timeoutMs = 30000, stepMs = 500, alive } = {}) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    if (await reachable(host, port)) return true;
    if (alive && !alive()) return false;
    await sleep(stepMs);
  }
  return false;
}

export function tcpPortFree(host, port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.listen({ host, port, exclusive: true }, () => server.close(() => resolve(true)));
  });
}

// loopback only: a socket on every interface brings up the windows firewall prompt
export function udpPortFree(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: false });
    socket.once('error', () => {
      socket.close();
      resolve(false);
    });
    socket.bind({ port, address: host, exclusive: true }, () => socket.close(() => resolve(true)));
  });
}
