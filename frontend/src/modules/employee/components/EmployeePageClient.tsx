"use client";

import Link from "next/link";
import {useCallback, useEffect, useMemo, useState} from "react";
import QBMSAppShell, {QBMSIcon} from "@/components/layout/QBMSAppShell";
import {useI18n} from "@/i18n/useQBMSI18n";
import {
  fetchBusinessUnits,
  fetchPositions,
  type BusinessUnit,
  type Position,
  type PositionAllowedGrade,
} from "@/modules/organization/api/organization.api";
import {
  createEmployee,
  fetchEmployeeDetail,
  fetchEmployees,
  updateEmployee,
  type Employee,
  type EmployeeWritePayload,
} from "@/modules/employee/api/employee.api";
import styles from "./EmployeePage.module.css";
import polish from "./EmployeeHeaderPolish.module.css";

type EmployeeForm = {
  employeeCode: string;
  firstName: string;
  lastName: string;
  nickname: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
  workLocation: string;
  startDate: string;
  probationDays: string;
  probationEndDate: string;
  contractEndDate: string;
  hrNote: string;
  businessUnitId: string;
  positionId: string;
  jobGradeId: string;
  assignmentEffectiveFrom: string;
};

const EMPTY_FORM: EmployeeForm = {
  employeeCode: "",
  firstName: "",
  lastName: "",
  nickname: "",
  employmentType: "FULL_TIME",
  workLocation: "",
  startDate: "",
  probationDays: "",
  probationEndDate: "",
  contractEndDate: "",
  hrNote: "",
  businessUnitId: "",
  positionId: "",
  jobGradeId: "",
  assignmentEffectiveFrom: "",
};

function newForm(): EmployeeForm {
  return {...EMPTY_FORM};
}

function displayName(employee: Employee) {
  const fullName = [employee.first_name, employee.last_name]
    .filter(Boolean)
    .join(" ");
  return employee.nickname ? `${fullName} (${employee.nickname})` : fullName;
}

function setupStatusClass(status: Employee["account_setup_status"]) {
  if (status === "COMPLETED") return styles.setupCompleted;
  if (status === "CANCELLED") return styles.setupCancelled;
  return styles.setupPending;
}

export default function EmployeePageClient() {
  const {locale, t} = useI18n();

  const [rows, setRows] = useState<Employee[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(newForm());
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const activeBusinessUnits = useMemo(
    () => businessUnits.filter((item) => item.status === "ACTIVE"),
    [businessUnits]
  );

  const activePositions = useMemo(
    () => positions.filter((item) => item.status === "ACTIVE"),
    [positions]
  );

  const selectedPosition = activePositions.find(
    (position) => String(position.id) === form.positionId
  );

  const allowedGrades: PositionAllowedGrade[] = selectedPosition?.allowed_grades || [];
  const selectedGrade = allowedGrades.find(
    (grade) => String(grade.id) === form.jobGradeId
  );

  const organizationAssignmentLocked =
    Boolean(editingId && editingEmployee?.employee_status === "ACTIVE");

  const loadData = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const [employeeRows, unitRows, positionRows] = await Promise.all([
          fetchEmployees(locale),
          fetchBusinessUnits(locale),
          fetchPositions(locale),
        ]);
        setRows(employeeRows);
        setBusinessUnits(unitRows);
        setPositions(positionRows);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : t("employee.errorTitle"));
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

    Promise.all([
      fetchEmployees(locale, controller.signal),
      fetchBusinessUnits(locale, controller.signal),
      fetchPositions(locale, controller.signal),
    ])
      .then(([employeeRows, unitRows, positionRows]) => {
        setRows(employeeRows);
        setBusinessUnits(unitRows);
        setPositions(positionRows);
        setError("");
      })
      .catch((loadError) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : t("employee.errorTitle"));
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [locale, t]);

  const filteredRows = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return rows;

    return rows.filter((employee) =>
      [
        employee.employee_code,
        employee.company_email,
        employee.first_name,
        employee.last_name,
        employee.nickname,
        employee.business_unit_code,
        employee.business_unit_name,
        employee.position_code,
        employee.position_name,
        employee.grade_number ? `grade ${employee.grade_number}` : "",
        employee.job_grade_name,
        employee.job_level_name,
        employee.employment_type,
        employee.employee_status,
        employee.account_setup_status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [query, rows]);

  const activeCount = rows.filter((row) => row.employee_status === "ACTIVE").length;
  const waitingItCount = rows.filter(
    (row) => row.account_setup_status === "PENDING" || row.account_setup_status === "IN_PROGRESS"
  ).length;

  function openCreate() {
    setEditingId(null);
    setEditingEmployee(null);
    setForm(newForm());
    setFormError("");
    setFormLoading(false);
    setModalOpen(true);
  }

  async function openEdit(employee: Employee) {
    setEditingId(employee.id);
    setEditingEmployee(employee);
    setFormError("");
    setFormLoading(true);
    setModalOpen(true);

    try {
      const detail = await fetchEmployeeDetail(employee.id, locale);
      setEditingEmployee(detail);
      setForm({
        employeeCode: detail.employee_code || "",
        firstName: detail.first_name || "",
        lastName: detail.last_name || "",
        nickname: detail.nickname || "",
        employmentType: (detail.employment_type || "FULL_TIME") as EmployeeForm["employmentType"],
        workLocation: detail.work_location || "",
        startDate: detail.start_date?.slice(0, 10) || "",
        probationDays:
          detail.probation_days === null || detail.probation_days === undefined
            ? ""
            : String(detail.probation_days),
        probationEndDate: detail.probation_end_date?.slice(0, 10) || "",
        contractEndDate: detail.contract_end_date?.slice(0, 10) || "",
        hrNote: detail.hr_note || "",
        businessUnitId: detail.business_unit_id ? String(detail.business_unit_id) : "",
        positionId: detail.position_id ? String(detail.position_id) : "",
        jobGradeId: detail.job_grade_id ? String(detail.job_grade_id) : "",
        assignmentEffectiveFrom:
          detail.effective_from?.slice(0, 10) || detail.start_date?.slice(0, 10) || "",
      });
    } catch (loadError) {
      setFormError(loadError instanceof Error ? loadError.message : t("employee.formLoadError"));
    } finally {
      setFormLoading(false);
    }
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setEditingEmployee(null);
    setFormError("");
  }

  function changePosition(positionId: string) {
    setForm((current) => ({...current, positionId, jobGradeId: ""}));
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!form.employeeCode.trim()) {
      setFormError(t("employee.validationEmployeeCode"));
      return;
    }
    if (!form.firstName.trim()) {
      setFormError(t("employee.validationFirstName"));
      return;
    }
    if (!form.lastName.trim()) {
      setFormError(t("employee.validationLastName"));
      return;
    }
    if (!form.businessUnitId) {
      setFormError(t("employee.validationBusinessUnit"));
      return;
    }
    if (!form.positionId) {
      setFormError(t("employee.validationPosition"));
      return;
    }
    if (!form.jobGradeId) {
      setFormError(t("employee.validationGrade"));
      return;
    }

    const probationDays = form.probationDays.trim()
      ? Math.max(0, Number.parseInt(form.probationDays, 10) || 0)
      : null;

    const payload: EmployeeWritePayload = {
      employee_code: form.employeeCode.trim().toUpperCase(),
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      nickname: form.nickname.trim(),
      employment_type: form.employmentType,
      work_location: form.workLocation.trim(),
      start_date: form.startDate,
      probation_days: probationDays,
      probation_end_date: form.probationEndDate,
      contract_end_date: form.contractEndDate,
      hr_note: form.hrNote.trim(),
      business_unit_id: form.businessUnitId,
      position_id: form.positionId,
      job_grade_id: form.jobGradeId,
      assignment_effective_from: form.assignmentEffectiveFrom || form.startDate,
    };

    setSaving(true);
    try {
      if (editingId) await updateEmployee(editingId, payload);
      else await createEmployee(payload);

      await loadData();
      setModalOpen(false);
      setEditingId(null);
      setEditingEmployee(null);
      setForm(newForm());
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : t("employee.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <QBMSAppShell
      pageTitle={t("employee.pageTitle")}
      pageDescription={t("employee.pageDescription")}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={t("employee.searchPlaceholder")}
    >
      <div className="qbms-breadcrumb">
        <Link href="/">{t("shell.modulesTools")}</Link>
        <span>›</span>
        <strong>{t("employee.pageTitle")}</strong>
      </div>

      <section className="qbms-master-header">
        <div>
          <div className="qbms-eyebrow">{t("employee.eyebrow")}</div>
          <h2>{t("employee.heroTitle")}</h2>
          <p>{t("employee.heroDescription")}</p>
        </div>

        <div className={`${polish.headerActions} qbms-master-header-actions`}>
          <details className={polish.workflowMenu}>
            <summary className={polish.workflowTrigger}>
              <QBMSIcon name="network" size={16} />
              <span>Onboarding</span>
              <QBMSIcon name="chevron" size={14} />
            </summary>
            <div className={polish.workflowPanel}>
              <div className={polish.workflowHeading}>
                <strong>Employee Onboarding</strong>
                <span>Workflow shortcuts</span>
              </div>
              <Link href="/it-admin/account-setup" className={polish.workflowItem}>
                <span className={polish.workflowIcon}><QBMSIcon name="network" size={16} /></span>
                <span><strong>{t("employee.openItQueue")}</strong><small>Company account setup</small></span>
              </Link>
              <Link href="/hrm/invitations" className={polish.workflowItem}>
                <span className={polish.workflowIcon}><QBMSIcon name="bell" size={16} /></span>
                <span><strong>{t("employee.openInvitationCenter")}</strong><small>Employee activation links</small></span>
              </Link>
              <Link href="/hrm/onboarding-review" className={polish.workflowItem}>
                <span className={polish.workflowIcon}><QBMSIcon name="check" size={16} /></span>
                <span><strong>HR Review</strong><small>Review submitted profiles</small></span>
              </Link>
              <Link href="/hrm/asset-gate" className={polish.workflowItem}>
                <span className={polish.workflowIcon}><QBMSIcon name="box" size={16} /></span>
                <span><strong>Asset Gate</strong><small>Assign or waive assets</small></span>
              </Link>
              <Link href="/hrm/activation" className={polish.workflowItem}>
                <span className={polish.workflowIcon}><QBMSIcon name="shield" size={16} /></span>
                <span><strong>Activation</strong><small>Final readiness and activation</small></span>
              </Link>
              <Link href="/qa/onboarding-e2e" className={`${polish.workflowItem} ${polish.qaItem}`}>
                <span className={polish.workflowIcon}><QBMSIcon name="check" size={16} /></span>
                <span><strong>Onboarding QA</strong><small>Read-only end-to-end verification</small></span>
              </Link>
            </div>
          </details>

          <button
            type="button"
            className={polish.refreshButton}
            onClick={() => loadData(true)}
            disabled={refreshing}
            aria-label={refreshing ? t("common.refreshing") : t("common.refresh")}
            title={refreshing ? t("common.refreshing") : t("common.refresh")}
          >
            <QBMSIcon name="refresh" size={17} />
          </button>

          <button type="button" className={`${styles.primaryButton} ${polish.primaryAction}`} onClick={openCreate}>
            <span className={polish.plus}>+</span>
            {t("employee.add")}
          </button>
        </div>
      </section>

      <section className="qbms-master-stats">
        <div className="qbms-stat-card">
          <span>{t("employee.total")}</span>
          <strong>{rows.length}</strong>
          <small>{t("employee.totalHint")}</small>
        </div>
        <div className="qbms-stat-card">
          <span>{t("employee.active")}</span>
          <strong>{activeCount}</strong>
          <small>{t("employee.activeHint")}</small>
        </div>
        <div className="qbms-stat-card">
          <span>{t("employee.waitingIt")}</span>
          <strong>{waitingItCount}</strong>
          <small>{t("employee.waitingItHint")}</small>
        </div>
      </section>

      <section className={styles.notice}>
        <span className={styles.noticeIcon}>
          <QBMSIcon name="network" size={18} />
        </span>
        <div>
          <strong>{t("employee.noticeTitle")}</strong>
          <p>{t("employee.noticeBody")}</p>
        </div>
      </section>

      <section className="qbms-master-panel">
        <div className="qbms-master-panel-heading">
          <div>
            <h3>{t("employee.masterTitle")}</h3>
            <p>{t("employee.masterDescription")}</p>
          </div>
          <span>{t("employee.count", {shown: filteredRows.length, total: rows.length})}</span>
        </div>

        {loading ? (
          <div className="qbms-loading-state">
            <span className="qbms-loading-spinner" />
            <strong>{t("employee.loadingTitle")}</strong>
            <p>{t("employee.loadingBody")}</p>
          </div>
        ) : error ? (
          <div className="qbms-error-state">
            <span className="qbms-error-icon">!</span>
            <div>
              <strong>{t("employee.errorTitle")}</strong>
              <p>{error}</p>
              <small>{t("employee.errorHint")}</small>
            </div>
            <button type="button" onClick={() => loadData()}>{t("common.tryAgain")}</button>
          </div>
        ) : filteredRows.length ? (
          <div className="qbms-table-wrap">
            <table className={`qbms-master-table ${styles.table}`}>
              <thead>
                <tr>
                  <th>{t("employee.employee")}</th>
                  <th>{t("employee.employeeCode")}</th>
                  <th>{t("employee.businessUnit")}</th>
                  <th>{t("employee.position")}</th>
                  <th>{t("employee.gradeLevel")}</th>
                  <th>{t("employee.employment")}</th>
                  <th>{t("employee.onboarding")}</th>
                  <th>{t("employee.action")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <div className="qbms-business-unit-cell">
                        <span className="qbms-business-unit-mark">
                          {employee.first_name.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <strong>{displayName(employee)}</strong>
                          <small>{employee.company_email || t("employee.waitingCompanyEmail")}</small>
                        </div>
                      </div>
                    </td>
                    <td><span className="qbms-code-chip">{employee.employee_code}</span></td>
                    <td>
                      {employee.business_unit_name ? (
                        <div className={styles.structureCell}>
                          <strong>{employee.business_unit_name}</strong>
                          <small>{employee.business_unit_code}</small>
                        </div>
                      ) : <span className={styles.unassigned}>{t("employee.unassigned")}</span>}
                    </td>
                    <td>
                      {employee.position_name ? (
                        <div className={styles.structureCell}>
                          <strong>{employee.position_name}</strong>
                          <small>{employee.position_code}</small>
                        </div>
                      ) : <span className={styles.unassigned}>{t("employee.unassigned")}</span>}
                    </td>
                    <td>
                      {employee.grade_number ? (
                        <div className={styles.gradeCell}>
                          <span className={styles.gradeBadge}>G{employee.grade_number}</span>
                          <div>
                            <strong>{employee.job_level_name}</strong>
                            <small>{employee.job_grade_name}</small>
                          </div>
                        </div>
                      ) : <span className={styles.unassigned}>{t("employee.unassigned")}</span>}
                    </td>
                    <td>
                      <div className={styles.structureCell}>
                        <strong>{t(`employee.employmentType.${employee.employment_type || "FULL_TIME"}`)}</strong>
                        <small>
                          {employee.start_date
                            ? new Date(employee.start_date).toLocaleDateString(locale)
                            : t("employee.noStartDate")}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className={styles.workflowCell}>
                        <span
                          className={`${styles.employeeStatus} ${
                            employee.employee_status === "ACTIVE"
                              ? styles.statusActive
                              : employee.employee_status === "INACTIVE"
                                ? styles.statusInactive
                                : styles.statusProgress
                          }`}
                        >
                          {t(`employee.status.${employee.employee_status}`)}
                        </span>
                        {employee.account_setup_status ? (
                          <small className={`${styles.setupStatus} ${setupStatusClass(employee.account_setup_status)}`}>
                            {t("employee.itAccountShort")}: {t(`employee.accountSetupStatus.${employee.account_setup_status}`)}
                          </small>
                        ) : (
                          <small className={styles.mutedWorkflow}>{t("employee.noItSetupRequest")}</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <Link
                          href={`/employee/${employee.id}/organization-assignment`}
                          className={styles.organizationButton}
                        >
                          {t("employee.organizationAssignment")}
                        </Link>
                        <button type="button" className={styles.editButton} onClick={() => openEdit(employee)}>
                          {t("employee.edit")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}><QBMSIcon name="users" size={25} /></span>
            <strong>{t("employee.emptyTitle")}</strong>
            <p>{t("employee.emptyBody")}</p>
            <button type="button" className={styles.emptyButton} onClick={openCreate}>
              <span>+</span>
              {t("employee.addFirst")}
            </button>
          </div>
        )}
      </section>

      <div className="qbms-page-footer-action">
        <Link href="/" className="qbms-back-link">
          <QBMSIcon name="arrowLeft" size={16} />
          {t("employee.back")}
        </Link>
      </div>

      {modalOpen ? (
        <div className={styles.modalBackdrop} onMouseDown={closeModal}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-form-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalEyebrow}>{t("employee.formEyebrow")}</span>
                <h3 id="employee-form-title">
                  {editingId ? t("employee.editTitle") : t("employee.addTitle")}
                </h3>
                <p>{editingId ? t("employee.editDescription") : t("employee.formDescription")}</p>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={closeModal}
                disabled={saving}
                aria-label={t("employee.close")}
              >
                ×
              </button>
            </div>

            {formLoading ? (
              <div className={styles.formLoading}>
                <span className="qbms-loading-spinner" />
                <strong>{t("employee.loadingDetail")}</strong>
              </div>
            ) : (
              <form onSubmit={submitForm}>
                <div className={styles.modalBody}>
                  {formError ? (
                    <div className={styles.formError}>
                      <strong>{t("employee.checkInformation")}</strong>
                      <span>{formError}</span>
                    </div>
                  ) : null}

                  <section className={styles.workflowBanner}>
                    <div className={styles.workflowBannerIcon}>
                      <QBMSIcon name="users" size={19} />
                    </div>
                    <div className={styles.workflowBannerContent}>
                      <strong>{editingId ? t("employee.workflowManagedTitle") : t("employee.newEmployeeWorkflowTitle")}</strong>
                      <p>{editingId ? t("employee.workflowManagedBody") : t("employee.newEmployeeWorkflowBody")}</p>
                      <div className={styles.workflowFacts}>
                        <span>
                          <b>{t("employee.employeeStatus")}:</b>{" "}
                          {editingEmployee
                            ? t(`employee.status.${editingEmployee.employee_status}`)
                            : t("employee.status.PRE_ONBOARDING")}
                        </span>
                        <span>
                          <b>{t("employee.recordType")}:</b>{" "}
                          {editingEmployee
                            ? t(`employee.recordTypeOption.${editingEmployee.employee_record_type}`)
                            : t("employee.recordTypeOption.NEW_HIRE")}
                        </span>
                        <span>
                          <b>{t("employee.companyEmail")}:</b>{" "}
                          {editingEmployee?.company_email || t("employee.waitingForItSetup")}
                        </span>
                        <span>
                          <b>{t("employee.itAccountSetup")}:</b>{" "}
                          {editingEmployee?.account_setup_status
                            ? t(`employee.accountSetupStatus.${editingEmployee.account_setup_status}`)
                            : editingId
                              ? t("employee.notAvailable")
                              : t("employee.createdAutomatically")}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className={styles.formSection}>
                    <div className={styles.formSectionHeading}>
                      <strong>{t("employee.personalSection")}</strong>
                      <span>{t("employee.personalSectionHint")}</span>
                    </div>
                    <div className={styles.formGrid}>
                      <label className={styles.field}>
                        <span>{t("employee.employeeCode")} <b>*</b></span>
                        <input
                          value={form.employeeCode}
                          onChange={(event) => setForm((current) => ({
                            ...current,
                            employeeCode: event.target.value.toUpperCase(),
                          }))}
                          placeholder="EMP001"
                          autoFocus={!editingId}
                        />
                      </label>
                      <label className={styles.field}>
                        <span>{t("employee.firstName")} <b>*</b></span>
                        <input
                          value={form.firstName}
                          onChange={(event) => setForm((current) => ({...current, firstName: event.target.value}))}
                        />
                      </label>
                      <label className={styles.field}>
                        <span>{t("employee.lastName")} <b>*</b></span>
                        <input
                          value={form.lastName}
                          onChange={(event) => setForm((current) => ({...current, lastName: event.target.value}))}
                        />
                      </label>
                      <label className={styles.field}>
                        <span>{t("employee.nickname")}</span>
                        <input
                          value={form.nickname}
                          onChange={(event) => setForm((current) => ({...current, nickname: event.target.value}))}
                        />
                      </label>
                    </div>
                  </section>

                  <section className={styles.formSection}>
                    <div className={styles.formSectionHeading}>
                      <strong>{t("employee.assignmentSection")}</strong>
                      <span>{t("employee.assignmentSectionHint")}</span>
                    </div>
                    <div className={styles.formGrid}>
                      <label className={styles.field}>
                        <span>{t("employee.businessUnit")} <b>*</b></span>
                        <select
                          value={form.businessUnitId}
                          onChange={(event) => setForm((current) => ({...current, businessUnitId: event.target.value}))}
                          disabled={organizationAssignmentLocked}
                        >
                          <option value="">{t("employee.selectBusinessUnit")}</option>
                          {activeBusinessUnits.map((unit) => (
                            <option key={unit.id} value={unit.id}>{unit.code} — {unit.name}</option>
                          ))}
                        </select>
                      </label>

                      <label className={styles.field}>
                        <span>{t("employee.position")} <b>*</b></span>
                        <select
                          value={form.positionId}
                          onChange={(event) => changePosition(event.target.value)}
                          disabled={organizationAssignmentLocked}
                        >
                          <option value="">{t("employee.selectPosition")}</option>
                          {activePositions.map((position) => (
                            <option key={position.id} value={position.id}>{position.name} — {position.code}</option>
                          ))}
                        </select>
                      </label>

                      <label className={styles.field}>
                        <span>{t("employee.jobGrade")} <b>*</b></span>
                        <select
                          value={form.jobGradeId}
                          onChange={(event) => setForm((current) => ({...current, jobGradeId: event.target.value}))}
                          disabled={!selectedPosition || organizationAssignmentLocked}
                        >
                          <option value="">
                            {selectedPosition ? t("employee.selectGrade") : t("employee.selectPositionFirst")}
                          </option>
                          {allowedGrades.map((grade) => (
                            <option key={grade.id} value={grade.id}>Grade {grade.grade_number} — {grade.name}</option>
                          ))}
                        </select>
                      </label>

                      <div className={styles.derivedField}>
                        <span>{t("employee.jobLevel")}</span>
                        <div>
                          {selectedGrade ? (
                            <>
                              <strong>{selectedGrade.job_level_name}</strong>
                              <small>{t("employee.derivedFromGrade", {grade: selectedGrade.grade_number})}</small>
                            </>
                          ) : <small>{t("employee.levelAuto")}</small>}
                        </div>
                      </div>

                      <label className={styles.field}>
                        <span>{t("employee.assignmentEffectiveFrom")}</span>
                        <input
                          type="date"
                          value={form.assignmentEffectiveFrom}
                          onChange={(event) => setForm((current) => ({...current, assignmentEffectiveFrom: event.target.value}))}
                          disabled={organizationAssignmentLocked}
                        />
                      </label>
                    </div>
                    {organizationAssignmentLocked && editingId ? (
                      <div className={styles.assignmentLockNote}>
                        <QBMSIcon name="lock" size={15} />
                        <span>{t("employee.activeAssignmentLocked")}</span>
                        <Link href={`/employee/${editingId}/organization-assignment`}>
                          {t("employee.manageOrganizationAssignment")}
                        </Link>
                      </div>
                    ) : null}
                    <p className={styles.holdNote}>{t("employee.departmentHoldNote")}</p>
                  </section>

                  <section className={styles.formSection}>
                    <div className={styles.formSectionHeading}>
                      <strong>{t("employee.employmentSection")}</strong>
                      <span>{t("employee.employmentSectionHint")}</span>
                    </div>
                    <div className={styles.formGrid}>
                      <label className={styles.field}>
                        <span>{t("employee.employmentTypeLabel")}</span>
                        <select
                          value={form.employmentType}
                          onChange={(event) => setForm((current) => ({
                            ...current,
                            employmentType: event.target.value as EmployeeForm["employmentType"],
                          }))}
                        >
                          <option value="FULL_TIME">{t("employee.employmentType.FULL_TIME")}</option>
                          <option value="PART_TIME">{t("employee.employmentType.PART_TIME")}</option>
                          <option value="CONTRACT">{t("employee.employmentType.CONTRACT")}</option>
                          <option value="INTERN">{t("employee.employmentType.INTERN")}</option>
                        </select>
                      </label>
                      <label className={styles.field}>
                        <span>{t("employee.startDate")}</span>
                        <input
                          type="date"
                          value={form.startDate}
                          onChange={(event) => setForm((current) => ({...current, startDate: event.target.value}))}
                        />
                      </label>
                      <label className={styles.field}>
                        <span>{t("employee.workLocation")}</span>
                        <input
                          value={form.workLocation}
                          onChange={(event) => setForm((current) => ({...current, workLocation: event.target.value}))}
                        />
                      </label>
                      <label className={styles.field}>
                        <span>{t("employee.probationDays")}</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={form.probationDays}
                          onChange={(event) => setForm((current) => ({...current, probationDays: event.target.value}))}
                        />
                      </label>
                      <label className={styles.field}>
                        <span>{t("employee.probationEndDate")}</span>
                        <input
                          type="date"
                          value={form.probationEndDate}
                          onChange={(event) => setForm((current) => ({...current, probationEndDate: event.target.value}))}
                        />
                      </label>
                      <label className={styles.field}>
                        <span>{t("employee.contractEndDate")}</span>
                        <input
                          type="date"
                          value={form.contractEndDate}
                          onChange={(event) => setForm((current) => ({...current, contractEndDate: event.target.value}))}
                        />
                      </label>
                    </div>
                    <label className={`${styles.field} ${styles.noteField}`}>
                      <span>{t("employee.hrNote")}</span>
                      <textarea
                        rows={3}
                        value={form.hrNote}
                        onChange={(event) => setForm((current) => ({...current, hrNote: event.target.value}))}
                      />
                    </label>
                  </section>
                </div>

                <div className={styles.modalFooter}>
                  <button type="button" className={styles.cancelButton} onClick={closeModal} disabled={saving}>
                    {t("employee.cancel")}
                  </button>
                  <button type="submit" className={styles.saveButton} disabled={saving}>
                    {saving
                      ? t("employee.saving")
                      : editingId
                        ? t("employee.saveChanges")
                        : t("employee.create")}
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
