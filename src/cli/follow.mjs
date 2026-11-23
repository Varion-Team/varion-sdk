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

// The whole lines a log gained since the last look; `entry` remembers where that was.
function newLines(file, entry) {
  let chunk;
  try {
    const { size } = fs.statSync(file);
    // the game started a new log
    if (size < entry.offset)
      Object.assign(entry, { offset: 0, rest: '', decoder: new StringDecoder('utf8') });
    if (size === entry.offset) return [];
    chunk = readFrom(file, entry.offset, Math.min(size - entry.offset, 1 << 20));
  } catch {
    return [];
  }
  entry.offset += chunk.length;
  const lines = (entry.rest + entry.decoder.write(chunk)).split(/\r?\n/);
  entry.rest = lines.pop();
  return lines;
}

// The source file of the project a line of the game points at, once the source map put its
// path relative to the project into the line.
function mappedLocation(text, root) {
  const at = /([\w.\\/-]+\.(?:tsx?|mts|cts|jsx?|mjs|cjs)):(\d+):(\d+)/.exec(text);
  return at ? sourceLocation(`${path.resolve(root, at[1])}:${at[2]}:${at[3]}`, root) : undefined;
}

function reportLine(output, source, line, { resourceName, root, mapClient }) {
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
  // engine lines (WORDS_IN_CAPITALS) and the core's chatter are not the mode's
  if (level === 'info' && (resource === '(core)' || /^[A-Z][A-Z0-9_]{3,}(\s|$)/.test(match[3])))
    return;
  const text = resource === resourceName ? mapClient(match[3]) : match[3];
  output.event(
    'log',
    {
      source: 'game',
      level,
      resource,
      text,
      location: mappedLocation(text, root),
    },
    level === 'info' ? t('[game] {text}', { text }) : t('[game {level}] {text}', { level, text }),
  );
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
    } catch {
      // the game has not written this log yet
    }
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

  const timer = setInterval(() => {
    for (const [name, source] of Object.entries(GAME_FILES)) {
      for (const line of newLines(path.join(dir, name), state.get(name)))
        reportLine(output, source, line, { resourceName, root, mapClient });
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
  let asking = false;
  const timer = setInterval(async () => {
    // one question at a time: answers that overlap would be counted out of order
    if (asking) return;
    asking = true;
    let info;
    try {
      const answer = await fetch(`http://127.0.0.1:${port}/server-info.json`, {
        signal: AbortSignal.timeout(Math.max(intervalMs, 1000)),
      });
      info = await answer.json();
    } catch {
      return;
    } finally {
      asking = false;
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
