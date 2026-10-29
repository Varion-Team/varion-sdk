import { DeployError, getAccount, savedLogin } from '../../deploy/client.mjs';
import { t } from '../../i18n/index.mjs';
import { parseArgs } from '../args.mjs';
import { CliError } from '../output.mjs';
import { cabinetOption, loginCommand, noArguments } from './login.mjs';

function rightsText({ deployTest, deployProd }) {
  if (deployTest && deployProd) return t('deploys to test, previews and prod');
  if (deployTest) return t('deploys to test and previews');
  if (deployProd) return t('deploys to prod');
  return t('no deploys');
}

export async function run(argv, { output: root }) {
  const { options, positionals } = parseArgs(argv, {
    command: 'whoami',
    options: { cabinet: 'string', json: 'boolean' },
  });
  noArguments('varion whoami', positionals);
  const output = root.child('whoami');
  const cabinet = cabinetOption(options);
  const login = savedLogin(cabinet);
  const command = loginCommand(cabinet);
  if (!login) {
    throw new CliError(
      t('this computer is not signed in to {cabinet}: {command}', { cabinet, command }),
      { code: 'not_signed_in' },
    );
  }
  let me;
  try {
    me = await getAccount({ cabinetUrl: cabinet, token: login.token });
  } catch (error) {
    if (error instanceof DeployError && error.status === 401) {
      throw new CliError(
        t('the cabinet no longer accepts the sign-in of this computer: {command}', { command }),
        { code: 'signed_out' },
      );
    }
    throw error;
  }
  const { account, servers } = me;
  output.event(
    'account',
    { cabinet, account, servers },
    `[whoami] ${t('{name} (account {id}) at {cabinet}', {
      name: account.name || '-',
      id: account.id || '-',
      cabinet,
    })}`,
  );
  if (!servers.length) {
    output.line(`  ${t('no servers yet: create one in the cabinet or accept an invite')}`);
  }
  for (const server of servers) {
    output.line(`  ${server.name || server.id} (${server.id}): ${rightsText(server)}`);
  }
  return 0;
}
