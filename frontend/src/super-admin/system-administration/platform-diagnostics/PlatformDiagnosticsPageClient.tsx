"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QBMSAppShell, { QBMSIcon } from "@/components/layout/QBMSAppShell";
import { useSuperAdminLocale } from "@/super-admin/i18n/useSuperAdminLocale";
import {
  fetchPlatformDiagnosticsOverview,
  type PlatformDiagnosticCheck,
  type PlatformDiagnosticsOverview,
} from "./platform-diagnostics.api";
import styles from "./PlatformDiagnosticsPage.module.css";

const copy = {
  en: {
    pageTitle: "Platform Diagnostics",
    pageDescription:
      "Read-only health and integrity checks for Q BMS platform foundations.",
    eyebrow: "SYSTEM ADMINISTRATION / DIAGNOSTICS",
    title: "Platform Diagnostics",
    intro:
      "Verify database, schema, access model, Organization Master, onboarding and Super Admin foundations without changing any business data.",
    back: "← System Administration",
    runAgain: "Run Again",
    running: "Running...",
    readOnly: "READ-ONLY",
    overall: "Overall",
    ready: "Ready",
    waiting: "Waiting",
    warning: "Warning",
    fail: "Fail",
    generated: "Generated",
    all: "All",
    platform: "Platform",
    access: "Access",
    organization: "Organization",
    onboarding: "Onboarding",
    superAdmin: "Super Admin",
    governance: "Governance",
    checks: "Diagnostic Checks",
    select: "Select a diagnostic check",
    selectHelp: "to inspect the result and technical details",
    status: "Status",
    category: "Category",
    summary: "Summary",
    details: "Technical Details",
    noDetails: "No additional details.",
    waitingNote:
      "WAITING means the system is not broken; a real business master or user decision is still pending.",
    loading: "Running Platform Diagnostics...",
  },
  th: {
    pageTitle: "การตรวจสอบแพลตฟอร์ม",
    pageDescription:
      "ตรวจสอบ Health และ Integrity ของ Q BMS Foundation แบบอ่านอย่างเดียว",
    eyebrow: "การบริหารระบบ / DIAGNOSTICS",
    title: "การตรวจสอบแพลตฟอร์ม",
    intro:
      "ตรวจสอบ Database, Schema, Access Model, Organization Master, Onboarding และ Super Admin Foundation โดยไม่แก้ข้อมูลธุรกิจ",
    back: "← การบริหารระบบ",
    runAgain: "ตรวจอีกครั้ง",
    running: "กำลังตรวจ...",
    readOnly: "อ่านอย่างเดียว",
    overall: "ภาพรวม",
    ready: "พร้อม",
    waiting: "รอข้อมูล",
    warning: "คำเตือน",
    fail: "ผิดพลาด",
    generated: "ตรวจเมื่อ",
    all: "ทั้งหมด",
    platform: "Platform",
    access: "Access",
    organization: "Organization",
    onboarding: "Onboarding",
    superAdmin: "Super Admin",
    governance: "Governance",
    checks: "รายการตรวจสอบ",
    select: "เลือก Diagnostic Check",
    selectHelp: "เพื่อดูผลและรายละเอียดทางเทคนิค",
    status: "สถานะ",
    category: "หมวด",
    summary: "สรุป",
    details: "รายละเอียดทางเทคนิค",
    noDetails: "ไม่มีรายละเอียดเพิ่มเติม",
    waitingNote:
      "WAITING ไม่ได้แปลว่าระบบพัง แต่หมายถึงยังรอ Master Data จริงหรือการตัดสินใจทางธุรกิจ",
    loading: "กำลังตรวจสอบ Platform...",
  },
  lo: {
    pageTitle: "ການກວດສອບແພລດຟອມ",
    pageDescription:
      "ກວດສອບ Health ແລະ Integrity ຂອງ Q BMS Foundation ແບບອ່ານຢ່າງດຽວ",
    eyebrow: "ການບໍລິຫານລະບົບ / DIAGNOSTICS",
    title: "ການກວດສອບແພລດຟອມ",
    intro:
      "ກວດສອບ Database, Schema, Access Model, Organization Master, Onboarding ແລະ Super Admin Foundation ໂດຍບໍ່ແກ້ຂໍ້ມູນທຸລະກິດ",
    back: "← ການບໍລິຫານລະບົບ",
    runAgain: "ກວດອີກຄັ້ງ",
    running: "ກຳລັງກວດ...",
    readOnly: "ອ່ານຢ່າງດຽວ",
    overall: "ພາບລວມ",
    ready: "ພ້ອມ",
    waiting: "ລໍຖ້າຂໍ້ມູນ",
    warning: "ຄຳເຕືອນ",
    fail: "ຜິດພາດ",
    generated: "ກວດເມື່ອ",
    all: "ທັງໝົດ",
    platform: "Platform",
    access: "Access",
    organization: "Organization",
    onboarding: "Onboarding",
    superAdmin: "Super Admin",
    governance: "Governance",
    checks: "ລາຍການກວດສອບ",
    select: "ເລືອກ Diagnostic Check",
    selectHelp: "ເພື່ອເບິ່ງຜົນ ແລະ ລາຍລະອຽດທາງເຕັກນິກ",
    status: "ສະຖານະ",
    category: "ໝວດ",
    summary: "ສະຫຼຸບ",
    details: "ລາຍລະອຽດທາງເຕັກນິກ",
    noDetails: "ບໍ່ມີລາຍລະອຽດເພີ່ມ",
    waitingNote:
      "WAITING ບໍ່ໄດ້ໝາຍຄວາມວ່າລະບົບພັງ; ໝາຍເຖິງຍັງລໍຖ້າ Master Data ຈິງ ຫຼື ການຕັດສິນໃຈທາງທຸລະກິດ",
    loading: "ກຳລັງກວດສອບ Platform...",
  },
} as const;

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function statusClass(
  status: PlatformDiagnosticCheck["status"],
  styles: Record<string, string>
) {
  if (status === "READY") return styles.readyStatus;
  if (status === "WAITING") return styles.waitingStatus;
  if (status === "WARN") return styles.warningStatus;
  return styles.failStatus;
}

function statusIcon(status: PlatformDiagnosticCheck["status"]) {
  if (status === "READY") return "check" as const;
  if (status === "WAITING") return "clock" as const;
  if (status === "WARN") return "info" as const;
  return "report" as const;
}

export default function PlatformDiagnosticsPageClient() {
  const locale = useSuperAdminLocale();
  const c = copy[locale];

  const [overview, setOverview] =
    useState<PlatformDiagnosticsOverview | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function run(signal?: AbortSignal) {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPlatformDiagnosticsOverview(signal);
      setOverview(data);
      setSelectedCode((current) =>
        current && data.checks.some((item) => item.code === current)
          ? current
          : data.checks[0]?.code || null
      );
    } catch (runError) {
      if (signal?.aborted) return;
      setError(
        runError instanceof Error
          ? runError.message
          : "Unable to run Platform Diagnostics."
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    run(controller.signal);
    return () => controller.abort();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set((overview?.checks || []).map((item) => item.category))),
    [overview]
  );

  const filtered = useMemo(
    () =>
      (overview?.checks || []).filter(
        (item) => category === "ALL" || item.category === category
      ),
    [overview, category]
  );

  const selected =
    overview?.checks.find((item) => item.code === selectedCode) || null;

  const categoryLabel = (value: string) => {
    if (value === "Platform") return c.platform;
    if (value === "Access") return c.access;
    if (value === "Organization") return c.organization;
    if (value === "Onboarding") return c.onboarding;
    if (value === "Super Admin") return c.superAdmin;
    if (value === "Governance") return c.governance;
    return value;
  };

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

            <button
              type="button"
              className={styles.runButton}
              disabled={loading}
              onClick={() => run()}
            >
              <QBMSIcon name="refresh" size={15} />
              {loading ? c.running : c.runAgain}
            </button>

            <Link
              href="/super-admin/system-administration"
              className={styles.backLink}
            >
              {c.back}
            </Link>
          </div>
        </section>

        {error && <div className={styles.error}>{error}</div>}

        <section className={styles.overview}>
          <article className={styles.overallCard}>
            <span>{c.overall}</span>
            <strong>{overview?.overallStatus || (loading ? "..." : "—")}</strong>
            <small>
              {c.generated}: {formatDate(overview?.generatedAt)}
            </small>
          </article>

          <article>
            <span>{c.ready}</span>
            <strong>{overview?.counts.ready ?? "—"}</strong>
          </article>

          <article>
            <span>{c.waiting}</span>
            <strong>{overview?.counts.waiting ?? "—"}</strong>
          </article>

          <article>
            <span>{c.fail}</span>
            <strong>{overview?.counts.fail ?? "—"}</strong>
          </article>
        </section>

        <section className={styles.waitingNote}>
          <QBMSIcon name="clock" size={16} />
          <span>{c.waitingNote}</span>
        </section>

        <section className={styles.workspace}>
          <aside className={styles.checkPanel}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.kicker}>PLATFORM INTEGRITY</span>
                <h3>{c.checks}</h3>
              </div>
              <span className={styles.count}>{filtered.length}</span>
            </div>

            <div className={styles.filters}>
              <button
                type="button"
                className={category === "ALL" ? styles.activeFilter : ""}
                onClick={() => setCategory("ALL")}
              >
                {c.all}
              </button>

              {categories.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={category === item ? styles.activeFilter : ""}
                  onClick={() => setCategory(item)}
                >
                  {categoryLabel(item)}
                </button>
              ))}
            </div>

            <div className={styles.checkList}>
              {loading && !overview && (
                <div className={styles.empty}>{c.loading}</div>
              )}

              {filtered.map((item) => (
                <button
                  type="button"
                  key={item.code}
                  className={`${styles.checkRow} ${
                    selectedCode === item.code ? styles.selected : ""
                  }`}
                  onClick={() => setSelectedCode(item.code)}
                >
                  <span
                    className={`${styles.statusIcon} ${statusClass(
                      item.status,
                      styles
                    )}`}
                  >
                    <QBMSIcon name={statusIcon(item.status)} size={16} />
                  </span>

                  <span className={styles.checkCopy}>
                    <strong>{item.name}</strong>
                    <small>{categoryLabel(item.category)}</small>
                    <p>{item.summary}</p>
                  </span>

                  <span
                    className={`${styles.statusBadge} ${statusClass(
                      item.status,
                      styles
                    )}`}
                  >
                    {item.status}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <main className={styles.detailPanel}>
            {!selected ? (
              <div className={styles.emptyDetail}>
                <QBMSIcon name="dashboard" size={30} />
                <strong>{c.select}</strong>
                <span>{c.selectHelp}</span>
              </div>
            ) : (
              <>
                <div className={styles.detailHead}>
                  <span className={styles.kicker}>DIAGNOSTIC RESULT</span>
                  <h3>{selected.name}</h3>
                  <p>{selected.code}</p>
                </div>

                <section className={styles.infoGrid}>
                  <article>
                    <span>{c.status}</span>
                    <strong
                      className={`${styles.inlineStatus} ${statusClass(
                        selected.status,
                        styles
                      )}`}
                    >
                      {selected.status}
                    </strong>
                  </article>

                  <article>
                    <span>{c.category}</span>
                    <strong>{categoryLabel(selected.category)}</strong>
                  </article>

                  <article className={styles.summaryCard}>
                    <span>{c.summary}</span>
                    <strong>{selected.summary}</strong>
                  </article>
                </section>

                <section className={styles.detailSection}>
                  <div className={styles.detailSectionHead}>
                    <span className={styles.kicker}>{c.details}</span>
                  </div>

                  {selected.details &&
                  Object.keys(selected.details).length > 0 ? (
                    <pre>{JSON.stringify(selected.details, null, 2)}</pre>
                  ) : (
                    <div className={styles.noDetails}>{c.noDetails}</div>
                  )}
                </section>
              </>
            )}
          </main>
        </section>
      </div>
    </QBMSAppShell>
  );
}
