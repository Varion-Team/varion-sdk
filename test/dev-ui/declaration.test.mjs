import assert from 'node:assert/strict';
import test from 'node:test';
import {
  devUiOptIn,
  devUiRoot,
  devUiTable,
  devUiUrl,
  withDevUiTable,
  withoutDevUiTable,
} from '../../src/dev-ui/declaration.mjs';

test('[dev-ui] url: a folder of a dev server on this computer', () => {
  assert.equal(devUiUrl('http://127.0.0.1:7935'), 'http://127.0.0.1:7935/');
  assert.equal(devUiUrl('http://LOCALHOST:5173/app'), 'http://localhost:5173/app/');
  assert.equal(devUiUrl('http://[::1]:7935/'), 'http://[::1]:7935/');
  for (const bad of [
    'https://127.0.0.1:7935/',
    'http://127.0.0.1/',
    'http://192.168.1.20:7935/',
    'http://dev.example.com:7935/',
    'http://127.0.0.1:7935/?x',
    'http://127.0.0.1:7935/#x',
    'http://u@127.0.0.1:7935/',
    'http://127.0.0.1:7935/a b/',
  ]) {
    assert.throws(() => devUiUrl(bad), undefined, bad);
  }
});

test('[dev-ui] root: a folder of the resource', () => {
  assert.equal(devUiRoot('ui'), 'ui/');
  assert.equal(devUiRoot('/web/app/'), 'web/app/');
  assert.equal(devUiRoot(''), '');
  for (const bad of ['../ui', 'ui/../x', 'ui\\x', '%2e%2e', 'C:/ui', 'a//b']) {
    assert.throws(() => devUiRoot(bad), undefined, bad);
  }
});

test('the table goes at the end, once, and comes out again', () => {
  const resource = 'type = "js"\nclient-files = ["client/**", "ui/**"]\n\n[config]\ntitle = "x"\n';
  const declared = withDevUiTable(resource, { url: 'http://127.0.0.1:7935', root: 'ui' });
  assert.ok(declared.startsWith(resource));
  assert.ok(declared.endsWith('[dev-ui]\nurl = "http://127.0.0.1:7935/"\nroot = "ui/"\n'));
  const again = withDevUiTable(declared, { url: 'http://127.0.0.1:7936/', root: 'ui/' });
  assert.equal(again.match(/\[dev-ui\]/g).length, 1);
  assert.ok(again.includes('url = "http://127.0.0.1:7936/"'));
  assert.equal(withoutDevUiTable(again), resource);
  assert.equal(withoutDevUiTable(resource), resource);
  assert.ok(devUiTable({ url: 'http://127.0.0.1:7935/', root: '' }).includes('root = ""'));
});

test('a table in the middle comes out with its comment, the tables after it stay', () => {
  const toml = `type = "js"\n\n${devUiTable({ url: 'http://127.0.0.1:7935/', root: 'ui' })}\n[config]\ntitle = "x"\n`;
  assert.equal(withoutDevUiTable(toml), 'type = "js"\n\n[config]\ntitle = "x"\n');
});

test('VARION_DEV_UI: the dev server origins, comma-separated, once each', () => {
  assert.equal(devUiOptIn('http://127.0.0.1:7935/'), 'http://127.0.0.1:7935');
  assert.equal(
    devUiOptIn(['http://127.0.0.1:7935/app/', 'http://127.0.0.1:7935/', 'http://localhost:5173']),
    'http://127.0.0.1:7935,http://localhost:5173',
  );
  assert.throws(() => devUiOptIn('http://10.0.0.5:7935'));
});
