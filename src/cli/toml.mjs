import { t } from '../i18n/index.mjs';
import { VarionError } from '../shared/errors.mjs';
import { stripBom } from '../shared/fs.mjs';

export class TomlError extends VarionError {
  constructor(reason, { line, column, source = 'varion.toml' }) {
    super(`${source}:${line}:${column}: ${reason}`, { code: 'toml' });
    this.reason = reason;
    this.line = line;
    this.column = column;
    this.source = source;
  }
}

const BARE_KEY = /[A-Za-z0-9_-]/;
const KIND = Symbol('toml-kind');

function tableMeta(table) {
  return table[KIND];
}

function newTable(kind) {
  const table = {};
  Object.defineProperty(table, KIND, { value: { kind }, enumerable: false, writable: true });
  return table;
}

function isTable(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    tableMeta(value) !== undefined
  );
}

class Parser {
  constructor(text, source) {
    this.text = stripBom(text);
    this.pos = 0;
    this.source = source;
    this.arraysOfTables = new WeakSet();
  }

  error(reason, at = this.pos) {
    let line = 1;
    let column = 1;
    for (let i = 0; i < at && i < this.text.length; i++) {
      if (this.text[i] === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    return new TomlError(reason, { line, column, source: this.source });
  }

  peek(offset = 0) {
    return this.text[this.pos + offset];
  }

  startsWith(token) {
    return this.text.startsWith(token, this.pos);
  }

  eof() {
    return this.pos >= this.text.length;
  }

  skipSpaces() {
    while (this.peek() === ' ' || this.peek() === '\t') this.pos++;
  }

  skipComment() {
    if (this.peek() !== '#') return;
    while (!this.eof() && this.peek() !== '\n') {
      const code = this.text.charCodeAt(this.pos);
      if ((code < 0x20 && code !== 0x09 && code !== 0x0d) || code === 0x7f) {
        throw this.error(t('control character in a comment'));
      }
      this.pos++;
    }
  }

  skipBlank() {
    for (;;) {
      this.skipSpaces();
      this.skipComment();
      if (this.peek() === '\r' && this.peek(1) === '\n') this.pos += 2;
      else if (this.peek() === '\n') this.pos++;
      else return;
    }
  }

  expectLineEnd() {
    this.skipSpaces();
    this.skipComment();
    if (this.eof()) return;
    if (this.peek() === '\r' && this.peek(1) === '\n') {
      this.pos += 2;
      return;
    }
    if (this.peek() === '\n') {
      this.pos++;
      return;
    }
    throw this.error(
      t('unexpected text at the end of the line: "{text}"', {
        text: this.text.slice(this.pos, this.pos + 20).split(/\r?\n/)[0],
      }),
    );
  }

  parse() {
    const root = newTable('root');
    let current = root;
    for (;;) {
      this.skipBlank();
      if (this.eof()) break;
      if (this.startsWith('[[')) {
        current = this.parseArrayTableHeader(root);
      } else if (this.peek() === '[') {
        current = this.parseTableHeader(root);
      } else {
        this.parseKeyValue(current);
      }
      this.expectLineEnd();
    }
    return root;
  }

  parseKey() {
    const parts = [];
    for (;;) {
      this.skipSpaces();
      const at = this.pos;
      let part;
      if (this.peek() === '"') part = this.parseBasicString();
      else if (this.peek() === "'") part = this.parseLiteralString();
      else {
        while (!this.eof() && BARE_KEY.test(this.peek())) this.pos++;
        part = this.text.slice(at, this.pos);
        if (!part) throw this.error(t('expected a key'), at);
      }
      if (part === '__proto__') throw this.error(t('the key __proto__ is not allowed'), at);
      parts.push(part);
      this.skipSpaces();
      if (this.peek() !== '.') return parts;
      this.pos++;
    }
  }

  walkHeader(root, parts, at) {
    let table = root;
    for (const part of parts) {
      let next = table[part];
      if (next === undefined) {
        next = newTable('implicit');
        table[part] = next;
      } else if (Array.isArray(next) && this.arraysOfTables.has(next)) {
        next = next[next.length - 1];
      } else if (!isTable(next)) {
        throw this.error(
          t('"{key}": {part} is already a value, not a table', { key: parts.join('.'), part }),
          at,
        );
      } else if (tableMeta(next).kind === 'inline') {
        throw this.error(
          t('"{part}" is an inline table { ... } and cannot be extended', { part }),
          at,
        );
      }
      table = next;
    }
    return table;
  }

  parseTableHeader(root) {
    const at = this.pos;
    this.pos++;
    const parts = this.parseKey();
    this.skipSpaces();
    if (this.peek() !== ']') throw this.error(t('expected "]"'));
    this.pos++;
    const parent = this.walkHeader(root, parts.slice(0, -1), at);
    const last = parts[parts.length - 1];
    const existing = parent[last];
    if (existing === undefined) {
      const table = newTable('explicit');
      parent[last] = table;
      return table;
    }
    if (isTable(existing) && tableMeta(existing).kind === 'implicit') {
      tableMeta(existing).kind = 'explicit';
      return existing;
    }
    throw this.error(t('table [{key}] is already defined above', { key: parts.join('.') }), at);
  }

  parseArrayTableHeader(root) {
    const at = this.pos;
    this.pos += 2;
    const parts = this.parseKey();
    this.skipSpaces();
    if (!this.startsWith(']]')) throw this.error(t('expected "]]"'));
    this.pos += 2;
    const parent = this.walkHeader(root, parts.slice(0, -1), at);
    const last = parts[parts.length - 1];
    let array = parent[last];
    if (array === undefined) {
      array = [];
      this.arraysOfTables.add(array);
      parent[last] = array;
    } else if (!Array.isArray(array) || !this.arraysOfTables.has(array)) {
      throw this.error(
        t('[[{key}]]: {part} is already defined and is not an array of tables', {
          key: parts.join('.'),
          part: last,
        }),
        at,
      );
    }
    const table = newTable('explicit');
    array.push(table);
    return table;
  }

  parseKeyValue(table) {
    const at = this.pos;
    const parts = this.parseKey();
    const key = parts.join('.');
    this.skipSpaces();
    if (this.peek() !== '=') throw this.error(t('expected "=" after the key "{key}"', { key }));
    this.pos++;
    this.skipSpaces();
    const value = this.parseValue();
    let target = table;
    for (const part of parts.slice(0, -1)) {
      let next = target[part];
      if (next === undefined) {
        next = newTable('dotted');
        target[part] = next;
      } else if (!isTable(next) || tableMeta(next).kind !== 'dotted') {
        throw this.error(t('"{key}": {part} is already defined above', { key, part }), at);
      }
      target = next;
    }
    const last = parts[parts.length - 1];
    if (Object.hasOwn(target, last)) {
      throw this.error(t('key "{key}" is defined twice', { key }), at);
    }
    target[last] = value;
  }

  parseValue() {
    const c = this.peek();
    if (c === undefined) throw this.error(t('expected a value'));
    if (c === '"')
      return this.startsWith('"""') ? this.parseMultilineBasicString() : this.parseBasicString();
    if (c === "'")
      return this.startsWith("'''")
        ? this.parseMultilineLiteralString()
        : this.parseLiteralString();
    if (c === '[') return this.parseArray();
    if (c === '{') return this.parseInlineTable();
    if (this.startsWith('true') && !BARE_KEY.test(this.peek(4) || '')) {
      this.pos += 4;
      return true;
    }
    if (this.startsWith('false') && !BARE_KEY.test(this.peek(5) || '')) {
      this.pos += 5;
      return false;
    }
    return this.parseNumberOrDate();
  }

  parseEscape() {
    const at = this.pos;
    const c = this.text[this.pos + 1];
    const simple = { b: '\b', t: '\t', n: '\n', f: '\f', r: '\r', '"': '"', '\\': '\\' };
    if (Object.hasOwn(simple, c)) {
      this.pos += 2;
      return simple[c];
    }
    if (c === 'u' || c === 'U') {
      const length = c === 'u' ? 4 : 8;
      const hex = this.text.slice(this.pos + 2, this.pos + 2 + length);
      if (!new RegExp(`^[0-9A-Fa-f]{${length}}$`).test(hex))
        throw this.error(t('invalid \\u escape in a string'), at);
      const code = parseInt(hex, 16);
      if (code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff))
        throw this.error(t('{escape}: no such Unicode character', { escape: `\\${c}${hex}` }), at);
      this.pos += 2 + length;
      return String.fromCodePoint(code);
    }
    throw this.error(
      t('unknown escape {escape} in a string (write a backslash as \\\\ or use single quotes)', {
        escape: `\\${c ?? ''}`,
      }),
      at,
    );
  }

  checkStringChar(code, multiline) {
    if (code === 0x09) return;
    if (multiline && (code === 0x0a || code === 0x0d)) return;
    if (code < 0x20 || code === 0x7f) throw this.error(t('control character in a string'));
  }

  parseBasicString() {
    const at = this.pos;
    this.pos++;
    let out = '';
    for (;;) {
      if (this.eof() || this.peek() === '\n') {
        throw this.error(t('the string has no closing quote {quote}', { quote: '"' }), at);
      }
      const c = this.peek();
      if (c === '"') {
        this.pos++;
        return out;
      }
      if (c === '\\') {
        out += this.parseEscape();
        continue;
      }
      this.checkStringChar(this.text.charCodeAt(this.pos), false);
      out += c;
      this.pos++;
    }
  }

  parseLiteralString() {
    const at = this.pos;
    this.pos++;
    const start = this.pos;
    for (;;) {
      if (this.eof() || this.peek() === '\n') {
        throw this.error(t('the string has no closing quote {quote}', { quote: "'" }), at);
      }
      if (this.peek() === "'") break;
      this.checkStringChar(this.text.charCodeAt(this.pos), false);
      this.pos++;
    }
    const value = this.text.slice(start, this.pos);
    this.pos++;
    return value;
  }

  skipFirstNewline() {
    if (this.peek() === '\r' && this.peek(1) === '\n') this.pos += 2;
    else if (this.peek() === '\n') this.pos++;
  }

  parseMultilineBasicString() {
    const at = this.pos;
    this.pos += 3;
    this.skipFirstNewline();
    let out = '';
    for (;;) {
      if (this.eof()) throw this.error(t('the {quote} string is not closed', { quote: '"""' }), at);
      if (this.startsWith('"""')) {
        // up to two quotes right before the closing ones belong to the string
        let extra = 0;
        while (extra < 2 && this.text[this.pos + 3 + extra] === '"') extra++;
        out += '"'.repeat(extra);
        this.pos += 3 + extra;
        return out;
      }
      const c = this.peek();
      if (c === '\\') {
        // a backslash at the end of a line swallows the newline and the indent after it
        let probe = this.pos + 1;
        while (this.text[probe] === ' ' || this.text[probe] === '\t') probe++;
        if (
          this.text[probe] === '\n' ||
          (this.text[probe] === '\r' && this.text[probe + 1] === '\n')
        ) {
          this.pos = probe;
          while (/[ \t\r\n]/.test(this.peek() || '')) this.pos++;
          continue;
        }
        out += this.parseEscape();
        continue;
      }
      this.checkStringChar(this.text.charCodeAt(this.pos), true);
      out += c;
      this.pos++;
    }
  }

  parseMultilineLiteralString() {
    const at = this.pos;
    this.pos += 3;
    this.skipFirstNewline();
    const start = this.pos;
    for (;;) {
      if (this.eof()) throw this.error(t('the {quote} string is not closed', { quote: "'''" }), at);
      if (this.startsWith("'''")) {
        let extra = 0;
        while (extra < 2 && this.text[this.pos + 3 + extra] === "'") extra++;
        const value = this.text.slice(start, this.pos + extra);
        this.pos += 3 + extra;
        return value;
      }
      this.checkStringChar(this.text.charCodeAt(this.pos), true);
      this.pos++;
    }
  }

  parseArray() {
    this.pos++;
    const array = [];
    for (;;) {
      this.skipBlank();
      if (this.peek() === ']') {
        this.pos++;
        return array;
      }
      array.push(this.parseValue());
      this.skipBlank();
      if (this.peek() === ',') {
        this.pos++;
        continue;
      }
      if (this.peek() === ']') {
        this.pos++;
        return array;
      }
      throw this.error(t('expected "," or "]" in an array'));
    }
  }

  parseInlineTable() {
    const at = this.pos;
    this.pos++;
    const table = newTable('inline-building');
    this.skipSpaces();
    if (this.peek() === '}') {
      this.pos++;
      tableMeta(table).kind = 'inline';
      return table;
    }
    for (;;) {
      this.skipSpaces();
      if (this.peek() === '\n' || this.peek() === '\r')
        throw this.error(t('an inline table { ... } must be on one line'), at);
      this.parseKeyValue(table);
      this.skipSpaces();
      if (this.peek() === ',') {
        this.pos++;
        continue;
      }
      if (this.peek() === '}') {
        this.pos++;
        break;
      }
      throw this.error(t('expected "," or "}" in an inline table'));
    }
    const freeze = (value) => {
      if (!isTable(value)) return;
      tableMeta(value).kind = 'inline';
      for (const child of Object.values(value)) freeze(child);
    };
    freeze(table);
    return table;
  }

  parseNumberOrDate() {
    const at = this.pos;
    const token = /^[0-9A-Za-z_:.+-]+/.exec(this.text.slice(this.pos));
    if (!token) {
      throw this.error(
        t('unknown value "{text}" (put strings in quotes)', {
          text: this.text.slice(this.pos, this.pos + 15).split(/\r?\n/)[0],
        }),
      );
    }
    let text = token[0];
    // a date and a time with one space between them are one value
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(text) &&
      this.peek(text.length) === ' ' &&
      /^\d{2}:/.test(this.text.slice(this.pos + text.length + 1))
    ) {
      const time = /^[0-9A-Za-z_:.+-]+/.exec(this.text.slice(this.pos + text.length + 1));
      text = `${text} ${time[0]}`;
    }
    this.pos += text.length;
    const value = parseScalar(text);
    if (value === undefined) {
      throw this.error(t('unknown value "{text}" (put strings in quotes)', { text }), at);
    }
    return value;
  }
}

const DATE = /^\d{4}-\d{2}-\d{2}([Tt ]\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[+-]\d{2}:\d{2})?)?$/;
const TIME = /^\d{2}:\d{2}:\d{2}(\.\d+)?$/;

// dates stay text: nothing computes with them
function parseScalar(text) {
  if (/^[+-]?(inf|nan)$/.test(text)) {
    if (text.endsWith('nan')) return NaN;
    return text.startsWith('-') ? -Infinity : Infinity;
  }
  const radix = /^0([xob])([0-9A-Fa-f_]+)$/.exec(text);
  if (radix) {
    const digits = {
      x: /^[0-9A-Fa-f](_?[0-9A-Fa-f])*$/,
      o: /^[0-7](_?[0-7])*$/,
      b: /^[01](_?[01])*$/,
    }[radix[1]];
    if (!digits.test(radix[2])) return undefined;
    return toInteger(BigInt(`0${radix[1]}${radix[2].replace(/_/g, '')}`));
  }
  if (/^[+-]?(0|[1-9](_?\d)*)$/.test(text)) {
    return toInteger(BigInt(text.replace(/_/g, '').replace(/^\+/, '')));
  }
  if (
    /^[+-]?(0|[1-9](_?\d)*)(\.\d(_?\d)*)?([eE][+-]?\d(_?\d)*)?$/.test(text) &&
    /[.eE]/.test(text)
  ) {
    return Number(text.replace(/_/g, ''));
  }
  if (DATE.test(text) || TIME.test(text)) return text;
  return undefined;
}

function toInteger(big) {
  const number = Number(big);
  return Number.isSafeInteger(number) ? number : big;
}

export function parseToml(text, { source = 'varion.toml' } = {}) {
  return new Parser(String(text), source).parse();
}

// ---- writing ----

export function tomlString(value) {
  let out = '"';
  for (const char of String(value)) {
    const code = char.codePointAt(0);
    if (char === '"') out += '\\"';
    else if (char === '\\') out += '\\\\';
    else if (char === '\n') out += '\\n';
    else if (char === '\r') out += '\\r';
    else if (char === '\t') out += '\\t';
    else if (code < 0x20 || code === 0x7f)
      out += `\\u${code.toString(16).padStart(4, '0').toUpperCase()}`;
    else out += char;
  }
  return `${out}"`;
}

// the server keeps the backslashes of a basic string in path keys: paths go in literal strings
export function tomlLiteral(value) {
  const text = String(value);
  // eslint-disable-next-line no-control-regex -- control characters are what it looks for
  if (!/['\n\r]/.test(text) && !/[\x00-\x08\x0b-\x1f\x7f]/.test(text)) return `'${text}'`;
  return tomlString(text.replace(/\\/g, '/'));
}

export function tomlKey(key) {
  return /^[A-Za-z0-9_-]+$/.test(key) ? key : tomlString(key);
}

export function tomlValue(value) {
  if (typeof value === 'string') return tomlString(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return 'nan';
    if (value === Infinity) return 'inf';
    if (value === -Infinity) return '-inf';
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map(tomlValue).join(', ')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(
      ([key, item]) => `${tomlKey(key)} = ${tomlValue(item)}`,
    );
    return entries.length ? `{ ${entries.join(', ')} }` : '{}';
  }
  throw new TypeError(`TOML cannot hold ${String(value)}`);
}

export function stringifyToml(object, { header = '' } = {}) {
  const lines = header ? [...header.split('\n').map((line) => (line ? `# ${line}` : '#'))] : [];
  const writeTable = (table, path) => {
    const scalars = Object.entries(table).filter(([, value]) => !isPlainObject(value));
    const tables = Object.entries(table).filter(([, value]) => isPlainObject(value));
    if (path.length && (scalars.length || !tables.length)) {
      if (lines.length) lines.push('');
      lines.push(`[${path.map(tomlKey).join('.')}]`);
    }
    for (const [key, value] of scalars) {
      if (value === undefined || value === null) continue;
      lines.push(`${tomlKey(key)} = ${tomlValue(value)}`);
    }
    for (const [key, value] of tables) writeTable(value, [...path, key]);
  };
  writeTable(object, []);
  return `${lines.join('\n')}\n`;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
