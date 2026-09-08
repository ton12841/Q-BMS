'use client';

import Link from 'next/link';
import {useCallback, useEffect, useMemo, useState, type ReactNode} from 'react';
import QBMSAppShell, {QBMSIcon} from '@/components/layout/QBMSAppShell';
import {useI18n} from '@/i18n/useQBMSI18n';
import {
  approveOnboarding,
  fetchOnboardingReview,
  fetchOnboardingReviews,
  requestOnboardingChanges,
  type ReviewCase,
  type ReviewDetail,
} from './onboardingReview.api';
import styles from './OnboardingReviewPage.module.css';

const COPY = {
  en: {
    title: 'HR Onboarding Review', description: 'Review employee self-onboarding submissions before Asset Gate.', search: 'Search employee, email, Business Unit or Position...',
    eyebrow: 'HRM / ONBOARDING REVIEW', hero: 'Review new employee onboarding', heroBody: 'HR verifies the employee-submitted information. Approve to continue to Asset Gate, or request changes to return the profile to the employee.',
    pending: 'Pending Review', changes: 'Changes Requested', approved: 'HR Approved', queue: 'Review Queue', queueHint: 'Submitted onboarding cases requiring HR action.',
    noCases: 'No onboarding review cases found.', select: 'Select an employee to review the submitted information.', details: 'Employee Details', personal: 'Personal Information', emergency: 'Emergency Contact', bank: 'Bank Information', documents: 'Documents', policy: 'Policy', workflow: 'Workflow Tasks', history: 'Review History',
    employeeCode: 'Employee ID', companyEmail: 'Company Email', businessUnit: 'Business Unit', position: 'Position', grade: 'Grade / Level', submitted: 'Submitted',
    reviewNote: 'HR Review Note', reviewNoteHint: 'Required when requesting changes. Optional when approving.', requestChanges: 'Request Changes', approve: 'Approve HR Review', working: 'Saving...', refresh: 'Refresh',
    changesReasonRequired: 'Please enter the reason for requested changes.', confirmChanges: 'Return this onboarding profile to the employee for changes?', confirmApprove: 'Approve this onboarding submission and continue to Asset Gate?',
    readyAsset: 'HR Review completed. This employee is ready for Asset Gate.', openAssetGate: 'Open Asset Gate', returned: 'Changes requested. The employee profile is unlocked for editing and resubmission.',
    none: '—', accepted: 'Acknowledged', notAccepted: 'Not acknowledged', openDocument: 'Open document', completed: 'Completed', taskPending: 'Pending', back: 'Employee Master',
  },
  th: {
    title: 'ตรวจสอบ Onboarding โดย HR', description: 'ตรวจข้อมูล Self-Onboarding ของพนักงานก่อนเข้าสู่ Asset Gate', search: 'ค้นหาพนักงาน อีเมล สายธุรกิจ หรือตำแหน่ง...',
    eyebrow: 'HRM / ONBOARDING REVIEW', hero: 'ตรวจสอบข้อมูลพนักงานใหม่', heroBody: 'HR ตรวจข้อมูลที่พนักงานกรอก หากถูกต้องให้อนุมัติเพื่อไป Asset Gate หรือส่งกลับให้พนักงานแก้ไขก่อน',
    pending: 'รอ HR ตรวจ', changes: 'ส่งกลับแก้ไข', approved: 'HR อนุมัติแล้ว', queue: 'คิวตรวจสอบ', queueHint: 'รายการ Onboarding ที่ส่งมาให้ HR ดำเนินการ',
    noCases: 'ไม่พบรายการ Onboarding ที่ต้องตรวจ', select: 'เลือกพนักงานเพื่อดูและตรวจสอบข้อมูลที่ส่งมา', details: 'ข้อมูลพนักงาน', personal: 'ข้อมูลส่วนตัว', emergency: 'ผู้ติดต่อฉุกเฉิน', bank: 'บัญชีธนาคาร', documents: 'เอกสาร', policy: 'นโยบาย', workflow: 'Workflow Tasks', history: 'ประวัติการตรวจ',
    employeeCode: 'รหัสพนักงาน', companyEmail: 'อีเมลบริษัท', businessUnit: 'สายธุรกิจ', position: 'ตำแหน่ง', grade: 'เกรด / ระดับ', submitted: 'วันที่ส่ง',
    reviewNote: 'หมายเหตุ HR Review', reviewNoteHint: 'จำเป็นเมื่อส่งกลับแก้ไข และไม่บังคับเมื่ออนุมัติ', requestChanges: 'ส่งกลับให้แก้ไข', approve: 'อนุมัติ HR Review', working: 'กำลังบันทึก...', refresh: 'รีเฟรช',
    changesReasonRequired: 'กรุณาระบุเหตุผลที่ต้องการให้พนักงานแก้ไข', confirmChanges: 'ยืนยันส่งข้อมูลกลับให้พนักงานแก้ไข?', confirmApprove: 'ยืนยันอนุมัติข้อมูลและส่งต่อไป Asset Gate?',
    readyAsset: 'HR Review เสร็จแล้ว พนักงานพร้อมเข้าสู่ Asset Gate', openAssetGate: 'เปิด Asset Gate', returned: 'ส่งกลับให้แก้ไขแล้ว ระบบปลดล็อกข้อมูลให้พนักงานแก้ไขและส่งใหม่ได้',
    none: '—', accepted: 'ยอมรับแล้ว', notAccepted: 'ยังไม่ยอมรับ', openDocument: 'เปิดเอกสาร', completed: 'เสร็จแล้ว', taskPending: 'รอดำเนินการ', back: 'Employee Master',
  },
  lo: {
    title: 'HR Onboarding Review', description: 'ກວດຂໍ້ມູນ Self-Onboarding ກ່ອນເຂົ້າ Asset Gate', search: 'ຄົ້ນຫາພະນັກງານ, ອີເມວ, ສາຍທຸລະກິດ ຫຼື ຕຳແໜ່ງ...',
    eyebrow: 'HRM / ONBOARDING REVIEW', hero: 'ກວດຂໍ້ມູນພະນັກງານໃໝ່', heroBody: 'HR ກວດຂໍ້ມູນທີ່ພະນັກງານສົ່ງ. ອະນຸມັດເພື່ອໄປ Asset Gate ຫຼື ສົ່ງກັບໃຫ້ແກ້ໄຂ.',
    pending: 'ລໍຖ້າ HR ກວດ', changes: 'ສົ່ງກັບແກ້ໄຂ', approved: 'HR ອະນຸມັດ', queue: 'ຄິວກວດສອບ', queueHint: 'ລາຍການ Onboarding ທີ່ສົ່ງໃຫ້ HR',
    noCases: 'ບໍ່ພົບລາຍການ Onboarding', select: 'ເລືອກພະນັກງານເພື່ອກວດຂໍ້ມູນ', details: 'ຂໍ້ມູນພະນັກງານ', personal: 'ຂໍ້ມູນສ່ວນຕົວ', emergency: 'ຜູ້ຕິດຕໍ່ສຸກເສີນ', bank: 'ທະນາຄານ', documents: 'ເອກະສານ', policy: 'ນະໂຍບາຍ', workflow: 'Workflow Tasks', history: 'ປະຫວັດການກວດ',
    employeeCode: 'ລະຫັດພະນັກງານ', companyEmail: 'ອີເມວບໍລິສັດ', businessUnit: 'ສາຍທຸລະກິດ', position: 'ຕຳແໜ່ງ', grade: 'ເກຣດ / ລະດັບ', submitted: 'ວັນທີສົ່ງ',
    reviewNote: 'ໝາຍເຫດ HR Review', reviewNoteHint: 'ຈຳເປັນເມື່ອສົ່ງກັບແກ້ໄຂ', requestChanges: 'ສົ່ງກັບແກ້ໄຂ', approve: 'ອະນຸມັດ HR Review', working: 'ກຳລັງບັນທຶກ...', refresh: 'ຣີເຟຣຊ',
    changesReasonRequired: 'ກະລຸນາລະບຸເຫດຜົນທີ່ຕ້ອງແກ້ໄຂ', confirmChanges: 'ຢືນຢັນສົ່ງກັບໃຫ້ພະນັກງານແກ້ໄຂ?', confirmApprove: 'ຢືນຢັນອະນຸມັດແລະສົ່ງຕໍ່ Asset Gate?',
    readyAsset: 'HR Review ສຳເລັດ ພະນັກງານພ້ອມເຂົ້າ Asset Gate', openAssetGate: 'ເປີດ Asset Gate', returned: 'ສົ່ງກັບແກ້ໄຂແລ້ວ ພະນັກງານສາມາດແກ້ແລະສົ່ງໃໝ່ໄດ້',
    none: '—', accepted: 'ຍອມຮັບແລ້ວ', notAccepted: 'ຍັງບໍ່ຍອມຮັບ', openDocument: 'ເປີດເອກະສານ', completed: 'ສຳເລັດ', taskPending: 'ລໍຖ້າ', back: 'Employee Master',
  },
} as const;

type LocaleKey = keyof typeof COPY;

function fullName(row: ReviewCase) {
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ');
  return row.nickname ? `${name} (${row.nickname})` : name;
}

function statusLabel(status: string, c: any) {
  if (status === 'HR_APPROVED') return c.approved;
  if (status === 'CHANGES_REQUESTED') return c.changes;
  return c.pending;
}

function fmt(value: string | null | undefined, locale: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(locale);
}

function value(v: unknown, fallback = '—') {
  const text = String(v ?? '').trim();
  return text || fallback;
}

export default function OnboardingReviewPageClient() {
  const {locale} = useI18n();
  const c = COPY[(locale in COPY ? locale : 'en') as LocaleKey];
  const [rows, setRows] = useState<ReviewCase[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReviewDetail | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const loadRows = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await fetchOnboardingReviews(locale);
      setRows(data);
      setSelectedId((current) => current && data.some((row) => String(row.employee_id) === current) ? current : (data[0] ? String(data[0].employee_id) : null));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load HR Review.'); }
    finally { setLoading(false); }
  }, [locale]);

  const loadDetail = useCallback(async (employeeId: string) => {
    setDetailLoading(true); setError('');
    try { setDetail(await fetchOnboardingReview(employeeId, locale)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load HR Review detail.'); }
    finally { setDetailLoading(false); }
  }, [locale]);

  useEffect(() => { void loadRows(); }, [loadRows]);
  useEffect(() => { if (selectedId) void loadDetail(selectedId); else setDetail(null); }, [selectedId, loadDetail]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => [row.employee_code, row.first_name, row.last_name, row.nickname, row.company_email, row.business_unit_name, row.position_name, row.job_grade_name, row.job_level_name]
      .filter(Boolean).some((item) => String(item).toLowerCase().includes(q)));
  }, [rows, query]);

  const counts = useMemo(() => ({
    pending: rows.filter((r) => r.case_status === 'SUBMITTED').length,
    changes: rows.filter((r) => r.case_status === 'CHANGES_REQUESTED').length,
    approved: rows.filter((r) => r.case_status === 'HR_APPROVED').length,
  }), [rows]);

  async function refreshAfterAction(next: ReviewDetail) {
    setDetail(next); setNote('');
    await loadRows();
    setSelectedId(String(next.onboarding.employee.id));
  }

  async function handleChanges() {
    if (!selectedId) return;
    if (!note.trim()) { setError(c.changesReasonRequired); return; }
    if (!window.confirm(c.confirmChanges)) return;
    setWorking(true); setError('');
    try { await refreshAfterAction(await requestOnboardingChanges(selectedId, note.trim(), locale)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to request changes.'); }
    finally { setWorking(false); }
  }

  async function handleApprove() {
    if (!selectedId) return;
    if (!window.confirm(c.confirmApprove)) return;
    setWorking(true); setError('');
    try { await refreshAfterAction(await approveOnboarding(selectedId, note.trim(), locale)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to approve onboarding.'); }
    finally { setWorking(false); }
  }

  return (
    <QBMSAppShell pageTitle={c.title} pageDescription={c.description} searchValue={query} onSearchChange={setQuery} searchPlaceholder={c.search}>
      <div className="qbms-breadcrumb"><Link href="/">Modules & Tools</Link><span>›</span><Link href="/employees">Employee</Link><span>›</span><strong>{c.title}</strong></div>

      <section className="qbms-master-header">
        <div><div className="qbms-eyebrow">{c.eyebrow}</div><h2>{c.hero}</h2><p>{c.heroBody}</p></div>
        <div className="qbms-master-header-actions">
          <Link className="qbms-secondary-button" href="/employees"><QBMSIcon name="arrowLeft" size={16}/>{c.back}</Link>
          <button className="qbms-secondary-button" type="button" onClick={() => void loadRows()}><QBMSIcon name="refresh" size={16}/>{c.refresh}</button>
        </div>
      </section>

      <section className="qbms-master-stats">
        <div className="qbms-stat-card"><span>{c.pending}</span><strong>{counts.pending}</strong><small>SUBMITTED</small></div>
        <div className="qbms-stat-card"><span>{c.changes}</span><strong>{counts.changes}</strong><small>CHANGES_REQUESTED</small></div>
        <div className="qbms-stat-card"><span>{c.approved}</span><strong>{counts.approved}</strong><small>Ready for Asset Gate</small></div>
      </section>

      {error ? <section className={styles.error}><strong>!</strong><span>{error}</span></section> : null}

      <section className={styles.workspace}>
        <aside className={styles.queue}>
          <div className={styles.panelHeader}><div><h3>{c.queue}</h3><p>{c.queueHint}</p></div><span>{filtered.length}</span></div>
          {loading ? <div className={styles.empty}>Loading...</div> : filtered.length ? <div className={styles.queueList}>{filtered.map((row) => (
            <button key={row.employee_id} type="button" onClick={() => setSelectedId(String(row.employee_id))} className={`${styles.queueItem} ${selectedId === String(row.employee_id) ? styles.selected : ''}`}>
              <div className={styles.avatar}>{row.first_name?.slice(0,1)?.toUpperCase() || '?'}</div>
              <div className={styles.queueBody}><strong>{fullName(row)}</strong><span>{row.employee_code} · {row.position_name || c.none}</span><small>{row.business_unit_name || c.none}</small></div>
              <em className={`${styles.status} ${row.case_status === 'HR_APPROVED' ? styles.statusApproved : row.case_status === 'CHANGES_REQUESTED' ? styles.statusChanges : styles.statusPending}`}>{statusLabel(row.case_status,c)}</em>
            </button>
          ))}</div> : <div className={styles.empty}>{c.noCases}</div>}
        </aside>

        <main className={styles.reviewPane}>
          {!selectedId ? <div className={styles.emptyLarge}>{c.select}</div> : detailLoading || !detail ? <div className={styles.emptyLarge}>Loading...</div> : <ReviewDetailView detail={detail} c={c} locale={locale} note={note} setNote={setNote} working={working} onChanges={handleChanges} onApprove={handleApprove}/>} 
        </main>
      </section>
    </QBMSAppShell>
  );
}

function ReviewDetailView({detail,c,locale,note,setNote,working,onChanges,onApprove}: any) {
  const bundle = detail.onboarding;
  const e = bundle.employee;
  const status = String(detail.review_case.case_status || 'SUBMITTED');
  const actionable = status === 'SUBMITTED';
  return <div className={styles.detailStack}>
    <section className={styles.employeeHero}>
      <div className={styles.heroIdentity}><div className={styles.bigAvatar}>{String(e.first_name || '?').slice(0,1).toUpperCase()}</div><div><span>{e.employee_code}</span><h2>{[e.first_name,e.last_name].filter(Boolean).join(' ')}</h2><p>{e.company_email || c.none}</p></div></div>
      <div className={`${styles.heroStatus} ${status === 'HR_APPROVED' ? styles.approvedBox : status === 'CHANGES_REQUESTED' ? styles.changesBox : styles.pendingBox}`}><span>{statusLabel(status,c)}</span><strong>{bundle.workflow_progress}%</strong><small>Workflow</small></div>
    </section>

    {status === 'HR_APPROVED' ? <section className={styles.successBanner}><QBMSIcon name="check" size={18}/><strong>{c.readyAsset}</strong><Link className="qbms-secondary-button" href="/hrm/asset-gate">{c.openAssetGate}</Link></section> : null}
    {status === 'CHANGES_REQUESTED' ? <section className={styles.changesBanner}><QBMSIcon name="refresh" size={18}/><strong>{c.returned}</strong></section> : null}

    <section className={styles.summaryGrid}>
      <Info label={c.employeeCode} value={e.employee_code}/><Info label={c.companyEmail} value={e.company_email}/><Info label={c.businessUnit} value={e.business_unit_name}/><Info label={c.position} value={e.position_name}/><Info label={c.grade} value={e.grade_number ? `Grade ${e.grade_number}${e.job_level_name ? ` · ${e.job_level_name}` : ''}` : c.none}/><Info label={c.submitted} value={fmt(detail.review_case.submitted_at,locale)}/>
    </section>

    <Section title={c.personal}><div className={styles.dataGrid}><Info label="Name" value={[e.first_name,e.last_name].filter(Boolean).join(' ')}/><Info label="Nickname" value={e.nickname}/><Info label="Date of Birth" value={bundle.personal?.date_of_birth?.slice?.(0,10)}/><Info label="Gender" value={bundle.personal?.gender}/><Info label="Nationality" value={bundle.personal?.nationality}/><Info label="National ID / Passport" value={bundle.personal?.national_id}/><Info label="Mobile" value={bundle.personal?.mobile}/><Info label="Personal Email" value={bundle.personal?.personal_email}/><Info wide label="Current Address" value={bundle.personal?.current_address}/><Info wide label="Permanent Address" value={bundle.personal?.permanent_address}/></div></Section>
    <div className={styles.twoCol}><Section title={c.emergency}><div className={styles.dataGrid}><Info label="Contact Name" value={bundle.emergency?.contact_name}/><Info label="Relationship" value={bundle.emergency?.relationship}/><Info label="Phone" value={bundle.emergency?.phone}/><Info label="Alternate Phone" value={bundle.emergency?.alternate_phone}/></div></Section><Section title={c.bank}><div className={styles.dataGrid}><Info label="Bank" value={bundle.bank?.bank_name}/><Info label="Account Name" value={bundle.bank?.account_name}/><Info label="Account Number" value={bundle.bank?.account_number}/><Info label="Currency" value={bundle.bank?.currency}/><Info label="Branch" value={bundle.bank?.bank_branch}/></div></Section></div>

    <div className={styles.twoCol}><Section title={c.documents}>{bundle.documents?.length ? <div className={styles.docList}>{bundle.documents.map((d:any)=><a href={d.document_url} key={d.id} target="_blank" rel="noreferrer"><div><strong>{d.document_type}</strong><small>{d.status}</small></div><span>{c.openDocument} ↗</span></a>)}</div> : <p className={styles.muted}>{c.none}</p>}</Section><Section title={c.policy}><div className={styles.policy}><strong>Employee Handbook</strong><span className={bundle.policy ? styles.policyOk : styles.policyMissing}>{bundle.policy ? c.accepted : c.notAccepted}</span>{bundle.policy ? <small>Version {bundle.policy.policy_version} · {fmt(bundle.policy.acknowledged_at,locale)}</small> : null}</div></Section></div>

    <Section title={c.workflow}><div className={styles.taskList}>{bundle.tasks.map((task:any)=><div key={task.task_code}><span className={task.task_status === 'COMPLETED' ? styles.taskDone : styles.taskOpen}>{task.task_status === 'COMPLETED' ? '✓' : ''}</span><div><strong>{task.task_name}</strong><small>{task.owner_type}</small></div><em>{task.task_status === 'COMPLETED' ? c.completed : c.taskPending}</em></div>)}</div></Section>

    <Section title={c.history}>{detail.history.length ? <div className={styles.history}>{detail.history.map((h:any)=><div key={h.id}><span className={h.review_action === 'APPROVED' ? styles.historyApproved : styles.historyChanges}>{h.review_action}</span><div><strong>{h.review_note || c.none}</strong><small>{fmt(h.created_at,locale)}</small></div></div>)}</div> : <p className={styles.muted}>{c.none}</p>}</Section>

    <section className={styles.actionCard}>
      <label><span>{c.reviewNote}</span><textarea value={note} onChange={(ev)=>setNote(ev.target.value)} disabled={working || !actionable} placeholder={c.reviewNoteHint}/></label>
      <div className={styles.actionFooter}><small>{c.reviewNoteHint}</small><div><button type="button" className={styles.requestButton} disabled={working || !actionable} onClick={onChanges}>{working ? c.working : c.requestChanges}</button><button type="button" className={styles.approveButton} disabled={working || !actionable} onClick={onApprove}><QBMSIcon name="check" size={16}/>{working ? c.working : c.approve}</button></div></div>
    </section>
  </div>;
}

function Section({title,children}: {title:string;children:ReactNode}) { return <section className={styles.card}><div className={styles.sectionTitle}><h3>{title}</h3></div>{children}</section>; }
function Info({label,value:raw,wide=false}: {label:string;value:unknown;wide?:boolean}) { return <div className={`${styles.info} ${wide ? styles.wide : ''}`}><span>{label}</span><strong>{value(raw)}</strong></div>; }
