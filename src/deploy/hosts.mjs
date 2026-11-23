import path from 'node:path';
import { isBoxPublicKey } from '../shared/box.mjs';
import { tryReadJson, writeJsonAtomic } from '../shared/fs.mjs';
import { configDir } from './keys.mjs';
import { cabinetBase } from './transport.mjs';

const KNOWN_HOSTS_FILE = 'known-hosts.json';

// The machines this computer has sealed releases for, by cabinet and server. The key comes
// through the cabinet, so it is remembered: a different key later is a different machine, or
// someone in the middle, and a person decides which.
export function knownHostsFile(env = process.env) {
  return path.join(configDir(env), KNOWN_HOSTS_FILE);
}

function readKnownHosts(env) {
  const data = tryReadJson(knownHostsFile(env), null);
  const cabinets = data?.format === 1 ? data.cabinets : null;
  return cabinets && typeof cabinets === 'object' && !Array.isArray(cabinets) ? cabinets : {};
}

export function knownHost(cabinetUrl, serverId, { env = process.env } = {}) {
  const servers = readKnownHosts(env)[cabinetBase(cabinetUrl)];
  const entry = servers && Object.hasOwn(servers, serverId) ? servers[serverId] : null;
  return entry && isBoxPublicKey(entry.boxKey) ? entry : null;
}

export function rememberHost(
  cabinetUrl,
  serverId,
  { boxKey, hostId = '' },
  { env = process.env, now = new Date() } = {},
) {
  const cabinets = readKnownHosts(env);
  const base = cabinetBase(cabinetUrl);
  cabinets[base] = {
    ...(cabinets[base] || {}),
    [serverId]: { boxKey, hostId, since: now.toISOString() },
  };
  writeJsonAtomic(knownHostsFile(env), { format: 1, cabinets }, { mode: 0o600 });
}
