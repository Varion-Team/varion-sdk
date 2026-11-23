import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { t } from '../i18n/index.mjs';
import { VarionError } from '../shared/errors.mjs';
import { CliError, createOutput } from './output.mjs';

export const CLI_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function cliVersion() {
  return JSON.parse(fs.readFileSync(path.join(CLI_DIR, 'package.json'), 'utf8')).version;
}

const COMMANDS = {
  new: () => import('./commands/new.mjs'),
  dev: () => import('./commands/dev.mjs'),
  build: () => import('./commands/build.mjs'),
  check: () => import('./commands/check.mjs'),
  deploy: () => import('./commands/deploy.mjs'),
  engine: () => import('./commands/engine.mjs'),
  db: () => import('./commands/db.mjs'),
  assets: () => import('./commands/assets.mjs'),
  keys: () => import('./commands/keys.mjs'),
  login: () => import('./commands/login.mjs'),
  link: () => import('./commands/link.mjs'),
  logout: () => import('./commands/logout.mjs'),
  whoami: () => import('./commands/whoami.mjs'),
  types: () => import('./commands/types.mjs'),
  upgrade: () => import('./commands/upgrade.mjs'),
  host: () => import('./commands/host.mjs'),
  pack: () => import('./commands/pack.mjs'),
  publish: () => import('./commands/publish.mjs'),
  install: () => import('./commands/install.mjs'),
};

function helpText() {
  return `varion: ${t('game modes on Varion: one folder, one varion.toml, one command')}

  varion new <name> [--db] [--dir <dir>] [--title "<title>"] [--start] [--play] [--no-install]
                          ${t('create a project from the template: TypeScript server, client and page')}
  varion dev [--env <name>] [--no-build] [--no-watch] [--play] [--verbose] [--dotenv <file>]
                          ${t('run engine, database and server; rebuild and restart on every edit')}
  varion build [--env <name>] [--release] [--out <dir>]
                          ${t('type check and build the game mode resource')}
  varion check            ${t('type check only (server, client, page)')}
  varion deploy test|prod|preview-<branch> [--pack-only] [--no-validate] [--trust-host]
                          ${t('pack a release, upload it and send a signed deploy request')}
  varion deploy <env> --rollback
                          ${t('go back to the release that was active before the current one')}
  varion login [--cabinet <url>] [--name <name>] [--no-browser]
                          ${t('sign this computer in to the cabinet and add its developer key')}
  varion logout           ${t('forget the sign-in of this computer')}
  varion whoami           ${t('the signed-in account and its servers')}
  varion keys init|show   ${t('create or show the developer key that signs deploy requests')}
  varion host [run|pair|install|uninstall|trust|status|stop]
                          ${t('on a server: apply deploys from the cabinet (see varion host --help)')}
  varion link             ${t('on a server started by hand: connect it to the cabinet so that it joins the list')}
  varion engine [--verify]
                          ${t('download and check the engine of varion.toml')}
  varion db status|start|stop|shell
                          ${t('manage the project database (MariaDB in .varion/db)')}
  varion assets status|fetch|lock
                          ${t('check, fetch and lock the big files of the project (DLC packs)')}
  varion types            ${t('refresh types/ with the SDK typings of this varion')}
  varion upgrade [--no-check]
                          ${t('move the project to the newest SDK and engine, and show what no longer fits')}

${t('resources for sale')}:
  varion pack [<dir>] [--out <file>] [--version <x.y.z>]
                          ${t('pack a resource for sale: the code sealed, the config left open')}
  varion publish [<dir>] [--version <x.y.z>] [--beta] [--notes "<text>"] [--file <package>]
                          ${t('pack a resource and publish it as a new version')}
  varion install <name> [--dir <dir>] [--version <x.y.z>] [--force]
                          ${t('put a bought resource into the resources folder of a server')}

${t('common options')}:
  --json                  ${t('events as JSON lines, for tools and CI')}
  -C, --cwd <dir>         ${t('the project folder')}
  --help, --version`;
}

export async function main(argv, { stdout = process.stdout, stderr = process.stderr } = {}) {
  const json = argv.includes('--json');
  const output = createOutput({ json, stdout, stderr });
  const [command, ...rest] = argv;
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    if (!json) stdout.write(`${helpText()}\n`);
    return command ? 0 : 1;
  }
  if (command === '--version' || command === '-v') {
    const version = cliVersion();
    output.event('version', { version }, version);
    return 0;
  }
  const load = Object.hasOwn(COMMANDS, command) ? COMMANDS[command] : null;
  if (!load) {
    output.error(t('"{command}" is not a varion command (see varion --help)', { command }));
    return 1;
  }
  // varion host prints its own help
  if (command !== 'host' && (rest.includes('--help') || rest.includes('-h'))) {
    if (!json) stdout.write(`${helpText()}\n`);
    return 0;
  }
  try {
    const module = await load();
    return await module.run(rest, { output, cliDir: CLI_DIR });
  } catch (error) {
    if (error instanceof VarionError) {
      if (json) {
        output.event('fatal', {
          text: error.message,
          code: error.code,
          ...(error.status !== undefined && { status: error.status }),
          ...(error instanceof CliError && error.data),
        });
      } else {
        output.child(command).error(error.message);
      }
      return error instanceof CliError ? error.exitCode : 1;
    }
    if (json) output.event('fatal', { text: error?.stack || String(error) });
    else stderr.write(`[${command}] ${t('internal error in varion')}:\n${error?.stack || error}\n`);
    return 70;
  }
}
