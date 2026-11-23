import dgram from 'node:dgram';
import net from 'node:net';
import { t } from '../i18n/index.mjs';
import { HostError } from './errors.mjs';

export function parsePortRange(text) {
  const match = /^(\d{1,5})-(\d{1,5})$/.exec(String(text || '').trim());
  const from = match ? Number(match[1]) : NaN;
  const to = match ? Number(match[2]) : NaN;
  if (!match || from < 1024 || to > 65535 || to - from < 1) {
    throw new HostError(
      t(
        '--preview-ports: expected a range like 7962-7999 (each preview takes a game port and the next one for HTTP)',
      ),
      'usage',
    );
  }
  return [from, to];
}

function udpFree(port) {
  return new Promise((resolve) => {
    const socket = dgram.createSocket('udp4');
    socket.once('error', () => {
      socket.close();
      resolve(false);
    });
    socket.bind(port, '127.0.0.1', () => socket.close(() => resolve(true)));
  });
}

function tcpFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.listen({ port, host: '127.0.0.1', exclusive: true }, () =>
      server.close(() => resolve(true)),
    );
  });
}

// Which instance of the host listens where. `previews` is the range previews take their
// ports from, or null when the host runs none.
export class Ports {
  constructor({ instances, log, previews = null }) {
    this.instances = instances;
    this.log = log;
    this.previews = previews;
  }

  // A free pair of ports for a new preview.
  async forPreview() {
    const [from, to] = this.previews;
    const used = new Set();
    for (const instance of this.instances.values()) {
      const ports = instance.ports();
      if (ports) {
        used.add(ports.port);
        used.add(ports.httpPort);
      }
    }
    for (let port = from; port + 1 <= to; port += 2) {
      if (used.has(port) || used.has(port + 1)) continue;
      if ((await udpFree(port)) && (await tcpFree(port + 1))) return { port, httpPort: port + 1 };
    }
    throw new HostError(t('no free preview ports in {from}-{to}', { from, to }), 'no-ports');
  }

  // A test server and the main one usually come from the same varion.toml, ports and all. On one
  // host the test server then gets the next free pair by itself, and keeps it; the main server
  // never moves: players and firewalls know its ports.
  async settle(instance, settings) {
    if (instance.meta.preview || instance.meta.env === 'prod') return;
    const taken = new Set();
    for (const other of this.instances.values()) {
      const ports = other === instance ? null : other.ports();
      if (ports && other.currentId) taken.add(ports.port).add(ports.httpPort);
    }
    if (!taken.has(settings.port) && !taken.has(settings.httpPort)) return;
    for (let port = settings.port + 2; port + 1 <= 65535 && port < settings.port + 200; port += 2) {
      if (taken.has(port) || taken.has(port + 1)) continue;
      if (!(await udpFree(port)) || !(await tcpFree(port + 1))) continue;
      instance.meta.ports = { port, httpPort: port + 1 };
      instance.saveMeta();
      this.log.info(
        t(
          '{instance}: ports {wanted} are taken by another server of this host, so it runs on {port}/{httpPort}',
          {
            instance: instance.name,
            wanted: `${settings.port}/${settings.httpPort}`,
            port,
            httpPort: port + 1,
          },
        ),
        { instance: instance.name, ports: instance.meta.ports },
        'ports-moved',
      );
      return;
    }
  }

  // Throws when another running instance of this host holds one of the ports.
  checkFree(instance, settings) {
    const mine = new Set([settings.port, settings.httpPort]);
    for (const other of this.instances.values()) {
      if (other === instance) continue;
      const ports = other.ports();
      if (!ports || !other.currentId) continue;
      for (const port of [ports.port, ports.httpPort]) {
        if (mine.has(port)) {
          throw new HostError(
            t('port {port} is already taken by instance {name} of this host', {
              port,
              name: other.name,
            }),
            'port-conflict',
          );
        }
      }
    }
  }
}
