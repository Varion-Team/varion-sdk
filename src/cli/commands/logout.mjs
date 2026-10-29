import { forgetLogin } from '../../deploy/client.mjs';
import { t } from '../../i18n/index.mjs';
import { parseArgs } from '../args.mjs';
import { cabinetOption, noArguments } from './login.mjs';

export async function run(argv, { output: root }) {
  const { options, positionals } = parseArgs(argv, {
    command: 'logout',
    options: { cabinet: 'string', json: 'boolean' },
  });
  noArguments('varion logout', positionals);
  const output = root.child('logout');
  const cabinet = cabinetOption(options);
  const forgotten = forgetLogin(cabinet);
  output.event(
    'logout',
    { cabinet, forgotten },
    `[logout] ${
      forgotten
        ? t(
            'this computer forgot the sign-in to {cabinet}; to revoke the token itself, remove this device in the cabinet',
            { cabinet },
          )
        : t('this computer is not signed in to {cabinet}', { cabinet })
    }`,
  );
  return 0;
}
