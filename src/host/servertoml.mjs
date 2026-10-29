import { stripBom } from '../shared/fs.mjs';

export function stripComment(line) {
  let quote = '';
  let escaped = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (quote === '"' && escaped) {
      escaped = false;
      continue;
    }
    if (quote === '"' && char === '\\') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '#') {
      return line.slice(0, index);
    }
  }
  return line;
}

function bracketBalance(value) {
  let balance = 0;
  let quote = '';
  let escaped = false;
  for (const char of value) {
    if (quote === '"' && escaped) {
      escaped = false;
      continue;
    }
    if (quote === '"' && char === '\\') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '[') balance++;
    else if (char === ']') balance--;
  }
  return balance;
}

// read the way the engine does: flat keys, tables ignored, raw values, the last value wins
export function parseServerToml(text) {
  const values = new Map();
  const lines = stripBom(String(text)).split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    let line = stripComment(lines[index]);
    if (!line.includes('=')) continue;
    while (bracketBalance(line) > 0 && index + 1 < lines.length)
      line += ` ${stripComment(lines[++index])}`;
    const eq = line.indexOf('=');
    const key = line.slice(0, eq).trim();
    if (key) values.set(key, line.slice(eq + 1).trim());
  }
  return values;
}

export function unquote(raw) {
  const value = String(raw ?? '').trim();
  if (value.length >= 2 && value[0] === "'" && value.endsWith("'")) return value.slice(1, -1);
  if (value.length >= 2 && value[0] === '"' && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  return value;
}

export function parseStringArray(raw) {
  let value = String(raw ?? '');
  const open = value.indexOf('[');
  const close = value.lastIndexOf(']');
  if (open >= 0 && close > open) value = value.slice(open + 1, close);
  const items = [];
  let start = 0;
  let quote = '';
  let escaped = false;
  for (let index = 0; index <= value.length; index++) {
    const char = index < value.length ? value[index] : ',';
    if (quote === '"' && escaped) {
      escaped = false;
      continue;
    }
    if (quote === '"' && char === '\\') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === ',') {
      const item = unquote(value.slice(start, index));
      if (item) items.push(item);
      start = index + 1;
    }
  }
  return items;
}

function parsePort(raw, fallback) {
  const value = unquote(raw);
  if (value === '') return fallback;
  const number = /^0x[0-9a-f]+$/i.test(value)
    ? Number.parseInt(value, 16)
    : /^\d+$/.test(value)
      ? Number(value)
      : NaN;
  return Number.isInteger(number) && number >= 1 && number <= 65535 ? number : null;
}

export function readServerSettings(text) {
  const values = parseServerToml(text);
  const get = (key) => values.get(key);
  const resources = values.has('resources') ? parseStringArray(get('resources')) : [];
  const gamemode = values.has('gamemode') ? unquote(get('gamemode')) : '';
  return {
    name: values.has('name') ? unquote(get('name')) : '',
    host: values.has('host') ? unquote(get('host')) : '0.0.0.0',
    port: values.has('port') ? parsePort(get('port'), 7788) : 7788,
    httpPort: values.has('httpPort') ? parsePort(get('httpPort'), 7789) : 7789,
    gamemode,
    resources,
    loaded: [...new Set([...resources, ...(gamemode ? [gamemode] : [])])],
  };
}

function tomlValue(value) {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  return JSON.stringify(String(value));
}

export function effectiveServerToml(releaseText, overrides) {
  const base = String(releaseText).replace(/\s+$/, '');
  const lines = overrides.map(([key, value]) => `${key} = ${tomlValue(value)}`);
  return `${base}\n\n# varion host: keys of this host, written on every deploy (the last value of a key counts).\n${lines.join('\n')}\n`;
}
