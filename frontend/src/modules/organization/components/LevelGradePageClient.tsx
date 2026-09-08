"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QBMSAppShell, { QBMSIcon } from "@/components/layout/QBMSAppShell";
import { useI18n } from "@/i18n/useQBMSI18n";
import {
  fetchLevelGradeStructure,
  type JobLevel,
} from "@/modules/organization/api/organization.api";
import styles from "./LevelGradePage.module.css";

function levelLabel(level: JobLevel) {
  return level.description || level.code.replaceAll("_", " ");
}

export default function LevelGradePageClient() {
  const { locale, t } = useI18n();
  const [levels, setLevels] = useState<JobLevel[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetchLevelGradeStructure(locale, controller.signal)
      .then((data) => {
        setLevels(data);
        setError("");
      })
      .catch((loadError) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : t("levelGrade.errorTitle")
        );
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [locale, t]);

  const visibleLevels = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return levels;

    return levels
      .map((level) => {
        const levelMatches = [
          level.code,
          level.name,
          level.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(value);

        if (levelMatches) return level;

        const grades = level.grades.filter((grade) =>
          [
            `grade ${grade.grade_number}`,
            grade.name,
            grade.experience_requirement,
            grade.education_requirement,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(value)
        );

        return grades.length ? { ...level, grades } : null;
      })
      .filter((level): level is JobLevel => Boolean(level));
  }, [levels, query]);

  const gradeCount = levels.reduce(
    (total, level) => total + level.grades.length,
    0
  );

  const criteriaCount = levels.reduce(
    (total, level) =>
      total +
      level.grades.filter(
        (grade) =>
          grade.experience_requirement &&
          !["N/A", "ไม่ระบุ", "ບໍ່ລະບຸ"].includes(grade.experience_requirement)
      ).length,
    0
  );

  return (
    <QBMSAppShell
      pageTitle={t("levelGrade.pageTitle")}
      pageDescription={t("levelGrade.pageDescription")}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={t("levelGrade.searchPlaceholder")}
    >
      <div className="qbms-breadcrumb">
        <Link href="/">{t("shell.modulesTools")}</Link>
        <span>›</span>
        <Link href="/organization">{t("organization.pageTitle")}</Link>
        <span>›</span>
        <strong>{t("levelGrade.pageTitle")}</strong>
      </div>

      <section className={styles.hero}>
        <div>
          <div className="qbms-eyebrow">ORGANIZATION / LEVEL & GRADE</div>
          <h2>{t("levelGrade.heroTitle")}</h2>
          <p>{t("levelGrade.heroDescription")}</p>
        </div>

        <span className={styles.viewOnly}>{t("common.viewOnly")}</span>
      </section>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span>{t("levelGrade.jobLevels")}</span>
          <strong>{levels.length}</strong>
          <small>{t("levelGrade.jobLevelsHint")}</small>
        </div>
        <div className={styles.statCard}>
          <span>{t("levelGrade.jobGrades")}</span>
          <strong>{gradeCount}</strong>
          <small>{t("levelGrade.jobGradesHint")}</small>
        </div>
        <div className={styles.statCard}>
          <span>{t("levelGrade.criteriaGuidance")}</span>
          <strong>{criteriaCount}</strong>
          <small>{t("levelGrade.criteriaHint")}</small>
        </div>
      </section>

      <section className={styles.notice}>
        <span className={styles.noticeIcon}>
          <QBMSIcon name="check" size={17} />
        </span>
        <div>
          <strong>{t("levelGrade.noticeTitle")}</strong>
          <p>{t("levelGrade.noticeBody")}</p>
        </div>
      </section>

      {loading ? (
        <section className={styles.stateCard}>
          <span className={styles.spinner} />
          <strong>{t("levelGrade.loadingTitle")}</strong>
          <p>{t("levelGrade.loadingBody")}</p>
        </section>
      ) : error ? (
        <section className={`${styles.stateCard} ${styles.error}`}>
          <strong>{t("levelGrade.errorTitle")}</strong>
          <p>{error}</p>
          <small>{t("levelGrade.errorHint")}</small>
        </section>
      ) : visibleLevels.length ? (
        <div className={styles.levelList}>
          {visibleLevels.map((level) => (
            <section className={styles.levelCard} key={level.id}>
              <header className={styles.levelHeader}>
                <div className={styles.levelIdentity}>
                  <span className={styles.levelCode}>{levelLabel(level)}</span>
                  <div>
                    <h3>{level.name}</h3>
                    <p>
                      {level.grades.length === 1
                        ? t("levelGrade.jobGradeCountOne")
                        : t("levelGrade.jobGradeCount", {
                            count: level.grades.length,
                          })}
                    </p>
                  </div>
                </div>
                <span className={styles.activePill}>{t("common.active")}</span>
              </header>

              <div className={styles.gradeTableWrap}>
                <table className={styles.gradeTable}>
                  <thead>
                    <tr>
                      <th>{t("levelGrade.grade")}</th>
                      <th>{t("levelGrade.jobPositionGroup")}</th>
                      <th>{t("levelGrade.experience")}</th>
                      <th>{t("levelGrade.education")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {level.grades.map((grade) => (
                      <tr key={grade.id}>
                        <td>
                          <span className={styles.gradeBadge}>
                            {grade.grade_number}
                          </span>
                        </td>
                        <td>
                          <strong className={styles.gradeName}>
                            {grade.name}
                          </strong>
                        </td>
                        <td>
                          <span className={styles.criteriaText}>
                            {grade.experience_requirement || "-"}
                          </span>
                        </td>
                        <td>
                          <span className={styles.criteriaText}>
                            {grade.education_requirement || "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className={styles.stateCard}>
          <QBMSIcon name="search" size={24} />
          <strong>{t("levelGrade.emptyTitle")}</strong>
          <p>{t("levelGrade.emptyBody")}</p>
        </section>
      )}

      <div className="qbms-page-footer-action">
        <Link href="/organization" className="qbms-back-link">
          <QBMSIcon name="arrowLeft" size={16} />
          {t("levelGrade.back")}
        </Link>
      </div>
    </QBMSAppShell>
  );
}
