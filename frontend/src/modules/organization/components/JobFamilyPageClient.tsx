
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import QBMSAppShell, {
  QBMSIcon,
} from "@/components/layout/QBMSAppShell";
import type {Locale} from "@/i18n/config";
import {useI18n} from "@/i18n/useQBMSI18n";
import {
  createJobFamily,
  fetchJobFamilies,
  fetchJobFamilyDetail,
  updateJobFamily,
  type JobFamily,
  type JobFamilyWritePayload,
} from "@/modules/organization/api/organization.api";
import styles from "./JobFamilyPage.module.css";

type LocalizedForm = {
  name: string;
  description: string;
};

type JobFamilyForm = {
  code: string;
  status: "ACTIVE" | "INACTIVE";
  sortOrder: string;
  translations: Record<Locale, LocalizedForm>;
};

const EMPTY_FORM: JobFamilyForm = {
  code: "",
  status: "ACTIVE",
  sortOrder: "0",
  translations: {
    en: {name: "", description: ""},
    th: {name: "", description: ""},
    lo: {name: "", description: ""},
  },
};

function newForm(): JobFamilyForm {
  return {
    ...EMPTY_FORM,
    translations: {
      en: {...EMPTY_FORM.translations.en},
      th: {...EMPTY_FORM.translations.th},
      lo: {...EMPTY_FORM.translations.lo},
    },
  };
}

export default function JobFamilyPageClient() {
  const {locale, t} = useI18n();

  const [rows, setRows] = useState<JobFamily[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] =
    useState<string | null>(null);
  const [form, setForm] = useState<JobFamilyForm>(
    newForm()
  );
  const [formLoading, setFormLoading] =
    useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      try {
        setRows(await fetchJobFamilies(locale));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : t("jobFamily.errorTitle")
        );
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

    fetchJobFamilies(locale, controller.signal)
      .then((data) => {
        setRows(data);
        setError("");
      })
      .catch((loadError) => {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : t("jobFamily.errorTitle")
        );
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [locale, t]);

  const filteredRows = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return rows;

    return rows.filter((row) =>
      [
        row.code,
        row.name,
        row.description,
        row.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [query, rows]);

  const activeCount = rows.filter(
    (row) => row.status === "ACTIVE"
  ).length;

  const usedCount = rows.filter(
    (row) => Number(row.position_count) > 0
  ).length;

  function openCreate() {
    setEditingId(null);
    setForm(newForm());
    setFormError("");
    setFormLoading(false);
    setModalOpen(true);
  }

  async function openEdit(row: JobFamily) {
    setEditingId(row.id);
    setFormError("");
    setFormLoading(true);
    setModalOpen(true);

    try {
      const detail = await fetchJobFamilyDetail(
        row.id,
        locale
      );

      setForm({
        code: detail.code,
        status:
          detail.status === "INACTIVE"
            ? "INACTIVE"
            : "ACTIVE",
        sortOrder: String(detail.sort_order ?? 0),
        translations: {
          en: {
            name:
              detail.translations.en?.name ||
              detail.name ||
              "",
            description:
              detail.translations.en?.description ||
              detail.description ||
              "",
          },
          th: {
            name:
              detail.translations.th?.name || "",
            description:
              detail.translations.th?.description ||
              "",
          },
          lo: {
            name:
              detail.translations.lo?.name || "",
            description:
              detail.translations.lo?.description ||
              "",
          },
        },
      });
    } catch (loadError) {
      setFormError(
        loadError instanceof Error
          ? loadError.message
          : t("jobFamily.formLoadError")
      );
    } finally {
      setFormLoading(false);
    }
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setFormError("");
  }

  function setTranslation(
    language: Locale,
    field: keyof LocalizedForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [language]: {
          ...current.translations[language],
          [field]: value,
        },
      },
    }));
  }

  async function submitForm(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setFormError("");

    if (!form.code.trim()) {
      setFormError(t("jobFamily.validationCode"));
      return;
    }

    if (!form.translations.en.name.trim()) {
      setFormError(
        t("jobFamily.validationEnglishName")
      );
      return;
    }

    const payload: JobFamilyWritePayload = {
      code: form.code
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "-"),
      status: form.status,
      sort_order: Math.max(
        0,
        Number.parseInt(
          form.sortOrder || "0",
          10
        ) || 0
      ),
      translations: {
        en: {
          name: form.translations.en.name.trim(),
          description:
            form.translations.en.description.trim(),
        },
        th: {
          name: form.translations.th.name.trim(),
          description:
            form.translations.th.description.trim(),
        },
        lo: {
          name: form.translations.lo.name.trim(),
          description:
            form.translations.lo.description.trim(),
        },
      },
    };

    setSaving(true);

    try {
      if (editingId) {
        await updateJobFamily(
          editingId,
          payload
        );
      } else {
        await createJobFamily(payload);
      }

      await loadData();
      setModalOpen(false);
      setEditingId(null);
      setForm(newForm());
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : t("jobFamily.saveError")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <QBMSAppShell
      pageTitle={t("jobFamily.pageTitle")}
      pageDescription={t(
        "jobFamily.pageDescription"
      )}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={t(
        "jobFamily.searchPlaceholder"
      )}
    >
      <div className="qbms-breadcrumb">
        <Link href="/">
          {t("shell.modulesTools")}
        </Link>
        <span>›</span>
        <Link href="/organization">
          {t("organization.pageTitle")}
        </Link>
        <span>›</span>
        <Link href="/organization/positions">
          {t("position.pageTitle")}
        </Link>
        <span>›</span>
        <strong>{t("jobFamily.pageTitle")}</strong>
      </div>

      <section className="qbms-master-header">
        <div>
          <div className="qbms-eyebrow">
            {t("jobFamily.eyebrow")}
          </div>
          <h2>{t("jobFamily.pageTitle")}</h2>
          <p>{t("jobFamily.heroDescription")}</p>
        </div>

        <div className="qbms-master-header-actions">
          <button
            type="button"
            className="qbms-secondary-button"
            onClick={() => loadData(true)}
            disabled={refreshing}
          >
            <QBMSIcon
              name="refresh"
              size={16}
            />
            {refreshing
              ? t("common.refreshing")
              : t("common.refresh")}
          </button>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={openCreate}
          >
            <span>+</span>
            {t("jobFamily.add")}
          </button>
        </div>
      </section>

      <section className="qbms-master-stats">
        <div className="qbms-stat-card">
          <span>{t("jobFamily.total")}</span>
          <strong>{rows.length}</strong>
          <small>{t("jobFamily.totalHint")}</small>
        </div>

        <div className="qbms-stat-card">
          <span>{t("jobFamily.active")}</span>
          <strong>{activeCount}</strong>
          <small>{t("jobFamily.activeHint")}</small>
        </div>

        <div className="qbms-stat-card">
          <span>{t("jobFamily.inUse")}</span>
          <strong>{usedCount}</strong>
          <small>{t("jobFamily.inUseHint")}</small>
        </div>
      </section>

      <section className={styles.notice}>
        <span className={styles.noticeIcon}>
          <QBMSIcon
            name="network"
            size={18}
          />
        </span>
        <div>
          <strong>
            {t("jobFamily.noticeTitle")}
          </strong>
          <p>{t("jobFamily.noticeBody")}</p>
        </div>
      </section>

      <section className="qbms-master-panel">
        <div className="qbms-master-panel-heading">
          <div>
            <h3>{t("jobFamily.masterTitle")}</h3>
            <p>
              {t("jobFamily.masterDescription")}
            </p>
          </div>
          <span>
            {t("jobFamily.count", {
              shown: filteredRows.length,
              total: rows.length,
            })}
          </span>
        </div>

        {loading ? (
          <div className="qbms-loading-state">
            <span className="qbms-loading-spinner" />
            <strong>
              {t("jobFamily.loadingTitle")}
            </strong>
            <p>{t("jobFamily.loadingBody")}</p>
          </div>
        ) : error ? (
          <div className="qbms-error-state">
            <span className="qbms-error-icon">
              !
            </span>
            <div>
              <strong>
                {t("jobFamily.errorTitle")}
              </strong>
              <p>{error}</p>
              <small>
                {t("jobFamily.errorHint")}
              </small>
            </div>
            <button
              type="button"
              onClick={() => loadData()}
            >
              {t("common.tryAgain")}
            </button>
          </div>
        ) : filteredRows.length ? (
          <div className="qbms-table-wrap">
            <table
              className={`qbms-master-table ${styles.table}`}
            >
              <thead>
                <tr>
                  <th>{t("jobFamily.jobFamily")}</th>
                  <th>{t("common.code")}</th>
                  <th>{t("jobFamily.positions")}</th>
                  <th>{t("common.status")}</th>
                  <th>{t("common.order")}</th>
                  <th>{t("common.updated")}</th>
                  <th>{t("jobFamily.action")}</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="qbms-business-unit-cell">
                        <span className="qbms-business-unit-mark">
                          {row.name
                            .slice(0, 1)
                            .toUpperCase()}
                        </span>
                        <div>
                          <strong>{row.name}</strong>
                          <small>
                            {row.description ||
                              t(
                                "jobFamily.noDescription"
                              )}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="qbms-code-chip">
                        {row.code}
                      </span>
                    </td>

                    <td>
                      <div className={styles.positionCount}>
                        <strong>
                          {row.position_count}
                        </strong>
                        <small>
                          {t("jobFamily.positionsUnit")}
                        </small>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`qbms-status-pill ${
                          row.status === "ACTIVE"
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        <span />
                        {row.status === "ACTIVE"
                          ? t("common.active")
                          : t("common.inactive")}
                      </span>
                    </td>

                    <td>{row.sort_order}</td>

                    <td>
                      {new Date(
                        row.updated_at
                      ).toLocaleDateString(locale)}
                    </td>

                    <td>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => openEdit(row)}
                      >
                        {t("jobFamily.edit")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>
              <QBMSIcon
                name="briefcase"
                size={25}
              />
            </span>
            <strong>
              {t("jobFamily.emptyTitle")}
            </strong>
            <p>{t("jobFamily.emptyBody")}</p>
            <button
              type="button"
              className={styles.emptyButton}
              onClick={openCreate}
            >
              <span>+</span>
              {t("jobFamily.addFirst")}
            </button>
          </div>
        )}
      </section>

      <div className="qbms-page-footer-action">
        <Link
          href="/organization/positions"
          className="qbms-back-link"
        >
          <QBMSIcon
            name="arrowLeft"
            size={16}
          />
          {t("jobFamily.back")}
        </Link>
      </div>

      {modalOpen ? (
        <div
          className={styles.modalBackdrop}
          onMouseDown={closeModal}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-family-form-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className={styles.modalHeader}>
              <div>
                <span
                  className={styles.modalEyebrow}
                >
                  {t("jobFamily.formEyebrow")}
                </span>
                <h3 id="job-family-form-title">
                  {editingId
                    ? t("jobFamily.editTitle")
                    : t("jobFamily.addTitle")}
                </h3>
                <p>
                  {t("jobFamily.formDescription")}
                </p>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                onClick={closeModal}
                disabled={saving}
                aria-label={t("jobFamily.close")}
              >
                ×
              </button>
            </div>

            {formLoading ? (
              <div className={styles.formLoading}>
                <span className="qbms-loading-spinner" />
                <strong>
                  {t("jobFamily.loadingDetail")}
                </strong>
              </div>
            ) : (
              <form onSubmit={submitForm}>
                <div className={styles.modalBody}>
                  {formError ? (
                    <div
                      className={styles.formError}
                    >
                      <strong>
                        {t(
                          "jobFamily.checkInformation"
                        )}
                      </strong>
                      <span>{formError}</span>
                    </div>
                  ) : null}

                  <section
                    className={styles.formSection}
                  >
                    <div
                      className={
                        styles.formSectionHeading
                      }
                    >
                      <strong>
                        {t(
                          "jobFamily.basicInformation"
                        )}
                      </strong>
                      <span>
                        {t(
                          "jobFamily.basicInformationHint"
                        )}
                      </span>
                    </div>

                    <div className={styles.formGrid}>
                      <label className={styles.field}>
                        <span>
                          {t("jobFamily.code")}{" "}
                          <b>*</b>
                        </span>
                        <input
                          value={form.code}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              code: event.target.value.toUpperCase(),
                            }))
                          }
                          placeholder={t(
                            "jobFamily.codePlaceholder"
                          )}
                          autoFocus={!editingId}
                        />
                        <small>
                          {t("jobFamily.codeHint")}
                        </small>
                      </label>

                      <label className={styles.field}>
                        <span>
                          {t("common.status")}
                        </span>
                        <select
                          value={form.status}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              status:
                                event.target
                                  .value as
                                  | "ACTIVE"
                                  | "INACTIVE",
                            }))
                          }
                        >
                          <option value="ACTIVE">
                            {t("common.active")}
                          </option>
                          <option value="INACTIVE">
                            {t("common.inactive")}
                          </option>
                        </select>
                      </label>

                      <label className={styles.field}>
                        <span>
                          {t("common.order")}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={form.sortOrder}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              sortOrder:
                                event.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>
                  </section>

                  <section
                    className={styles.formSection}
                  >
                    <div
                      className={
                        styles.formSectionHeading
                      }
                    >
                      <strong>
                        {t(
                          "jobFamily.languageSection"
                        )}
                      </strong>
                      <span>
                        {t(
                          "jobFamily.languageSectionHint"
                        )}
                      </span>
                    </div>

                    {(
                      ["en", "th", "lo"] as Locale[]
                    ).map((language) => (
                      <div
                        key={language}
                        className={
                          styles.languageBlock
                        }
                      >
                        <div
                          className={
                            styles.languageTitle
                          }
                        >
                          <strong>
                            {t(
                              `jobFamily.language.${language}`
                            )}
                          </strong>
                          <span>
                            {language === "en"
                              ? t(
                                  "jobFamily.requiredSource"
                                )
                              : t(
                                  "jobFamily.optionalTranslation"
                                )}
                          </span>
                        </div>

                        <div
                          className={
                            styles.languageGrid
                          }
                        >
                          <label
                            className={styles.field}
                          >
                            <span>
                              {t("jobFamily.name")}
                              {language === "en"
                                ? " *"
                                : ""}
                            </span>
                            <input
                              value={
                                form.translations[
                                  language
                                ].name
                              }
                              onChange={(event) =>
                                setTranslation(
                                  language,
                                  "name",
                                  event.target.value
                                )
                              }
                              placeholder={t(
                                `jobFamily.namePlaceholder.${language}`
                              )}
                            />
                          </label>

                          <label
                            className={styles.field}
                          >
                            <span>
                              {t(
                                "common.description"
                              )}
                            </span>
                            <textarea
                              rows={2}
                              value={
                                form.translations[
                                  language
                                ].description
                              }
                              onChange={(event) =>
                                setTranslation(
                                  language,
                                  "description",
                                  event.target.value
                                )
                              }
                              placeholder={t(
                                `jobFamily.descriptionPlaceholder.${language}`
                              )}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </section>
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={closeModal}
                    disabled={saving}
                  >
                    {t("jobFamily.cancel")}
                  </button>

                  <button
                    type="submit"
                    className={styles.saveButton}
                    disabled={saving}
                  >
                    {saving
                      ? t("jobFamily.saving")
                      : editingId
                        ? t(
                            "jobFamily.saveChanges"
                          )
                        : t(
                            "jobFamily.create"
                          )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </QBMSAppShell>
  );
}
