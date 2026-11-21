import fs from 'node:fs';
import path from 'node:path';
import { t } from '../../i18n/index.mjs';
import { packResource } from '../../market/pack.mjs';
import { formatBytes } from '../../shared/format.mjs';
import { writeFileAtomic } from '../../shared/fs.mjs';
import { parseArgs } from '../args.mjs';
import { CliError } from '../output.mjs';

export function resourceDir(positionals, options, command) {
  if (positionals.length > 1) {
    throw new CliError(
      t('{command}: unexpected arguments: {args}', {
        command,
        args: positionals.slice(1).join(' '),
      }),
    );
  }
  return path.resolve(options.cwd || process.cwd(), positionals[0] || '.');
}

export function reportPacked(output, packed) {
  const count = (side) => packed.files.filter((file) => file.side === side).length;
  const bytes = (side) =>
    packed.files.filter((file) => file.side === side).reduce((sum, file) => sum + file.size, 0);
  output.line(
    `  ${t('server, sealed: {count} files, {size}', { count: count('server'), size: formatBytes(bytes('server')) })}`,
  );
  output.line(
    `  ${t('clients, sealed: {count} files, {size}', { count: count('client'), size: formatBytes(bytes('client')) })}`,
  );
  output.line(
    `  ${t('left open for the buyer: {list}', {
      list: packed.files
        .filter((file) => file.side === 'open')
        .map((file) => file.path)
        .join(', '),
    })}`,
  );
  for (const folder of packed.skipped) {
    output.warn(
      t(
        '{folder} is not packed: build your dependencies into the server script, or name the folder in [market] open',
        { folder },
      ),
    );
  }
}

export async function run(argv, { output: root }) {
  const { options, positionals } = parseArgs(argv, {
    command: 'pack',
    options: { out: 'string', version: 'string', cwd: 'string', json: 'boolean' },
    aliases: { C: 'cwd' },
  });
  const output = root.child('pack');
  const dir = resourceDir(positionals, options, 'varion pack');
  const packed = packResource(dir, { version: options.version });
  const file = path.resolve(
    options.out || path.join(dir, `${packed.name}-${packed.version}.vpack`),
  );
  fs.mkdirSync(path.dirname(file), { recursive: true });
  writeFileAtomic(file, packed.bundle);
  output.event(
    'packed',
    {
      name: packed.name,
      version: packed.version,
      file,
      bytes: packed.bundle.length,
      files: packed.files,
      skipped: packed.skipped,
    },
    `[pack] ${t('{name} {version} packed: {file} ({size})', {
      name: packed.name,
      version: packed.version,
      file,
      size: formatBytes(packed.bundle.length),
    })}`,
  );
  if (!output.json) reportPacked(output, packed);
  return 0;
}
