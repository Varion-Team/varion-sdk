import fs from 'node:fs';
import path from 'node:path';
import { readServerSettings } from '../../../src/host/servertoml.mjs';

const argv = process.argv.slice(2);
const config = argv[argv.indexOf('--config') + 1];
const root = path.dirname(config);
const settings = readServerSettings(fs.readFileSync(config, 'utf8'));
const resourcesDir = path.join(root, 'resources');
const say = (line) => process.stdout.write(`[fake-server] ${line}\n`);

function version(name) {
  try {
    return fs.readFileSync(path.join(resourcesDir, name, 'version.txt'), 'utf8').trim();
  } catch {
    return '-';
  }
}

say(`runtime root: ${root} pid ${process.pid}`);
for (const name of settings.loaded) {
  if (fs.existsSync(path.join(resourcesDir, name, 'CRASH_ON_START'))) {
    say(`[error] resource ${name} failed: crash marker`);
    process.exit(3);
  }
  say(`[host] started resource ${name} version ${version(name)}`);
}
fs.appendFileSync(
  path.join(root, 'fake-runs.log'),
  `${process.pid} start ${settings.loaded.map((name) => `${name}@${version(name)}`).join(' ')}\n`,
);
say(
  `'${settings.name}' running | listen UDP 0.0.0.0:${settings.port} | HTTP 0.0.0.0:${settings.httpPort} | connect 127.0.0.1:${settings.port}`,
);

let rest = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  const lines = (rest + chunk).split(/\r?\n/);
  rest = lines.pop();
  for (const line of lines) {
    const [op, name] = line.trim().split(/\s+/);
    if (!['restart', 'start', 'stop'].includes(op) || !name) continue;
    say(`[console] command '${op}' argc=1`);
    let part = 'absent';
    if (settings.loaded.includes(name)) {
      if (op === 'stop') part = 'stopped';
      else if (op === 'start') part = 'started';
      else
        part = fs.existsSync(path.join(resourcesDir, name, 'FAIL_RESTART'))
          ? 'failed'
          : 'restarted';
    }
    const restarted = op === 'restart' && part === 'restarted';
    // record it before answering: the host may report the deploy as soon as it reads the answer
    if (restarted) {
      fs.appendFileSync(
        path.join(root, 'fake-runs.log'),
        `${process.pid} restart ${name}@${version(name)}\n`,
      );
    }
    say(
      `[host] ${op} ${name} (console): server part ${part}; connected clients follow through the server`,
    );
    if (restarted) say(`[host] started resource ${name} version ${version(name)}`);
  }
});
process.on('SIGTERM', () => process.exit(0));
setInterval(() => {}, 1 << 30);
