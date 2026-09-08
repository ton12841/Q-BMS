"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import QBMSAppShell, { QBMSIcon } from "@/components/layout/QBMSAppShell";
import {
  fetchAuthSession,
  type AuthSession,
} from "@/modules/auth/api/auth.api";
import { useSuperAdminLocale } from "./i18n/useSuperAdminLocale";
import styles from "./SuperAdminHub.module.css";

type AreaCard = {
  title: string;
  description: string;
  icon: "settings" | "shield" | "grid" | "report";
  href: string;
  summary: string;
  status: string;
};

const copy = {
  en: {
    pageTitle: "Super Admin",
    pageDescription:
      "System administration, roles & permissions, module governance and audit.",
    eyebrow: "Q BMS / PLATFORM ADMINISTRATION",
    title: "Super Admin",
    intro:
      "Platform-level tools are organized into four administration areas so sub-tools stay structured as Q BMS grows.",
    accessMode: "ACCESS MODE",
    checking: "Checking...",
    developmentPreview: "Development Preview",
    localDevelopment: "Local development only",
    explicitRole: "Explicit SUPER_ADMIN role",
    administrationAreas: "Administration Areas",
    clearDomains: "Clear platform governance domains",
    accessModel: "Access Model",
    accessModelValue: "Role + Permission + Policy",
    accessModelHelp: "User assignment resolves effective access",
    superAdmin: "Super Admin",
    explicit: "Explicit",
    neverAutomatic: "Never assigned automatically",
    areasEyebrow: "SUPER ADMIN AREAS",
    platformAdministration: "Platform Administration",
    chooseArea:
      "Choose a primary administration area, then open the sub-tools inside it.",
    systemAdministration: "System Administration",
    systemAdministrationDescription:
      "User accounts, Google identity and Q BMS platform-level configuration.",
    systemAdministrationSummary: "User & Identity · System Configuration",
    systemAdministrationStatus: "3 READY · 0 PLANNED",
    rolesPermissions: "Roles & Permissions",
    rolesPermissionsDescription:
      "Role, Permission, organization policy, user access assignment and effective access.",
    rolesPermissionsSummary: "Role · Permission · Policy · Assignment",
    rolesPermissionsStatus: "5 READY · 0 PLANNED",
    moduleManagement: "Module Management",
    moduleManagementDescription:
      "Platform administration for Q BMS Module and Tool registry, availability and governance.",
    moduleManagementSummary: "Module · Tool · Availability",
    foundation: "READY",
    auditLog: "Audit Log",
    auditLogDescription:
      "Trace who changed what, when it happened and which Q BMS entity was affected.",
    auditLogSummary: "Actor · Action · Entity · Metadata",
    ready: "READY",
    identity: "Identity",
    identityHelp: "Who is signed in and which Employee the User is linked to.",
    rolesPermissionsStrip: "Roles & Permissions",
    rolesPermissionsStripHelp:
      "Define Role, Permission, Policy and User Access.",
    governance: "Governance",
    governanceHelp:
      "Control the platform and review historical activity through Audit Log.",
  },
  th: {
    pageTitle: "Super Admin",
    pageDescription:
      "การบริหารระบบ บทบาทและสิทธิ์ การกำกับดูแลโมดูล และบันทึกการตรวจสอบ",
    eyebrow: "Q BMS / การบริหารแพลตฟอร์ม",
    title: "Super Admin",
    intro:
      "เครื่องมือระดับแพลตฟอร์มถูกแบ่งเป็น 4 หมวดการบริหาร เพื่อให้ Sub-tool เป็นระเบียบเมื่อ Q BMS เติบโตขึ้น",
    accessMode: "โหมดการเข้าถึง",
    checking: "กำลังตรวจสอบ...",
    developmentPreview: "Development Preview",
    localDevelopment: "โหมดพัฒนาในเครื่องเท่านั้น",
    explicitRole: "กำหนดผ่าน Role SUPER_ADMIN โดยตรง",
    administrationAreas: "หมวดการบริหาร",
    clearDomains: "แบ่งขอบเขตการกำกับดูแลแพลตฟอร์มอย่างชัดเจน",
    accessModel: "โมเดลสิทธิ์",
    accessModelValue: "Role + Permission + Policy",
    accessModelHelp: "การกำหนดสิทธิ์ผู้ใช้จะคำนวณ Effective Access",
    superAdmin: "Super Admin",
    explicit: "กำหนดโดยตรง",
    neverAutomatic: "ระบบจะไม่ Assign ให้อัตโนมัติ",
    areasEyebrow: "หมวด SUPER ADMIN",
    platformAdministration: "การบริหารแพลตฟอร์ม",
    chooseArea:
      "เลือกหมวดการบริหารหลักก่อน แล้วจึงเข้า Sub-tool ภายในแต่ละหมวด",
    systemAdministration: "การบริหารระบบ",
    systemAdministrationDescription:
      "บัญชีผู้ใช้ Google Identity และการตั้งค่าระดับแพลตฟอร์มของ Q BMS",
    systemAdministrationSummary: "ผู้ใช้และตัวตน · การตั้งค่าระบบ",
    systemAdministrationStatus: "พร้อม 3 · วางแผน 0",
    rolesPermissions: "บทบาทและสิทธิ์",
    rolesPermissionsDescription:
      "Role, Permission, Policy ขององค์กร การกำหนดสิทธิ์ผู้ใช้ และสิทธิ์ที่มีผลจริง",
    rolesPermissionsSummary: "Role · Permission · Policy · Assignment",
    rolesPermissionsStatus: "พร้อม 5 · วางแผน 0",
    moduleManagement: "การจัดการโมดูล",
    moduleManagementDescription:
      "บริหาร Registry, Availability และ Governance ของ Module และ Tool ใน Q BMS",
    moduleManagementSummary: "Module · Tool · Availability",
    foundation: "พร้อมใช้",
    auditLog: "บันทึกการตรวจสอบ",
    auditLogDescription:
      "ตรวจสอบว่าใครเปลี่ยนอะไร เมื่อไหร่ และกระทบ Entity ใดใน Q BMS",
    auditLogSummary: "ผู้ดำเนินการ · Action · Entity · Metadata",
    ready: "พร้อมใช้",
    identity: "ตัวตนผู้ใช้",
    identityHelp: "ใครกำลังเข้าสู่ระบบ และ User ผูกกับ Employee คนใด",
    rolesPermissionsStrip: "บทบาทและสิทธิ์",
    rolesPermissionsStripHelp:
      "กำหนด Role, Permission, Policy และสิทธิ์การเข้าถึงของ User",
    governance: "การกำกับดูแล",
    governanceHelp:
      "ควบคุมแพลตฟอร์มและตรวจสอบย้อนหลังผ่าน Audit Log",
  },
  lo: {
    pageTitle: "Super Admin",
    pageDescription:
      "ການບໍລິຫານລະບົບ, ບົດບາດແລະສິດທິ, ການກຳກັບໂມດູນ ແລະ ບັນທຶກການກວດສອບ",
    eyebrow: "Q BMS / ການບໍລິຫານແພລດຟອມ",
    title: "Super Admin",
    intro:
      "ເຄື່ອງມືລະດັບແພລດຟອມຖືກແບ່ງເປັນ 4 ໝວດການບໍລິຫານ ເພື່ອໃຫ້ Sub-tool ເປັນລະບຽບເມື່ອ Q BMS ເຕີບໂຕ",
    accessMode: "ໂໝດການເຂົ້າເຖິງ",
    checking: "ກຳລັງກວດສອບ...",
    developmentPreview: "Development Preview",
    localDevelopment: "ສຳລັບການພັດທະນາໃນເຄື່ອງເທົ່ານັ້ນ",
    explicitRole: "ກຳນົດຜ່ານ Role SUPER_ADMIN ໂດຍກົງ",
    administrationAreas: "ໝວດການບໍລິຫານ",
    clearDomains: "ແບ່ງຂອບເຂດການກຳກັບແພລດຟອມຢ່າງຊັດເຈນ",
    accessModel: "ໂມເດວສິດທິ",
    accessModelValue: "Role + Permission + Policy",
    accessModelHelp: "ການກຳນົດ User ຈະຄຳນວນ Effective Access",
    superAdmin: "Super Admin",
    explicit: "ກຳນົດໂດຍກົງ",
    neverAutomatic: "ລະບົບບໍ່ Assign ໃຫ້ອັດຕະໂນມັດ",
    areasEyebrow: "ໝວດ SUPER ADMIN",
    platformAdministration: "ການບໍລິຫານແພລດຟອມ",
    chooseArea:
      "ເລືອກໝວດການບໍລິຫານຫຼັກກ່ອນ ແລ້ວເຂົ້າ Sub-tool ພາຍໃນແຕ່ລະໝວດ",
    systemAdministration: "ການບໍລິຫານລະບົບ",
    systemAdministrationDescription:
      "ບັນຊີຜູ້ໃຊ້, Google Identity ແລະ ການຕັ້ງຄ່າລະດັບແພລດຟອມຂອງ Q BMS",
    systemAdministrationSummary: "ຜູ້ໃຊ້ແລະຕົວຕົນ · ການຕັ້ງຄ່າລະບົບ",
    systemAdministrationStatus: "ພ້ອມ 3 · ວາງແຜນ 0",
    rolesPermissions: "ບົດບາດ ແລະ ສິດທິ",
    rolesPermissionsDescription:
      "Role, Permission, Policy ຂອງອົງກອນ, ການກຳນົດສິດ User ແລະ ສິດທີ່ມີຜົນຈິງ",
    rolesPermissionsSummary: "Role · Permission · Policy · Assignment",
    rolesPermissionsStatus: "ພ້ອມ 5 · ວາງແຜນ 0",
    moduleManagement: "ການຈັດການໂມດູນ",
    moduleManagementDescription:
      "ບໍລິຫານ Registry, Availability ແລະ Governance ຂອງ Module ແລະ Tool ໃນ Q BMS",
    moduleManagementSummary: "Module · Tool · Availability",
    foundation: "ພ້ອມໃຊ້",
    auditLog: "ບັນທຶກການກວດສອບ",
    auditLogDescription:
      "ກວດສອບວ່າໃຜປ່ຽນຫຍັງ, ເມື່ອໃດ ແລະ ກະທົບ Entity ໃດໃນ Q BMS",
    auditLogSummary: "ຜູ້ດຳເນີນການ · Action · Entity · Metadata",
    ready: "ພ້ອມໃຊ້",
    identity: "ຕົວຕົນຜູ້ໃຊ້",
    identityHelp: "ໃຜກຳລັງ Login ແລະ User ຜູກກັບ Employee ຄົນໃດ",
    rolesPermissionsStrip: "ບົດບາດ ແລະ ສິດທິ",
    rolesPermissionsStripHelp:
      "ກຳນົດ Role, Permission, Policy ແລະ ສິດເຂົ້າເຖິງຂອງ User",
    governance: "ການກຳກັບດູແລ",
    governanceHelp:
      "ຄວບຄຸມແພລດຟອມ ແລະ ກວດສອບຍ້ອນຫຼັງຜ່ານ Audit Log",
  },
} as const;

export default function SuperAdminHubPageClient() {
  const router = useRouter();
  const locale = useSuperAdminLocale();
  const c = copy[locale];
  const [session, setSession] = useState<AuthSession | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetchAuthSession(controller.signal)
      .then((result) => {
        const allowed =
          result.sessionKind === "DEVELOPMENT_PREVIEW" ||
          Boolean(result.isSuperAdmin);

        if (!allowed) {
          router.replace("/");
          return;
        }

        setSession(result);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        router.replace("/login");
      })
      .finally(() => {
        if (!controller.signal.aborted) setChecking(false);
      });

    return () => controller.abort();
  }, [router]);

  const isDevelopmentPreview =
    session?.sessionKind === "DEVELOPMENT_PREVIEW";

  const areas = useMemo<AreaCard[]>(
    () => [
      {
        title: c.systemAdministration,
        description: c.systemAdministrationDescription,
        icon: "settings",
        href: "/super-admin/system-administration",
        summary: c.systemAdministrationSummary,
        status: c.systemAdministrationStatus,
      },
      {
        title: c.rolesPermissions,
        description: c.rolesPermissionsDescription,
        icon: "shield",
        href: "/super-admin/roles-permissions",
        summary: c.rolesPermissionsSummary,
        status: c.rolesPermissionsStatus,
      },
      {
        title: c.moduleManagement,
        description: c.moduleManagementDescription,
        icon: "grid",
        href: "/super-admin/module-management",
        summary: c.moduleManagementSummary,
        status: c.foundation,
      },
      {
        title: c.auditLog,
        description: c.auditLogDescription,
        icon: "report",
        href: "/super-admin/audit-log",
        summary: c.auditLogSummary,
        status: c.ready,
      },
    ],
    [c]
  );

  return (
    <QBMSAppShell pageTitle={c.pageTitle} pageDescription={c.pageDescription}>
      <div className={styles.page}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>{c.eyebrow}</span>
            <h2>{c.title}</h2>
            <p>{c.intro}</p>
          </div>

          <div className={styles.accessState}>
            <span className={styles.accessIcon}>
              <QBMSIcon name="shield" size={21} />
            </span>
            <div>
              <small>{c.accessMode}</small>
              <strong>
                {checking
                  ? c.checking
                  : isDevelopmentPreview
                    ? c.developmentPreview
                    : c.superAdmin}
              </strong>
              <p>
                {isDevelopmentPreview
                  ? c.localDevelopment
                  : c.explicitRole}
              </p>
            </div>
          </div>
        </section>

        <section className={styles.summary}>
          <article>
            <span>{c.administrationAreas}</span>
            <strong>4</strong>
            <small>{c.clearDomains}</small>
          </article>
          <article>
            <span>{c.accessModel}</span>
            <strong>{c.accessModelValue}</strong>
            <small>{c.accessModelHelp}</small>
          </article>
          <article>
            <span>{c.superAdmin}</span>
            <strong>{c.explicit}</strong>
            <small>{c.neverAutomatic}</small>
          </article>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <span className={styles.kicker}>{c.areasEyebrow}</span>
              <h3>{c.platformAdministration}</h3>
              <p>{c.chooseArea}</p>
            </div>
          </div>

          <div className={styles.areaGrid}>
            {areas.map((area) => (
              <Link key={area.href} href={area.href} className={styles.areaCard}>
                <div className={styles.areaIcon}>
                  <QBMSIcon name={area.icon} size={22} />
                </div>

                <div className={styles.areaCopy}>
                  <div className={styles.areaTitle}>
                    <h4>{area.title}</h4>
                    <span>{area.status}</span>
                  </div>
                  <p>{area.description}</p>
                  <small>{area.summary}</small>
                </div>

                <span className={styles.arrow}>
                  <QBMSIcon name="chevron" size={21} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.ruleStrip}>
          <div>
            <span className={styles.number}>1</span>
            <strong>{c.identity}</strong>
            <p>{c.identityHelp}</p>
          </div>
          <span className={styles.connector}>→</span>
          <div>
            <span className={styles.number}>2</span>
            <strong>{c.rolesPermissionsStrip}</strong>
            <p>{c.rolesPermissionsStripHelp}</p>
          </div>
          <span className={styles.connector}>→</span>
          <div>
            <span className={styles.number}>3</span>
            <strong>{c.governance}</strong>
            <p>{c.governanceHelp}</p>
          </div>
        </section>
      </div>
    </QBMSAppShell>
  );
}
