import fs from 'node:fs';
import path from 'node:path';
import { t } from '../../i18n/index.mjs';
import { parseArgs } from '../args.mjs';
import { CliError } from '../output.mjs';
import { findTsconfig, typecheck } from '../typecheck.mjs';
import { formatErrors } from '../build.mjs';
import { openProject } from '../prepare.mjs';

export async function run(argv, { output: root }) {
  const { options } = parseArgs(argv, {
    command: 'check',
    options: { json: 'boolean', cwd: 'string' },
    aliases: { C: 'cwd' },
  });
  const output = root.child('check');
  const project = openProject(options, output);
  const { build } = project.config;
  if (build.kind !== 'standard') {
    throw new CliError(
      t(
        'varion check is for the standard build ([build] server/client/ui); this project has its own [build.steps]',
      ),
    );
  }
  const sides = [];
  for (const part of ['server', 'client', 'ui']) {
    if (!build[part]) continue;
    const entry = path.resolve(project.root, build[part]);
    if (!fs.existsSync(entry)) continue;
    const tsconfig = findTsconfig(project.root, part === 'ui' ? entry : path.dirname(entry));
    if (tsconfig) sides.push({ name: part, tsconfig });
  }
  if (!sides.length) {
    throw new CliError(t('nothing to check: no part of the mode has a tsconfig.json'));
  }
  const result = await typecheck(project, sides, { cacheDir: project.paths.tsc });
  if (result.skipped) {
    throw new CliError(
      t('cannot check types: {reason} (run npm install)', { reason: result.skipped }),
    );
  }
  for (const side of result.results) {
    const seconds = (side.ms / 1000).toFixed(1);
    output.event(
      'typecheck',
      { part: side.name, ok: side.ok, ms: side.ms, errors: side.errors },
      side.ok
        ? `[check] ${t('{part}: no errors ({seconds} s)', { part: side.name, seconds })}`
        : formatErrors(t('type check of {part}', { part: side.name }), side.errors, output),
    );
  }
  return result.ok ? 0 : 1;
}
