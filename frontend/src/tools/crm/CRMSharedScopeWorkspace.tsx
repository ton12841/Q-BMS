"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  assignCRMLeadOwner,
  createCRMLead,
  CRMApiError,
  fetchCRMBUSettings,
} from "./api/crm.api";
import type {
  CRMAccessProfile,
  CRMActivity,
  CRMBUSettingsSnapshot,
  CRMDeal,
  CRMLead,
  CRMBUMember,
  CRMCommissionPlanSetting,
  DealStage,
  LeadSource,
} from "./crm.types";
import styles from "./CRMSharedScopeWorkspace.module.css";

export type CRMSharedView = "home" | "leads" | "pipeline" | "activities" | "performance" | "commission";
export type CRMUnifiedDestination = CRMSharedView | "settings";
type ActivityFilter = "ALL" | "TODAY" | "OVERDUE" | "UPCOMING" | "COMPLETED";

type Props = {
  view: CRMSharedView;
  contextLabel: string;
  scopeLabel: string;
  businessUnit: string;
  period: string;
  query: string;
  leads: CRMLead[];
  deals: CRMDeal[];
  activities: CRMActivity[];
  access: CRMAccessProfile;
  readOnlyPreview?: boolean;
  onRefresh: () => Promise<void>;
  onOpenLead: (lead: CRMLead) => void;
  onOpenDeal: (deal: CRMDeal) => void;
  onNewLead: () => void;
  onNavigate: (destination: CRMUnifiedDestination) => void;
};

const PIPELINE_STAGES: DealStage[] = [
  "NEW_DEAL", "DEMO", "QUOTATION", "NEGOTIATION", "CONTRACT", "AWAITING_PAYMENT", "CLOSED_WON", "CLOSED_LOST",
];

const LEAD_SOURCES = new Set<LeadSource>([
  "EVENT", "FACEBOOK", "WEBSITE", "REFERRAL", "PARTNER", "WALK_IN", "OUTBOUND", "IMPORT", "OTHER", "OWN_LEAD",
]);

function pretty(value: string) {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function money(value: number, currency: string) {
  return `${new Intl.NumberFormat("en-US").format(Number(value || 0))} ${currency}`;
}

function dealMoneySummary(items: CRMDeal[]) {
  if (!items.length) return "—";
  const totals = items.reduce<Record<string, number>>((acc, deal) => {
    acc[deal.currency] = (acc[deal.currency] || 0) + Number(deal.value || 0);
    return acc;
  }, {});
  return Object.entries(totals).map(([currency, value]) => money(value, currency)).join(" · ");
}

function localDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function isToday(value?: string) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return !Number.isNaN(date.getTime()) && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function isPeriod(value: string | undefined, period: string) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const yyyyMm = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  return yyyyMm === period;
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function normalizedHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function memberDisplay(member: CRMBUMember) {
  return member.employeeCode ? `${member.name} · ${member.employeeCode}` : member.name;
}

function effectivePlan(settings: CRMBUSettingsSnapshot, member: CRMBUMember): CRMCommissionPlanSetting | undefined {
  const direct = settings.commissionPlans.find((plan) => plan.scopeType === "USER" && plan.ownerUserId === member.userId);
  if (direct) return direct;
  const team = settings.commissionPlans.find((plan) => plan.scopeType === "TEAM" && plan.teamId && member.teamIds.includes(plan.teamId));
  if (team) return team;
  return settings.commissionPlans.find((plan) => plan.scopeType === "BU");
}

export default function CRMSharedScopeWorkspace({
  view,
  contextLabel,
  scopeLabel,
  businessUnit,
  period,
  query,
  leads,
  deals,
  activities,
  access,
  readOnlyPreview = false,
  onRefresh,
  onOpenLead,
  onOpenDeal,
  onNewLead,
  onNavigate,
}: Props) {
  const tab = view === "home" ? "overview" : view;
  const [settings, setSettings] = useState<CRMBUSettingsSnapshot | null>(null);
  const [settingsError, setSettingsError] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState("ALL");
  const [leadStatusFilter, setLeadStatusFilter] = useState("ALL");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("ALL");
  const [assigningLead, setAssigningLead] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState("");

  const membership = access.memberships.find((item) => item.businessUnit.toUpperCase() === businessUnit.toUpperCase());
  const canReadSettings = access.isSuperAdmin || access.canViewSettings || Boolean(membership?.roles.some((role) =>
    role.capabilities.includes("settings.view") || role.capabilities.includes("settings.manage")
  ));

  useEffect(() => {
    if (!businessUnit || businessUnit === "ALL" || !canReadSettings) {
      setSettings(null);
      setSettingsError("");
      setSettingsLoading(false);
      return;
    }
    const controller = new AbortController();
    setSettingsLoading(true);
    setSettingsError("");
    fetchCRMBUSettings(businessUnit, period, controller.signal)
      .then(setSettings)
      .catch((error) => {
        if (!controller.signal.aborted) setSettingsError(error instanceof Error ? error.message : "Unable to load CRM BU settings.");
      })
      .finally(() => { if (!controller.signal.aborted) setSettingsLoading(false); });
    return () => controller.abort();
  }, [businessUnit, period, canReadSettings]);
  const canAssign = !readOnlyPreview && (access.isSuperAdmin || Boolean(membership?.roles.some((role) => role.capabilities.includes("lead.assign") || role.capabilities.includes("settings.manage"))));
  const canCreateLead = !readOnlyPreview && (access.isSuperAdmin || Boolean(membership?.roles.some((role) =>
    role.capabilities.includes("lead.shared.create") || role.capabilities.includes("lead.assign") || role.capabilities.includes("settings.manage")
  )));

  const activeMembers = useMemo(() => {
    const configured = settings?.members.filter((member) => member.status === "ACTIVE") || [];
    if (configured.length) return configured;
    const owners = new Map<string, CRMBUMember>();
    const collect = (userId: string | undefined, name: string | undefined) => {
      if (!userId || owners.has(userId)) return;
      owners.set(userId, {
        id: `scope-${userId}`, userId, name: name || `User ${userId}`, email: "", status: "ACTIVE",
        effectiveFrom: new Date().toISOString().slice(0, 10), roleCodes: ["SALES"], teamIds: [],
      });
    };
    leads.forEach((item) => collect(item.ownerUserId, item.owner));
    deals.forEach((item) => collect(item.ownerUserId, item.owner));
    activities.forEach((item) => collect(item.ownerUserId, item.owner));
    return Array.from(owners.values());
  }, [settings, leads, deals, activities]);
  const salesMembers = useMemo(() => {
    const sales = activeMembers.filter((member) => member.roleCodes.some((role) => ["SALES", "SALES_MANAGER"].includes(role)));
    return sales.length ? sales : activeMembers;
  }, [activeMembers]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const matchesQuery = !normalizedQuery || [lead.id, lead.storeName, lead.primaryContact, lead.phone, lead.owner, lead.email || "", lead.province]
      .join(" ").toLowerCase().includes(normalizedQuery);
    if (!matchesQuery) return false;
    if (ownerFilter !== "ALL" && (lead.ownerUserId || "UNASSIGNED") !== ownerFilter) return false;
    if (leadStatusFilter !== "ALL" && lead.status !== leadStatusFilter) return false;
    return true;
  }), [leads, normalizedQuery, ownerFilter, leadStatusFilter]);

  const openDeals = deals.filter((deal) => !["CLOSED_WON", "CLOSED_LOST"].includes(deal.stage));
  const wonDeals = deals.filter((deal) => deal.stage === "CLOSED_WON");
  const unassignedLeads = leads.filter((lead) => !lead.ownerUserId && !["CONVERTED", "LOST"].includes(lead.status));
  const overdueActivities = activities.filter((activity) => activity.status === "OVERDUE");
  const noNextActivityDeals = openDeals.filter((deal) => !deal.nextActivityAt);
  const todayActivities = activities.filter((activity) => !["COMPLETED", "CANCELLED"].includes(activity.status) && isToday(activity.scheduledAt));
  const homeActivities = [...overdueActivities, ...todayActivities.filter((item) => item.status !== "OVERDUE")];
  const filteredActivities = activities.filter((activity) => {
    const scheduled = new Date(activity.scheduledAt);
    const now = new Date();
    if (activityFilter === "TODAY") return !["COMPLETED", "CANCELLED"].includes(activity.status) && isToday(activity.scheduledAt);
    if (activityFilter === "OVERDUE") return activity.status === "OVERDUE";
    if (activityFilter === "UPCOMING") return !["COMPLETED", "CANCELLED", "OVERDUE"].includes(activity.status) && scheduled.getTime() > now.getTime();
    if (activityFilter === "COMPLETED") return activity.status === "COMPLETED";
    return true;
  }).filter((activity) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [activity.id, activity.relatedName, activity.owner, activity.type, activity.purposeCode || "", activity.purposeDetail || "", activity.leadCode || "", activity.dealCode || ""]
      .join(" ").toLowerCase().includes(q);
  }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const ownerRows = useMemo(() => salesMembers.map((member) => {
    const ownerLeads = leads.filter((lead) => lead.ownerUserId === member.userId);
    const ownerDeals = deals.filter((deal) => deal.ownerUserId === member.userId);
    const ownerActivities = activities.filter((activity) => activity.ownerUserId === member.userId);
    const open = ownerDeals.filter((deal) => !["CLOSED_WON", "CLOSED_LOST"].includes(deal.stage));
    const recognizedDeals = ownerDeals.filter((deal) => deal.pointRecognition?.period === period);
    return {
      member,
      leads: ownerLeads.length,
      openDeals: open.length,
      openValue: open.reduce((sum, deal) => sum + Number(deal.value || 0), 0),
      currency: open.find(Boolean)?.currency || settings?.general.currency || "LAK",
      overdue: ownerActivities.filter((activity) => activity.status === "OVERDUE").length,
      today: ownerActivities.filter((activity) => !["COMPLETED", "CANCELLED"].includes(activity.status) && isToday(activity.scheduledAt)).length,
      wonThisMonth: ownerDeals.filter((deal) => deal.stage === "CLOSED_WON" && isPeriod(deal.closedWonAt || deal.updatedAt, period)).length,
      wonLicenses: ownerDeals.filter((deal) => deal.stage === "CLOSED_WON" && isPeriod(deal.closedWonAt || deal.updatedAt, period)).reduce((sum, deal) => sum + Number(deal.licenseQuantity || 0), 0),
      completedActivities: ownerActivities.filter((activity) => activity.status === "COMPLETED" && isPeriod(activity.completedAt || activity.updatedAt, period)).length,
      convertedLeads: ownerLeads.filter((lead) => lead.status === "CONVERTED" && isPeriod(lead.updatedAt, period)).length,
      hasRecognition: recognizedDeals.length > 0,
      recognizedSWPoints: recognizedDeals.reduce((sum, deal) => sum + Number(deal.pointRecognition?.swPoints || 0), 0),
      recognizedHWPoints: recognizedDeals.reduce((sum, deal) => sum + Number(deal.pointRecognition?.hwPoints || 0), 0),
      commissionLAK: recognizedDeals.reduce((sum, deal) => sum + Number(deal.pointRecognition?.amountLAK || 0), 0),
    };
  }), [salesMembers, leads, deals, activities, period, settings]);

  async function assignLead(lead: CRMLead, ownerUserId: string | null) {
    if (!canAssign || assigningLead) return;
    setAssigningLead(lead.id);
    setNotice("");
    try {
      await assignCRMLeadOwner(lead.id, { ownerUserId });
      await onRefresh();
      setNotice(`${lead.id} assignment updated.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to assign Lead.");
    } finally {
      setAssigningLead(null);
    }
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || businessUnit === "ALL" || importing) return;
    setImporting(true);
    setNotice("");
    try {
      const text = await file.text();
      const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
      if (lines.length < 2) throw new Error("CSV must include a header row and at least one Lead.");
      if (lines.length > 501) throw new Error("Import is limited to 500 Leads per file.");
      const headers = parseCsvLine(lines[0]).map(normalizedHeader);
      const index = (names: string[]) => names.map((name) => headers.indexOf(name)).find((value) => value >= 0) ?? -1;
      const storeIndex = index(["store_name", "store", "trading_name"]);
      const contactIndex = index(["primary_contact", "contact", "contact_name"]);
      const phoneIndex = index(["phone", "mobile"]);
      const provinceIndex = index(["province", "city"]);
      if ([storeIndex, contactIndex, phoneIndex, provinceIndex].some((value) => value < 0)) {
        throw new Error("CSV requires store_name, primary_contact, phone and province columns.");
      }
      const emailIndex = index(["email"]);
      const whatsappIndex = index(["whatsapp", "whats_app"]);
      const sourceIndex = index(["source", "lead_source"]);
      const ownerEmailIndex = index(["owner_email", "sales_email"]);
      const sourceDetailIndex = index(["source_detail", "source_note"]);
      const memberByEmail = new Map((settings?.members || []).map((member) => [member.email.toLowerCase(), member]));
      let created = 0;
      let duplicates = 0;
      let failed = 0;
      let assigned = 0;
      for (const line of lines.slice(1)) {
        const values = parseCsvLine(line);
        const rawSource = sourceIndex >= 0 ? String(values[sourceIndex] || "").toUpperCase().replace(/[\s-]+/g, "_") : "IMPORT";
        const source = LEAD_SOURCES.has(rawSource as LeadSource) ? rawSource as LeadSource : "IMPORT";
        try {
          const lead = await createCRMLead({
            businessUnitCode: businessUnit,
            storeName: values[storeIndex] || "",
            primaryContact: values[contactIndex] || "",
            phone: values[phoneIndex] || "",
            province: values[provinceIndex] || "",
            email: emailIndex >= 0 ? values[emailIndex] || undefined : undefined,
            whatsapp: whatsappIndex >= 0 ? values[whatsappIndex] || undefined : undefined,
            source,
            sourceDetail: sourceDetailIndex >= 0 ? values[sourceDetailIndex] || undefined : (source === "OTHER" ? "CSV Import" : undefined),
            assignmentMode: "UNASSIGNED",
          });
          created += 1;
          const ownerEmail = ownerEmailIndex >= 0 ? String(values[ownerEmailIndex] || "").trim().toLowerCase() : "";
          const owner = ownerEmail ? memberByEmail.get(ownerEmail) : undefined;
          if (owner && canAssign) {
            await assignCRMLeadOwner(lead.id, { ownerUserId: owner.userId });
            assigned += 1;
          }
        } catch (error) {
          if (error instanceof CRMApiError && error.code === "CRM_LEAD_POSSIBLE_DUPLICATE") duplicates += 1;
          else failed += 1;
        }
      }
      await onRefresh();
      setNotice(`Import complete: ${created} created · ${assigned} assigned · ${duplicates} duplicates skipped · ${failed} failed.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "CSV import failed.");
    } finally {
      setImporting(false);
    }
  }

  if (!businessUnit || businessUnit === "ALL") {
    return <section className={styles.emptyState}><strong>Select one Business Unit for this CRM view.</strong><span>Shared CRM views use BU-scoped members, roles, targets, point rules and commission settings.</span></section>;
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.opsHeader}>
        <div>
          <span>CRM · ROLE-BASED VIEW</span>
          <h3>{contextLabel}</h3>
          <p>{businessUnit} · {scopeLabel} · Same CRM data model, role-specific visibility and actions.</p>
        </div>
        <div className={styles.headerMeta}>
          <span>Period</span><strong>{period}</strong>
          <span>Members</span><strong>{activeMembers.length}</strong>
        </div>
      </div>

      {(settingsLoading || settingsError || notice) && (
        <div className={`${styles.notice} ${settingsError ? styles.noticeError : ""}`}>
          {settingsLoading ? "Loading BU settings..." : settingsError || notice}
        </div>
      )}
      {!canReadSettings && ["performance", "commission"].includes(tab) && (
        <div className={styles.notice}>Operational scope is available. Configuration details such as Point Target and Commission Plan remain hidden because this role does not have Settings visibility.</div>
      )}

      {tab === "overview" && (
        <div className={styles.section}>
          <div className={styles.metricGrid}>
            <article><span>Shared Leads</span><strong>{leads.length}</strong><small>{unassignedLeads.length} unassigned</small></article>
            <article><span>Open Deals</span><strong>{openDeals.length}</strong><small>{noNextActivityDeals.length} without Next Activity</small></article>
            <article><span>Action Today</span><strong>{todayActivities.length}</strong><small>{overdueActivities.length} overdue Activities</small></article>
            <article><span>Closed Won</span><strong>{wonDeals.filter((deal) => isPeriod(deal.closedWonAt || deal.updatedAt, period)).length}</strong><small>{period}</small></article>
          </div>

          <div className={styles.twoColumn}>
            <div className={styles.card}>
              <div className={styles.cardHeader}><div><strong>Owner Workload</strong><span>Current BU assignment and execution health</span></div></div>
              <div className={styles.tableWrap}>
                <table><thead><tr><th>Sales Owner</th><th>Leads</th><th>Open Deals</th><th>Today</th><th>Overdue</th><th>Won</th></tr></thead>
                  <tbody>{ownerRows.length ? ownerRows.map((row) => <tr key={row.member.userId}>
                    <td><strong>{memberDisplay(row.member)}</strong><small>{row.member.email}</small></td>
                    <td>{row.leads}</td><td>{row.openDeals}</td><td>{row.today}</td><td className={row.overdue ? styles.dangerText : ""}>{row.overdue}</td><td>{row.wonThisMonth}</td>
                  </tr>) : <tr><td colSpan={6}>No active CRM Sales members configured.</td></tr>}</tbody></table>
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardHeader}><div><strong>Attention Required</strong><span>Items this role should review first</span></div></div>
              <div className={styles.attentionList}>
                <button type="button" onClick={() => { setLeadStatusFilter("UNASSIGNED"); onNavigate("leads"); }}><span>Unassigned Leads</span><strong>{unassignedLeads.length}</strong></button>
                <button type="button" onClick={() => { setActivityFilter("OVERDUE"); onNavigate("activities"); }}><span>Overdue Activities</span><strong>{overdueActivities.length}</strong></button>
                <button type="button" onClick={() => onNavigate("pipeline")}><span>Deals without Next Activity</span><strong>{noNextActivityDeals.length}</strong></button>
                <button type="button" disabled={!canReadSettings} onClick={() => onNavigate("settings")}><span>{canReadSettings ? "Point Rules Configured" : "Settings Restricted"}</span><strong>{canReadSettings ? settings?.pointRules.length || 0 : "—"}</strong></button>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div><strong>Team Activity Control</strong><span>Home shows urgent execution. The Activities tab shows the complete shared history using the same Activity records.</span></div>
              <span>{overdueActivities.length} overdue</span>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>Schedule</th><th>Activity</th><th>Related</th><th>Owner</th><th>Status</th></tr></thead>
                <tbody>{homeActivities.slice(0, 10).length
                  ? homeActivities.slice(0, 10).map((activity) => <tr key={activity.id}>
                    <td><strong>{localDateTime(activity.scheduledAt)}</strong><small>{activity.id}</small></td>
                    <td>{pretty(activity.type)}<small>{activity.purposeDetail || (activity.purposeCode ? pretty(activity.purposeCode) : "—")}</small></td>
                    <td><strong>{activity.relatedName}</strong><small>{activity.relatedType} · {activity.dealCode || activity.leadCode}</small></td>
                    <td>{activity.owner}</td>
                    <td><span className={`${styles.statusPill} ${activity.status === "OVERDUE" ? styles.dangerPill : ""}`}>{pretty(activity.status)}</span></td>
                  </tr>)
                  : <tr><td colSpan={5}>No urgent Team Activities right now.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "leads" && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div><h4>{scopeLabel === "Team Scope" ? "Team Leads" : "Lead Database"}</h4><p>{scopeLabel === "Team Scope" ? "Leads owned by the current Sales Team." : "Shared Lead master for authorized BU roles. Lead remains separate from Deal."}</p></div>
            <div className={styles.actions}>
              <label className={styles.fileButton}>{importing ? "Importing..." : "Import Leads CSV"}<input type="file" accept=".csv,text/csv" disabled={importing || !canAssign} onChange={importCsv} /></label>
              <button type="button" className={styles.primaryButton} disabled={!canCreateLead} title={readOnlyPreview ? "QA Preview is read-only" : undefined} onClick={onNewLead}>{readOnlyPreview ? "Preview Only" : "+ Add Lead"}</button>
            </div>
          </div>
          <div className={styles.filters}>
            <label><span>Owner</span><select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}><option value="ALL">All Owners</option><option value="UNASSIGNED">Unassigned</option>{salesMembers.map((member) => <option key={member.userId} value={member.userId}>{member.name}</option>)}</select></label>
            <label><span>Status</span><select value={leadStatusFilter} onChange={(event) => setLeadStatusFilter(event.target.value)}><option value="ALL">All Status</option>{["UNASSIGNED", "NEW", "ASSIGNED", "CONTACTED", "FOLLOW_UP", "CONVERTED", "LOST"].map((status) => <option key={status} value={status}>{pretty(status)}</option>)}</select></label>
            <div className={styles.filterSummary}>{filteredLeads.length} / {leads.length} Leads</div>
          </div>
          <div className={styles.tableWrap}>
            <table><thead><tr><th>Lead</th><th>Contact</th><th>Source</th><th>Status</th><th>Owner / Assignment</th><th>Next Activity</th><th></th></tr></thead>
              <tbody>{filteredLeads.length ? filteredLeads.map((lead) => <tr key={lead.id}>
                <td><strong>{lead.storeName}</strong><small>{lead.id} · {lead.province}</small></td>
                <td>{lead.primaryContact}<small>{lead.phone}</small></td>
                <td>{pretty(lead.source)}{lead.sourceDetail && <small>{lead.sourceDetail}</small>}</td>
                <td><span className={styles.statusPill}>{pretty(lead.status)}</span></td>
                <td>{canAssign && !["CONVERTED", "LOST"].includes(lead.status) ? <select className={styles.inlineSelect} disabled={assigningLead === lead.id} value={lead.ownerUserId || ""} onChange={(event) => void assignLead(lead, event.target.value || null)}><option value="">Unassigned</option>{salesMembers.map((member) => <option key={member.userId} value={member.userId}>{member.name}</option>)}</select> : <>{lead.owner || "Unassigned"}</>}</td>
                <td>{lead.nextActivity ? <><strong>{pretty(lead.nextActivity)}</strong><small className={lead.nextActivityAt && new Date(lead.nextActivityAt).getTime() < Date.now() ? styles.dangerText : ""}>{localDateTime(lead.nextActivityAt)}</small></> : <span className={styles.warningText}>No Next Activity</span>}</td>
                <td><button type="button" className={styles.linkButton} onClick={() => onOpenLead(lead)}>Open</button></td>
              </tr>) : <tr><td colSpan={7}>No Leads match this filter.</td></tr>}</tbody></table>
          </div>
          <p className={styles.helper}>CSV columns: store_name, primary_contact, phone, province. Optional: email, whatsapp, source, source_detail, owner_email. Imported Leads start Unassigned unless owner_email matches an active CRM member.</p>
        </div>
      )}

      {tab === "activities" && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div><h4>{scopeLabel === "Team Scope" ? "Team Activities" : "BU Activities"}</h4><p>The same CRM Activity object across Home, Leads and Deals, now shown as the complete shared work history for this scope.</p></div>
            <span className={styles.resultBadge}>{filteredActivities.length} Activities</span>
          </div>
          <div className={styles.filters}>
            <label><span>Status / Time</span><select value={activityFilter} onChange={(event) => setActivityFilter(event.target.value as ActivityFilter)}><option value="ALL">All</option><option value="TODAY">Today</option><option value="OVERDUE">Overdue</option><option value="UPCOMING">Upcoming</option><option value="COMPLETED">Completed</option></select></label>
            <div className={styles.filterSummary}>{readOnlyPreview ? "QA Preview · Read-only" : scopeLabel}</div>
          </div>
          <div className={styles.tableWrap}>
            <table><thead><tr><th>Schedule</th><th>Activity</th><th>Related</th><th>Owner</th><th>Status</th></tr></thead>
              <tbody>{filteredActivities.length ? filteredActivities.map((activity) => <tr key={activity.id}>
                <td><strong>{localDateTime(activity.scheduledAt)}</strong><small>{activity.id}</small></td>
                <td>{pretty(activity.type)}<small>{activity.purposeDetail || (activity.purposeCode ? pretty(activity.purposeCode) : "—")}</small></td>
                <td><strong>{activity.relatedName}</strong><small>{activity.relatedType} · {activity.dealCode || activity.leadCode || "—"}</small></td>
                <td>{activity.owner}</td>
                <td><span className={`${styles.statusPill} ${activity.status === "OVERDUE" ? styles.dangerPill : ""}`}>{pretty(activity.status)}</span></td>
              </tr>) : <tr><td colSpan={5}>No Activities match this view.</td></tr>}</tbody></table>
          </div>
        </div>
      )}

      {tab === "pipeline" && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}><div><h4>{scopeLabel === "Team Scope" ? "Team Pipeline" : "BU Pipeline"}</h4><p>Same Deal stages and rules; the visible cards change only by Role / Scope. Closed Won remains system-controlled after Finance confirmation + Invoice.</p></div><span className={styles.resultBadge}>{openDeals.length} Open Deals</span></div>
          <div className={styles.pipelineSummary}><article><span>Open Pipeline</span><strong>{openDeals.length}</strong><small>{dealMoneySummary(openDeals)}</small></article><article><span>No Next Activity</span><strong>{noNextActivityDeals.length}</strong><small>Needs Sales follow-up</small></article><article><span>Won This Month</span><strong>{wonDeals.filter((deal) => isPeriod(deal.closedWonAt || deal.updatedAt, period)).length}</strong><small>{period}</small></article></div>
          <div className={styles.pipelineBoard}>
            {PIPELINE_STAGES.map((stage) => {
              const items = deals.filter((deal) => deal.stage === stage);
              return <section key={stage} className={styles.pipelineColumn}><header><div><strong>{pretty(stage)}</strong><small>{dealMoneySummary(items)}</small></div><span>{items.length}</span></header><div className={styles.pipelineCards}>{items.length ? items.map((deal) => <button type="button" key={deal.id} className={styles.dealCard} onClick={() => onOpenDeal(deal)}><span>{deal.id}</span><strong>{deal.storeName}</strong><small>{deal.owner || "Unassigned"}</small><b>{money(deal.value, deal.currency)}</b><em className={!deal.nextActivityAt ? styles.warningText : deal.nextActivityAt && new Date(deal.nextActivityAt).getTime() < Date.now() ? styles.dangerText : ""}>{deal.nextActivityAt ? `${pretty(deal.nextActivity || "FOLLOW_UP")} · ${localDateTime(deal.nextActivityAt)}` : "No Next Activity"}</em></button>) : <div className={styles.emptyColumn}>No Deals</div>}</div></section>;
            })}
          </div>
        </div>
      )}

      {tab === "performance" && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}><div><h4>{scopeLabel === "Team Scope" ? "Team Performance" : "BU Performance"}</h4><p>Operational results by Sales Owner. Actual Point appears from monthly recognition snapshots; Pending means no recognized Deal snapshot exists in the visible period.</p></div></div>
          <div className={styles.tableWrap}><table><thead><tr><th>Sales Owner</th><th>SW Point Target</th><th>Actual SW Point</th><th>Won Deals</th><th>Won Licenses</th><th>Converted Leads</th><th>Activities</th><th>Overdue</th></tr></thead><tbody>{ownerRows.length ? ownerRows.map((row) => {
            const individualTarget = settings?.targets.find((target) => target.ownerUserId === row.member.userId);
            const buDefault = settings?.targets.find((target) => !target.ownerUserId && !target.teamId);
            const target = individualTarget || buDefault;
            return <tr key={row.member.userId}><td><strong>{row.member.name}</strong><small>{row.member.email}</small></td><td>{settings ? (target?.targetSWPoints ?? settings.general.defaultSWPointTarget) : "—"}</td><td>{row.hasRecognition ? <strong>{row.recognizedSWPoints}</strong> : <span className={styles.pendingPill}>Pending Recognition</span>}</td><td>{row.wonThisMonth}</td><td>{row.wonLicenses}</td><td>{row.convertedLeads}</td><td>{row.completedActivities}</td><td className={row.overdue ? styles.dangerText : ""}>{row.overdue}</td></tr>;
          }) : <tr><td colSpan={8}>No Sales members configured.</td></tr>}</tbody></table></div>
          <div className={styles.architectureNote}><strong>Point architecture protected</strong><span>Product is selected from the controlled Product Source. Recognized Deal snapshots populate Actual Point without changing the unified CRM layout; future Product Master replaces only the Product Source adapter.</span></div>
        </div>
      )}

      {tab === "commission" && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}><div><h4>{scopeLabel === "Team Scope" ? "Team Commission" : "BU Commission"}</h4><p>Point-based commission governance. Same commission rules, different visible owner scope.</p></div></div>
          <div className={styles.commissionPlanGrid}>
            {(settings?.commissionPlans || []).map((plan) => <article key={plan.id}><div><span>{plan.scopeType}</span><strong>{plan.name}</strong><small>{plan.ownerName || plan.teamName || "BU Default"}</small></div><div><b>{money(plan.hardwareLAKPerPoint, "LAK")}</b><small>per HW Point</small></div><div className={styles.tierList}>{plan.tiers.map((tier) => <span key={tier.tierCode}>{tier.name}: {tier.minSWPoints}{tier.maxSWPoints == null ? "+" : `–${tier.maxSWPoints}`} → {money(tier.lakPerSWPoint, "LAK")}/SW Point</span>)}</div></article>)}
            {!settings?.commissionPlans.length && <div className={styles.emptyState}>No Commission Plan configured for {period}.</div>}
          </div>
          <div className={styles.tableWrap}><table><thead><tr><th>Sales Owner</th><th>Effective Plan</th><th>Won Deals</th><th>Recognized SW Point</th><th>Recognized HW Point</th><th>Commission</th></tr></thead><tbody>{salesMembers.length ? salesMembers.map((member) => {
            const plan = settings ? effectivePlan(settings, member) : undefined;
            const row = ownerRows.find((item) => item.member.userId === member.userId);
            return <tr key={member.userId}><td><strong>{member.name}</strong><small>{member.email}</small></td><td>{plan?.name || (settings ? "Not Configured" : "Hidden by Role")}<small>{plan ? `${plan.scopeType} · ${plan.status}` : ""}</small></td><td>{row?.wonThisMonth || 0}</td><td>{row?.hasRecognition ? <strong>{row.recognizedSWPoints}</strong> : <span className={styles.pendingPill}>Pending</span>}</td><td>{row?.hasRecognition ? <strong>{row.recognizedHWPoints}</strong> : <span className={styles.pendingPill}>Pending</span>}</td><td>{row?.hasRecognition ? <><strong>{money(row.commissionLAK, "LAK")}</strong><small>Recognized snapshot</small></> : <><strong>—</strong><small>Waiting Point Recognition</small></>}</td></tr>;
          }) : <tr><td colSpan={6}>No Sales members configured.</td></tr>}</tbody></table></div>
          <div className={styles.architectureNote}><strong>Historical safety</strong><span>Commission will be calculated from recognized Point snapshots by month, so future Point/Commission setting changes will not rewrite historical results.</span></div>
        </div>
      )}
    </section>
  );
}
