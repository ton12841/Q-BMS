"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QBMSAppShell, {
  QBMSIcon,
  type QBMSIconName,
} from "@/components/layout/QBMSAppShell";
import { fetchAuthSession, type AuthSession } from "@/modules/auth/api/auth.api";
import { useI18n } from "@/i18n/useQBMSI18n";
import {
  getQaModule,
  ORGANIZATION_QA_NODES,
  type QaModuleConfig,
} from "./qaModuleRegistry";
import styles from "./QaDataModePage.module.css";

type Scenario = "POPULATED" | "EMPTY";

function statusTone(status: QaModuleConfig["status"]) {
  if (status === "READY") return styles.ready;
  if (status === "FOUNDATION") return styles.foundation;
  if (status === "HOLD") return styles.hold;
  return styles.planned;
}

function statusClass(value: unknown) {
  const text = String(value || "").toUpperCase();
  if (
    text.includes("ACTIVE") ||
    text.includes("READY") ||
    text.includes("PAID") ||
    text.includes("ON TRACK") ||
    text === "OK" ||
    text.includes("IN STOCK")
  ) {
    return styles.statusGood;
  }
  if (
    text.includes("OVERDUE") ||
    text.includes("OUT OF STOCK") ||
    text.includes("EXPIRED")
  ) {
    return styles.statusBad;
  }
  if (
    text.includes("HOLD") ||
    text.includes("PENDING") ||
    text.includes("WAITING") ||
    text.includes("LOW STOCK") ||
    text.includes("WATCH") ||
    text.includes("REVIEW")
  ) {
    return styles.statusWarn;
  }
  return styles.statusNeutral;
}

function OrganizationPreview() {
  const levels = [0, 1, 2, 3];
  const byId = new Map(ORGANIZATION_QA_NODES.map((item) => [item.id, item]));

  return (
    <div className={styles.orgCanvas}>
      <div className={styles.orgLegend}>
        <span><i className={styles.solidLine} /> Primary reporting</span>
        <span><i className={styles.dottedLine} /> Dotted reporting</span>
      </div>

      <div className={styles.orgTree}>
        {levels.map((level) => {
          const nodes = ORGANIZATION_QA_NODES.filter(
            (item) => item.levelIndex === level
          );
          return (
            <div className={styles.orgLevel} key={level}>
              {nodes.map((node) => {
                const parent = node.parentId ? byId.get(node.parentId) : null;
                const dotted = node.dottedTo ? byId.get(node.dottedTo) : null;

                return (
                  <article className={styles.orgCard} key={node.id}>
                    <div className={styles.avatar}>
                      {node.name
                        .replace("QA ", "")
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className={styles.orgCardCopy}>
                      <strong>{node.name}</strong>
                      <span>{node.position}</span>
                      <small>{node.businessUnit} · {node.grade}</small>
                    </div>
                    {parent ? (
                      <span className={styles.parentHint}>
                        ↑ {parent.name}
                      </span>
                    ) : (
                      <span className={styles.topHint}>TOP LEVEL</span>
                    )}
                    {dotted ? (
                      <span className={styles.dottedHint}>
                        Dotted → {dotted.name}
                      </span>
                    ) : null}
                  </article>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanPreview({
  config,
  rows,
}: {
  config: QaModuleConfig;
  rows: QaModuleConfig["rows"];
}) {
  const statuses = Array.from(
    new Set(rows.map((row) => String(row.status || "OTHER")))
  );

  return (
    <div className={styles.kanban}>
      {statuses.map((status) => (
        <section className={styles.kanbanColumn} key={status}>
          <div className={styles.kanbanHead}>
            <strong>{status}</strong>
            <span>{rows.filter((row) => String(row.status) === status).length}</span>
          </div>
          <div className={styles.kanbanBody}>
            {rows
              .filter((row) => String(row.status) === status)
              .map((row, index) => {
                const primary =
                  row[config.columns[0]?.key] ||
                  row[config.columns[1]?.key] ||
                  `QA item ${index + 1}`;
                return (
                  <article key={`${status}-${index}`}>
                    <strong>{String(primary)}</strong>
                    {config.columns.slice(1, 4).map((column) => (
                      <span key={column.key}>
                        {column.label}: {String(row[column.key] ?? "—")}
                      </span>
                    ))}
                  </article>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function QaDataModePageClient() {
  const params = useParams<{ moduleKey: string }>();
  const router = useRouter();
  const { locale } = useI18n();
  const moduleKey = String(params?.moduleKey || "");
  const config = getQaModule(moduleKey);

  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [scenario, setScenario] = useState<Scenario>("POPULATED");

  const c =
    locale === "th"
      ? {
          pageTitle: "QA Data Mode",
          pageDescription: "ข้อมูลตัวอย่างสำหรับดูหน้าตาและทดสอบ UI โดยไม่แตะข้อมูลจริง",
          qaOnly: "QA DATA MODE",
          devOnly: "DEVELOPMENT PREVIEW ONLY",
          sampleOnly: "SAMPLE DATA ONLY",
          notSaved: "ไม่บันทึกลงข้อมูลจริง",
          moduleStatus: "สถานะ Module",
          realData: "กลับไป Real Data",
          populated: "Populated Sample",
          empty: "Empty State",
          search: "ค้นหา QA Data...",
          blocked: "QA Data Mode ใช้ได้เฉพาะ Development Preview",
          blockedBody: "โหมดนี้ถูกปิดสำหรับ User จริงและ Production",
          noModule: "ไม่พบ QA Module",
          noModuleBody: "Module Key นี้ไม่ได้อยู่ใน Q BMS QA Registry",
          emptyTitle: "QA Empty State",
          emptyBody: "ใช้สำหรับตรวจหน้าตาตอน Module ยังไม่มีข้อมูล",
          disclaimer: "ข้อมูลทั้งหมดในหน้านี้เป็นข้อมูล QA จำลอง ไม่ใช่พนักงาน ลูกค้า ยอดเงิน หรือรายการธุรกิจจริง",
          implementation: "Implementation status",
          scenario: "QA Scenario",
          dataPreview: "Populated UI Preview",
          rules: "QA Isolation Rules",
          loading: "กำลังตรวจ Development Preview...",
        }
      : locale === "lo"
        ? {
            pageTitle: "QA Data Mode",
            pageDescription: "ຂໍ້ມູນຕົວຢ່າງສຳລັບເບິ່ງໜ້າຕາ ແລະ ທົດສອບ UI ໂດຍບໍ່ແຕະຂໍ້ມູນຈິງ",
            qaOnly: "QA DATA MODE",
            devOnly: "DEVELOPMENT PREVIEW ONLY",
            sampleOnly: "SAMPLE DATA ONLY",
            notSaved: "ບໍ່ບັນທຶກເຂົ້າຂໍ້ມູນຈິງ",
            moduleStatus: "Module status",
            realData: "ກັບໄປ Real Data",
            populated: "Populated Sample",
            empty: "Empty State",
            search: "ຄົ້ນຫາ QA Data...",
            blocked: "QA Data Mode ໃຊ້ໄດ້ສະເພາະ Development Preview",
            blockedBody: "Mode ນີ້ຖືກປິດສຳລັບ User ຈິງ ແລະ Production",
            noModule: "ບໍ່ພົບ QA Module",
            noModuleBody: "Module Key ນີ້ບໍ່ຢູ່ໃນ Q BMS QA Registry",
            emptyTitle: "QA Empty State",
            emptyBody: "ໃຊ້ສຳລັບກວດເບິ່ງໜ້າຕາຕອນ Module ຍັງບໍ່ມີຂໍ້ມູນ",
            disclaimer: "ຂໍ້ມູນທັງໝົດໃນໜ້ານີ້ແມ່ນ QA sample ບໍ່ແມ່ນຂໍ້ມູນທຸລະກິດຈິງ",
            implementation: "Implementation status",
            scenario: "QA Scenario",
            dataPreview: "Populated UI Preview",
            rules: "QA Isolation Rules",
            loading: "ກຳລັງກວດ Development Preview...",
          }
        : {
            pageTitle: "QA Data Mode",
            pageDescription: "Isolated sample data for previewing populated UI without touching real records.",
            qaOnly: "QA DATA MODE",
            devOnly: "DEVELOPMENT PREVIEW ONLY",
            sampleOnly: "SAMPLE DATA ONLY",
            notSaved: "Never saved to real data",
            moduleStatus: "Module status",
            realData: "Back to Real Data",
            populated: "Populated Sample",
            empty: "Empty State",
            search: "Search QA data...",
            blocked: "QA Data Mode is available only in Development Preview",
            blockedBody: "This mode is disabled for real users and production.",
            noModule: "QA Module not found",
            noModuleBody: "This module key is not registered in the Q BMS QA registry.",
            emptyTitle: "QA Empty State",
            emptyBody: "Use this state to verify how the module looks before data exists.",
            disclaimer: "Everything on this page is fictional QA sample data. It is not a real employee, customer, amount or business transaction.",
            implementation: "Implementation status",
            scenario: "QA Scenario",
            dataPreview: "Populated UI Preview",
            rules: "QA Isolation Rules",
            loading: "Checking Development Preview...",
          };

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void fetchAuthSession(controller.signal)
      .then((nextSession) => {
        if (active) setSession(nextSession);
      })
      .catch((error) => {
        // React Strict Mode / Next.js Fast Refresh intentionally mounts and
        // immediately unmounts effects in development. Aborting the request
        // during that cleanup is expected and must never surface as a runtime
        // error overlay.
        if (
          controller.signal.aborted ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return;
        }

        console.error("QA Data Mode auth session request failed.", error);
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const rows = useMemo(() => {
    if (!config || scenario === "EMPTY") return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return config.rows;
    return config.rows.filter((row) =>
      Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [config, query, scenario]);

  if (!config) {
    return (
      <QBMSAppShell pageTitle={c.pageTitle} pageDescription={c.pageDescription}>
        <section className={styles.blocked}>
          <QBMSIcon name="info" size={30} />
          <h2>{c.noModule}</h2>
          <p>{c.noModuleBody}</p>
        </section>
      </QBMSAppShell>
    );
  }

  if (loading) {
    return (
      <QBMSAppShell pageTitle={`${config.canonicalName} · ${c.pageTitle}`} pageDescription={c.pageDescription}>
        <section className={styles.blocked}>
          <span className="qbms-loading-spinner" />
          <p>{c.loading}</p>
        </section>
      </QBMSAppShell>
    );
  }

  if (session?.sessionKind !== "DEVELOPMENT_PREVIEW") {
    return (
      <QBMSAppShell pageTitle={`${config.canonicalName} · ${c.pageTitle}`} pageDescription={c.pageDescription}>
        <section className={styles.blocked}>
          <QBMSIcon name="lock" size={30} />
          <h2>{c.blocked}</h2>
          <p>{c.blockedBody}</p>
          <button type="button" onClick={() => router.push(config.realHref)}>
            {c.realData}
          </button>
        </section>
      </QBMSAppShell>
    );
  }

  return (
    <QBMSAppShell
      pageTitle={`${config.canonicalName} · ${c.pageTitle}`}
      pageDescription={c.pageDescription}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={c.search}
    >
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroIcon}>
            <QBMSIcon name={config.icon as QBMSIconName} size={24} />
          </div>
          <div className={styles.heroCopy}>
            <div className={styles.badges}>
              <span className={styles.qaBadge}>{c.qaOnly}</span>
              <span>{c.devOnly}</span>
              <span>{c.sampleOnly}</span>
            </div>
            <h2>{config.canonicalName}</h2>
            <p>{config.summary}</p>
            <small>{c.disclaimer}</small>
          </div>
          <div className={styles.heroActions}>
            <span className={`${styles.statusBadge} ${statusTone(config.status)}`}>
              {c.implementation}: {config.status}
            </span>
            <button type="button" onClick={() => router.push(config.realHref)}>
              {c.realData}
            </button>
          </div>
        </section>

        <section className={styles.qaControls}>
          <div>
            <span>{c.scenario}</span>
            <div className={styles.segmented}>
              <button
                className={scenario === "POPULATED" ? styles.active : ""}
                type="button"
                onClick={() => setScenario("POPULATED")}
              >
                {c.populated}
              </button>
              <button
                className={scenario === "EMPTY" ? styles.active : ""}
                type="button"
                onClick={() => setScenario("EMPTY")}
              >
                {c.empty}
              </button>
            </div>
          </div>
          <strong>{c.notSaved}</strong>
        </section>

        {scenario === "POPULATED" ? (
          <>
            <section className={styles.metricGrid}>
              {config.metrics.map((metric) => (
                <article key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <small>{metric.hint || "QA sample"}</small>
                </article>
              ))}
            </section>

            <section className={styles.previewCard}>
              <div className={styles.sectionHead}>
                <div>
                  <span>{c.dataPreview}</span>
                  <h3>{config.canonicalName}</h3>
                </div>
                <span className={styles.rowCount}>{rows.length} sample items</span>
              </div>

              {config.previewKind === "organization" ? (
                <OrganizationPreview />
              ) : config.previewKind === "kanban" ? (
                <KanbanPreview config={config} rows={rows} />
              ) : (
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        {config.columns.map((column) => (
                          <th key={column.key}>{column.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={index}>
                          {config.columns.map((column) => {
                            const value = row[column.key] ?? "—";
                            const isStatus = column.key === "status" || column.key === "health";
                            return (
                              <td key={column.key}>
                                {isStatus ? (
                                  <span className={`${styles.dataStatus} ${statusClass(value)}`}>
                                    {String(value)}
                                  </span>
                                ) : (
                                  String(value)
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!rows.length ? (
                    <div className={styles.noSearchResults}>
                      No QA rows match this search.
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          </>
        ) : (
          <section className={styles.empty}>
            <QBMSIcon name="layers" size={30} />
            <h3>{c.emptyTitle}</h3>
            <p>{c.emptyBody}</p>
          </section>
        )}

        <section className={styles.rulesCard}>
          <div>
            <QBMSIcon name="lock" size={18} />
            <strong>{c.rules}</strong>
          </div>
          <ul>
            <li>QA data is static and isolated from PostgreSQL business records.</li>
            <li>No Employee, Customer, Stock, Invoice, PO or workflow record is created.</li>
            <li>No QA value enters real dashboards, reports, audit events or notifications.</li>
            <li>QA Data Mode is visible only to the local Development Preview session.</li>
            <li>The same framework is registered for all 10 Modules and 9 Tools.</li>
          </ul>
        </section>

        {config.notes.length ? (
          <section className={styles.notes}>
            {config.notes.map((note) => (
              <span key={note}>
                <QBMSIcon name="info" size={14} />
                {note}
              </span>
            ))}
          </section>
        ) : null}
      </div>
    </QBMSAppShell>
  );
}
