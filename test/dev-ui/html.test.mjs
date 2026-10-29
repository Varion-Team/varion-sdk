import assert from 'node:assert/strict';
import test from 'node:test';
import { injectFirstScripts, shimUrl } from '../../src/dev-ui/html.mjs';

const tag = (src) => `<script src="${src}"></script>`;

test('the shims go first into <head>, before everything the page has there', () => {
  const html =
    '<!doctype html><html><head><meta charset="utf-8"><script type="module" src="/@vite/client"></script></head><body></body></html>';
  const out = injectFirstScripts(html, [shimUrl(0), shimUrl(1)]);
  assert.equal(
    out,
    `<!doctype html><html><head>${tag('/__varion/page-shim/0.js')}${tag('/__varion/page-shim/1.js')}<meta charset="utf-8"><script type="module" src="/@vite/client"></script></head><body></body></html>`,
  );
});

test('a <head> with attributes, in any case, quoted ">" included', () => {
  const out = injectFirstScripts(
    '<HTML><HEAD data-x="a>b" lang=en><title>t</title></HEAD></HTML>',
    ['/s.js'],
  );
  assert.equal(
    out,
    `<HTML><HEAD data-x="a>b" lang=en>${tag('/s.js')}<title>t</title></HEAD></HTML>`,
  );
});

test('<header> and a <head> in a comment are not the head', () => {
  const html = '<!-- <head> --><html><body><header>x</header></body></html>';
  assert.equal(
    injectFirstScripts(html, ['/s.js']),
    `<!-- <head> --><html><head>${tag('/s.js')}</head><body><header>x</header></body></html>`,
  );
});

test('a page without <html> gets them at the top, after its doctype', () => {
  assert.equal(
    injectFirstScripts('<!DOCTYPE html><p>x</p>', ['/s.js']),
    `<!DOCTYPE html>${tag('/s.js')}<p>x</p>`,
  );
  assert.equal(injectFirstScripts('<p>x</p>', ['/s.js']), `${tag('/s.js')}<p>x</p>`);
});

test('no shims, no change; a source is an attribute value, escaped', () => {
  assert.equal(injectFirstScripts('<head></head>', []), '<head></head>');
  assert.equal(
    injectFirstScripts('<head></head>', ['/a"b<c&.js']),
    '<head><script src="/a&quot;b&lt;c&amp;.js"></script></head>',
  );
});
