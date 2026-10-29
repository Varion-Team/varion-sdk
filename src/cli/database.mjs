import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { t } from '../i18n/index.mjs';
import {
  ensureDir,
  removeTree,
  renameWithRetry,
  tryReadJson,
  tryRemoveTree,
  writeJsonAtomic,
} from '../shared/fs.mjs';
import { download } from '../shared/http.mjs';
import { isAlive } from '../shared/process.mjs';
import { extractZip } from '../shared/zip.mjs';
import { parseDotenv, stringifyDotenv } from './config.mjs';
import { reachable, tcpPortFree, waitReachable } from './net.mjs';
import { CliError, downloadProgress } from './output.mjs';
import { toolsDir } from './paths.mjs';
import { runProgram } from './proc.mjs';

export const MARIADB = Object.freeze({
  version: '11.8.9',
  // from sha256sums.txt next to the archive
  sha256: '830c46727d9278eae212ae3eca44eeb9e71b2a68704e95f344a64fba7b1963f5',
  url: 'https://archive.mariadb.org/mariadb-11.8.9/winx64-packages/mariadb-11.8.9-winx64.zip',
});

const VERIFIED = '.varion-verified';

export const DB_ENV_ALIASES = {
  host: ['DB_HOST', 'DATABASE_HOST', 'MYSQL_HOST'],
  port: ['DB_PORT', 'DATABASE_PORT', 'MYSQL_PORT'],
  name: ['DB_DATABASE', 'DB_NAME', 'DATABASE_NAME', 'MYSQL_DATABASE'],
  user: ['DB_USERNAME', 'DB_USER', 'DATABASE_USER', 'MYSQL_USER'],
  password: ['DB_PASSWORD', 'DB_PASS', 'DATABASE_PASSWORD', 'MYSQL_PASSWORD'],
  url: ['DATABASE_URL'],
};
const DEFAULT_DB_KEYS = {
  host: 'DB_HOST',
  port: 'DB_PORT',
  name: 'DB_NAME',
  user: 'DB_USER',
  password: 'DB_PASSWORD',
  url: null,
};

export function databaseEnvKeys(database, sample = {}) {
  const keys = {};
  for (const field of Object.keys(DEFAULT_DB_KEYS)) {
    keys[field] =
      database?.env?.[field] ||
      DB_ENV_ALIASES[field].find((key) => key in sample) ||
      DEFAULT_DB_KEYS[field];
  }
  return keys;
}

const randomSecret = () => crypto.randomBytes(18).toString('base64url');

export function managedState(project) {
  const marker = tryReadJson(path.join(project.paths.db, 'managed.json'), null);
  return marker
    ? { ...marker, dataDir: project.paths.dbData, rootCnf: path.join(project.paths.db, 'root.cnf') }
    : null;
}

// ---- MariaDB, once per computer ----

export async function ensureMariaDb(output, { env = process.env } = {}) {
  if (process.platform !== 'win32') {
    throw new CliError(
      t('varion sets up MariaDB only on Windows for now: put your own database in .env'),
    );
  }
  const tools = toolsDir(env);
  const dir = path.join(tools, `mariadb-${MARIADB.version}-winx64`);
  const bin = path.join(dir, 'bin');
  if (
    fs.existsSync(path.join(bin, 'mariadbd.exe')) &&
    fs.existsSync(path.join(bin, 'mariadb-install-db.exe'))
  )
    return bin;
  output.info(
    t('database: downloading MariaDB {version} ({url})', {
      version: MARIADB.version,
      url: MARIADB.url,
    }),
  );
  const label = `MariaDB ${MARIADB.version}`;
  const archive = `${dir}.download-${process.pid}.zip`;
  const staging = `${dir}.download-${process.pid}`;
  ensureDir(tools);
  fs.rmSync(archive, { force: true });
  removeTree(staging);
  try {
    const { sha256 } = await download(MARIADB.url, archive, {
      what: label,
      onProgress: downloadProgress(output, MARIADB.url, label),
    });
    if (sha256 !== MARIADB.sha256) {
      throw new CliError(
        t('the MariaDB {version} archive does not match its pinned SHA-256 ({sha256})', {
          version: MARIADB.version,
          sha256,
        }),
      );
    }
    await extractZip(archive, staging, { windowsSeparators: true });
    if (!fs.existsSync(path.join(staging, 'bin', 'mariadbd.exe')))
      throw new CliError(t('the MariaDB archive has no bin\\mariadbd.exe'));
    fs.writeFileSync(
      path.join(staging, VERIFIED),
      `${JSON.stringify({ ...MARIADB, verifiedAt: new Date().toISOString() }, null, 2)}\n`,
    );
    if (fs.existsSync(path.join(bin, 'mariadbd.exe'))) {
      // another varion unpacked it meanwhile
      removeTree(staging);
    } else {
      removeTree(dir);
      await renameWithRetry(staging, dir);
    }
  } catch (error) {
    tryRemoveTree(staging);
    throw error;
  } finally {
    tryRemoveTree(archive);
  }
  output.info(
    t('database: MariaDB {version} checked (SHA-256) and installed in {dir}', {
      version: MARIADB.version,
      dir,
    }),
  );
  return bin;
}

// ---- the managed server ----

function clientArgs(rootCnf, args) {
  // mariadb takes --defaults-extra-file only as the first argument
  return [`--defaults-extra-file=${rootCnf}`, ...args];
}

function sqlClient(bin, rootCnf) {
  const exe = path.join(bin, 'mariadb.exe');
  return {
    run(args, input) {
      return runProgram(exe, clientArgs(rootCnf, args), { input });
    },
    file(args, file) {
      return new Promise((resolve) => {
        const child = spawn(exe, clientArgs(rootCnf, args), {
          windowsHide: true,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        let stderr = '';
        child.stderr.on('data', (chunk) => (stderr += chunk.toString('utf8')));
        child.stdout.resume();
        child.on('error', (error) => resolve({ code: -1, stderr: error.message }));
        child.on('close', (code) => resolve({ code: code ?? -1, stderr }));
        fs.createReadStream(file)
          .on('error', (error) => {
            stderr += error.message;
            child.stdin.end();
          })
          .pipe(child.stdin);
      });
    },
  };
}

export async function startManagedDb(bin, dataDir, port, output) {
  if (await reachable('127.0.0.1', port)) return false;
  const exe = path.join(bin, 'mariadbd.exe');
  const defaults = `--defaults-file=${path.join(dataDir, 'my.ini')}`;
  const quote = (text) => `'${String(text).replace(/'/g, "''")}'`;
  // Start-Process puts it outside our process tree, so it outlives varion dev
  const started = runProgram('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    `(Start-Process -FilePath ${quote(exe)} -ArgumentList ${quote(`"${defaults}"`)} -WindowStyle Hidden -PassThru).Id`,
  ]);
  const pid = Number(started.stdout.trim());
  if (started.code !== 0 || !Number.isInteger(pid) || pid <= 0) {
    throw new CliError(
      t('mariadbd did not start: {reason}', { reason: (started.stderr || started.stdout).trim() }),
    );
  }
  const alive = () => isAlive(pid);
  if (!(await waitReachable('127.0.0.1', port, { timeoutMs: 60000, alive }))) {
    throw new CliError(
      t('the project database did not answer on 127.0.0.1:{port} (MariaDB log: {log})', {
        port,
        log: path.join(dataDir, '*.err'),
      }),
    );
  }
  const text = t('project database started on 127.0.0.1:{port} (mariadbd, PID {pid})', {
    port,
    pid,
  });
  output.event(
    'database',
    { managed: true, started: true, port, pid },
    `[${output.prefix}] ${text}`,
  );
  return true;
}

function quoteIdent(name) {
  return `\`${String(name).replace(/`/g, '``')}\``;
}

async function tablesIn(client, database) {
  const result = client.run([
    '-N',
    '-B',
    '-e',
    `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${database}'`,
  ]);
  if (result.code !== 0) {
    throw new CliError(
      t('database: cannot list the tables ({reason})', { reason: result.stderr.trim() }),
    );
  }
  return Number(result.stdout.trim() || 0);
}

async function seedDatabase(client, database, seed, output) {
  if (!seed) return false;
  if (!fs.existsSync(seed)) {
    throw new CliError(
      t('[database] seed: no file {file} to fill the new database from', { file: seed }),
    );
  }
  const file = path.basename(seed);
  const loaded = await client.file([database], seed);
  if (loaded.code !== 0) {
    throw new CliError(
      t('database: {file} did not load into {database} ({reason})', {
        file,
        database,
        reason: loaded.stderr.trim(),
      }),
    );
  }
  output.info(t('database: {database} filled from {file}', { database, file }));
  return true;
}

export async function createManagedDatabase(project, output, { envFile }) {
  const { database } = project.config;
  const { db: dbDir, dbData: dataDir } = project.paths;
  const port = database.port;
  const bin = await ensureMariaDb(output);
  const rootCnf = path.join(dbDir, 'root.cnf');
  if (!fs.existsSync(path.join(dataDir, 'mysql'))) {
    if (!(await tcpPortFree('127.0.0.1', port))) {
      throw new CliError(
        t('port {port} is taken: give the project database another one in [database] port', {
          port,
        }),
      );
    }
    output.info(
      t('database: creating a new one in {dir} (127.0.0.1:{port})', {
        dir: path.relative(project.root, dataDir),
        port,
      }),
    );
    const rootPassword = randomSecret();
    removeTree(dataDir);
    ensureDir(dbDir);
    const install = runProgram(path.join(bin, 'mariadb-install-db.exe'), [
      `--datadir=${dataDir}`,
      `--port=${port}`,
      `--password=${rootPassword}`,
    ]);
    if (install.code !== 0)
      throw new CliError(`mariadb-install-db: ${(install.stderr || install.stdout).trim()}`);
    // this computer only: nobody from the network, no firewall prompt
    fs.appendFileSync(path.join(dataDir, 'my.ini'), '\n[mysqld]\nbind-address=127.0.0.1\n');
    fs.writeFileSync(
      rootCnf,
      `[client]\nuser=root\npassword=${rootPassword}\nhost=127.0.0.1\nport=${port}\n`,
      { mode: 0o600 },
    );
  }
  if (!fs.existsSync(rootCnf)) {
    throw new CliError(
      t('database: {file} (the root password) is missing; delete .varion/db to start over', {
        file: rootCnf,
      }),
    );
  }
  await startManagedDb(bin, dataDir, port, output);
  const client = sqlClient(bin, rootCnf);
  const password = randomSecret();
  const users = [`'${database.user}'@'localhost'`, `'${database.user}'@'127.0.0.1'`];
  const statements = [
    `CREATE DATABASE IF NOT EXISTS ${quoteIdent(database.name)} CHARACTER SET utf8mb4`,
  ];
  for (const user of users) {
    statements.push(
      `CREATE USER IF NOT EXISTS ${user} IDENTIFIED BY '${password}'`,
      `ALTER USER ${user} IDENTIFIED BY '${password}'`,
      `GRANT ALL PRIVILEGES ON ${quoteIdent(database.name)}.* TO ${user}`,
    );
  }
  const setup = client.run(['-e', statements.join('; ')]);
  if (setup.code !== 0) {
    throw new CliError(t('database: setup failed ({reason})', { reason: setup.stderr.trim() }));
  }
  if ((await tablesIn(client, database.name)) === 0)
    await seedDatabase(client, database.name, database.seed, output);
  writeJsonAtomic(path.join(dbDir, 'managed.json'), {
    port,
    database: database.name,
    user: database.user,
    mariadb: MARIADB.version,
    createdAt: new Date().toISOString(),
  });
  const example = path.join(project.root, '.env.example');
  const values = fs.existsSync(example) ? parseDotenv(fs.readFileSync(example, 'utf8')) : {};
  const keys = databaseEnvKeys(database, values);
  Object.assign(values, {
    [keys.host]: '127.0.0.1',
    [keys.port]: String(port),
    [keys.name]: database.name,
    [keys.user]: database.user,
    [keys.password]: password,
  });
  if (keys.url)
    values[keys.url] = `mysql://${database.user}:${password}@127.0.0.1:${port}/${database.name}`;
  const header = [
    t('Written by varion: the project database is in .varion/db (MariaDB, this computer only).'),
    t('The passwords work on this computer only; this file stays out of git.'),
  ].join('\n');
  fs.writeFileSync(envFile, stringifyDotenv(values, { header }), 'utf8');
  const text = t('database ready, {file} written', {
    file: path.relative(project.root, envFile) || envFile,
  });
  output.event(
    'database',
    { managed: true, created: true, port, database: database.name, envFile },
    `[${output.prefix}] ${text}`,
  );
  return values;
}

export async function ensureDatabaseRunning(project, envValues, output) {
  const { database } = project.config;
  if (!database) return null;
  const keys = databaseEnvKeys(database, envValues);
  const host = envValues[keys.host] || database.host;
  const port = Number(envValues[keys.port] || database.port);
  const ok = (extra = {}) => {
    output.event(
      'database',
      { host, port, ok: true, ...extra },
      `[${output.prefix}] ${t('database {host}:{port} is up', { host, port })}`,
    );
    return { host, port, keys };
  };
  if (await reachable(host, port)) return ok();
  const managed = managedState(project);
  if (managed && managed.port === port && ['127.0.0.1', 'localhost'].includes(host)) {
    output.info(
      t('the project database is not running; starting it ({dir})', {
        dir: path.relative(project.root, managed.dataDir),
      }),
    );
    await startManagedDb(await ensureMariaDb(output), managed.dataDir, managed.port, output);
    return ok({ managed: true });
  }
  if (database.start && fs.existsSync(database.start)) {
    output.info(
      t('database {host}:{port} does not answer; running {script}', {
        host,
        port,
        script: database.start,
      }),
    );
    await runStartScript(database.start, output);
    if (await waitReachable(host, port, { timeoutMs: 30000 })) return ok();
    throw new CliError(
      t('database {host}:{port} still does not answer after {script}', {
        host,
        port,
        script: path.basename(database.start),
      }),
    );
  }
  const hint = database.start
    ? t('the start script {script} is not on this computer', { script: database.start })
    : database.managed
      ? t('it is not the project database in .varion/db (delete .env to let varion set one up)')
      : t('varion.toml has no [database] start');
  throw new CliError(t('database {host}:{port} does not answer: {hint}', { host, port, hint }));
}

function runStartScript(script, output) {
  const ext = path.extname(script).toLowerCase();
  let file = script;
  let args = [];
  if (ext === '.ps1') {
    file = 'powershell.exe';
    args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script];
  } else if (ext === '.cmd' || ext === '.bat') {
    file = process.env.ComSpec || 'cmd.exe';
    args = ['/d', '/c', script];
  } else if (['.js', '.mjs', '.cjs'].includes(ext)) {
    file = process.execPath;
    args = [script];
  }
  return new Promise((resolve) => {
    const child = spawn(file, args, {
      stdio: output.json ? 'ignore' : 'inherit',
      windowsHide: true,
    });
    child.on('error', () => resolve());
    child.on('close', () => resolve());
  });
}

export async function stopManagedDb(project, output) {
  const managed = managedState(project);
  if (!managed) throw new CliError(t('the project has no database of its own in .varion/db'));
  if (!(await reachable('127.0.0.1', managed.port))) {
    output.info(
      t('the project database (127.0.0.1:{port}) is already stopped', { port: managed.port }),
    );
    return false;
  }
  const bin = await ensureMariaDb(output);
  const result = runProgram(
    path.join(bin, 'mariadb-admin.exe'),
    clientArgs(managed.rootCnf, ['shutdown']),
  );
  if (result.code !== 0) throw new CliError(`mariadb-admin shutdown: ${result.stderr.trim()}`);
  const text = t('project database stopped (127.0.0.1:{port})', { port: managed.port });
  output.event(
    'database',
    { managed: true, stopped: true, port: managed.port },
    `[${output.prefix}] ${text}`,
  );
  return true;
}

export { sqlClient };
