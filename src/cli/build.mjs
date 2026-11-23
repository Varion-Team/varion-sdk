import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { VarionError } from '../shared/errors.mjs';
import {
  copyIfChanged,
  ensureDir,
  isInside,
  mirrorDir,
  removeTree,
  toPosix,
} from '../shared/fs.mjs';
import { CliError } from './output.mjs';
import { findViteConfig, loadEsbuild, loadVite } from './tools.mjs';
import { findTsconfig, typecheck } from './typecheck.mjs';
import { resourceDirOf, resourceTomlText } from './resource.mjs';
import { resourceConfig } from './config.mjs';
import { engineGarblesConfigText } from './engine.mjs';
import { runShell } from './proc.mjs';

const UI_STATIC_SKIP = /(^|\/)(node_modules|dist)(\/|$)/;

// the message comes on a line before its path:line:col
export function parseBuildOutput(text, root) {
  const errors = [];
  let message = '';
  for (const line of String(text).split(/\r?\n/)) {
    const tsc =
      /^(.+?\.(?:tsx?|jsx?|mjs|cjs|mts|cts|vue))\((\d+),(\d+)\): error (TS\d+): (.*)$/.exec(line);
    if (tsc) {
      errors.push({
        file: relativeTo(root, tsc[1]),
        line: Number(tsc[2]),
        column: Number(tsc[3]),
        text: `${tsc[4]}: ${tsc[5]}`,
      });
      continue;
    }
    if (/\[ERROR\]|\berror\b/i.test(line) && !/:\d+:\d+/.test(line)) {
      message = line
        .replace(/^[\s✘X>]+/, '')
        .replace(/^\[ERROR\]\s*/, '')
        .trim();
    }
    const at =
      /([A-Za-z]:[\\/][^\s:]+|[\w.\\/-]+\.(?:tsx?|jsx?|mjs|cjs|mts|cts|json|css|html)):(\d+):(\d+)/.exec(
        line,
      );
    if (at && message) {
      errors.push({
        file: relativeTo(root, at[1]),
        line: Number(at[2]),
        column: Number(at[3]),
        text: message,
      });
      message = '';
    }
  }
  return errors;
}

function relativeTo(root, file) {
  const full = path.isAbsolute(file) ? file : path.resolve(root, file);
  return toPosix(path.relative(root, full));
}

function esbuildErrors(error, root) {
  if (!Array.isArray(error?.errors)) {
    return [{ file: null, line: 0, column: 0, text: error?.message || String(error) }];
  }
  return error.errors.map((item) => ({
    file: item.location?.file ? relativeTo(root, item.location.file) : null,
    line: item.location?.line ?? 0,
    column: (item.location?.column ?? -1) + 1,
    text: item.text,
  }));
}

function viteErrors(error, root) {
  const loc = error?.loc;
  const file = loc?.file || error?.id;
  return [
    {
      file: file ? relativeTo(root, String(file).replace(/\?.*$/, '')) : null,
      line: loc?.line ?? 0,
      column: (loc?.column ?? -1) + 1,
      text: String(error?.message || error).split('\n')[0],
    },
  ];
}

// a module script with crossorigin does not run when the page comes from a file address
function classicScriptPlugin() {
  return {
    name: 'varion-classic-script',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(/<script type="module" crossorigin/g, '<script defer')
        .replace(/<script type="module"/g, '<script defer')
        .replace(/<link rel="stylesheet" crossorigin/g, '<link rel="stylesheet"')
        .replace(/<link rel="modulepreload"[^>]*>/g, '');
    },
  };
}

// The entry points that exist, keyed by part (server, client, ui).
function findEntries(build, root, output) {
  const entries = {};
  for (const part of ['server', 'client', 'ui']) {
    if (!build[part]) continue;
    const full = path.resolve(root, build[part]);
    if (fs.existsSync(full)) {
      entries[part] = full;
    } else if (part === 'server') {
      throw new CliError(
        t("[build] server: {file} does not exist (the entry point of the mode's server)", {
          file: build[part],
        }),
      );
    } else {
      output.warn(
        t('[build] {part}: {file} does not exist, so this part is not built', {
          part,
          file: build[part],
        }),
      );
    }
  }
  return entries;
}

function writeIfChanged(file, text) {
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) {
    fs.writeFileSync(file, text, 'utf8');
  }
}

class Builder {
  constructor(
    project,
    output,
    { outDir, mapsDir, mode = 'dev', envName = null, typecheckCache = null, failureNote = '' },
  ) {
    this.project = project;
    this.output = output;
    this.outDir = outDir;
    this.mapsDir = mapsDir;
    this.mode = mode;
    this.envName = envName;
    this.typecheckCache = typecheckCache;
    this.failureNote = failureNote;
    this.resourceDir = resourceDirOf(project, outDir);
    this.contexts = new Map();
    this.esbuild = null;
    this.warnedConfig = false;
    // varion dev with the live UI adds the [dev-ui] table through this
    this.declare = null;

    const { build } = project.config;
    this.standard = build.kind === 'standard';
    this.entries = this.standard ? findEntries(build, project.root, output) : {};
    this.parts = this.standard ? Object.keys(this.entries) : build.steps.map((step) => step.name);
    const { server, client, ui } = this.entries;
    this.sideDirs = {
      ...(server && { server: path.dirname(server) }),
      ...(client && { client: path.dirname(client) }),
      ...(ui && { ui }),
    };
  }

  get root() {
    return this.project.root;
  }

  get config() {
    return this.project.config;
  }

  get resourceToml() {
    return path.join(this.resourceDir, 'resource.toml');
  }

  tsconfigOf(part) {
    const from = part === 'ui' ? this.entries.ui : path.dirname(this.entries[part]);
    return findTsconfig(this.root, from);
  }

  esbuildOptions(part) {
    const { build } = this.config;
    const common = {
      entryPoints: [this.entries[part]],
      bundle: true,
      absWorkingDir: this.root,
      logLevel: 'silent',
      charset: 'utf8',
      legalComments: 'none',
      define: {
        'process.env.NODE_ENV': JSON.stringify(
          this.mode === 'release' ? 'production' : 'development',
        ),
      },
    };
    const tsconfig = this.tsconfigOf(part);
    if (tsconfig) common.tsconfig = tsconfig;
    if (part === 'server') {
      return {
        ...common,
        outfile: path.join(this.resourceDir, 'server', 'index.js'),
        platform: 'node',
        format: 'cjs',
        target: build.target,
        sourcemap: 'linked',
        external: build.external,
      };
    }
    return {
      ...common,
      outfile: path.join(this.resourceDir, 'client', 'index.js'),
      platform: 'neutral',
      mainFields: ['module', 'main'],
      format: 'esm',
      target: 'es2022',
      // the client runtime provides the natives
      external: ['@varion/natives'],
      sourcemap: this.mapsDir ? 'external' : false,
    };
  }

  async esbuildPart(part) {
    this.esbuild ??= (await loadEsbuild(this.root)).module;
    let context = this.contexts.get(part);
    if (!context) {
      context = await this.esbuild.context(this.esbuildOptions(part));
      this.contexts.set(part, context);
    }
    await context.rebuild();
    if (part !== 'client' || !this.mapsDir) return;
    // the map is kept beside the build, not inside the resource
    const map = path.join(this.resourceDir, 'client', 'index.js.map');
    if (!fs.existsSync(map)) return;
    ensureDir(this.mapsDir);
    fs.copyFileSync(map, path.join(this.mapsDir, 'client.js.map'));
    fs.rmSync(map, { force: true });
  }

  async vitePart() {
    const { module: vite, version } = await loadVite(this.root);
    const uiRoot = this.entries.ui;
    const configFile = findViteConfig(uiRoot);
    const release = this.mode === 'release';
    const rolldown = Number(String(version).split('.')[0]) >= 8;
    // Rolldown (Vite 8+) keeps an iife in one chunk by itself
    const bundler = {
      output: rolldown ? { format: 'iife' } : { format: 'iife', inlineDynamicImports: true },
    };
    await vite.build({
      root: uiRoot,
      base: './',
      configFile: configFile || false,
      logLevel: 'silent',
      clearScreen: false,
      mode: release ? 'production' : 'development',
      plugins: [classicScriptPlugin()],
      build: {
        outDir: path.join(this.resourceDir, 'ui'),
        emptyOutDir: true,
        modulePreload: false,
        sourcemap: release ? false : 'inline',
        target: 'chrome120',
        reportCompressedSize: false,
        ...(rolldown ? { rolldownOptions: bundler } : { rollupOptions: bundler }),
      },
    });
  }

  writeResource() {
    const { entries, envName, resourceDir } = this;
    ensureDir(resourceDir);
    const text = resourceTomlText(this.project, {
      envName,
      parts: { client: Boolean(entries.client), ui: Boolean(entries.ui) },
    });
    writeIfChanged(this.resourceToml, this.declare ? this.declare(text) : text);
    // the server bundle is CommonJS even when the project's package.json says "type": "module"
    const marker = path.join(resourceDir, 'server', 'package.json');
    if (fs.existsSync(path.dirname(marker)) && !fs.existsSync(marker)) {
      fs.writeFileSync(marker, '{ "type": "commonjs", "private": true }\n', 'utf8');
    }
    this.warnAboutGarbledConfig();
    this.copyExtras();
  }

  warnAboutGarbledConfig() {
    if (this.warnedConfig || !engineGarblesConfigText(this.config.engine)) return;
    const keys = nonAsciiConfigKeys(resourceConfig(this.config, { envName: this.envName }));
    if (!keys.length) return;
    this.warnedConfig = true;
    this.output.warn(
      t(
        '[config] {keys}: engine 1.0.75 and older garble non-Latin text in varion.getResourceConfig() on Windows with a Cyrillic code page; keep such text in code or in .env, or use a newer engine',
        { keys: keys.join(', ') },
      ),
    );
  }

  copyExtras() {
    for (const item of this.config.build.copy) {
      const from = path.resolve(this.root, item);
      const to = path.join(this.resourceDir, item);
      if (!fs.existsSync(from)) {
        this.output.warn(t('[build] copy: {item} does not exist', { item }));
      } else if (fs.statSync(from).isDirectory()) {
        mirrorDir(from, to, { skip: (relative) => UI_STATIC_SKIP.test(relative) });
      } else {
        copyIfChanged(from, to);
      }
    }
  }

  // Type-checks the parts and returns the failures; an empty list means the build may go on.
  async typecheckParts(parts) {
    const { output, failureNote } = this;
    const sides = parts
      .map((part) => ({ name: part, tsconfig: this.tsconfigOf(part) }))
      .filter((side) => side.tsconfig);
    const checked = await typecheck(this.project, sides, { cacheDir: this.typecheckCache });
    if (checked.skipped) {
      output.warn(t('type check skipped: {reason}', { reason: checked.skipped }));
    }
    for (const { name, ok, ms, errors } of checked.results) {
      const title = t('type check of {part}', { part: name });
      output.event(
        'typecheck',
        { part: name, ok, ms, errors },
        ok ? undefined : formatErrors(title, errors, output, failureNote),
      );
    }
    return checked.results
      .filter((result) => !result.ok)
      .map(({ name, ms, errors }) => ({ part: name, ok: false, ms, errors, stage: 'typecheck' }));
  }

  async bundlePart(part) {
    const started = Date.now();
    try {
      if (part === 'ui') await this.vitePart();
      else await this.esbuildPart(part);
      return { part, ok: true, ms: Date.now() - started };
    } catch (error) {
      if (error instanceof VarionError) throw error;
      const errors = part === 'ui' ? viteErrors(error, this.root) : esbuildErrors(error, this.root);
      return { part, ok: false, ms: Date.now() - started, errors, stage: 'bundle' };
    }
  }

  async standardBuild(requested) {
    const wanted = requested.filter((part) => this.entries[part]);
    // types first: a mistake keeps the previous bundle in place
    if (this.config.build.typecheck && wanted.length) {
      const failed = await this.typecheckParts(wanted);
      if (failed.length) return failed;
    }
    const results = await Promise.all(wanted.map((part) => this.bundlePart(part)));
    if (results.every((result) => result.ok)) this.writeResource();
    return results;
  }

  async customBuild(requested) {
    const { root, config, outDir, resourceDir, mapsDir, mode, output } = this;
    const vars = {
      out: outDir,
      resource: resourceDir,
      name: config.project.name,
      root,
      maps: mapsDir || path.join(outDir, '..', 'maps'),
      mode,
    };
    const results = [];
    for (const step of config.build.steps.filter((item) => requested.includes(item.name))) {
      const started = Date.now();
      const result = await runShell(step.run, { cwd: step.cwd, capture: output.json, vars });
      const ok = result.code === 0;
      results.push({
        part: step.name,
        ok,
        ms: Date.now() - started,
        errors: ok ? [] : parseBuildOutput(result.output, root),
        output: ok ? undefined : result.output.slice(-8000),
        stage: 'run',
      });
      if (!ok) break;
    }
    // the project's own step wrote resource.toml without the [dev-ui] table
    if (this.declare && results.every((result) => result.ok)) this.transformResourceToml();
    return results;
  }

  transformResourceToml(transform = this.declare) {
    if (!fs.existsSync(this.resourceToml)) return;
    const text = fs.readFileSync(this.resourceToml, 'utf8');
    const next = transform(text);
    if (next !== text) fs.writeFileSync(this.resourceToml, next, 'utf8');
  }

  async build(requested = this.parts) {
    const started = Date.now();
    ensureDir(this.outDir);
    const results = this.standard
      ? await this.standardBuild(requested)
      : await this.customBuild(requested);
    for (const result of results) {
      if (result.stage !== 'typecheck') this.reportPart(result);
    }
    return {
      ok: results.length > 0 && results.every((result) => result.ok),
      results,
      ms: Date.now() - started,
    };
  }

  reportPart({ part, ok, ms, errors = [], output: said }) {
    const { output } = this;
    const seconds = (ms / 1000).toFixed(1);
    output.event(
      'build',
      { part, ok, ms, errors, output: said },
      ok
        ? `[${output.prefix}] ${t('built {part} in {seconds} s', { part, seconds })}`
        : formatErrors(t('build of {part}', { part }), errors, output, this.failureNote),
    );
  }

  // The parts to build again after a change in this file.
  partsFor(relative) {
    const { root } = this;
    const { build } = this.config;
    const file = path.resolve(root, relative);
    if (!this.standard) {
      return build.steps
        .filter((step) => step.watch.some((dir) => isInside(path.resolve(root, dir), file)))
        .map((step) => step.name);
    }
    for (const [part, dir] of Object.entries(this.sideDirs)) {
      if (isInside(dir, file)) return [part];
    }
    if (build.copy.some((item) => isInside(path.resolve(root, item), file))) return ['copy'];
    return this.parts;
  }

  copyOnly() {
    this.writeResource();
  }

  setResourceTransform(transform, { undo } = {}) {
    this.declare = transform;
    if (!fs.existsSync(this.resourceToml)) return;
    if (this.standard && fs.existsSync(path.join(this.resourceDir, 'server'))) {
      this.writeResource();
    } else if (transform || undo) {
      this.transformResourceToml(transform || undo);
    }
  }

  watchDirs() {
    const { root, config } = this;
    if (!this.standard) {
      const watched = config.build.steps.flatMap((step) => step.watch);
      return [...new Set(watched.map((dir) => path.resolve(root, dir)))];
    }
    const dirs = new Set(Object.values(this.sideDirs));
    for (const name of ['src', 'types']) {
      const dir = path.join(root, name);
      if (fs.existsSync(dir)) dirs.add(dir);
    }
    for (const item of [...config.build.copy, ...config.dev.watch]) {
      dirs.add(path.resolve(root, item));
    }
    return [...dirs];
  }

  async dispose() {
    for (const context of this.contexts.values()) await context.dispose().catch(() => {});
    this.contexts.clear();
  }

  clean() {
    removeTree(this.resourceDir);
  }
}

export function createBuilder(project, output, options) {
  return new Builder(project, output, options);
}

export function nonAsciiConfigKeys(table, prefix = '') {
  const keys = [];
  const nonAscii = (value) => typeof value === 'string' && /[\u0080-￿]/.test(value);
  for (const [key, value] of Object.entries(table || {})) {
    const name = prefix ? `${prefix}.${key}` : key;
    if (nonAscii(value)) keys.push(name);
    else if (Array.isArray(value) && value.some(nonAscii)) keys.push(name);
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...nonAsciiConfigKeys(value, name));
    }
  }
  return keys;
}

export function formatErrors(title, errors, output, note = '') {
  const count = errors.length || 1;
  const counted =
    count === 1 ? t('{title}: 1 error', { title }) : t('{title}: {count} errors', { title, count });
  const head = `[${output.prefix}] ${counted}${note ? `; ${note}` : ''}`;
  const lines = errors.slice(0, 20).map((error) => {
    const where = error.file ? `${error.file}:${error.line}:${error.column}` : '';
    return `  ${where}  ${error.text}`;
  });
  if (errors.length > 20)
    lines.push(`  ${t('... and {count} more', { count: errors.length - 20 })}`);
  return output.paint('red', [head, ...lines].join('\n'));
}
