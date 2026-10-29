import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { detectLocale, getLocale, setLocale, t } from '../src/i18n/index.mjs';
import ru from '../src/i18n/ru.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG_DIR = path.join(ROOT, 'src', 'i18n', 'ru');

function sourceFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full !== path.join(ROOT, 'src', 'i18n')) files.push(...sourceFiles(full));
    } else if (entry.name.endsWith('.mjs')) {
      files.push(full);
    }
  }
  return files;
}

const SOURCES = [...sourceFiles(path.join(ROOT, 'bin')), ...sourceFiles(path.join(ROOT, 'src'))];

/** The value of a JavaScript string literal (the escapes the sources use). */
function literalValue(body) {
  return body.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (_, escape) => {
    if (escape[0] === 'u') return String.fromCodePoint(parseInt(escape.replace(/[u{}]/g, ''), 16));
    if (escape[0] === 'x') return String.fromCharCode(parseInt(escape.slice(1), 16));
    return { n: '\n', t: '\t', r: '\r' }[escape] ?? escape;
  });
}

/** Every `t('...')` message in the sources, with where it is. */
function messagesInSources() {
  const messages = new Map();
  const call = /\bt\(\s*(['"])((?:\\.|(?!\1)[^\\\n])*)\1/g;
  for (const file of SOURCES) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(call)) {
      const message = literalValue(match[2]);
      const line = text.slice(0, match.index).split('\n').length;
      if (!messages.has(message)) messages.set(message, `${path.relative(ROOT, file)}:${line}`);
    }
  }
  return messages;
}

const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

test('every message in the sources has a Russian translation', () => {
  const missing = [...messagesInSources()]
    .filter(([message]) => !Object.hasOwn(ru, message))
    .map(([message, where]) => `${where}: ${message}`);
  assert.deepEqual(missing, []);
});

test('every Russian translation is used', () => {
  const used = messagesInSources();
  const unused = Object.keys(ru).filter((message) => !used.has(message));
  assert.deepEqual(unused, []);
});

test('a translation has the placeholders of its message', () => {
  const wrong = Object.entries(ru)
    .filter(([message, text]) => placeholders(message).join() !== placeholders(text).join())
    .map(([message]) => message);
  assert.deepEqual(wrong, []);
});

test('the catalogs do not translate a message twice', async () => {
  const seen = new Map();
  const twice = [];
  for (const file of fs.readdirSync(CATALOG_DIR)) {
    const { default: catalog } = await import(new URL(`../src/i18n/ru/${file}`, import.meta.url));
    for (const message of Object.keys(catalog)) {
      if (seen.has(message)) twice.push(`${message} (${seen.get(message)}, ${file})`);
      seen.set(message, file);
    }
  }
  assert.deepEqual(twice, []);
});

test('messages are plain string literals', () => {
  const dynamic = [];
  for (const file of SOURCES) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(/\bt\((?!\s*['"])/g)) {
      const line = text.slice(0, match.index).split('\n').length;
      dynamic.push(`${path.relative(ROOT, file)}:${line}`);
    }
  }
  assert.deepEqual(dynamic, []);
});

test('t fills placeholders and falls back to English', () => {
  const before = getLocale();
  try {
    setLocale('en');
    assert.equal(t('{count} of {total}', { count: 1, total: 2 }), '1 of 2');
    assert.equal(t('{missing} stays', {}), '{missing} stays');
    setLocale('ru');
    assert.equal(t('not in any catalog'), 'not in any catalog');
    assert.throws(() => setLocale('de'), RangeError);
  } finally {
    setLocale(before);
  }
});

test('the language comes from VARION_LANG, the locale variables, then the system', () => {
  assert.equal(detectLocale({ VARION_LANG: 'ru' }, 'en-US'), 'ru');
  assert.equal(detectLocale({ VARION_LANG: 'en', LANG: 'ru_RU.UTF-8' }, 'ru-RU'), 'en');
  assert.equal(detectLocale({ LANG: 'ru_RU.UTF-8' }, 'en-US'), 'ru');
  assert.equal(detectLocale({ LC_ALL: 'C', LANG: 'ru_RU.UTF-8' }, 'en-US'), 'ru');
  assert.equal(detectLocale({}, 'ru-KZ'), 'ru');
  assert.equal(detectLocale({}, 'kk-KZ'), 'en');
  assert.equal(detectLocale({}, ''), 'en');
});
