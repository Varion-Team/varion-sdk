import { getLocale, t } from '../i18n/index.mjs';

export function formatBytes(bytes) {
  const number = (value) =>
    new Intl.NumberFormat(getLocale(), {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  if (bytes >= 1 << 30) return t('{value} GB', { value: number(bytes / (1 << 30)) });
  if (bytes >= 1 << 20) return t('{value} MB', { value: number(bytes / (1 << 20)) });
  if (bytes >= 1 << 10) return t('{value} KB', { value: number(bytes / (1 << 10)) });
  return t('{value} B', { value: bytes });
}
