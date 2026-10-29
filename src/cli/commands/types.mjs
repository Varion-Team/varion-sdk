import { t } from '../../i18n/index.mjs';
import { parseArgs } from '../args.mjs';
import { openProject } from '../prepare.mjs';
import { copySdkTypes } from '../scaffold.mjs';

export async function run(argv, { output: root, cliDir }) {
  const { options } = parseArgs(argv, {
    command: 'types',
    options: { json: 'boolean', cwd: 'string' },
    aliases: { C: 'cwd' },
  });
  const output = root.child('types');
  const project = openProject(options, output);
  const { source, written } = copySdkTypes(cliDir, project.root);
  const text = t('updated {count} type files from {source}', { count: written.length, source });
  output.event('types', { source, files: written }, `[${output.prefix}] ${text}`);
  return 0;
}
