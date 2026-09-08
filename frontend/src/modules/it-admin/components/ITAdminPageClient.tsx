"use client";

import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import QBMSAppShell, {QBMSIcon, type QBMSIconName} from "@/components/layout/QBMSAppShell";
import {useI18n} from "@/i18n/useQBMSI18n";
import {
  fetchAccountSetupQueue,
  type AccountSetupRequest,
} from "@/modules/it-admin/account-setup/accountSetup.api";
import styles from "./ITAdminPage.module.css";

type WorkspaceCard = {
  titleKey: string;
  descriptionKey: string;
  icon: QBMSIconName;
  href?: string;
  status: "available" | "planned";
};

const workspaces: WorkspaceCard[] = [
  {
    titleKey: "itAdmin.accountSetup.title",
    descriptionKey: "itAdmin.accountSetup.description",
    icon: "network",
    href: "/it-admin/account-setup",
    status: "available",
  },
  {
    titleKey: "itAdmin.accessManagement.title",
    descriptionKey: "itAdmin.accessManagement.description",
    icon: "shield",
    status: "planned",
  },
  {
    titleKey: "itAdmin.itRequests.title",
    descriptionKey: "itAdmin.itRequests.description",
    icon: "wrench",
    status: "planned",
  },
  {
    titleKey: "itAdmin.deviceAssignment.title",
    descriptionKey: "itAdmin.deviceAssignment.description",
    icon: "box",
    status: "planned",
  },
];

export default function ITAdminPageClient() {
  const {locale, t} = useI18n();
  const [rows, setRows] = useState<AccountSetupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetchAccountSetupQueue(locale, controller.signal)
      .then(setRows)
      .catch((loadError) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : t("itAdmin.loadError"));
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [locale, t]);

  const metrics = useMemo(() => {
    const pending = rows.filter((row) => row.request_status === "PENDING").length;
    const inProgress = rows.filter((row) => row.request_status === "IN_PROGRESS").length;
    const completed = rows.filter((row) => row.request_status === "COMPLETED").length;
    return {pending, inProgress, completed, open: pending + inProgress};
  }, [rows]);

  return (
    <QBMSAppShell
      pageTitle={t("itAdmin.pageTitle")}
      pageDescription={t("itAdmin.pageDescription")}
    >
      <div className="qbms-breadcrumb">
        <Link href="/">{t("shell.modulesTools")}</Link>
        <span>›</span>
        <strong>{t("itAdmin.pageTitle")}</strong>
      </div>

      <section className="qbms-master-header">
        <div>
          <div className="qbms-eyebrow">{t("itAdmin.eyebrow")}</div>
          <h2>{t("itAdmin.heroTitle")}</h2>
          <p>{t("itAdmin.heroDescription")}</p>
        </div>
        <div className="qbms-master-header-actions">
          <Link href="/" className={styles.backButton}>
            <QBMSIcon name="arrowLeft" size={16} />
            {t("itAdmin.backToModules")}
          </Link>
        </div>
      </section>

      <section className="qbms-master-stats">
        <div className="qbms-stat-card">
          <span>{t("itAdmin.openWork")}</span>
          <strong>{loading ? "—" : metrics.open}</strong>
          <small>{t("itAdmin.openWorkHint")}</small>
        </div>
        <div className="qbms-stat-card">
          <span>{t("itAdmin.pendingSetup")}</span>
          <strong>{loading ? "—" : metrics.pending}</strong>
          <small>{t("itAdmin.pendingSetupHint")}</small>
        </div>
        <div className="qbms-stat-card">
          <span>{t("itAdmin.completedSetup")}</span>
          <strong>{loading ? "—" : metrics.completed}</strong>
          <small>{t("itAdmin.completedSetupHint")}</small>
        </div>
      </section>

      <section className={styles.principleNotice}>
        <span className={styles.noticeIcon}><QBMSIcon name="shield" size={18} /></span>
        <div>
          <strong>{t("itAdmin.principleTitle")}</strong>
          <p>{t("itAdmin.principleBody")}</p>
        </div>
      </section>

      {error && (
        <section className={styles.inlineError}>
          <strong>{t("itAdmin.loadError")}</strong>
          <span>{error}</span>
        </section>
      )}

      <section className={styles.workspaceSection}>
        <div className={styles.sectionHeading}>
          <div>
            <h3>{t("itAdmin.workspaceTitle")}</h3>
            <p>{t("itAdmin.workspaceDescription")}</p>
          </div>
        </div>

        <div className={styles.workspaceGrid}>
          {workspaces.map((item) => {
            const body = (
              <>
                <div className={styles.cardTop}>
                  <span className={styles.cardIcon}><QBMSIcon name={item.icon} size={22} /></span>
                  <span className={`${styles.statusTag} ${item.status === "available" ? styles.available : styles.planned}`}>
                    {t(`itAdmin.status.${item.status}`)}
                  </span>
                </div>
                <div className={styles.cardCopy}>
                  <strong>{t(item.titleKey)}</strong>
                  <p>{t(item.descriptionKey)}</p>
                </div>
                <div className={styles.cardFooter}>
                  {item.href ? (
                    <>
                      <span>{t("itAdmin.openWorkspace")}</span>
                      {item.titleKey === "itAdmin.accountSetup.title" && !loading && metrics.open > 0 ? (
                        <b>{metrics.open}</b>
                      ) : null}
                      <QBMSIcon name="chevron" size={17} />
                    </>
                  ) : (
                    <span>{t("itAdmin.plannedCapability")}</span>
                  )}
                </div>
              </>
            );

            return item.href ? (
              <Link href={item.href} className={styles.workspaceCard} key={item.titleKey}>
                {body}
              </Link>
            ) : (
              <div className={`${styles.workspaceCard} ${styles.disabledCard}`} key={item.titleKey}>
                {body}
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.flowPanel}>
        <div className={styles.flowHeading}>
          <span className={styles.flowIcon}><QBMSIcon name="network" size={19} /></span>
          <div>
            <strong>{t("itAdmin.flowTitle")}</strong>
            <p>{t("itAdmin.flowDescription")}</p>
          </div>
        </div>
        <div className={styles.flowSteps}>
          <span>{t("itAdmin.flow.hr")}</span>
          <b>→</b>
          <span>{t("itAdmin.flow.request")}</span>
          <b>→</b>
          <span>{t("itAdmin.flow.it")}</span>
          <b>→</b>
          <span>{t("itAdmin.flow.ready")}</span>
          <b>→</b>
          <span>{t("itAdmin.flow.notify")}</span>
        </div>
      </section>
    </QBMSAppShell>
  );
}
