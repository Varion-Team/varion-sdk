import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { t } from '../i18n/index.mjs';
import { readJson } from '../shared/fs.mjs';
import { CliError } from './output.mjs';
import { shellQuote } from './proc.mjs';

function findPackageDir(root, name) {
  let dir = path.resolve(root);
  for (;;) {
    const candidate = path.join(dir, 'node_modules', ...name.split('/'));
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function packageJson(dir) {
  return readJson(path.join(dir, 'package.json'));
}

function esmEntry(dir, pkg) {
  let exported = pkg.exports;
  if (exported && typeof exported === 'object' && !Array.isArray(exported) && '.' in exported)
    exported = exported['.'];
  const pick = (entry) => {
    if (typeof entry === 'string') return entry;
    if (!entry || typeof entry !== 'object') return null;
    return pick(entry.import) || pick(entry.node) || pick(entry.default) || null;
  };
  return path.join(dir, pick(exported) || pkg.module || pkg.main || 'index.js');
}

function notInstalled(name) {
  return new CliError(
    t('the project has no {name}: install its dependencies with npm install', { name }),
  );
}

// the project's own copy, never ours: it pins the versions it was tested with
async function importProjectPackage(root, name) {
  const dir = findPackageDir(root, name);
  if (!dir) throw notInstalled(name);
  const module = await import(pathToFileURL(esmEntry(dir, packageJson(dir))).href);
  return {
    module:
      module.default && !module.build && !module.context
        ? { ...module.default, ...module }
        : module,
    version: packageJson(dir).version,
    dir,
  };
}

export async function loadEsbuild(root) {
  const dir = findPackageDir(root, 'esbuild');
  if (!dir) throw notInstalled('esbuild');
  // esbuild is CommonJS
  const require = createRequire(path.join(root, 'package.json'));
  return { module: require(dir), version: packageJson(dir).version, dir };
}

// The Vite config of a page's folder, if it has one.
export function findViteConfig(uiRoot) {
  return ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs']
    .map((name) => path.join(uiRoot, name))
    .find((file) => fs.existsSync(file));
}

export async function loadVite(root) {
  return importProjectPackage(root, 'vite');
}

export function findTsc(root) {
  const dir = findPackageDir(root, 'typescript');
  if (!dir) return null;
  const pkg = packageJson(dir);
  const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.tsc;
  if (!bin) return null;
  return { node: process.execPath, script: path.join(dir, bin), version: pkg.version };
}

// ---- package managers ----

// The package manager a project is kept with, by the lock file it has.
export function projectPackageManager(root) {
  if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(root, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

export function detectPackageManager(explicit) {
  if (explicit) {
    if (!['npm', 'pnpm', 'yarn'].includes(explicit))
      throw new CliError(t('--pm must be npm, pnpm or yarn, not "{value}"', { value: explicit }));
    return explicit;
  }
  const agent = process.env.npm_config_user_agent || '';
  if (agent.startsWith('pnpm/')) return 'pnpm';
  if (agent.startsWith('yarn/')) return 'yarn';
  return 'npm';
}

export function runPackageManager(pm, args, { cwd, stdio = 'inherit' } = {}) {
  let file = pm;
  let argv = args;
  let shell = false;
  if (pm === 'npm') {
    // npm-cli.js next to node needs no shell on windows
    const npmCli = path.join(
      path.dirname(process.execPath),
      'node_modules',
      'npm',
      'bin',
      'npm-cli.js',
    );
    if (fs.existsSync(npmCli)) {
      file = process.execPath;
      argv = [npmCli, ...args];
    } else {
      shell = process.platform === 'win32';
    }
  } else {
    shell = process.platform === 'win32';
  }
  return new Promise((resolve) => {
    // through a shell the arguments are one line: quoted here, not glued together by node
    const child = shell
      ? spawn([file, ...argv].map(shellQuote).join(' '), { cwd, stdio, shell, windowsHide: true })
      : spawn(file, argv, { cwd, stdio, windowsHide: true });
    let output = '';
    if (stdio === 'pipe') {
      child.stdout.setEncoding('utf8').on('data', (text) => (output += text));
      child.stderr.setEncoding('utf8').on('data', (text) => (output += text));
    }
    child.on('error', (error) => resolve({ code: -1, output: error.message }));
    child.on('close', (code) => resolve({ code: code ?? -1, output }));
  });
}
