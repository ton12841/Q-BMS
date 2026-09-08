"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import QBMSAppShell, { QBMSIcon } from "@/components/layout/QBMSAppShell";
import { useI18n } from "@/i18n/useQBMSI18n";
import {
  fetchBusinessUnits,
  fetchPositions,
  type BusinessUnit,
  type Position,
  type PositionAllowedGrade,
} from "@/modules/organization/api/organization.api";
import {
  fetchEmployeeAssignmentOverview,
  transitionEmployeeAssignment,
  type EmployeeAssignmentOverview,
} from "./employeeAssignment.api";
import styles from "./EmployeeOrganizationAssignmentPage.module.css";

type ChangeType =
  | "TRANSFER"
  | "PROMOTION"
  | "LATERAL_MOVE"
  | "CORRECTION";

type FormState = {
  businessUnitId: string;
  positionId: string;
  jobGradeId: string;
  primaryManagerAssignmentId: string;
  effectiveFrom: string;
  changeType: ChangeType;
  changeReason: string;
  changeNote: string;
};

const copy = {
  en: {
    pageTitle: "Employee Organization Assignment",
    pageDescription:
      "Manage Business Unit, Position, Grade, Level, Primary Manager and assignment history.",
    eyebrow: "EMPLOYEE / ORGANIZATION ASSIGNMENT",
    title: "Organization Assignment",
    intro:
      "Active Employee moves create a new assignment record instead of overwriting history. Job Level is derived from Job Grade.",
    back: "← Employee Master",
    reporting: "Reporting Lines",
    current: "Current Assignment",
    currentHelp: "Canonical active primary assignment",
    history: "Assignment History",
    historyHelp: "Previous organization assignments remain traceable",
    manager: "Primary Manager",
    noManager: "No Primary Manager",
    department: "Department",
    departmentHold: "HOLD",
    businessUnit: "Business Unit",
    position: "Position",
    grade: "Job Grade",
    level: "Job Level",
    effectiveFrom: "Effective From",
    effectiveTo: "Effective To",
    status: "Status",
    changeType: "Change Type",
    changedBy: "Changed By",
    reason: "Reason",
    note: "Note",
    changeAssignment: "Change Assignment",
    changeHelp:
      "Use this form for transfer, promotion, lateral move or correction of an active Employee.",
    selectBusinessUnit: "Select Business Unit",
    selectPosition: "Select Position",
    selectGrade: "Select Job Grade",
    selectPositionFirst: "Select Position first",
    selectManager: "No Primary Manager",
    managerHelp:
      "Changing assignment keeps subordinate reporting continuity. Dotted Managers are carried when still active.",
    dateHelp: "Effective Date cannot be in the future in this release.",
    transfer: "Transfer",
    promotion: "Promotion",
    lateral: "Lateral Move",
    correction: "Correction",
    reasonPlaceholder: "Business reason for this move...",
    notePlaceholder: "Optional HR note...",
    save: "Create Assignment Transition",
    saving: "Saving...",
    success: "Organization Assignment updated and history preserved.",
    noCurrent: "No current assignment",
    noCurrentHelp:
      "Create the Employee initial assignment from Employee Master first.",
    noPositions: "No real Position Master data available",
    noPositionsHelp:
      "Q BMS will not invent Position data. Add the real company Position Master before changing assignments.",
    loading: "Loading organization assignment...",
    loadError: "Unable to load Employee Organization Assignment.",
    historyEmpty: "No assignment history yet.",
    reportingContinuity: "Reporting continuity",
    reportingContinuityHelp:
      "Subordinates move automatically to the Employee's new assignment. Primary/Dotted manager history is closed against the old assignment.",
    immutable: "History protected",
    immutableHelp:
      "Active Employee assignment history cannot be overwritten from Employee Master.",
    gradeLabel: "Grade",
    legacy: "Legacy",
    initial: "Initial",
  },
  th: {
    pageTitle: "การจัดการโครงสร้างองค์กรของพนักงาน",
    pageDescription:
      "จัดการ Business Unit, Position, Grade, Level, Primary Manager และประวัติ Assignment",
    eyebrow: "EMPLOYEE / ORGANIZATION ASSIGNMENT",
    title: "Organization Assignment",
    intro:
      "การย้าย Active Employee จะสร้าง Assignment Record ใหม่แทนการเขียนทับประวัติ และ Job Level จะ Derived จาก Job Grade",
    back: "← Employee Master",
    reporting: "Reporting Lines",
    current: "Assignment ปัจจุบัน",
    currentHelp: "Canonical Active Primary Assignment",
    history: "ประวัติ Assignment",
    historyHelp: "เก็บประวัติโครงสร้างองค์กรเดิมไว้ตรวจสอบ",
    manager: "Primary Manager",
    noManager: "ยังไม่มี Primary Manager",
    department: "Department",
    departmentHold: "HOLD",
    businessUnit: "Business Unit",
    position: "Position",
    grade: "Job Grade",
    level: "Job Level",
    effectiveFrom: "มีผลตั้งแต่",
    effectiveTo: "สิ้นสุด",
    status: "สถานะ",
    changeType: "ประเภทการเปลี่ยน",
    changedBy: "ผู้ดำเนินการ",
    reason: "เหตุผล",
    note: "หมายเหตุ",
    changeAssignment: "เปลี่ยน Assignment",
    changeHelp:
      "ใช้สำหรับ Transfer, Promotion, Lateral Move หรือ Correction ของ Active Employee",
    selectBusinessUnit: "เลือก Business Unit",
    selectPosition: "เลือก Position",
    selectGrade: "เลือก Job Grade",
    selectPositionFirst: "เลือก Position ก่อน",
    selectManager: "ไม่มี Primary Manager",
    managerHelp:
      "เมื่อเปลี่ยน Assignment ระบบจะรักษา Reporting Line ของลูกทีม และ Carry Dotted Manager ที่ยัง Active",
    dateHelp: "Release นี้ยังไม่อนุญาต Effective Date ในอนาคต",
    transfer: "Transfer",
    promotion: "Promotion",
    lateral: "Lateral Move",
    correction: "Correction",
    reasonPlaceholder: "เหตุผลทางธุรกิจของการเปลี่ยน Assignment...",
    notePlaceholder: "HR Note (Optional)...",
    save: "สร้าง Assignment Transition",
    saving: "กำลังบันทึก...",
    success: "อัปเดต Organization Assignment แล้ว และเก็บ History เรียบร้อย",
    noCurrent: "ยังไม่มี Assignment ปัจจุบัน",
    noCurrentHelp:
      "ให้สร้าง Initial Assignment จาก Employee Master ก่อน",
    noPositions: "ยังไม่มี Position Master จริง",
    noPositionsHelp:
      "Q BMS จะไม่สร้าง Position ปลอม กรุณาใส่ Position จริงของบริษัทก่อนเปลี่ยน Assignment",
    loading: "กำลังโหลด Organization Assignment...",
    loadError: "ไม่สามารถโหลด Employee Organization Assignment ได้",
    historyEmpty: "ยังไม่มี Assignment History",
    reportingContinuity: "Reporting continuity",
    reportingContinuityHelp:
      "ลูกทีมจะย้ายไปอ้างอิง Assignment ใหม่ของพนักงานอัตโนมัติ และ Manager History ของ Assignment เก่าจะถูกปิดอย่างถูกต้อง",
    immutable: "ป้องกัน History",
    immutableHelp:
      "Active Employee จะไม่สามารถเขียนทับ Organization Assignment จาก Employee Master ได้",
    gradeLabel: "Grade",
    legacy: "Legacy",
    initial: "Initial",
  },
  lo: {
    pageTitle: "ການຈັດການໂຄງສ້າງອົງກອນຂອງພະນັກງານ",
    pageDescription:
      "ຈັດການ Business Unit, Position, Grade, Level, Primary Manager ແລະ ປະຫວັດ Assignment",
    eyebrow: "EMPLOYEE / ORGANIZATION ASSIGNMENT",
    title: "Organization Assignment",
    intro:
      "ການຍ້າຍ Active Employee ຈະສ້າງ Assignment Record ໃໝ່ ແທນການຂຽນທັບປະຫວັດ ແລະ Job Level ຈະມາຈາກ Job Grade",
    back: "← Employee Master",
    reporting: "Reporting Lines",
    current: "Assignment ປັດຈຸບັນ",
    currentHelp: "Canonical Active Primary Assignment",
    history: "ປະຫວັດ Assignment",
    historyHelp: "ເກັບປະຫວັດໂຄງສ້າງອົງກອນເກົ່າໄວ້",
    manager: "Primary Manager",
    noManager: "ຍັງບໍ່ມີ Primary Manager",
    department: "Department",
    departmentHold: "HOLD",
    businessUnit: "Business Unit",
    position: "Position",
    grade: "Job Grade",
    level: "Job Level",
    effectiveFrom: "ມີຜົນຕັ້ງແຕ່",
    effectiveTo: "ສິ້ນສຸດ",
    status: "ສະຖານະ",
    changeType: "ປະເພດການປ່ຽນ",
    changedBy: "ຜູ້ດຳເນີນການ",
    reason: "ເຫດຜົນ",
    note: "ໝາຍເຫດ",
    changeAssignment: "ປ່ຽນ Assignment",
    changeHelp:
      "ໃຊ້ສຳລັບ Transfer, Promotion, Lateral Move ຫຼື Correction ຂອງ Active Employee",
    selectBusinessUnit: "ເລືອກ Business Unit",
    selectPosition: "ເລືອກ Position",
    selectGrade: "ເລືອກ Job Grade",
    selectPositionFirst: "ເລືອກ Position ກ່ອນ",
    selectManager: "ບໍ່ມີ Primary Manager",
    managerHelp:
      "ເມື່ອປ່ຽນ Assignment ລະບົບຈະຮັກສາ Reporting Line ຂອງລູກທີມ ແລະ Carry Dotted Manager ທີ່ຍັງ Active",
    dateHelp: "Release ນີ້ຍັງບໍ່ອະນຸຍາດ Effective Date ໃນອະນາຄົດ",
    transfer: "Transfer",
    promotion: "Promotion",
    lateral: "Lateral Move",
    correction: "Correction",
    reasonPlaceholder: "ເຫດຜົນທາງທຸລະກິດຂອງການປ່ຽນ Assignment...",
    notePlaceholder: "HR Note (Optional)...",
    save: "ສ້າງ Assignment Transition",
    saving: "ກຳລັງບັນທຶກ...",
    success: "ອັບເດດ Organization Assignment ແລະ ເກັບ History ແລ້ວ",
    noCurrent: "ຍັງບໍ່ມີ Assignment ປັດຈຸບັນ",
    noCurrentHelp:
      "ໃຫ້ສ້າງ Initial Assignment ຈາກ Employee Master ກ່ອນ",
    noPositions: "ຍັງບໍ່ມີ Position Master ຈິງ",
    noPositionsHelp:
      "Q BMS ຈະບໍ່ສ້າງ Position ປອມ. ໃຫ້ໃສ່ Position ຈິງຂອງບໍລິສັດກ່ອນ",
    loading: "ກຳລັງໂຫຼດ Organization Assignment...",
    loadError: "ບໍ່ສາມາດໂຫຼດ Employee Organization Assignment ໄດ້",
    historyEmpty: "ຍັງບໍ່ມີ Assignment History",
    reportingContinuity: "Reporting continuity",
    reportingContinuityHelp:
      "ລູກທີມຈະຍ້າຍໄປອ້າງອີງ Assignment ໃໝ່ຂອງພະນັກງານອັດຕະໂນມັດ ແລະ Manager History ຂອງ Assignment ເກົ່າຈະຖືກປິດ",
    immutable: "ປ້ອງກັນ History",
    immutableHelp:
      "Active Employee ຈະບໍ່ສາມາດຂຽນທັບ Organization Assignment ຈາກ Employee Master",
    gradeLabel: "Grade",
    legacy: "Legacy",
    initial: "Initial",
  },
} as const;

function todayYmd() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function initialForm(
  overview: EmployeeAssignmentOverview | null
): FormState {
  return {
    businessUnitId: overview?.current?.businessUnit.id || "",
    positionId: overview?.current?.position.id || "",
    jobGradeId: overview?.current?.jobGrade.id || "",
    primaryManagerAssignmentId:
      overview?.current?.manager?.assignmentId || "",
    effectiveFrom: todayYmd(),
    changeType: "LATERAL_MOVE",
    changeReason: "",
    changeNote: "",
  };
}

export default function EmployeeOrganizationAssignmentPageClient() {
  const params = useParams<{ id: string }>();
  const employeeId = String(params?.id || "");
  const { locale } = useI18n();
  const c = copy[locale];

  const [overview, setOverview] =
    useState<EmployeeAssignmentOverview | null>(null);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [form, setForm] = useState<FormState>(() => initialForm(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load(signal?: AbortSignal) {
    setLoading(true);
    setError("");
    try {
      const [assignmentData, unitData, positionData] = await Promise.all([
        fetchEmployeeAssignmentOverview(employeeId, locale, signal),
        fetchBusinessUnits(locale, signal),
        fetchPositions(locale, signal),
      ]);
      setOverview(assignmentData);
      setBusinessUnits(unitData);
      setPositions(positionData);
      setForm(initialForm(assignmentData));
    } catch (loadError) {
      if (signal?.aborted) return;
      setError(
        loadError instanceof Error ? loadError.message : c.loadError
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [employeeId, locale]);

  const activeBusinessUnits = useMemo(
    () => businessUnits.filter((item) => item.status === "ACTIVE"),
    [businessUnits]
  );

  const activePositions = useMemo(
    () => positions.filter((item) => item.status === "ACTIVE"),
    [positions]
  );

  const selectedPosition = activePositions.find(
    (item) => String(item.id) === form.positionId
  );

  const allowedGrades: PositionAllowedGrade[] =
    selectedPosition?.allowed_grades || [];

  const selectedGrade = allowedGrades.find(
    (item) => String(item.id) === form.jobGradeId
  );

  function changePosition(positionId: string) {
    setForm((current) => ({
      ...current,
      positionId,
      jobGradeId: "",
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!overview?.current) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const next = await transitionEmployeeAssignment(
        employeeId,
        locale,
        {
          business_unit_id: form.businessUnitId,
          position_id: form.positionId,
          job_grade_id: form.jobGradeId,
          effective_from: form.effectiveFrom,
          change_type: form.changeType,
          change_reason: form.changeReason,
          change_note: form.changeNote,
          primary_manager_assignment_id:
            form.primaryManagerAssignmentId || null,
        }
      );

      setOverview(next);
      setForm(initialForm(next));
      setNotice(c.success);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : c.loadError
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading && !overview) {
    return (
      <QBMSAppShell
        pageTitle={c.pageTitle}
        pageDescription={c.pageDescription}
      >
        <div className={styles.loading}>
          <span className="qbms-loading-spinner" />
          <strong>{c.loading}</strong>
        </div>
      </QBMSAppShell>
    );
  }

  return (
    <QBMSAppShell
      pageTitle={c.pageTitle}
      pageDescription={c.pageDescription}
    >
      <div className={styles.page}>
        <div className="qbms-breadcrumb">
          <Link href="/employee">{c.back.replace("← ", "")}</Link>
          <span>›</span>
          <strong>{overview?.employee.displayName || c.title}</strong>
        </div>

        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>{c.eyebrow}</span>
            <h2>{overview?.employee.displayName || c.title}</h2>
            <p>{c.intro}</p>
          </div>

          <div className={styles.heroActions}>
            <Link href="/employee" className={styles.secondaryButton}>
              {c.back}
            </Link>
            <Link
              href="/organization/reporting-lines"
              className={styles.secondaryButton}
            >
              {c.reporting}
            </Link>
          </div>
        </section>

        {error ? <div className={styles.error}>{error}</div> : null}
        {notice ? <div className={styles.notice}>{notice}</div> : null}

        <section className={styles.guardGrid}>
          <article>
            <span className={styles.guardIcon}>
              <QBMSIcon name="lock" size={17} />
            </span>
            <div>
              <strong>{c.immutable}</strong>
              <p>{c.immutableHelp}</p>
            </div>
          </article>

          <article>
            <span className={styles.guardIcon}>
              <QBMSIcon name="network" size={17} />
            </span>
            <div>
              <strong>{c.reportingContinuity}</strong>
              <p>{c.reportingContinuityHelp}</p>
            </div>
          </article>
        </section>

        <section className={styles.currentCard}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.kicker}>CURRENT</span>
              <h3>{c.current}</h3>
              <p>{c.currentHelp}</p>
            </div>
            <span className={styles.employeeCode}>
              {overview?.employee.employeeCode || "—"}
            </span>
          </div>

          {overview?.current ? (
            <div className={styles.currentGrid}>
              <article>
                <span>{c.businessUnit}</span>
                <strong>{overview.current.businessUnit.name}</strong>
                <small>{overview.current.businessUnit.code}</small>
              </article>
              <article>
                <span>{c.position}</span>
                <strong>{overview.current.position.name}</strong>
                <small>{overview.current.position.code}</small>
              </article>
              <article>
                <span>{c.grade}</span>
                <strong>
                  {c.gradeLabel} {overview.current.jobGrade.gradeNumber}
                </strong>
                <small>{overview.current.jobGrade.name}</small>
              </article>
              <article>
                <span>{c.level}</span>
                <strong>{overview.current.jobLevel.name}</strong>
                <small>{overview.current.jobLevel.code}</small>
              </article>
              <article>
                <span>{c.manager}</span>
                <strong>
                  {overview.current.manager?.displayName || c.noManager}
                </strong>
                <small>
                  {overview.current.manager
                    ? [
                        overview.current.manager.positionName,
                        overview.current.manager.businessUnitCode,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : "—"}
                </small>
              </article>
              <article>
                <span>{c.department}</span>
                <strong>{c.departmentHold}</strong>
                <small>Reserved in architecture</small>
              </article>
            </div>
          ) : (
            <div className={styles.empty}>
              <QBMSIcon name="info" size={24} />
              <strong>{c.noCurrent}</strong>
              <span>{c.noCurrentHelp}</span>
            </div>
          )}
        </section>

        {activePositions.length === 0 ? (
          <section className={styles.positionWarning}>
            <QBMSIcon name="info" size={18} />
            <div>
              <strong>{c.noPositions}</strong>
              <p>{c.noPositionsHelp}</p>
            </div>
          </section>
        ) : null}

        {overview?.current ? (
          <section className={styles.changeCard}>
            <div className={styles.sectionHead}>
              <div>
                <span className={styles.kicker}>CONTROLLED TRANSITION</span>
                <h3>{c.changeAssignment}</h3>
                <p>{c.changeHelp}</p>
              </div>
            </div>

            <form onSubmit={submit}>
              <div className={styles.formGrid}>
                <label>
                  <span>{c.businessUnit}</span>
                  <select
                    value={form.businessUnitId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        businessUnitId: event.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">{c.selectBusinessUnit}</option>
                    {activeBusinessUnits.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.code} — {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>{c.position}</span>
                  <select
                    value={form.positionId}
                    onChange={(event) =>
                      changePosition(event.target.value)
                    }
                    required
                  >
                    <option value="">{c.selectPosition}</option>
                    {activePositions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} — {item.code}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>{c.grade}</span>
                  <select
                    value={form.jobGradeId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        jobGradeId: event.target.value,
                      }))
                    }
                    disabled={!selectedPosition}
                    required
                  >
                    <option value="">
                      {selectedPosition
                        ? c.selectGrade
                        : c.selectPositionFirst}
                    </option>
                    {allowedGrades.map((item) => (
                      <option key={item.id} value={item.id}>
                        {c.gradeLabel} {item.grade_number} — {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className={styles.derivedField}>
                  <span>{c.level}</span>
                  <strong>{selectedGrade?.job_level_name || "—"}</strong>
                  <small>{selectedGrade?.job_level_code || "Derived from Grade"}</small>
                </div>

                <label>
                  <span>{c.manager}</span>
                  <select
                    value={form.primaryManagerAssignmentId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        primaryManagerAssignmentId: event.target.value,
                      }))
                    }
                  >
                    <option value="">{c.selectManager}</option>
                    {(overview.managerCandidates || []).map((item) => (
                      <option
                        key={item.assignmentId}
                        value={item.assignmentId}
                      >
                        {item.displayName} — {item.positionName} ·{" "}
                        {item.businessUnitCode}
                      </option>
                    ))}
                  </select>
                  <small>{c.managerHelp}</small>
                </label>

                <label>
                  <span>{c.effectiveFrom}</span>
                  <input
                    type="date"
                    max={todayYmd()}
                    value={form.effectiveFrom}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        effectiveFrom: event.target.value,
                      }))
                    }
                    required
                  />
                  <small>{c.dateHelp}</small>
                </label>

                <label>
                  <span>{c.changeType}</span>
                  <select
                    value={form.changeType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        changeType: event.target.value as ChangeType,
                      }))
                    }
                  >
                    <option value="TRANSFER">{c.transfer}</option>
                    <option value="PROMOTION">{c.promotion}</option>
                    <option value="LATERAL_MOVE">{c.lateral}</option>
                    <option value="CORRECTION">{c.correction}</option>
                  </select>
                </label>

                <label className={styles.wideField}>
                  <span>{c.reason}</span>
                  <input
                    value={form.changeReason}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        changeReason: event.target.value,
                      }))
                    }
                    placeholder={c.reasonPlaceholder}
                  />
                </label>

                <label className={styles.wideField}>
                  <span>{c.note}</span>
                  <textarea
                    value={form.changeNote}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        changeNote: event.target.value,
                      }))
                    }
                    placeholder={c.notePlaceholder}
                    rows={3}
                  />
                </label>
              </div>

              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={
                    saving ||
                    !form.businessUnitId ||
                    !form.positionId ||
                    !form.jobGradeId ||
                    !form.effectiveFrom
                  }
                >
                  {saving ? c.saving : c.save}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <section className={styles.historyCard}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.kicker}>HISTORY</span>
              <h3>{c.history}</h3>
              <p>{c.historyHelp}</p>
            </div>
            <span className={styles.historyCount}>
              {overview?.history.length || 0}
            </span>
          </div>

          {overview?.history.length ? (
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>{c.effectiveFrom}</th>
                    <th>{c.effectiveTo}</th>
                    <th>{c.businessUnit}</th>
                    <th>{c.position}</th>
                    <th>{c.grade} / {c.level}</th>
                    <th>{c.manager}</th>
                    <th>{c.changeType}</th>
                    <th>{c.reason}</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.history.map((item) => (
                    <tr key={item.assignmentId}>
                      <td>{item.effectiveFrom || "—"}</td>
                      <td>{item.effectiveTo || "—"}</td>
                      <td>
                        <strong>{item.businessUnit.name}</strong>
                        <small>{item.businessUnit.code}</small>
                      </td>
                      <td>
                        <strong>{item.position.name}</strong>
                        <small>{item.position.code}</small>
                      </td>
                      <td>
                        <strong>
                          G{item.jobGrade.gradeNumber} · {item.jobLevel.code}
                        </strong>
                        <small>{item.jobGrade.name}</small>
                      </td>
                      <td>
                        <strong>
                          {item.manager?.displayName || c.noManager}
                        </strong>
                        <small>
                          {item.manager?.positionName || "—"}
                        </small>
                      </td>
                      <td>
                        <span className={styles.changeBadge}>
                          {item.changeType}
                        </span>
                      </td>
                      <td>
                        <strong>{item.changeReason || "—"}</strong>
                        <small>{item.changeNote || ""}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.empty}>
              <QBMSIcon name="clock" size={24} />
              <strong>{c.historyEmpty}</strong>
            </div>
          )}
        </section>
      </div>
    </QBMSAppShell>
  );
}
