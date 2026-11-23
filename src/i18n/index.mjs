import ru from './ru.mjs';

const CATALOGS = { en: null, ru };
export const LOCALES = Object.keys(CATALOGS);

let current = detectLocale();

// On Windows, terminals and editors set LANG and its relatives for the encoding, not for the
// language: the system language is used there instead.
export function detectLocale(
  env = process.env,
  systemLocale = defaultSystemLocale(),
  platform = process.platform,
) {
  const shell = platform === 'win32' ? [] : [env.LC_ALL, env.LC_MESSAGES, env.LANG];
  const candidates = [env.VARION_LANG, ...shell, systemLocale];
  const chosen = candidates.find((value) => value && value !== 'C' && value !== 'POSIX');
  return /^ru\b/i.test(String(chosen || '').replace(/_/g, '-')) ? 'ru' : 'en';
}

function defaultSystemLocale() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return 'en';
  }
}

export function getLocale() {
  return current;
}

export function setLocale(locale) {
  if (!LOCALES.includes(locale)) {
    throw new RangeError(`Unknown locale "${locale}" (expected one of: ${LOCALES.join(', ')})`);
  }
  current = locale;
}

export function t(message, params) {
  const catalog = CATALOGS[current];
  const text = (catalog && catalog[message]) || message;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name) =>
    Object.hasOwn(params, name) ? String(params[name]) : whole,
  );
}
