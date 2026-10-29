import path from 'node:path';
import { spawn } from 'node:child_process';
import { t } from '../../i18n/index.mjs';
import { parseArgs } from '../args.mjs';
import { loadDotenv } from '../config.mjs';
import {
  databaseEnvKeys,
  ensureDatabaseRunning,
  ensureMariaDb,
  managedState,
  stopManagedDb,
} from '../database.mjs';
import { reachable } from '../net.mjs';
import { CliError } from '../output.mjs';
import { openProject, prepareDotenv } from '../prepare.mjs';

export async function run(argv, { output: root }) {
  const { options, positionals } = parseArgs(argv, {
    command: 'db',
    options: { json: 'boolean', cwd: 'string', dotenv: 'string' },
    aliases: { C: 'cwd' },
  });
  const output = root.child('db');
  const project = openProject(options, output);
  const { database } = project.config;
  if (!database) throw new CliError(t('varion.toml has no [database]'));
  const action = positionals[0] || 'status';
  if (action === 'status') {
    const managed = managedState(project);
    const dotenv = loadDotenv(project.root, { dotenvFile: options.dotenv });
    const keys = databaseEnvKeys(database, dotenv.values);
    const host = dotenv.values[keys.host] || database.host;
    const port = Number(dotenv.values[keys.port] || database.port);
    const up = await reachable(host, port);
    const state = up
      ? t('database {host}:{port} is up', { host, port })
      : t('database {host}:{port} does not answer', { host, port });
    let kind;
    if (managed) {
      kind = t('project database: {dir} (MariaDB {version}), database {database}', {
        dir: path.relative(project.root, managed.dataDir),
        version: managed.mariadb,
        database: managed.database,
      });
    } else if (database.managed) {
      kind = t(
        'the project database is not set up yet (varion dev sets it up when there is no .env)',
      );
    } else {
      kind = t('your own database');
    }
    output.event(
      'database',
      {
        host,
        port,
        running: up,
        managed: Boolean(managed),
        database: dotenv.values[keys.name] || database.name,
        envFile: dotenv.baseExists ? dotenv.baseFile : null,
      },
      `[${output.prefix}] ${state}\n[${output.prefix}] ${kind}`,
    );
    return 0;
  }
  if (action === 'start') {
    const dotenv = await prepareDotenv(project, output, { dotenvFile: options.dotenv });
    await ensureDatabaseRunning(project, dotenv.values, output);
    return 0;
  }
  if (action === 'stop') {
    await stopManagedDb(project, output);
    return 0;
  }
  if (action === 'shell') {
    const managed = managedState(project);
    if (!managed) throw new CliError(t('the project has no database of its own in .varion/db'));
    const bin = await ensureMariaDb(output);
    const child = spawn(
      path.join(bin, 'mariadb.exe'),
      [`--defaults-extra-file=${managed.rootCnf}`, managed.database],
      { stdio: 'inherit' },
    );
    return new Promise((resolve) => child.on('close', (code) => resolve(code ?? 1)));
  }
  throw new CliError(
    t('{command}: unknown subcommand "{name}" (there are {list})', {
      command: 'varion db',
      name: action,
      list: 'status, start, stop, shell',
    }),
  );
}
