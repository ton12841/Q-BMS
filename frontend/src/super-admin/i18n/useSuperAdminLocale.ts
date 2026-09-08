"use client";

import { useI18n } from "@/i18n/useQBMSI18n";

export type SuperAdminLocale = "en" | "lo" | "th";

export function useSuperAdminLocale(): SuperAdminLocale {
  const { locale } = useI18n();

  if (locale === "th") return "th";
  if (locale === "lo" || locale === "la") return "lo";
  return "en";
}
