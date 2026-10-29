import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { ensureAssets } from './assets.mjs';
import { loadDotenv, loadProject } from './config.mjs';
import { createManagedDatabase } from './database.mjs';
import { tcpPortFree, udpPortFree } from './net.mjs';
import { CliError } from './output.mjs';
import { syncExtraResources, writeServerFolder } from './server-config.mjs';

export function openProject(options, output) {
  const project = loadProject(options.cwd || process.cwd());
  for (const warning of project.warnings) output.warn(warning);
  return project;
}

export function checkEnvName(project, envName) {
  if (!envName || project.config.env[envName]) return;
  const known = Object.keys(project.config.env).join(', ');
  throw new CliError(
    known
      ? t('varion.toml has no [env.{name}] (there are: {known})', { name: envName, known })
      : t('varion.toml has no [env.{name}]', { name: envName }),
  );
}

// a project with a managed database and no .env gets both here
export async function prepareDotenv(project, output, { envName = null, dotenvFile = null } = {}) {
  let dotenv = loadDotenv(project.root, { envName, dotenvFile });
  const { database } = project.config;
  if (database?.managed && !dotenv.baseExists) {
    output.info(
      t('no {file}: creating the project database and writing it', {
        file: path.relative(project.root, dotenv.baseFile) || dotenv.baseFile,
      }),
    );
    await createManagedDatabase(project, output, { envFile: dotenv.baseFile });
    dotenv = loadDotenv(project.root, { envName, dotenvFile });
  }
  return dotenv;
}

export async function ensurePortsFree(settings, table = '[server]') {
  if (!(await udpPortFree(settings.port))) {
    throw new CliError(
      t('UDP port {port} is in use (another server on this computer?): change port in {table}', {
        port: settings.port,
        table,
      }),
    );
  }
  if (!(await tcpPortFree('127.0.0.1', settings.httpPort))) {
    throw new CliError(
      t(
        'TCP port {port} is in use (another server on this computer?): change httpPort in {table}',
        { port: settings.httpPort, table },
      ),
    );
  }
}

export async function populateServerFolder(
  project,
  output,
  { serverDir, settings, envValues = {}, writeEnv = true },
) {
  const { config } = project;
  const assetResources = await ensureAssets(project, output, { serverDir });
  for (const name of syncExtraResources(project, serverDir)) {
    output.warn(
      t('[resources] extra: resource {name} is neither in {dir}/ nor in {serverDir}/resources', {
        name,
        dir: path.relative(project.root, config.resources.dir) || 'resources',
        serverDir: path.relative(project.root, serverDir),
      }),
    );
  }
  const resources = writeServerFolder(serverDir, {
    settings,
    gamemode: config.project.name,
    assetResources,
    lists: config.resources.lists,
    extra: config.resources.extra,
    envValues,
  });
  if (!writeEnv) fs.rmSync(path.join(serverDir, '.env'), { force: true });
  return resources;
}

export function connectHost(settings) {
  return !settings.host || settings.host === '0.0.0.0' || settings.host === '::'
    ? '127.0.0.1'
    : settings.host;
}
