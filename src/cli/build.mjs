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
import { loadEsbuild, loadVite } from './tools.mjs';
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

export function createBuilder(
  project,
  output,
  { outDir, mapsDir, mode = 'dev', envName = null, typecheckCache = null, failureNote = '' },
) {
  const { root, config } = project;
  const { build } = config;
  const resourceDir = resourceDirOf(project, outDir);
  const contexts = new Map();
  let esbuild = null;

  const standard = build.kind === 'standard';
  const entries = {};
  if (standard) {
    for (const part of ['server', 'client', 'ui']) {
      if (!build[part]) continue;
      const full = path.resolve(root, build[part]);
      if (!fs.existsSync(full)) {
        if (part === 'server') {
          throw new CliError(
            t("[build] server: {file} does not exist (the entry point of the mode's server)", {
              file: build[part],
            }),
          );
        }
        output.warn(
          t('[build] {part}: {file} does not exist, so this part is not built', {
            part,
            file: build[part],
          }),
        );
        continue;
      }
      entries[part] = full;
    }
  }
  const parts = standard ? Object.keys(entries) : build.steps.map((step) => step.name);

  const sideDirs = {};
  if (standard) {
    if (entries.server) sideDirs.server = path.dirname(entries.server);
    if (entries.client) sideDirs.client = path.dirname(entries.client);
    if (entries.ui) sideDirs.ui = entries.ui;
  }

  function tsconfigOf(part) {
    const from = part === 'ui' ? entries.ui : path.dirname(entries[part]);
    return findTsconfig(root, from);
  }

  async function esbuildPart(part) {
    if (!esbuild) esbuild = (await loadEsbuild(root)).module;
    let context = contexts.get(part);
    if (!context) {
      const common = {
        entryPoints: [entries[part]],
        bundle: true,
        absWorkingDir: root,
        logLevel: 'silent',
        charset: 'utf8',
        legalComments: 'none',
        define: {
          'process.env.NODE_ENV': JSON.stringify(mode === 'release' ? 'production' : 'development'),
        },
      };
      const options =
        part === 'server'
          ? {
              ...common,
              outfile: path.join(resourceDir, 'server', 'index.js'),
              platform: 'node',
              format: 'cjs',
              target: build.target,
              sourcemap: 'linked',
              external: build.external,
            }
          : {
              ...common,
              outfile: path.join(resourceDir, 'client', 'index.js'),
              platform: 'neutral',
              mainFields: ['module', 'main'],
              format: 'esm',
              target: 'es2022',
              // the client runtime provides the natives
              external: ['@varion/natives'],
              sourcemap: mapsDir ? 'external' : false,
            };
      const tsconfig = tsconfigOf(part);
      if (tsconfig) options.tsconfig = tsconfig;
      context = await esbuild.context(options);
      contexts.set(part, context);
    }
    await context.rebuild();
    if (part === 'client' && mapsDir) {
      const map = path.join(resourceDir, 'client', 'index.js.map');
      if (fs.existsSync(map)) {
        ensureDir(mapsDir);
        fs.copyFileSync(map, path.join(mapsDir, 'client.js.map'));
        fs.rmSync(map, { force: true });
      }
    }
  }

  async function vitePart() {
    const { module: vite, version } = await loadVite(root);
    const uiRoot = entries.ui;
    const configFile = ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs']
      .map((name) => path.join(uiRoot, name))
      .find((file) => fs.existsSync(file));
    const major = Number(String(version).split('.')[0]);
    // Rolldown (Vite 8+) keeps an iife in one chunk by itself
    const bundlerOptions = {
      output: major >= 8 ? { format: 'iife' } : { format: 'iife', inlineDynamicImports: true },
    };
    await vite.build({
      root: uiRoot,
      base: './',
      configFile: configFile || false,
      logLevel: 'silent',
      clearScreen: false,
      mode: mode === 'release' ? 'production' : 'development',
      plugins: [classicScriptPlugin()],
      build: {
        outDir: path.join(resourceDir, 'ui'),
        emptyOutDir: true,
        modulePreload: false,
        sourcemap: mode === 'release' ? false : 'inline',
        target: 'chrome120',
        reportCompressedSize: false,
        ...(major >= 8 ? { rolldownOptions: bundlerOptions } : { rollupOptions: bundlerOptions }),
      },
    });
  }

  let warnedConfig = false;
  // varion dev with the live UI adds the [dev-ui] table through this
  let declare = null;
  function writeResource() {
    ensureDir(resourceDir);
    let text = resourceTomlText(project, {
      envName,
      parts: { client: Boolean(entries.client), ui: Boolean(entries.ui) },
    });
    if (declare) text = declare(text);
    const file = path.join(resourceDir, 'resource.toml');
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) {
      fs.writeFileSync(file, text, 'utf8');
    }
    // the server bundle is CommonJS even when the project's package.json says "type": "module"
    const marker = path.join(resourceDir, 'server', 'package.json');
    if (fs.existsSync(path.dirname(marker)) && !fs.existsSync(marker)) {
      fs.writeFileSync(marker, '{ "type": "commonjs", "private": true }\n', 'utf8');
    }
    const nonAscii = nonAsciiConfigKeys(resourceConfig(config, { envName }));
    if (nonAscii.length && !warnedConfig && engineGarblesConfigText(config.engine)) {
      warnedConfig = true;
      output.warn(
        t(
          '[config] {keys}: engine 1.0.75 and older garble non-Latin text in varion.getResourceConfig() on Windows with a Cyrillic code page; keep such text in code or in .env, or use a newer engine',
          { keys: nonAscii.join(', ') },
        ),
      );
    }
    for (const item of build.copy) {
      const from = path.resolve(root, item);
      const to = path.join(resourceDir, item);
      if (!fs.existsSync(from)) {
        output.warn(t('[build] copy: {item} does not exist', { item }));
        continue;
      }
      if (fs.statSync(from).isDirectory()) {
        mirrorDir(from, to, { skip: (relative) => UI_STATIC_SKIP.test(relative) });
      } else {
        copyIfChanged(from, to);
      }
    }
  }

  async function standardBuild(requested) {
    const wanted = requested.filter((part) => entries[part]);
    const results = [];
    // types first: a mistake keeps the previous bundle in place
    if (build.typecheck && wanted.length) {
      const sides = wanted
        .map((part) => ({ name: part, tsconfig: tsconfigOf(part) }))
        .filter((side) => side.tsconfig);
      const checked = await typecheck(project, sides, { cacheDir: typecheckCache });
      if (checked.skipped) {
        output.warn(t('type check skipped: {reason}', { reason: checked.skipped }));
      }
      for (const result of checked.results) {
        output.event(
          'typecheck',
          { part: result.name, ok: result.ok, ms: result.ms, errors: result.errors },
          result.ok
            ? undefined
            : formatErrors(
                t('type check of {part}', { part: result.name }),
                result.errors,
                output,
                failureNote,
              ),
        );
      }
      const failed = checked.results.filter((result) => !result.ok);
      if (failed.length) {
        for (const result of failed) {
          results.push({
            part: result.name,
            ok: false,
            ms: result.ms,
            errors: result.errors,
            stage: 'typecheck',
          });
        }
        return results;
      }
    }
    await Promise.all(
      wanted.map(async (part) => {
        const started = Date.now();
        try {
          if (part === 'ui') await vitePart();
          else await esbuildPart(part);
          results.push({ part, ok: true, ms: Date.now() - started });
        } catch (error) {
          if (error instanceof VarionError) throw error;
          const errors = part === 'ui' ? viteErrors(error, root) : esbuildErrors(error, root);
          results.push({ part, ok: false, ms: Date.now() - started, errors, stage: 'bundle' });
        }
      }),
    );
    if (results.every((result) => result.ok)) writeResource();
    return results;
  }

  async function customBuild(requested) {
    const results = [];
    for (const step of build.steps.filter((item) => requested.includes(item.name))) {
      const started = Date.now();
      const result = await runShell(step.run, {
        cwd: step.cwd,
        capture: output.json,
        vars: {
          out: outDir,
          resource: resourceDir,
          name: config.project.name,
          root,
          maps: mapsDir || path.join(outDir, '..', 'maps'),
          mode,
        },
      });
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
    return results;
  }

  return {
    parts,
    resourceDir,
    sideDirs,
    entries,
    async build(requested = parts) {
      const started = Date.now();
      ensureDir(outDir);
      const results = standard ? await standardBuild(requested) : await customBuild(requested);
      if (!standard && declare && results.every((result) => result.ok)) {
        // the project's own step wrote resource.toml without the [dev-ui] table
        const file = path.join(resourceDir, 'resource.toml');
        if (fs.existsSync(file)) {
          const text = fs.readFileSync(file, 'utf8');
          const next = declare(text);
          if (next !== text) fs.writeFileSync(file, next, 'utf8');
        }
      }
      for (const result of results) {
        if (result.stage === 'typecheck') continue;
        const seconds = (result.ms / 1000).toFixed(1);
        output.event(
          'build',
          {
            part: result.part,
            ok: result.ok,
            ms: result.ms,
            errors: result.errors || [],
            output: result.output,
          },
          result.ok
            ? `[${output.prefix}] ${t('built {part} in {seconds} s', { part: result.part, seconds })}`
            : formatErrors(
                t('build of {part}', { part: result.part }),
                result.errors || [],
                output,
                failureNote,
              ),
        );
      }
      return {
        ok: results.length > 0 && results.every((result) => result.ok),
        results,
        ms: Date.now() - started,
      };
    },
    partsFor(relative) {
      const file = path.resolve(root, relative);
      if (!standard) {
        return build.steps
          .filter((step) => step.watch.some((dir) => isInside(path.resolve(root, dir), file)))
          .map((step) => step.name);
      }
      for (const [part, dir] of Object.entries(sideDirs)) {
        if (isInside(dir, file)) return [part];
      }
      if (build.copy.some((item) => isInside(path.resolve(root, item), file))) return ['copy'];
      return parts;
    },
    copyOnly() {
      writeResource();
    },
    setResourceTransform(transform, { undo } = {}) {
      declare = transform;
      const file = path.join(resourceDir, 'resource.toml');
      if (!fs.existsSync(file)) return;
      if (standard && fs.existsSync(path.join(resourceDir, 'server'))) {
        writeResource();
        return;
      }
      const text = fs.readFileSync(file, 'utf8');
      const next = transform ? transform(text) : undo ? undo(text) : text;
      if (next !== text) fs.writeFileSync(file, next, 'utf8');
    },
    watchDirs() {
      if (!standard) {
        return [
          ...new Set(
            build.steps.flatMap((step) => step.watch.map((dir) => path.resolve(root, dir))),
          ),
        ];
      }
      const dirs = new Set(Object.values(sideDirs));
      const src = path.join(root, 'src');
      if (fs.existsSync(src)) dirs.add(src);
      const types = path.join(root, 'types');
      if (fs.existsSync(types)) dirs.add(types);
      for (const item of build.copy) dirs.add(path.resolve(root, item));
      for (const extra of config.dev.watch) dirs.add(path.resolve(root, extra));
      return [...dirs];
    },
    async dispose() {
      for (const context of contexts.values()) await context.dispose().catch(() => {});
      contexts.clear();
    },
    clean() {
      removeTree(resourceDir);
    },
  };
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
