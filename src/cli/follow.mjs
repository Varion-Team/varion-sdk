import fs from 'node:fs';
import path from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import { t } from '../i18n/index.mjs';
import { toPosix } from '../shared/fs.mjs';
import { sourceLocation } from './server.mjs';
import { loadSourceMap } from './sourcemap.mjs';

const GAME_FILES = {
  'varion_client_scripts.log': 'game',
  'varion_game_error.log': 'game-error',
  'varion_crash.log': 'crash',
};

function readFrom(file, offset, length) {
  const buffer = Buffer.alloc(length);
  const fd = fs.openSync(file, 'r');
  try {
    return buffer.subarray(0, fs.readSync(fd, buffer, 0, length, offset));
  } finally {
    fs.closeSync(fd);
  }
}

export function followGameLogs({
  dir,
  output,
  root,
  resourceName,
  mapFile,
  mapBase,
  intervalMs = 500,
}) {
  const state = new Map();
  for (const name of Object.keys(GAME_FILES)) {
    let size = 0;
    try {
      size = fs.statSync(path.join(dir, name)).size;
    } catch {}
    // only what the game writes from now on
    state.set(name, { offset: size, rest: '', decoder: new StringDecoder('utf8') });
  }
  let mapper;
  const mapClient = (text) =>
    text.replace(/(?:[\w.-]+[\\/])*index\.js:(\d+)(?::(\d+))?/g, (whole, line, column) => {
      if (mapper === undefined) {
        try {
          mapper = loadSourceMap(mapFile, mapBase);
        } catch {
          mapper = null;
        }
      }
      const hit = mapper?.(Number(line), Number(column || 1) - 1);
      return hit ? `${toPosix(path.relative(root, hit.file))}:${hit.line}:${hit.column}` : whole;
    });

  const handle = (source, line) => {
    if (!line.trim()) return;
    if (source !== 'game') {
      output.event(
        'log',
        { source, level: 'error', text: line },
        source === 'crash' ? t('[crash] {line}', { line }) : t('[game error] {line}', { line }),
      );
      return;
    }
    const match = /\bJS_LOG level=(\w+) resource=(\S+) (.*)$/.exec(line);
    if (!match) return;
    const [, level, resource] = match;
    let text = match[3];
    // engine lines (WORDS_IN_CAPITALS) and the core's chatter are not the mode's
    if (level === 'info' && (resource === '(core)' || /^[A-Z][A-Z0-9_]{3,}(\s|$)/.test(text)))
      return;
    if (resource === resourceName) text = mapClient(text);
    output.event(
      'log',
      {
        source: 'game',
        level,
        resource,
        text,
        location: sourceLocation(path.resolve(root, text), root),
      },
      level === 'info' ? t('[game] {text}', { text }) : t('[game {level}] {text}', { level, text }),
    );
  };

  const timer = setInterval(() => {
    for (const [name, source] of Object.entries(GAME_FILES)) {
      const entry = state.get(name);
      let chunk;
      try {
        const full = path.join(dir, name);
        const size = fs.statSync(full).size;
        // the game started a new log
        if (size < entry.offset)
          Object.assign(entry, { offset: 0, rest: '', decoder: new StringDecoder('utf8') });
        if (size === entry.offset) continue;
        chunk = readFrom(full, entry.offset, Math.min(size - entry.offset, 1 << 20));
      } catch {
        continue;
      }
      entry.offset += chunk.length;
      const lines = (entry.rest + entry.decoder.write(chunk)).split(/\r?\n/);
      entry.rest = lines.pop();
      for (const line of lines) handle(source, line);
    }
  }, intervalMs);
  timer.unref();
  return {
    resetSourceMap() {
      mapper = undefined;
    },
    stop() {
      clearInterval(timer);
    },
  };
}

export function followSlowHandlers({ port, output, intervalMs = 5000 }) {
  const seen = new Map();
  const timer = setInterval(async () => {
    let info;
    try {
      info = await (await fetch(`http://127.0.0.1:${port}/server-info.json`)).json();
    } catch {
      return;
    }
    const sync = info?.worldSync;
    const thresholdMs = Math.round((sync?.slowResourceThresholdMicros || 25000) / 1000);
    for (const item of sync?.slowResources || []) {
      const before = seen.get(item.resource) ?? 0;
      // a restarted resource counts from zero again
      const added = item.slowCalls >= before ? item.slowCalls - before : item.slowCalls;
      seen.set(item.resource, item.slowCalls);
      if (added <= 0) continue;
      const peakMs = Math.round(item.peakMicros / 1000);
      output.event(
        'slow',
        { resource: item.resource, callback: item.slowestCallback, added, peakMs, thresholdMs },
        output.paint(
          'yellow',
          t(
            '[slow] {resource}: calls over {threshold} ms: +{count}; slowest {callback}, peak {peak} ms',
            {
              resource: item.resource,
              threshold: thresholdMs,
              count: added,
              callback: item.slowestCallback,
              peak: peakMs,
            },
          ),
        ),
      );
    }
  }, intervalMs);
  timer.unref();
  return { stop: () => clearInterval(timer) };
}
