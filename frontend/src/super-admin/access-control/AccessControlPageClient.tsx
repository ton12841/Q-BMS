"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QBMSAppShell, { QBMSIcon } from "@/components/layout/QBMSAppShell";
import { useSuperAdminLocale } from "@/super-admin/i18n/useSuperAdminLocale";
import {
  fetchAccessControlOverview,
  updateAccessControlUserRoles,
  type AccessControlOverview,
  type AccessControlRole,
  type AccessControlUser,
} from "./access-control.api";
import styles from "./AccessControlPage.module.css";

const copy = {
  en: {
    pageTitle:"User Access Assignment", pageDescription:"Assign Admin Roles per user while Base Role and Level / Grade come from Employee & Organization.", search:"Search employee, email, BU, Position, Level or Grade...",
    eyebrow:"ROLES & PERMISSIONS / USER ACCESS", title:"User Access Assignment", intro:"Select an Employee and assign only Admin / System Roles per user. EMPLOYEE, Job Level and Job Grade are inherited from platform source of truth.",
    baseRule:"EMPLOYEE = Auto Base Role", policyRule:"Level / Grade = Inherited", adminRule:"Admin Role = Assign per User", back:"← Roles & Permissions", preview:"Effective Permission Preview", policy:"Level / Grade Policy",
    users:"Q BMS Users", usersHelp:"User accounts in Q BMS", baseRole:"Base Role", baseHelp:"EMPLOYEE for employee-linked users", adminRoles:"Admin Roles", adminHelp:"Assigned per User", permissions:"Permissions", permissionHelp:"Resolved from Role + Level / Grade",
    selectUser:"SELECT USER", employeeUser:"Employee / Q BMS User", refresh:"Refresh", loading:"Loading users...", noUsers:"No Q BMS User yet", noUsersHelp:"After Google Identity Linking creates the Q BMS User, Admin Roles can be assigned.",
    qbmsUser:"Q BMS User", noAssignment:"No active assignment", selectPrompt:"Select a Q BMS User", selectPromptHelp:"to inspect Base Role, Organization Policy and Admin Roles", assignment:"USER ACCESS ASSIGNMENT", save:"Save Access", saving:"Saving...", saved:"User Admin / System Roles saved.",
    autoBase:"BASE ROLE · AUTO", baseLinked:"Employee is linked; the system preserves this Base Role automatically.", baseUnlinked:"This Q BMS User is not linked to an Employee yet.", orgReadOnly:"ORGANIZATION · READ ONLY", noLevel:"No Job Level", noOrg:"No Active Organization Assignment", inherited:"INHERITED",
    gradeReadOnly:"JOB GRADE · READ ONLY", grade:"Grade", noGrade:"No Job Grade", gradeSource:"Grade comes from Employee Assignment.", overrideLevel:"OVERRIDE LEVEL", assignPerUser:"ASSIGN PER USER", adminTitle:"Admin Roles", adminText:"Only these Roles are assigned directly to individual users by Super Admin.",
    specialAccess:"SPECIAL ACCESS", systemTitle:"System Roles", systemText:"SUPER_ADMIN is independent from Position / Level / Grade and must be assigned explicitly.", adminFallback:"Q BMS Admin Role", systemFallback:"Q BMS System Role", permissionCount:"permissions",
    baseCategory:"Base Role", adminCategory:"Admin Role", systemCategory:"System Role", loadError:"Unable to load User Access Assignment.", saveError:"Unable to update user access."
  },
  th: {
    pageTitle:"การกำหนดสิทธิ์ผู้ใช้", pageDescription:"กำหนด Admin Role เป็นรายคน โดย Base Role และ Level / Grade มาจาก Employee & Organization", search:"ค้นหาพนักงาน อีเมล BU Position Level หรือ Grade...",
    eyebrow:"บทบาทและสิทธิ์ / การกำหนดสิทธิ์ผู้ใช้", title:"การกำหนดสิทธิ์ผู้ใช้", intro:"เลือก Employee แล้วกำหนดเฉพาะ Admin / System Role เป็นรายคน ส่วน EMPLOYEE, Job Level และ Job Grade มาจาก Source of Truth ของระบบ",
    baseRule:"EMPLOYEE = Base Role อัตโนมัติ", policyRule:"Level / Grade = รับช่วง", adminRule:"Admin Role = Assign ราย User", back:"← บทบาทและสิทธิ์", preview:"ตรวจสอบ Effective Permission", policy:"นโยบาย Level / Grade",
    users:"ผู้ใช้ Q BMS", usersHelp:"บัญชีผู้ใช้งานในระบบ", baseRole:"Base Role", baseHelp:"EMPLOYEE สำหรับ User ที่ผูกกับพนักงาน", adminRoles:"Admin Role", adminHelp:"Assign เพิ่มเป็นราย User", permissions:"Permission", permissionHelp:"คำนวณจาก Role + Level / Grade",
    selectUser:"เลือกผู้ใช้", employeeUser:"Employee / Q BMS User", refresh:"รีเฟรช", loading:"กำลังโหลดผู้ใช้งาน...", noUsers:"ยังไม่มี Q BMS User", noUsersHelp:"หลัง Google Identity Linking สร้าง Q BMS User แล้ว จึงกำหนด Admin Role ได้",
    qbmsUser:"ผู้ใช้ Q BMS", noAssignment:"ยังไม่มี Active Assignment", selectPrompt:"เลือก Q BMS User", selectPromptHelp:"เพื่อดู Base Role, Organization Policy และ Admin Role", assignment:"การกำหนดสิทธิ์ผู้ใช้", save:"บันทึกสิทธิ์", saving:"กำลังบันทึก...", saved:"บันทึก Admin / System Role ของผู้ใช้งานแล้ว",
    autoBase:"BASE ROLE · อัตโนมัติ", baseLinked:"ผูกกับ Employee แล้ว ระบบรักษา Base Role นี้ให้อัตโนมัติ", baseUnlinked:"Q BMS User นี้ยังไม่ได้ผูกกับ Employee", orgReadOnly:"ORGANIZATION · อ่านอย่างเดียว", noLevel:"ยังไม่มี Job Level", noOrg:"ยังไม่มี Active Organization Assignment", inherited:"รับช่วง",
    gradeReadOnly:"JOB GRADE · อ่านอย่างเดียว", grade:"Grade", noGrade:"ยังไม่มี Job Grade", gradeSource:"Grade จะมาจาก Employee Assignment", overrideLevel:"OVERRIDE LEVEL", assignPerUser:"กำหนดรายผู้ใช้", adminTitle:"Admin Roles", adminText:"เฉพาะ Role กลุ่มนี้ที่ Super Admin กำหนดเพิ่มให้รายบุคคล",
    specialAccess:"สิทธิ์พิเศษ", systemTitle:"System Roles", systemText:"SUPER_ADMIN แยกจาก Position / Level / Grade และต้อง Assign อย่างตั้งใจ", adminFallback:"Q BMS Admin Role", systemFallback:"Q BMS System Role", permissionCount:"Permission",
    baseCategory:"Base Role", adminCategory:"Admin Role", systemCategory:"System Role", loadError:"ไม่สามารถโหลดการกำหนดสิทธิ์ผู้ใช้ได้", saveError:"ไม่สามารถอัปเดตสิทธิ์ผู้ใช้ได้"
  },
  lo: {
    pageTitle:"ການກຳນົດສິດຜູ້ໃຊ້", pageDescription:"ກຳນົດ Admin Role ເປັນລາຍຄົນ ໂດຍ Base Role ແລະ Level / Grade ມາຈາກ Employee & Organization", search:"ຄົ້ນຫາພະນັກງານ, ອີເມວ, BU, Position, Level ຫຼື Grade...",
    eyebrow:"ບົດບາດ ແລະ ສິດທິ / ການກຳນົດສິດຜູ້ໃຊ້", title:"ການກຳນົດສິດຜູ້ໃຊ້", intro:"ເລືອກ Employee ແລ້ວກຳນົດສະເພາະ Admin / System Role ເປັນລາຍຄົນ; EMPLOYEE, Job Level ແລະ Job Grade ມາຈາກ Source of Truth",
    baseRule:"EMPLOYEE = Base Role ອັດຕະໂນມັດ", policyRule:"Level / Grade = ຮັບຊ່ວງ", adminRule:"Admin Role = Assign ລາຍ User", back:"← ບົດບາດ ແລະ ສິດທິ", preview:"ກວດສອບ Effective Permission", policy:"ນະໂຍບາຍ Level / Grade",
    users:"ຜູ້ໃຊ້ Q BMS", usersHelp:"ບັນຊີຜູ້ໃຊ້ໃນລະບົບ", baseRole:"Base Role", baseHelp:"EMPLOYEE ສຳລັບ User ທີ່ຜູກກັບພະນັກງານ", adminRoles:"Admin Role", adminHelp:"Assign ເພີ່ມເປັນລາຍ User", permissions:"Permission", permissionHelp:"ຄຳນວນຈາກ Role + Level / Grade",
    selectUser:"ເລືອກຜູ້ໃຊ້", employeeUser:"Employee / Q BMS User", refresh:"ໂຫຼດໃໝ່", loading:"ກຳລັງໂຫຼດຜູ້ໃຊ້...", noUsers:"ຍັງບໍ່ມີ Q BMS User", noUsersHelp:"ຫຼັງ Google Identity Linking ສ້າງ Q BMS User ແລ້ວ ຈຶ່ງກຳນົດ Admin Role ໄດ້",
    qbmsUser:"ຜູ້ໃຊ້ Q BMS", noAssignment:"ຍັງບໍ່ມີ Active Assignment", selectPrompt:"ເລືອກ Q BMS User", selectPromptHelp:"ເພື່ອເບິ່ງ Base Role, Organization Policy ແລະ Admin Role", assignment:"ການກຳນົດສິດຜູ້ໃຊ້", save:"ບັນທຶກສິດ", saving:"ກຳລັງບັນທຶກ...", saved:"ບັນທຶກ Admin / System Role ຂອງຜູ້ໃຊ້ແລ້ວ",
    autoBase:"BASE ROLE · ອັດຕະໂນມັດ", baseLinked:"ຜູກກັບ Employee ແລ້ວ ລະບົບຮັກສາ Base Role ນີ້ໃຫ້ອັດຕະໂນມັດ", baseUnlinked:"Q BMS User ນີ້ຍັງບໍ່ໄດ້ຜູກກັບ Employee", orgReadOnly:"ORGANIZATION · ອ່ານຢ່າງດຽວ", noLevel:"ຍັງບໍ່ມີ Job Level", noOrg:"ຍັງບໍ່ມີ Active Organization Assignment", inherited:"ຮັບຊ່ວງ",
    gradeReadOnly:"JOB GRADE · ອ່ານຢ່າງດຽວ", grade:"Grade", noGrade:"ຍັງບໍ່ມີ Job Grade", gradeSource:"Grade ຈະມາຈາກ Employee Assignment", overrideLevel:"OVERRIDE LEVEL", assignPerUser:"ກຳນົດລາຍຜູ້ໃຊ້", adminTitle:"Admin Roles", adminText:"ສະເພາະ Role ກຸ່ມນີ້ທີ່ Super Admin ກຳນົດເພີ່ມໃຫ້ລາຍບຸກຄົນ",
    specialAccess:"ສິດພິເສດ", systemTitle:"System Roles", systemText:"SUPER_ADMIN ແຍກຈາກ Position / Level / Grade ແລະ ຕ້ອງ Assign ຢ່າງຕັ້ງໃຈ", adminFallback:"Q BMS Admin Role", systemFallback:"Q BMS System Role", permissionCount:"Permission",
    baseCategory:"Base Role", adminCategory:"Admin Role", systemCategory:"System Role", loadError:"ບໍ່ສາມາດໂຫຼດການກຳນົດສິດຜູ້ໃຊ້ໄດ້", saveError:"ບໍ່ສາມາດອັບເດດສິດຜູ້ໃຊ້ໄດ້"
  }
} as const;

function isPersonAssignableRole(role: AccessControlRole) { return role.isAssignable && role.code !== "EMPLOYEE"; }
function employeeSubtitle(user: AccessControlUser, fallback: string) { return [user.employeeCode, user.email].filter(Boolean).join(" · ") || fallback; }

export default function AccessControlPageClient() {
  const locale = useSuperAdminLocale(); const c = copy[locale];
  const [overview,setOverview] = useState<AccessControlOverview | null>(null); const [selectedUserId,setSelectedUserId]=useState<string|null>(null); const [draftRoles,setDraftRoles]=useState<string[]>([]); const [query,setQuery]=useState("");
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [error,setError]=useState<string|null>(null); const [notice,setNotice]=useState<string|null>(null);
  const categoryLabel=(category:string)=>category==="BASE"?c.baseCategory:category==="ADMIN"?c.adminCategory:category==="SYSTEM"?c.systemCategory:category;

  async function load(signal?:AbortSignal){setLoading(true);setError(null);try{const data=await fetchAccessControlOverview(signal);setOverview(data);setSelectedUserId(cur=>cur&&data.users.some(u=>u.id===cur)?cur:data.users[0]?.id||null);}catch(e){if(signal?.aborted)return;setError(e instanceof Error?e.message:c.loadError);}finally{if(!signal?.aborted)setLoading(false);}}
  useEffect(()=>{const controller=new AbortController();load(controller.signal);return()=>controller.abort();},[]);
  const selectedUser=useMemo(()=>overview?.users.find(u=>u.id===selectedUserId)||null,[overview,selectedUserId]);
  useEffect(()=>{if(!selectedUser){setDraftRoles([]);return;}setDraftRoles(selectedUser.roleCodes);setNotice(null);},[selectedUser]);
  const filteredUsers=useMemo(()=>{if(!overview)return[];const n=query.trim().toLowerCase();if(!n)return overview.users;return overview.users.filter(u=>[u.displayName,u.employeeCode||"",u.email||"",u.organization.businessUnitName||"",u.organization.positionName||"",u.organization.jobLevelCode||"",u.organization.gradeNumber?`grade ${u.organization.gradeNumber}`:""].join(" ").toLowerCase().includes(n));},[overview,query]);
  const adminRoles=useMemo(()=>(overview?.roles||[]).filter(r=>r.category==="ADMIN"&&isPersonAssignableRole(r)).sort((a,b)=>a.sortOrder-b.sortOrder||a.code.localeCompare(b.code)),[overview]);
  const systemRoles=useMemo(()=>(overview?.roles||[]).filter(r=>r.category==="SYSTEM"&&isPersonAssignableRole(r)).sort((a,b)=>a.sortOrder-b.sortOrder||a.code.localeCompare(b.code)),[overview]);
  function toggleRole(role:AccessControlRole){setDraftRoles(cur=>cur.includes(role.code)?cur.filter(code=>code!==role.code):[...cur,role.code]);setNotice(null);}
  async function saveRoles(){if(!selectedUser)return;setSaving(true);setError(null);setNotice(null);try{const result=await updateAccessControlUserRoles(selectedUser.id,draftRoles);setOverview(cur=>cur?{...cur,users:cur.users.map(u=>u.id===selectedUser.id?{...u,roleCodes:result.roleCodes}:u)}:cur);setDraftRoles(result.roleCodes);setNotice(c.saved);}catch(e){setError(e instanceof Error?e.message:c.saveError);}finally{setSaving(false);}}

  return <QBMSAppShell pageTitle={c.pageTitle} pageDescription={c.pageDescription} searchValue={query} onSearchChange={setQuery} searchPlaceholder={c.search}>
    <div className={styles.page}>
      <section className={styles.hero}><div><span className={styles.eyebrow}>{c.eyebrow}</span><h2>{c.title}</h2><p>{c.intro}</p></div><div className={styles.heroActions}><div className={styles.rulePills}><span>{c.baseRule}</span><span>{c.policyRule}</span><span>{c.adminRule}</span></div><div className={styles.heroLinks}><Link href="/super-admin/roles-permissions" className={styles.secondaryLink}>{c.back}</Link><Link href="/super-admin/access-control/effective-preview" className={styles.secondaryLink}>{c.preview}</Link><Link href="/super-admin/access-control/organization-policy" className={styles.secondaryLink}>{c.policy}</Link></div></div></section>
      {error&&<div className={styles.error}>{error}</div>}{notice&&<div className={styles.notice}>{notice}</div>}
      <section className={styles.metrics}><article><span>{c.users}</span><strong>{overview?.counts.users??"—"}</strong><small>{c.usersHelp}</small></article><article><span>{c.baseRole}</span><strong>1</strong><small>{c.baseHelp}</small></article><article><span>{c.adminRoles}</span><strong>{overview?.counts.adminRoles??"—"}</strong><small>{c.adminHelp}</small></article><article><span>{c.permissions}</span><strong>{overview?.counts.permissions??"—"}</strong><small>{c.permissionHelp}</small></article></section>
      <section className={styles.workspace}>
        <div className={styles.userPanel}><div className={styles.sectionHead}><div><span className={styles.kicker}>{c.selectUser}</span><h3>{c.employeeUser}</h3></div><button type="button" className={styles.iconButton} onClick={()=>load()} aria-label={c.refresh} title={c.refresh}><QBMSIcon name="refresh" size={18}/></button></div>
          <div className={styles.userList}>{loading&&<div className={styles.empty}>{c.loading}</div>}{!loading&&filteredUsers.length===0&&<div className={styles.empty}>{c.noUsers}<small>{c.noUsersHelp}</small></div>}
            {filteredUsers.map(user=><button type="button" key={user.id} className={`${styles.userRow} ${selectedUserId===user.id?styles.selected:""}`} onClick={()=>setSelectedUserId(user.id)}><span className={styles.avatar}>{(user.nickname||user.firstName||user.email||"QB").slice(0,2).toUpperCase()}</span><span className={styles.userCopy}><strong>{user.displayName}</strong><small>{employeeSubtitle(user,c.qbmsUser)}</small><em>{[user.organization.positionName,user.organization.jobLevelCode,user.organization.gradeNumber?`G${user.organization.gradeNumber}`:null].filter(Boolean).join(" · ")||c.noAssignment}</em></span></button>)}
          </div></div>
        <div className={styles.assignmentPanel}>{!selectedUser?<div className={styles.emptyLarge}><QBMSIcon name="shield" size={30}/><strong>{c.selectPrompt}</strong><span>{c.selectPromptHelp}</span></div>:<>
          <div className={styles.personHeader}><div className={styles.personIdentity}><span className={styles.personAvatar}>{(selectedUser.nickname||selectedUser.firstName||selectedUser.email||"QB").slice(0,2).toUpperCase()}</span><div><span className={styles.kicker}>{c.assignment}</span><h3>{selectedUser.displayName}</h3><p>{employeeSubtitle(selectedUser,c.qbmsUser)}</p></div></div><div className={styles.personActions}><Link href={`/super-admin/access-control/effective-preview?userId=${encodeURIComponent(selectedUser.id)}`} className={styles.previewLink}>{c.preview}</Link><button type="button" className={styles.primaryButton} disabled={saving} onClick={saveRoles}>{saving?c.saving:c.save}</button></div></div>
          <div className={styles.accessLayers}><article className={styles.layerCard}><span className={styles.layerNumber}>1</span><div><small>{c.autoBase}</small><strong>EMPLOYEE</strong><p>{selectedUser.employeeId?c.baseLinked:c.baseUnlinked}</p></div><span className={styles.lockBadge}><QBMSIcon name="check" size={14}/>{selectedUser.employeeId?"AUTO":"N/A"}</span></article>
            <article className={styles.layerCard}><span className={styles.layerNumber}>2</span><div><small>{c.orgReadOnly}</small><strong>{selectedUser.organization.jobLevelCode||c.noLevel}</strong><p>{[selectedUser.organization.positionName,selectedUser.organization.businessUnitName].filter(Boolean).join(" · ")||c.noOrg}</p></div><span className={styles.inheritedBadge}>{c.inherited}</span></article>
            <article className={styles.layerCard}><span className={styles.layerNumber}>3</span><div><small>{c.gradeReadOnly}</small><strong>{selectedUser.organization.gradeNumber?`${c.grade} ${selectedUser.organization.gradeNumber}`:c.noGrade}</strong><p>{selectedUser.organization.jobGradeName||c.gradeSource}</p></div><span className={styles.inheritedBadge}>{c.overrideLevel}</span></article></div>
          <section className={styles.roleSection}><div className={styles.sectionHead}><div><span className={styles.kicker}>{c.assignPerUser}</span><h3>{c.adminTitle}</h3><p>{c.adminText}</p></div></div><div className={styles.roleGrid}>{adminRoles.map(role=>{const checked=draftRoles.includes(role.code);return <button type="button" key={role.code} className={`${styles.roleCard} ${checked?styles.roleChecked:""}`} onClick={()=>toggleRole(role)}><span className={styles.roleCheck}>{checked?<QBMSIcon name="check" size={16}/>:null}</span><span className={styles.roleContent}><span className={styles.roleTopline}><strong>{role.name}</strong><em>{categoryLabel(role.category)}</em></span><small>{role.code}</small><p>{role.description||c.adminFallback}</p><span className={styles.permissionCount}>{role.permissions.length} {c.permissionCount}</span></span></button>})}</div></section>
          <section className={styles.roleSection}><div className={styles.sectionHead}><div><span className={styles.kicker}>{c.specialAccess}</span><h3>{c.systemTitle}</h3><p>{c.systemText}</p></div></div><div className={styles.roleGrid}>{systemRoles.map(role=>{const checked=draftRoles.includes(role.code);return <button type="button" key={role.code} className={`${styles.roleCard} ${styles.systemRoleCard} ${checked?styles.roleChecked:""}`} onClick={()=>toggleRole(role)}><span className={styles.roleCheck}>{checked?<QBMSIcon name="check" size={16}/>:null}</span><span className={styles.roleContent}><span className={styles.roleTopline}><strong>{role.name}</strong><em>{categoryLabel(role.category)}</em></span><small>{role.code}</small><p>{role.description||c.systemFallback}</p><span className={styles.permissionCount}>{role.permissions.length} {c.permissionCount}</span></span></button>})}</div></section>
        </>}</div>
      </section>
    </div>
  </QBMSAppShell>;
}
