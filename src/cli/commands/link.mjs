import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pairHost } from '../../host/pairing.mjs';
import { t } from '../../i18n/index.mjs';
import { writeFileAtomic } from '../../shared/fs.mjs';
import { parseArgs } from '../args.mjs';
import { CliError } from '../output.mjs';
import { cabinetOption, noArguments, openBrowser } from './login.mjs';

const TOKEN_FILE = path.join('data', 'masterlist-token.txt');

// server.toml with the two keys that put a server in touch with the list, among its top-level
// keys: a key that is there is rewritten, one that is not goes before the first table. The
// rest of the file stays as it was.
export function withListing(text, masterListUrl) {
  const eol = /\r\n/.test(text) ? '\r\n' : '\n';
  const lines = String(text).split(/\r?\n/);
  let end = lines.findIndex((line) => /^\s*\[/.test(line));
  if (end < 0) end = lines.length;
  const wanted = [
    ['announce', 'true'],
    ['masterListUrl', JSON.stringify(masterListUrl)],
  ];
  for (const [key, value] of wanted) {
    const at = lines.findIndex(
      (line, index) => index < end && new RegExp(`^\\s*${key}\\s*=`).test(line),
    );
    if (at >= 0) lines[at] = `${key} = ${value}`;
    else {
      // after the last key of the head, not after the blank lines that close it
      let place = end;
      while (place > 0 && !lines[place - 1].trim()) place -= 1;
      lines.splice(place, 0, `${key} = ${value}`);
      end += 1;
    }
  }
  return lines.join(eol);
}

// The id this folder's server has for the cabinet: the same on every run, so linking again
// replaces the link instead of adding one.
function machineId(dir) {
  const digest = crypto.createHash('sha256').update(`${os.hostname()}\n${dir}`).digest('hex');
  return `manual-${digest.slice(0, 24)}`;
}

// `varion link`: for a server that is started by hand, without `varion host`. One confirmation
// in the cabinet, and the server announces itself to the list on its next start: no key is
// copied into server.toml.
export async function run(argv, { output: root }) {
  const { options, positionals } = parseArgs(argv, {
    command: 'link',
    options: {
      cabinet: 'string',
      cwd: 'string',
      config: 'string',
      'no-browser': 'boolean',
      json: 'boolean',
    },
    aliases: { C: 'cwd' },
  });
  noArguments('varion link', positionals);
  const output = root.child('link');
  const dir = path.resolve(options.cwd || process.cwd());
  const config = path.resolve(dir, options.config || 'server.toml');
  if (!fs.existsSync(config)) {
    throw new CliError(
      t('no server.toml in {dir}: run varion link in the folder of the server', { dir }),
      { code: 'no_server_toml' },
    );
  }
  const cabinet = cabinetOption(options);
  const base = path.dirname(config);
  const log = {
    info: (text, data, code) => {
      output.event(code || 'link', data || {}, `[link] ${text}`);
      if (code === 'pair-code' && data?.url && !options.noBrowser) openBrowser(data.url);
    },
    warn: (text) => output.warn(text),
  };
  const paired = await pairHost({
    cabinetUrl: cabinet,
    hostId: machineId(base),
    hostname: os.hostname(),
    log,
  });
  writeFileAtomic(path.join(base, TOKEN_FILE), paired.token, { mode: 0o600 });
  const url = `${cabinet.replace(/\/+$/, '')}/api`;
  fs.writeFileSync(config, withListing(fs.readFileSync(config, 'utf8'), url));
  output.event(
    'linked',
    { serverId: paired.serverId, serverName: paired.serverName, config },
    output.paint(
      'green',
      `[link] ${t(
        'this server is {name} in the cabinet now: start it, and it is in the list once the review is passed',
        { name: paired.serverName || paired.serverId },
      )}`,
    ),
  );
  return 0;
}
