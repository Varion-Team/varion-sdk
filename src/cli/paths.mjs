import os from 'node:os';
import path from 'node:path';

export function varionHome(env = process.env) {
  if (env.VARION_HOME) return path.resolve(env.VARION_HOME);
  if (process.platform === 'win32') {
    return path.join(env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Varion');
  }
  return path.join(env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'), 'varion');
}

export function toolsDir(env = process.env) {
  return path.join(varionHome(env), 'tools');
}

export function assetCacheDir(env = process.env) {
  return path.join(varionHome(env), 'cache', 'assets');
}

export function gameLogsDir(env = process.env) {
  if (env.VARION_DEV_GAME_LOGS) return path.resolve(env.VARION_DEV_GAME_LOGS);
  return path.join(
    env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
    'Varion',
    'logs',
  );
}

export function projectPaths(root) {
  const work = path.join(root, '.varion');
  return {
    root,
    work,
    server: path.join(work, 'server'),
    maps: path.join(work, 'maps'),
    engine: path.join(work, 'engine'),
    db: path.join(work, 'db'),
    dbData: path.join(work, 'db', 'data'),
    deploy: path.join(work, 'deploy'),
    releases: path.join(work, 'releases'),
    tsc: path.join(work, 'tsc'),
  };
}
