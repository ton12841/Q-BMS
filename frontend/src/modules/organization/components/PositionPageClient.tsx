
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
  createPosition,
  fetchJobFamilies,
  fetchLevelGradeStructure,
  fetchPositionDetail,
  fetchPositions,
  updatePosition,
  type JobFamily,
  type JobLevel,
  type Position,
  type PositionWritePayload,
} from "@/modules/organization/api/organization.api";
import styles from "./PositionPage.module.css";

type LocalizedForm = {
  name: string;
  description: string;
};

type PositionForm = {
  code: string;
  jobFamilyId: string;
  jobGradeIds: string[];
  status: "ACTIVE" | "INACTIVE";
  sortOrder: string;
  translations: Record<Locale, LocalizedForm>;
};

const EMPTY_FORM: PositionForm = {
  code: "",
  jobFamilyId: "",
  jobGradeIds: [],
  status: "ACTIVE",
  sortOrder: "0",
  translations: {
    en: {name: "", description: ""},
    th: {name: "", description: ""},
    lo: {name: "", description: ""},
  },
};

function newForm(): PositionForm {
  return {
    ...EMPTY_FORM,
    jobGradeIds: [],
    translations: {
      en: {...EMPTY_FORM.translations.en},
      th: {...EMPTY_FORM.translations.th},
      lo: {...EMPTY_FORM.translations.lo},
    },
  };
}

export default function PositionPageClient() {
  const {locale, t} = useI18n();

  const [families, setFamilies] =
    useState<JobFamily[]>([]);
  const [levels, setLevels] =
    useState<JobLevel[]>([]);
  const [rows, setRows] =
    useState<Position[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] =
    useState(false);
  const [editingId, setEditingId] =
    useState<string | null>(null);
  const [form, setForm] =
    useState<PositionForm>(newForm());
  const [formLoading, setFormLoading] =
    useState(false);
  const [formError, setFormError] =
    useState("");
  const [saving, setSaving] =
    useState(false);

  const activeFamilies = useMemo(
    () =>
      families.filter(
        (family) =>
          family.status === "ACTIVE"
      ),
    [families]
  );

  const activeLevels = useMemo(
    () =>
      levels
        .filter(
          (level) =>
            level.status === "ACTIVE"
        )
        .map((level) => ({
          ...level,
          grades: level.grades.filter(
            (grade) =>
              grade.status === "ACTIVE"
          ),
        })),
    [levels]
  );

  const loadData = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      try {
        const [
          familyRows,
          levelRows,
          positionRows,
        ] = await Promise.all([
          fetchJobFamilies(locale),
          fetchLevelGradeStructure(locale),
          fetchPositions(locale),
        ]);

        setFamilies(familyRows);
        setLevels(levelRows);
        setRows(positionRows);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : t("position.errorTitle")
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [locale, t]
  );

  useEffect(() => {
    const controller =
      new AbortController();

    setLoading(true);

    Promise.all([
      fetchJobFamilies(
        locale,
        controller.signal
      ),
      fetchLevelGradeStructure(
        locale,
        controller.signal
      ),
      fetchPositions(
        locale,
        controller.signal
      ),
    ])
      .then(
        ([
          familyRows,
          levelRows,
          positionRows,
        ]) => {
          setFamilies(familyRows);
          setLevels(levelRows);
          setRows(positionRows);
          setError("");
        }
      )
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
            : t("position.errorTitle")
        );
      })
      .finally(() =>
        setLoading(false)
      );

    return () => controller.abort();
  }, [locale, t]);

  const filteredFamilies = useMemo(() => {
    const value =
      query.trim().toLowerCase();

    if (!value) return families;

    return families.filter((family) =>
      [
        family.code,
        family.name,
        family.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [families, query]);

  const filteredRows = useMemo(() => {
    const value =
      query.trim().toLowerCase();

    if (!value) return rows;

    return rows.filter((row) =>
      [
        row.code,
        row.name,
        row.description,
        row.job_family_code,
        row.job_family_name,
        ...row.allowed_grades.flatMap(
          (grade) => [
            `grade ${grade.grade_number}`,
            grade.name,
            grade.job_level_code,
            grade.job_level_name,
          ]
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [query, rows]);

  const gradeMappingCount = rows.reduce(
    (sum, row) =>
      sum + row.allowed_grades.length,
    0
  );

  const selectedLevelNames = useMemo(() => {
    const selected =
      new Set(form.jobGradeIds);
    const names: string[] = [];

    activeLevels.forEach((level) => {
      if (
        level.grades.some((grade) =>
          selected.has(String(grade.id))
        )
      ) {
        names.push(level.name);
      }
    });

    return names;
  }, [
    activeLevels,
    form.jobGradeIds,
  ]);

  function levelCoverage(
    row: Position
  ) {
    const seen = new Set<string>();
    const labels: string[] = [];

    row.allowed_grades.forEach(
      (grade) => {
        const key = String(
          grade.job_level_id
        );

        if (!seen.has(key)) {
          seen.add(key);
          labels.push(
            grade.job_level_name
          );
        }
      }
    );

    return labels;
  }

  function openCreate() {
    setEditingId(null);
    setForm(newForm());
    setFormError("");
    setFormLoading(false);
    setModalOpen(true);
  }

  async function openEdit(
    row: Position
  ) {
    setEditingId(row.id);
    setFormError("");
    setFormLoading(true);
    setModalOpen(true);

    try {
      const detail =
        await fetchPositionDetail(
          row.id,
          locale
        );

      setForm({
        code: detail.code,
        jobFamilyId:
          detail.job_family_id
            ? String(
                detail.job_family_id
              )
            : "",
        jobGradeIds:
          detail.allowed_grades.map(
            (grade) =>
              String(grade.id)
          ),
        status:
          detail.status === "INACTIVE"
            ? "INACTIVE"
            : "ACTIVE",
        sortOrder: String(
          detail.sort_order ?? 0
        ),
        translations: {
          en: {
            name:
              detail.translations.en
                ?.name ||
              detail.name ||
              "",
            description:
              detail.translations.en
                ?.description ||
              detail.description ||
              "",
          },
          th: {
            name:
              detail.translations.th
                ?.name || "",
            description:
              detail.translations.th
                ?.description || "",
          },
          lo: {
            name:
              detail.translations.lo
                ?.name || "",
            description:
              detail.translations.lo
                ?.description || "",
          },
        },
      });
    } catch (loadError) {
      setFormError(
        loadError instanceof Error
          ? loadError.message
          : t(
              "position.formLoadError"
            )
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
          ...current.translations[
            language
          ],
          [field]: value,
        },
      },
    }));
  }

  function toggleGrade(
    gradeId: string
  ) {
    setForm((current) => {
      const selected = new Set(
        current.jobGradeIds
      );

      if (selected.has(gradeId)) {
        selected.delete(gradeId);
      } else {
        selected.add(gradeId);
      }

      return {
        ...current,
        jobGradeIds:
          Array.from(selected),
      };
    });
  }

  function toggleLevel(
    level: JobLevel
  ) {
    const gradeIds =
      level.grades
        .filter(
          (grade) =>
            grade.status === "ACTIVE"
        )
        .map((grade) =>
          String(grade.id)
        );

    setForm((current) => {
      const selected = new Set(
        current.jobGradeIds
      );

      const allSelected =
        gradeIds.every((id) =>
          selected.has(id)
        );

      gradeIds.forEach((id) => {
        if (allSelected) {
          selected.delete(id);
        } else {
          selected.add(id);
        }
      });

      return {
        ...current,
        jobGradeIds:
          Array.from(selected),
      };
    });
  }

  async function submitForm(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setFormError("");

    if (!form.code.trim()) {
      setFormError(
        t("position.validationCode")
      );
      return;
    }

    if (!form.jobFamilyId) {
      setFormError(
        t(
          "position.validationJobFamily"
        )
      );
      return;
    }

    if (!form.jobGradeIds.length) {
      setFormError(
        t("position.validationGrades")
      );
      return;
    }

    if (
      !form.translations.en.name.trim()
    ) {
      setFormError(
        t(
          "position.validationEnglishName"
        )
      );
      return;
    }

    const payload:
      PositionWritePayload = {
      code: form.code
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "-"),
      job_family_id:
        form.jobFamilyId,
      job_grade_ids:
        form.jobGradeIds,
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
          name:
            form.translations.en.name.trim(),
          description:
            form.translations.en.description.trim(),
        },
        th: {
          name:
            form.translations.th.name.trim(),
          description:
            form.translations.th.description.trim(),
        },
        lo: {
          name:
            form.translations.lo.name.trim(),
          description:
            form.translations.lo.description.trim(),
        },
      },
    };

    setSaving(true);

    try {
      if (editingId) {
        await updatePosition(
          editingId,
          payload
        );
      } else {
        await createPosition(payload);
      }

      await loadData();
      setModalOpen(false);
      setEditingId(null);
      setForm(newForm());
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : t("position.saveError")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <QBMSAppShell
      pageTitle={t("position.pageTitle")}
      pageDescription={t(
        "position.pageDescription"
      )}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={t(
        "position.searchPlaceholder"
      )}
    >
      <div className="qbms-breadcrumb">
        <Link href="/">
          {t("shell.modulesTools")}
        </Link>
        <span>›</span>
        <Link href="/organization">
          {t(
            "organization.pageTitle"
          )}
        </Link>
        <span>›</span>
        <strong>
          {t("position.pageTitle")}
        </strong>
      </div>

      <section className="qbms-master-header">
        <div>
          <div className="qbms-eyebrow">
            {t("position.eyebrow")}
          </div>
          <h2>
            {t("position.pageTitle")}
          </h2>
          <p>
            {t(
              "position.heroDescription"
            )}
          </p>
        </div>

        <div className="qbms-master-header-actions">
          <Link
            href="/organization/job-families"
            className={
              styles.manageFamilyButton
            }
          >
            <QBMSIcon
              name="briefcase"
              size={16}
            />
            {t(
              "position.manageJobFamilies"
            )}
          </Link>

          <button
            type="button"
            className={
              styles.primaryButton
            }
            onClick={openCreate}
          >
            <span>+</span>
            {t("position.add")}
          </button>

          <button
            type="button"
            className="qbms-secondary-button"
            onClick={() =>
              loadData(true)
            }
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
        </div>
      </section>

      <section className="qbms-master-stats">
        <div className="qbms-stat-card">
          <span>
            {t(
              "position.jobFamilies"
            )}
          </span>
          <strong>
            {families.length}
          </strong>
          <small>
            {t(
              "position.jobFamiliesHint"
            )}
          </small>
        </div>

        <div className="qbms-stat-card">
          <span>
            {t("position.total")}
          </span>
          <strong>{rows.length}</strong>
          <small>
            {t("position.masterHint")}
          </small>
        </div>

        <div className="qbms-stat-card">
          <span>
            {t(
              "position.gradeMappings"
            )}
          </span>
          <strong>
            {gradeMappingCount}
          </strong>
          <small>
            {t(
              "position.gradeMappingsHint"
            )}
          </small>
        </div>
      </section>

      <section
        className={styles.notice}
      >
        <span
          className={styles.noticeIcon}
        >
          <QBMSIcon
            name="network"
            size={18}
          />
        </span>
        <div>
          <strong>
            {t(
              "position.noticeTitle"
            )}
          </strong>
          <p>
            {t("position.noticeBody")}
          </p>
        </div>
      </section>

      {loading ? (
        <section className="qbms-master-panel">
          <div className="qbms-loading-state">
            <span className="qbms-loading-spinner" />
            <strong>
              {t(
                "position.loadingTitle"
              )}
            </strong>
            <p>
              {t(
                "position.loadingBody"
              )}
            </p>
          </div>
        </section>
      ) : error ? (
        <section className="qbms-master-panel">
          <div className="qbms-error-state">
            <span className="qbms-error-icon">
              !
            </span>
            <div>
              <strong>
                {t(
                  "position.errorTitle"
                )}
              </strong>
              <p>{error}</p>
              <small>
                {t(
                  "position.errorHint"
                )}
              </small>
            </div>
            <button
              type="button"
              onClick={() =>
                loadData()
              }
            >
              {t("common.tryAgain")}
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="qbms-master-panel">
            <div className="qbms-master-panel-heading">
              <div>
                <h3>
                  {t(
                    "position.jobFamilyTitle"
                  )}
                </h3>
                <p>
                  {t(
                    "position.jobFamilyDescription"
                  )}
                </p>
              </div>
              <span>
                {t(
                  "position.familyCount",
                  {
                    shown:
                      filteredFamilies.length,
                    total:
                      families.length,
                  }
                )}
              </span>
            </div>

            {filteredFamilies.length ? (
              <div
                className={
                  styles.familyGrid
                }
              >
                {filteredFamilies.map(
                  (family) => (
                    <article
                      className={
                        styles.familyCard
                      }
                      key={family.id}
                    >
                      <div
                        className={
                          styles.familyIcon
                        }
                      >
                        <QBMSIcon
                          name="briefcase"
                          size={19}
                        />
                      </div>

                      <div
                        className={
                          styles.familyCopy
                        }
                      >
                        <div
                          className={
                            styles.familyTitle
                          }
                        >
                          <strong>
                            {family.name}
                          </strong>
                          <span className="qbms-code-chip">
                            {family.code}
                          </span>
                        </div>

                        <p>
                          {family.description ||
                            t(
                              "position.jobFamily"
                            )}
                        </p>

                        <small>
                          {t(
                            "position.positionsInFamily",
                            {
                              count:
                                family.position_count,
                            }
                          )}
                        </small>
                      </div>
                    </article>
                  )
                )}
              </div>
            ) : (
              <div
                className={
                  styles.compactEmpty
                }
              >
                <span
                  className={
                    styles.emptyIcon
                  }
                >
                  <QBMSIcon
                    name="briefcase"
                    size={23}
                  />
                </span>

                <div>
                  <strong>
                    {t(
                      "position.familyEmptyTitle"
                    )}
                  </strong>
                  <p>
                    {t(
                      "position.familyEmptyBody"
                    )}
                  </p>
                  <Link
                    href="/organization/job-families"
                    className={
                      styles.inlineLink
                    }
                  >
                    {t(
                      "position.createJobFamilyFirst"
                    )}
                  </Link>
                </div>
              </div>
            )}
          </section>

          <section className="qbms-master-panel">
            <div className="qbms-master-panel-heading">
              <div>
                <h3>
                  {t(
                    "position.masterTitle"
                  )}
                </h3>
                <p>
                  {t(
                    "position.masterDescription"
                  )}
                </p>
              </div>
              <span>
                {t("position.count", {
                  shown:
                    filteredRows.length,
                  total: rows.length,
                })}
              </span>
            </div>

            {filteredRows.length ? (
              <div className="qbms-table-wrap">
                <table
                  className={`qbms-master-table ${styles.table}`}
                >
                  <thead>
                    <tr>
                      <th>
                        {t(
                          "position.position"
                        )}
                      </th>
                      <th>
                        {t("common.code")}
                      </th>
                      <th>
                        {t(
                          "position.jobFamily"
                        )}
                      </th>
                      <th>
                        {t(
                          "position.allowedGrades"
                        )}
                      </th>
                      <th>
                        {t(
                          "position.levelCoverage"
                        )}
                      </th>
                      <th>
                        {t(
                          "common.status"
                        )}
                      </th>
                      <th>
                        {t(
                          "position.action"
                        )}
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRows.map(
                      (row) => {
                        const coverage =
                          levelCoverage(
                            row
                          );

                        return (
                          <tr key={row.id}>
                            <td>
                              <div className="qbms-business-unit-cell">
                                <span className="qbms-business-unit-mark">
                                  {row.name
                                    .slice(0, 1)
                                    .toUpperCase()}
                                </span>

                                <div>
                                  <strong>
                                    {row.name}
                                  </strong>
                                  <small>
                                    {row.description ||
                                      t(
                                        "position.position"
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
                              {row.job_family_name ? (
                                <div
                                  className={
                                    styles.structureCell
                                  }
                                >
                                  <strong>
                                    {
                                      row.job_family_name
                                    }
                                  </strong>
                                  <small>
                                    {
                                      row.job_family_code
                                    }
                                  </small>
                                </div>
                              ) : (
                                <span
                                  className={
                                    styles.unassigned
                                  }
                                >
                                  {t(
                                    "position.unassigned"
                                  )}
                                </span>
                              )}
                            </td>

                            <td>
                              {row
                                .allowed_grades
                                .length ? (
                                <div
                                  className={
                                    styles.gradeChips
                                  }
                                >
                                  {row.allowed_grades.map(
                                    (
                                      grade
                                    ) => (
                                      <span
                                        className={
                                          styles.gradeBadge
                                        }
                                        key={
                                          grade.id
                                        }
                                        title={
                                          grade.name
                                        }
                                      >
                                        G
                                        {
                                          grade.grade_number
                                        }
                                      </span>
                                    )
                                  )}
                                </div>
                              ) : (
                                <span
                                  className={
                                    styles.unassigned
                                  }
                                >
                                  {t(
                                    "position.unassigned"
                                  )}
                                </span>
                              )}
                            </td>

                            <td>
                              {coverage.length ? (
                                <div
                                  className={
                                    styles.levelList
                                  }
                                >
                                  {coverage.map(
                                    (level) => (
                                      <span
                                        key={
                                          level
                                        }
                                      >
                                        {level}
                                      </span>
                                    )
                                  )}
                                </div>
                              ) : (
                                <span
                                  className={
                                    styles.unassigned
                                  }
                                >
                                  {t(
                                    "position.derivedFromGrades"
                                  )}
                                </span>
                              )}
                            </td>

                            <td>
                              <span
                                className={`qbms-status-pill ${
                                  row.status ===
                                  "ACTIVE"
                                    ? "active"
                                    : "inactive"
                                }`}
                              >
                                <span />
                                {row.status ===
                                "ACTIVE"
                                  ? t(
                                      "common.active"
                                    )
                                  : t(
                                      "common.inactive"
                                    )}
                              </span>
                            </td>

                            <td>
                              <button
                                type="button"
                                className={
                                  styles.editButton
                                }
                                onClick={() =>
                                  openEdit(
                                    row
                                  )
                                }
                              >
                                {t(
                                  "position.edit"
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className={
                  styles.emptyState
                }
              >
                <span
                  className={
                    styles.emptyIcon
                  }
                >
                  <QBMSIcon
                    name="briefcase"
                    size={25}
                  />
                </span>
                <strong>
                  {t(
                    "position.emptyTitle"
                  )}
                </strong>
                <p>
                  {t(
                    "position.emptyBody"
                  )}
                </p>
                <button
                  type="button"
                  className={
                    styles.emptyButton
                  }
                  onClick={openCreate}
                >
                  <span>+</span>
                  {t(
                    "position.addFirst"
                  )}
                </button>
              </div>
            )}
          </section>
        </>
      )}

      <div className="qbms-page-footer-action">
        <Link
          href="/organization"
          className="qbms-back-link"
        >
          <QBMSIcon
            name="arrowLeft"
            size={16}
          />
          {t("position.back")}
        </Link>
      </div>

      {modalOpen ? (
        <div
          className={
            styles.modalBackdrop
          }
          onMouseDown={closeModal}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="position-form-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div
              className={
                styles.modalHeader
              }
            >
              <div>
                <span
                  className={
                    styles.modalEyebrow
                  }
                >
                  {t(
                    "position.formEyebrow"
                  )}
                </span>

                <h3 id="position-form-title">
                  {editingId
                    ? t(
                        "position.editTitle"
                      )
                    : t(
                        "position.addTitle"
                      )}
                </h3>

                <p>
                  {t(
                    "position.formDescription"
                  )}
                </p>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                onClick={closeModal}
                disabled={saving}
                aria-label={t(
                  "position.close"
                )}
              >
                ×
              </button>
            </div>

            {formLoading ? (
              <div
                className={
                  styles.formLoading
                }
              >
                <span className="qbms-loading-spinner" />
                <strong>
                  {t(
                    "position.loadingDetail"
                  )}
                </strong>
              </div>
            ) : (
              <form
                onSubmit={submitForm}
              >
                <div
                  className={
                    styles.modalBody
                  }
                >
                  {formError ? (
                    <div
                      className={
                        styles.formError
                      }
                    >
                      <strong>
                        {t(
                          "position.checkInformation"
                        )}
                      </strong>
                      <span>
                        {formError}
                      </span>
                    </div>
                  ) : null}

                  {!activeFamilies.length ? (
                    <div
                      className={
                        styles.familyRequired
                      }
                    >
                      <div>
                        <strong>
                          {t(
                            "position.noFamilyFormTitle"
                          )}
                        </strong>
                        <p>
                          {t(
                            "position.noFamilyFormBody"
                          )}
                        </p>
                      </div>

                      <Link
                        href="/organization/job-families"
                        className={
                          styles.inlineLink
                        }
                      >
                        {t(
                          "position.manageJobFamilies"
                        )}
                      </Link>
                    </div>
                  ) : null}

                  <section
                    className={
                      styles.formSection
                    }
                  >
                    <div
                      className={
                        styles.formSectionHeading
                      }
                    >
                      <strong>
                        {t(
                          "position.basicInformation"
                        )}
                      </strong>
                      <span>
                        {t(
                          "position.basicInformationHint"
                        )}
                      </span>
                    </div>

                    <div
                      className={
                        styles.formGrid
                      }
                    >
                      <label
                        className={
                          styles.field
                        }
                      >
                        <span>
                          {t(
                            "position.positionCode"
                          )}{" "}
                          <b>*</b>
                        </span>

                        <input
                          value={
                            form.code
                          }
                          onChange={(
                            event
                          ) =>
                            setForm(
                              (
                                current
                              ) => ({
                                ...current,
                                code: event.target.value.toUpperCase(),
                              })
                            )
                          }
                          placeholder={t(
                            "position.codePlaceholder"
                          )}
                          autoFocus={
                            !editingId
                          }
                        />

                        <small>
                          {t(
                            "position.codeHint"
                          )}
                        </small>
                      </label>

                      <label
                        className={
                          styles.field
                        }
                      >
                        <span>
                          {t(
                            "position.jobFamily"
                          )}{" "}
                          <b>*</b>
                        </span>

                        <select
                          value={
                            form.jobFamilyId
                          }
                          onChange={(
                            event
                          ) =>
                            setForm(
                              (
                                current
                              ) => ({
                                ...current,
                                jobFamilyId:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                        >
                          <option value="">
                            {t(
                              "position.selectJobFamily"
                            )}
                          </option>

                          {activeFamilies.map(
                            (family) => (
                              <option
                                key={
                                  family.id
                                }
                                value={
                                  family.id
                                }
                              >
                                {
                                  family.code
                                }{" "}
                                —{" "}
                                {
                                  family.name
                                }
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      <label
                        className={
                          styles.field
                        }
                      >
                        <span>
                          {t(
                            "common.status"
                          )}
                        </span>

                        <select
                          value={
                            form.status
                          }
                          onChange={(
                            event
                          ) =>
                            setForm(
                              (
                                current
                              ) => ({
                                ...current,
                                status:
                                  event
                                    .target
                                    .value as
                                    | "ACTIVE"
                                    | "INACTIVE",
                              })
                            )
                          }
                        >
                          <option value="ACTIVE">
                            {t(
                              "common.active"
                            )}
                          </option>
                          <option value="INACTIVE">
                            {t(
                              "common.inactive"
                            )}
                          </option>
                        </select>
                      </label>

                      <label
                        className={
                          styles.field
                        }
                      >
                        <span>
                          {t(
                            "common.order"
                          )}
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={
                            form.sortOrder
                          }
                          onChange={(
                            event
                          ) =>
                            setForm(
                              (
                                current
                              ) => ({
                                ...current,
                                sortOrder:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                        />
                      </label>
                    </div>
                  </section>

                  <section
                    className={
                      styles.formSection
                    }
                  >
                    <div
                      className={
                        styles.formSectionHeading
                      }
                    >
                      <div>
                        <strong>
                          {t(
                            "position.allowedGrades"
                          )}
                        </strong>
                        <span
                          className={
                            styles.requiredText
                          }
                        >
                          *
                        </span>
                      </div>

                      <span>
                        {t(
                          "position.gradeSectionHint"
                        )}
                      </span>
                    </div>

                    <div
                      className={
                        styles.gradeSummary
                      }
                    >
                      <div>
                        <strong>
                          {
                            form
                              .jobGradeIds
                              .length
                          }
                        </strong>
                        <span>
                          {t(
                            "position.selectedGrades"
                          )}
                        </span>
                      </div>

                      <div>
                        <strong>
                          {
                            selectedLevelNames.length
                          }
                        </strong>
                        <span>
                          {t(
                            "position.coveredLevels"
                          )}
                        </span>
                      </div>

                      <p>
                        {selectedLevelNames.length
                          ? selectedLevelNames.join(
                              " · "
                            )
                          : t(
                              "position.noLevelSelected"
                            )}
                      </p>
                    </div>

                    <div
                      className={
                        styles.levelGradePicker
                      }
                    >
                      {activeLevels.map(
                        (level) => {
                          const gradeIds =
                            level.grades.map(
                              (
                                grade
                              ) =>
                                String(
                                  grade.id
                                )
                            );

                          const selectedCount =
                            gradeIds.filter(
                              (id) =>
                                form.jobGradeIds.includes(
                                  id
                                )
                            ).length;

                          const allSelected =
                            gradeIds.length >
                              0 &&
                            selectedCount ===
                              gradeIds.length;

                          return (
                            <article
                              key={
                                level.id
                              }
                              className={
                                styles.levelPickerCard
                              }
                            >
                              <div
                                className={
                                  styles.levelPickerHeader
                                }
                              >
                                <div>
                                  <strong>
                                    {
                                      level.name
                                    }
                                  </strong>
                                  <small>
                                    {
                                      level.code
                                    }
                                  </small>
                                </div>

                                <button
                                  type="button"
                                  className={
                                    styles.selectLevelButton
                                  }
                                  onClick={() =>
                                    toggleLevel(
                                      level
                                    )
                                  }
                                >
                                  {allSelected
                                    ? t(
                                        "position.clearLevel"
                                      )
                                    : t(
                                        "position.selectLevel"
                                      )}
                                </button>
                              </div>

                              <div
                                className={
                                  styles.gradeOptionList
                                }
                              >
                                {level.grades.map(
                                  (
                                    grade
                                  ) => {
                                    const gradeId =
                                      String(
                                        grade.id
                                      );
                                    const checked =
                                      form.jobGradeIds.includes(
                                        gradeId
                                      );

                                    return (
                                      <label
                                        key={
                                          grade.id
                                        }
                                        className={`${styles.gradeOption} ${
                                          checked
                                            ? styles.gradeOptionSelected
                                            : ""
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={
                                            checked
                                          }
                                          onChange={() =>
                                            toggleGrade(
                                              gradeId
                                            )
                                          }
                                        />

                                        <span
                                          className={
                                            styles.gradeNumber
                                          }
                                        >
                                          G
                                          {
                                            grade.grade_number
                                          }
                                        </span>

                                        <span
                                          className={
                                            styles.gradeOptionCopy
                                          }
                                        >
                                          <strong>
                                            {
                                              grade.name
                                            }
                                          </strong>
                                          <small>
                                            {grade.experience_requirement ||
                                              t(
                                                "position.gradeCriteria"
                                              )}
                                          </small>
                                        </span>
                                      </label>
                                    );
                                  }
                                )}
                              </div>
                            </article>
                          );
                        }
                      )}
                    </div>
                  </section>

                  <section
                    className={
                      styles.formSection
                    }
                  >
                    <div
                      className={
                        styles.formSectionHeading
                      }
                    >
                      <strong>
                        {t(
                          "position.languageSection"
                        )}
                      </strong>
                      <span>
                        {t(
                          "position.languageSectionHint"
                        )}
                      </span>
                    </div>

                    {(
                      [
                        "en",
                        "th",
                        "lo",
                      ] as Locale[]
                    ).map(
                      (language) => (
                        <div
                          key={
                            language
                          }
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
                                `position.language.${language}`
                              )}
                            </strong>
                            <span>
                              {language ===
                              "en"
                                ? t(
                                    "position.requiredSource"
                                  )
                                : t(
                                    "position.optionalTranslation"
                                  )}
                            </span>
                          </div>

                          <div
                            className={
                              styles.languageGrid
                            }
                          >
                            <label
                              className={
                                styles.field
                              }
                            >
                              <span>
                                {t(
                                  "position.positionName"
                                )}
                                {language ===
                                "en"
                                  ? " *"
                                  : ""}
                              </span>

                              <input
                                value={
                                  form
                                    .translations[
                                    language
                                  ].name
                                }
                                onChange={(
                                  event
                                ) =>
                                  setTranslation(
                                    language,
                                    "name",
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder={t(
                                  `position.namePlaceholder.${language}`
                                )}
                              />
                            </label>

                            <label
                              className={
                                styles.field
                              }
                            >
                              <span>
                                {t(
                                  "common.description"
                                )}
                              </span>

                              <textarea
                                rows={2}
                                value={
                                  form
                                    .translations[
                                    language
                                  ]
                                    .description
                                }
                                onChange={(
                                  event
                                ) =>
                                  setTranslation(
                                    language,
                                    "description",
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder={t(
                                  `position.descriptionPlaceholder.${language}`
                                )}
                              />
                            </label>
                          </div>
                        </div>
                      )
                    )}
                  </section>
                </div>

                <div
                  className={
                    styles.modalFooter
                  }
                >
                  <button
                    type="button"
                    className={
                      styles.cancelButton
                    }
                    onClick={closeModal}
                    disabled={saving}
                  >
                    {t(
                      "position.cancel"
                    )}
                  </button>

                  <button
                    type="submit"
                    className={
                      styles.saveButton
                    }
                    disabled={
                      saving ||
                      !activeFamilies.length
                    }
                  >
                    {saving
                      ? t(
                          "position.saving"
                        )
                      : editingId
                        ? t(
                            "position.saveChanges"
                          )
                        : t(
                            "position.create"
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
