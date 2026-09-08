"use client";

import Link from "next/link";
import QBMSAppShell, { QBMSIcon } from "@/components/layout/QBMSAppShell";
import { useSuperAdminLocale } from "../i18n/useSuperAdminLocale";
import styles from "../SuperAdminCategory.module.css";

const copy = {
  en: {
    pageTitle: "System Administration",
    pageDescription: "User identity and Q BMS platform-level administration.",
    eyebrow: "SUPER ADMIN / SYSTEM",
    title: "System Administration",
    intro:
      "Manage Q BMS User identity and platform-level administration separately from personal Employee settings.",
    back: "← Super Admin",
    sectionTitle: "System Administration Tools",
    sectionHelp:
      "User & Identity, System Configuration and Platform Diagnostics are available as Super Admin foundations.",
    userIdentity: "User & Identity Management",
    userIdentityDescription:
      "Q BMS accounts, Employee links, Google identity, login state, invitation and active sessions.",
    userIdentityMeta: "Accounts · Identity · Login",
    systemConfiguration: "System Configuration",
    systemConfigurationDescription:
      "Platform-level configuration separated from normal Employee Settings.",
    systemConfigurationMeta: "Platform Configuration",
    platformDiagnostics: "Platform Diagnostics",
    platformDiagnosticsDescription:
      "Read-only system checks for database, core schema, access model, organization master, onboarding and Super Admin foundations.",
    platformDiagnosticsMeta: "Health · Integrity · Read-only",
    ready: "READY",
    planned: "PLANNED",
    open: "Open →",
    notActive: "Not active yet",
  },
  th: {
    pageTitle: "การบริหารระบบ",
    pageDescription: "การจัดการตัวตนผู้ใช้และการบริหาร Q BMS ระดับแพลตฟอร์ม",
    eyebrow: "SUPER ADMIN / ระบบ",
    title: "การบริหารระบบ",
    intro:
      "จัดการ User, Identity และการบริหารระดับแพลตฟอร์มของ Q BMS โดยแยกจากการตั้งค่าส่วนบุคคลของพนักงาน",
    back: "← Super Admin",
    sectionTitle: "เครื่องมือการบริหารระบบ",
    sectionHelp:
      "User & Identity, System Configuration และ Platform Diagnostics พร้อมใช้งานในระดับ Foundation แล้ว",
    userIdentity: "การจัดการผู้ใช้และตัวตน",
    userIdentityDescription:
      "บัญชี Q BMS, การผูก Employee, Google Identity, สถานะ Login, Invitation และ Active Session",
    userIdentityMeta: "บัญชี · ตัวตน · การเข้าสู่ระบบ",
    systemConfiguration: "การตั้งค่าระบบ",
    systemConfigurationDescription:
      "การตั้งค่าระดับแพลตฟอร์ม แยกออกจาก Settings ส่วนบุคคลของพนักงาน",
    systemConfigurationMeta: "การตั้งค่าแพลตฟอร์ม",
    platformDiagnostics: "การตรวจสอบแพลตฟอร์ม",
    platformDiagnosticsDescription:
      "ตรวจสอบ Database, Core Schema, Access Model, Organization Master, Onboarding และ Super Admin Foundation แบบอ่านอย่างเดียว",
    platformDiagnosticsMeta: "Health · Integrity · Read-only",
    ready: "พร้อมใช้",
    planned: "วางแผน",
    open: "เปิด →",
    notActive: "ยังไม่เปิดใช้งาน",
  },
  lo: {
    pageTitle: "ການບໍລິຫານລະບົບ",
    pageDescription: "ການຈັດການຕົວຕົນຜູ້ໃຊ້ ແລະ ການບໍລິຫານ Q BMS ລະດັບແພລດຟອມ",
    eyebrow: "SUPER ADMIN / ລະບົບ",
    title: "ການບໍລິຫານລະບົບ",
    intro:
      "ຈັດການ User, Identity ແລະ ການບໍລິຫານລະດັບແພລດຟອມຂອງ Q BMS ໂດຍແຍກຈາກການຕັ້ງຄ່າສ່ວນຕົວຂອງພະນັກງານ",
    back: "← Super Admin",
    sectionTitle: "ເຄື່ອງມືການບໍລິຫານລະບົບ",
    sectionHelp:
      "User & Identity, System Configuration ແລະ Platform Diagnostics ພ້ອມໃຊ້ໃນລະດັບ Foundation ແລ້ວ",
    userIdentity: "ການຈັດການຜູ້ໃຊ້ ແລະ ຕົວຕົນ",
    userIdentityDescription:
      "ບັນຊີ Q BMS, ການຜູກ Employee, Google Identity, ສະຖານະ Login, Invitation ແລະ Active Session",
    userIdentityMeta: "ບັນຊີ · ຕົວຕົນ · ການເຂົ້າລະບົບ",
    systemConfiguration: "ການຕັ້ງຄ່າລະບົບ",
    systemConfigurationDescription:
      "ການຕັ້ງຄ່າລະດັບແພລດຟອມ ແຍກອອກຈາກ Settings ສ່ວນຕົວຂອງພະນັກງານ",
    systemConfigurationMeta: "ການຕັ້ງຄ່າແພລດຟອມ",
    platformDiagnostics: "ການກວດສອບແພລດຟອມ",
    platformDiagnosticsDescription:
      "ກວດສອບ Database, Core Schema, Access Model, Organization Master, Onboarding ແລະ Super Admin Foundation ແບບອ່ານຢ່າງດຽວ",
    platformDiagnosticsMeta: "Health · Integrity · Read-only",
    ready: "ພ້ອມໃຊ້",
    planned: "ວາງແຜນ",
    open: "ເປີດ →",
    notActive: "ຍັງບໍ່ເປີດໃຊ້",
  },
} as const;

export default function SystemAdministrationPageClient() {
  const locale = useSuperAdminLocale();
  const c = copy[locale];

  const tools = [
    {
      title: c.userIdentity,
      description: c.userIdentityDescription,
      icon: "users" as const,
      href: "/super-admin/user-identity",
      status: "READY" as const,
      meta: c.userIdentityMeta,
    },
    {
      title: c.systemConfiguration,
      description: c.systemConfigurationDescription,
      icon: "settings" as const,
      href: "/super-admin/system-administration/configuration",
      status: "READY" as const,
      meta: c.systemConfigurationMeta,
    },
    {
      title: c.platformDiagnostics,
      description: c.platformDiagnosticsDescription,
      icon: "dashboard" as const,
      href: "/super-admin/system-administration/diagnostics",
      status: "READY" as const,
      meta: c.platformDiagnosticsMeta,
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
      </div>
    </QBMSAppShell>
  );
}
