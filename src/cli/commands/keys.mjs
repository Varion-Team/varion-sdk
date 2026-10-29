import { initKeys, showKey } from '../../deploy/client.mjs';
import { t } from '../../i18n/index.mjs';
import { parseArgs } from '../args.mjs';
import { CliError } from '../output.mjs';

export async function run(argv, { output: root }) {
  const { positionals } = parseArgs(argv, {
    command: 'keys',
    options: { json: 'boolean', cwd: 'string' },
    aliases: { C: 'cwd' },
  });
  const output = root.child('keys');
  const action = positionals[0] || 'show';
  if (action !== 'init' && action !== 'show') {
    throw new CliError(t('unknown command "varion keys {action}": use init or show', { action }));
  }
  const key = action === 'init' ? initKeys() : showKey();
  output.event('key', key, `[${output.prefix}] ${t('public key: {key}', { key: key.publicKey })}`);
  if (key.source === 'env') {
    output.info(t('the key comes from VARION_DEPLOY_KEY, not from the keys folder'));
  }
  return 0;
}
