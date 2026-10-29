export const SHIM_PREFIX = '/__varion/page-shim/';

export function shimUrl(index) {
  return `${SHIM_PREFIX}${index}.js`;
}

function escapeAttribute(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// index just past the '>' of the first <name ...> outside comments, or -1
function afterOpeningTag(html, name) {
  const lower = html.toLowerCase();
  let at = 0;
  for (;;) {
    const open = lower.indexOf(`<${name}`, at);
    if (open < 0) return -1;
    const comment = lower.lastIndexOf('<!--', open);
    if (comment >= 0 && lower.indexOf('-->', comment + 4) > open) {
      at = lower.indexOf('-->', comment + 4) + 3;
      continue;
    }
    // <header> is not <head>
    const next = lower[open + name.length + 1];
    if (next !== undefined && !/[\s/>]/.test(next)) {
      at = open + 1;
      continue;
    }
    let quote = '';
    for (let i = open + name.length + 1; i < html.length; i++) {
      const ch = html[i];
      if (quote) {
        if (ch === quote) quote = '';
      } else if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (ch === '>') {
        return i + 1;
      }
    }
    return -1;
  }
}

// classic scripts first in <head> run before anything else on the page, Vite's client included
export function injectFirstScripts(html, sources) {
  if (!sources || sources.length === 0) return html;
  const tags = sources.map((src) => `<script src="${escapeAttribute(src)}"></script>`).join('');
  const head = afterOpeningTag(html, 'head');
  if (head >= 0) return html.slice(0, head) + tags + html.slice(head);
  const root = afterOpeningTag(html, 'html');
  if (root >= 0) return `${html.slice(0, root)}<head>${tags}</head>${html.slice(root)}`;
  const doctype = /^\s*<!doctype[^>]*>/i.exec(html);
  const at = doctype ? doctype[0].length : 0;
  return html.slice(0, at) + tags + html.slice(at);
}
