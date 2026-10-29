import fs from 'node:fs';
import path from 'node:path';
import { toPosix, walkFiles } from '../shared/fs.mjs';

const IGNORED = /(^|\/)(node_modules|\.git|\.varion|dist|\.cache)(\/|$)|~$|\.swp$|\.tmp$/;

export function watchProject(root, dirs, onBatch, { debounceMs = 300 } = {}) {
  const pending = new Set();
  let timer = null;
  const queue = (absolute) => {
    const relative = toPosix(path.relative(root, absolute));
    if (!relative || relative.startsWith('..') || IGNORED.test(relative)) return;
    pending.add(relative);
    clearTimeout(timer);
    timer = setTimeout(() => {
      const batch = [...pending];
      pending.clear();
      onBatch(batch);
    }, debounceMs);
  };
  const watchers = [];
  const polled = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const isFile = fs.statSync(dir).isFile();
    try {
      const watcher = fs.watch(dir, { recursive: !isFile }, (_event, file) => {
        queue(isFile ? dir : file ? path.join(dir, file.toString()) : dir);
      });
      watcher.on('error', () => {});
      watchers.push(watcher);
    } catch {
      // no recursive fs.watch on this system: poll instead
      polled.push(dir);
    }
  }
  let poll = null;
  if (polled.length) {
    const snapshot = () => {
      const state = new Map();
      for (const dir of polled) {
        for (const relative of walkFiles(dir, { skip: (name) => IGNORED.test(name) })) {
          const full = path.join(dir, relative);
          try {
            state.set(full, fs.statSync(full).mtimeMs);
          } catch {}
        }
      }
      return state;
    };
    let last = snapshot();
    poll = setInterval(() => {
      let next;
      try {
        next = snapshot();
      } catch {
        // a folder went away while it was read: look again on the next tick
        return;
      }
      for (const [file, mtime] of next) if (last.get(file) !== mtime) queue(file);
      for (const file of last.keys()) if (!next.has(file)) queue(file);
      last = next;
    }, 1000);
  }
  return {
    close() {
      clearTimeout(timer);
      if (poll) clearInterval(poll);
      for (const watcher of watchers) watcher.close();
    },
  };
}
