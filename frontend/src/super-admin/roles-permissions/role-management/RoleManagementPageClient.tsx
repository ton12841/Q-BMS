"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QBMSAppShell, { QBMSIcon } from "@/components/layout/QBMSAppShell";
import { useSuperAdminLocale } from "@/super-admin/i18n/useSuperAdminLocale";
import {
  createRoleManagementRole,
  fetchRoleManagementOverview,
  updateRoleManagementRole,
  type RoleManagementOverview,
  type RoleManagementRole,
} from "./role-management.api";
import styles from "./RoleManagementPage.module.css";

type RoleFilter = "ALL" | "SYSTEM" | "CUSTOM" | "ACTIVE";

const copy = {
  en: {
    pageTitle: "Role Management",
    pageDescription:
      "Create and maintain Q BMS Roles and the Permission set contained in each Role.",
    eyebrow: "ROLES & PERMISSIONS / ROLE MANAGEMENT",
    title: "Role Management",
    intro:
      "Role is a reusable set of Permissions. Built-in identity Roles are protected while Custom Admin Roles can be created and maintained here.",
    back: "← Roles & Permissions",
    createRole: "Create Role",
    totalRoles: "Total Roles",
    systemRoles: "System Roles",
    customRoles: "Custom Roles",
    permissions: "Permissions",
    roles: "Roles",
    all: "All",
    system: "System",
    custom: "Custom",
    active: "Active",
    search: "Search Role name or code...",
    loading: "Loading Roles...",
    noRole: "No Role matches this filter.",
    builtIn: "BUILT-IN",
    customBadge: "CUSTOM",
    protected: "PROTECTED",
    assignedUsers: "assigned users",
    roleDetail: "ROLE DETAIL",
    newRole: "NEW CUSTOM ADMIN ROLE",
    roleName: "Role Name",
    roleCode: "Role Code",
    description: "Description",
    category: "Category",
    status: "Status",
    permissionSet: "PERMISSION SET",
    permissionHelp:
      "Permissions selected here are granted by this Role when it is assigned to a User.",
    selectAll: "Select all in group",
    clearGroup: "Clear group",
    save: "Save Role",
    creating: "Creating...",
    saving: "Saving...",
    cancel: "Cancel",
    activeStatus: "ACTIVE",
    inactiveStatus: "INACTIVE",
    definitionLocked: "Built-in Role definition is locked.",
    permissionsEditable:
      "Permission membership can still be maintained for this Admin Role.",
    fullyProtected:
      "This Q BMS Role is protected and cannot be changed from Role Management.",
    customRoleHelp:
      "Custom Roles are created as ADMIN Roles. Hard delete is disabled; use INACTIVE instead.",
    createSuccess: "Custom Admin Role created.",
    saveSuccess: "Role updated.",
    codeHelp: "A-Z, 0-9 and underscore. Example: SALES_ADMIN",
    fixedAdmin: "ADMIN (fixed)",
    searchPermissions: "Search Permissions...",
    selected: "selected",
  },
  th: {
    pageTitle: "การจัดการบทบาท",
    pageDescription:
      "สร้างและดูแล Role ของ Q BMS รวมถึงชุด Permission ภายในแต่ละ Role",
    eyebrow: "บทบาทและสิทธิ์ / การจัดการบทบาท",
    title: "การจัดการบทบาท",
    intro:
      "Role คือชุด Permission ที่นำกลับมาใช้ซ้ำได้ โดย Role หลักของระบบจะถูกป้องกัน ส่วน Custom Admin Role สามารถสร้างและดูแลได้จากหน้านี้",
    back: "← บทบาทและสิทธิ์",
    createRole: "สร้าง Role",
    totalRoles: "Role ทั้งหมด",
    systemRoles: "System Role",
    customRoles: "Custom Role",
    permissions: "Permission",
    roles: "รายการ Role",
    all: "ทั้งหมด",
    system: "ระบบ",
    custom: "กำหนดเอง",
    active: "ใช้งานอยู่",
    search: "ค้นหาชื่อหรือ Code ของ Role...",
    loading: "กำลังโหลด Role...",
    noRole: "ไม่พบ Role ตามตัวกรองนี้",
    builtIn: "ระบบ",
    customBadge: "กำหนดเอง",
    protected: "ป้องกัน",
    assignedUsers: "ผู้ใช้ที่ได้รับ Role",
    roleDetail: "รายละเอียด ROLE",
    newRole: "สร้าง CUSTOM ADMIN ROLE",
    roleName: "ชื่อ Role",
    roleCode: "Role Code",
    description: "คำอธิบาย",
    category: "ประเภท",
    status: "สถานะ",
    permissionSet: "ชุด PERMISSION",
    permissionHelp:
      "Permission ที่เลือกจะถูกมอบให้ User เมื่อ User ได้รับ Role นี้",
    selectAll: "เลือกทั้งหมดในกลุ่ม",
    clearGroup: "ล้างทั้งกลุ่ม",
    save: "บันทึก Role",
    creating: "กำลังสร้าง...",
    saving: "กำลังบันทึก...",
    cancel: "ยกเลิก",
    activeStatus: "ACTIVE",
    inactiveStatus: "INACTIVE",
    definitionLocked: "ข้อมูลหลักของ Built-in Role ถูกล็อกไว้",
    permissionsEditable:
      "แต่ยังสามารถดูแลชุด Permission ของ Admin Role นี้ได้",
    fullyProtected:
      "Role นี้เป็น Role หลักของ Q BMS และไม่สามารถแก้จาก Role Management ได้",
    customRoleHelp:
      "Custom Role จะถูกสร้างเป็นประเภท ADMIN และไม่มี Hard Delete ให้เปลี่ยนเป็น INACTIVE แทน",
    createSuccess: "สร้าง Custom Admin Role แล้ว",
    saveSuccess: "อัปเดต Role แล้ว",
    codeHelp: "ใช้ A-Z, 0-9 และ underscore เช่น SALES_ADMIN",
    fixedAdmin: "ADMIN (กำหนดตายตัว)",
    searchPermissions: "ค้นหา Permission...",
    selected: "เลือกแล้ว",
  },
  lo: {
    pageTitle: "ການຈັດການບົດບາດ",
    pageDescription:
      "ສ້າງ ແລະ ດູແລ Role ຂອງ Q BMS ພ້ອມຊຸດ Permission ພາຍໃນແຕ່ລະ Role",
    eyebrow: "ບົດບາດ ແລະ ສິດທິ / ການຈັດການບົດບາດ",
    title: "ການຈັດການບົດບາດ",
    intro:
      "Role ແມ່ນຊຸດ Permission ທີ່ນຳກັບມາໃຊ້ຊ້ຳໄດ້. Role ຫຼັກຂອງລະບົບຈະຖືກປ້ອງກັນ ແລະ Custom Admin Role ສາມາດສ້າງແລະດູແລໄດ້ຈາກໜ້ານີ້",
    back: "← ບົດບາດ ແລະ ສິດທິ",
    createRole: "ສ້າງ Role",
    totalRoles: "Role ທັງໝົດ",
    systemRoles: "System Role",
    customRoles: "Custom Role",
    permissions: "Permission",
    roles: "ລາຍການ Role",
    all: "ທັງໝົດ",
    system: "ລະບົບ",
    custom: "ກຳນົດເອງ",
    active: "ໃຊ້ງານ",
    search: "ຄົ້ນຫາຊື່ ຫຼື Code ຂອງ Role...",
    loading: "ກຳລັງໂຫຼດ Role...",
    noRole: "ບໍ່ພົບ Role ຕາມຕົວກອງ",
    builtIn: "ລະບົບ",
    customBadge: "ກຳນົດເອງ",
    protected: "ປ້ອງກັນ",
    assignedUsers: "ຜູ້ໃຊ້ທີ່ໄດ້ຮັບ Role",
    roleDetail: "ລາຍລະອຽດ ROLE",
    newRole: "ສ້າງ CUSTOM ADMIN ROLE",
    roleName: "ຊື່ Role",
    roleCode: "Role Code",
    description: "ຄຳອະທິບາຍ",
    category: "ປະເພດ",
    status: "ສະຖານະ",
    permissionSet: "ຊຸດ PERMISSION",
    permissionHelp:
      "Permission ທີ່ເລືອກຈະຖືກມອບໃຫ້ User ເມື່ອ User ໄດ້ຮັບ Role ນີ້",
    selectAll: "ເລືອກທັງໝົດໃນກຸ່ມ",
    clearGroup: "ລ້າງທັງກຸ່ມ",
    save: "ບັນທຶກ Role",
    creating: "ກຳລັງສ້າງ...",
    saving: "ກຳລັງບັນທຶກ...",
    cancel: "ຍົກເລີກ",
    activeStatus: "ACTIVE",
    inactiveStatus: "INACTIVE",
    definitionLocked: "ຂໍ້ມູນຫຼັກຂອງ Built-in Role ຖືກລັອກ",
    permissionsEditable:
      "ແຕ່ຍັງສາມາດດູແລຊຸດ Permission ຂອງ Admin Role ນີ້ໄດ້",
    fullyProtected:
      "Role ນີ້ເປັນ Role ຫຼັກຂອງ Q BMS ແລະ ບໍ່ສາມາດແກ້ຈາກ Role Management",
    customRoleHelp:
      "Custom Role ຈະຖືກສ້າງເປັນ ADMIN ແລະ ບໍ່ມີ Hard Delete; ໃຫ້ປ່ຽນເປັນ INACTIVE ແທນ",
    createSuccess: "ສ້າງ Custom Admin Role ແລ້ວ",
    saveSuccess: "ອັບເດດ Role ແລ້ວ",
    codeHelp: "ໃຊ້ A-Z, 0-9 ແລະ underscore ເຊັ່ນ SALES_ADMIN",
    fixedAdmin: "ADMIN (ກຳນົດຕາຍຕົວ)",
    searchPermissions: "ຄົ້ນຫາ Permission...",
    selected: "ເລືອກແລ້ວ",
  },
} as const;

function codeFromName(name: string) {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

export default function RoleManagementPageClient() {
  const locale = useSuperAdminLocale();
  const c = copy[locale];

  const [overview, setOverview] = useState<RoleManagementOverview | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RoleFilter>("ALL");
  const [search, setSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [draftName, setDraftName] = useState("");
  const [draftCode, setDraftCode] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftStatus, setDraftStatus] = useState("ACTIVE");
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);

  async function load(signal?: AbortSignal, preferRoleId?: string) {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchRoleManagementOverview(signal);
      setOverview(data);
      setSelectedId((current) => {
        if (preferRoleId && data.roles.some((role) => role.id === preferRoleId)) {
          return preferRoleId;
        }
        if (current && data.roles.some((role) => role.id === current)) {
          return current;
        }
        return data.roles[0]?.id || null;
      });
    } catch (loadError) {
      if (signal?.aborted) return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load Role Management."
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, []);

  const selected = useMemo(
    () => overview?.roles.find((role) => role.id === selectedId) || null,
    [overview, selectedId]
  );

  useEffect(() => {
    if (creating) return;

    if (!selected) {
      setDraftName("");
      setDraftCode("");
      setDraftDescription("");
      setDraftStatus("ACTIVE");
      setDraftPermissions([]);
      return;
    }

    setDraftName(selected.name);
    setDraftCode(selected.code);
    setDraftDescription(selected.description || "");
    setDraftStatus(selected.status);
    setDraftPermissions(selected.permissions.map((item) => item.code));
    setNotice(null);
  }, [selected, creating]);

  const filteredRoles = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return (overview?.roles || []).filter((role) => {
      if (filter === "SYSTEM" && !role.isSystemRole) return false;
      if (filter === "CUSTOM" && role.isSystemRole) return false;
      if (filter === "ACTIVE" && role.status !== "ACTIVE") return false;

      if (!normalized) return true;

      return [role.name, role.code, role.category]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [overview, filter, search]);

  const permissionGroups = useMemo(() => {
    const normalized = permissionSearch.trim().toLowerCase();
    const groups = new Map<string, NonNullable<RoleManagementOverview["permissions"]>>();

    for (const permission of overview?.permissions || []) {
      const matches =
        !normalized ||
        [permission.code, permission.name, permission.description || "", permission.group]
          .join(" ")
          .toLowerCase()
          .includes(normalized);

      if (!matches) continue;

      const current = groups.get(permission.group) || [];
      current.push(permission);
      groups.set(permission.group, current);
    }

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [overview, permissionSearch]);

  function beginCreate() {
    setCreating(true);
    setSelectedId(null);
    setDraftName("");
    setDraftCode("");
    setDraftDescription("");
    setDraftStatus("ACTIVE");
    setDraftPermissions([]);
    setNotice(null);
    setError(null);
  }

  function cancelCreate() {
    setCreating(false);
    setSelectedId(overview?.roles[0]?.id || null);
    setNotice(null);
  }

  function togglePermission(code: string) {
    setDraftPermissions((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code]
    );
  }

  function setGroupPermissions(codes: string[], checked: boolean) {
    setDraftPermissions((current) => {
      const set = new Set(current);
      for (const code of codes) {
        if (checked) set.add(code);
        else set.delete(code);
      }
      return Array.from(set);
    });
  }

  async function saveRole() {
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      if (creating) {
        const result = await createRoleManagementRole({
          code: draftCode,
          name: draftName,
          description: draftDescription,
          permissionCodes: draftPermissions,
        });

        setCreating(false);
        await load(undefined, result.id);
        setNotice(c.createSuccess);
        return;
      }

      if (!selected || !selected.canEditPermissions) return;

      await updateRoleManagementRole(selected.id, {
        name: draftName,
        description: draftDescription,
        status: draftStatus,
        permissionCodes: draftPermissions,
      });

      await load(undefined, selected.id);
      setNotice(c.saveSuccess);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save Role."
      );
    } finally {
      setBusy(false);
    }
  }

  const editingRole = creating ? null : selected;
  const canEditDefinition = creating || Boolean(editingRole?.canEditDefinition);
  const canEditPermissions = creating || Boolean(editingRole?.canEditPermissions);
  const fullyProtected = Boolean(editingRole?.isProtected && !editingRole?.canEditPermissions);

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
            <Link href="/super-admin/roles-permissions" className={styles.backLink}>
              {c.back}
            </Link>
            <button type="button" className={styles.primaryButton} onClick={beginCreate}>
              <QBMSIcon name="plus" size={16} />
              {c.createRole}
            </button>
          </div>
        </section>

        {error && <div className={styles.error}>{error}</div>}
        {notice && <div className={styles.notice}>{notice}</div>}

        <section className={styles.metrics}>
          <article>
            <span>{c.totalRoles}</span>
            <strong>{overview?.counts.totalRoles ?? "—"}</strong>
          </article>
          <article>
            <span>{c.systemRoles}</span>
            <strong>{overview?.counts.systemRoles ?? "—"}</strong>
          </article>
          <article>
            <span>{c.customRoles}</span>
            <strong>{overview?.counts.customRoles ?? "—"}</strong>
          </article>
          <article>
            <span>{c.permissions}</span>
            <strong>{overview?.counts.permissions ?? "—"}</strong>
          </article>
        </section>

        <section className={styles.workspace}>
          <aside className={styles.rolePanel}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.kicker}>ROLE CATALOG</span>
                <h3>{c.roles}</h3>
              </div>
            </div>

            <div className={styles.filters}>
              {(
                [
                  ["ALL", c.all],
                  ["SYSTEM", c.system],
                  ["CUSTOM", c.custom],
                  ["ACTIVE", c.active],
                ] as [RoleFilter, string][]
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

            <input
              className={styles.searchInput}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={c.search}
            />

            <div className={styles.roleList}>
              {loading && <div className={styles.empty}>{c.loading}</div>}
              {!loading && !filteredRoles.length && (
                <div className={styles.empty}>{c.noRole}</div>
              )}

              {filteredRoles.map((role) => (
                <button
                  type="button"
                  key={role.id}
                  className={`${styles.roleRow} ${
                    !creating && selectedId === role.id ? styles.selectedRole : ""
                  }`}
                  onClick={() => {
                    setCreating(false);
                    setSelectedId(role.id);
                  }}
                >
                  <span className={styles.roleAvatar}>
                    {role.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className={styles.roleRowCopy}>
                    <strong>{role.name}</strong>
                    <small>{role.code}</small>
                    <span>
                      <em>{role.isSystemRole ? c.builtIn : c.customBadge}</em>
                      {role.isProtected && <em>{c.protected}</em>}
                    </span>
                  </span>
                  <b>{role.assignedUserCount}</b>
                </button>
              ))}
            </div>
          </aside>

          <main className={styles.editorPanel}>
            {!creating && !selected ? (
              <div className={styles.emptyEditor}>
                <QBMSIcon name="briefcase" size={30} />
                <strong>{c.roles}</strong>
              </div>
            ) : (
              <>
                <div className={styles.editorHead}>
                  <div>
                    <span className={styles.kicker}>
                      {creating ? c.newRole : c.roleDetail}
                    </span>
                    <h3>{creating ? c.createRole : selected?.name}</h3>
                    {!creating && selected && (
                      <p>
                        {selected.code} · {selected.category} ·{" "}
                        {selected.assignedUserCount} {c.assignedUsers}
                      </p>
                    )}
                  </div>

                  {creating && (
                    <button type="button" className={styles.secondaryButton} onClick={cancelCreate}>
                      {c.cancel}
                    </button>
                  )}
                </div>

                {fullyProtected && (
                  <div className={styles.protectedNote}>
                    <QBMSIcon name="shield" size={16} />
                    {c.fullyProtected}
                  </div>
                )}

                {!creating &&
                  selected?.isSystemRole &&
                  selected.category === "ADMIN" && (
                    <div className={styles.lockedNote}>
                      <strong>{c.definitionLocked}</strong>
                      <span>{c.permissionsEditable}</span>
                    </div>
                  )}

                {creating && (
                  <div className={styles.infoNote}>{c.customRoleHelp}</div>
                )}

                <section className={styles.formSection}>
                  <div className={styles.formGrid}>
                    <label>
                      <span>{c.roleName}</span>
                      <input
                        value={draftName}
                        disabled={!canEditDefinition}
                        onChange={(event) => {
                          const next = event.target.value;
                          setDraftName(next);
                          if (creating) setDraftCode(codeFromName(next));
                        }}
                      />
                    </label>

                    <label>
                      <span>{c.roleCode}</span>
                      <input
                        value={draftCode}
                        disabled={!creating}
                        onChange={(event) =>
                          setDraftCode(codeFromName(event.target.value))
                        }
                      />
                      {creating && <small>{c.codeHelp}</small>}
                    </label>

                    <label className={styles.fullField}>
                      <span>{c.description}</span>
                      <textarea
                        rows={3}
                        value={draftDescription}
                        disabled={!canEditDefinition}
                        onChange={(event) => setDraftDescription(event.target.value)}
                      />
                    </label>

                    <label>
                      <span>{c.category}</span>
                      <input
                        value={creating ? c.fixedAdmin : selected?.category || ""}
                        disabled
                      />
                    </label>

                    <label>
                      <span>{c.status}</span>
                      <select
                        value={draftStatus}
                        disabled={!canEditDefinition}
                        onChange={(event) => setDraftStatus(event.target.value)}
                      >
                        <option value="ACTIVE">{c.activeStatus}</option>
                        <option value="INACTIVE">{c.inactiveStatus}</option>
                      </select>
                    </label>
                  </div>
                </section>

                <section className={styles.permissionSection}>
                  <div className={styles.permissionHead}>
                    <div>
                      <span className={styles.kicker}>{c.permissionSet}</span>
                      <h3>
                        {draftPermissions.length} {c.selected}
                      </h3>
                      <p>{c.permissionHelp}</p>
                    </div>
                    <input
                      className={styles.permissionSearch}
                      value={permissionSearch}
                      onChange={(event) => setPermissionSearch(event.target.value)}
                      placeholder={c.searchPermissions}
                    />
                  </div>

                  <div className={styles.permissionGroups}>
                    {permissionGroups.map(([group, permissions]) => {
                      const codes = permissions.map((permission) => permission.code);
                      const selectedCount = codes.filter((code) =>
                        draftPermissions.includes(code)
                      ).length;

                      return (
                        <article key={group} className={styles.permissionGroup}>
                          <div className={styles.groupHead}>
                            <div>
                              <strong>{group}</strong>
                              <small>
                                {selectedCount}/{permissions.length}
                              </small>
                            </div>

                            {canEditPermissions && (
                              <div>
                                <button
                                  type="button"
                                  onClick={() => setGroupPermissions(codes, true)}
                                >
                                  {c.selectAll}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setGroupPermissions(codes, false)}
                                >
                                  {c.clearGroup}
                                </button>
                              </div>
                            )}
                          </div>

                          <div className={styles.permissionList}>
                            {permissions.map((permission) => {
                              const checked = draftPermissions.includes(permission.code);

                              return (
                                <label
                                  key={permission.code}
                                  className={`${styles.permissionRow} ${
                                    checked ? styles.permissionSelected : ""
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={!canEditPermissions}
                                    onChange={() => togglePermission(permission.code)}
                                  />
                                  <span>
                                    <strong>{permission.name}</strong>
                                    <small>{permission.code}</small>
                                    {permission.description && (
                                      <p>{permission.description}</p>
                                    )}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>

                {(creating || canEditPermissions) && (
                  <div className={styles.saveBar}>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      disabled={
                        busy ||
                        !draftName.trim() ||
                        (creating && !draftCode.trim())
                      }
                      onClick={saveRole}
                    >
                      {busy
                        ? creating
                          ? c.creating
                          : c.saving
                        : c.save}
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </section>
      </div>
    </QBMSAppShell>
  );
}
