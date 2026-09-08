"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import {useI18n} from "@/i18n/useQBMSI18n";
import {
  fetchAuthSession,
  logoutSession,
  type AuthSession,
} from "@/modules/auth/api/auth.api";
import styles from "./FirstLoginPage.module.css";

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 12 4 4 8-9" />
    </svg>
  );
}

export default function FirstLoginPageClient() {
  const {t} = useI18n();
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetchAuthSession(controller.signal)
      .then((value) => {
        if (!value.hasWorkspaceSession) {
          router.replace("/login");
          return;
        }
        if (value.sessionKind === "DEVELOPMENT_PREVIEW") {
          router.replace("/");
          return;
        }
        if (value.canAccessWorkspace) {
          router.replace("/workspace");
          return;
        }
        setSession(value);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [router]);

  async function handleSignOut() {
    try {
      await logoutSession();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (loading || !session) {
    return <main className={styles.loading}>{t("authFirstLogin.loading")}</main>;
  }

  const user = session.user;
  const employment = session.employment;

  return (
    <main className={styles.page}>
      <div className={styles.language}><LanguageSwitcher /></div>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <img src="/qbms-logo.png" alt="Q BMS" />
            <div><strong>Q BMS</strong><span>{t("authFirstLogin.firstSignIn")}</span></div>
          </div>
          <button type="button" onClick={handleSignOut}>{t("authSession.signOut")}</button>
        </header>

        <div className={styles.hero}>
          <span className={styles.successIcon}><CheckIcon /></span>
          <div>
            <span className={styles.eyebrow}>{t("authFirstLogin.accountActivated")}</span>
            <h1>{t("authFirstLogin.welcome", {name: user?.displayName || "Q BMS"})}</h1>
            <p>{t("authFirstLogin.description")}</p>
          </div>
        </div>

        <div className={styles.grid}>
          <section className={styles.panel}>
            <div className={styles.panelTitle}>
              <span>01</span>
              <div><strong>{t("authFirstLogin.employeeProfile")}</strong><small>{t("authFirstLogin.employeeProfileHint")}</small></div>
            </div>
            <dl>
              <div><dt>{t("authFirstLogin.employeeCode")}</dt><dd>{user?.employeeCode || "—"}</dd></div>
              <div><dt>{t("authFirstLogin.companyEmail")}</dt><dd>{user?.email || "—"}</dd></div>
              <div><dt>{t("authFirstLogin.businessUnit")}</dt><dd>{employment?.businessUnitName || "—"}</dd></div>
              <div><dt>{t("authFirstLogin.position")}</dt><dd>{employment?.positionName || "—"}</dd></div>
              <div><dt>{t("authFirstLogin.gradeLevel")}</dt><dd>{employment?.gradeNumber ? `Grade ${employment.gradeNumber}` : "—"}{employment?.jobLevelName ? ` · ${employment.jobLevelName}` : ""}</dd></div>
            </dl>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelTitle}>
              <span>02</span>
              <div><strong>{t("authFirstLogin.systemAccess")}</strong><small>{t("authFirstLogin.systemAccessHint")}</small></div>
            </div>
            <div className={styles.roles}>
              {session.roles.length ? session.roles.map((role) => (
                <span key={role.code} className={role.code === "SUPER_ADMIN" ? styles.superRole : ""}>
                  {role.name}
                </span>
              )) : <em>{t("authFirstLogin.noSpecialRoles")}</em>}
            </div>
            <p className={styles.roleNote}>{t("authFirstLogin.roleSeparation")}</p>
          </section>
        </div>

        <section className={styles.nextStep}>
          <div>
            <span>{t("authFirstLogin.nextStep")}</span>
            <h2>
              {session.onboardingStage === "HR_REVIEW"
                ? t("authFirstLogin.pendingHrReview")
                : t("authFirstLogin.completeProfile")}
            </h2>
            <p>
              {session.onboardingStage === "HR_REVIEW"
                ? t("authFirstLogin.pendingHrReviewHint")
                : t("authFirstLogin.completeProfileHint")}
            </p>
          </div>
          <span className={styles.statusBadge}>{user?.profileStatus || "NOT_STARTED"}</span>
        </section>

        <p className={styles.foundationNote}>{t("authFirstLogin.foundationNote")}</p>
      </section>
    </main>
  );
}
