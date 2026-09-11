"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import QBMSAppShell, { QBMSIcon } from "@/components/layout/QBMSAppShell";
import { useI18n } from "@/i18n/useQBMSI18n";
import {
  createCRMLead,
  CRMApiError,
  fetchCRMBusinessUnits,
  fetchCRMLeads,
} from "./api/crm.api";
import { crmCopy } from "./crm.i18n";
import { CRM_QA_ACTIVITIES, CRM_QA_DEALS } from "./crm.qa-data";
import type {
  ActivityType,
  CRMBusinessUnit,
  CRMLead,
  CRMTab,
  DealStage,
  LeadSource,
} from "./crm.types";
import styles from "./CRMWorkspace.module.css";

const PIPELINE_STAGES: DealStage[] = [
  "NEW_DEAL",
  "DEMO",
  "QUOTATION",
  "NEGOTIATION",
  "CONTRACT",
  "PAYMENT",
];

const LEAD_SOURCES: LeadSource[] = [
  "EVENT",
  "FACEBOOK",
  "WEBSITE",
  "REFERRAL",
  "PARTNER",
  "WALK_IN",
  "OUTBOUND",
  "IMPORT",
  "OTHER",
  "OWN_LEAD",
];

function prettyCode(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function money(value: number, currency: string) {
  return `${new Intl.NumberFormat("en-US").format(value)} ${currency}`;
}

export default function CRMWorkspaceClient() {
  const { locale } = useI18n();
  const c = crmCopy[locale];
  const [activeTab, setActiveTab] = useState<CRMTab>("my-day");
  const [businessUnit, setBusinessUnit] = useState("QPOS");
  const [businessUnits, setBusinessUnits] = useState<CRMBusinessUnit[]>([]);
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadError, setLeadError] = useState("");
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
  const [showNewLead, setShowNewLead] = useState(false);
  const [newLeadSource, setNewLeadSource] = useState<LeadSource>("OWN_LEAD");
  const [savingLead, setSavingLead] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetchCRMBusinessUnits(controller.signal)
      .then((items) => {
        setBusinessUnits(items);
        if (!items.some((item) => item.code === businessUnit) && items.length) {
          setBusinessUnit(items[0].code);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setLeadError(c.loadError as string);
      });
    return () => controller.abort();
  }, [locale]);

  useEffect(() => {
    const controller = new AbortController();
    setLeadsLoading(true);
    setLeadError("");

    fetchCRMLeads(businessUnit || "ALL", controller.signal)
      .then(setLeads)
      .catch(() => {
        if (!controller.signal.aborted) setLeadError(c.loadError as string);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLeadsLoading(false);
      });

    return () => controller.abort();
  }, [businessUnit, locale]);

  const matchBU = (value: string) => businessUnit === "ALL" || value === businessUnit;
  const normalizedQuery = query.trim().toLowerCase();

  const visibleLeads = useMemo(
    () =>
      leads.filter((lead) => {
        if (!normalizedQuery) return true;
        return [
          lead.id,
          lead.storeName,
          lead.primaryContact,
          lead.owner,
          lead.phone,
          lead.province,
          lead.email || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      }),
    [leads, normalizedQuery]
  );

  const visibleActivities = useMemo(
    () => CRM_QA_ACTIVITIES.filter((activity) => matchBU(activity.businessUnit)),
    [businessUnit]
  );

  const visibleDeals = useMemo(
    () => CRM_QA_DEALS.filter((deal) => matchBU(deal.businessUnit)),
    [businessUnit]
  );

  const todayCount = visibleActivities.filter((item) => item.bucket === "TODAY").length;
  const overdueCount = visibleActivities.filter((item) => item.status === "OVERDUE").length;
  const noNextDeals = visibleDeals.filter(
    (deal) => !deal.nextActivity && !["CLOSED_WON", "CLOSED_LOST"].includes(deal.stage)
  );
  const newLeadCount = visibleLeads.filter((lead) => lead.status === "NEW").length;

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  }

  async function reloadLeads(targetBU = businessUnit) {
    setLeadsLoading(true);
    try {
      setLeads(await fetchCRMLeads(targetBU || "ALL"));
      setLeadError("");
    } catch {
      setLeadError(c.loadError as string);
    } finally {
      setLeadsLoading(false);
    }
  }

  async function createLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingLead) return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      businessUnitCode: String(form.get("businessUnit") || "").trim(),
      storeName: String(form.get("storeName") || "").trim(),
      primaryContact: String(form.get("primaryContact") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      province: String(form.get("province") || "").trim(),
      source: String(form.get("source") || "OWN_LEAD") as LeadSource,
      sourceDetail: String(form.get("sourceDetail") || "").trim() || undefined,
      email: String(form.get("email") || "").trim() || undefined,
      whatsapp: String(form.get("whatsapp") || "").trim() || undefined,
    };

    if (!payload.businessUnitCode || !payload.storeName || !payload.primaryContact || !payload.phone || !payload.province) {
      return;
    }

    setSavingLead(true);
    try {
      let created: CRMLead;
      try {
        created = await createCRMLead(payload);
      } catch (error) {
        if (
          error instanceof CRMApiError &&
          error.code === "CRM_LEAD_POSSIBLE_DUPLICATE"
        ) {
          const proceed = window.confirm(c.duplicatePrompt as string);
          if (!proceed) return;
          created = await createCRMLead({ ...payload, allowDuplicate: true });
        } else {
          throw error;
        }
      }

      setShowNewLead(false);
      setActiveTab("my-leads");
      setBusinessUnit(created.businessUnit);
      setNewLeadSource("OWN_LEAD");
      formElement.reset();
      await reloadLeads(created.businessUnit);
      showToast(c.createdReal as string);
    } catch (error) {
      showToast(error instanceof Error ? error.message : (c.loadError as string));
    } finally {
      setSavingLead(false);
    }
  }

  const selectableBusinessUnits = businessUnits.length
    ? businessUnits
    : [{ id: "fallback-qpos", code: "QPOS", name: "QPOS", status: "ACTIVE" }];

  return (
    <QBMSAppShell
      pageTitle={c.pageTitle as string}
      pageDescription={c.pageDescription as string}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={c.search as string}
    >
      <div className={styles.page}>
        <section className={styles.hero}>
          <div>
            <div className={styles.eyebrow}>
              <QBMSIcon name="sparkle" size={15} />
              {c.foundation as string}
            </div>
            <h2>{c.pageTitle as string}</h2>
            <p>{c.foundationHint as string}</p>
          </div>

          <div className={styles.heroActions}>
            <label className={styles.buPicker}>
              <span>{c.businessUnit as string}</span>
              <select value={businessUnit} onChange={(event) => setBusinessUnit(event.target.value)}>
                <option value="ALL">{c.allBU as string}</option>
                {selectableBusinessUnits.map((item) => (
                  <option key={item.id} value={item.code}>
                    {item.code}
                  </option>
                ))}
              </select>
            </label>
            <button className={styles.primaryButton} type="button" onClick={() => setShowNewLead(true)}>
              <QBMSIcon name="plus" size={16} />
              {c.newLead as string}
            </button>
          </div>
        </section>

        <nav className={styles.tabs} aria-label="CRM workspace">
          {([
            ["my-day", c.tabs.myDay],
            ["my-leads", c.tabs.myLeads],
            ["activities", c.tabs.activities],
            ["pipeline", c.tabs.pipeline],
          ] as Array<[CRMTab, string]>).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={activeTab === key ? styles.activeTab : ""}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        {activeTab === "my-day" && (
          <section className={styles.workspace}>
            <div className={styles.sectionHeading}>
              <div>
                <h3>{c.myDayTitle as string}</h3>
                <p>{c.myDayHint as string}</p>
              </div>
            </div>

            <div className={styles.metricGrid}>
              <Metric label={c.today as string} value={todayCount} tone="blue" />
              <Metric label={c.overdue as string} value={overdueCount} tone="red" />
              <Metric label={c.noNext as string} value={noNextDeals.length} tone="amber" />
              <Metric label={c.newLeads as string} value={newLeadCount} tone="green" />
            </div>

            <div className={styles.twoColumn}>
              <div className={styles.panel}>
                <div className={styles.panelTitle}>
                  <strong>{c.priorityQueue as string}</strong>
                  <span>{visibleActivities.filter((item) => item.bucket === "TODAY" || item.status === "OVERDUE").length}</span>
                </div>
                <div className={styles.actionList}>
                  {visibleActivities
                    .filter((item) => item.bucket === "TODAY" || item.status === "OVERDUE")
                    .map((item) => (
                      <article className={styles.actionItem} key={item.id}>
                        <span className={`${styles.activityIcon} ${item.status === "OVERDUE" ? styles.dangerIcon : ""}`}>
                          {activityGlyph(item.type)}
                        </span>
                        <div className={styles.actionCopy}>
                          <div className={styles.actionTopline}>
                            <strong>{prettyCode(item.type)}</strong>
                            <span className={item.status === "OVERDUE" ? styles.statusDanger : styles.statusNeutral}>
                              {prettyCode(item.status)}
                            </span>
                          </div>
                          <h4>{item.relatedName}</h4>
                          <p>{item.subject} · {item.scheduledAt}</p>
                          {item.quotationNumber && <small>{c.quotation as string}: {item.quotationNumber}</small>}
                        </div>
                        <button type="button" className={styles.secondaryButton}>{c.rescheduleComplete as string}</button>
                      </article>
                    ))}
                </div>
              </div>

              <div className={styles.panel}>
                <div className={styles.panelTitle}>
                  <strong>{c.noNext as string}</strong>
                  <span>{noNextDeals.length}</span>
                </div>
                <div className={styles.actionList}>
                  {noNextDeals.map((deal) => (
                    <article className={styles.noNextCard} key={deal.id}>
                      <div>
                        <span className={styles.stageBadge}>{prettyCode(deal.stage)}</span>
                        <h4>{deal.storeName}</h4>
                        <p>{deal.owner} · {money(deal.value, deal.currency)}</p>
                      </div>
                      <button type="button" className={styles.secondaryButton}>{c.scheduleNext as string}</button>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "my-leads" && (
          <section className={styles.workspace}>
            <div className={styles.sectionHeading}>
              <div>
                <h3>{c.leadTableTitle as string}</h3>
                <p>{c.leadTableHint as string}</p>
              </div>
              <span className={styles.resultCount}>{visibleLeads.length} Leads</span>
            </div>

            {leadError && <div className={styles.panel} style={{ padding: 16 }}>{leadError}</div>}

            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>{c.store as string}</th>
                    <th>{c.contact as string}</th>
                    <th>{c.province as string}</th>
                    <th>{c.source as string}</th>
                    <th>{c.status as string}</th>
                    <th>{c.owner as string}</th>
                    <th>{c.nextActivity as string}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {leadsLoading ? (
                    <tr><td colSpan={8}>{c.loadingLeads as string}</td></tr>
                  ) : visibleLeads.length ? (
                    visibleLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <strong>{lead.storeName}</strong>
                          <small>{lead.id} · {lead.businessUnit}</small>
                        </td>
                        <td>{lead.primaryContact}<small>{lead.phone}</small></td>
                        <td>{lead.province}</td>
                        <td>{prettyCode(lead.source)}{lead.sourceDetail ? <small>{lead.sourceDetail}</small> : null}</td>
                        <td><span className={styles.leadStatus}>{prettyCode(lead.status)}</span></td>
                        <td>{lead.owner}</td>
                        <td>{lead.nextActivity ? <>{prettyCode(lead.nextActivity)}<small>{lead.nextActivityAt}</small></> : <span className={styles.warningText}>{c.noNextActivity as string}</span>}</td>
                        <td><button type="button" className={styles.linkButton} onClick={() => setSelectedLead(lead)}>{c.open as string}</button></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={8}>{c.noLeads as string}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "activities" && (
          <section className={styles.workspace}>
            <div className={styles.sectionHeading}>
              <div>
                <h3>{c.activityTitle as string}</h3>
                <p>{c.activityHint as string}</p>
              </div>
            </div>

            <div className={styles.activityTable}>
              {visibleActivities.map((activity) => (
                <article key={activity.id} className={styles.activityRow}>
                  <span className={styles.activityIcon}>{activityGlyph(activity.type)}</span>
                  <div className={styles.activityMain}>
                    <div><strong>{prettyCode(activity.type)}</strong><span>{prettyCode(activity.status)}</span></div>
                    <h4>{activity.subject}</h4>
                    <p>{activity.relatedName} · {activity.relatedType}</p>
                  </div>
                  <div className={styles.activityMeta}><span>{c.owner as string}</span><strong>{activity.owner}</strong></div>
                  <div className={styles.activityMeta}><span>{c.schedule as string}</span><strong>{activity.scheduledAt}</strong></div>
                  {activity.quotationNumber && <div className={styles.documentChip}>QT {activity.quotationNumber}</div>}
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "pipeline" && (
          <section className={styles.workspace}>
            <div className={styles.sectionHeading}>
              <div>
                <h3>{c.pipelineTitle as string}</h3>
                <p>{c.pipelineHint as string}</p>
              </div>
            </div>

            <div className={styles.kanban}>
              {PIPELINE_STAGES.map((stage) => {
                const stageDeals = visibleDeals.filter((deal) => deal.stage === stage);
                return (
                  <section key={stage} className={styles.kanbanColumn}>
                    <header>
                      <strong>{prettyCode(stage)}</strong>
                      <span>{stageDeals.length}</span>
                    </header>
                    <div className={styles.kanbanCards}>
                      {stageDeals.map((deal) => (
                        <article className={styles.dealCard} key={deal.id}>
                          <div className={styles.dealTopline}><span>{deal.id}</span><span>{deal.businessUnit}</span></div>
                          <h4>{deal.storeName}</h4>
                          <strong className={styles.dealValue}>{money(deal.value, deal.currency)}</strong>
                          <p>{deal.owner}</p>
                          <div className={styles.dealFacts}>
                            {deal.quotationNumber && <span>QT · {deal.quotationNumber}</span>}
                            {stage === "QUOTATION" && <span>{deal.quotationConfirmed ? c.confirmed as string : c.notConfirmed as string}</span>}
                            {stage === "PAYMENT" && <span>{c.paymentSlip as string}: {deal.paymentSlipUploaded ? c.uploaded as string : c.missing as string}</span>}
                            {deal.nextActivity ? <span>{prettyCode(deal.nextActivity)} · {deal.nextActivityAt}</span> : <span className={styles.warningText}>{c.noNextActivity as string}</span>}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {selectedLead && (
        <div className={styles.overlay} onMouseDown={() => setSelectedLead(null)}>
          <aside className={styles.drawer} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div><span>{c.leadDetail as string}</span><h3>{selectedLead.storeName}</h3></div>
              <button type="button" onClick={() => setSelectedLead(null)}>×</button>
            </div>
            <Detail label="Lead Code" value={selectedLead.id} />
            <Detail label={c.businessUnit as string} value={selectedLead.businessUnit} />
            <Detail label={c.status as string} value={prettyCode(selectedLead.status)} />
            <Detail label={c.owner as string} value={selectedLead.owner} />
            <Detail label={c.contact as string} value={selectedLead.primaryContact} />
            <Detail label={c.phone as string} value={selectedLead.phone} />
            <Detail label={c.email as string} value={selectedLead.email || "—"} />
            <Detail label={c.whatsapp as string} value={selectedLead.whatsapp || "—"} />
            <Detail label={c.province as string} value={selectedLead.province} />
            <Detail label={c.source as string} value={selectedLead.sourceDetail ? `${prettyCode(selectedLead.source)} · ${selectedLead.sourceDetail}` : prettyCode(selectedLead.source)} />
            <Detail label={c.legalCompany as string} value={selectedLead.legalCompanyName || "—"} />
            <Detail label={c.individualName as string} value={selectedLead.individualName || "—"} />
            <Detail label={c.campaign as string} value={selectedLead.campaign || "—"} />
            <Detail label={c.project as string} value={selectedLead.project || "—"} />
            <Detail label={c.notes as string} value={selectedLead.note || "—"} wide />
          </aside>
        </div>
      )}

      {showNewLead && (
        <div className={styles.overlay} onMouseDown={() => !savingLead && setShowNewLead(false)}>
          <form className={styles.modal} onSubmit={createLead} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div><span>REAL DATA</span><h3>{c.createLead as string}</h3><p>{c.createLeadHint as string}</p></div>
              <button type="button" disabled={savingLead} onClick={() => setShowNewLead(false)}>×</button>
            </div>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>{c.businessUnit as string} *</span>
                <select
                  name="businessUnit"
                  defaultValue={businessUnit === "ALL" ? selectableBusinessUnits[0]?.code : businessUnit}
                  required
                >
                  {selectableBusinessUnits.map((item) => (
                    <option key={item.id} value={item.code}>{item.code}</option>
                  ))}
                </select>
              </label>
              <Field label={`${c.store as string} *`} name="storeName" required />
              <Field label={`${c.contact as string} *`} name="primaryContact" required />
              <Field label={`${c.phone as string} *`} name="phone" required />
              <Field label={`${c.province as string} *`} name="province" required />
              <label className={styles.field}>
                <span>{c.source as string} *</span>
                <select
                  name="source"
                  value={newLeadSource}
                  onChange={(event) => setNewLeadSource(event.target.value as LeadSource)}
                >
                  {LEAD_SOURCES.map((source) => <option key={source} value={source}>{prettyCode(source)}</option>)}
                </select>
              </label>
              {newLeadSource === "OTHER" && (
                <Field label={`${c.sourceDetail as string} *`} name="sourceDetail" required />
              )}
              <Field label={`${c.email as string} (${c.optional as string})`} name="email" type="email" />
              <Field label={`${c.whatsapp as string} (${c.optional as string})`} name="whatsapp" />
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryButton} disabled={savingLead} onClick={() => setShowNewLead(false)}>{c.cancel as string}</button>
              <button type="submit" className={styles.primaryButton} disabled={savingLead}>{savingLead ? c.saving as string : c.saveLead as string}</button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </QBMSAppShell>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "blue" | "red" | "amber" | "green" }) {
  return <article className={`${styles.metric} ${styles[tone]}`}><span>{label}</span><strong>{value}</strong></article>;
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={`${styles.detail} ${wide ? styles.detailWide : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}

function Field({ label, name, type = "text", required = false }: { label: string; name: string; type?: string; required?: boolean }) {
  return <label className={styles.field}><span>{label}</span><input name={name} type={type} required={required} /></label>;
}

function activityGlyph(type: ActivityType) {
  const glyphs: Record<ActivityType, string> = {
    CALL: "☎",
    VISIT: "↗",
    MEETING: "◎",
    DEMO: "▣",
    FOLLOW_UP: "↻",
    QUOTATION: "Q",
    CONTRACT: "C",
    PAYMENT: "$",
  };
  return glyphs[type];
}
