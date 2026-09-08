"use client";

import Link from "next/link";
import {useCallback, useEffect, useMemo, useState} from "react";
import QBMSAppShell, {QBMSIcon} from "@/components/layout/QBMSAppShell";
import {useI18n} from "@/i18n/useQBMSI18n";
import {
  completeAccountSetupRequest,
  fetchAccountSetupQueue,
  startAccountSetupRequest,
  type AccountSetupRequest,
} from "./accountSetup.api";
import styles from "./AccountSetupPage.module.css";

function employeeName(row: AccountSetupRequest) {
  const fullName = [row.first_name, row.last_name].filter(Boolean).join(" ");
  return row.nickname ? `${fullName} (${row.nickname})` : fullName;
}

function statusClass(status: AccountSetupRequest["request_status"]) {
  if (status === "COMPLETED") return styles.statusCompleted;
  if (status === "IN_PROGRESS") return styles.statusProgress;
  if (status === "CANCELLED") return styles.statusCancelled;
  return styles.statusPending;
}

export default function AccountSetupPageClient() {
  const {locale, t} = useI18n();
  const [rows, setRows] = useState<AccountSetupRequest[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState<string | null>(null);

  const [modalRow, setModalRow] = useState<AccountSetupRequest | null>(null);
  const [companyEmail, setCompanyEmail] = useState("");
  const [itNote, setItNote] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const data = await fetchAccountSetupQueue(locale);
        setRows(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : t("accountSetup.errorTitle"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [locale, t]
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetchAccountSetupQueue(locale, controller.signal)
      .then((data) => {
        setRows(data);
        setError("");
      })
      .catch((loadError) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : t("accountSetup.errorTitle"));
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [locale, t]);

  const filteredRows = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return rows;

    return rows.filter((row) =>
      [
        row.employee_code,
        row.first_name,
        row.last_name,
        row.nickname,
        row.business_unit_code,
        row.business_unit_name,
        row.position_code,
        row.position_name,
        row.job_grade_name,
        row.job_level_name,
        row.company_email,
        row.employee_company_email,
        row.request_status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [query, rows]);

  const pendingCount = rows.filter((row) => row.request_status === "PENDING").length;
  const progressCount = rows.filter((row) => row.request_status === "IN_PROGRESS").length;
  const completedCount = rows.filter((row) => row.request_status === "COMPLETED").length;

  async function startSetup(row: AccountSetupRequest) {
    setWorkingId(row.id);
    setError("");
    try {
      const updated = await startAccountSetupRequest(row.id, locale);
      setRows((current) => current.map((item) => (item.id === row.id ? updated : item)));
      openComplete(updated);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : t("accountSetup.startError"));
    } finally {
      setWorkingId(null);
    }
  }

  function openComplete(row: AccountSetupRequest) {
    setModalRow(row);
    setCompanyEmail(row.company_email || row.employee_company_email || "");
    setItNote(row.it_note || "");
    setFormError("");
  }

  function closeModal() {
    if (saving) return;
    setModalRow(null);
    setCompanyEmail("");
    setItNote("");
    setFormError("");
  }

  async function submitComplete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modalRow) return;

    const email = companyEmail.trim().toLowerCase();
    if (!email) {
      setFormError(t("accountSetup.validationEmail"));
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const updated = await completeAccountSetupRequest(modalRow.id, locale, {
        company_email: email,
        it_note: itNote.trim(),
      });
      setRows((current) => current.map((item) => (item.id === modalRow.id ? updated : item)));
      setSaving(false);
      setModalRow(null);
      setCompanyEmail("");
      setItNote("");
      setFormError("");
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : t("accountSetup.completeError"));
      setSaving(false);
    }
  }

  return (
    <QBMSAppShell
      pageTitle={t("accountSetup.pageTitle")}
      pageDescription={t("accountSetup.pageDescription")}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={t("accountSetup.searchPlaceholder")}
    >
      <div className="qbms-breadcrumb">
        <Link href="/">{t("shell.modulesTools")}</Link>
        <span>›</span>
        <Link href="/it-admin">{t("itAdmin.pageTitle")}</Link>
        <span>›</span>
        <strong>{t("accountSetup.pageTitle")}</strong>
      </div>

      <section className="qbms-master-header">
        <div>
          <div className="qbms-eyebrow">{t("accountSetup.eyebrow")}</div>
          <h2>{t("accountSetup.heroTitle")}</h2>
          <p>{t("accountSetup.heroDescription")}</p>
        </div>

        <div className="qbms-master-header-actions">
          <Link href="/it-admin" className={styles.backButton}>
            <QBMSIcon name="arrowLeft" size={16} />
            {t("itAdmin.backToDashboard")}
          </Link>
          <button
            type="button"
            className="qbms-secondary-button"
            onClick={() => loadData(true)}
            disabled={refreshing}
          >
            <QBMSIcon name="refresh" size={16} />
            {refreshing ? t("common.refreshing") : t("common.refresh")}
          </button>
        </div>
      </section>

      <section className="qbms-master-stats">
        <div className="qbms-stat-card">
          <span>{t("accountSetup.pending")}</span>
          <strong>{pendingCount}</strong>
          <small>{t("accountSetup.pendingHint")}</small>
        </div>
        <div className="qbms-stat-card">
          <span>{t("accountSetup.inProgress")}</span>
          <strong>{progressCount}</strong>
          <small>{t("accountSetup.inProgressHint")}</small>
        </div>
        <div className="qbms-stat-card">
          <span>{t("accountSetup.completed")}</span>
          <strong>{completedCount}</strong>
          <small>{t("accountSetup.completedHint")}</small>
        </div>
      </section>

      <section className={styles.triggerNotice}>
        <span className={styles.noticeIcon}><QBMSIcon name="bell" size={18} /></span>
        <div>
          <strong>{t("accountSetup.triggerTitle")}</strong>
          <p>{t("accountSetup.triggerBody")}</p>
        </div>
      </section>

      <section className="qbms-master-panel">
        <div className="qbms-master-panel-heading">
          <div>
            <h3>{t("accountSetup.queueTitle")}</h3>
            <p>{t("accountSetup.queueDescription")}</p>
          </div>
          <span>{t("accountSetup.count", {shown: filteredRows.length, total: rows.length})}</span>
        </div>

        {loading ? (
          <div className="qbms-loading-state">
            <span className="qbms-loading-spinner" />
            <strong>{t("accountSetup.loadingTitle")}</strong>
            <p>{t("accountSetup.loadingBody")}</p>
          </div>
        ) : error ? (
          <div className="qbms-error-state">
            <span className="qbms-error-icon">!</span>
            <div>
              <strong>{t("accountSetup.errorTitle")}</strong>
              <p>{error}</p>
              <small>{t("accountSetup.errorHint")}</small>
            </div>
            <button type="button" onClick={() => loadData()}>{t("common.tryAgain")}</button>
          </div>
        ) : filteredRows.length ? (
          <div className="qbms-table-wrap">
            <table className={`qbms-master-table ${styles.table}`}>
              <thead>
                <tr>
                  <th>{t("accountSetup.employee")}</th>
                  <th>{t("accountSetup.organization")}</th>
                  <th>{t("accountSetup.startDate")}</th>
                  <th>{t("accountSetup.requested")}</th>
                  <th>{t("accountSetup.statusLabel")}</th>
                  <th>{t("accountSetup.companyEmail")}</th>
                  <th>{t("accountSetup.action")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="qbms-business-unit-cell">
                        <span className="qbms-business-unit-mark">
                          {row.first_name.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <strong>{employeeName(row)}</strong>
                          <small>{row.employee_code}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.stack}>
                        <strong>{row.business_unit_name || t("employee.unassigned")}</strong>
                        <small>
                          {[row.position_name, row.grade_number ? `G${row.grade_number}` : null]
                            .filter(Boolean)
                            .join(" · ") || t("employee.unassigned")}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span className={styles.dateText}>
                        {row.start_date
                          ? new Date(row.start_date).toLocaleDateString(locale)
                          : t("employee.noStartDate")}
                      </span>
                    </td>
                    <td>
                      <div className={styles.stack}>
                        <strong>{new Date(row.requested_at).toLocaleDateString(locale)}</strong>
                        <small>{new Date(row.requested_at).toLocaleTimeString(locale, {hour: "2-digit", minute: "2-digit"})}</small>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.status} ${statusClass(row.request_status)}`}>
                        {t(`accountSetup.status.${row.request_status}`)}
                      </span>
                    </td>
                    <td>
                      {row.employee_company_email || row.company_email ? (
                        <span className={styles.email}>{row.employee_company_email || row.company_email}</span>
                      ) : (
                        <span className={styles.muted}>{t("accountSetup.notCreatedYet")}</span>
                      )}
                    </td>
                    <td>
                      {row.request_status === "PENDING" ? (
                        <button
                          type="button"
                          className={styles.primaryAction}
                          disabled={workingId === row.id}
                          onClick={() => startSetup(row)}
                        >
                          {workingId === row.id ? t("accountSetup.starting") : t("accountSetup.startSetup")}
                        </button>
                      ) : row.request_status === "IN_PROGRESS" ? (
                        <button
                          type="button"
                          className={styles.completeAction}
                          onClick={() => openComplete(row)}
                        >
                          {t("accountSetup.confirmAccount")}
                        </button>
                      ) : row.request_status === "COMPLETED" ? (
                        <div className={styles.completedState}>
                          <QBMSIcon name="check" size={15} />
                          <span>{row.invitation_status === "DRAFT" ? t("accountSetup.invitationReady") : t("accountSetup.done")}</span>
                        </div>
                      ) : (
                        <span className={styles.muted}>{t("accountSetup.cancelled")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}><QBMSIcon name="check" size={24} /></span>
            <strong>{t("accountSetup.emptyTitle")}</strong>
            <p>{t("accountSetup.emptyBody")}</p>
          </div>
        )}
      </section>

      {modalRow && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="account-setup-title">
            <div className={styles.modalHeader}>
              <div>
                <span>{t("accountSetup.modalEyebrow")}</span>
                <h3 id="account-setup-title">{employeeName(modalRow)}</h3>
                <p>{t("accountSetup.modalDescription")}</p>
              </div>
              <button type="button" onClick={closeModal} disabled={saving} aria-label={t("employee.close")}>×</button>
            </div>

            <form onSubmit={submitComplete}>
              <div className={styles.modalBody}>
                <div className={styles.employeeSummary}>
                  <div><span>{t("accountSetup.employeeCode")}</span><strong>{modalRow.employee_code}</strong></div>
                  <div><span>{t("employee.businessUnit")}</span><strong>{modalRow.business_unit_name || "—"}</strong></div>
                  <div><span>{t("employee.position")}</span><strong>{modalRow.position_name || "—"}</strong></div>
                  <div><span>{t("accountSetup.startDate")}</span><strong>{modalRow.start_date ? new Date(modalRow.start_date).toLocaleDateString(locale) : "—"}</strong></div>
                </div>

                {formError && <div className={styles.formError}>{formError}</div>}

                <label className={styles.field}>
                  <span>{t("accountSetup.companyEmail")} <b>*</b></span>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(event) => setCompanyEmail(event.target.value)}
                    placeholder="name@iquritech.com"
                    autoFocus
                  />
                  <small>{t("accountSetup.emailHint")}</small>
                </label>

                <label className={styles.field}>
                  <span>{t("accountSetup.itNote")}</span>
                  <textarea
                    value={itNote}
                    onChange={(event) => setItNote(event.target.value)}
                    placeholder={t("accountSetup.itNotePlaceholder")}
                  />
                </label>

                <div className={styles.afterConfirm}>
                  <QBMSIcon name="network" size={18} />
                  <div>
                    <strong>{t("accountSetup.afterConfirmTitle")}</strong>
                    <p>{t("accountSetup.afterConfirmBody")}</p>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelButton} onClick={closeModal} disabled={saving}>
                  {t("employee.cancel")}
                </button>
                <button type="submit" className={styles.saveButton} disabled={saving}>
                  {saving ? t("accountSetup.confirming") : t("accountSetup.confirmReady")}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </QBMSAppShell>
  );
}
