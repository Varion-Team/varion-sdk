import { spawn } from 'node:child_process';
import os from 'node:os';
import {
  cabinetBase,
  DeployError,
  initKeys,
  registerKey,
  savedLogin,
  saveLogin,
  signIn,
} from '../../deploy/client.mjs';
import { t } from '../../i18n/index.mjs';
import { isLoopbackHost } from '../../shared/http.mjs';
import { windowsTool } from '../../shared/process.mjs';
import { parseArgs } from '../args.mjs';
import { DEFAULT_CABINET } from '../config.mjs';
import { CliError } from '../output.mjs';

export function cabinetOption(options, env = process.env) {
  return cabinetBase(options.cabinet || env.VARION_CABINET_URL || DEFAULT_CABINET);
}

export function loginCommand(cabinet) {
  return cabinet === DEFAULT_CABINET ? 'varion login' : `varion login --cabinet ${cabinet}`;
}

export function noArguments(command, positionals) {
  if (positionals.length) {
    throw new CliError(
      t('{command}: unexpected arguments: {args}', { command, args: positionals.join(' ') }),
    );
  }
}

const oneLine = (text) =>
  String(text)
    .replace(/[\p{Cc}\p{Cf}]+/gu, ' ')
    .trim()
    .slice(0, 64);

// the cabinet takes key names as varion host trust does
const keyName = (text) =>
  text
    .replace(/[^\p{L}\p{N} ._@+-]+/gu, ' ')
    .replace(/ {2,}/g, ' ')
    .trim() || 'varion';

export function openBrowser(url, platform = process.platform) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  const web =
    parsed.protocol === 'https:' ||
    (parsed.protocol === 'http:' && isLoopbackHost(parsed.hostname));
  if (!web) return false;
  const [command, args] =
    platform === 'win32'
      ? [windowsTool('rundll32.exe'), ['url.dll,FileProtocolHandler', parsed.href]]
      : platform === 'darwin'
        ? ['open', [parsed.href]]
        : ['xdg-open', [parsed.href]];
  try {
    const child = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: true });
    child.on('error', () => {});
    child.unref();
    return true;
  } catch {
    return false;
  }
}

// Signs this computer in and adds its developer key to the account: what `varion login` does,
// and what a command that needs the sign-in does by itself the first time it is run.
export async function signInHere({ cabinet, name, noBrowser = false, output }) {
  const { token, account } = await signIn({
    cabinetUrl: cabinet,
    name,
    onCode: ({ userCode, verifyUrl, expiresIn }) => {
      const minutes = Math.max(1, Math.round(expiresIn / 60));
      output.event(
        'login-code',
        { cabinet, userCode, verifyUrl, expiresIn },
        `[login] ${t('confirm the code {code} in the browser: {url} (valid for {minutes} min)', {
          code: userCode,
          url: verifyUrl,
          minutes,
        })}`,
      );
      if (!noBrowser) openBrowser(verifyUrl);
    },
  });
  saveLogin(cabinet, { token, account });
  output.event(
    'login',
    { cabinet, account },
    output.paint(
      'green',
      `[login] ${t('signed in to {cabinet} as {name}', { cabinet, name: account.name || account.id })}`,
    ),
  );

  const key = initKeys();
  if (key.created) {
    output.info(
      t('created the developer key {fingerprint} ({file})', {
        fingerprint: key.fingerprint,
        file: key.privateKeyPath,
      }),
    );
  }
  let registered;
  try {
    registered = await registerKey({
      cabinetUrl: cabinet,
      token,
      publicKey: key.publicKey,
      name: keyName(name),
    });
  } catch (error) {
    if (!(error instanceof DeployError)) throw error;
    const passing = error.code === 'network' || error.status >= 500 || error.status === 429;
    output.warn(
      passing
        ? t('the developer key was not added to your account ({error}); run varion login again', {
            error: error.message,
          })
        : t('the developer key was not added to your account: {error}', { error: error.message }),
    );
    return { token, account, keyAdded: false };
  }
  output.event(
    'key',
    { cabinet, publicKey: key.publicKey, ...registered },
    `[login] ${t(
      'the developer key {fingerprint} is added to your account; the owner of a server approves it in the cabinet before your deploys go there (your own servers trust it already)',
      { fingerprint: registered.fingerprint },
    )}`,
  );
  return { token, account, keyAdded: true };
}

// A person at a terminal: a command may open the browser and wait for them. Not CI, not a pipe.
export function canAskToSignIn(env = process.env) {
  return (
    !!process.stdin.isTTY && !!process.stdout.isTTY && !env.CI && env.VARION_NO_SIGN_IN !== '1'
  );
}

// The saved sign-in of this computer, made now when there is none and someone can confirm it.
export async function ensureSignedIn(cabinet, root, { env = process.env } = {}) {
  const saved = savedLogin(cabinet, { env });
  if (saved || !canAskToSignIn(env)) return saved;
  const output = root.child('login');
  output.info(t('this computer is not signed in to {cabinet} yet: signing in', { cabinet }));
  const made = await signInHere({ cabinet, name: oneLine(os.hostname()) || 'varion', output });
  return { token: made.token, account: made.account };
}

export async function run(argv, { output: root }) {
  const { options, positionals } = parseArgs(argv, {
    command: 'login',
    options: { cabinet: 'string', name: 'string', 'no-browser': 'boolean', json: 'boolean' },
  });
  noArguments('varion login', positionals);
  const output = root.child('login');
  const cabinet = cabinetOption(options);
  const name = oneLine(options.name || os.hostname()) || 'varion';
  const made = await signInHere({ cabinet, name, noBrowser: !!options.noBrowser, output });
  return made.keyAdded ? 0 : 1;
}
