import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { ensureDir, toPosix } from '../shared/fs.mjs';
import { findTsc } from './tools.mjs';
import { runProgramAsync } from './proc.mjs';

export function findTsconfig(root, fromDir) {
  let dir = path.resolve(fromDir);
  for (;;) {
    const candidate = path.join(dir, 'tsconfig.json');
    if (fs.existsSync(candidate)) return candidate;
    if (dir === path.resolve(root)) return null;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

// file(line,col): error TS1234: text, continued on indented lines
export function parseTscOutput(text, root) {
  const errors = [];
  for (const line of String(text).split(/\r?\n/)) {
    const match = /^(.+?)\((\d+),(\d+)\): (error|warning) (TS\d+): (.*)$/.exec(line);
    const global = /^error (TS\d+): (.*)$/.exec(line);
    if (match) {
      const file = path.isAbsolute(match[1]) ? match[1] : path.resolve(root, match[1]);
      errors.push({
        file: toPosix(path.relative(root, file)),
        line: Number(match[2]),
        column: Number(match[3]),
        code: match[5],
        text: match[6],
      });
    } else if (/^\s+\S/.test(line) && errors.length) {
      errors[errors.length - 1].text += ` ${line.trim()}`;
    } else if (global) {
      errors.push({ file: null, line: 0, column: 0, code: global[1], text: global[2] });
    }
  }
  return errors;
}

export async function typecheck(project, sides, { cacheDir } = {}) {
  const tsc = findTsc(project.root);
  if (!tsc) {
    return { ok: true, skipped: t('typescript is not installed in the project'), results: [] };
  }
  const major = Number(String(tsc.version).split('.')[0]);
  const results = await Promise.all(
    sides.map(async ({ name, tsconfig }) => {
      const started = Date.now();
      const args = [tsc.script, '-p', tsconfig, '--noEmit', '--pretty', 'false'];
      if (cacheDir && major < 7) {
        ensureDir(cacheDir);
        args.push('--incremental', '--tsBuildInfoFile', path.join(cacheDir, `${name}.tsbuildinfo`));
      }
      const result = await runProgramAsync(tsc.node, args, { cwd: project.root });
      const errors = parseTscOutput(`${result.stdout}\n${result.stderr}`, project.root);
      if (result.code !== 0 && !errors.length) {
        const said = (result.stderr || result.stdout).trim().slice(0, 2000);
        errors.push({
          file: null,
          line: 0,
          column: 0,
          code: 'tsc',
          text: said || t('tsc exited with code {code}', { code: result.code }),
        });
      }
      return { name, ok: result.code === 0, ms: Date.now() - started, errors };
    }),
  );
  return { ok: results.every((result) => result.ok), results, tscVersion: tsc.version };
}
