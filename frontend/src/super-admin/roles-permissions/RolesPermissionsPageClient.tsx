"use client";

import Link from "next/link";
import QBMSAppShell, { QBMSIcon } from "@/components/layout/QBMSAppShell";
import { useSuperAdminLocale } from "../i18n/useSuperAdminLocale";
import styles from "../SuperAdminCategory.module.css";

const copy = {
  en: {
    pageTitle: "Roles & Permissions",
    pageDescription:
      "Role, Permission, organization policy, user assignment and effective access.",
    eyebrow: "SUPER ADMIN / ACCESS MODEL",
    title: "Roles & Permissions",
    intro:
      "Permission is an atomic capability, Role is a reusable permission set, Policy grants access by Level / Grade, and User Access Assignment assigns Roles to individual users.",
    back: "← Super Admin",
    sectionTitle: "Roles & Permissions Tools",
    sectionHelp:
      "No per-user Permission override. Effective Access resolves from Role + Level / Grade Policy.",
    userAccess: "User Access Assignment",
    userAccessDescription:
      "Assign Admin / System Roles per user. EMPLOYEE, Level and Grade remain source-of-truth driven.",
    userAccessMeta: "User → Role Assignment",
    roleManagement: "Role Management",
    roleManagementDescription:
      "Create and maintain reusable Role definitions and the Permission set contained in each Role.",
    roleManagementMeta: "Role Definition",
    permissionManagement: "Permission Management",
    permissionManagementDescription:
      "Maintain the canonical Permission catalog used by Q BMS modules and tools.",
    permissionManagementMeta: "Permission Catalog",
    policy: "Level / Grade Policy",
    policyDescription:
      "Set default Employee permissions by Job Level and Grade GRANT / REVOKE overrides.",
    policyMeta: "Organization Policy",
    preview: "Effective Permission Preview",
    previewDescription:
      "Inspect the final permission result and trace each permission back to Role, Level or Grade.",
    previewMeta: "Read-only QA",
    ready: "READY",
    planned: "PLANNED",
    open: "Open →",
    notActive: "Not active yet",
    note:
      "Access model: Permission = atomic capability · Role = permission set · Policy = Level / Grade permission behavior · User Access Assignment = assign Role to User · Effective Access = final resolved result",
  },
  th: {
    pageTitle: "บทบาทและสิทธิ์",
    pageDescription:
      "Role, Permission, Policy ขององค์กร การกำหนดสิทธิ์ผู้ใช้ และสิทธิ์ที่มีผลจริง",
    eyebrow: "SUPER ADMIN / โมเดลสิทธิ์",
    title: "บทบาทและสิทธิ์",
    intro:
      "Permission คือสิทธิ์ย่อยรายความสามารถ, Role คือชุด Permission, Policy ให้สิทธิ์ตาม Level / Grade และ User Access Assignment ใช้ Assign Role ให้ผู้ใช้แต่ละคน",
    back: "← Super Admin",
    sectionTitle: "เครื่องมือบทบาทและสิทธิ์",
    sectionHelp:
      "ไม่สร้าง Permission Override รายคน — Effective Access ต้องคำนวณจาก Role + Level / Grade Policy",
    userAccess: "การกำหนดสิทธิ์ผู้ใช้",
    userAccessDescription:
      "Assign Admin / System Role ให้รายบุคคล โดย EMPLOYEE, Level และ Grade ยังคงมาจาก Source of Truth",
    userAccessMeta: "User → Role Assignment",
    roleManagement: "การจัดการบทบาท",
    roleManagementDescription:
      "สร้างและดูแล Role ที่นำกลับมาใช้ซ้ำได้ รวมถึงชุด Permission ภายในแต่ละ Role",
    roleManagementMeta: "นิยาม Role",
    permissionManagement: "การจัดการสิทธิ์",
    permissionManagementDescription:
      "ดูแล Permission Catalog กลางที่ Module และ Tool ของ Q BMS ใช้งานร่วมกัน",
    permissionManagementMeta: "Permission Catalog",
    policy: "นโยบาย Level / Grade",
    policyDescription:
      "กำหนด Default Employee Permission ตาม Job Level และ Grade Override แบบ GRANT / REVOKE",
    policyMeta: "Policy ขององค์กร",
    preview: "ตรวจสอบสิทธิ์ที่มีผลจริง",
    previewDescription:
      "ตรวจสอบผล Permission สุดท้ายและดูย้อนกลับว่าสิทธิ์มาจาก Role, Level หรือ Grade",
    previewMeta: "QA แบบอ่านอย่างเดียว",
    ready: "พร้อมใช้",
    planned: "วางแผน",
    open: "เปิด →",
    notActive: "ยังไม่เปิดใช้งาน",
    note:
      "โมเดลสิทธิ์: Permission = สิทธิ์ย่อย · Role = ชุด Permission · Policy = กฎ Permission ตาม Level / Grade · User Access Assignment = Assign Role ให้ User · Effective Access = ผลลัพธ์สิทธิ์สุดท้าย",
  },
  lo: {
    pageTitle: "ບົດບາດ ແລະ ສິດທິ",
    pageDescription:
      "Role, Permission, Policy ຂອງອົງກອນ, ການກຳນົດສິດ User ແລະ ສິດທີ່ມີຜົນຈິງ",
    eyebrow: "SUPER ADMIN / ໂມເດວສິດທິ",
    title: "ບົດບາດ ແລະ ສິດທິ",
    intro:
      "Permission ແມ່ນສິດຍ່ອຍລາຍຄວາມສາມາດ, Role ແມ່ນຊຸດ Permission, Policy ໃຫ້ສິດຕາມ Level / Grade ແລະ User Access Assignment ໃຊ້ Assign Role ໃຫ້ແຕ່ລະ User",
    back: "← Super Admin",
    sectionTitle: "ເຄື່ອງມືບົດບາດ ແລະ ສິດທິ",
    sectionHelp:
      "ບໍ່ສ້າງ Permission Override ລາຍຄົນ — Effective Access ຕ້ອງຄຳນວນຈາກ Role + Level / Grade Policy",
    userAccess: "ການກຳນົດສິດເຂົ້າເຖິງຜູ້ໃຊ້",
    userAccessDescription:
      "Assign Admin / System Role ໃຫ້ລາຍບຸກຄົນ ໂດຍ EMPLOYEE, Level ແລະ Grade ຍັງມາຈາກ Source of Truth",
    userAccessMeta: "User → Role Assignment",
    roleManagement: "ການຈັດການບົດບາດ",
    roleManagementDescription:
      "ສ້າງແລະດູແລ Role ທີ່ນຳກັບມາໃຊ້ຊ້ຳໄດ້ ພ້ອມຊຸດ Permission ພາຍໃນແຕ່ລະ Role",
    roleManagementMeta: "ນິຍາມ Role",
    permissionManagement: "ການຈັດການສິດທິ",
    permissionManagementDescription:
      "ດູແລ Permission Catalog ກາງທີ່ Module ແລະ Tool ຂອງ Q BMS ໃຊ້ຮ່ວມກັນ",
    permissionManagementMeta: "Permission Catalog",
    policy: "ນະໂຍບາຍ Level / Grade",
    policyDescription:
      "ກຳນົດ Default Employee Permission ຕາມ Job Level ແລະ Grade Override ແບບ GRANT / REVOKE",
    policyMeta: "Policy ຂອງອົງກອນ",
    preview: "ກວດສອບສິດທິທີ່ມີຜົນຈິງ",
    previewDescription:
      "ກວດສອບຜົນ Permission ສຸດທ້າຍ ແລະ ເບິ່ງຍ້ອນວ່າສິດມາຈາກ Role, Level ຫຼື Grade",
    previewMeta: "QA ແບບອ່ານຢ່າງດຽວ",
    ready: "ພ້ອມໃຊ້",
    planned: "ວາງແຜນ",
    open: "ເປີດ →",
    notActive: "ຍັງບໍ່ເປີດໃຊ້",
    note:
      "ໂມເດວສິດທິ: Permission = ສິດຍ່ອຍ · Role = ຊຸດ Permission · Policy = ກົດ Permission ຕາມ Level / Grade · User Access Assignment = Assign Role ໃຫ້ User · Effective Access = ຜົນສິດສຸດທ້າຍ",
  },
} as const;

export default function RolesPermissionsPageClient() {
  const locale = useSuperAdminLocale();
  const c = copy[locale];

  const tools = [
    {
      title: c.userAccess,
      description: c.userAccessDescription,
      icon: "users" as const,
      href: "/super-admin/access-control",
      status: "READY" as const,
      meta: c.userAccessMeta,
    },
    {
      title: c.roleManagement,
      description: c.roleManagementDescription,
      icon: "briefcase" as const,
      href: "/super-admin/roles-permissions/roles",
      status: "READY" as const,
      meta: c.roleManagementMeta,
    },
    {
      title: c.permissionManagement,
      description: c.permissionManagementDescription,
      icon: "badge" as const,
      href: "/super-admin/roles-permissions/permissions",
      status: "READY" as const,
      meta: c.permissionManagementMeta,
    },
    {
      title: c.policy,
      description: c.policyDescription,
      icon: "network" as const,
      href: "/super-admin/access-control/organization-policy",
      status: "READY" as const,
      meta: c.policyMeta,
    },
    {
      title: c.preview,
      description: c.previewDescription,
      icon: "layers" as const,
      href: "/super-admin/access-control/effective-preview",
      status: "READY" as const,
      meta: c.previewMeta,
    },
  ];

  return (
    <QBMSAppShell pageTitle={c.pageTitle} pageDescription={c.pageDescription}>
      <div className={styles.page}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>{c.eyebrow}</span>
            <h2>{c.title}</h2>
            <p>{c.intro}</p>
          </div>
          <Link href="/super-admin" className={styles.backLink}>
            {c.back}
          </Link>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3>{c.sectionTitle}</h3>
            <p>{c.sectionHelp}</p>
          </div>

          <div className={styles.grid}>
            {tools.map((tool) => {
              const content = (
                <>
                  <div className={styles.cardTop}>
                    <span className={styles.icon}>
                      <QBMSIcon name={tool.icon} size={21} />
                    </span>
                    <span
                      className={`${styles.status} ${
                        tool.status === "READY" ? styles.ready : styles.planned
                      }`}
                    >
                      {tool.status === "READY" ? c.ready : c.planned}
                    </span>
                  </div>

                  <div className={styles.cardCopy}>
                    <h4>{tool.title}</h4>
                    <p>{tool.description}</p>
                  </div>

                  <div className={styles.cardFooter}>
                    <span>{tool.meta}</span>
                    <span className={tool.href ? styles.open : styles.notActive}>
                      {tool.href ? c.open : c.notActive}
                    </span>
                  </div>
                </>
              );

              return tool.href ? (
                <Link key={tool.title} href={tool.href} className={styles.card}>
                  {content}
                </Link>
              ) : (
                <article key={tool.title} className={`${styles.card} ${styles.disabled}`}>
                  {content}
                </article>
              );
            })}
          </div>
        </section>

        <div className={styles.note}>{c.note}</div>
      </div>
    </QBMSAppShell>
  );
}
