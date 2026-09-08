'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import QBMSAppShell, { QBMSIcon, type QBMSIconName } from '@/components/layout/QBMSAppShell';
import { fetchAuthSession, type AuthSession } from '@/modules/auth/api/auth.api';
import { useI18n } from '@/i18n/useQBMSI18n';
import {
  fetchMyEmployeeWorkspace,
  type EmployeeWorkspaceData,
} from './employeeWorkspace.api';
import styles from './EmployeeWorkspacePage.module.css';

type Copy = Record<string, string>;

const COPY: Record<string, Copy> = {
  en: {
    pageTitle: 'My Workspace',
    pageDescription: 'Your employee home for profile, employment, documents, assets and work tools.',
    search: 'Search your workspace...',
    eyebrow: 'EMPLOYEE WORKSPACE',
    welcome: 'Welcome back',
    heroBody: 'Your Q BMS employee identity is active. Use this workspace as the starting point for your personal information and work tools.',
    active: 'Active Employee',
    modules: 'Modules & Tools',
    refresh: 'Refresh',
    employeeId: 'Employee ID',
    businessUnit: 'Business Unit',
    position: 'Position',
    grade: 'Job Grade',
    myProfile: 'My Profile',
    myProfileHint: 'Personal and contact information from Employee Module.',
    myEmployment: 'My Employment',
    myEmploymentHint: 'Current Business Unit, Position, Grade and employment setup.',
    myDocuments: 'My Documents',
    myDocumentsHint: 'Documents submitted and stored against your employee record.',
    myAssets: 'My Assets',
    myAssetsHint: 'Company assets currently assigned to you.',
    organizationChart: 'Organization Chart',
    organizationChartHint: 'View the company reporting structure. Read-only and generated automatically from HR-managed Employee Organization data.',
    profileDetails: 'Profile Details',
    employmentDetails: 'Employment Details',
    documents: 'Documents',
    assets: 'Assigned Assets',
    companyEmail: 'Company Email',
    mobile: 'Mobile',
    personalEmail: 'Personal Email',
    nationality: 'Nationality',
    emergency: 'Emergency Contact',
    employmentType: 'Employment Type',
    startDate: 'Start Date',
    workLocation: 'Work Location',
    jobLevel: 'Job Level',
    manager: 'Manager',
    effectiveFrom: 'Assignment Effective From',
    none: '—',
    noDocuments: 'No employee documents are available yet.',
    noAssets: 'No company assets are currently assigned.',
    openDocument: 'Open',
    serial: 'Serial',
    assigned: 'Assigned',
    toolsTitle: 'Employee Tools',
    toolsBody: 'The Employee Workspace is now the permanent employee entry point. Operational features will connect here as each shared module/tool is delivered.',
    available: 'Available',
    planned: 'Planned',
    myAttendance: 'My Attendance',
    myLeave: 'My Leave',
    myKpi: 'My KPI & Performance',
    myTasks: 'My Tasks',
    myRequests: 'My Requests',
    notifications: 'Notifications',
    reserved: 'Reserved in the Employee Workspace architecture and will be connected to its owning module/tool.',
    developmentPreview: 'Employee identity is not attached to Development Preview.',
    developmentPreviewBody: 'This is expected. Employee Workspace uses the signed-in ACTIVE employee identity. Use Modules & Tools for system development, or sign in with an activated employee account to test this workspace.',
    backModules: 'Back to Modules & Tools',
    loading: 'Loading Employee Workspace...',
    loadError: 'Unable to load Employee Workspace.',
    roles: 'Access Roles',
    workspaceReady: 'Onboarding completed · Employee Workspace ready',
  },
  th: {
    pageTitle: 'พื้นที่ทำงานของฉัน',
    pageDescription: 'พื้นที่หลักของพนักงานสำหรับโปรไฟล์ ข้อมูลการทำงาน เอกสาร ทรัพย์สิน และเครื่องมือทำงาน',
    search: 'ค้นหาในพื้นที่ทำงาน...',
    eyebrow: 'EMPLOYEE WORKSPACE',
    welcome: 'ยินดีต้อนรับกลับ',
    heroBody: 'บัญชีพนักงาน Q BMS ของคุณ Active แล้ว ใช้พื้นที่นี้เป็นจุดเริ่มต้นสำหรับข้อมูลส่วนตัวและเครื่องมือทำงานทั้งหมด',
    active: 'พนักงาน Active',
    modules: 'โมดูลและเครื่องมือ',
    refresh: 'รีเฟรช',
    employeeId: 'รหัสพนักงาน',
    businessUnit: 'สายธุรกิจ',
    position: 'ตำแหน่งงาน',
    grade: 'เกรด',
    myProfile: 'โปรไฟล์ของฉัน',
    myProfileHint: 'ข้อมูลส่วนตัวและข้อมูลติดต่อจาก Employee Module',
    myEmployment: 'ข้อมูลการทำงานของฉัน',
    myEmploymentHint: 'สายธุรกิจ ตำแหน่ง เกรด และข้อมูลการจ้างงานปัจจุบัน',
    myDocuments: 'เอกสารของฉัน',
    myDocumentsHint: 'เอกสารที่ส่งและจัดเก็บกับข้อมูลพนักงานของคุณ',
    myAssets: 'ทรัพย์สินของฉัน',
    myAssetsHint: 'อุปกรณ์และทรัพย์สินของบริษัทที่มอบหมายให้คุณ',
    organizationChart: 'Organization Chart',
    organizationChartHint: 'ดูโครงสร้างการรายงานของบริษัทแบบ Read-only ซึ่งสร้างอัตโนมัติจากข้อมูล Employee Organization ที่ HR ดูแล',
    profileDetails: 'ข้อมูลโปรไฟล์',
    employmentDetails: 'ข้อมูลการทำงาน',
    documents: 'เอกสาร',
    assets: 'ทรัพย์สินที่ได้รับมอบหมาย',
    companyEmail: 'อีเมลบริษัท',
    mobile: 'เบอร์โทรศัพท์',
    personalEmail: 'อีเมลส่วนตัว',
    nationality: 'สัญชาติ',
    emergency: 'ผู้ติดต่อฉุกเฉิน',
    employmentType: 'ประเภทการจ้างงาน',
    startDate: 'วันเริ่มงาน',
    workLocation: 'สถานที่ทำงาน',
    jobLevel: 'ระดับตำแหน่ง',
    manager: 'ผู้จัดการ',
    effectiveFrom: 'วันที่มีผลของตำแหน่ง',
    none: '—',
    noDocuments: 'ยังไม่มีเอกสารพนักงานในระบบ',
    noAssets: 'ยังไม่มีทรัพย์สินบริษัทที่มอบหมายให้คุณ',
    openDocument: 'เปิด',
    serial: 'Serial',
    assigned: 'มอบหมายเมื่อ',
    toolsTitle: 'เครื่องมือสำหรับพนักงาน',
    toolsBody: 'Employee Workspace เป็นจุดเข้าหลักของพนักงานแล้ว ส่วนงานปฏิบัติการอื่นจะเชื่อมเข้ามาที่นี่ตาม Module/Tool ที่เราพัฒนาต่อ',
    available: 'ใช้งานได้',
    planned: 'อยู่ในแผน',
    myAttendance: 'ลงเวลาของฉัน',
    myLeave: 'การลาของฉัน',
    myKpi: 'KPI และผลงานของฉัน',
    myTasks: 'งานของฉัน',
    myRequests: 'คำขอของฉัน',
    notifications: 'การแจ้งเตือน',
    reserved: 'ส่วนนี้ถูกวางไว้ใน Employee Workspace แล้ว และจะเชื่อมกับ Module/Tool เจ้าของข้อมูลเมื่อพัฒนาถึงลำดับนั้น',
    developmentPreview: 'Development Preview ไม่มี Employee Identity',
    developmentPreviewBody: 'สถานะนี้ถูกต้อง เพราะ Employee Workspace ต้องใช้บัญชีพนักงานที่ ACTIVE จริง สำหรับงานพัฒนาระบบให้ใช้ Modules & Tools หรือ Sign in ด้วยบัญชีพนักงานที่ Activate แล้วเพื่อทดสอบ Workspace',
    backModules: 'กลับไป Modules & Tools',
    loading: 'กำลังโหลด Employee Workspace...',
    loadError: 'ไม่สามารถโหลด Employee Workspace ได้',
    roles: 'บทบาทและสิทธิ์',
    workspaceReady: 'Onboarding เสร็จสมบูรณ์ · Employee Workspace พร้อมใช้งาน',
  },
  lo: {
    pageTitle: 'ພື້ນທີ່ເຮັດວຽກຂອງຂ້ອຍ',
    pageDescription: 'ພື້ນທີ່ຫຼັກສຳລັບ Profile, Employment, Documents, Assets ແລະເຄື່ອງມືພະນັກງານ',
    search: 'ຄົ້ນຫາໃນ Workspace...',
    eyebrow: 'EMPLOYEE WORKSPACE',
    welcome: 'ຍິນດີຕ້ອນຮັບ',
    heroBody: 'Q BMS Employee Identity ຂອງທ່ານ Active ແລ້ວ. ໃຊ້ Workspace ນີ້ເປັນຈຸດເລີ່ມຕົ້ນຂອງຂໍ້ມູນສ່ວນຕົວແລະເຄື່ອງມືເຮັດວຽກ.',
    active: 'Active Employee', modules: 'Modules & Tools', refresh: 'Refresh',
    employeeId: 'Employee ID', businessUnit: 'Business Unit', position: 'Position', grade: 'Job Grade',
    myProfile: 'My Profile', myProfileHint: 'ຂໍ້ມູນສ່ວນຕົວແລະການຕິດຕໍ່',
    myEmployment: 'My Employment', myEmploymentHint: 'Business Unit, Position, Grade ແລະ Employment',
    myDocuments: 'My Documents', myDocumentsHint: 'ເອກະສານພະນັກງານ',
    myAssets: 'My Assets', myAssetsHint: 'ຊັບສິນບໍລິສັດທີ່ມອບໝາຍ',
    organizationChart: 'Organization Chart', organizationChartHint: 'ເບິ່ງໂຄງສ້າງການລາຍງານຂອງບໍລິສັດແບບ Read-only ທີ່ສ້າງຈາກ HR-managed Employee Organization data',
    profileDetails: 'Profile Details', employmentDetails: 'Employment Details', documents: 'Documents', assets: 'Assigned Assets',
    companyEmail: 'Company Email', mobile: 'Mobile', personalEmail: 'Personal Email', nationality: 'Nationality', emergency: 'Emergency Contact',
    employmentType: 'Employment Type', startDate: 'Start Date', workLocation: 'Work Location', jobLevel: 'Job Level', manager: 'Manager', effectiveFrom: 'Effective From',
    none: '—', noDocuments: 'ຍັງບໍ່ມີເອກະສານ', noAssets: 'ຍັງບໍ່ມີຊັບສິນທີ່ມອບໝາຍ', openDocument: 'Open', serial: 'Serial', assigned: 'Assigned',
    toolsTitle: 'Employee Tools', toolsBody: 'Employee Workspace ເປັນຈຸດເຂົ້າຫຼັກຂອງພະນັກງານ. ຟັງຊັນອື່ນຈະເຊື່ອມຕໍ່ຕາມ Module/Tool.',
    available: 'Available', planned: 'Planned', myAttendance: 'My Attendance', myLeave: 'My Leave', myKpi: 'My KPI & Performance', myTasks: 'My Tasks', myRequests: 'My Requests', notifications: 'Notifications',
    reserved: 'ພື້ນທີ່ນີ້ຖືກຈອງໄວ້ໃນ Employee Workspace ແລະຈະເຊື່ອມກັບ Module/Tool ເຈົ້າຂອງຂໍ້ມູນ.',
    developmentPreview: 'Development Preview ບໍ່ມີ Employee Identity',
    developmentPreviewBody: 'Employee Workspace ຕ້ອງໃຊ້ ACTIVE employee account. ໃຊ້ Modules & Tools ສຳລັບ development preview ຫຼື sign in ດ້ວຍ employee account ທີ່ Activate ແລ້ວ.',
    backModules: 'Back to Modules & Tools', loading: 'Loading Employee Workspace...', loadError: 'Unable to load Employee Workspace.', roles: 'Access Roles', workspaceReady: 'Onboarding completed · Employee Workspace ready',
  },
};

function valueOrDash(value: unknown, dash = '—') {
  if (value === null || value === undefined || value === '') return dash;
  return String(value);
}

function dateLabel(value: string | null | undefined, locale: string, dash: string) {
  if (!value) return dash;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : locale === 'lo' ? 'lo-LA' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(date);
}

function managerName(employee: EmployeeWorkspaceData['employee'], dash: string) {
  const name = [employee.manager_first_name, employee.manager_last_name].filter(Boolean).join(' ').trim();
  if (!name && !employee.manager_nickname) return dash;
  return employee.manager_nickname ? `${name || employee.manager_nickname} (${employee.manager_nickname})` : name;
}

const reservedTools: Array<{ key: string; icon: QBMSIconName }> = [
  { key: 'myAttendance', icon: 'clock' },
  { key: 'myLeave', icon: 'report' },
  { key: 'myKpi', icon: 'chart' },
  { key: 'myTasks', icon: 'check' },
  { key: 'myRequests', icon: 'layers' },
  { key: 'notifications', icon: 'bell' },
];

export default function EmployeeWorkspacePageClient() {
  const { locale } = useI18n();
  const c = COPY[locale] || COPY.en;
  const [session, setSession] = useState<AuthSession | null>(null);
  const [data, setData] = useState<EmployeeWorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  async function load(signal?: AbortSignal) {
    setLoading(true);
    setError('');
    try {
      const currentSession = await fetchAuthSession(signal);
      setSession(currentSession);
      if (currentSession.sessionKind === 'DEVELOPMENT_PREVIEW') {
        setData(null);
        return;
      }
      const workspace = await fetchMyEmployeeWorkspace(locale, signal);
      setData(workspace);
    } catch (e) {
      if (signal?.aborted) return;
      setError(e instanceof Error ? e.message : c.loadError);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [locale]);

  const employee = data?.employee;
  const q = query.trim().toLowerCase();
  const visibleDocuments = useMemo(() => {
    if (!data) return [];
    if (!q) return data.documents;
    return data.documents.filter((item) => [item.document_type, item.status].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)));
  }, [data, q]);
  const visibleAssets = useMemo(() => {
    if (!data) return [];
    if (!q) return data.assets;
    return data.assets.filter((item) => [item.asset_code, item.asset_name, item.asset_type, item.serial_number].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)));
  }, [data, q]);

  return (
    <QBMSAppShell
      pageTitle={c.pageTitle}
      pageDescription={c.pageDescription}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={c.search}
    >
      <div className="qbms-breadcrumb"><Link href="/">{c.modules}</Link><span>›</span><strong>{c.pageTitle}</strong></div>

      {session?.sessionKind === 'DEVELOPMENT_PREVIEW' ? (
        <section className={styles.previewState}>
          <span className={styles.previewIcon}><QBMSIcon name="users" size={30} /></span>
          <div>
            <div className="qbms-eyebrow">{c.eyebrow}</div>
            <h2>{c.developmentPreview}</h2>
            <p>{c.developmentPreviewBody}</p>
            <Link href="/" className={styles.primaryLink}><QBMSIcon name="grid" size={17}/>{c.backModules}</Link>
          </div>
        </section>
      ) : loading ? (
        <section className={styles.loading}>{c.loading}</section>
      ) : error ? (
        <section className={styles.error}><strong>!</strong><div><h3>{c.loadError}</h3><p>{error}</p><button type="button" onClick={() => void load()}><QBMSIcon name="refresh" size={16}/>{c.refresh}</button></div></section>
      ) : data && employee ? (
        <div className={styles.stack}>
          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <div className="qbms-eyebrow">{c.eyebrow}</div>
              <h2>{c.welcome}, {employee.display_name}</h2>
              <p>{c.heroBody}</p>
              <div className={styles.readyLine}><QBMSIcon name="check" size={16}/><span>{c.workspaceReady}</span></div>
            </div>
            <div className={styles.heroActions}>
              <span className={styles.activeBadge}><span />{c.active}</span>
              <Link href="/" className="qbms-secondary-button"><QBMSIcon name="grid" size={16}/>{c.modules}</Link>
              <button className="qbms-secondary-button" type="button" onClick={() => void load()}><QBMSIcon name="refresh" size={16}/>{c.refresh}</button>
            </div>
          </section>

          <section className={styles.summaryGrid}>
            <SummaryCard label={c.employeeId} value={valueOrDash(employee.employee_code, c.none)} icon="badge" />
            <SummaryCard label={c.businessUnit} value={valueOrDash(employee.business_unit_name, c.none)} icon="building" />
            <SummaryCard label={c.position} value={valueOrDash(employee.position_name, c.none)} icon="briefcase" />
            <SummaryCard label={c.grade} value={employee.grade_number ? `Grade ${employee.grade_number}` : c.none} icon="layers" />
          </section>

          <section className={styles.entryGrid}>
            <EntryCard title={c.myProfile} hint={c.myProfileHint} icon="users" target="#profile" status={c.available}/>
            <EntryCard title={c.myEmployment} hint={c.myEmploymentHint} icon="briefcase" target="#employment" status={c.available}/>
            <EntryCard title={c.myDocuments} hint={c.myDocumentsHint} icon="report" target="#documents" status={`${data.summary.document_count}`}/>
            <EntryCard title={c.myAssets} hint={c.myAssetsHint} icon="box" target="#assets" status={`${data.summary.asset_count}`}/>
            <EntryCard title={c.organizationChart} hint={c.organizationChartHint} icon="network" target="/organization/chart" status={c.available}/>
          </section>

          <section className={styles.twoColumn}>
            <article id="profile" className={styles.panel}>
              <PanelTitle icon="users" title={c.profileDetails}/>
              <div className={styles.factGrid}>
                <Fact label={c.companyEmail} value={employee.company_email} dash={c.none}/>
                <Fact label={c.mobile} value={employee.mobile} dash={c.none}/>
                <Fact label={c.personalEmail} value={employee.personal_email} dash={c.none}/>
                <Fact label={c.nationality} value={employee.nationality} dash={c.none}/>
                <Fact label={c.emergency} value={employee.emergency_contact_name ? `${employee.emergency_contact_name}${employee.emergency_relationship ? ` · ${employee.emergency_relationship}` : ''}${employee.emergency_phone ? ` · ${employee.emergency_phone}` : ''}` : null} dash={c.none}/>
                <Fact label="Bank" value={employee.bank_name ? `${employee.bank_name}${employee.bank_account_masked ? ` · ${employee.bank_account_masked}` : ''}` : null} dash={c.none}/>
              </div>
            </article>

            <article id="employment" className={styles.panel}>
              <PanelTitle icon="briefcase" title={c.employmentDetails}/>
              <div className={styles.factGrid}>
                <Fact label={c.employmentType} value={employee.employment_type} dash={c.none}/>
                <Fact label={c.startDate} value={dateLabel(employee.start_date, locale, c.none)} dash={c.none}/>
                <Fact label={c.workLocation} value={employee.work_location} dash={c.none}/>
                <Fact label={c.jobLevel} value={employee.job_level_name} dash={c.none}/>
                <Fact label={c.manager} value={managerName(employee, c.none)} dash={c.none}/>
                <Fact label={c.effectiveFrom} value={dateLabel(employee.assignment_effective_from, locale, c.none)} dash={c.none}/>
              </div>
              <div className={styles.rolesRow}><span>{c.roles}</span><div>{session?.roles?.length ? session.roles.map((role) => <em key={role.code}>{role.name}</em>) : <em>EMPLOYEE</em>}</div></div>
            </article>
          </section>

          <section className={styles.twoColumn}>
            <article id="documents" className={styles.panel}>
              <PanelTitle icon="report" title={c.documents} count={data.summary.document_count}/>
              {visibleDocuments.length ? <div className={styles.list}>{visibleDocuments.map((doc) => <div className={styles.listRow} key={doc.id}><span className={styles.listIcon}><QBMSIcon name="report" size={17}/></span><div><strong>{valueOrDash(doc.document_type, c.none)}</strong><small>{valueOrDash(doc.status, c.none)}</small></div>{doc.document_url ? <a href={doc.document_url} target="_blank" rel="noreferrer">{c.openDocument} ›</a> : null}</div>)}</div> : <div className={styles.empty}>{c.noDocuments}</div>}
            </article>

            <article id="assets" className={styles.panel}>
              <PanelTitle icon="box" title={c.assets} count={data.summary.asset_count}/>
              {visibleAssets.length ? <div className={styles.list}>{visibleAssets.map((asset) => <div className={styles.listRow} key={asset.assignment_id}><span className={styles.listIcon}><QBMSIcon name="box" size={17}/></span><div><strong>{valueOrDash(asset.asset_name || asset.asset_code, c.none)}</strong><small>{valueOrDash(asset.asset_code, c.none)}{asset.serial_number ? ` · ${c.serial}: ${asset.serial_number}` : ''}</small></div><span className={styles.mutedDate}>{dateLabel(asset.assigned_at, locale, c.none)}</span></div>)}</div> : <div className={styles.empty}>{c.noAssets}</div>}
            </article>
          </section>

          <section className={styles.toolsPanel}>
            <div className={styles.toolsHeader}><div><div className="qbms-eyebrow">EMPLOYEE TOOLS</div><h3>{c.toolsTitle}</h3><p>{c.toolsBody}</p></div><span className={styles.planBadge}>{c.planned}</span></div>
            <div className={styles.toolsGrid}>{reservedTools.map((tool) => <div className={styles.toolCard} key={tool.key}><span><QBMSIcon name={tool.icon} size={20}/></span><div><strong>{c[tool.key]}</strong><p>{c.reserved}</p></div><em>{c.planned}</em></div>)}</div>
          </section>
        </div>
      ) : null}
    </QBMSAppShell>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: QBMSIconName }) {
  return <div className={styles.summaryCard}><span><QBMSIcon name={icon} size={19}/></span><div><small>{label}</small><strong>{value}</strong></div></div>;
}

function EntryCard({ title, hint, icon, target, status }: { title: string; hint: string; icon: QBMSIconName; target: string; status: string }) {
  return <a href={target} className={styles.entryCard}><span className={styles.entryIcon}><QBMSIcon name={icon} size={20}/></span><div><strong>{title}</strong><p>{hint}</p></div><em>{status}</em><QBMSIcon name="chevron" size={17}/></a>;
}

function PanelTitle({ icon, title, count }: { icon: QBMSIconName; title: string; count?: number }) {
  return <div className={styles.panelTitle}><span><QBMSIcon name={icon} size={18}/></span><h3>{title}</h3>{typeof count === 'number' ? <em>{count}</em> : null}</div>;
}

function Fact({ label, value, dash }: { label: string; value: string | null | undefined; dash: string }) {
  return <div className={styles.fact}><span>{label}</span><strong>{valueOrDash(value, dash)}</strong></div>;
}
