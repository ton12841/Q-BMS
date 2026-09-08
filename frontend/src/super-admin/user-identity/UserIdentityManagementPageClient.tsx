"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QBMSAppShell, { QBMSIcon } from "@/components/layout/QBMSAppShell";
import { useSuperAdminLocale } from "@/super-admin/i18n/useSuperAdminLocale";
import {
  fetchUserIdentityOverview,
  type UserIdentityAccount,
  type UserIdentityOverview,
} from "./user-identity.api";
import styles from "./UserIdentityManagementPage.module.css";

type StatusFilter = "ALL" | "ACTIVE" | "ONBOARDING" | "GOOGLE_UNLINKED";

const copy = {
  en: {
    pageTitle: "User & Identity Management", pageDescription: "Q BMS accounts, Employee links, Google identity and login state.",
    search: "Search name, Employee ID, email, BU, Position or Role...", eyebrow: "SUPER ADMIN / IDENTITY", title: "User & Identity Management",
    intro: "Review the relationship between Employee, Q BMS User, Google Identity, Account Status, Invitation and Role from one place.",
    readOnly: "READ-ONLY FOUNDATION", back: "← System Administration", totalUsers: "Total Q BMS Users", totalUsersHelp: "All Q BMS user accounts",
    googleLinked: "Google Linked", googleLinkedHelp: "Google Subject is linked", activeAccounts: "Active Accounts", activeAccountsHelp: "Q BMS account status = ACTIVE",
    onboarding: "Onboarding", onboardingHelp: "Accounts still in onboarding", all: "All", active: "Active", googleUnlinked: "Google Unlinked", refresh: "Refresh",
    users: "Users", loading: "Loading accounts...", noMatch: "No account matches this filter.", qbmsUser: "Q BMS User", noAssignment: "No active assignment",
    googleIdentityLinked: "Google identity linked", googleIdentityNotLinked: "Google identity not linked", selectUser: "Select a Q BMS User", selectHelp: "to inspect Account and Identity state",
    accountDetail: "ACCOUNT DETAIL", preview: "Preview Effective Access", qbmsAccount: "Q BMS Account", unknown: "UNKNOWN", noAuth: "No auth provider", googleIdentity: "Google Identity",
    linked: "LINKED", notLinked: "NOT LINKED", googleSubjectExists: "Google Subject exists", waitingIdentity: "Waiting for identity linking", employeeLink: "Employee Link", unlinked: "UNLINKED",
    noEmployeeId: "No Employee ID", activeSessions: "Active Sessions", lastSeen: "Last seen", identityEmployment: "IDENTITY & EMPLOYMENT", sourceOfTruth: "Source of Truth",
    companyEmail: "Company Email", businessUnit: "Business Unit", position: "Position", levelGrade: "Level / Grade", grade: "Grade", authentication: "AUTHENTICATION",
    loginInvitation: "Login & Invitation", invitation: "Invitation", noInvitation: "NO INVITATION", sent: "Sent", accepted: "Accepted", firstLogin: "First Login", activated: "Activated",
    lastLogin: "Last Login", sessionSeen: "Session seen", systemRoles: "SYSTEM ROLES", assignedRoles: "Assigned Roles", noRole: "No role assigned", roleNoteBefore: "Role assignment is managed from",
    accessControl: "User Access Assignment", roleNoteAfter: "User & Identity Management is read-only in this foundation.", loadError: "Unable to load User & Identity Management."
  },
  th: {
    pageTitle: "การจัดการผู้ใช้และตัวตน", pageDescription: "บัญชี Q BMS การผูก Employee, Google Identity และสถานะการเข้าสู่ระบบ",
    search: "ค้นหาชื่อ Employee ID อีเมล BU Position หรือ Role...", eyebrow: "SUPER ADMIN / ตัวตนผู้ใช้", title: "การจัดการผู้ใช้และตัวตน",
    intro: "ตรวจสอบความสัมพันธ์ระหว่าง Employee, Q BMS User, Google Identity, Account Status, Invitation และ Role จากจุดเดียว",
    readOnly: "FOUNDATION แบบอ่านอย่างเดียว", back: "← การบริหารระบบ", totalUsers: "ผู้ใช้ Q BMS ทั้งหมด", totalUsersHelp: "บัญชีผู้ใช้ทั้งหมดในระบบ",
    googleLinked: "เชื่อม Google แล้ว", googleLinkedHelp: "มี Google Subject แล้ว", activeAccounts: "บัญชีที่ใช้งาน", activeAccountsHelp: "สถานะ Q BMS Account = ACTIVE",
    onboarding: "กำลัง Onboarding", onboardingHelp: "บัญชีที่ยังอยู่ในขั้นตอน Onboarding", all: "ทั้งหมด", active: "ใช้งาน", googleUnlinked: "ยังไม่เชื่อม Google", refresh: "รีเฟรช",
    users: "ผู้ใช้", loading: "กำลังโหลดบัญชี...", noMatch: "ไม่พบบัญชีตามตัวกรอง", qbmsUser: "ผู้ใช้ Q BMS", noAssignment: "ยังไม่มี Active Assignment",
    googleIdentityLinked: "เชื่อม Google Identity แล้ว", googleIdentityNotLinked: "ยังไม่เชื่อม Google Identity", selectUser: "เลือก Q BMS User", selectHelp: "เพื่อดูสถานะ Account และ Identity",
    accountDetail: "รายละเอียดบัญชี", preview: "ดู Effective Access", qbmsAccount: "บัญชี Q BMS", unknown: "ไม่ทราบสถานะ", noAuth: "ยังไม่มี Auth Provider", googleIdentity: "Google Identity",
    linked: "เชื่อมแล้ว", notLinked: "ยังไม่เชื่อม", googleSubjectExists: "มี Google Subject แล้ว", waitingIdentity: "รอ Identity Linking", employeeLink: "การผูก Employee", unlinked: "ยังไม่ผูก",
    noEmployeeId: "ยังไม่มี Employee ID", activeSessions: "Session ที่ใช้งาน", lastSeen: "พบล่าสุด", identityEmployment: "ตัวตนและข้อมูลการทำงาน", sourceOfTruth: "Source of Truth",
    companyEmail: "อีเมลบริษัท", businessUnit: "Business Unit", position: "Position", levelGrade: "Level / Grade", grade: "Grade", authentication: "การยืนยันตัวตน",
    loginInvitation: "Login และ Invitation", invitation: "Invitation", noInvitation: "ยังไม่มี Invitation", sent: "ส่งเมื่อ", accepted: "ตอบรับเมื่อ", firstLogin: "Login ครั้งแรก", activated: "Activate เมื่อ",
    lastLogin: "Login ล่าสุด", sessionSeen: "พบ Session ล่าสุด", systemRoles: "SYSTEM ROLES", assignedRoles: "Role ที่ได้รับ", noRole: "ยังไม่ได้รับ Role", roleNoteBefore: "การ Assign Role จัดการจาก",
    accessControl: "การกำหนดสิทธิ์ผู้ใช้", roleNoteAfter: "User & Identity Management เป็น Read-only ใน Foundation นี้", loadError: "ไม่สามารถโหลด User & Identity Management ได้"
  },
  lo: {
    pageTitle: "ການຈັດການຜູ້ໃຊ້ ແລະ ຕົວຕົນ", pageDescription: "ບັນຊີ Q BMS, ການຜູກ Employee, Google Identity ແລະ ສະຖານະການ Login",
    search: "ຄົ້ນຫາຊື່ Employee ID, ອີເມວ, BU, Position ຫຼື Role...", eyebrow: "SUPER ADMIN / ຕົວຕົນຜູ້ໃຊ້", title: "ການຈັດການຜູ້ໃຊ້ ແລະ ຕົວຕົນ",
    intro: "ກວດສອບຄວາມສຳພັນລະຫວ່າງ Employee, Q BMS User, Google Identity, Account Status, Invitation ແລະ Role ຈາກຈຸດດຽວ",
    readOnly: "FOUNDATION ແບບອ່ານຢ່າງດຽວ", back: "← ການບໍລິຫານລະບົບ", totalUsers: "ຜູ້ໃຊ້ Q BMS ທັງໝົດ", totalUsersHelp: "ບັນຊີຜູ້ໃຊ້ທັງໝົດ",
    googleLinked: "ເຊື່ອມ Google ແລ້ວ", googleLinkedHelp: "ມີ Google Subject ແລ້ວ", activeAccounts: "ບັນຊີທີ່ໃຊ້ງານ", activeAccountsHelp: "ສະຖານະ Q BMS Account = ACTIVE",
    onboarding: "ກຳລັງ Onboarding", onboardingHelp: "ບັນຊີທີ່ຍັງຢູ່ໃນ Onboarding", all: "ທັງໝົດ", active: "ໃຊ້ງານ", googleUnlinked: "ຍັງບໍ່ເຊື່ອມ Google", refresh: "ໂຫຼດໃໝ່",
    users: "ຜູ້ໃຊ້", loading: "ກຳລັງໂຫຼດບັນຊີ...", noMatch: "ບໍ່ພົບບັນຊີຕາມຕົວກອງ", qbmsUser: "ຜູ້ໃຊ້ Q BMS", noAssignment: "ຍັງບໍ່ມີ Active Assignment",
    googleIdentityLinked: "ເຊື່ອມ Google Identity ແລ້ວ", googleIdentityNotLinked: "ຍັງບໍ່ເຊື່ອມ Google Identity", selectUser: "ເລືອກ Q BMS User", selectHelp: "ເພື່ອເບິ່ງສະຖານະ Account ແລະ Identity",
    accountDetail: "ລາຍລະອຽດບັນຊີ", preview: "ເບິ່ງ Effective Access", qbmsAccount: "ບັນຊີ Q BMS", unknown: "ບໍ່ຮູ້ສະຖານະ", noAuth: "ຍັງບໍ່ມີ Auth Provider", googleIdentity: "Google Identity",
    linked: "ເຊື່ອມແລ້ວ", notLinked: "ຍັງບໍ່ເຊື່ອມ", googleSubjectExists: "ມີ Google Subject ແລ້ວ", waitingIdentity: "ລໍຖ້າ Identity Linking", employeeLink: "ການຜູກ Employee", unlinked: "ຍັງບໍ່ຜູກ",
    noEmployeeId: "ຍັງບໍ່ມີ Employee ID", activeSessions: "Session ທີ່ໃຊ້ງານ", lastSeen: "ພົບຫຼ້າສຸດ", identityEmployment: "ຕົວຕົນ ແລະ ການເຮັດວຽກ", sourceOfTruth: "Source of Truth",
    companyEmail: "ອີເມວບໍລິສັດ", businessUnit: "Business Unit", position: "Position", levelGrade: "Level / Grade", grade: "Grade", authentication: "ການຢືນຢັນຕົວຕົນ",
    loginInvitation: "Login ແລະ Invitation", invitation: "Invitation", noInvitation: "ຍັງບໍ່ມີ Invitation", sent: "ສົ່ງເມື່ອ", accepted: "ຕອບຮັບເມື່ອ", firstLogin: "Login ຄັ້ງທຳອິດ", activated: "Activate ເມື່ອ",
    lastLogin: "Login ຫຼ້າສຸດ", sessionSeen: "ພົບ Session ຫຼ້າສຸດ", systemRoles: "SYSTEM ROLES", assignedRoles: "Role ທີ່ໄດ້ຮັບ", noRole: "ຍັງບໍ່ໄດ້ຮັບ Role", roleNoteBefore: "ການ Assign Role ຈັດການຈາກ",
    accessControl: "ການກຳນົດສິດຜູ້ໃຊ້", roleNoteAfter: "User & Identity Management ເປັນ Read-only ໃນ Foundation ນີ້", loadError: "ບໍ່ສາມາດໂຫຼດ User & Identity Management ໄດ້"
  },
} as const;

function formatDate(value: string | null, locale: "en" | "lo" | "th") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const language = locale === "th" ? "th-TH" : locale === "lo" ? "lo-LA" : "en-GB";
  return new Intl.DateTimeFormat(language, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function statusClass(status: string | null) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "ACTIVE" || normalized === "ACCEPTED") return styles.statusPositive;
  if (normalized === "ONBOARDING" || normalized === "SENT" || normalized === "QUEUED") return styles.statusPending;
  return styles.statusNeutral;
}

function organizationLine(account: UserIdentityAccount, gradeLabel: string) {
  return [account.organization.businessUnitCode, account.organization.positionName, account.organization.jobLevelCode,
    account.organization.gradeNumber ? `${gradeLabel} ${account.organization.gradeNumber}` : null].filter(Boolean).join(" · ");
}

export default function UserIdentityManagementPageClient() {
  const locale = useSuperAdminLocale();
  const c = copy[locale];
  const [overview, setOverview] = useState<UserIdentityOverview | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(signal?: AbortSignal) {
    setLoading(true); setError(null);
    try {
      const data = await fetchUserIdentityOverview(signal);
      setOverview(data);
      setSelectedId((current) => current && data.accounts.some((account) => account.id === current) ? current : data.accounts[0]?.id || null);
    } catch (loadError) {
      if (signal?.aborted) return;
      setError(loadError instanceof Error ? loadError.message : c.loadError);
    } finally { if (!signal?.aborted) setLoading(false); }
  }

  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (overview?.accounts || []).filter((account) => {
      if (filter === "ACTIVE" && account.accountStatus !== "ACTIVE") return false;
      if (filter === "ONBOARDING" && account.accountStatus !== "ONBOARDING") return false;
      if (filter === "GOOGLE_UNLINKED" && account.googleLinked) return false;
      if (!normalized) return true;
      return [account.displayName, account.employeeCode || "", account.email || "", account.companyEmail || "", account.accountStatus || "", account.employeeStatus || "",
        account.organization.businessUnitCode || "", account.organization.businessUnitName || "", account.organization.positionName || "", ...account.roles].join(" ").toLowerCase().includes(normalized);
    });
  }, [overview, query, filter]);

  const selected = overview?.accounts.find((account) => account.id === selectedId) || null;

  return (
    <QBMSAppShell pageTitle={c.pageTitle} pageDescription={c.pageDescription} searchValue={query} onSearchChange={setQuery} searchPlaceholder={c.search}>
      <div className={styles.page}>
        <section className={styles.hero}>
          <div><span className={styles.eyebrow}>{c.eyebrow}</span><h2>{c.title}</h2><p>{c.intro}</p></div>
          <div className={styles.heroRight}><span className={styles.readOnly}><QBMSIcon name="shield" size={16} />{c.readOnly}</span><Link href="/super-admin/system-administration" className={styles.backLink}>{c.back}</Link></div>
        </section>
        {error && <div className={styles.error}>{error}</div>}
        <section className={styles.metrics}>
          <article><span>{c.totalUsers}</span><strong>{overview?.counts.totalUsers ?? "—"}</strong><small>{c.totalUsersHelp}</small></article>
          <article><span>{c.googleLinked}</span><strong>{overview?.counts.googleLinked ?? "—"}</strong><small>{c.googleLinkedHelp}</small></article>
          <article><span>{c.activeAccounts}</span><strong>{overview?.counts.activeAccounts ?? "—"}</strong><small>{c.activeAccountsHelp}</small></article>
          <article><span>{c.onboarding}</span><strong>{overview?.counts.onboardingAccounts ?? "—"}</strong><small>{c.onboardingHelp}</small></article>
        </section>
        <section className={styles.filterBar}>
          <div className={styles.segmented}>{([ ["ALL", c.all], ["ACTIVE", c.active], ["ONBOARDING", c.onboarding], ["GOOGLE_UNLINKED", c.googleUnlinked] ] as [StatusFilter,string][]).map(([value,label]) =>
            <button type="button" key={value} className={filter === value ? styles.activeSegment : ""} onClick={() => setFilter(value)}>{label}</button>)}</div>
          <button type="button" className={styles.refreshButton} onClick={() => load()} title={c.refresh}><QBMSIcon name="refresh" size={16} />{c.refresh}</button>
        </section>
        <section className={styles.workspace}>
          <div className={styles.listPanel}>
            <div className={styles.panelHead}><div><span className={styles.kicker}>Q BMS ACCOUNTS</span><h3>{c.users}</h3></div><span className={styles.count}>{filtered.length}</span></div>
            <div className={styles.userList}>
              {loading && <div className={styles.empty}>{c.loading}</div>}
              {!loading && filtered.length === 0 && <div className={styles.empty}>{c.noMatch}</div>}
              {filtered.map((account) => <button type="button" key={account.id} className={`${styles.userRow} ${selectedId === account.id ? styles.selected : ""}`} onClick={() => setSelectedId(account.id)}>
                <span className={styles.avatar}>{(account.nickname || account.firstName || account.email || "QB").slice(0,2).toUpperCase()}</span>
                <span className={styles.userCopy}><strong>{account.displayName}</strong><small>{[account.employeeCode, account.email].filter(Boolean).join(" · ") || c.qbmsUser}</small><em>{organizationLine(account,c.grade) || c.noAssignment}</em></span>
                <span className={`${styles.statusDot} ${account.googleLinked ? styles.googleLinked : styles.googleUnlinked}`} title={account.googleLinked ? c.googleIdentityLinked : c.googleIdentityNotLinked} />
              </button>)}
            </div>
          </div>
          <div className={styles.detailPanel}>
            {!selected ? <div className={styles.emptyLarge}><QBMSIcon name="users" size={30} /><strong>{c.selectUser}</strong><span>{c.selectHelp}</span></div> : <>
              <div className={styles.identityHead}><div className={styles.identityPerson}><span className={styles.largeAvatar}>{(selected.nickname || selected.firstName || selected.email || "QB").slice(0,2).toUpperCase()}</span><div><span className={styles.kicker}>{c.accountDetail}</span><h3>{selected.displayName}</h3><p>{[selected.employeeCode, selected.email].filter(Boolean).join(" · ")}</p></div></div>
                <Link href={`/super-admin/access-control/effective-preview?userId=${encodeURIComponent(selected.id)}`} className={styles.previewLink}>{c.preview}</Link></div>
              <div className={styles.stateGrid}>
                <article><span>{c.qbmsAccount}</span><strong className={statusClass(selected.accountStatus)}>{selected.accountStatus || c.unknown}</strong><small>{selected.authProvider || c.noAuth}</small></article>
                <article><span>{c.googleIdentity}</span><strong className={selected.googleLinked ? styles.statusPositive : styles.statusPending}>{selected.googleLinked ? c.linked : c.notLinked}</strong><small>{selected.googleLinked ? c.googleSubjectExists : c.waitingIdentity}</small></article>
                <article><span>{c.employeeLink}</span><strong className={selected.employeeId ? styles.statusPositive : styles.statusPending}>{selected.employeeId ? c.linked : c.unlinked}</strong><small>{selected.employeeCode || c.noEmployeeId}</small></article>
                <article><span>{c.activeSessions}</span><strong>{selected.sessions.active}</strong><small>{c.lastSeen} {formatDate(selected.sessions.lastSeenAt,locale)}</small></article>
              </div>
              <section className={styles.detailSection}><div className={styles.sectionTitle}><span className={styles.kicker}>{c.identityEmployment}</span><h3>{c.sourceOfTruth}</h3></div><div className={styles.infoGrid}>
                <div><span>{c.companyEmail}</span><strong>{selected.companyEmail || "—"}</strong></div><div><span>{c.businessUnit}</span><strong>{selected.organization.businessUnitName || selected.organization.businessUnitCode || "—"}</strong></div>
                <div><span>{c.position}</span><strong>{selected.organization.positionName || "—"}</strong></div><div><span>{c.levelGrade}</span><strong>{[selected.organization.jobLevelCode, selected.organization.gradeNumber ? `${c.grade} ${selected.organization.gradeNumber}` : null].filter(Boolean).join(" · ") || "—"}</strong></div>
              </div></section>
              <section className={styles.detailSection}><div className={styles.sectionTitle}><span className={styles.kicker}>{c.authentication}</span><h3>{c.loginInvitation}</h3></div><div className={styles.timelineGrid}>
                <div><span>{c.invitation}</span><strong className={statusClass(selected.invitation.status)}>{selected.invitation.status || c.noInvitation}</strong><small>{c.sent} {formatDate(selected.invitation.sentAt,locale)}<br />{c.accepted} {formatDate(selected.invitation.acceptedAt,locale)}</small></div>
                <div><span>{c.firstLogin}</span><strong>{formatDate(selected.firstLoginAt,locale)}</strong><small>{c.activated} {formatDate(selected.activatedAt,locale)}</small></div><div><span>{c.lastLogin}</span><strong>{formatDate(selected.lastLoginAt,locale)}</strong><small>{c.sessionSeen} {formatDate(selected.sessions.lastSeenAt,locale)}</small></div>
              </div></section>
              <section className={styles.detailSection}><div className={styles.sectionTitle}><span className={styles.kicker}>{c.systemRoles}</span><h3>{c.assignedRoles}</h3></div><div className={styles.roleList}>{selected.roles.length ? selected.roles.map((role) => <span key={role}>{role}</span>) : <em>{c.noRole}</em>}</div>
                <div className={styles.actionNote}>{c.roleNoteBefore} <Link href="/super-admin/access-control">{c.accessControl}</Link>. {c.roleNoteAfter}</div></section>
            </>}
          </div>
        </section>
      </div>
    </QBMSAppShell>
  );
}
