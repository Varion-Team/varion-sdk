#!/usr/bin/env node
import { startDevUiProxy } from '../src/dev-ui/proxy.mjs';
import { t } from '../src/i18n/index.mjs';

const OPTIONS = ['upstream', 'port', 'shim', 'fallback'];
const USAGE =
  'varion-dev-ui --upstream <url> [--port <port>] [--shim <file>]... [--fallback <url>]';

function help() {
  return `${t('usage: {usage}', { usage: USAGE })}

${t('puts the page shims first into every page of a UI dev server that cannot take the Vite plugin')}

  --upstream <url>   ${t('the UI dev server, http://127.0.0.1:<port>')}
  --port <port>      ${t('the port on 127.0.0.1 the game loads the pages from; a free one when left out')}
  --shim <file>      ${t('a script to put first into every page; repeat for more')}
  --fallback <url>   ${t('where the files the UI dev server does not have come from')}
                     http://127.0.0.1:<http port>/assets/<resource>/<root>
  -h, --help         ${t('show this help')}
`;
}

function parse(argv) {
  const options = { shims: [] };
  const extra = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      options.help = true;
      continue;
    }
    const match = /^--([^=]+)(?:=(.*))?$/s.exec(arg);
    if (!match) {
      extra.push(arg);
      continue;
    }
    const [, name, inline] = match;
    if (!OPTIONS.includes(name)) return { error: t('unknown option --{option}', { option: name }) };
    const value = inline ?? argv[++i];
    if (value === undefined || (inline === undefined && value.startsWith('--')))
      return { error: t('--{option} needs a value', { option: name }) };
    if (name === 'shim') options.shims.push(value);
    else options[name] = value;
  }
  if (extra.length) return { error: t('unexpected arguments: {args}', { args: extra.join(' ') }) };
  return { options };
}

function complain(message) {
  process.stderr.write(`[dev-ui] ${t('error')}: ${message}\n`);
}

async function main(argv) {
  const { options, error } = parse(argv);
  if (error) {
    complain(error);
    return 1;
  }
  if (options.help) {
    process.stdout.write(help());
    return 0;
  }
  if (!options.upstream) {
    complain(t('the UI dev server address is required: --upstream http://127.0.0.1:<port>'));
    return 1;
  }
  let proxy;
  try {
    proxy = await startDevUiProxy({
      upstream: options.upstream,
      port: options.port,
      shims: options.shims,
      fallback: options.fallback,
      log: (line) => process.stdout.write(`[dev-ui] ${line}\n`),
    });
  } catch (failure) {
    complain(
      failure.code === 'EADDRINUSE'
        ? t('port {port} on 127.0.0.1 is in use: stop what listens there or pick another --port', {
            port: options.port,
          })
        : failure.message,
    );
    return 1;
  }
  const stop = () => {
    process.off('SIGINT', stop);
    process.off('SIGTERM', stop);
    void proxy.close();
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  return null;
}

const code = await main(process.argv.slice(2));
if (code !== null) process.exitCode = code;
