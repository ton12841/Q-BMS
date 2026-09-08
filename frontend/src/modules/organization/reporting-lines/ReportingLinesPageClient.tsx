"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QBMSAppShell, { QBMSIcon } from "@/components/layout/QBMSAppShell";
import { useI18n } from "@/i18n/useQBMSI18n";
import {
  endReportingLine,
  fetchReportingLinesOverview,
  saveReportingLine,
  type ReportingAssignment,
  type ReportingLine,
  type ReportingLinesOverview,
} from "./reportingLines.api";
import styles from "./ReportingLinesPage.module.css";

type RosterFilter = "ALL" | "NO_PRIMARY" | "HAS_PRIMARY";

const copy = {
  en: {
    title: "Reporting Lines",
    description: "Employee-to-manager relationships using active Employee Assignments.",
    search: "Search employee, Position, Business Unit, Level or Grade...",
    eyebrow: "ORGANIZATION / REPORTING LINES",
    hero: "Build the real reporting structure.",
    intro: "Manager relationships are stored between Employee Assignments. Grade does not automatically decide who reports to whom.",
    rule1: "PRIMARY + DOTTED",
    rule2: "Cycle Detection",
    rule3: "History Preserved",
    back: "← Back to Organization",
    assignments: "Active Assignments",
    primary: "Primary Lines",
    dotted: "Dotted Lines",
    noPrimary: "Without Primary",
    employees: "Employees",
    all: "All",
    missing: "No Primary",
    assigned: "Has Primary",
    loading: "Loading Reporting Lines...",
    noAssignments: "No active Employee Assignments yet",
    noAssignmentsHelp: "Reporting Lines is ready, but it needs real Position Master and Employee Assignment data. No fake Position data is created.",
    selectEmployee: "Select an Employee",
    selectEmployeeHelp: "to manage Primary / Dotted Managers and view history",
    currentStructure: "CURRENT STRUCTURE",
    noPrimaryManager: "No Primary Manager",
    topLevelHelp: "This can be valid for the top of the organization.",
    primaryManager: "Primary Manager",
    changePrimary: "Change Primary Manager",
    setPrimary: "Set Primary Manager",
    dottedManagers: "Dotted Managers",
    noDotted: "No active Dotted Manager",
    addDotted: "Add Dotted Manager",
    manager: "Manager",
    chooseManager: "Choose an Employee Manager...",
    effectiveFrom: "Effective From",
    save: "Save",
    saving: "Saving...",
    end: "End",
    ending: "Ending...",
    history: "REPORTING HISTORY",
    historyTitle: "History",
    noHistory: "No previous Reporting Line history.",
    current: "CURRENT",
    ended: "ENDED",
    from: "From",
    to: "To",
    ongoing: "Ongoing",
    grade: "Grade",
    primaryChanged: "Primary Manager updated.",
    dottedAdded: "Dotted Manager added.",
    lineEnded: "Reporting Line ended.",
    confirmEnd: "End this Reporting Line? History will be preserved.",
    noCandidates: "No other active Employee Assignment is available as Manager.",
    managerSource: "Manager source: Employee Assignment",
    departmentHold: "Department remains HOLD",
    futureDates: "Future-dated changes are not enabled yet",
  },
  th: {
    title: "โครงสร้างการรายงาน",
    description: "ความสัมพันธ์ Employee → Manager โดยอ้างอิง Active Employee Assignment",
    search: "ค้นหาพนักงาน Position, Business Unit, Level หรือ Grade...",
    eyebrow: "ORGANIZATION / REPORTING LINES",
    hero: "สร้างโครงสร้างการรายงานจริงของบริษัท",
    intro: "Manager ถูกเก็บเป็นความสัมพันธ์ระหว่าง Employee Assignment โดย Grade ไม่ได้เป็นตัวตัดสินอัตโนมัติว่าใครต้องรายงานต่อใคร",
    rule1: "PRIMARY + DOTTED",
    rule2: "ตรวจ Reporting Cycle",
    rule3: "เก็บ History",
    back: "← กลับ Organization",
    assignments: "Active Assignment",
    primary: "Primary Line",
    dotted: "Dotted Line",
    noPrimary: "ยังไม่มี Primary",
    employees: "พนักงาน",
    all: "ทั้งหมด",
    missing: "ไม่มี Primary",
    assigned: "มี Primary",
    loading: "กำลังโหลด Reporting Lines...",
    noAssignments: "ยังไม่มี Active Employee Assignment",
    noAssignmentsHelp: "Reporting Lines พร้อมใช้งานแล้ว แต่ยังต้องใช้ Position Master และ Employee Assignment จริง โดยระบบจะไม่สร้าง Position ปลอมขึ้นมาเอง",
    selectEmployee: "เลือกพนักงาน",
    selectEmployeeHelp: "เพื่อจัดการ Primary / Dotted Manager และดู History",
    currentStructure: "โครงสร้างปัจจุบัน",
    noPrimaryManager: "ยังไม่มี Primary Manager",
    topLevelHelp: "สถานะนี้สามารถถูกต้องได้สำหรับตำแหน่งสูงสุดขององค์กร",
    primaryManager: "Primary Manager",
    changePrimary: "เปลี่ยน Primary Manager",
    setPrimary: "กำหนด Primary Manager",
    dottedManagers: "Dotted Manager",
    noDotted: "ยังไม่มี Dotted Manager",
    addDotted: "เพิ่ม Dotted Manager",
    manager: "Manager",
    chooseManager: "เลือก Employee Manager...",
    effectiveFrom: "มีผลตั้งแต่",
    save: "บันทึก",
    saving: "กำลังบันทึก...",
    end: "สิ้นสุด",
    ending: "กำลังสิ้นสุด...",
    history: "ประวัติ REPORTING LINE",
    historyTitle: "History",
    noHistory: "ยังไม่มีประวัติ Reporting Line ก่อนหน้า",
    current: "ปัจจุบัน",
    ended: "สิ้นสุดแล้ว",
    from: "ตั้งแต่",
    to: "ถึง",
    ongoing: "ปัจจุบัน",
    grade: "Grade",
    primaryChanged: "อัปเดต Primary Manager แล้ว",
    dottedAdded: "เพิ่ม Dotted Manager แล้ว",
    lineEnded: "สิ้นสุด Reporting Line แล้ว",
    confirmEnd: "ต้องการสิ้นสุด Reporting Line นี้หรือไม่? ระบบจะเก็บ History ไว้",
    noCandidates: "ไม่มี Active Employee Assignment อื่นที่สามารถเลือกเป็น Manager ได้",
    managerSource: "Manager อ้างอิงจาก Employee Assignment",
    departmentHold: "Department ยังคง HOLD",
    futureDates: "ยังไม่เปิด Future-dated Change",
  },
  lo: {
    title: "ໂຄງສ້າງການລາຍງານ",
    description: "ຄວາມສຳພັນ Employee → Manager ໂດຍອ້າງອີງ Active Employee Assignment",
    search: "ຄົ້ນຫາພະນັກງານ, Position, Business Unit, Level ຫຼື Grade...",
    eyebrow: "ORGANIZATION / REPORTING LINES",
    hero: "ສ້າງໂຄງສ້າງການລາຍງານຈິງຂອງບໍລິສັດ",
    intro: "Manager ຖືກເກັບເປັນຄວາມສຳພັນລະຫວ່າງ Employee Assignment; Grade ບໍ່ໄດ້ກຳນົດອັດຕະໂນມັດວ່າໃຜລາຍງານຫາໃຜ",
    rule1: "PRIMARY + DOTTED",
    rule2: "ກວດ Reporting Cycle",
    rule3: "ເກັບ History",
    back: "← ກັບ Organization",
    assignments: "Active Assignment",
    primary: "Primary Line",
    dotted: "Dotted Line",
    noPrimary: "ຍັງບໍ່ມີ Primary",
    employees: "ພະນັກງານ",
    all: "ທັງໝົດ",
    missing: "ບໍ່ມີ Primary",
    assigned: "ມີ Primary",
    loading: "ກຳລັງໂຫຼດ Reporting Lines...",
    noAssignments: "ຍັງບໍ່ມີ Active Employee Assignment",
    noAssignmentsHelp: "Reporting Lines ພ້ອມແລ້ວ ແຕ່ຍັງຕ້ອງໃຊ້ Position Master ແລະ Employee Assignment ຈິງ; ລະບົບຈະບໍ່ສ້າງ Position ປອມ",
    selectEmployee: "ເລືອກພະນັກງານ",
    selectEmployeeHelp: "ເພື່ອຈັດການ Primary / Dotted Manager ແລະ ເບິ່ງ History",
    currentStructure: "ໂຄງສ້າງປັດຈຸບັນ",
    noPrimaryManager: "ຍັງບໍ່ມີ Primary Manager",
    topLevelHelp: "ສະຖານະນີ້ສາມາດຖືກຕ້ອງສຳລັບຕຳແໜ່ງສູງສຸດຂອງອົງກອນ",
    primaryManager: "Primary Manager",
    changePrimary: "ປ່ຽນ Primary Manager",
    setPrimary: "ກຳນົດ Primary Manager",
    dottedManagers: "Dotted Manager",
    noDotted: "ຍັງບໍ່ມີ Dotted Manager",
    addDotted: "ເພີ່ມ Dotted Manager",
    manager: "Manager",
    chooseManager: "ເລືອກ Employee Manager...",
    effectiveFrom: "ມີຜົນຕັ້ງແຕ່",
    save: "ບັນທຶກ",
    saving: "ກຳລັງບັນທຶກ...",
    end: "ສິ້ນສຸດ",
    ending: "ກຳລັງສິ້ນສຸດ...",
    history: "ປະຫວັດ REPORTING LINE",
    historyTitle: "History",
    noHistory: "ຍັງບໍ່ມີປະຫວັດ Reporting Line",
    current: "ປັດຈຸບັນ",
    ended: "ສິ້ນສຸດແລ້ວ",
    from: "ຕັ້ງແຕ່",
    to: "ເຖິງ",
    ongoing: "ປັດຈຸບັນ",
    grade: "Grade",
    primaryChanged: "ອັບເດດ Primary Manager ແລ້ວ",
    dottedAdded: "ເພີ່ມ Dotted Manager ແລ້ວ",
    lineEnded: "ສິ້ນສຸດ Reporting Line ແລ້ວ",
    confirmEnd: "ຕ້ອງການສິ້ນສຸດ Reporting Line ນີ້ບໍ? ລະບົບຈະເກັບ History ໄວ້",
    noCandidates: "ບໍ່ມີ Active Employee Assignment ອື່ນທີ່ເລືອກເປັນ Manager ໄດ້",
    managerSource: "Manager ອ້າງອີງຈາກ Employee Assignment",
    departmentHold: "Department ຍັງຄົງ HOLD",
    futureDates: "ຍັງບໍ່ເປີດ Future-dated Change",
  },
} as const;

function todayLocal() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function gradeText(assignment: ReportingAssignment, label: string) {
  return `${assignment.jobLevel.code} · ${label} ${assignment.jobGrade.gradeNumber}`;
}

function managerMeta(assignment: ReportingAssignment, gradeLabel: string) {
  return `${assignment.position.name} · ${assignment.businessUnit.code} · ${gradeText(assignment, gradeLabel)}`;
}

export default function ReportingLinesPageClient() {
  const { locale } = useI18n();
  const c = copy[locale];

  const [overview, setOverview] = useState<ReportingLinesOverview | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RosterFilter>("ALL");
  const [primaryManagerId, setPrimaryManagerId] = useState("");
  const [dottedManagerId, setDottedManagerId] = useState("");
  const [primaryDate, setPrimaryDate] = useState(todayLocal());
  const [dottedDate, setDottedDate] = useState(todayLocal());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"PRIMARY" | "DOTTED" | null>(null);
  const [endingId, setEndingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load(signal?: AbortSignal) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReportingLinesOverview(locale, signal);
      setOverview(data);
      setSelectedAssignmentId((current) =>
        current && data.assignments.some((item) => item.assignmentId === current)
          ? current
          : data.assignments[0]?.assignmentId || null
      );
    } catch (loadError) {
      if (signal?.aborted) return;
      setError(loadError instanceof Error ? loadError.message : "Unable to load Reporting Lines.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [locale]);

  const currentLines = useMemo(
    () => (overview?.lines || []).filter((line) => line.isCurrent),
    [overview]
  );

  const primaryByAssignment = useMemo(() => {
    const map = new Map<string, ReportingLine>();
    for (const line of currentLines) {
      if (line.relationshipType === "PRIMARY") map.set(line.employeeAssignmentId, line);
    }
    return map;
  }, [currentLines]);

  const filteredAssignments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (overview?.assignments || []).filter((assignment) => {
      const hasPrimary = primaryByAssignment.has(assignment.assignmentId);
      if (filter === "NO_PRIMARY" && hasPrimary) return false;
      if (filter === "HAS_PRIMARY" && !hasPrimary) return false;
      if (!normalized) return true;
      return [
        assignment.displayName,
        assignment.employeeCode || "",
        assignment.position.name,
        assignment.businessUnit.name,
        assignment.businessUnit.code,
        assignment.jobLevel.code,
        assignment.jobGrade.name,
        String(assignment.jobGrade.gradeNumber),
      ].join(" ").toLowerCase().includes(normalized);
    });
  }, [overview, query, filter, primaryByAssignment]);

  const selectedAssignment = overview?.assignments.find(
    (item) => item.assignmentId === selectedAssignmentId
  ) || null;

  const selectedCurrentLines = currentLines.filter(
    (line) => line.employeeAssignmentId === selectedAssignmentId
  );
  const selectedPrimary = selectedCurrentLines.find(
    (line) => line.relationshipType === "PRIMARY"
  ) || null;
  const selectedDotted = selectedCurrentLines.filter(
    (line) => line.relationshipType === "DOTTED"
  );
  const selectedHistory = (overview?.lines || []).filter(
    (line) => line.employeeAssignmentId === selectedAssignmentId && !line.isCurrent
  );

  const managerCandidates = useMemo(() => {
    if (!selectedAssignment) return [];
    const activeManagerEmployeeIds = new Set(
      selectedCurrentLines.map((line) => line.manager.employeeId)
    );
    return (overview?.assignments || []).filter(
      (candidate) =>
        candidate.assignmentId !== selectedAssignment.assignmentId &&
        candidate.employeeId !== selectedAssignment.employeeId &&
        !activeManagerEmployeeIds.has(candidate.employeeId)
    );
  }, [overview, selectedAssignment, selectedCurrentLines]);

  useEffect(() => {
    setPrimaryManagerId("");
    setDottedManagerId("");
    setNotice(null);
  }, [selectedAssignmentId]);

  async function save(type: "PRIMARY" | "DOTTED") {
    if (!selectedAssignment) return;
    const managerId = type === "PRIMARY" ? primaryManagerId : dottedManagerId;
    const date = type === "PRIMARY" ? primaryDate : dottedDate;
    if (!managerId) return;

    setSaving(type);
    setError(null);
    setNotice(null);
    try {
      await saveReportingLine(locale, {
        employee_assignment_id: selectedAssignment.assignmentId,
        reports_to_assignment_id: managerId,
        relationship_type: type,
        effective_from: date,
      });
      setNotice(type === "PRIMARY" ? c.primaryChanged : c.dottedAdded);
      if (type === "PRIMARY") setPrimaryManagerId("");
      else setDottedManagerId("");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save Reporting Line.");
    } finally {
      setSaving(null);
    }
  }

  async function endLine(line: ReportingLine) {
    if (!window.confirm(c.confirmEnd)) return;
    setEndingId(line.id);
    setError(null);
    setNotice(null);
    try {
      await endReportingLine(line.id, locale, todayLocal());
      setNotice(c.lineEnded);
      await load();
    } catch (endError) {
      setError(endError instanceof Error ? endError.message : "Unable to end Reporting Line.");
    } finally {
      setEndingId(null);
    }
  }

  return (
    <QBMSAppShell
      pageTitle={c.title}
      pageDescription={c.description}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={c.search}
    >
      <div className={styles.page}>
        <div className="qbms-breadcrumb">
          <Link href="/">Modules & Tools</Link><span>›</span>
          <Link href="/organization">Organization</Link><span>›</span>
          <strong>{c.title}</strong>
        </div>

        <section className={styles.hero}>
          <div className={styles.heroIcon}><QBMSIcon name="network" size={27} /></div>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>{c.eyebrow}</span>
            <h2>{c.hero}</h2>
            <p>{c.intro}</p>
          </div>
          <div className={styles.rules}>
            <span>{c.rule1}</span><span>{c.rule2}</span><span>{c.rule3}</span>
          </div>
        </section>

        <div className={styles.topActions}>
          <Link href="/organization" className={styles.backLink}>{c.back}</Link>
          <div className={styles.architecturePills}>
            <span>{c.managerSource}</span>
            <span>{c.departmentHold}</span>
            <span>{c.futureDates}</span>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {notice && <div className={styles.notice}>{notice}</div>}

        <section className={styles.metrics}>
          <article><span>{c.assignments}</span><strong>{overview?.counts.activeAssignments ?? "—"}</strong></article>
          <article><span>{c.primary}</span><strong>{overview?.counts.activePrimary ?? "—"}</strong></article>
          <article><span>{c.dotted}</span><strong>{overview?.counts.activeDotted ?? "—"}</strong></article>
          <article><span>{c.noPrimary}</span><strong>{overview?.counts.withoutPrimary ?? "—"}</strong></article>
        </section>

        {loading && !overview ? (
          <section className={styles.bigEmpty}><QBMSIcon name="refresh" size={28} /><strong>{c.loading}</strong></section>
        ) : !overview?.assignments.length ? (
          <section className={styles.bigEmpty}>
            <QBMSIcon name="network" size={32} />
            <strong>{c.noAssignments}</strong>
            <p>{c.noAssignmentsHelp}</p>
          </section>
        ) : (
          <section className={styles.workspace}>
            <aside className={styles.rosterPanel}>
              <div className={styles.panelHead}>
                <div><span className={styles.eyebrow}>EMPLOYEE ASSIGNMENTS</span><h3>{c.employees}</h3></div>
                <span className={styles.count}>{filteredAssignments.length}</span>
              </div>
              <div className={styles.filters}>
                {([['ALL', c.all], ['NO_PRIMARY', c.missing], ['HAS_PRIMARY', c.assigned]] as [RosterFilter, string][]).map(([value, label]) => (
                  <button key={value} type="button" className={filter === value ? styles.activeFilter : ""} onClick={() => setFilter(value)}>{label}</button>
                ))}
              </div>
              <div className={styles.rosterList}>
                {filteredAssignments.map((assignment) => {
                  const primary = primaryByAssignment.get(assignment.assignmentId);
                  return (
                    <button key={assignment.assignmentId} type="button" className={`${styles.employeeRow} ${selectedAssignmentId === assignment.assignmentId ? styles.selectedRow : ""}`} onClick={() => setSelectedAssignmentId(assignment.assignmentId)}>
                      <span className={styles.avatar}>{(assignment.nickname || assignment.firstName || "QB").slice(0, 2).toUpperCase()}</span>
                      <span className={styles.employeeCopy}>
                        <strong>{assignment.displayName}</strong>
                        <small>{assignment.position.name} · {assignment.businessUnit.code}</small>
                        <em>{gradeText(assignment, c.grade)}</em>
                        <span className={primary ? styles.managerSet : styles.managerMissing}>{primary ? primary.manager.displayName : c.noPrimaryManager}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className={styles.detailPanel}>
              {!selectedAssignment ? (
                <div className={styles.bigEmpty}><QBMSIcon name="users" size={30} /><strong>{c.selectEmployee}</strong><p>{c.selectEmployeeHelp}</p></div>
              ) : (
                <>
                  <div className={styles.employeeHeader}>
                    <span className={styles.largeAvatar}>{(selectedAssignment.nickname || selectedAssignment.firstName || "QB").slice(0, 2).toUpperCase()}</span>
                    <div><span className={styles.eyebrow}>{c.currentStructure}</span><h3>{selectedAssignment.displayName}</h3><p>{managerMeta(selectedAssignment, c.grade)}</p></div>
                  </div>

                  <section className={styles.structureGrid}>
                    <article className={styles.managerCard}>
                      <div className={styles.sectionTitle}><span>PRIMARY</span><h4>{c.primaryManager}</h4></div>
                      {selectedPrimary ? (
                        <div className={styles.currentManager}>
                          <div><strong>{selectedPrimary.manager.displayName}</strong><small>{selectedPrimary.manager.positionName} · {selectedPrimary.manager.businessUnitCode} · {c.grade} {selectedPrimary.manager.gradeNumber}</small></div>
                          <button type="button" disabled={endingId === selectedPrimary.id} onClick={() => endLine(selectedPrimary)}>{endingId === selectedPrimary.id ? c.ending : c.end}</button>
                        </div>
                      ) : (
                        <div className={styles.noManager}><strong>{c.noPrimaryManager}</strong><span>{c.topLevelHelp}</span></div>
                      )}

                      <div className={styles.formBlock}>
                        <label>{selectedPrimary ? c.changePrimary : c.setPrimary}
                          <select value={primaryManagerId} onChange={(event) => setPrimaryManagerId(event.target.value)}>
                            <option value="">{c.chooseManager}</option>
                            {managerCandidates.map((candidate) => <option key={candidate.assignmentId} value={candidate.assignmentId}>{candidate.displayName} — {candidate.position.name} · {candidate.businessUnit.code}</option>)}
                          </select>
                        </label>
                        <label>{c.effectiveFrom}<input type="date" max={todayLocal()} value={primaryDate} onChange={(event) => setPrimaryDate(event.target.value)} /></label>
                        <button type="button" className={styles.primaryButton} disabled={!primaryManagerId || saving !== null} onClick={() => save("PRIMARY")}>{saving === "PRIMARY" ? c.saving : c.save}</button>
                        {!managerCandidates.length && <small className={styles.formHelp}>{c.noCandidates}</small>}
                      </div>
                    </article>

                    <article className={styles.managerCard}>
                      <div className={styles.sectionTitle}><span>DOTTED</span><h4>{c.dottedManagers}</h4></div>
                      <div className={styles.dottedList}>
                        {!selectedDotted.length && <div className={styles.noManager}><strong>{c.noDotted}</strong></div>}
                        {selectedDotted.map((line) => (
                          <div className={styles.currentManager} key={line.id}>
                            <div><strong>{line.manager.displayName}</strong><small>{line.manager.positionName} · {line.manager.businessUnitCode} · {c.grade} {line.manager.gradeNumber}</small></div>
                            <button type="button" disabled={endingId === line.id} onClick={() => endLine(line)}>{endingId === line.id ? c.ending : c.end}</button>
                          </div>
                        ))}
                      </div>

                      <div className={styles.formBlock}>
                        <label>{c.addDotted}
                          <select value={dottedManagerId} onChange={(event) => setDottedManagerId(event.target.value)}>
                            <option value="">{c.chooseManager}</option>
                            {managerCandidates.map((candidate) => <option key={candidate.assignmentId} value={candidate.assignmentId}>{candidate.displayName} — {candidate.position.name} · {candidate.businessUnit.code}</option>)}
                          </select>
                        </label>
                        <label>{c.effectiveFrom}<input type="date" max={todayLocal()} value={dottedDate} onChange={(event) => setDottedDate(event.target.value)} /></label>
                        <button type="button" className={styles.secondaryButton} disabled={!dottedManagerId || saving !== null} onClick={() => save("DOTTED")}>{saving === "DOTTED" ? c.saving : c.save}</button>
                      </div>
                    </article>
                  </section>

                  <section className={styles.historySection}>
                    <div className={styles.historyHead}><div><span className={styles.eyebrow}>{c.history}</span><h3>{c.historyTitle}</h3></div><span className={styles.count}>{selectedHistory.length}</span></div>
                    {!selectedHistory.length ? <div className={styles.historyEmpty}>{c.noHistory}</div> : (
                      <div className={styles.historyList}>
                        {selectedHistory.map((line) => (
                          <article key={line.id}>
                            <span className={line.relationshipType === "PRIMARY" ? styles.primaryBadge : styles.dottedBadge}>{line.relationshipType}</span>
                            <div><strong>{line.manager.displayName}</strong><small>{line.manager.positionName} · {line.manager.businessUnitCode}</small></div>
                            <div className={styles.dateRange}><span>{c.from} {line.effectiveFrom || "—"}</span><span>{c.to} {line.effectiveTo || c.ongoing}</span></div>
                            <span className={styles.endedBadge}>{c.ended}</span>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </main>
          </section>
        )}
      </div>
    </QBMSAppShell>
  );
}
