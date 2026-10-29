import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { VarionError } from '../shared/errors.mjs';
import { readJson } from '../shared/fs.mjs';

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function decodeVlq(text) {
  const values = [];
  let value = 0;
  let shift = 0;
  for (const char of text) {
    const digit = BASE64.indexOf(char);
    if (digit < 0) {
      throw new VarionError(t('source map: "{char}" is not a base64 VLQ digit', { char }), {
        code: 'bad-source-map',
      });
    }
    value += (digit & 31) * 2 ** shift;
    if (digit & 32) {
      shift += 5;
      continue;
    }
    values.push(value % 2 ? -(value - 1) / 2 : value / 2);
    value = 0;
    shift = 0;
  }
  return values;
}

// the lookup takes a 1-based line and a 0-based column, and answers 1-based ones
export function createSourceMapper(map, base) {
  const lines = [];
  let source = 0;
  let sourceLine = 0;
  let sourceColumn = 0;
  for (const group of String(map.mappings || '').split(';')) {
    const segments = [];
    let column = 0;
    for (const segment of group ? group.split(',') : []) {
      const values = decodeVlq(segment);
      column += values[0];
      if (values.length < 4) continue;
      source += values[1];
      sourceLine += values[2];
      sourceColumn += values[3];
      segments.push([column, source, sourceLine, sourceColumn]);
    }
    lines.push(segments);
  }
  return (line, column) => {
    const segments = lines[line - 1];
    if (!segments?.length) return null;
    let best = segments[0];
    for (const segment of segments) {
      if (segment[0] > column) break;
      best = segment;
    }
    const sourceName = map.sources?.[best[1]];
    if (!sourceName) return null;
    return {
      file: path.resolve(base, map.sourceRoot || '', sourceName),
      line: best[2] + 1,
      column: best[3] + 1,
    };
  };
}

export function loadSourceMap(file, base) {
  const map = readJson(file, null);
  return map ? createSourceMapper(map, base) : null;
}
