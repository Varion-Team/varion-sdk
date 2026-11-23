import fs from 'node:fs';
import path from 'node:path';
import { t } from '../../i18n/index.mjs';
import { fetchInstall } from '../../market/client.mjs';
import { MARKET_NAME, MARKET_VERSION } from '../../market/pack.mjs';
import { isInside, writeFileAtomic } from '../../shared/fs.mjs';
import { parseArgs } from '../args.mjs';
import { CliError } from '../output.mjs';
import { cabinetOption, ensureSignedIn } from './login.mjs';
import { signedIn, signedOut } from './publish.mjs';

// resource.toml that asks the platform for this version, not for the newest one
function pinVersion(data, version) {
  const text = data
    .toString('utf8')
    .replace(/^license-version\s*=.*\r?\n/m, '')
    .replace(/^(license\s*=.*)$/m, `$1\nlicense-version = "${version}"`);
  return Buffer.from(text, 'utf8');
}

// Files edited here are kept unless --force.
function writeFiles(dir, files, { version, force }) {
  const written = [];
  const kept = [];
  for (const file of files) {
    const target = path.resolve(dir, ...file.path.split('/'));
    if (!isInside(dir, target)) continue;
    const pinned = file.path === 'resource.toml' && version;
    const data = pinned ? pinVersion(file.data, version) : file.data;
    if (fs.existsSync(target) && !force && !fs.readFileSync(target).equals(data)) {
      kept.push(file.path);
      continue;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    writeFileAtomic(target, data);
    written.push(file.path);
  }
  return { written, kept };
}

// installs the open part; the code comes to the server from the platform
export async function run(argv, { output: root }) {
  const { options, positionals } = parseArgs(argv, {
    command: 'install',
    options: {
      dir: 'string',
      version: 'string',
      force: 'boolean',
      cabinet: 'string',
      cwd: 'string',
      json: 'boolean',
    },
    aliases: { C: 'cwd' },
  });
  const output = root.child('install');
  const [name, ...extra] = positionals;
  if (!name || extra.length || !MARKET_NAME.test(name)) {
    throw new CliError(t('varion install <name>: the name of the resource as its page shows it'), {
      code: 'usage',
    });
  }
  if (options.version && !MARKET_VERSION.test(options.version)) {
    throw new CliError(
      t('the version is three numbers with dots, like 1.2.0 (got "{version}")', {
        version: options.version,
      }),
    );
  }
  const cabinet = cabinetOption(options);
  await ensureSignedIn(cabinet, root);
  const login = signedIn(cabinet);
  const base = path.resolve(options.cwd || process.cwd());
  const dir = path.resolve(base, options.dir || path.join('resources', name));

  let got;
  try {
    got = await fetchInstall({
      cabinetUrl: cabinet,
      token: login.token,
      name,
      version: options.version || '',
    });
  } catch (error) {
    throw signedOut(error, cabinet);
  }

  const { written, kept } = writeFiles(dir, got.files, options);
  output.event(
    'installed',
    { cabinet, name: got.resource, version: got.version, dir, written, kept },
    `[install] ${t('{name} {version} is in {dir}', { name: got.resource, version: got.version, dir })}`,
  );
  if (kept.length) {
    output.line(
      `  ${t('kept as they are here (--force replaces them): {list}', { list: kept.join(', ') })}`,
    );
  }
  output.line(
    `  ${t(
      'add "{folder}" to resources in server.toml; the code itself comes to the server from the platform when it starts',
      {
        folder: path.basename(dir),
      },
    )}`,
  );
  return 0;
}
