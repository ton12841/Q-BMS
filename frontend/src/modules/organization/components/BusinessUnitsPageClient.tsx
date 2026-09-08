"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import QBMSAppShell, { QBMSIcon } from "@/components/layout/QBMSAppShell";
import { useI18n } from "@/i18n/useQBMSI18n";
import {
  fetchBusinessUnits,
  type BusinessUnit,
} from "@/modules/organization/api/organization.api";

function formatDate(value: string, locale: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const formatLocale =
    locale === "th" ? "th-TH" : locale === "lo" ? "lo-LA" : "en-GB";

  return new Intl.DateTimeFormat(formatLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function BusinessUnitsPageClient() {
  const { locale, t } = useI18n();
  const [rows, setRows] = useState<BusinessUnit[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadBusinessUnits = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      setRows(await fetchBusinessUnits(locale));
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : t("businessUnit.errorTitle")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locale, t]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetchBusinessUnits(locale, controller.signal)
      .then((data) => {
        setRows(data);
        setError("");
      })
      .catch((loadError) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }
        setError(
          loadError instanceof Error ? loadError.message : t("businessUnit.errorTitle")
        );
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [locale, t]);

  const filteredRows = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return rows;

    return rows.filter((row) =>
      [row.code, row.name, row.description, row.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [query, rows]);

  const activeCount = rows.filter((row) => row.status === "ACTIVE").length;
  const inactiveCount = rows.length - activeCount;

  return (
    <QBMSAppShell
      pageTitle={t("businessUnit.pageTitle")}
      pageDescription={t("businessUnit.pageDescription")}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={t("businessUnit.searchPlaceholder")}
    >
      <div className="qbms-breadcrumb">
        <Link href="/">{t("shell.modulesTools")}</Link>
        <span>›</span>
        <Link href="/organization">{t("organization.pageTitle")}</Link>
        <span>›</span>
        <strong>{t("businessUnit.pageTitle")}</strong>
      </div>

      <section className="qbms-master-header">
        <div>
          <div className="qbms-eyebrow">ORGANIZATION / MASTER DATA</div>
          <h2>{t("businessUnit.pageTitle")}</h2>
          <p>{t("businessUnit.heroDescription")}</p>
        </div>

        <div className="qbms-master-header-actions">
          <span className="qbms-readonly-badge">{t("common.viewOnly")}</span>
          <button
            type="button"
            className="qbms-secondary-button"
            onClick={() => loadBusinessUnits(true)}
            disabled={refreshing}
          >
            <QBMSIcon name="refresh" size={16} />
            {refreshing ? t("common.refreshing") : t("common.refresh")}
          </button>
        </div>
      </section>

      <section className="qbms-master-stats">
        <div className="qbms-stat-card">
          <span>{t("businessUnit.total")}</span>
          <strong>{rows.length}</strong>
          <small>{t("businessUnit.master")}</small>
        </div>
        <div className="qbms-stat-card">
          <span>{t("common.active")}</span>
          <strong>{activeCount}</strong>
          <small>{t("businessUnit.availableForUse")}</small>
        </div>
        <div className="qbms-stat-card">
          <span>{t("common.inactive")}</span>
          <strong>{inactiveCount}</strong>
          <small>{t("businessUnit.notSelectable")}</small>
        </div>
      </section>

      <section className="qbms-master-panel">
        <div className="qbms-master-panel-heading">
          <div>
            <h3>{t("businessUnit.masterTitle")}</h3>
            <p>{t("businessUnit.masterDescription")}</p>
          </div>
          <span>
            {t("businessUnit.count", {
              shown: filteredRows.length,
              total: rows.length,
            })}
          </span>
        </div>

        {loading ? (
          <div className="qbms-loading-state">
            <span className="qbms-loading-spinner" />
            <strong>{t("businessUnit.loadingTitle")}</strong>
            <p>{t("businessUnit.loadingBody")}</p>
          </div>
        ) : error ? (
          <div className="qbms-error-state">
            <span className="qbms-error-icon">!</span>
            <div>
              <strong>{t("businessUnit.errorTitle")}</strong>
              <p>{error}</p>
              <small>{t("businessUnit.errorHint")}</small>
            </div>
            <button type="button" onClick={() => loadBusinessUnits()}>
              {t("common.tryAgain")}
            </button>
          </div>
        ) : (
          <div className="qbms-table-wrap">
            <table className="qbms-master-table">
              <thead>
                <tr>
                  <th>{t("businessUnit.pageTitle")}</th>
                  <th>{t("common.code")}</th>
                  <th>{t("common.description")}</th>
                  <th>{t("common.status")}</th>
                  <th>{t("common.order")}</th>
                  <th>{t("common.updated")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length ? (
                  filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="qbms-business-unit-cell">
                          <span className="qbms-business-unit-mark">
                            {row.name.slice(0, 1).toUpperCase()}
                          </span>
                          <div>
                            <strong>{row.name}</strong>
                            <small>{t("businessUnit.entityLabel")}</small>
                          </div>
                        </div>
                      </td>
                      <td><span className="qbms-code-chip">{row.code}</span></td>
                      <td className="qbms-description-cell">{row.description || "-"}</td>
                      <td>
                        <span className={`qbms-status-pill ${row.status === "ACTIVE" ? "active" : "inactive"}`}>
                          <span />
                          {row.status === "ACTIVE" ? t("common.active") : t("common.inactive")}
                        </span>
                      </td>
                      <td>{row.sort_order}</td>
                      <td>{formatDate(row.updated_at, locale)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="qbms-empty-table">
                        <QBMSIcon name="search" size={22} />
                        <strong>{t("businessUnit.emptyTitle")}</strong>
                        <span>{t("businessUnit.emptyBody")}</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="qbms-page-footer-action">
        <Link href="/organization" className="qbms-back-link">
          <QBMSIcon name="arrowLeft" size={16} />
          {t("businessUnit.back")}
        </Link>
      </div>
    </QBMSAppShell>
  );
}
