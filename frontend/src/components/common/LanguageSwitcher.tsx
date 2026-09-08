"use client";

import {useEffect, useRef, useState} from "react";
import {useI18n} from "@/i18n/useQBMSI18n";
import type {Locale} from "@/i18n/config";
import styles from "./LanguageSwitcher.module.css";

const languages: Array<{
  code: Locale;
  label: string;
}> = [
  {code: "en", label: "English"},
  {code: "lo", label: "ລາວ"},
  {code: "th", label: "ไทย"}
];

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.2 2.4 3.3 5.2 3.3 8.5S14.2 18.1 12 20.5" />
      <path d="M12 3.5C9.8 5.9 8.7 8.7 8.7 12s1.1 6.1 3.3 8.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 10 3 3 7-7" />
    </svg>
  );
}

function FlagIcon({locale}: {locale: Locale}) {
  if (locale === "th") {
    return (
      <svg className={styles.flag} viewBox="0 0 28 28" aria-hidden="true">
        <defs>
          <clipPath id="flag-th-circle">
            <circle cx="14" cy="14" r="13" />
          </clipPath>
        </defs>
        <g clipPath="url(#flag-th-circle)">
          <rect width="28" height="28" fill="#A51931" />
          <rect y="5" width="28" height="18" fill="#F4F5F8" />
          <rect y="9" width="28" height="10" fill="#2D2A6E" />
        </g>
      </svg>
    );
  }

  if (locale === "lo") {
    return (
      <svg className={styles.flag} viewBox="0 0 28 28" aria-hidden="true">
        <defs>
          <clipPath id="flag-lo-circle">
            <circle cx="14" cy="14" r="13" />
          </clipPath>
        </defs>
        <g clipPath="url(#flag-lo-circle)">
          <rect width="28" height="28" fill="#CE1126" />
          <rect y="7" width="28" height="14" fill="#002868" />
          <circle cx="14" cy="14" r="5" fill="#FFFFFF" />
        </g>
      </svg>
    );
  }

  return (
    <svg className={styles.flag} viewBox="0 0 28 28" aria-hidden="true">
      <defs>
        <clipPath id="flag-en-circle">
          <circle cx="14" cy="14" r="13" />
        </clipPath>
      </defs>
      <g clipPath="url(#flag-en-circle)">
        <rect width="28" height="28" fill="#174A8B" />
        <path d="M-2 0 30 28M30 0-2 28" stroke="#FFFFFF" strokeWidth="7" />
        <path d="M-2 0 30 28M30 0-2 28" stroke="#D4213D" strokeWidth="3" />
        <rect x="11" width="6" height="28" fill="#FFFFFF" />
        <rect y="11" width="28" height="6" fill="#FFFFFF" />
        <rect x="12.5" width="3" height="28" fill="#D4213D" />
        <rect y="12.5" width="28" height="3" fill="#D4213D" />
      </g>
    </svg>
  );
}

export default function LanguageSwitcher() {
  const {locale, setLocale, t} = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function chooseLanguage(nextLocale: Locale) {
    if (nextLocale !== locale) {
      setLocale(nextLocale);
    }
    setOpen(false);
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-label={t("common.language")}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t("common.language")}
      >
        <GlobeIcon />
      </button>

      {open && (
        <div className={styles.menu} role="menu" aria-label={t("common.language")}>
          {languages.map((language) => {
            const active = language.code === locale;

            return (
              <button
                key={language.code}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={`${styles.option} ${active ? styles.active : ""}`}
                onClick={() => chooseLanguage(language.code)}
              >
                <FlagIcon locale={language.code} />
                <span className={styles.label}>{language.label}</span>
                <span className={styles.check}>
                  {active ? <CheckIcon /> : null}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
