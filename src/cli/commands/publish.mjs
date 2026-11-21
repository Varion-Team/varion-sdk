import fs from 'node:fs';
import path from 'node:path';
import { DeployError, savedLogin } from '../../deploy/client.mjs';
import { t } from '../../i18n/index.mjs';
import { publishVersion } from '../../market/client.mjs';
import { packResource, readPacked } from '../../market/pack.mjs';
import { formatBytes } from '../../shared/format.mjs';
import { parseArgs } from '../args.mjs';
import { CliError } from '../output.mjs';
import { cabinetOption, loginCommand } from './login.mjs';
import { reportPacked, resourceDir } from './pack.mjs';

export function signedIn(cabinet) {
  const login = savedLogin(cabinet);
  if (!login) {
    throw new CliError(
      t('this computer is not signed in to {cabinet}: {command}', {
        cabinet,
        command: loginCommand(cabinet),
      }),
      { code: 'not_signed_in' },
    );
  }
  return login;
}

export function signedOut(error, cabinet) {
  if (error instanceof DeployError && error.status === 401) {
    return new CliError(
      t('the cabinet no longer accepts the sign-in of this computer: {command}', {
        command: loginCommand(cabinet),
      }),
      { code: 'signed_out' },
    );
  }
  return error;
}

export async function run(argv, { output: root }) {
  const { options, positionals } = parseArgs(argv, {
    command: 'publish',
    options: {
      version: 'string',
      beta: 'boolean',
      notes: 'string',
      file: 'string',
      cabinet: 'string',
      cwd: 'string',
      json: 'boolean',
    },
    aliases: { C: 'cwd' },
  });
  const output = root.child('publish');
  const cabinet = cabinetOption(options);
  const login = signedIn(cabinet);

  let name;
  let version;
  let bundle;
  if (options.file) {
    // a file made earlier by varion pack goes up as it is
    const file = path.resolve(options.cwd || process.cwd(), options.file);
    bundle = fs.readFileSync(file);
    ({ name, version } = readPacked(bundle));
    if (options.version) version = options.version;
  } else {
    const packed = packResource(resourceDir(positionals, options, 'varion publish'), {
      version: options.version,
    });
    ({ name, version, bundle } = packed);
    output.event(
      'packed',
      { name, version, bytes: bundle.length, files: packed.files, skipped: packed.skipped },
      `[publish] ${t('{name} {version} packed ({size})', { name, version, size: formatBytes(bundle.length) })}`,
    );
    if (!output.json) reportPacked(output, packed);
  }

  let published;
  try {
    published = await publishVersion({
      cabinetUrl: cabinet,
      token: login.token,
      name,
      version,
      bundle,
      beta: options.beta === true,
      notes: options.notes || '',
    });
  } catch (error) {
    throw signedOut(error, cabinet);
  }
  output.event(
    'published',
    { cabinet, name, version, channel: options.beta ? 'beta' : 'stable', id: published.id || '' },
    `[publish] ${
      options.beta
        ? t(
            '{name} {version} is published as a beta: servers of buyers let into betas load it at their next start',
            { name, version },
          )
        : t("{name} {version} is published: buyers' servers load it at their next start", {
            name,
            version,
          })
    }`,
  );
  return 0;
}
