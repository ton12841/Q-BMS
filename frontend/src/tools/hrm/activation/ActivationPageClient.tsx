'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import QBMSAppShell, { QBMSIcon } from '@/components/layout/QBMSAppShell';
import { useI18n } from '@/i18n/useQBMSI18n';
import { activateEmployee, fetchActivation, fetchActivations, type ActivationCase, type ActivationDetail } from './activation.api';
import styles from './ActivationPage.module.css';

const COPY: Record<string, Record<string, string>> = {
  en: { title:'Employee Activation', description:'Final onboarding gate before Employee Workspace access.', search:'Search employee, Business Unit or Position...', eyebrow:'HRM / ACTIVATION', hero:'Activate employee after every onboarding gate passes', heroBody:'Activation is the final controlled step. Q BMS verifies IT setup, Google identity, self-onboarding, HR Review, Asset Gate and employment assignment before switching Employee + User to ACTIVE.', queue:'Activation Queue', ready:'Ready to Activate', active:'Activated', refresh:'Refresh', employeeMaster:'Employee Master', assetGate:'Asset Gate', noCases:'No activation cases found.', select:'Select an employee to review activation readiness.', checklist:'Activation Readiness', facts:'Account & Employment', note:'Activation Note', activate:'Activate Employee', confirm:'Activate this employee and grant Employee Workspace access?', working:'Activating...', next:'Next Step: Employee Workspace', history:'Activation History', none:'—', passed:'Passed', blocked:'Blocked' },
  th: { title:'Employee Activation', description:'ขั้นตอนสุดท้ายของ Onboarding ก่อนเข้า Employee Workspace', search:'ค้นหาพนักงาน สายธุรกิจ หรือตำแหน่ง...', eyebrow:'HRM / ACTIVATION', hero:'Activate พนักงานเมื่อ Onboarding ทุก Gate ผ่านแล้ว', heroBody:'Activation เป็นขั้นตอนควบคุมสุดท้าย Q BMS จะตรวจ IT Setup, Google Identity, Self-Onboarding, HR Review, Asset Gate และ Employment Assignment ก่อนเปลี่ยน Employee + User เป็น ACTIVE', queue:'คิว Activation', ready:'พร้อม Activate', active:'Activated', refresh:'รีเฟรช', employeeMaster:'Employee Master', assetGate:'Asset Gate', noCases:'ไม่พบรายการ Activation', select:'เลือกพนักงานเพื่อตรวจความพร้อมก่อน Activate', checklist:'ตรวจความพร้อม Activation', facts:'Account & Employment', note:'หมายเหตุ Activation', activate:'Activate Employee', confirm:'ยืนยัน Activate พนักงานและเปิดสิทธิ์ Employee Workspace?', working:'กำลัง Activate...', next:'ขั้นตอนถัดไป: Employee Workspace', history:'ประวัติ Activation', none:'—', passed:'ผ่าน', blocked:'ยังไม่ผ่าน' },
  lo: { title:'Employee Activation', description:'ຂັ້ນຕອນສຸດທ້າຍກ່ອນ Employee Workspace', search:'ຄົ້ນຫາພະນັກງານ, ສາຍທຸລະກິດ ຫຼື ຕຳແໜ່ງ...', eyebrow:'HRM / ACTIVATION', hero:'Activate ພະນັກງານຫຼັງຈາກ Onboarding ຜ່ານຄົບ', heroBody:'Q BMS ຈະກວດ IT Setup, Google Identity, Self-Onboarding, HR Review, Asset Gate ແລະ Employment Assignment ກ່ອນປ່ຽນ Employee + User ເປັນ ACTIVE.', queue:'Activation Queue', ready:'ພ້ອມ Activate', active:'Activated', refresh:'Refresh', employeeMaster:'Employee Master', assetGate:'Asset Gate', noCases:'ບໍ່ພົບ Activation', select:'ເລືອກພະນັກງານເພື່ອກວດຄວາມພ້ອມ', checklist:'Activation Readiness', facts:'Account & Employment', note:'Activation Note', activate:'Activate Employee', confirm:'ຢືນຢັນ Activate ແລະເປີດ Employee Workspace?', working:'ກຳລັງ Activate...', next:'ຂັ້ນຕໍ່ໄປ: Employee Workspace', history:'Activation History', none:'—', passed:'Passed', blocked:'Blocked' },
};

function fullName(row: any) {
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ');
  return row.nickname ? `${name} (${row.nickname})` : name;
}

export default function ActivationPageClient() {
  const { locale } = useI18n();
  const c = COPY[locale] || COPY.en;
  const [rows, setRows] = useState<ActivationCase[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ActivationDetail | null>(null);
  const [query, setQuery] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const loadRows = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await fetchActivations(locale);
      setRows(data);
      setSelectedId((current) => current && data.some((row) => String(row.employee_id) === current) ? current : (data[0] ? String(data[0].employee_id) : null));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load Employee Activation.'); }
    finally { setLoading(false); }
  }, [locale]);

  const loadDetail = useCallback(async (id: string) => {
    setError('');
    try { setDetail(await fetchActivation(id, locale)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load Employee Activation detail.'); }
  }, [locale]);

  useEffect(() => { void loadRows(); }, [loadRows]);
  useEffect(() => { if (selectedId) void loadDetail(selectedId); else setDetail(null); }, [selectedId, loadDetail]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => [row.employee_code,row.first_name,row.last_name,row.nickname,row.company_email,row.business_unit_name,row.position_name].filter(Boolean).some((value) => String(value).toLowerCase().includes(q)));
  }, [rows, query]);

  const counts = useMemo(() => ({
    ready: rows.filter((row) => row.case_status === 'ASSET_COMPLETED').length,
    active: rows.filter((row) => row.case_status === 'COMPLETED' && row.employee_status === 'ACTIVE').length,
  }), [rows]);

  async function handleActivate() {
    if (!selectedId || !detail?.can_activate || working) return;
    if (!window.confirm(c.confirm)) return;
    setWorking(true); setError('');
    try {
      const next = await activateEmployee(selectedId, note, locale);
      setDetail(next); setNote(''); await loadRows(); setSelectedId(selectedId);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to activate employee.'); }
    finally { setWorking(false); }
  }

  return <QBMSAppShell pageTitle={c.title} pageDescription={c.description} searchValue={query} onSearchChange={setQuery} searchPlaceholder={c.search}>
    <div className="qbms-breadcrumb"><Link href="/">Modules & Tools</Link><span>›</span><Link href="/employees">Employee</Link><span>›</span><strong>{c.title}</strong></div>
    <section className="qbms-master-header"><div><div className="qbms-eyebrow">{c.eyebrow}</div><h2>{c.hero}</h2><p>{c.heroBody}</p></div><div className="qbms-master-header-actions"><Link className="qbms-secondary-button" href="/hrm/asset-gate"><QBMSIcon name="box" size={16}/>{c.assetGate}</Link><Link className="qbms-secondary-button" href="/employees"><QBMSIcon name="arrowLeft" size={16}/>{c.employeeMaster}</Link><button className="qbms-secondary-button" onClick={() => void loadRows()}><QBMSIcon name="refresh" size={16}/>{c.refresh}</button></div></section>
    <section className="qbms-master-stats"><div className="qbms-stat-card"><span>{c.ready}</span><strong>{counts.ready}</strong><small>ASSET_COMPLETED</small></div><div className="qbms-stat-card"><span>{c.active}</span><strong>{counts.active}</strong><small>ACTIVE</small></div></section>
    {error ? <section className={styles.error}><strong>!</strong><span>{error}</span></section> : null}
    <section className={styles.workspace}>
      <aside className={styles.queue}><div className={styles.panelHeader}><div><h3>{c.queue}</h3><p>{c.ready}</p></div><span>{filtered.length}</span></div>{loading ? <div className={styles.empty}>Loading...</div> : filtered.length ? <div className={styles.queueList}>{filtered.map((row) => <button key={row.employee_id} onClick={() => setSelectedId(String(row.employee_id))} className={`${styles.queueItem} ${selectedId === String(row.employee_id) ? styles.selected : ''}`}><div className={styles.avatar}>{row.first_name?.slice(0,1)?.toUpperCase() || '?'}</div><div className={styles.queueBody}><strong>{fullName(row)}</strong><span>{row.employee_code} · {row.position_name || c.none}</span><small>{row.business_unit_name || c.none}</small></div><em className={row.case_status === 'COMPLETED' ? styles.activeBadge : styles.readyBadge}>{row.case_status === 'COMPLETED' ? c.active : c.ready}</em></button>)}</div> : <div className={styles.empty}>{c.noCases}</div>}</aside>
      <main className={styles.detail}>{!selectedId ? <div className={styles.emptyLarge}>{c.select}</div> : !detail ? <div className={styles.emptyLarge}>Loading...</div> : <ActivationDetailView detail={detail} c={c} note={note} setNote={setNote} working={working} onActivate={handleActivate}/>}</main>
    </section>
  </QBMSAppShell>;
}

function ActivationDetailView({ detail, c, note, setNote, working, onActivate }: any) {
  const a = detail.activation;
  const factRows = [
    ['Company Email', a.company_email],
    ['Q BMS Account', a.user_account_status],
    ['Employee Status', a.employee_status],
    ['Profile Status', a.profile_status],
    ['Business Unit', a.business_unit_name],
    ['Position', a.position_name],
    ['Job Grade', a.grade_number ? `Grade ${a.grade_number}` : null],
    ['Job Level', a.job_level_name],
    ['Asset Gate', a.asset_gate_decision],
  ];
  return <div className={styles.stack}>
    <section className={styles.hero}><div><span>{a.employee_code}</span><h2>{fullName(a)}</h2><p>{a.company_email || c.none}</p></div><div className={detail.is_active ? styles.statusActive : styles.statusReady}><strong>{detail.is_active ? c.active : c.ready}</strong><small>{detail.is_active ? 'Employee Workspace Ready' : 'Final HR action'}</small></div></section>
    {detail.is_active ? <section className={styles.success}><QBMSIcon name="check" size={18}/><div><strong>Employee + Q BMS User are ACTIVE</strong><span>{c.next}</span></div></section> : null}
    <section className={styles.card}><div className={styles.cardTitle}><div><h3>{c.checklist}</h3><p>All checks must pass before Activate Employee is enabled.</p></div><span>{detail.checks.filter((item: any) => item.passed).length}/{detail.checks.length}</span></div><div className={styles.checks}>{detail.checks.map((item: any) => <div key={item.code} className={`${styles.check} ${item.passed ? styles.pass : styles.fail}`}><span className={styles.checkIcon}>{item.passed ? '✓' : '!'}</span><div><strong>{item.label}</strong><small>{item.passed ? c.passed : c.blocked}</small></div></div>)}</div></section>
    <section className={styles.card}><div className={styles.cardTitle}><h3>{c.facts}</h3></div><div className={styles.facts}>{factRows.map(([label,value]) => <div key={String(label)} className={styles.fact}><span>{label}</span><strong>{value || c.none}</strong></div>)}</div></section>
    {!detail.is_active ? <section className={styles.decision}><div><h3>{c.activate}</h3><p>Activation changes Employee Status, Profile Status and Q BMS User Account in one transaction.</p><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={c.note}/></div><button className={styles.activate} disabled={working || !detail.can_activate} onClick={onActivate}><QBMSIcon name="check" size={17}/>{working ? c.working : c.activate}</button></section> : null}
    <section className={styles.card}><div className={styles.cardTitle}><h3>{c.history}</h3><span>{detail.history.length}</span></div>{detail.history.length ? <div className={styles.history}>{detail.history.map((event: any) => <div key={event.id} className={styles.historyRow}><span>{event.event_type}</span><div><strong>{event.note || c.none}</strong><small>{new Date(event.created_at).toLocaleString()}</small></div></div>)}</div> : <div className={styles.empty}>{c.none}</div>}</section>
  </div>;
}
