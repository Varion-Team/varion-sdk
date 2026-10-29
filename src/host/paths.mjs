import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { checkEntryPath } from '../shared/zip.mjs';
import { HostError } from './errors.mjs';

const INSTANCE_NAME = /^[a-z0-9][a-z0-9._-]{0,159}$/;

export function defaultRoot(env = process.env, platform = process.platform) {
  if (env.VARION_HOST_ROOT) return path.resolve(env.VARION_HOST_ROOT);
  if (platform === 'win32')
    return path.join(env.ProgramData || 'C:\\ProgramData', 'Varion', 'host');
  return '/var/lib/varion-host';
}

export function samePath(a, b, platform = process.platform) {
  const normal = (dir) =>
    platform === 'win32' ? path.resolve(dir).toLowerCase() : path.resolve(dir);
  return normal(a) === normal(b);
}

export function hostCommand(root, command) {
  const words = ['varion host', command].filter(Boolean).join(' ');
  return samePath(root, defaultRoot()) ? words : `${words} --root "${path.resolve(root)}"`;
}

export function hostLayout(root) {
  const state = path.join(root, 'state');
  return {
    root,
    hostJson: path.join(root, 'host.json'),
    tokenFile: path.join(root, 'host-token.json'),
    trustDir: path.join(root, 'trust'),
    trustFile: path.join(root, 'trust', 'deploy-keys.json'),
    stateDir: state,
    nonces: path.join(state, 'nonces.json'),
    deploys: path.join(state, 'deploys.json'),
    outbox: path.join(state, 'outbox.json'),
    status: path.join(state, 'status.json'),
    lock: path.join(state, 'host.lock'),
    stopRequest: path.join(state, 'stop'),
    downloads: path.join(state, 'downloads'),
    engineDir: path.join(root, 'engine'),
    assetsDir: path.join(root, 'cache', 'assets'),
    instancesDir: path.join(root, 'instances'),
    logsDir: path.join(root, 'logs'),
    hostLog: path.join(root, 'logs', 'host.log'),
    previewEnv: path.join(root, 'preview.env'),
  };
}

export function instanceLayout(root, name) {
  const dir = path.join(root, 'instances', name);
  return {
    dir,
    releases: path.join(dir, 'releases'),
    current: path.join(dir, 'current'),
    env: path.join(dir, '.env'),
    logs: path.join(dir, 'logs'),
    meta: path.join(dir, 'instance.json'),
    serverToml: path.join(dir, 'server.toml'),
    resources: path.join(dir, 'resources'),
    tmp: path.join(dir, '.host-tmp'),
    pidFile: path.join(dir, 'server.pid'),
  };
}

export function instanceNameFor(project, env) {
  const name = `${String(project).toLowerCase()}-${env}`;
  if (!INSTANCE_NAME.test(name))
    throw new HostError(t('instance name "{name}" is not valid', { name }), 'bad-instance');
  try {
    checkEntryPath(name);
  } catch (error) {
    throw new HostError(
      t('instance name "{name}" is not valid: {reason}', { name, reason: error.message }),
      'bad-instance',
    );
  }
  return name;
}

export function isInstanceName(name) {
  try {
    return INSTANCE_NAME.test(name) && !!checkEntryPath(name);
  } catch {
    return false;
  }
}
