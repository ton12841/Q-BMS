"use client";

import {useCallback} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {
  localeCookieName,
  type Locale
} from "./config";

export function useI18n() {
  const locale = useLocale() as Locale;
  const translate = useTranslations();
  const router = useRouter();

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      document.cookie =
        `${localeCookieName}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
      router.refresh();
    },
    [router]
  );

  const t = useCallback(
    (
      key: string,
      variables?: Record<string, string | number>
    ) => {
      return translate(key as never, variables as never);
    },
    [translate]
  );

  return {
    locale,
    setLocale,
    t
  };
}
