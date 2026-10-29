import { t } from '../i18n/index.mjs';

export class VarionError extends Error {
  constructor(message, { code = 'error', cause } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = new.target.name;
    this.code = code;
  }
}

export function errorMessage(error) {
  if (error === undefined || error === null) return t('unknown error');
  if (typeof error === 'string') return error;
  return error.message || String(error);
}
