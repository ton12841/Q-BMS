export const locales = ['en', 'th', 'lo'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';
export const localeCookieName = 'QBMS_LOCALE';

export const LOCALE_OPTIONS: Array<{
  code: Locale;
  shortLabel: string;
  label: string;
}> = [
  {code: 'en', shortLabel: 'EN', label: 'English'},
  {code: 'th', shortLabel: 'TH', label: 'ไทย'},
  {code: 'lo', shortLabel: 'LO', label: 'ລາວ'}
];

export function isSupportedLocale(value: string | undefined): value is Locale {
  return Boolean(value && locales.includes(value as Locale));
}
