"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import {useI18n} from "@/i18n/useQBMSI18n";
import {
  buildGoogleSignInUrl,
  fetchAuthConfig,
  fetchInvitationPreview,
  type AuthConfig,
  type InvitationPreview,
} from "@/modules/auth/api/auth.api";
import styles from "./ActivationPage.module.css";

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

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 19 6v5.4c0 4.5-2.7 7.9-7 9.6-4.3-1.7-7-5.1-7-9.6V6l7-3Z" />
      <path d="m9.3 12 1.8 1.8 3.8-4" />
    </svg>
  );
}

function formatExpiry(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function ActivationPageClient({
  invitationPublicId,
}: {
  invitationPublicId: string;
}) {
  const {t} = useI18n();
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [callbackError, setCallbackError] = useState("");

  useEffect(() => {
    setCallbackError(new URLSearchParams(window.location.search).get("message") || "");
    const controller = new AbortController();

    if (!invitationPublicId) {
      setLoading(false);
      setLoadError(t("authActivation.missingInvitation"));
      return () => controller.abort();
    }

    Promise.all([
      fetchInvitationPreview(invitationPublicId, controller.signal),
      fetchAuthConfig(controller.signal),
    ])
      .then(([invitation, authConfig]) => {
        setPreview(invitation);
        setConfig(authConfig);
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : t("authActivation.loadError"));
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [invitationPublicId, t]);

  function handleActivate() {
    window.location.assign(
      buildGoogleSignInUrl({
        invitationPublicId,
        nextPath: "/onboarding/profile",
      })
    );
  }

  const invitation = preview?.invitation;
  const canActivate = Boolean(preview?.canActivate && config?.googleSsoConfigured);

  return (
    <main className={styles.page}>
      <div className={styles.language}><LanguageSwitcher /></div>
      <section className={styles.card}>
        <div className={styles.brand}>
          <img src="/qbms-logo.png" alt="Q BMS" />
          <div>
            <strong>Q BMS</strong>
            <span>{t("authLogin.productName")}</span>
          </div>
        </div>

        <div className={styles.icon}><ShieldIcon /></div>
        <span className={styles.eyebrow}>{t("authActivation.eyebrow")}</span>
        <h1>{t("authActivation.title")}</h1>
        <p className={styles.lead}>{t("authActivation.subtitle")}</p>

        {loading && <div className={styles.stateBox}>{t("authActivation.loading")}</div>}

        {!loading && (loadError || callbackError) && (
          <div className={styles.errorBox} role="alert">
            <strong>{t("authActivation.cannotContinue")}</strong>
            <span>{callbackError || loadError}</span>
          </div>
        )}

        {!loading && invitation && (
          <>
            <div className={styles.employeeBox}>
              <div className={styles.employeeName}>
                <span>{t("authActivation.invitedEmployee")}</span>
                <strong>{invitation.displayName}</strong>
              </div>
              <div className={styles.infoGrid}>
                <div>
                  <span>{t("authActivation.employeeCode")}</span>
                  <strong>{invitation.employeeCode || "—"}</strong>
                </div>
                <div>
                  <span>{t("authActivation.companyAccount")}</span>
                  <strong>{invitation.invitedEmailMasked}</strong>
                </div>
                <div>
                  <span>{t("authActivation.expires")}</span>
                  <strong>{formatExpiry(invitation.expiresAt)}</strong>
                </div>
                <div>
                  <span>{t("authActivation.status")}</span>
                  <strong>{invitation.invitationStatus}</strong>
                </div>
              </div>
            </div>

            {preview?.canActivate ? (
              <>
                <p className={styles.instruction}>{t("authActivation.instruction")}</p>
                <button
                  className={styles.googleButton}
                  type="button"
                  disabled={!canActivate}
                  onClick={handleActivate}
                >
                  <span><GoogleIcon /></span>
                  {t("authActivation.continueGoogle")}
                </button>
                {config && !config.googleSsoConfigured && (
                  <div className={styles.warningBox}>{t("authActivation.googleNotConfigured")}</div>
                )}
              </>
            ) : (
              <div className={styles.warningBox}>
                {preview?.message || t("authActivation.notActive")}
              </div>
            )}
          </>
        )}

        <div className={styles.footerLinks}>
          <Link href="/login">{t("authActivation.backToLogin")}</Link>
          <span>•</span>
          <span>{t("authActivation.contactHelp")}</span>
        </div>
      </section>
    </main>
  );
}
