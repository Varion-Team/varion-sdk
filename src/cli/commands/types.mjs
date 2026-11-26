import fs from 'node:fs';
import path from 'node:path';
import { t } from '../../i18n/index.mjs';
import { serverIndexClient } from '../../shared/server-index.mjs';
import { parseArgs } from '../args.mjs';
import { openProject } from '../prepare.mjs';
import { CliError } from '../output.mjs';
import { copySdkTypes, DEFAULT_ENGINE } from '../scaffold.mjs';

export async function run(argv, { output: root, cliDir, serverIndex = serverIndexClient() }) {
  const { options } = parseArgs(argv, {
    command: 'types',
    options: { json: 'boolean', cwd: 'string' },
    aliases: { C: 'cwd' },
  });
  const output = root.child('types');
  const project = openProject(options, output);
  const before = fs.readFileSync(path.join(project.root, 'varion.toml'), 'utf8');
  const { engine } = project.config;
  const index = engine.path ? null : await serverIndex.index(engine.channel, engine.version);
  if (
    !index &&
    !engine.path &&
    (engine.channel !== DEFAULT_ENGINE.channel || engine.version !== DEFAULT_ENGINE.version)
  ) {
    throw new CliError(
      t('no published types for engine {version} in {channel}; existing types were kept', engine),
    );
  }
  const { source, written } = copySdkTypes(
    cliDir,
    project.root,
    index ? await serverIndex.types(index) : undefined,
    { before },
  );
  const text = t('updated {count} type files from {source}', { count: written.length, source });
  output.event('types', { source, files: written }, `[${output.prefix}] ${text}`);
  return 0;
}
