'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import QBMSAppShell, { QBMSIcon } from '@/components/layout/QBMSAppShell';
import { useI18n } from '@/i18n/useQBMSI18n';
import { fetchOnboardingQaDetail, fetchOnboardingQaEmployees, type OnboardingQaDetail, type QaEmployeeRow } from './onboardingE2E.api';
import styles from './OnboardingE2EQAPage.module.css';

const COPY: Record<string, Record<string, string>> = {
  en: { title:'Onboarding E2E QA', description:'Development-only checkpoint for the canonical Employee Onboarding flow.', search:'Search employee code, name or email...', eyebrow:'QA / EMPLOYEE ONBOARDING', hero:'Verify the full 9-step onboarding flow before moving on', heroBody:'This screen is read-only. It inspects real Q BMS workflow data and shows the first unfinished step without bypassing permissions, Google Login or business gates.', employees:'Employees', progress:'E2E Progress', current:'Current Step', blockers:'Blockers', noBlockers:'No structural blockers detected.', open:'Open Step', complete:'E2E COMPLETE', refresh:'Refresh', employeeMaster:'Employee Master', choose:'Select an employee to inspect the complete onboarding lifecycle.', test:'QA TEST', live:'EMPLOYEE', done:'Done', waiting:'Waiting', currentBadge:'Current' },
  th: { title:'Onboarding E2E QA', description:'จุดตรวจสอบ End-to-End สำหรับ Employee Onboarding ในโหมดพัฒนา', search:'ค้นหารหัสพนักงาน ชื่อ หรืออีเมล...', eyebrow:'QA / EMPLOYEE ONBOARDING', hero:'ตรวจ Flow Onboarding 9 ขั้นให้ผ่านจริงก่อนพัฒนาส่วนถัดไป', heroBody:'หน้านี้เป็น Read-only และอ่านสถานะ Workflow จริงจาก Q BMS โดยไม่ข้าม Permission, Google Login หรือ Business Gate ใด ๆ', employees:'พนักงาน', progress:'ความคืบหน้า E2E', current:'ขั้นตอนปัจจุบัน', blockers:'สิ่งที่ต้องแก้', noBlockers:'ไม่พบปัญหาโครงสร้างที่ขวาง Flow', open:'เปิดขั้นตอนนี้', complete:'E2E COMPLETE', refresh:'รีเฟรช', employeeMaster:'Employee Master', choose:'เลือกพนักงานเพื่อตรวจ Employee Onboarding ตั้งแต่ Step 1 ถึง Step 9', test:'QA TEST', live:'EMPLOYEE', done:'ผ่านแล้ว', waiting:'รอ', currentBadge:'กำลังทดสอบ' },
  lo: { title:'Onboarding E2E QA', description:'ກວດ End-to-End Employee Onboarding ໃນໂໝດພັດທະນາ', search:'ຄົ້ນຫາລະຫັດ, ຊື່ ຫຼື ອີເມວ...', eyebrow:'QA / EMPLOYEE ONBOARDING', hero:'ກວດ Onboarding 9 ຂັ້ນໃຫ້ຄົບກ່ອນໄປສ່ວນຕໍ່ໄປ', heroBody:'ໜ້ານີ້ເປັນ Read-only ແລະອ່ານ Workflow ຈິງໂດຍບໍ່ຂ້າມ Permission ຫຼື Google Login.', employees:'ພະນັກງານ', progress:'E2E Progress', current:'ຂັ້ນຕອນປັດຈຸບັນ', blockers:'Blockers', noBlockers:'ບໍ່ພົບ blocker', open:'ເປີດຂັ້ນຕອນ', complete:'E2E COMPLETE', refresh:'Refresh', employeeMaster:'Employee Master', choose:'ເລືອກພະນັກງານເພື່ອກວດ Step 1-9', test:'QA TEST', live:'EMPLOYEE', done:'Done', waiting:'Waiting', currentBadge:'Current' },
};

function fullName(row: any) {
  const value = [row.first_name, row.last_name].filter(Boolean).join(' ');
  return row.nickname ? `${value} (${row.nickname})` : value;
}

export default function OnboardingE2EQAPageClient() {
  const { locale } = useI18n();
  const c = COPY[locale] || COPY.en;
  const [rows, setRows] = useState<QaEmployeeRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<OnboardingQaDetail | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRows = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await fetchOnboardingQaEmployees();
      setRows(data);
      setSelectedId((current) => current && data.some((r) => String(r.employee_id) === current) ? current : (data[0] ? String(data[0].employee_id) : null));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load QA data.'); }
    finally { setLoading(false); }
  }, []);

  const loadDetail = useCallback(async (employeeId: string) => {
    setError('');
    try { setDetail(await fetchOnboardingQaDetail(employeeId)); }
    catch (e) { setDetail(null); setError(e instanceof Error ? e.message : 'Unable to load QA detail.'); }
  }, []);

  useEffect(() => { void loadRows(); }, [loadRows]);
  useEffect(() => { if (selectedId) void loadDetail(selectedId); else setDetail(null); }, [selectedId, loadDetail]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => [row.employee_code,row.first_name,row.last_name,row.nickname,row.company_email].filter(Boolean).some((value) => String(value).toLowerCase().includes(q)));
  }, [rows, query]);

  return <QBMSAppShell pageTitle={c.title} pageDescription={c.description} searchValue={query} onSearchChange={setQuery} searchPlaceholder={c.search}>
    <div className="qbms-breadcrumb"><Link href="/">Modules & Tools</Link><span>›</span><Link href="/employees">Employee</Link><span>›</span><strong>{c.title}</strong></div>
    <section className="qbms-master-header"><div><div className="qbms-eyebrow">{c.eyebrow}</div><h2>{c.hero}</h2><p>{c.heroBody}</p></div><div className="qbms-master-header-actions"><Link href="/employees" className="qbms-secondary-button"><QBMSIcon name="arrowLeft" size={16}/>{c.employeeMaster}</Link><button className="qbms-secondary-button" onClick={() => { void loadRows(); if (selectedId) void loadDetail(selectedId); }}><QBMSIcon name="refresh" size={16}/>{c.refresh}</button></div></section>
    {error ? <section className={styles.error}><strong>!</strong><span>{error}</span></section> : null}
    <section className={styles.workspace}>
      <aside className={styles.queue}><div className={styles.panelHeader}><div><h3>{c.employees}</h3><p>Development QA</p></div><span>{filtered.length}</span></div>{loading ? <div className={styles.empty}>Loading...</div> : filtered.length ? <div className={styles.queueList}>{filtered.map((row) => <button key={row.employee_id} className={`${styles.queueItem} ${selectedId === String(row.employee_id) ? styles.selected : ''}`} onClick={() => setSelectedId(String(row.employee_id))}><div className={styles.avatar}>{row.first_name?.slice(0,1)?.toUpperCase() || '?'}</div><div className={styles.queueBody}><strong>{fullName(row)}</strong><span>{row.employee_code} · {row.company_email || 'Waiting for IT'}</span><small>{row.employee_status} · {row.onboarding_case_status}</small></div><em className={row.is_test_account ? styles.testBadge : styles.employeeBadge}>{row.is_test_account ? c.test : c.live}</em></button>)}</div> : <div className={styles.empty}>No employees.</div>}</aside>
      <main className={styles.detail}>{!selectedId ? <div className={styles.emptyLarge}>{c.choose}</div> : !detail ? <div className={styles.emptyLarge}>Loading...</div> : <QaDetail detail={detail} c={c}/>}</main>
    </section>
  </QBMSAppShell>;
}

function QaDetail({ detail, c }: { detail: OnboardingQaDetail; c: Record<string,string> }) {
  const e = detail.employee;
  return <div className={styles.stack}>
    <section className={styles.hero}><div><span>{e.employee_code}</span><h2>{fullName(e)}</h2><p>{e.company_email || 'Company Email pending'} · {e.position_name || 'No Position'}</p></div><div className={detail.e2eComplete ? styles.completeBadge : styles.progressBadge}><strong>{detail.e2eComplete ? c.complete : `${detail.completedSteps}/9`}</strong><small>{detail.e2eComplete ? 'Employee Workspace Ready' : c.progress}</small></div></section>
    <section className={styles.progressBar}><div style={{width:`${Math.round((detail.completedSteps / 9) * 100)}%`}} /></section>
    {detail.currentStep && !detail.e2eComplete ? <section className={styles.current}><QBMSIcon name="clock" size={18}/><div><strong>{c.current}: Step {detail.currentStep.number} — {detail.currentStep.title}</strong><span>{detail.currentStep.evidence}</span></div><Link href={detail.currentStep.href}>{c.open}<QBMSIcon name="chevron" size={15}/></Link></section> : null}
    <section className={styles.steps}>{detail.steps.map((step) => <article key={step.code} className={`${styles.step} ${step.status === 'DONE' ? styles.stepDone : step.status === 'CURRENT' ? styles.stepCurrent : styles.stepWaiting}`}><div className={styles.stepNumber}>{step.done ? '✓' : step.number}</div><div className={styles.stepBody}><div><strong>{step.number}. {step.title}</strong><span className={styles.status}>{step.status === 'DONE' ? c.done : step.status === 'CURRENT' ? c.currentBadge : c.waiting}</span></div><p>{step.evidence}</p></div><Link href={step.href} aria-label={c.open}><QBMSIcon name="chevron" size={16}/></Link></article>)}</section>
    <section className={styles.card}><div className={styles.cardTitle}><h3>{c.blockers}</h3><span>{detail.blockers.length}</span></div>{detail.blockers.length ? <div className={styles.blockers}>{detail.blockers.map((item) => <div key={item}><strong>!</strong><span>{item}</span></div>)}</div> : <div className={styles.noBlockers}><QBMSIcon name="check" size={17}/>{c.noBlockers}</div>}</section>
    <section className={styles.card}><div className={styles.cardTitle}><h3>Workflow Snapshot</h3></div><div className={styles.facts}><div><span>Employee</span><strong>{e.employee_status}</strong></div><div><span>Profile</span><strong>{e.profile_status}</strong></div><div><span>IT Setup</span><strong>{detail.accountSetup?.request_status || 'NOT_STARTED'}</strong></div><div><span>Invitation</span><strong>{detail.invitation?.invitation_status || 'NOT_STARTED'}</strong></div><div><span>Onboarding Case</span><strong>{detail.onboardingCase?.case_status || 'NOT_STARTED'}</strong></div><div><span>Q BMS User</span><strong>{e.user_account_status || 'NOT_LINKED'}</strong></div></div></section>
  </div>;
}
