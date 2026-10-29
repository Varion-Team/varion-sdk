import cliBuild from './ru/cli-build.mjs';
import cliDev from './ru/cli-dev.mjs';
import cliNew from './ru/cli-new.mjs';
import cli from './ru/cli.mjs';
import deploy from './ru/deploy.mjs';
import devUi from './ru/dev-ui.mjs';
import hostRuntime from './ru/host-runtime.mjs';
import host from './ru/host.mjs';
import shared from './ru/shared.mjs';

export default {
  ...shared,
  ...cli,
  ...cliNew,
  ...cliDev,
  ...cliBuild,
  ...deploy,
  ...devUi,
  ...host,
  ...hostRuntime,
};
