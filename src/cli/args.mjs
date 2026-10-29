import { t } from '../i18n/index.mjs';
import { CliError } from './output.mjs';

export function parseArgs(argv, spec = {}) {
  const options = {};
  const positionals = [];
  const known = spec.options || {};
  const aliases = spec.aliases || {};
  const command = spec.command ? `varion ${spec.command}` : 'varion';
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--') {
      positionals.push(...argv.slice(i + 1));
      break;
    }
    let name;
    let inline;
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      name = eq >= 0 ? arg.slice(2, eq) : arg.slice(2);
      inline = eq >= 0 ? arg.slice(eq + 1) : undefined;
    } else if (/^-[A-Za-z]$/.test(arg)) {
      name = aliases[arg.slice(1)];
      if (!name)
        throw new CliError(t('{command}: unknown option {option}', { command, option: arg }));
    } else {
      positionals.push(arg);
      continue;
    }
    const option = `--${name}`;
    const type = known[name];
    if (!type) {
      const list = Object.keys(known)
        .map((key) => `--${key}`)
        .join(', ');
      throw new CliError(
        list
          ? t('{command}: unknown option {option} (known: {list})', { command, option, list })
          : t('{command}: unknown option {option}', { command, option }),
      );
    }
    const key = camel(name);
    if (type === 'boolean') {
      if (inline !== undefined && inline !== 'true' && inline !== 'false') {
        throw new CliError(t('{command}: {option} takes no value', { command, option }));
      }
      options[key] = inline === undefined ? true : inline === 'true';
      continue;
    }
    let value = inline;
    if (value === undefined) {
      value = argv[i + 1];
      if (value === undefined || (value.startsWith('--') && value.length > 2)) {
        throw new CliError(t('{command}: {option} needs a value', { command, option }));
      }
      i++;
    }
    if (type === 'number') {
      const number = Number(value);
      if (!Number.isFinite(number)) {
        throw new CliError(
          t('{command}: {option} needs a number, not "{value}"', { command, option, value }),
        );
      }
      options[key] = number;
    } else {
      options[key] = value;
    }
  }
  return { options, positionals };
}

function camel(name) {
  return name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
