"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QBMSAppShell, { QBMSIcon } from "@/components/layout/QBMSAppShell";
import { useSuperAdminLocale } from "@/super-admin/i18n/useSuperAdminLocale";
import {
  fetchPermissionManagementOverview,
  type PermissionManagementOverview,
  type PermissionManagementPermission,
} from "./permission-management.api";
import styles from "./PermissionManagementPage.module.css";

type PermissionFilter = "ALL" | "POLICY" | "IN_ROLE" | "UNUSED";

const copy = {
  en: {
    pageTitle: "Permission Management",
    pageDescription:
      "Canonical Q BMS Permission catalog, usage and policy eligibility.",
    eyebrow: "ROLES & PERMISSIONS / PERMISSION CATALOG",
    title: "Permission Management",
    intro:
      "Permission is the smallest access capability in Q BMS. This foundation is read-only because changing a Permission code without matching application code can break access control.",
    back: "← Roles & Permissions",
    readOnly: "READ-ONLY CATALOG",
    total: "Total Permissions",
    groups: "Groups",
    policyEligible: "Level / Grade Eligible",
    unused: "Unused",
    all: "All",
    policy: "Policy Eligible",
    inRole: "Used by Role",
    unusedFilter: "Unused",
    search: "Search Permission code, name or group...",
    permissionCatalog: "Permission Catalog",
    loading: "Loading Permission Catalog...",
    noPermission: "No Permission matches this filter.",
    permissionDetail: "PERMISSION DETAIL",
    selectPermission: "Select a Permission",
    selectHelp: "to inspect role usage and access-policy metadata",
    code: "Permission Code",
    name: "Name",
    group: "Group",
    description: "Description",
    roleUsage: "ROLE USAGE",
    noRoles: "Not currently included in any Role.",
    policyBehavior: "POLICY BEHAVIOR",
    eligible: "Eligible for Level / Grade Policy",
    notEligible: "Not eligible for Level / Grade Policy",
    managedBy: "Managed from",
    roleManagement: "Role Management",
    levelGradePolicy: "Level / Grade Policy",
    architectureNote:
      "Permission Code is treated as an application contract. Create / rename / delete is disabled until Module Management owns a formal Permission registration lifecycle.",
    active: "ACTIVE",
    inactive: "INACTIVE",
    roles: "Roles",
  },
  th: {
    pageTitle: "การจัดการสิทธิ์",
    pageDescription:
      "Permission Catalog กลางของ Q BMS พร้อมการใช้งานและสิทธิ์สำหรับ Level / Grade Policy",
    eyebrow: "บทบาทและสิทธิ์ / PERMISSION CATALOG",
    title: "การจัดการสิทธิ์",
    intro:
      "Permission คือหน่วยสิทธิ์ที่เล็กที่สุดของ Q BMS รอบนี้เปิดเป็น Read-only เพราะการเปลี่ยน Permission Code โดยไม่แก้ Application Code ที่อ้างอิงอาจทำให้ระบบสิทธิ์พัง",
    back: "← บทบาทและสิทธิ์",
    readOnly: "CATALOG แบบอ่านอย่างเดียว",
    total: "Permission ทั้งหมด",
    groups: "กลุ่ม",
    policyEligible: "ใช้กับ Level / Grade ได้",
    unused: "ยังไม่ถูกใช้",
    all: "ทั้งหมด",
    policy: "ใช้กับ Policy ได้",
    inRole: "ถูกใช้ใน Role",
    unusedFilter: "ยังไม่ถูกใช้",
    search: "ค้นหา Permission Code, ชื่อ หรือกลุ่ม...",
    permissionCatalog: "Permission Catalog",
    loading: "กำลังโหลด Permission Catalog...",
    noPermission: "ไม่พบ Permission ตามตัวกรอง",
    permissionDetail: "รายละเอียด PERMISSION",
    selectPermission: "เลือก Permission",
    selectHelp: "เพื่อดูการใช้งานใน Role และข้อมูล Access Policy",
    code: "Permission Code",
    name: "ชื่อ",
    group: "กลุ่ม",
    description: "คำอธิบาย",
    roleUsage: "การใช้งานใน ROLE",
    noRoles: "Permission นี้ยังไม่ได้อยู่ใน Role ใด",
    policyBehavior: "พฤติกรรม POLICY",
    eligible: "สามารถใช้กับ Level / Grade Policy ได้",
    notEligible: "ไม่สามารถใช้กับ Level / Grade Policy",
    managedBy: "จัดการจาก",
    roleManagement: "การจัดการบทบาท",
    levelGradePolicy: "นโยบาย Level / Grade",
    architectureNote:
      "Permission Code ถือเป็น Contract ของ Application จึงยังไม่เปิด Create / Rename / Delete จนกว่า Module Management จะมี Permission Registration Lifecycle ที่ชัดเจน",
    active: "ใช้งาน",
    inactive: "ไม่ใช้งาน",
    roles: "Role",
  },
  lo: {
    pageTitle: "ການຈັດການສິດທິ",
    pageDescription:
      "Permission Catalog ກາງຂອງ Q BMS ພ້ອມການນຳໃຊ້ ແລະ ສິດສຳລັບ Level / Grade Policy",
    eyebrow: "ບົດບາດ ແລະ ສິດທິ / PERMISSION CATALOG",
    title: "ການຈັດການສິດທິ",
    intro:
      "Permission ແມ່ນຫົວໜ່ວຍສິດທິທີ່ນ້ອຍທີ່ສຸດຂອງ Q BMS. ຮອບນີ້ເປີດເປັນ Read-only ເພາະການປ່ຽນ Permission Code ໂດຍບໍ່ແກ້ Application Code ທີ່ອ້າງອີງອາດເຮັດໃຫ້ລະບົບສິດທິຜິດພາດ",
    back: "← ບົດບາດ ແລະ ສິດທິ",
    readOnly: "CATALOG ແບບອ່ານຢ່າງດຽວ",
    total: "Permission ທັງໝົດ",
    groups: "ກຸ່ມ",
    policyEligible: "ໃຊ້ກັບ Level / Grade ໄດ້",
    unused: "ຍັງບໍ່ຖືກໃຊ້",
    all: "ທັງໝົດ",
    policy: "ໃຊ້ກັບ Policy ໄດ້",
    inRole: "ຖືກໃຊ້ໃນ Role",
    unusedFilter: "ຍັງບໍ່ຖືກໃຊ້",
    search: "ຄົ້ນຫາ Permission Code, ຊື່ ຫຼື ກຸ່ມ...",
    permissionCatalog: "Permission Catalog",
    loading: "ກຳລັງໂຫຼດ Permission Catalog...",
    noPermission: "ບໍ່ພົບ Permission ຕາມຕົວກອງ",
    permissionDetail: "ລາຍລະອຽດ PERMISSION",
    selectPermission: "ເລືອກ Permission",
    selectHelp: "ເພື່ອເບິ່ງການນຳໃຊ້ໃນ Role ແລະ ຂໍ້ມູນ Access Policy",
    code: "Permission Code",
    name: "ຊື່",
    group: "ກຸ່ມ",
    description: "ຄຳອະທິບາຍ",
    roleUsage: "ການນຳໃຊ້ໃນ ROLE",
    noRoles: "Permission ນີ້ຍັງບໍ່ໄດ້ຢູ່ໃນ Role ໃດ",
    policyBehavior: "ພຶດຕິກຳ POLICY",
    eligible: "ສາມາດໃຊ້ກັບ Level / Grade Policy ໄດ້",
    notEligible: "ບໍ່ສາມາດໃຊ້ກັບ Level / Grade Policy",
    managedBy: "ຈັດການຈາກ",
    roleManagement: "ການຈັດການບົດບາດ",
    levelGradePolicy: "ນະໂຍບາຍ Level / Grade",
    architectureNote:
      "Permission Code ຖືກມອງເປັນ Contract ຂອງ Application ຈຶ່ງຍັງບໍ່ເປີດ Create / Rename / Delete ຈົນກວ່າ Module Management ຈະມີ Permission Registration Lifecycle ທີ່ຊັດເຈນ",
    active: "ໃຊ້ງານ",
    inactive: "ບໍ່ໃຊ້ງານ",
    roles: "Role",
  },
} as const;

export default function PermissionManagementPageClient() {
  const locale = useSuperAdminLocale();
  const c = copy[locale];

  const [overview, setOverview] =
    useState<PermissionManagementOverview | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<PermissionFilter>("ALL");
  const [group, setGroup] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchPermissionManagementOverview(controller.signal)
      .then((data) => {
        setOverview(data);
        setSelectedId((current) =>
          current && data.permissions.some((permission) => permission.id === current)
            ? current
            : data.permissions[0]?.id || null
        );
      })
      .catch((loadError) => {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load Permission Management."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const groups = useMemo(
    () =>
      Array.from(
        new Set((overview?.permissions || []).map((permission) => permission.group))
      ).sort(),
    [overview]
  );

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return (overview?.permissions || []).filter((permission) => {
      if (group && permission.group !== group) return false;
      if (filter === "POLICY" && !permission.levelGradePolicyEligible) return false;
      if (filter === "IN_ROLE" && permission.roleCount === 0) return false;
      if (filter === "UNUSED" && permission.roleCount > 0) return false;

      if (!normalized) return true;

      return [
        permission.code,
        permission.name,
        permission.description || "",
        permission.group,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [overview, group, filter, search]);

  const selected =
    overview?.permissions.find((permission) => permission.id === selectedId) || null;

  return (
    <QBMSAppShell pageTitle={c.pageTitle} pageDescription={c.pageDescription}>
      <div className={styles.page}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>{c.eyebrow}</span>
            <h2>{c.title}</h2>
            <p>{c.intro}</p>
          </div>

          <div className={styles.heroActions}>
            <span className={styles.readOnly}>
              <QBMSIcon name="shield" size={15} />
              {c.readOnly}
            </span>
            <Link href="/super-admin/roles-permissions" className={styles.backLink}>
              {c.back}
            </Link>
          </div>
        </section>

        {error && <div className={styles.error}>{error}</div>}

        <section className={styles.metrics}>
          <article>
            <span>{c.total}</span>
            <strong>{overview?.counts.totalPermissions ?? "—"}</strong>
          </article>
          <article>
            <span>{c.groups}</span>
            <strong>{overview?.counts.permissionGroups ?? "—"}</strong>
          </article>
          <article>
            <span>{c.policyEligible}</span>
            <strong>{overview?.counts.policyEligible ?? "—"}</strong>
          </article>
          <article>
            <span>{c.unused}</span>
            <strong>{overview?.counts.unusedPermissions ?? "—"}</strong>
          </article>
        </section>

        <section className={styles.architectureNote}>
          <QBMSIcon name="info" size={16} />
          <span>{c.architectureNote}</span>
        </section>

        <section className={styles.workspace}>
          <aside className={styles.catalogPanel}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.kicker}>PERMISSION CATALOG</span>
                <h3>{c.permissionCatalog}</h3>
              </div>
              <span className={styles.count}>{filtered.length}</span>
            </div>

            <div className={styles.filters}>
              {(
                [
                  ["ALL", c.all],
                  ["POLICY", c.policy],
                  ["IN_ROLE", c.inRole],
                  ["UNUSED", c.unusedFilter],
                ] as [PermissionFilter, string][]
              ).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={filter === value ? styles.activeFilter : ""}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <select
              className={styles.groupSelect}
              value={group}
              onChange={(event) => setGroup(event.target.value)}
            >
              <option value="">{c.all} — {c.groups}</option>
              {groups.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <input
              className={styles.searchInput}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={c.search}
            />

            <div className={styles.permissionList}>
              {loading && <div className={styles.empty}>{c.loading}</div>}
              {!loading && filtered.length === 0 && (
                <div className={styles.empty}>{c.noPermission}</div>
              )}

              {filtered.map((permission) => (
                <button
                  key={permission.id}
                  type="button"
                  className={`${styles.permissionRow} ${
                    selectedId === permission.id ? styles.selected : ""
                  }`}
                  onClick={() => setSelectedId(permission.id)}
                >
                  <span className={styles.permissionIcon}>
                    <QBMSIcon name="badge" size={16} />
                  </span>

                  <span className={styles.permissionCopy}>
                    <strong>{permission.name}</strong>
                    <small>{permission.code}</small>
                    <em>{permission.group}</em>
                  </span>

                  <span className={styles.roleCount}>{permission.roleCount}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className={styles.detailPanel}>
            {!selected ? (
              <div className={styles.emptyDetail}>
                <QBMSIcon name="badge" size={30} />
                <strong>{c.selectPermission}</strong>
                <span>{c.selectHelp}</span>
              </div>
            ) : (
              <>
                <div className={styles.detailHead}>
                  <span className={styles.kicker}>{c.permissionDetail}</span>
                  <h3>{selected.name}</h3>
                  <p>{selected.code}</p>
                </div>

                <section className={styles.infoGrid}>
                  <article>
                    <span>{c.code}</span>
                    <strong>{selected.code}</strong>
                  </article>
                  <article>
                    <span>{c.name}</span>
                    <strong>{selected.name}</strong>
                  </article>
                  <article>
                    <span>{c.group}</span>
                    <strong>{selected.group}</strong>
                  </article>
                  <article>
                    <span>{c.description}</span>
                    <strong>{selected.description || "—"}</strong>
                  </article>
                </section>

                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <div>
                      <span className={styles.kicker}>{c.roleUsage}</span>
                      <h3>
                        {selected.roleCount} {c.roles}
                      </h3>
                    </div>

                    <Link
                      href="/super-admin/roles-permissions/roles"
                      className={styles.manageLink}
                    >
                      {c.managedBy} {c.roleManagement} →
                    </Link>
                  </div>

                  {selected.roles.length ? (
                    <div className={styles.roleGrid}>
                      {selected.roles.map((role) => (
                        <article key={role.code} className={styles.roleCard}>
                          <div>
                            <strong>{role.name}</strong>
                            <small>{role.code}</small>
                          </div>
                          <span
                            className={
                              role.status === "ACTIVE"
                                ? styles.activeBadge
                                : styles.inactiveBadge
                            }
                          >
                            {role.status === "ACTIVE" ? c.active : c.inactive}
                          </span>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.noRoles}>{c.noRoles}</div>
                  )}
                </section>

                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <div>
                      <span className={styles.kicker}>{c.policyBehavior}</span>
                      <h3>
                        {selected.levelGradePolicyEligible
                          ? c.eligible
                          : c.notEligible}
                      </h3>
                    </div>

                    {selected.levelGradePolicyEligible && (
                      <Link
                        href="/super-admin/access-control/organization-policy"
                        className={styles.manageLink}
                      >
                        {c.managedBy} {c.levelGradePolicy} →
                      </Link>
                    )}
                  </div>

                  <div
                    className={
                      selected.levelGradePolicyEligible
                        ? styles.policyYes
                        : styles.policyNo
                    }
                  >
                    <QBMSIcon
                      name={selected.levelGradePolicyEligible ? "check" : "lock"}
                      size={17}
                    />
                    <span>
                      {selected.levelGradePolicyEligible
                        ? c.eligible
                        : c.notEligible}
                    </span>
                  </div>
                </section>
              </>
            )}
          </main>
        </section>
      </div>
    </QBMSAppShell>
  );
}
