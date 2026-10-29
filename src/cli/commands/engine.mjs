import { t } from '../../i18n/index.mjs';
import { parseArgs } from '../args.mjs';
import { resolveEngine } from '../engine.mjs';
import { openProject } from '../prepare.mjs';

export async function run(argv, { output: root }) {
  const { options } = parseArgs(argv, {
    command: 'engine',
    options: { verify: 'boolean', json: 'boolean', cwd: 'string' },
    aliases: { C: 'cwd' },
  });
  const output = root.child('engine');
  const project = openProject(options, output);
  const engine = await resolveEngine(project, output, { verifyHashes: Boolean(options.verify) });
  const which =
    engine.source === 'path' ? t('your own build') : `${engine.version} (${engine.channel})`;
  output.event('engine-info', engine, `[${output.prefix}] ${which}: ${engine.exe}`);
  return 0;
}
