"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QBMSAppShell, { QBMSIcon } from "@/components/layout/QBMSAppShell";
import { useSuperAdminLocale } from "@/super-admin/i18n/useSuperAdminLocale";
import {
  fetchSystemConfigurationOverview,
  type SystemConfigurationOverview,
  type SystemConfigurationSetting,
} from "./system-configuration.api";
import styles from "./SystemConfigurationPage.module.css";

const copy = {
  en: {
    pageTitle: "System Configuration",
    pageDescription:
      "Canonical Q BMS platform configuration registry and source-of-truth metadata.",
    eyebrow: "SYSTEM ADMINISTRATION / CONFIGURATION",
    title: "System Configuration",
    intro:
      "This foundation exposes only canonical, non-secret platform settings that Q BMS has already locked in its architecture. Mutation stays disabled until approval and audit rules are defined.",
    back: "← System Administration",
    readOnly: "READ-ONLY CONFIGURATION",
    total: "Settings",
    groups: "Groups",
    locked: "Locked",
    active: "Active",
    architectureNote:
      "Secrets, passwords, OAuth credentials, database URLs and runtime environment values are intentionally excluded from this registry.",
    allGroups: "All Groups",
    search: "Search setting, key, group or source of truth...",
    registry: "Configuration Registry",
    loading: "Loading System Configuration...",
    noSetting: "No setting matches this filter.",
    detail: "CONFIGURATION DETAIL",
    select: "Select a Setting",
    selectHelp: "to inspect its value, source of truth and mutability",
    key: "Configuration Key",
    group: "Group",
    value: "Current Value",
    type: "Value Type",
    source: "Source of Truth",
    mutability: "Mutability",
    description: "Description",
    governance: "GOVERNANCE",
    lockedSetting: "Architecture Locked",
    lockedHelp:
      "This value is documented as a current platform rule and cannot be changed from the UI.",
    mutation: "Configuration Changes",
    mutationHelp:
      "Future editable settings require explicit validation, approval and Audit Log before activation.",
    activeStatus: "ACTIVE",
  },
  th: {
    pageTitle: "การตั้งค่าระบบ",
    pageDescription:
      "Configuration Registry กลางของ Q BMS พร้อมข้อมูล Source of Truth",
    eyebrow: "การบริหารระบบ / CONFIGURATION",
    title: "การตั้งค่าระบบ",
    intro:
      "Foundation นี้แสดงเฉพาะค่ากลางที่ไม่ใช่ Secret และเป็นกฎที่ Q BMS ล็อกไว้แล้วใน Architecture ส่วนการแก้ไขจะยังไม่เปิดจนกว่าจะกำหนด Approval และ Audit Rule",
    back: "← การบริหารระบบ",
    readOnly: "CONFIGURATION แบบอ่านอย่างเดียว",
    total: "Setting",
    groups: "กลุ่ม",
    locked: "ล็อก",
    active: "ใช้งาน",
    architectureNote:
      "Secret, Password, OAuth Credential, Database URL และ Runtime Environment Value จะไม่ถูกเก็บหรือแสดงใน Registry นี้",
    allGroups: "ทุกกลุ่ม",
    search: "ค้นหา Setting, Key, Group หรือ Source of Truth...",
    registry: "Configuration Registry",
    loading: "กำลังโหลด System Configuration...",
    noSetting: "ไม่พบ Setting ตามตัวกรอง",
    detail: "รายละเอียด CONFIGURATION",
    select: "เลือก Setting",
    selectHelp: "เพื่อดูค่า Source of Truth และ Mutability",
    key: "Configuration Key",
    group: "กลุ่ม",
    value: "ค่าปัจจุบัน",
    type: "ประเภทค่า",
    source: "Source of Truth",
    mutability: "การแก้ไข",
    description: "คำอธิบาย",
    governance: "การกำกับดูแล",
    lockedSetting: "ล็อกตาม Architecture",
    lockedHelp:
      "ค่านี้เป็นกฎปัจจุบันของแพลตฟอร์มและไม่สามารถแก้จาก UI ได้",
    mutation: "การเปลี่ยน Configuration",
    mutationHelp:
      "Setting ที่อนุญาตให้แก้ในอนาคตต้องมี Validation, Approval และ Audit Log ก่อนมีผล",
    activeStatus: "ACTIVE",
  },
  lo: {
    pageTitle: "ການຕັ້ງຄ່າລະບົບ",
    pageDescription:
      "Configuration Registry ກາງຂອງ Q BMS ພ້ອມຂໍ້ມູນ Source of Truth",
    eyebrow: "ການບໍລິຫານລະບົບ / CONFIGURATION",
    title: "ການຕັ້ງຄ່າລະບົບ",
    intro:
      "Foundation ນີ້ສະແດງສະເພາະຄ່າກາງທີ່ບໍ່ແມ່ນ Secret ແລະ ເປັນກົດທີ່ Q BMS ລັອກໄວ້ແລ້ວໃນ Architecture. ການແກ້ໄຂຍັງບໍ່ເປີດຈົນກວ່າຈະກຳນົດ Approval ແລະ Audit Rule",
    back: "← ການບໍລິຫານລະບົບ",
    readOnly: "CONFIGURATION ແບບອ່ານຢ່າງດຽວ",
    total: "Setting",
    groups: "ກຸ່ມ",
    locked: "ລັອກ",
    active: "ໃຊ້ງານ",
    architectureNote:
      "Secret, Password, OAuth Credential, Database URL ແລະ Runtime Environment Value ຈະບໍ່ຖືກເກັບ ຫຼື ສະແດງໃນ Registry ນີ້",
    allGroups: "ທຸກກຸ່ມ",
    search: "ຄົ້ນຫາ Setting, Key, Group ຫຼື Source of Truth...",
    registry: "Configuration Registry",
    loading: "ກຳລັງໂຫຼດ System Configuration...",
    noSetting: "ບໍ່ພົບ Setting ຕາມຕົວກອງ",
    detail: "ລາຍລະອຽດ CONFIGURATION",
    select: "ເລືອກ Setting",
    selectHelp: "ເພື່ອເບິ່ງຄ່າ, Source of Truth ແລະ Mutability",
    key: "Configuration Key",
    group: "ກຸ່ມ",
    value: "ຄ່າປັດຈຸບັນ",
    type: "ປະເພດຄ່າ",
    source: "Source of Truth",
    mutability: "ການແກ້ໄຂ",
    description: "ຄຳອະທິບາຍ",
    governance: "ການກຳກັບດູແລ",
    lockedSetting: "ລັອກຕາມ Architecture",
    lockedHelp:
      "ຄ່ານີ້ເປັນກົດປັດຈຸບັນຂອງແພລດຟອມ ແລະ ບໍ່ສາມາດແກ້ຈາກ UI",
    mutation: "ການປ່ຽນ Configuration",
    mutationHelp:
      "Setting ທີ່ອະນຸຍາດໃຫ້ແກ້ໃນອະນາຄົດຕ້ອງມີ Validation, Approval ແລະ Audit Log ກ່ອນມີຜົນ",
    activeStatus: "ACTIVE",
  },
} as const;

function formatValue(value: unknown) {
  if (Array.isArray(value)) return value.join(" → ");
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export default function SystemConfigurationPageClient() {
  const locale = useSuperAdminLocale();
  const c = copy[locale];

  const [overview, setOverview] =
    useState<SystemConfigurationOverview | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [group, setGroup] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchSystemConfigurationOverview(controller.signal)
      .then((data) => {
        setOverview(data);
        setSelectedId((current) =>
          current && data.settings.some((setting) => setting.id === current)
            ? current
            : data.settings[0]?.id || null
        );
      })
      .catch((loadError) => {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load System Configuration."
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
        new Set((overview?.settings || []).map((setting) => setting.group))
      ).sort(),
    [overview]
  );

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return (overview?.settings || []).filter((setting) => {
      if (group && setting.group !== group) return false;

      if (!normalized) return true;

      return [
        setting.key,
        setting.name,
        setting.group,
        setting.description || "",
        setting.sourceOfTruth,
        formatValue(setting.value),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [overview, group, search]);

  const selected =
    overview?.settings.find((setting) => setting.id === selectedId) || null;

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
            <Link
              href="/super-admin/system-administration"
              className={styles.backLink}
            >
              {c.back}
            </Link>
          </div>
        </section>

        {error && <div className={styles.error}>{error}</div>}

        <section className={styles.metrics}>
          <article>
            <span>{c.total}</span>
            <strong>{overview?.counts.totalSettings ?? "—"}</strong>
          </article>
          <article>
            <span>{c.groups}</span>
            <strong>{overview?.counts.groups ?? "—"}</strong>
          </article>
          <article>
            <span>{c.locked}</span>
            <strong>{overview?.counts.lockedSettings ?? "—"}</strong>
          </article>
          <article>
            <span>{c.active}</span>
            <strong>{overview?.counts.activeSettings ?? "—"}</strong>
          </article>
        </section>

        <section className={styles.architectureNote}>
          <QBMSIcon name="lock" size={16} />
          <span>{c.architectureNote}</span>
        </section>

        <section className={styles.workspace}>
          <aside className={styles.registryPanel}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.kicker}>SYSTEM CONFIGURATION</span>
                <h3>{c.registry}</h3>
              </div>
              <span className={styles.count}>{filtered.length}</span>
            </div>

            <select
              className={styles.groupSelect}
              value={group}
              onChange={(event) => setGroup(event.target.value)}
            >
              <option value="">{c.allGroups}</option>
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

            <div className={styles.settingList}>
              {loading && <div className={styles.empty}>{c.loading}</div>}

              {!loading && filtered.length === 0 && (
                <div className={styles.empty}>{c.noSetting}</div>
              )}

              {filtered.map((setting) => (
                <button
                  type="button"
                  key={setting.id}
                  className={`${styles.settingRow} ${
                    selectedId === setting.id ? styles.selected : ""
                  }`}
                  onClick={() => setSelectedId(setting.id)}
                >
                  <span className={styles.settingIcon}>
                    <QBMSIcon name="settings" size={16} />
                  </span>

                  <span className={styles.settingCopy}>
                    <strong>{setting.name}</strong>
                    <small>{setting.key}</small>
                    <em>{setting.group}</em>
                  </span>

                  <span className={styles.lockedBadge}>
                    {setting.mutability}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <main className={styles.detailPanel}>
            {!selected ? (
              <div className={styles.emptyDetail}>
                <QBMSIcon name="settings" size={30} />
                <strong>{c.select}</strong>
                <span>{c.selectHelp}</span>
              </div>
            ) : (
              <>
                <div className={styles.detailHead}>
                  <span className={styles.kicker}>{c.detail}</span>
                  <h3>{selected.name}</h3>
                  <p>{selected.key}</p>
                </div>

                <section className={styles.infoGrid}>
                  <article>
                    <span>{c.key}</span>
                    <strong>{selected.key}</strong>
                  </article>
                  <article>
                    <span>{c.group}</span>
                    <strong>{selected.group}</strong>
                  </article>
                  <article className={styles.valueCard}>
                    <span>{c.value}</span>
                    <pre>{formatValue(selected.value)}</pre>
                  </article>
                  <article>
                    <span>{c.type}</span>
                    <strong>{selected.valueType}</strong>
                  </article>
                  <article>
                    <span>{c.source}</span>
                    <strong>{selected.sourceOfTruth}</strong>
                  </article>
                  <article>
                    <span>{c.mutability}</span>
                    <strong>{selected.mutability}</strong>
                  </article>
                  <article className={styles.descriptionCard}>
                    <span>{c.description}</span>
                    <strong>{selected.description || "—"}</strong>
                  </article>
                </section>

                <section className={styles.governanceSection}>
                  <div className={styles.sectionHead}>
                    <span className={styles.kicker}>{c.governance}</span>
                    <h3>{c.lockedSetting}</h3>
                    <p>{c.lockedHelp}</p>
                  </div>

                  <div className={styles.ruleGrid}>
                    <article>
                      <span className={styles.ruleIcon}>
                        <QBMSIcon name="lock" size={17} />
                      </span>
                      <div>
                        <strong>{selected.mutability}</strong>
                        <p>{c.lockedHelp}</p>
                      </div>
                    </article>

                    <article>
                      <span className={styles.ruleIcon}>
                        <QBMSIcon name="report" size={17} />
                      </span>
                      <div>
                        <strong>{c.mutation}</strong>
                        <p>{c.mutationHelp}</p>
                      </div>
                    </article>
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
