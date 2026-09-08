"use client";

import {useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import {useI18n} from "@/i18n/useQBMSI18n";
import {
  buildGoogleSignInUrl,
  fetchAuthConfig,
  fetchAuthSession,
  startDevelopmentPreview,
  type AuthConfig,
} from "@/modules/auth/api/auth.api";
import styles from "./LoginPage.module.css";

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 19 6v5.4c0 4.5-2.7 7.9-7 9.6-4.3-1.7-7-5.1-7-9.6V6l7-3Z" />
      <path d="m9.3 12 1.8 1.8 3.8-4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.6Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.6c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.7A10.1 10.1 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.5 14a6 6 0 0 1 0-3.9V7.4H3.1a10 10 0 0 0 0 9.3L6.5 14Z" />
      <path fill="#EA4335" d="M12 6a5.5 5.5 0 0 1 3.9 1.5l2.9-2.9A9.8 9.8 0 0 0 12 2a10.1 10.1 0 0 0-8.9 5.4l3.4 2.7A5.9 5.9 0 0 1 12 6Z" />
    </svg>
  );
}

function readQueryValue(name: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) || "";
}

function safeNextPath(fallback = "/") {
  const nextPath = readQueryValue("next");
  return nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : fallback;
}

export default function LoginPageClient() {
  const {t} = useI18n();
  const router = useRouter();
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [isLocalDevelopment, setIsLocalDevelopment] = useState(false);
  const [isStartingPreview, setIsStartingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [authError, setAuthError] = useState("");
  const navigationInProgressRef = useRef(false);

  useEffect(() => {
    const host = window.location.hostname;
    setIsLocalDevelopment(host === "localhost" || host === "127.0.0.1");
    setAuthError(readQueryValue("message"));

    const controller = new AbortController();

    Promise.all([
      fetchAuthConfig(controller.signal).then(setAuthConfig).catch(() => null),
      fetchAuthSession(controller.signal).catch(() => null),
    ]).then(([, session]) => {
      if (navigationInProgressRef.current || !session?.hasWorkspaceSession) return;

      navigationInProgressRef.current = true;
      if (session.sessionKind === "DEVELOPMENT_PREVIEW") {
        window.location.replace(safeNextPath("/"));
        return;
      }

      if (session.canAccessWorkspace) {
        window.location.replace(safeNextPath("/workspace"));
        return;
      }

      window.location.replace("/onboarding/profile");
    });

    return () => controller.abort();
  }, [router]);

  function handleGoogleSignIn() {
    window.location.assign(
      buildGoogleSignInUrl({
        nextPath: safeNextPath("/workspace"),
      })
    );
  }

  async function handleDevelopmentPreview() {
    if (isStartingPreview) return;

    navigationInProgressRef.current = true;
    setIsStartingPreview(true);
    setPreviewError("");

    try {
      const createdSession = await startDevelopmentPreview();
      if (
        !createdSession.hasWorkspaceSession ||
        createdSession.sessionKind !== "DEVELOPMENT_PREVIEW"
      ) {
        throw new Error(t("authLogin.previewError"));
      }

      // Verify the backend can read the cookie before leaving /login.
      // A hard navigation avoids a Next.js replace/refresh race that could
      // render /login and the workspace alternately.
      const verifiedSession = await fetchAuthSession();
      if (
        !verifiedSession.hasWorkspaceSession ||
        verifiedSession.sessionKind !== "DEVELOPMENT_PREVIEW"
      ) {
        throw new Error(t("authLogin.previewError"));
      }

      window.location.replace(safeNextPath("/"));
    } catch (error) {
      navigationInProgressRef.current = false;
      setPreviewError(
        error instanceof Error ? error.message : t("authLogin.previewError")
      );
      setIsStartingPreview(false);
    }
  }

  const workspaceLabel = authConfig?.workspaceDomain
    ? `@${authConfig.workspaceDomain}`
    : t("authLogin.companyWorkspace");
  const googleReady = authConfig?.googleSsoConfigured === true;
  const configChecked = authConfig !== null;

  return (
    <main className={styles.page}>
      <aside className={styles.brandPanel}>
        <div className={styles.glowOne} />
        <div className={styles.glowTwo} />
        <div className={styles.orbit} />

        <div className={styles.brandTop}>
          <img className={styles.logo} src="/qbms-logo.png" alt="Q BMS" />
          <div className={styles.brandMeta}>
            <span>{t("authLogin.internalSystem")}</span>
            <strong>Q BMS</strong>
            <small>{t("authLogin.productName")}</small>
          </div>
        </div>

        <div className={styles.brandMessage}>
          <span className={styles.rule} />
          <h2>{t("authLogin.brandHeadline")}</h2>
          <p>{t("authLogin.brandDescription")}</p>
        </div>

        <div className={styles.statusPill}>
          <span className={styles.statusDot} />
          {isLocalDevelopment ? t("authLogin.localDevelopment") : t("authLogin.systemOperational")}
        </div>

        <div className={styles.brandVersion}>Q BMS v2.1.7.0</div>
      </aside>

      <section className={styles.accessPanel}>
        <div className={styles.language}>
          <LanguageSwitcher />
        </div>

        <div className={styles.accessContent}>
          <div className={styles.secureBadge}>
            <span><ShieldIcon /></span>
            {t("authLogin.secureWorkspace")}
          </div>

          <h1>{t("authLogin.welcome")}</h1>
          <p className={styles.lead}>{t("authLogin.subtitle")}</p>

          <section className={styles.loginCard} aria-labelledby="qbms-login-title">
            <div className={styles.cardHeader}>
              <span className={styles.userIcon}><UserIcon /></span>
              <div>
                <span className={styles.eyebrow}>{t("authLogin.companyAccess")}</span>
                <h2 id="qbms-login-title">{t("authLogin.signInTitle")}</h2>
              </div>
            </div>

            <p className={styles.cardDescription}>{t("authLogin.signInDescription")}</p>

            <div className={styles.workspaceBox}>
              <span className={styles.workspaceShield}><ShieldIcon /></span>
              <div>
                <strong>Google Workspace</strong>
                <span>{workspaceLabel} · {t("authLogin.workspaceHint")}</span>
              </div>
            </div>

            <button
              className={styles.googleButton}
              type="button"
              disabled={configChecked && !googleReady}
              onClick={handleGoogleSignIn}
            >
              <span className={styles.googleMark}><GoogleIcon /></span>
              <span>{t("authLogin.googleButton")}</span>
              <span className={styles.arrow}><ArrowIcon /></span>
            </button>

            {authError && (
              <div className={styles.authError} role="alert">
                <ShieldIcon />
                <span>{authError}</span>
              </div>
            )}

            {configChecked && !googleReady && (
              <div className={styles.configNotice} role="status">
                <ShieldIcon />
                <span>
                  {t("authLogin.googleNotConfigured")}
                  {authConfig?.redirectUri ? ` ${t("authLogin.redirectUri")}: ${authConfig.redirectUri}` : ""}
                </span>
              </div>
            )}

            {configChecked && googleReady && (
              <div className={styles.configReady} role="status">
                <ShieldIcon />
                <span>{t("authLogin.googleConfigured")}</span>
              </div>
            )}

            {isLocalDevelopment && (
              <div className={styles.previewArea}>
                <div className={styles.previewDivider}>
                  <span>{t("authLogin.developmentOnly")}</span>
                </div>
                <button
                  className={styles.previewButton}
                  type="button"
                  disabled={isStartingPreview}
                  onClick={handleDevelopmentPreview}
                >
                  {isStartingPreview
                    ? t("authLogin.openingPreview")
                    : t("authLogin.openDevelopmentPreview")}
                </button>
                <p>{t("authLogin.developmentPreviewHint")}</p>
                {previewError && (
                  <div className={styles.previewError} role="alert">
                    {previewError}
                  </div>
                )}
              </div>
            )}
          </section>

          <div className={styles.accessNote}>
            <ShieldIcon />
            <span>{t("authLogin.accessNote")}</span>
          </div>
        </div>

        <footer className={styles.footer}>
          <span>{t("authLogin.footer")}</span>
          <span className={styles.footerDot} />
          <span>{t("authLogin.secureCompanyWorkspace")}</span>
        </footer>
      </section>
    </main>
  );
}
