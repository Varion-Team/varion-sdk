import path from 'node:path';
import { t } from '../../i18n/index.mjs';
import { parseArgs } from '../args.mjs';
import { CliError } from '../output.mjs';
import { createBuilder } from '../build.mjs';
import { checkEnvName, openProject } from '../prepare.mjs';

export async function run(argv, { output: root }) {
  const { options } = parseArgs(argv, {
    command: 'build',
    options: { env: 'string', release: 'boolean', out: 'string', json: 'boolean', cwd: 'string' },
    aliases: { C: 'cwd' },
  });
  const output = root.child('build');
  const project = openProject(options, output);
  checkEnvName(project, options.env || null);
  const outDir = options.out ? path.resolve(options.out) : project.paths.server;
  const builder = createBuilder(project, output, {
    outDir,
    mapsDir: options.out ? path.join(outDir, '..', 'maps') : project.paths.maps,
    mode: options.release ? 'release' : 'dev',
    envName: options.env || null,
    typecheckCache: project.paths.tsc,
  });
  try {
    const result = await builder.build();
    if (!result.ok) throw new CliError(t('the build failed (errors above)'));
    const resource = path.relative(project.root, builder.resourceDir) || builder.resourceDir;
    const seconds = (result.ms / 1000).toFixed(1);
    output.event(
      'built',
      { resource: builder.resourceDir, ms: result.ms },
      output.paint(
        'green',
        `[build] ${t('done: {resource} ({seconds} s)', { resource, seconds })}`,
      ),
    );
    return 0;
  } finally {
    await builder.dispose();
  }
}
