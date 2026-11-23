import fs from 'node:fs';
import path from 'node:path';
import { t } from '../../i18n/index.mjs';
import { parseArgs } from '../args.mjs';
import { CliError } from '../output.mjs';
import { openProject } from '../prepare.mjs';
import { copySdkTypes, DEFAULT_ENGINE } from '../scaffold.mjs';
import { runPackageManager } from '../tools.mjs';
import { run as check } from './check.mjs';
import { noArguments } from './login.mjs';

const numbers = (version) =>
  String(version)
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);

export function newerThan(a, b) {
  const [left, right] = [numbers(a), numbers(b)];
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    if ((left[i] || 0) !== (right[i] || 0)) return (left[i] || 0) > (right[i] || 0);
  }
  return false;
}

// varion.toml with another version in [engine]; the rest of the file stays as it was. Null when
// the table has no version to change (an engine by path, or no table).
export function withEngineVersion(text, version) {
  const eol = /\r\n/.test(text) ? '\r\n' : '\n';
  const lines = String(text).split(/\r?\n/);
  const start = lines.findIndex((line) => /^\s*\[engine\]\s*(#.*)?$/.test(line));
  if (start < 0) return null;
  for (let i = start + 1; i < lines.length && !/^\s*\[/.test(lines[i]); i++) {
    const found = /^(\s*version\s*=\s*)(["'])[^"']*\2(.*)$/.exec(lines[i]);
    if (!found) continue;
    lines[i] = `${found[1]}"${version}"${found[3]}`;
    return lines.join(eol);
  }
  return null;
}

// The SDK as the project asks for it, when it comes from somewhere npm can ask again.
function sdkOf(root) {
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  } catch {
    return null;
  }
  const spec = pkg.devDependencies?.['@varion/sdk'] || pkg.dependencies?.['@varion/sdk'];
  if (!spec || /^(file|link|workspace):/.test(spec)) return null;
  return /^[\^~]?\d/.test(spec) ? '@varion/sdk@latest' : spec;
}

// `varion upgrade`: the newest SDK, the engine it is made for, fresh typings, and a type check
// that shows what in the mode no longer fits.
export async function run(argv, context) {
  const { output: root, cliDir } = context;
  const { options, positionals } = parseArgs(argv, {
    command: 'upgrade',
    options: { 'no-install': 'boolean', 'no-check': 'boolean', json: 'boolean', cwd: 'string' },
    aliases: { C: 'cwd' },
  });
  noArguments('varion upgrade', positionals);
  const output = root.child('upgrade');
  const project = openProject(options, output);

  const spec = options.noInstall ? null : sdkOf(project.root);
  if (spec) {
    output.info(t('updating the SDK of the project'));
    const installed = await runPackageManager('npm', ['install', '--save-dev', spec], {
      cwd: project.root,
      stdio: 'pipe',
    });
    if (installed.code !== 0) {
      throw new CliError(
        t('npm could not update the SDK: {reason}', {
          reason: installed.output.trim().split(/\r?\n/).slice(-3).join(' '),
        }),
        { code: 'sdk_update_failed' },
      );
    }
    // the rest is the work of the SDK that has just arrived
    const fresh = path.join(project.root, 'node_modules', '@varion', 'sdk', 'bin', 'varion.mjs');
    if (fs.existsSync(fresh) && path.resolve(fresh) !== path.resolve(process.argv[1] || '')) {
      const { spawnSync } = await import('node:child_process');
      const rest = argv.filter((arg) => arg !== '--no-install');
      const result = spawnSync(process.execPath, [fresh, 'upgrade', '--no-install', ...rest], {
        cwd: process.cwd(),
        stdio: 'inherit',
        windowsHide: true,
      });
      return result.status ?? 1;
    }
  }

  const { engine } = project.config;
  const file = path.join(project.root, 'varion.toml');
  if (engine.path) {
    output.info(t('the engine is your own build ([engine] path): its version is left alone'));
  } else if (newerThan(DEFAULT_ENGINE.version, engine.version)) {
    const text = withEngineVersion(fs.readFileSync(file, 'utf8'), DEFAULT_ENGINE.version);
    if (!text) {
      throw new CliError(t('varion.toml has no version in [engine] to change'), {
        code: 'no_engine_version',
      });
    }
    fs.writeFileSync(file, text);
    output.event(
      'engine-version',
      { from: engine.version, to: DEFAULT_ENGINE.version },
      `[upgrade] ${t('engine {from} -> {to} in varion.toml', {
        from: engine.version,
        to: DEFAULT_ENGINE.version,
      })}`,
    );
  } else {
    output.event(
      'engine-version',
      { from: engine.version, to: engine.version },
      `[upgrade] ${t('engine {version}: already the newest this SDK knows', {
        version: engine.version,
      })}`,
    );
  }

  const { written } = copySdkTypes(cliDir, project.root);
  output.event(
    'types',
    { files: written },
    `[upgrade] ${t('typings refreshed ({count} files)', { count: written.length })}`,
  );

  if (options.noCheck || project.config.build.kind !== 'standard') return 0;
  const passing = options.cwd ? ['--cwd', options.cwd] : [];
  const code = await check(options.json ? [...passing, '--json'] : passing, context);
  output.event(
    'upgrade',
    { ok: code === 0 },
    code === 0
      ? output.paint('green', `[upgrade] ${t('done: the mode fits the new version')}`)
      : `[upgrade] ${t('the lines above no longer fit the new version: fix them and run varion check')}`,
  );
  return code;
}
