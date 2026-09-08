export const SUPPORTED_LOCALES = ['en', 'th', 'lo'];
export const DEFAULT_LOCALE = 'en';

export function normalizeLocale(value) {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
    .replace('_', '-');

  const short = raw.split('-')[0];

  return SUPPORTED_LOCALES.includes(short)
    ? short
    : DEFAULT_LOCALE;
}
