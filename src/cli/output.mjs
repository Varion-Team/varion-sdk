import { t } from '../i18n/index.mjs';
import { VarionError } from '../shared/errors.mjs';
import { formatBytes } from '../shared/format.mjs';

export class CliError extends VarionError {
  constructor(message, { exitCode = 1, data, code, cause } = {}) {
    super(message, { code, cause });
    this.exitCode = exitCode;
    this.data = data;
  }
}

const COLORS = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

export function createOutput({
  json = false,
  prefix = 'varion',
  stdout = process.stdout,
  stderr = process.stderr,
  color,
  now = () => new Date(),
} = {}) {
  const useColor = color ?? (!json && Boolean(stdout.isTTY) && !process.env.NO_COLOR);
  const paint = (name, text) => (useColor ? `${COLORS[name]}${text}${COLORS.reset}` : text);

  const output = {
    json,
    prefix,
    color: useColor,
    paint,
    event(type, data = {}, text) {
      if (json) stdout.write(`${JSON.stringify({ type, time: now().toISOString(), ...data })}\n`);
      else if (text !== undefined && text !== null) stdout.write(`${text}\n`);
    },
    info(text, data = {}) {
      output.event('info', { text, ...data }, `[${prefix}] ${text}`);
    },
    success(text, data = {}) {
      output.event('info', { text, ...data }, paint('green', `[${prefix}] ${text}`));
    },
    warn(text, data = {}) {
      if (json) output.event('warn', { text, ...data });
      else stderr.write(`${paint('yellow', `[${prefix}] ${t('warning')}: ${text}`)}\n`);
    },
    error(text, data = {}) {
      if (json) output.event('error', { text, ...data });
      else stderr.write(`${paint('red', `[${prefix}] ${t('error')}: ${text}`)}\n`);
    },
    line(text, stream = 'stdout') {
      if (json) return;
      (stream === 'stderr' ? stderr : stdout).write(`${text}\n`);
    },
    child(childPrefix) {
      return createOutput({ json, prefix: childPrefix, stdout, stderr, color: useColor, now });
    },
  };
  return output;
}

export function createMemoryOutput({ json = true, prefix = 'varion' } = {}) {
  const lines = [];
  const sink = {
    write: (chunk) => lines.push(...String(chunk).split('\n').filter(Boolean)),
    isTTY: false,
  };
  const output = createOutput({ json, prefix, stdout: sink, stderr: sink, color: false });
  output.lines = lines;
  output.events = () => lines.map((line) => JSON.parse(line));
  return output;
}

export function downloadProgress(output, url, label) {
  let mark = 0.25;
  return (received, total) => {
    if (total < 8 << 20 || mark >= 1 || received / total < mark) return;
    mark += 0.25;
    output.event(
      'download',
      { url, received, total },
      `[${output.prefix}] ${t('{name}: {received} of {total}', {
        name: label,
        received: formatBytes(received),
        total: formatBytes(total),
      })}`,
    );
  };
}
