import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { t } from '../../i18n/index.mjs';
import { parseArgs } from '../args.mjs';
import { CliError } from '../output.mjs';
import { DEFAULT_ENGINE, generateProject, sdkSpec } from '../scaffold.mjs';
import { detectPackageManager, runPackageManager } from '../tools.mjs';

function git(args, cwd) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
  return {
    ok: result.status === 0,
    missing: result.error?.code === 'ENOENT',
    out: (result.stdout || '').trim(),
  };
}

// a repository with one commit; skipped inside an existing work tree or without git
function initRepository(dir, output) {
  const parent = git(['rev-parse', '--is-inside-work-tree'], path.dirname(dir));
  if (parent.missing) {
    output.info(t('git is not installed: the project is not a repository yet'));
    return { initialized: false, committed: false };
  }
  if (parent.ok && parent.out === 'true') {
    output.info(t('the project is inside a git repository already: no new one'));
    return { initialized: false, committed: false };
  }
  if (!git(['init', '-b', 'main'], dir).ok) {
    output.warn(t('git init failed: run it yourself in {dir}', { dir }));
    return { initialized: false, committed: false };
  }
  const named = git(['config', 'user.name'], dir).ok && git(['config', 'user.email'], dir).ok;
  if (!named) {
    output.info(t('git has no user.name or user.email: make the first commit yourself'));
    return { initialized: true, committed: false };
  }
  const committed =
    git(['add', '-A'], dir).ok && git(['commit', '-q', '-m', 'Initial commit'], dir).ok;
  if (!committed) output.warn(t('the first commit failed: make it yourself in {dir}', { dir }));
  return { initialized: true, committed };
}

export async function run(argv, { output: root, cliDir }) {
  const { options, positionals } = parseArgs(argv, {
    command: 'new',
    options: {
      dir: 'string',
      title: 'string',
      db: 'boolean',
      port: 'number',
      'db-port': 'number',
      'engine-version': 'string',
      'engine-channel': 'string',
      'engine-path': 'string',
      pm: 'string',
      'no-install': 'boolean',
      'no-git': 'boolean',
      sdk: 'string',
      json: 'boolean',
      cwd: 'string',
    },
    aliases: { C: 'cwd' },
  });
  const output = root.child('new');
  const name = positionals[0];
  if (!name) throw new CliError(t('usage: varion new <name>, for example varion new my-mode'));

  const base = options.cwd ? path.resolve(options.cwd) : process.cwd();
  const dir = path.resolve(base, options.dir || name);
  const port = options.port ?? 7788;
  const engine = options.enginePath
    ? { path: path.resolve(base, options.enginePath) }
    : {
        version: options.engineVersion || DEFAULT_ENGINE.version,
        channel: options.engineChannel || DEFAULT_ENGINE.channel,
      };
  const pm = detectPackageManager(options.pm);

  const files = generateProject({
    dir,
    name,
    title: options.title || name,
    engine,
    port,
    db: Boolean(options.db),
    dbPort: options.dbPort ?? 3317,
    sdkDir: cliDir,
    spec: options.sdk || sdkSpec(cliDir),
  });
  output.event(
    'new',
    { dir, name, files, engine, db: Boolean(options.db) },
    output.paint(
      'green',
      `[new] ${t('created {name} in {dir} ({count} files)', { name, dir, count: files.length })}`,
    ),
  );

  if (!options.noInstall) {
    output.info(t('installing dependencies ({pm} install)', { pm }));
    const installed = await runPackageManager(pm, ['install'], {
      cwd: dir,
      stdio: output.json ? 'pipe' : 'inherit',
    });
    output.event('install', { pm, ok: installed.code === 0, code: installed.code });
    if (installed.code !== 0) {
      throw new CliError(
        t('{pm} install failed (exit code {code}); run it again in {dir}', {
          pm,
          code: installed.code,
          dir,
        }),
      );
    }
  }

  const repository = options.noGit
    ? { initialized: false, committed: false }
    : initRepository(dir, output);
  output.event('git', repository);

  const relative = path.relative(process.cwd(), dir) || '.';
  const runScript = pm === 'npm' ? 'npm run' : pm;
  output.line(
    [
      '',
      t('Next:'),
      `  cd ${relative}`,
      ...(options.noInstall ? [`  ${pm} install`] : []),
      `  ${runScript} dev      # ${t('server on 127.0.0.1:{port}, restarts on save', { port })}`,
      '',
      t('Events live in src/shared/events.ts, settings in varion.toml, details in README.md'),
    ].join('\n'),
  );
  return 0;
}
