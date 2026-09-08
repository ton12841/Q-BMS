"use client";

import {FormEvent, useCallback, useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import {fetchAuthSession, logoutSession} from "@/modules/auth/api/auth.api";
import {useI18n} from "@/i18n/useQBMSI18n";
import {
  acknowledgePolicy,
  addDocument,
  fetchMyOnboarding,
  saveBank,
  saveEmergency,
  savePersonal,
  submitOnboarding,
  type OnboardingBundle,
} from "./onboarding.api";
import styles from "./SelfOnboardingPage.module.css";

type Tab = "personal" | "emergency" | "bank" | "documents" | "policy" | "progress";

const COPY = {
  en: {
    loading: "Loading your onboarding workspace...", title: "Employee Self-Onboarding", eyebrow: "EMPLOYEE WORKSPACE / ONBOARDING",
    subtitle: "Complete the information HR needs before your employee account can be activated.", signOut: "Sign out",
    progress: "Your progress", status: "Status", employeeId: "Employee ID", businessUnit: "Business Unit", position: "Position", grade: "Grade / Level",
    personal: "Personal", emergency: "Emergency", bank: "Bank", documents: "Documents", policy: "Policy", progressTab: "Progress",
    save: "Save", saving: "Saving...", saved: "Saved successfully.", required: "Please complete all required fields.",
    personalTitle: "Personal Information", firstName: "First Name *", lastName: "Last Name *", nickname: "Nickname", dob: "Date of Birth", gender: "Gender", nationality: "Nationality", nationalId: "National ID / Passport", mobile: "Mobile *", personalEmail: "Personal Email", currentAddress: "Current Address", permanentAddress: "Permanent Address",
    emergencyTitle: "Emergency Contact", contactName: "Contact Name *", relationship: "Relationship *", phone: "Phone *", altPhone: "Alternate Phone",
    bankTitle: "Bank Information", bankName: "Bank Name *", accountName: "Account Name *", accountNumber: "Account Number *", currency: "Currency", bankBranch: "Bank Branch",
    documentsTitle: "Personal Documents", documentsHint: "For this migration step, documents use a secure/shared file link as in the original GS workflow. Direct upload will be connected to the Document Module later.", documentType: "Document Type *", documentLink: "Document Link *", addDocument: "Add Document", submittedDocuments: "Submitted Documents", noDocuments: "No documents submitted yet.",
    policyTitle: "Company Policy", policyName: "Company Policy / Employee Handbook Version 1.0", policyHint: "The policy acknowledgement behavior is preserved from the GS onboarding flow. The final policy document can be linked through the Document Module later.", accepted: "Accepted", notAccepted: "Not Accepted", acceptPolicy: "I Have Read & Accept", policyConfirm: "Confirm that you have read and accept the company policy?",
    progressTitle: "Onboarding Progress", employeeTasks: "Employee Tasks", companyTasks: "Company Workflow", submitTitle: "Submit Onboarding", submitHint: "Submit when every Employee task is complete. After submission, your information becomes read-only and moves to HR Review.", submit: "Submit to HR", submitConfirm: "Submit your onboarding information to HR?", submittedTitle: "Onboarding Submitted", submittedBody: "Your information has been sent to HR for review. After HR Review, the workflow continues to Asset Gate and Employee Activation.",
    pending: "Pending", complete: "Completed", workflow: "Overall workflow", errorTitle: "Unable to load onboarding", retry: "Try again",
  },
  th: {
    loading: "กำลังโหลดพื้นที่ Onboarding...", title: "กรอกข้อมูลพนักงานใหม่", eyebrow: "EMPLOYEE WORKSPACE / ONBOARDING",
    subtitle: "กรอกข้อมูลที่จำเป็นให้ครบก่อนส่งให้ HR ตรวจสอบและดำเนินการเปิดใช้งานพนักงาน", signOut: "ออกจากระบบ",
    progress: "ความคืบหน้าของคุณ", status: "สถานะ", employeeId: "รหัสพนักงาน", businessUnit: "สายธุรกิจ", position: "ตำแหน่ง", grade: "เกรด / ระดับ",
    personal: "ข้อมูลส่วนตัว", emergency: "ผู้ติดต่อฉุกเฉิน", bank: "บัญชีธนาคาร", documents: "เอกสาร", policy: "นโยบาย", progressTab: "ความคืบหน้า",
    save: "บันทึก", saving: "กำลังบันทึก...", saved: "บันทึกเรียบร้อยแล้ว", required: "กรุณากรอกข้อมูลที่จำเป็นให้ครบ",
    personalTitle: "ข้อมูลส่วนตัว", firstName: "ชื่อ *", lastName: "นามสกุล *", nickname: "ชื่อเล่น", dob: "วันเกิด", gender: "เพศ", nationality: "สัญชาติ", nationalId: "เลขบัตรประชาชน / Passport", mobile: "เบอร์โทรศัพท์ *", personalEmail: "อีเมลส่วนตัว", currentAddress: "ที่อยู่ปัจจุบัน", permanentAddress: "ที่อยู่ตามทะเบียน",
    emergencyTitle: "ผู้ติดต่อกรณีฉุกเฉิน", contactName: "ชื่อผู้ติดต่อ *", relationship: "ความสัมพันธ์ *", phone: "เบอร์โทรศัพท์ *", altPhone: "เบอร์สำรอง",
    bankTitle: "ข้อมูลบัญชีธนาคาร", bankName: "ธนาคาร *", accountName: "ชื่อบัญชี *", accountNumber: "เลขที่บัญชี *", currency: "สกุลเงิน", bankBranch: "สาขา",
    documentsTitle: "เอกสารส่วนบุคคล", documentsHint: "ในขั้น Migration นี้ยังคงใช้ลิงก์ไฟล์ตาม Flow เดิมใน GS ก่อน ระบบ Upload โดยตรงจะเชื่อมกับ Document Module ในขั้นถัดไป", documentType: "ประเภทเอกสาร *", documentLink: "ลิงก์เอกสาร *", addDocument: "เพิ่มเอกสาร", submittedDocuments: "เอกสารที่ส่งแล้ว", noDocuments: "ยังไม่มีเอกสาร",
    policyTitle: "นโยบายบริษัท", policyName: "Company Policy / Employee Handbook Version 1.0", policyHint: "คงพฤติกรรมการยอมรับนโยบายจาก GS เดิมไว้ก่อน และจะเชื่อมเอกสารนโยบายจริงผ่าน Document Module ภายหลัง", accepted: "ยอมรับแล้ว", notAccepted: "ยังไม่ยอมรับ", acceptPolicy: "อ่านและยอมรับ", policyConfirm: "ยืนยันว่าได้อ่านและยอมรับนโยบายบริษัทแล้ว?",
    progressTitle: "ความคืบหน้า Onboarding", employeeTasks: "งานของพนักงาน", companyTasks: "Workflow ของบริษัท", submitTitle: "ส่งข้อมูล Onboarding", submitHint: "ส่งได้เมื่อส่วนของพนักงานครบทั้งหมด หลังจากส่งข้อมูลจะถูกล็อกและเข้าสู่ขั้น HR Review", submit: "ส่งให้ HR", submitConfirm: "ยืนยันส่งข้อมูล Onboarding ให้ HR ตรวจสอบ?", submittedTitle: "ส่งข้อมูล Onboarding แล้ว", submittedBody: "ข้อมูลถูกส่งให้ HR ตรวจสอบแล้ว จากนั้น Workflow จะดำเนินต่อไปยัง Asset Gate และ Employee Activation",
    pending: "รอดำเนินการ", complete: "เสร็จแล้ว", workflow: "Workflow ทั้งหมด", errorTitle: "ไม่สามารถโหลดข้อมูล Onboarding ได้", retry: "ลองอีกครั้ง",
  },
  lo: {
    loading: "ກຳລັງໂຫຼດພື້ນທີ່ Onboarding...", title: "ກອກຂໍ້ມູນພະນັກງານໃໝ່", eyebrow: "EMPLOYEE WORKSPACE / ONBOARDING",
    subtitle: "ກອກຂໍ້ມູນທີ່ຈຳເປັນໃຫ້ຄົບ ກ່ອນສົ່ງໃຫ້ HR ກວດສອບແລະເປີດໃຊ້ງານ", signOut: "ອອກຈາກລະບົບ",
    progress: "ຄວາມຄືບໜ້າ", status: "ສະຖານະ", employeeId: "ລະຫັດພະນັກງານ", businessUnit: "ສາຍທຸລະກິດ", position: "ຕຳແໜ່ງ", grade: "ເກຣດ / ລະດັບ",
    personal: "ຂໍ້ມູນສ່ວນຕົວ", emergency: "ຜູ້ຕິດຕໍ່ສຸກເສີນ", bank: "ທະນາຄານ", documents: "ເອກະສານ", policy: "ນະໂຍບາຍ", progressTab: "ຄວາມຄືບໜ້າ",
    save: "ບັນທຶກ", saving: "ກຳລັງບັນທຶກ...", saved: "ບັນທຶກແລ້ວ", required: "ກະລຸນາກອກຂໍ້ມູນຈຳເປັນໃຫ້ຄົບ",
    personalTitle: "ຂໍ້ມູນສ່ວນຕົວ", firstName: "ຊື່ *", lastName: "ນາມສະກຸນ *", nickname: "ຊື່ຫຼິ້ນ", dob: "ວັນເກີດ", gender: "ເພດ", nationality: "ສັນຊາດ", nationalId: "ບັດປະຈຳຕົວ / Passport", mobile: "ເບີໂທ *", personalEmail: "ອີເມວສ່ວນຕົວ", currentAddress: "ທີ່ຢູ່ປັດຈຸບັນ", permanentAddress: "ທີ່ຢູ່ຖາວອນ",
    emergencyTitle: "ຜູ້ຕິດຕໍ່ສຸກເສີນ", contactName: "ຊື່ຜູ້ຕິດຕໍ່ *", relationship: "ຄວາມສຳພັນ *", phone: "ເບີໂທ *", altPhone: "ເບີສຳຮອງ",
    bankTitle: "ຂໍ້ມູນທະນາຄານ", bankName: "ທະນາຄານ *", accountName: "ຊື່ບັນຊີ *", accountNumber: "ເລກບັນຊີ *", currency: "ສະກຸນເງິນ", bankBranch: "ສາຂາ",
    documentsTitle: "ເອກະສານສ່ວນຕົວ", documentsHint: "ຂັ້ນ Migration ນີ້ຍັງໃຊ້ລິ້ງໄຟລ໌ຕາມ Flow GS ເດີມ ແລະຈະເຊື່ອມ Upload ໂດຍກົງກັບ Document Module ພາຍຫຼັງ", documentType: "ປະເພດເອກະສານ *", documentLink: "ລິ້ງເອກະສານ *", addDocument: "ເພີ່ມເອກະສານ", submittedDocuments: "ເອກະສານທີ່ສົ່ງແລ້ວ", noDocuments: "ຍັງບໍ່ມີເອກະສານ",
    policyTitle: "ນະໂຍບາຍບໍລິສັດ", policyName: "Company Policy / Employee Handbook Version 1.0", policyHint: "ຮັກສາພຶດຕິກຳການຍອມຮັບນະໂຍບາຍຈາກ GS ເດີມ ແລະຈະເຊື່ອມເອກະສານຈິງພາຍຫຼັງ", accepted: "ຍອມຮັບແລ້ວ", notAccepted: "ຍັງບໍ່ຍອມຮັບ", acceptPolicy: "ອ່ານແລະຍອມຮັບ", policyConfirm: "ຢືນຢັນວ່າໄດ້ອ່ານແລະຍອມຮັບນະໂຍບາຍແລ້ວ?",
    progressTitle: "ຄວາມຄືບໜ້າ Onboarding", employeeTasks: "ວຽກຂອງພະນັກງານ", companyTasks: "Workflow ຂອງບໍລິສັດ", submitTitle: "ສົ່ງຂໍ້ມູນ Onboarding", submitHint: "ສາມາດສົ່ງໄດ້ເມື່ອວຽກຂອງພະນັກງານຄົບ ຫຼັງຈາກນັ້ນຈະເຂົ້າ HR Review", submit: "ສົ່ງໃຫ້ HR", submitConfirm: "ຢືນຢັນສົ່ງຂໍ້ມູນໃຫ້ HR?", submittedTitle: "ສົ່ງ Onboarding ແລ້ວ", submittedBody: "ຂໍ້ມູນຖືກສົ່ງໃຫ້ HR ກວດສອບແລ້ວ ຈາກນັ້ນຈະໄປ Asset Gate ແລະ Employee Activation",
    pending: "ລໍຖ້າ", complete: "ສຳເລັດ", workflow: "Workflow ທັງໝົດ", errorTitle: "ບໍ່ສາມາດໂຫຼດ Onboarding", retry: "ລອງອີກຄັ້ງ",
  },
} as const;

function taskComplete(bundle: OnboardingBundle | null, code: string) {
  return bundle?.tasks.some((task) => task.task_code === code && task.task_status === "COMPLETED") || false;
}

export default function SelfOnboardingPageClient() {
  const router = useRouter();
  const {locale} = useI18n();
  const c = COPY[(locale === "th" || locale === "lo") ? locale : "en"];
  const [bundle, setBundle] = useState<OnboardingBundle | null>(null);
  const [tab, setTab] = useState<Tab>("personal");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const session = await fetchAuthSession();
      if (!session.hasWorkspaceSession) { router.replace("/login"); return; }
      if (session.sessionKind === "DEVELOPMENT_PREVIEW") { router.replace("/"); return; }
      if (session.canAccessWorkspace) { router.replace("/"); return; }
      const data = await fetchMyOnboarding(locale);
      setBundle(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : c.errorTitle);
    } finally { setLoading(false); }
  }, [c.errorTitle, locale, router]);

  useEffect(() => { void load(); }, [load]);

  async function run(action: () => Promise<OnboardingBundle>, success = c.saved) {
    setWorking(true); setError(""); setNotice("");
    try { const data = await action(); setBundle(data); setNotice(success); }
    catch (e) { setError(e instanceof Error ? e.message : c.required); }
    finally { setWorking(false); }
  }

  async function signOut() {
    try { await logoutSession(); } finally { router.replace("/login"); router.refresh(); }
  }

  const readonly = Boolean(bundle?.is_submitted);
  const employeeTasks = useMemo(() => bundle?.tasks.filter((t) => t.owner_type === "EMPLOYEE") || [], [bundle]);
  const companyTasks = useMemo(() => bundle?.tasks.filter((t) => t.owner_type !== "EMPLOYEE") || [], [bundle]);

  if (loading) return <main className={styles.loading}>{c.loading}</main>;
  if (!bundle) return <main className={styles.loading}><strong>{c.errorTitle}</strong><span>{error}</span><button onClick={() => void load()}>{c.retry}</button></main>;

  const e = bundle.employee;
  const p = bundle.personal || {};
  const emergency = bundle.emergency || {};
  const bank = bundle.bank || {};

  const tabs: Array<[Tab, string]> = [["personal", c.personal], ["emergency", c.emergency], ["bank", c.bank], ["documents", c.documents], ["policy", c.policy], ["progress", c.progressTab]];

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}><img src="/qbms-logo.png" alt="Q BMS" /><div><strong>Q BMS</strong><span>Q Business Management System</span></div></div>
        <div className={styles.topActions}><LanguageSwitcher /><div className={styles.identity}><strong>{[e.first_name, e.last_name].filter(Boolean).join(" ")}</strong><span>{e.company_email}</span></div><button onClick={() => void signOut()}>{c.signOut}</button></div>
      </header>

      <section className={styles.content}>
        <section className={styles.hero}>
          <div><span className={styles.eyebrow}>{c.eyebrow}</span><h1>{c.title}</h1><p>{c.subtitle}</p></div>
          <div className={styles.progressBox}><div><span>{c.progress}</span><strong>{bundle.progress}%</strong></div><div className={styles.progressTrack}><span style={{width: `${bundle.progress}%`}} /></div></div>
        </section>

        <section className={styles.summaryGrid}>
          <div><span>{c.employeeId}</span><strong>{e.employee_code}</strong></div>
          <div><span>{c.businessUnit}</span><strong>{e.business_unit_name || "—"}</strong></div>
          <div><span>{c.position}</span><strong>{e.position_name || "—"}</strong></div>
          <div><span>{c.grade}</span><strong>{e.grade_number ? `Grade ${e.grade_number}` : "—"}{e.job_level_name ? ` · ${e.job_level_name}` : ""}</strong></div>
        </section>

        {bundle.is_submitted ? <section className={styles.submitted}><strong>{c.submittedTitle}</strong><p>{c.submittedBody}</p></section> : null}
        {notice ? <section className={styles.notice}>{notice}</section> : null}
        {error ? <section className={styles.error}>{error}</section> : null}

        <nav className={styles.tabs}>{tabs.map(([key, label]) => <button key={key} className={tab === key ? styles.activeTab : ""} onClick={() => setTab(key)}><span className={taskComplete(bundle, key === "personal" ? "PERSONAL_INFORMATION" : key === "emergency" ? "EMERGENCY_CONTACT" : key === "bank" ? "BANK_INFORMATION" : key === "documents" ? "PERSONAL_DOCUMENTS" : key === "policy" ? "COMPANY_POLICY" : "") ? styles.dotDone : styles.dot} />{label}</button>)}</nav>

        {tab === "personal" ? <PersonalForm c={c} e={e} p={p} disabled={readonly || working} onSave={(payload) => run(() => savePersonal(payload))} /> : null}
        {tab === "emergency" ? <EmergencyForm c={c} data={emergency} disabled={readonly || working} onSave={(payload) => run(() => saveEmergency(payload))} /> : null}
        {tab === "bank" ? <BankForm c={c} data={bank} disabled={readonly || working} onSave={(payload) => run(() => saveBank(payload))} /> : null}
        {tab === "documents" ? <Documents c={c} bundle={bundle} disabled={readonly || working} onAdd={(payload) => run(() => addDocument(payload), c.saved)} /> : null}
        {tab === "policy" ? <Policy c={c} bundle={bundle} disabled={readonly || working} onAccept={() => { if (window.confirm(c.policyConfirm)) void run(() => acknowledgePolicy()); }} /> : null}
        {tab === "progress" ? <Progress c={c} bundle={bundle} employeeTasks={employeeTasks} companyTasks={companyTasks} disabled={readonly || working} onSubmit={() => { if (window.confirm(c.submitConfirm)) void run(() => submitOnboarding(), c.submittedTitle); }} /> : null}
      </section>
    </main>
  );
}

function Field({label, name, type = "text", defaultValue, disabled = false}: {label: string; name: string; type?: string; defaultValue?: string | number | null; disabled?: boolean}) {
  return <label className={styles.field}><span>{label}</span><input name={name} type={type} defaultValue={defaultValue ?? ""} disabled={disabled} /></label>;
}
function TextArea({label, name, defaultValue, disabled = false}: {label: string; name: string; defaultValue?: string | null; disabled?: boolean}) {
  return <label className={`${styles.field} ${styles.full}`}><span>{label}</span><textarea name={name} defaultValue={defaultValue ?? ""} disabled={disabled} /></label>;
}
function formObject(form: HTMLFormElement) { return Object.fromEntries(new FormData(form).entries()); }

function PersonalForm({c,e,p,disabled,onSave}: any) {
  function submit(ev: FormEvent<HTMLFormElement>) { ev.preventDefault(); onSave(formObject(ev.currentTarget)); }
  return <form className={styles.card} onSubmit={submit}><div className={styles.cardHeader}><div><h2>{c.personalTitle}</h2><p>{c.subtitle}</p></div></div><div className={styles.formGrid}>
    <Field label={c.firstName} name="first_name" defaultValue={e.first_name} disabled={disabled}/><Field label={c.lastName} name="last_name" defaultValue={e.last_name} disabled={disabled}/><Field label={c.nickname} name="nickname" defaultValue={e.nickname} disabled={disabled}/><Field label={c.dob} name="date_of_birth" type="date" defaultValue={p.date_of_birth?.slice?.(0,10)} disabled={disabled}/><Field label={c.gender} name="gender" defaultValue={p.gender} disabled={disabled}/><Field label={c.nationality} name="nationality" defaultValue={p.nationality} disabled={disabled}/><Field label={c.nationalId} name="national_id" defaultValue={p.national_id} disabled={disabled}/><Field label={c.mobile} name="mobile" defaultValue={p.mobile} disabled={disabled}/><Field label={c.personalEmail} name="personal_email" type="email" defaultValue={p.personal_email} disabled={disabled}/><TextArea label={c.currentAddress} name="current_address" defaultValue={p.current_address} disabled={disabled}/><TextArea label={c.permanentAddress} name="permanent_address" defaultValue={p.permanent_address} disabled={disabled}/>
  </div>{!disabled ? <div className={styles.actions}><button className={styles.primary} type="submit">{c.save}</button></div> : null}</form>;
}
function EmergencyForm({c,data,disabled,onSave}: any) { function submit(ev: FormEvent<HTMLFormElement>) { ev.preventDefault(); onSave(formObject(ev.currentTarget)); } return <form className={styles.card} onSubmit={submit}><div className={styles.cardHeader}><h2>{c.emergencyTitle}</h2></div><div className={styles.formGrid}><Field label={c.contactName} name="contact_name" defaultValue={data.contact_name} disabled={disabled}/><Field label={c.relationship} name="relationship" defaultValue={data.relationship} disabled={disabled}/><Field label={c.phone} name="phone" defaultValue={data.phone} disabled={disabled}/><Field label={c.altPhone} name="alternate_phone" defaultValue={data.alternate_phone} disabled={disabled}/></div>{!disabled ? <div className={styles.actions}><button className={styles.primary} type="submit">{c.save}</button></div> : null}</form>; }
function BankForm({c,data,disabled,onSave}: any) { function submit(ev: FormEvent<HTMLFormElement>) { ev.preventDefault(); onSave(formObject(ev.currentTarget)); } return <form className={styles.card} onSubmit={submit}><div className={styles.cardHeader}><h2>{c.bankTitle}</h2></div><div className={styles.formGrid}><Field label={c.bankName} name="bank_name" defaultValue={data.bank_name} disabled={disabled}/><Field label={c.accountName} name="account_name" defaultValue={data.account_name} disabled={disabled}/><Field label={c.accountNumber} name="account_number" defaultValue={data.account_number} disabled={disabled}/><Field label={c.currency} name="currency" defaultValue={data.currency || "LAK"} disabled={disabled}/><Field label={c.bankBranch} name="bank_branch" defaultValue={data.bank_branch} disabled={disabled}/></div>{!disabled ? <div className={styles.actions}><button className={styles.primary} type="submit">{c.save}</button></div> : null}</form>; }
function Documents({c,bundle,disabled,onAdd}: any) { function submit(ev: FormEvent<HTMLFormElement>) { ev.preventDefault(); onAdd(formObject(ev.currentTarget)); ev.currentTarget.reset(); } return <div className={styles.stack}><form className={styles.card} onSubmit={submit}><div className={styles.cardHeader}><div><h2>{c.documentsTitle}</h2><p>{c.documentsHint}</p></div></div><div className={styles.formGrid}><Field label={c.documentType} name="document_type" disabled={disabled}/><Field label={c.documentLink} name="document_url" type="url" disabled={disabled}/></div>{!disabled ? <div className={styles.actions}><button className={styles.primary} type="submit">{c.addDocument}</button></div> : null}</form><section className={styles.card}><div className={styles.cardHeader}><h2>{c.submittedDocuments}</h2></div>{bundle.documents.length ? <div className={styles.docList}>{bundle.documents.map((d:any) => <a key={d.id} href={d.document_url} target="_blank" rel="noreferrer"><strong>{d.document_type}</strong><span>{d.status}</span><small>{d.document_url}</small></a>)}</div> : <p className={styles.muted}>{c.noDocuments}</p>}</section></div>; }
function Policy({c,bundle,disabled,onAccept}: any) { const accepted = Boolean(bundle.policy); return <section className={styles.card}><div className={styles.cardHeader}><div><h2>{c.policyTitle}</h2><p>{c.policyHint}</p></div></div><div className={styles.policyBox}><strong>{c.policyName}</strong><span className={accepted ? styles.statusDone : styles.statusPending}>{accepted ? c.accepted : c.notAccepted}</span></div>{!accepted && !disabled ? <div className={styles.actions}><button className={styles.primary} type="button" onClick={onAccept}>{c.acceptPolicy}</button></div> : null}</section>; }
function Progress({c,bundle,employeeTasks,companyTasks,disabled,onSubmit}: any) { return <div className={styles.stack}><section className={styles.card}><div className={styles.cardHeader}><div><h2>{c.progressTitle}</h2><p>{c.workflow}: {bundle.workflow_progress}%</p></div></div><TaskGroup title={c.employeeTasks} tasks={employeeTasks} c={c}/><TaskGroup title={c.companyTasks} tasks={companyTasks} c={c}/></section><section className={styles.submitCard}><div><span>{bundle.progress}%</span><div><h2>{c.submitTitle}</h2><p>{c.submitHint}</p></div></div><button className={styles.primary} type="button" disabled={disabled || !bundle.can_submit} onClick={onSubmit}>{c.submit}</button></section></div>; }
function TaskGroup({title,tasks,c}: any) { return <div className={styles.taskGroup}><h3>{title}</h3>{tasks.map((t:any) => <div className={styles.task} key={t.task_code}><span className={t.task_status === "COMPLETED" ? styles.checkDone : styles.checkPending}>{t.task_status === "COMPLETED" ? "✓" : ""}</span><div><strong>{t.task_name}</strong><small>{t.owner_type}</small></div><em>{t.task_status === "COMPLETED" ? c.complete : c.pending}</em></div>)}</div>; }
