import {cookies} from 'next/headers';
import {getRequestConfig} from 'next-intl/server';
import {
  defaultLocale,
  isSupportedLocale,
  localeCookieName
} from './config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const candidate = cookieStore.get(localeCookieName)?.value;
  const locale = isSupportedLocale(candidate) ? candidate : defaultLocale;

  return {
    locale,
    timeZone: 'Asia/Vientiane',
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
