import path from 'node:path';
import { walkFiles } from '../shared/fs.mjs';

const SPECIAL = /[\\^$.*+?()[\]{}|]/g;

function body(glob) {
  let out = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        const atStart = i === 0 || glob[i - 1] === '/';
        if (atStart && glob[i + 2] === '/') {
          out += '(?:[^/]+/)*';
          i += 2;
          continue;
        }
        out += '.*';
        i++;
        continue;
      }
      out += '[^/]*';
    } else if (c === '?') {
      out += '[^/]';
    } else if (c === '{') {
      const end = glob.indexOf('}', i);
      if (end < 0) {
        out += '\\{';
        continue;
      }
      const alternatives = glob
        .slice(i + 1, end)
        .split(',')
        .map(body);
      out += `(?:${alternatives.join('|')})`;
      i = end;
    } else {
      out += c.replace(SPECIAL, '\\$&');
    }
  }
  return out;
}

export function globToRegExp(glob) {
  return new RegExp(`^${body(String(glob).replace(/\\/g, '/').replace(/^\.\//, ''))}$`);
}

export function matchesAny(relative, patterns) {
  const normalized = relative.replace(/\\/g, '/');
  return patterns.some((pattern) => globToRegExp(pattern).test(normalized));
}

// "tests/**/*.ts" -> "tests"
export function globBase(glob) {
  const parts = String(glob).replace(/\\/g, '/').split('/');
  const fixed = [];
  for (const part of parts.slice(0, -1)) {
    if (/[*?{]/.test(part)) break;
    fixed.push(part);
  }
  return fixed.join('/');
}

const HEAVY = new Set(['node_modules', '.git', '.varion']);

export function findFiles(root, patterns) {
  const found = new Set();
  for (const pattern of patterns) {
    const regex = globToRegExp(pattern);
    const base = globBase(pattern);
    const dir = path.join(root, base);
    for (const relative of walkFiles(dir, {
      skip: (name, isDirectory) => isDirectory && HEAVY.has(name.split('/').pop()),
    })) {
      const full = base ? `${base}/${relative}` : relative;
      if (regex.test(full)) found.add(full);
    }
  }
  return [...found].sort();
}
