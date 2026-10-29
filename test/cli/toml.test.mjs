import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseToml,
  stringifyToml,
  tomlLiteral,
  tomlString,
  TomlError,
} from '../../src/cli/toml.mjs';

test('TOML: tables, dotted keys, arrays of tables, inline tables, every scalar', () => {
  const doc = parseToml(`
# comment
title = "Varion \\"RP\\"" # trailing comment
path = 'C:\\VARION\\x'
multi = """
line1
line2 \\
   joined"""
literal = '''
raw \\n stays'''
int = 1_000
hex = 0xff
oct = 0o17
bin = 0b101
neg = -1560.3389
exp = 1e3
inf = -inf
yes = true
date = 1979-05-27T07:32:00Z
local = 1979-05-27 07:32:00
array = [ 1, 2,
  3, # inside
]
mixed = ["a", 1, true]
inline = { a = 1, b.c = "d" }

[server]
port = 7940

[env.test]
name = "x"

[[assets]]
name = "one"
[[assets]]
name = "two"

[a.b]
c = 1
[a]
d = 2
`);
  assert.equal(doc.title, 'Varion "RP"');
  assert.equal(doc.path, 'C:\\VARION\\x');
  assert.equal(doc.multi, 'line1\nline2 joined');
  assert.equal(doc.literal, 'raw \\n stays');
  assert.equal(doc.int, 1000);
  assert.equal(doc.hex, 255);
  assert.equal(doc.oct, 15);
  assert.equal(doc.bin, 5);
  assert.equal(doc.neg, -1560.3389);
  assert.equal(doc.exp, 1000);
  assert.equal(doc.inf, -Infinity);
  assert.equal(doc.yes, true);
  assert.equal(doc.date, '1979-05-27T07:32:00Z');
  assert.equal(doc.local, '1979-05-27 07:32:00');
  assert.deepEqual(doc.array, [1, 2, 3]);
  assert.deepEqual(doc.mixed, ['a', 1, true]);
  assert.deepEqual(doc.inline, { a: 1, b: { c: 'd' } });
  assert.equal(doc.server.port, 7940);
  assert.equal(doc.env.test.name, 'x');
  assert.deepEqual(
    doc.assets.map((asset) => asset.name),
    ['one', 'two'],
  );
  assert.deepEqual(doc.a, { b: { c: 1 }, d: 2 });
});

test('TOML: mistakes are errors with the line and column', () => {
  const cases = [
    ['a = 1\na = 2', /2:1: key "a" is defined twice/],
    ['[x]\n[x]', /2:1: table \[x\] is already defined/],
    ['a = "unterminated', /1:5: the string has no closing quote/],
    ['a = nope', /unknown value "nope"/],
    ['a = 1 b = 2', /unexpected text at the end of the line/],
    ['a = "\\q"', /unknown escape/],
    ['x = { a = 1 }\n[x]', /is already defined/],
    ['__proto__ = 1', /__proto__/],
    ['a = [1, 2', /expected "," or "\]" in an array/],
    ['a.b = 1\n[a.b]', /is already defined/],
  ];
  for (const [text, message] of cases) {
    assert.throws(
      () => parseToml(text),
      (error) => error instanceof TomlError && message.test(error.message),
      text,
    );
  }
});

test('TOML: writer escapes and round-trips', () => {
  assert.equal(tomlString('a"b\\c\nd\u0001'), '"a\\"b\\\\c\\nd\\u0001"');
  assert.equal(tomlLiteral('C:\\Servers\\city'), "'C:\\Servers\\city'");
  assert.equal(tomlLiteral("it's"), '"it\'s"');
  const object = {
    name: 'Демо "x"',
    port: 7940,
    list: ['a', 'b'],
    config: { flag: true, nested: { n: 1.5 } },
  };
  assert.deepEqual(parseToml(stringifyToml(object)), object);
});
