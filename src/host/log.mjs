import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function createLogger({
  json = false,
  file = null,
  out = process.stdout,
  quiet = false,
} = {}) {
  let fileSize = 0;
  if (file) {
    try {
      fileSize = fs.statSync(file).size;
    } catch {}
  }
  const listeners = new Set();
  const toFile = (record) => {
    if (!file) return;
    const line = `${JSON.stringify(record)}\n`;
    const bytes = Buffer.byteLength(line);
    try {
      if (fileSize + bytes > MAX_FILE_BYTES) {
        // a viewer holding the file blocks the rename; keep appending then
        try {
          fs.renameSync(file, `${file}.1`);
          fileSize = 0;
        } catch {}
      }
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.appendFileSync(file, line);
      fileSize += bytes;
    } catch {}
  };
  const emit = (level, event, text, data) => {
    const record = { time: new Date().toISOString(), level, event, text, ...(data || {}) };
    if (!quiet) {
      const mark =
        level === 'error' ? `${t('error')}: ` : level === 'warn' ? `${t('warning')}: ` : '';
      out.write(
        json
          ? `${JSON.stringify(record)}\n`
          : `[host ${record.time.slice(11, 19)}] ${mark}${text}\n`,
      );
    }
    toFile(record);
    for (const listener of listeners) listener(record);
  };
  return {
    info: (text, data, event = 'info') => emit('info', event, text, data),
    warn: (text, data, event = 'warn') => emit('warn', event, text, data),
    error: (text, data, event = 'error') => emit('error', event, text, data),
    listen(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
