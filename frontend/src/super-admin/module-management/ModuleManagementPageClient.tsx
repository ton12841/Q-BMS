"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QBMSAppShell, { QBMSIcon } from "@/components/layout/QBMSAppShell";
import { useSuperAdminLocale } from "@/super-admin/i18n/useSuperAdminLocale";
import {
  fetchModuleManagementOverview,
  type ModuleManagementOverview,
  type PlatformRegistryItem,
} from "./module-management.api";
import styles from "./ModuleManagementPage.module.css";

type TypeFilter = "ALL" | "MODULE" | "TOOL" | "HOLD";

const itemLabels = {
  EMPLOYEE: { en: "Employee", th: "พนักงาน", lo: "ພະນັກງານ" },
  ORGANIZATION: { en: "Organization", th: "โครงสร้างองค์กร", lo: "ໂຄງສ້າງອົງກອນ" },
  CUSTOMER: { en: "Customer", th: "ลูกค้า", lo: "ລູກຄ້າ" },
  PRODUCT: { en: "Product", th: "สินค้าและบริการ", lo: "ສິນຄ້າ ແລະ ບໍລິການ" },
  SUPPLIER: { en: "Supplier / Vendor", th: "Supplier / Vendor", lo: "Supplier / Vendor" },
  LOCATION: { en: "Location / Site", th: "สถานที่ / Site", lo: "ສະຖານທີ່ / Site" },
  ASSET: { en: "Asset", th: "ทรัพย์สิน", lo: "ຊັບສິນ" },
  DOCUMENT: { en: "Document", th: "เอกสาร", lo: "ເອກະສານ" },
  TASK_APPROVAL: { en: "Task & Approval", th: "งานและการอนุมัติ", lo: "ວຽກ ແລະ ການອະນຸມັດ" },
  NOTIFICATION: { en: "Notification", th: "การแจ้งเตือน", lo: "ການແຈ້ງເຕືອນ" },
  HRM: { en: "HRM", th: "HRM", lo: "HRM" },
  INVENTORY: { en: "Inventory", th: "คลังและสต็อก", lo: "ຄັງ ແລະ ສະຕັອກ" },
  INSTALLATION: { en: "Installation", th: "การติดตั้ง", lo: "ການຕິດຕັ້ງ" },
  FINANCIAL: { en: "Financial", th: "การเงิน", lo: "ການເງິນ" },
  PROCUREMENT: { en: "Procurement", th: "จัดซื้อ", lo: "ຈັດຊື້" },
  MANAGEMENT_DASHBOARD: { en: "Management Dashboard", th: "แดชบอร์ดผู้บริหาร", lo: "ແດຊບອດຜູ້ບໍລິຫານ" },
  CRM: { en: "CRM", th: "CRM", lo: "CRM" },
  IT_ADMIN: { en: "IT Admin", th: "IT Admin", lo: "IT Admin" },
  SUPER_ADMIN: { en: "Super Admin", th: "Super Admin", lo: "Super Admin" },
} as const;

const copy = {
  en: {
    pageTitle: "Module Management",
    pageDescription:
      "Canonical registry for Q BMS Modules and Tools, lifecycle and availability.",
    eyebrow: "SUPER ADMIN / PLATFORM REGISTRY",
    title: "Module Management",
    intro:
      "The registry is now the platform source of truth for the 10 shared Modules and 9 Tools. This foundation is read-only until dependency and enable/disable rules are locked.",
    back: "← Super Admin",
    readOnly: "READ-ONLY REGISTRY",
    total: "Registry Items",
    modules: "Modules",
    tools: "Tools",
    hold: "HOLD",
    all: "All",
    module: "Modules",
    tool: "Tools",
    holdOnly: "HOLD",
    allDomains: "All Domains",
    search: "Search code, name, domain or ownership...",
    registry: "Module / Tool Registry",
    loading: "Loading Platform Registry...",
    noItem: "No registry item matches this filter.",
    detail: "REGISTRY DETAIL",
    select: "Select a Module or Tool",
    selectHelp: "to inspect lifecycle, ownership and permission namespace",
    type: "Type",
    domain: "Domain",
    ownership: "Ownership",
    lifecycle: "Lifecycle",
    availability: "Availability",
    namespace: "Permission Namespace",
    namespacePermissions: "Namespace Permissions",
    description: "Description",
    governance: "GOVERNANCE",
    sourceOfTruth: "Registry Source of Truth",
    sourceHelp:
      "Module / Tool availability will be controlled here only after dependency rules are defined.",
    enableDisable: "Enable / Disable",
    disabled: "Disabled in foundation",
    permissionLifecycle: "Permission Registration",
    permissionHelp:
      "Permission creation remains code-driven until Module Management owns a formal registration lifecycle.",
    crmHold: "CRM HOLD is preserved",
    architectureNote:
      "This registry does not duplicate business data. Employee, Customer, Product, Asset and other shared data remain owned by their Shared Modules.",
  },
  th: {
    pageTitle: "การจัดการโมดูล",
    pageDescription:
      "Registry กลางของ Module และ Tool ใน Q BMS พร้อม Lifecycle และ Availability",
    eyebrow: "SUPER ADMIN / PLATFORM REGISTRY",
    title: "การจัดการโมดูล",
    intro:
      "ตอนนี้ Registry เป็น Source of Truth ระดับแพลตฟอร์มสำหรับ 10 Shared Modules และ 9 Tools โดยรอบแรกยังเป็น Read-only จนกว่าเราจะล็อก Dependency และกฎ Enable / Disable",
    back: "← Super Admin",
    readOnly: "REGISTRY แบบอ่านอย่างเดียว",
    total: "รายการทั้งหมด",
    modules: "Module",
    tools: "Tool",
    hold: "HOLD",
    all: "ทั้งหมด",
    module: "Module",
    tool: "Tool",
    holdOnly: "HOLD",
    allDomains: "ทุก Domain",
    search: "ค้นหา Code, ชื่อ, Domain หรือ Ownership...",
    registry: "Module / Tool Registry",
    loading: "กำลังโหลด Platform Registry...",
    noItem: "ไม่พบรายการตามตัวกรอง",
    detail: "รายละเอียด REGISTRY",
    select: "เลือก Module หรือ Tool",
    selectHelp: "เพื่อดู Lifecycle, Ownership และ Permission Namespace",
    type: "ประเภท",
    domain: "Domain",
    ownership: "Ownership",
    lifecycle: "Lifecycle",
    availability: "Availability",
    namespace: "Permission Namespace",
    namespacePermissions: "Permission ใน Namespace",
    description: "คำอธิบาย",
    governance: "การกำกับดูแล",
    sourceOfTruth: "Registry Source of Truth",
    sourceHelp:
      "การเปิด/ปิด Module หรือ Tool จะบริหารจากที่นี่ เมื่อกฎ Dependency ถูกกำหนดครบแล้ว",
    enableDisable: "Enable / Disable",
    disabled: "ยังปิดไว้ใน Foundation",
    permissionLifecycle: "การลงทะเบียน Permission",
    permissionHelp:
      "การสร้าง Permission ยังอิง Application Code จนกว่า Module Management จะมี Registration Lifecycle ที่ชัดเจน",
    crmHold: "ยังคง CRM เป็น HOLD",
    architectureNote:
      "Registry นี้ไม่สร้างข้อมูลธุรกิจซ้ำ ข้อมูล Employee, Customer, Product, Asset และ Shared Data อื่นยังคงมี Shared Module ของตัวเองเป็น Source of Truth",
  },
  lo: {
    pageTitle: "ການຈັດການໂມດູນ",
    pageDescription:
      "Registry ກາງຂອງ Module ແລະ Tool ໃນ Q BMS ພ້ອມ Lifecycle ແລະ Availability",
    eyebrow: "SUPER ADMIN / PLATFORM REGISTRY",
    title: "ການຈັດການໂມດູນ",
    intro:
      "Registry ເປັນ Source of Truth ລະດັບແພລດຟອມສຳລັບ 10 Shared Modules ແລະ 9 Tools. ຮອບທຳອິດຍັງເປັນ Read-only ຈົນກວ່າຈະກຳນົດ Dependency ແລະ ກົດ Enable / Disable ຄົບ",
    back: "← Super Admin",
    readOnly: "REGISTRY ແບບອ່ານຢ່າງດຽວ",
    total: "ລາຍການທັງໝົດ",
    modules: "Module",
    tools: "Tool",
    hold: "HOLD",
    all: "ທັງໝົດ",
    module: "Module",
    tool: "Tool",
    holdOnly: "HOLD",
    allDomains: "ທຸກ Domain",
    search: "ຄົ້ນຫາ Code, ຊື່, Domain ຫຼື Ownership...",
    registry: "Module / Tool Registry",
    loading: "ກຳລັງໂຫຼດ Platform Registry...",
    noItem: "ບໍ່ພົບລາຍການຕາມຕົວກອງ",
    detail: "ລາຍລະອຽດ REGISTRY",
    select: "ເລືອກ Module ຫຼື Tool",
    selectHelp: "ເພື່ອເບິ່ງ Lifecycle, Ownership ແລະ Permission Namespace",
    type: "ປະເພດ",
    domain: "Domain",
    ownership: "Ownership",
    lifecycle: "Lifecycle",
    availability: "Availability",
    namespace: "Permission Namespace",
    namespacePermissions: "Permission ໃນ Namespace",
    description: "ຄຳອະທິບາຍ",
    governance: "ການກຳກັບດູແລ",
    sourceOfTruth: "Registry Source of Truth",
    sourceHelp:
      "ການເປີດ/ປິດ Module ຫຼື Tool ຈະບໍລິຫານຈາກທີ່ນີ້ ເມື່ອກົດ Dependency ຖືກກຳນົດຄົບ",
    enableDisable: "Enable / Disable",
    disabled: "ຍັງປິດໄວ້ໃນ Foundation",
    permissionLifecycle: "ການລົງທະບຽນ Permission",
    permissionHelp:
      "ການສ້າງ Permission ຍັງອີງ Application Code ຈົນກວ່າ Module Management ຈະມີ Registration Lifecycle ທີ່ຊັດເຈນ",
    crmHold: "ຍັງຄົງ CRM ເປັນ HOLD",
    architectureNote:
      "Registry ນີ້ບໍ່ສ້າງຂໍ້ມູນທຸລະກິດຊ້ຳ. Employee, Customer, Product, Asset ແລະ Shared Data ອື່ນ ຍັງມີ Shared Module ຂອງຕົນເອງເປັນ Source of Truth",
  },
} as const;

function localizedName(item: PlatformRegistryItem, locale: "en" | "th" | "lo") {
  const label = itemLabels[item.code as keyof typeof itemLabels];
  return label?.[locale] || item.name;
}

export default function ModuleManagementPageClient() {
  const locale = useSuperAdminLocale();
  const c = copy[locale];

  const [overview, setOverview] = useState<ModuleManagementOverview | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<TypeFilter>("ALL");
  const [domain, setDomain] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchModuleManagementOverview(controller.signal)
      .then((data) => {
        setOverview(data);
        setSelectedId((current) =>
          current && data.items.some((item) => item.id === current)
            ? current
            : data.items[0]?.id || null
        );
      })
      .catch((loadError) => {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load Module Management."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const domains = useMemo(
    () =>
      Array.from(new Set((overview?.items || []).map((item) => item.domain))).sort(),
    [overview]
  );

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return (overview?.items || []).filter((item) => {
      if (filter === "MODULE" && item.type !== "MODULE") return false;
      if (filter === "TOOL" && item.type !== "TOOL") return false;
      if (filter === "HOLD" && item.lifecycleStatus !== "HOLD") return false;
      if (domain && item.domain !== domain) return false;

      if (!normalized) return true;

      return [
        item.code,
        item.name,
        localizedName(item, locale),
        item.domain,
        item.ownership,
        item.lifecycleStatus,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [overview, filter, domain, search, locale]);

  const selected =
    overview?.items.find((item) => item.id === selectedId) || null;

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
            <Link href="/super-admin" className={styles.backLink}>
              {c.back}
            </Link>
          </div>
        </section>

        {error && <div className={styles.error}>{error}</div>}

        <section className={styles.metrics}>
          <article>
            <span>{c.total}</span>
            <strong>{overview?.counts.totalItems ?? "—"}</strong>
          </article>
          <article>
            <span>{c.modules}</span>
            <strong>{overview?.counts.modules ?? "—"}</strong>
          </article>
          <article>
            <span>{c.tools}</span>
            <strong>{overview?.counts.tools ?? "—"}</strong>
          </article>
          <article>
            <span>{c.hold}</span>
            <strong>{overview?.counts.holdItems ?? "—"}</strong>
          </article>
        </section>

        <section className={styles.architectureNote}>
          <QBMSIcon name="info" size={16} />
          <span>{c.architectureNote}</span>
        </section>

        <section className={styles.workspace}>
          <aside className={styles.registryPanel}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.kicker}>PLATFORM REGISTRY</span>
                <h3>{c.registry}</h3>
              </div>
              <span className={styles.count}>{filtered.length}</span>
            </div>

            <div className={styles.filters}>
              {(
                [
                  ["ALL", c.all],
                  ["MODULE", c.module],
                  ["TOOL", c.tool],
                  ["HOLD", c.holdOnly],
                ] as [TypeFilter, string][]
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
              className={styles.domainSelect}
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
            >
              <option value="">{c.allDomains}</option>
              {domains.map((item) => (
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

            <div className={styles.itemList}>
              {loading && <div className={styles.empty}>{c.loading}</div>}
              {!loading && filtered.length === 0 && (
                <div className={styles.empty}>{c.noItem}</div>
              )}

              {filtered.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`${styles.itemRow} ${
                    item.id === selectedId ? styles.selected : ""
                  }`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className={styles.itemIcon}>
                    <QBMSIcon
                      name={item.type === "MODULE" ? "grid" : "briefcase"}
                      size={16}
                    />
                  </span>

                  <span className={styles.itemCopy}>
                    <strong>{localizedName(item, locale)}</strong>
                    <small>{item.code}</small>
                    <em>
                      {item.type} · {item.domain}
                    </em>
                  </span>

                  <span
                    className={
                      item.lifecycleStatus === "HOLD"
                        ? styles.holdBadge
                        : styles.registeredBadge
                    }
                  >
                    {item.lifecycleStatus}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <main className={styles.detailPanel}>
            {!selected ? (
              <div className={styles.emptyDetail}>
                <QBMSIcon name="grid" size={30} />
                <strong>{c.select}</strong>
                <span>{c.selectHelp}</span>
              </div>
            ) : (
              <>
                <div className={styles.detailHead}>
                  <span className={styles.kicker}>{c.detail}</span>
                  <h3>{localizedName(selected, locale)}</h3>
                  <p>{selected.code}</p>
                </div>

                <section className={styles.infoGrid}>
                  <article>
                    <span>{c.type}</span>
                    <strong>{selected.type}</strong>
                  </article>
                  <article>
                    <span>{c.domain}</span>
                    <strong>{selected.domain}</strong>
                  </article>
                  <article>
                    <span>{c.ownership}</span>
                    <strong>{selected.ownership}</strong>
                  </article>
                  <article>
                    <span>{c.lifecycle}</span>
                    <strong>{selected.lifecycleStatus}</strong>
                  </article>
                  <article>
                    <span>{c.availability}</span>
                    <strong>{selected.availabilityStatus}</strong>
                  </article>
                  <article>
                    <span>{c.namespace}</span>
                    <strong>{selected.permissionNamespace || "—"}</strong>
                  </article>
                  <article>
                    <span>{c.namespacePermissions}</span>
                    <strong>{selected.namespacePermissionCount}</strong>
                  </article>
                  <article>
                    <span>{c.description}</span>
                    <strong>{selected.description || "—"}</strong>
                  </article>
                </section>

                <section className={styles.governanceSection}>
                  <div className={styles.sectionHead}>
                    <span className={styles.kicker}>{c.governance}</span>
                    <h3>{c.sourceOfTruth}</h3>
                    <p>{c.sourceHelp}</p>
                  </div>

                  <div className={styles.ruleGrid}>
                    <article>
                      <span className={styles.ruleIcon}>
                        <QBMSIcon name="lock" size={17} />
                      </span>
                      <div>
                        <strong>{c.enableDisable}</strong>
                        <p>{c.disabled}</p>
                      </div>
                    </article>

                    <article>
                      <span className={styles.ruleIcon}>
                        <QBMSIcon name="badge" size={17} />
                      </span>
                      <div>
                        <strong>{c.permissionLifecycle}</strong>
                        <p>{c.permissionHelp}</p>
                      </div>
                    </article>

                    {selected.code === "CRM" && (
                      <article className={styles.crmRule}>
                        <span className={styles.ruleIcon}>
                          <QBMSIcon name="pause" size={17} />
                        </span>
                        <div>
                          <strong>{c.crmHold}</strong>
                          <p>CRM · HOLD · RESERVED</p>
                        </div>
                      </article>
                    )}
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
