"use client";

import Link from "next/link";
import {useCallback, useEffect, useMemo, useState} from "react";
import QBMSAppShell, {QBMSIcon} from "@/components/layout/QBMSAppShell";
import {useI18n} from "@/i18n/useQBMSI18n";
import {
  fetchInvitationQueue,
  queueInvitation,
  revokeInvitation,
  type HRInvitationRow,
} from "./invitation.api";
import styles from "./InvitationPage.module.css";

function employeeName(row: HRInvitationRow) {
  return [row.first_name, row.last_name].filter(Boolean).join(" ") || row.company_email;
}

function statusOf(row: HRInvitationRow) {
  return row.invitation_status || "DRAFT";
}

function formatDate(value: string | null, locale: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const language = locale === "th" ? "th-TH" : locale === "lo" ? "lo-LA" : "en-GB";
  return new Intl.DateTimeFormat(language, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function InvitationPageClient() {
  const {locale, t} = useI18n();
  const [rows, setRows] = useState<HRInvitationRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [workingEmployeeId, setWorkingEmployeeId] = useState<string | null>(null);

  const loadData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const data = await fetchInvitationQueue(locale);
      setRows(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("hrInvitation.loadError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locale, t]);

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  const metrics = useMemo(() => {
    let ready = 0;
    let queued = 0;
    let accepted = 0;

    rows.forEach((row) => {
      const status = statusOf(row);
      if (["DRAFT", "EXPIRED", "REVOKED"].includes(status)) ready += 1;
      if (["QUEUED", "SENT"].includes(status)) queued += 1;
      if (status === "ACCEPTED") accepted += 1;
    });

    return {ready, queued, accepted};
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;

    return rows.filter((row) =>
      [
        row.employee_code,
        row.first_name,
        row.last_name,
        row.nickname,
        row.company_email,
        row.business_unit_code,
        row.business_unit_name,
        row.position_code,
        row.position_name,
        row.grade_number ? `grade ${row.grade_number}` : "",
        row.job_level_name,
        statusOf(row),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [query, rows]);

  async function handleQueue(row: HRInvitationRow) {
    setWorkingEmployeeId(row.employee_id);
    setError("");
    setNotice("");
    try {
      const updated = await queueInvitation(row.employee_id, locale);
      setRows((current) => current.map((item) => item.employee_id === row.employee_id ? updated : item));
      setNotice(t("hrInvitation.queueSuccess", {email: row.company_email}));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t("hrInvitation.queueError"));
    } finally {
      setWorkingEmployeeId(null);
    }
  }

  async function handleRevoke(row: HRInvitationRow) {
    if (!window.confirm(t("hrInvitation.revokeConfirm"))) return;
    setWorkingEmployeeId(row.employee_id);
    setError("");
    setNotice("");
    try {
      const updated = await revokeInvitation(row.employee_id, locale);
      setRows((current) => current.map((item) => item.employee_id === row.employee_id ? updated : item));
      setNotice(t("hrInvitation.revokeSuccess"));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t("hrInvitation.revokeError"));
    } finally {
      setWorkingEmployeeId(null);
    }
  }

  async function copyActivationLink(row: HRInvitationRow) {
    if (!row.invitation_public_id) return;
    const link = `${window.location.origin}/activate/${row.invitation_public_id}`;
    try {
      await navigator.clipboard.writeText(link);
      setNotice(t("hrInvitation.copySuccess"));
      setError("");
    } catch {
      window.prompt(t("hrInvitation.copyFallback"), link);
    }
  }

  return (
    <QBMSAppShell
      pageTitle={t("hrInvitation.pageTitle")}
      pageDescription={t("hrInvitation.pageDescription")}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={t("hrInvitation.searchPlaceholder")}
    >
      <div className="qbms-breadcrumb">
        <Link href="/">{t("shell.modulesTools")}</Link>
        <span>›</span>
        <Link href="/hrm">HRM</Link>
        <span>›</span>
        <strong>{t("hrInvitation.pageTitle")}</strong>
      </div>

      <section className="qbms-master-header">
        <div>
          <div className="qbms-eyebrow">{t("hrInvitation.eyebrow")}</div>
          <h2>{t("hrInvitation.heroTitle")}</h2>
          <p>{t("hrInvitation.heroDescription")}</p>
        </div>
        <div className="qbms-master-header-actions">
          <Link href="/hrm" className={styles.secondaryAction}>
            <QBMSIcon name="arrowLeft" size={16} />
            {t("hrInvitation.backToHRM")}
          </Link>
          <button
            type="button"
            className="qbms-secondary-button"
            disabled={refreshing}
            onClick={() => void loadData(true)}
          >
            <QBMSIcon name="refresh" size={16} />
            {refreshing ? t("common.refreshing") : t("common.refresh")}
          </button>
        </div>
      </section>

      <section className="qbms-master-stats">
        <div className="qbms-stat-card">
          <span>{t("hrInvitation.ready")}</span>
          <strong>{loading ? "—" : metrics.ready}</strong>
          <small>{t("hrInvitation.readyHint")}</small>
        </div>
        <div className="qbms-stat-card">
          <span>{t("hrInvitation.queued")}</span>
          <strong>{loading ? "—" : metrics.queued}</strong>
          <small>{t("hrInvitation.queuedHint")}</small>
        </div>
        <div className="qbms-stat-card">
          <span>{t("hrInvitation.accepted")}</span>
          <strong>{loading ? "—" : metrics.accepted}</strong>
          <small>{t("hrInvitation.acceptedHint")}</small>
        </div>
      </section>

      <section className={styles.deliveryNotice}>
        <span className={styles.deliveryIcon}><QBMSIcon name="bell" size={18} /></span>
        <div>
          <strong>{t("hrInvitation.deliveryTitle")}</strong>
          <p>{t("hrInvitation.deliveryBody")}</p>
        </div>
      </section>

      {notice ? <section className={styles.successNotice}>{notice}</section> : null}
      {error ? <section className={styles.errorNotice}>{error}</section> : null}

      <section className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>
            <h3>{t("hrInvitation.queueTitle")}</h3>
            <p>{t("hrInvitation.queueDescription")}</p>
          </div>
          <span>{filteredRows.length} / {rows.length}</span>
        </div>

        {loading ? (
          <div className={styles.emptyState}>{t("common.loading")}</div>
        ) : filteredRows.length === 0 ? (
          <div className={styles.emptyState}>
            <strong>{t("hrInvitation.emptyTitle")}</strong>
            <p>{t("hrInvitation.emptyBody")}</p>
          </div>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t("hrInvitation.employee")}</th>
                  <th>{t("hrInvitation.organization")}</th>
                  <th>{t("hrInvitation.companyEmail")}</th>
                  <th>{t("hrInvitation.invitationStatus")}</th>
                  <th>{t("hrInvitation.expires")}</th>
                  <th>{t("hrInvitation.action")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const status = statusOf(row);
                  const working = workingEmployeeId === row.employee_id;
                  const canQueue = ["DRAFT", "EXPIRED", "REVOKED"].includes(status);
                  const canManageActive = ["QUEUED", "SENT"].includes(status);

                  return (
                    <tr key={row.employee_id}>
                      <td>
                        <div className={styles.employeeCell}>
                          <span className={styles.avatar}>{row.first_name?.slice(0, 1).toUpperCase() || "E"}</span>
                          <span>
                            <strong>{employeeName(row)}</strong>
                            <small>{row.employee_code}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <strong className={styles.orgPrimary}>{row.position_name || "—"}</strong>
                        <small className={styles.orgSecondary}>
                          {[row.business_unit_name, row.grade_number ? `Grade ${row.grade_number}` : null]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </small>
                      </td>
                      <td>{row.company_email}</td>
                      <td>
                        <span className={`${styles.status} ${styles[`status${status}`] || ""}`}>
                          {t(`hrInvitation.status.${status}`)}
                        </span>
                      </td>
                      <td>{formatDate(row.expires_at, locale)}</td>
                      <td>
                        <div className={styles.actions}>
                          {canQueue ? (
                            <button
                              type="button"
                              className={styles.primaryButton}
                              disabled={working}
                              onClick={() => void handleQueue(row)}
                            >
                              {working ? t("hrInvitation.queuing") : t("hrInvitation.queueAction")}
                            </button>
                          ) : null}

                          {canManageActive && row.invitation_public_id ? (
                            <button
                              type="button"
                              className={styles.secondaryButton}
                              onClick={() => void copyActivationLink(row)}
                            >
                              {t("hrInvitation.copyLink")}
                            </button>
                          ) : null}

                          {canManageActive ? (
                            <button
                              type="button"
                              className={styles.dangerButton}
                              disabled={working}
                              onClick={() => void handleRevoke(row)}
                            >
                              {t("hrInvitation.revokeAction")}
                            </button>
                          ) : null}

                          {status === "ACCEPTED" ? (
                            <span className={styles.completeText}>
                              <QBMSIcon name="check" size={15} />
                              {t("hrInvitation.accepted")}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </QBMSAppShell>
  );
}
