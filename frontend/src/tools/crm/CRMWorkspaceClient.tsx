"use client";

import { type DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import QBMSAppShell, { QBMSIcon } from "@/components/layout/QBMSAppShell";
import { useI18n } from "@/i18n/useQBMSI18n";
import {
  changeCRMDealStage,
  completeCRMActivity,
  convertCRMLeadToDeal,
  createCRMDealActivity,
  createCRMLead,
  createCRMLeadActivity,
  CRMApiError,
  fetchCRMActivities,
  fetchCRMAccessProfile,
  fetchCRMBusinessUnits,
  fetchCRMDeals,
  fetchCRMLeads,
  fetchCRMPerformance,
  fetchCRMCommissions,
  fetchCRMProductOptions,
  getCRMDataMode,
  resetCRMQADemoData,
  runCRMQAExternalGate,
  saveCRMDealProductLines,
  setCRMDataMode,
  CRM_QA_DEMO_AVAILABLE,
  rescheduleCRMActivity,
  updateCRMDeal,
} from "./api/crm.api";
import { crmCopy } from "./crm.i18n";
import type {
  ActivityType,
  CRMBusinessUnit,
  CRMActivity,
  CRMAccessProfile,
  CRMDeal,
  CRMLead,
  CRMPerformance,
  CRMCommissionSummary,
  CRMProductOption,
  CRMDataMode,
  CRMDealProductLine,
  DealCurrency,
  DealStage,
  LeadSource,
} from "./crm.types";
import styles from "./CRMWorkspace.module.css";
import pipelineStyles from "./CRMPipeline.module.css";
import workflowStyles from "./CRMWorkflowV2432.module.css";
import CRMBUSettingsPanel from "./CRMBUSettingsPanel";
import CRMCustomersWorkspace from "./CRMCustomersWorkspace";
import CRMSharedScopeWorkspace, { type CRMSharedView, type CRMUnifiedDestination } from "./CRMSharedScopeWorkspace";

const PIPELINE_STAGES: DealStage[] = [
  "NEW_DEAL",
  "DEMO",
  "QUOTATION",
  "NEGOTIATION",
  "CONTRACT",
  "AWAITING_PAYMENT",
  "CLOSED_WON",
  "CLOSED_LOST",
];

const ACTIVE_PIPELINE_STAGES: DealStage[] = [
  "NEW_DEAL",
  "DEMO",
  "QUOTATION",
  "NEGOTIATION",
  "CONTRACT",
  "AWAITING_PAYMENT",
];
const ACTIVITY_TYPES: ActivityType[] = ["CALL", "VISIT", "MEETING", "DEMO", "FOLLOW_UP", "QUOTATION", "CONTRACT", "PAYMENT"];
const LEAD_SOURCES: LeadSource[] = ["EVENT", "FACEBOOK", "WEBSITE", "REFERRAL", "PARTNER", "WALK_IN", "OUTBOUND", "IMPORT", "OTHER", "OWN_LEAD"];

const OUTCOMES: Record<ActivityType, string[]> = {
  CALL: ["CONNECTED", "NO_ANSWER", "BUSY", "WRONG_NUMBER", "NEED_FOLLOW_UP"],
  VISIT: ["COMPLETED", "CUSTOMER_UNAVAILABLE", "NEED_FOLLOW_UP", "RESCHEDULE"],
  MEETING: ["COMPLETED", "CUSTOMER_NO_SHOW", "NEED_FOLLOW_UP", "RESCHEDULE"],
  DEMO: ["INTERESTED", "NEED_FOLLOW_UP", "NEED_QUOTATION", "NOT_INTERESTED", "NEED_ANOTHER_DEMO"],
  FOLLOW_UP: ["PROGRESSING", "WAITING_CUSTOMER", "NEED_MORE_INFORMATION", "NO_RESPONSE", "FOLLOW_UP"],
  QUOTATION: ["PREPARED", "SENT", "REVISION_REQUIRED", "FOLLOW_UP_REQUIRED"],
  CONTRACT: ["PREPARED", "SENT", "REVISION_REQUIRED", "FOLLOW_UP_REQUIRED"],
  PAYMENT: ["AWAITING_PAYMENT", "PROMISE_TO_PAY", "PAYMENT_ISSUE", "NO_RESPONSE", "FOLLOW_UP_REQUIRED"],
};

const ACTIVITY_PURPOSES: Record<ActivityType, string[]> = {
  CALL: ["FIRST_CONTACT", "FOLLOW_UP", "PRODUCT_INTRODUCTION", "PRICE_FOLLOW_UP", "APPOINTMENT", "PAYMENT_FOLLOW_UP", "OTHER"],
  VISIT: ["FIRST_VISIT", "STORE_SURVEY", "FOLLOW_UP", "PRODUCT_PRESENTATION", "RELATIONSHIP_VISIT", "OTHER"],
  MEETING: ["REQUIREMENT_DISCUSSION", "SOLUTION_DISCUSSION", "PRICING", "COMMERCIAL_DISCUSSION", "CONTRACT_DISCUSSION", "OTHER"],
  DEMO: ["PRODUCT_DEMO", "QSR_DEMO", "FSR_DEMO", "HANDHELD_DEMO", "FEATURE_DEMO", "RE_DEMO", "OTHER"],
  FOLLOW_UP: ["AFTER_CALL", "AFTER_VISIT", "AFTER_DEMO", "AFTER_QUOTATION", "AFTER_MEETING", "CUSTOMER_DECISION", "OTHER"],
  QUOTATION: ["PREPARE_QUOTATION", "SEND_QUOTATION", "REVISE_QUOTATION", "QUOTATION_FOLLOW_UP", "OTHER"],
  CONTRACT: ["PREPARE_CONTRACT", "SEND_CONTRACT", "CONTRACT_REVISION", "SIGNATURE_FOLLOW_UP", "OTHER"],
  PAYMENT: ["PAYMENT_REMINDER", "PAYMENT_CONFIRMATION", "PAYMENT_ISSUE", "PAYMENT_SLIP_FOLLOW_UP", "OTHER"],
};

type ActivityTarget = { kind: "LEAD" | "DEAL"; id: string; name: string };
type DealProductDraft = Omit<CRMDealProductLine, "id" | "lineValue">;
type WorkspaceTab = "home" | "leads" | "pipeline" | "activities" | "customers" | "performance" | "commission" | "crm-settings";
type CRMWorkspaceScope = "SELF" | "TEAM" | "BU" | "MULTI_BU" | "ALL";

const CRM_SCOPE_RANK: Record<CRMWorkspaceScope, number> = { SELF: 0, TEAM: 1, BU: 2, MULTI_BU: 3, ALL: 4 };

type CRMQAPreviewRole = "ACTUAL" | "SALES" | "SALES_MANAGER" | "SALES_OPS" | "CRM_BU_ADMIN" | "VIEWER";
type CRMRequestScope = "AUTO" | "SELF" | "TEAM" | "BU" | "SHARED";

const CRM_QA_PREVIEW_ENABLED = process.env.NODE_ENV !== "production";

const CRM_QA_ROLE_PRESETS: Record<Exclude<CRMQAPreviewRole, "ACTUAL">, {
  label: string;
  accessLevel: number;
  dataScope: CRMWorkspaceScope;
  canViewSettings: boolean;
  capabilities: string[];
}> = {
  SALES: {
    label: "Sales",
    accessLevel: 2,
    dataScope: "SELF",
    canViewSettings: false,
    capabilities: [
      "lead.self.view", "lead.self.manage", "deal.self.view", "deal.self.manage",
      "activity.self.view", "activity.self.manage", "performance.self.view", "commission.self.view",
    ],
  },
  SALES_MANAGER: {
    label: "Sales Manager",
    accessLevel: 3,
    dataScope: "TEAM",
    canViewSettings: false,
    capabilities: ["lead.team.view", "deal.team.view", "activity.team.view", "performance.team.view", "commission.team.view"],
  },
  SALES_OPS: {
    label: "Sales Ops",
    accessLevel: 3,
    dataScope: "BU",
    canViewSettings: true,
    capabilities: ["settings.view", "customer.manage", "lead.shared.view", "lead.assign", "deal.shared.view", "activity.shared.view", "performance.team.view", "commission.team.view"],
  },
  CRM_BU_ADMIN: {
    label: "CRM BU Admin",
    accessLevel: 4,
    dataScope: "BU",
    canViewSettings: true,
    capabilities: [
      "settings.view", "settings.manage", "members.manage", "teams.manage", "pipeline.manage",
      "points.manage", "targets.manage", "commission.manage", "customer.manage", "lead.shared.view", "lead.assign",
      "deal.shared.view", "activity.shared.view", "performance.team.view", "commission.team.view",
    ],
  },
  VIEWER: {
    label: "Viewer",
    accessLevel: 1,
    dataScope: "BU",
    canViewSettings: false,
    capabilities: ["lead.shared.view", "deal.shared.view", "activity.shared.view"],
  },
};

function buildCRMPreviewAccess(access: CRMAccessProfile, businessUnit: string, previewRole: CRMQAPreviewRole): CRMAccessProfile {
  if (previewRole === "ACTUAL" || !businessUnit || businessUnit === "ALL") return access;
  const preset = CRM_QA_ROLE_PRESETS[previewRole];
  const actualMembership = access.memberships.find((item) => item.businessUnit.toUpperCase() === businessUnit.toUpperCase());
  return {
    userId: access.userId,
    isSuperAdmin: false,
    canViewSettings: preset.canViewSettings,
    memberships: [{
      membershipId: actualMembership?.membershipId || `qa-preview-${businessUnit}`,
      businessUnitId: actualMembership?.businessUnitId || businessUnit,
      businessUnit,
      businessUnitName: actualMembership?.businessUnitName || businessUnit,
      status: "ACTIVE",
      effectiveFrom: actualMembership?.effectiveFrom || new Date().toISOString().slice(0, 10),
      roles: [{
        code: previewRole,
        name: preset.label,
        accessLevel: preset.accessLevel,
        dataScope: preset.dataScope,
        capabilities: preset.capabilities,
      }],
    }],
  };
}

function qaPreviewScope(previewRole: CRMQAPreviewRole): CRMRequestScope {
  if (previewRole === "SALES") return "SELF";
  if (previewRole === "SALES_MANAGER") return "TEAM";
  if (previewRole === "SALES_OPS" || previewRole === "CRM_BU_ADMIN" || previewRole === "VIEWER") return "BU";
  return "AUTO";
}

function resolveCRMWorkspaceContext(access: CRMAccessProfile, businessUnit: string) {
  const memberships = businessUnit === "ALL"
    ? access.memberships
    : access.memberships.filter((item) => item.businessUnit.toUpperCase() === businessUnit.toUpperCase());
  const roles = memberships.flatMap((item) => item.roles);
  const scope = access.isSuperAdmin
    ? "ALL" as CRMWorkspaceScope
    : roles.reduce<CRMWorkspaceScope>((best, role) => CRM_SCOPE_RANK[role.dataScope] > CRM_SCOPE_RANK[best] ? role.dataScope : best, "SELF");
  const priority = ["CRM_BU_ADMIN", "SALES_OPS", "SALES_MANAGER", "SALES", "LEAD_CONTRIBUTOR", "VIEWER"];
  const primaryRole = priority.map((code) => roles.find((role) => role.code === code)).find(Boolean) || roles[0];
  const roleCode = access.isSuperAdmin ? "SYSTEM_ADMIN" : primaryRole?.code || "CRM_USER";
  const roleLabel = access.isSuperAdmin ? "System Admin" : primaryRole?.name || "CRM User";
  const capabilities = new Set(roles.flatMap((role) => role.capabilities || []));
  const hasSharedView = [
    "lead.shared.view", "deal.shared.view", "activity.shared.view",
    "lead.team.view", "deal.team.view", "activity.team.view",
    "performance.team.view", "commission.team.view", "settings.manage",
  ].some((capability) => capabilities.has(capability));
  const canCreateSharedLead = capabilities.has("lead.shared.create") || capabilities.has("lead.assign") || capabilities.has("settings.manage");
  const canCreateLead = access.isSuperAdmin || canCreateSharedLead || capabilities.has("lead.self.manage");
  const isShared = access.isSuperAdmin || hasSharedView || ["CRM_BU_ADMIN", "SALES_OPS", "SALES_MANAGER", "VIEWER"].includes(roleCode);
  const scopeLabel = scope === "SELF" ? "Self Scope" : scope === "TEAM" ? "Team Scope" : scope === "BU" ? "Business Unit Scope" : scope === "MULTI_BU" ? "Multiple BU Scope" : "All Scope";
  return { roleCode, roleLabel, scope, scopeLabel, isShared, canCreateSharedLead, canCreateLead };
}
type LeadQuickFilter = "ALL" | "NEW" | "ACTION_TODAY" | "OVERDUE" | "NO_ACTIVITY";
type ActivityPageFilter = "ALL" | "TODAY" | "OVERDUE" | "UPCOMING" | "COMPLETED";

type DealCopy = {
  convert: string;
  convertTitle: string;
  convertHint: string;
  dealValue: string;
  currency: string;
  expectedClose: string;
  createDeal: string;
  dealDetail: string;
  sourceLead: string;
  changeStage: string;
  stage: string;
  lostReason: string;
  saveStage: string;
  pipelineReal: string;
  noDeals: string;
  workWithoutNext: string;
  quotationGate: string;
  awaitingPaymentGate: string;
  dragHint: string;
  openDeals: string;
  openValue: string;
  closedWon: string;
  closedLost: string;
  lostDrop: string;
  lostDropHint: string;
  wonLocked: string;
  wonLockedHint: string;
  moving: string;
};

const DEAL_COPY: Record<"en" | "th" | "lo", DealCopy> = {
  en: {
    convert: "Create Deal", convertTitle: "Create Deal from Lead", convertHint: "Lead and Deal are separate records. Create a Deal only when this Lead becomes a real sales opportunity; active future Activities move to the Deal automatically.",
    dealValue: "Deal Value", currency: "Currency", expectedClose: "Expected Close Date", createDeal: "Create Deal", dealDetail: "Deal Detail", sourceLead: "Source Lead",
    changeStage: "Change Stage", stage: "Stage", lostReason: "Lost Reason", saveStage: "Save Stage", pipelineReal: "Real Deal Pipeline", noDeals: "No Deals in this stage.", workWithoutNext: "Leads / Deals without Next Activity",
    quotationGate: "Quotation stage requires a linked Quotation from the Quotation Tool.", awaitingPaymentGate: "Awaiting Payment requires a customer-confirmed Quotation.",
    dragHint: "Drag a Deal card to another stage. Pipeline movement is non-linear.", openDeals: "Open Deals", openValue: "Open Value", closedWon: "Closed Won", closedLost: "Closed Lost",
    lostDrop: "Mark as Lost", lostDropHint: "Drop here to enter Lost Reason", wonLocked: "Closed Won", wonLockedHint: "System controlled after Finance confirmation + Invoice", moving: "Moving Deal...",
  },
  th: {
    convert: "สร้าง Deal", convertTitle: "สร้าง Deal จาก Lead", convertHint: "Lead และ Deal เป็นคนละ Record เมื่อ Lead เป็นโอกาสขายจริง ให้สร้าง Deal เข้า Pipeline และ Activity ที่ยังไม่เสร็จจะย้ายไป Deal อัตโนมัติ",
    dealValue: "มูลค่า Deal", currency: "สกุลเงิน", expectedClose: "วันที่คาดว่าจะปิด Deal", createDeal: "สร้าง Deal", dealDetail: "รายละเอียด Deal", sourceLead: "Lead ต้นทาง",
    changeStage: "เปลี่ยน Stage", stage: "Stage", lostReason: "เหตุผลที่ Lost", saveStage: "บันทึก Stage", pipelineReal: "Real Deal Pipeline", noDeals: "ยังไม่มี Deal ใน Stage นี้", workWithoutNext: "Lead / Deal ที่ยังไม่มี Next Activity",
    quotationGate: "การเข้า Quotation ต้องมี Quotation จริงที่ลิงก์จาก Quotation Tool ก่อน", awaitingPaymentGate: "Awaiting Payment ต้องมี Quotation ที่ลูกค้า Confirm แล้ว",
    dragHint: "กดค้างที่ Deal Card แล้วลากไป Stage อื่นได้ทันที โดย Pipeline เป็นแบบ Non-linear", openDeals: "Open Deals", openValue: "มูลค่า Open Deal", closedWon: "Closed Won", closedLost: "Closed Lost",
    lostDrop: "Mark as Lost", lostDropHint: "ลากมาวางตรงนี้เพื่อกรอก Lost Reason", wonLocked: "Closed Won", wonLockedHint: "ระบบปิดให้อัตโนมัติหลัง Finance Confirm + Invoice", moving: "กำลังย้าย Deal...",
  },
  lo: {
    convert: "ສ້າງ Deal", convertTitle: "ສ້າງ Deal ຈາກ Lead", convertHint: "Lead ແລະ Deal ແມ່ນຄົນລະ Record. ເມື່ອ Lead ເປັນໂອກາດຂາຍຈິງ ໃຫ້ສ້າງ Deal ເຂົ້າ Pipeline; Activity ທີ່ຍັງບໍ່ສຳເລັດຈະຍ້າຍໄປ Deal ອັດຕະໂນມັດ",
    dealValue: "ມູນຄ່າ Deal", currency: "ສະກຸນເງິນ", expectedClose: "ວັນທີຄາດວ່າຈະປິດ Deal", createDeal: "ສ້າງ Deal", dealDetail: "ລາຍລະອຽດ Deal", sourceLead: "Lead ຕົ້ນທາງ",
    changeStage: "ປ່ຽນ Stage", stage: "Stage", lostReason: "ເຫດຜົນ Lost", saveStage: "ບັນທຶກ Stage", pipelineReal: "Real Deal Pipeline", noDeals: "ຍັງບໍ່ມີ Deal ໃນ Stage ນີ້", workWithoutNext: "Lead / Deal ທີ່ຍັງບໍ່ມີ Next Activity",
    quotationGate: "Stage Quotation ຕ້ອງມີ Quotation ຈິງທີ່ Link ຈາກ Quotation Tool", awaitingPaymentGate: "Awaiting Payment ຕ້ອງມີ Quotation ທີ່ລູກຄ້າ Confirm ແລ້ວ",
    dragHint: "ກົດ Deal Card ຄ້າງແລ້ວລາກໄປ Stage ອື່ນໄດ້ທັນທີ; Pipeline ເປັນແບບ Non-linear", openDeals: "Open Deals", openValue: "ມູນຄ່າ Open Deal", closedWon: "Closed Won", closedLost: "Closed Lost",
    lostDrop: "Mark as Lost", lostDropHint: "ລາກມາວາງເພື່ອລະບຸ Lost Reason", wonLocked: "Closed Won", wonLockedHint: "ລະບົບປິດອັດຕະໂນມັດຫຼັງ Finance Confirm + Invoice", moving: "ກຳລັງຍ້າຍ Deal...",
  },
};

function prettyCode(value: string) {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function isSameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfLocalWeek(value = new Date()) {
  const date = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return date;
}

function isWithinCurrentWeek(date: Date) {
  if (Number.isNaN(date.getTime())) return false;
  const start = startOfLocalWeek();
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return date.getTime() >= start.getTime() && date.getTime() < end.getTime();
}

function money(value: number, currency: string) {
  return `${new Intl.NumberFormat("en-US").format(value)} ${currency}`;
}

function moneySummary(items: CRMDeal[]) {
  if (!items.length) return "—";
  const totals = items.reduce<Record<string, number>>((acc, deal) => {
    acc[deal.currency] = (acc[deal.currency] || 0) + Number(deal.value || 0);
    return acc;
  }, {});
  return Object.entries(totals)
    .map(([currency, value]) => money(value, currency))
    .join(" · ");
}

function nextActivityState(deal: CRMDeal): "NONE" | "OVERDUE" | "TODAY" | "UPCOMING" {
  if (!deal.nextActivity || !deal.nextActivityAt) return "NONE";
  const scheduled = new Date(deal.nextActivityAt);
  if (Number.isNaN(scheduled.getTime())) return "UPCOMING";
  const now = new Date();
  if (scheduled.getTime() < now.getTime()) return "OVERDUE";
  const sameDay = scheduled.getFullYear() === now.getFullYear()
    && scheduled.getMonth() === now.getMonth()
    && scheduled.getDate() === now.getDate();
  return sameDay ? "TODAY" : "UPCOMING";
}

function localDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function toIsoFromLocal(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function productDraftFromOption(option: CRMProductOption): DealProductDraft {
  return {
    productCode: option.productCode,
    productName: option.productName,
    pointType: option.pointType,
    unitLabel: option.unitLabel,
    inventoryManaged: option.inventoryManaged,
    quantity: 1,
    unitPrice: Number(option.defaultUnitPrice || 0),
  };
}

function lineTotals(lines: DealProductDraft[]) {
  const software = lines.filter((item) => item.pointType === "SOFTWARE").reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
  const hardware = lines.filter((item) => item.pointType === "HARDWARE").reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
  return { software, hardware, total: software + hardware };
}

export default function CRMWorkspaceClient() {
  const { locale } = useI18n();
  const c = crmCopy[locale];
  const d = DEAL_COPY[(locale === "th" || locale === "lo") ? locale : "en"];

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("home");
  const [calendarView, setCalendarView] = useState<"day" | "week">("day");
  const [leadQuickFilter, setLeadQuickFilter] = useState<LeadQuickFilter>("ALL");
  const [activityPageFilter, setActivityPageFilter] = useState<ActivityPageFilter>("ALL");
  const [businessUnit, setBusinessUnit] = useState("QPOS");
  const [businessUnits, setBusinessUnits] = useState<CRMBusinessUnit[]>([]);
  const [accessProfile, setAccessProfile] = useState<CRMAccessProfile>({ isSuperAdmin: false, memberships: [], canViewSettings: false });
  const [qaPreviewRole, setQAPreviewRole] = useState<CRMQAPreviewRole>("ACTUAL");
  const [dataMode, setDataModeState] = useState<CRMDataMode>("REAL");
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [deals, setDeals] = useState<CRMDeal[]>([]);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<CRMDeal | null>(null);
  const [showNewLead, setShowNewLead] = useState(false);
  const [newLeadSource, setNewLeadSource] = useState<LeadSource>("OWN_LEAD");
  const [savingLead, setSavingLead] = useState(false);
  const [convertLead, setConvertLead] = useState<CRMLead | null>(null);
  const [convertProductOptions, setConvertProductOptions] = useState<CRMProductOption[]>([]);
  const [convertProductLineDraft, setConvertProductLineDraft] = useState<DealProductDraft[]>([]);
  const [convertCurrency, setConvertCurrency] = useState<DealCurrency>("LAK");
  const [loadingConvertProducts, setLoadingConvertProducts] = useState(false);
  const [stageDeal, setStageDeal] = useState<CRMDeal | null>(null);
  const [dealNextStage, setDealNextStage] = useState<DealStage>("NEW_DEAL");
  const [savingDeal, setSavingDeal] = useState(false);
  const [draggingDealCode, setDraggingDealCode] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);
  const [lostDropActive, setLostDropActive] = useState(false);
  const [movingDealCode, setMovingDealCode] = useState<string | null>(null);

  const [activityTarget, setActivityTarget] = useState<ActivityTarget | null>(null);
  const [scheduleActivityType, setScheduleActivityType] = useState<ActivityType>("CALL");
  const [schedulePurpose, setSchedulePurpose] = useState(ACTIVITY_PURPOSES.CALL[0]);
  const [activityAction, setActivityAction] = useState<{ mode: "complete" | "reschedule"; activity: CRMActivity } | null>(null);
  const [completeNext, setCompleteNext] = useState(false);
  const [nextActivityType, setNextActivityType] = useState<ActivityType>("FOLLOW_UP");
  const [nextPurpose, setNextPurpose] = useState(ACTIVITY_PURPOSES.FOLLOW_UP[0]);
  const [savingActivity, setSavingActivity] = useState(false);
  const [toast, setToast] = useState("");
  const [periodMonth, setPeriodMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [performance, setPerformance] = useState<CRMPerformance | null>(null);
  const [commissions, setCommissions] = useState<CRMCommissionSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [editDeal, setEditDeal] = useState<CRMDeal | null>(null);
  const [completeUpdateStage, setCompleteUpdateStage] = useState(false);
  const [completeDealStage, setCompleteDealStage] = useState<DealStage>("NEW_DEAL");
  const [productLineDeal, setProductLineDeal] = useState<CRMDeal | null>(null);
  const [productLineOptions, setProductLineOptions] = useState<CRMProductOption[]>([]);
  const [productLineDraft, setProductLineDraft] = useState<DealProductDraft[]>([]);
  const [savingProductLines, setSavingProductLines] = useState(false);
  const [runningExternalGate, setRunningExternalGate] = useState(false);

  const qaDemoMode = dataMode === "QA_DEMO";
  const qaPreviewActive = CRM_QA_PREVIEW_ENABLED && qaPreviewRole !== "ACTUAL";
  const previewReadOnly = qaPreviewActive && !qaDemoMode;
  const effectiveAccessProfile = useMemo(
    () => qaPreviewActive ? buildCRMPreviewAccess(accessProfile, businessUnit, qaPreviewRole) : accessProfile,
    [accessProfile, businessUnit, qaPreviewActive, qaPreviewRole],
  );
  const workspaceContext = resolveCRMWorkspaceContext(effectiveAccessProfile, businessUnit);
  const isSharedContext = workspaceContext.isShared;
  const canOperateSelected = !isSharedContext || (qaDemoMode && ["CRM_BU_ADMIN", "SALES_OPS", "SALES_MANAGER"].includes(workspaceContext.roleCode));
  const crmDataScope: CRMRequestScope = qaPreviewActive ? qaPreviewScope(qaPreviewRole) : "AUTO";
  const sharedView: CRMSharedView | null = activeTab === "crm-settings" || activeTab === "customers" ? null : activeTab;

  // Hydration safety: localStorage is client-only. Keep the server and first client
  // render deterministic, then restore the saved QA/Real data mode after mount.
  useEffect(() => {
    setDataModeState(getCRMDataMode());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([fetchCRMBusinessUnits(controller.signal), fetchCRMAccessProfile(controller.signal)])
      .then(([items, access]) => {
        setBusinessUnits(items);
        setAccessProfile(access);
        if (!items.some((item) => item.code === businessUnit) && items.length) setBusinessUnit(items[0].code);
      })
      .catch(() => { if (!controller.signal.aborted) setLoadError(c.loadError as string); });
    return () => controller.abort();
  }, [locale, dataMode]);

  useEffect(() => {
    if (!qaPreviewActive || businessUnit !== "ALL" || !businessUnits.length) return;
    setBusinessUnit(businessUnits[0].code);
  }, [qaPreviewActive, businessUnit, businessUnits]);

  useEffect(() => {
    if (activeTab === "crm-settings" && !effectiveAccessProfile.canViewSettings) setActiveTab("home");
  }, [activeTab, effectiveAccessProfile.canViewSettings]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    Promise.all([
      fetchCRMLeads(businessUnit || "ALL", controller.signal, crmDataScope),
      fetchCRMDeals(businessUnit || "ALL", controller.signal, crmDataScope),
      fetchCRMActivities(businessUnit || "ALL", controller.signal, crmDataScope),
    ])
      .then(([nextLeads, nextDeals, nextActivities]) => {
        setLeads(nextLeads);
        setDeals(nextDeals);
        setActivities(nextActivities);
      })
      .catch(() => { if (!controller.signal.aborted) setLoadError(c.loadError as string); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [businessUnit, locale, crmDataScope, dataMode]);

  useEffect(() => {
    const controller = new AbortController();
    setAnalyticsLoading(true);
    Promise.all([
      fetchCRMPerformance(businessUnit || "ALL", periodMonth, controller.signal),
      fetchCRMCommissions(businessUnit || "ALL", periodMonth, controller.signal),
    ])
      .then(([nextPerformance, nextCommissions]) => {
        setPerformance(nextPerformance);
        setCommissions(nextCommissions);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPerformance(null);
          setCommissions(null);
        }
      })
      .finally(() => { if (!controller.signal.aborted) setAnalyticsLoading(false); });
    return () => controller.abort();
  }, [businessUnit, periodMonth, dataMode]);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleLeads = useMemo(() => leads.filter((lead) => {
    const matchesQuery = !normalizedQuery || [lead.id, lead.storeName, lead.primaryContact, lead.owner, lead.phone, lead.province, lead.email || ""]
      .join(" ").toLowerCase().includes(normalizedQuery);
    if (!matchesQuery) return false;
    if (leadQuickFilter === "NEW") return lead.status === "NEW";
    if (leadQuickFilter === "NO_ACTIVITY") return !lead.nextActivity && !["CONVERTED", "LOST"].includes(lead.status);
    if (leadQuickFilter === "ACTION_TODAY") return Boolean(lead.nextActivityAt && isSameLocalDay(new Date(lead.nextActivityAt), new Date()) && new Date(lead.nextActivityAt).getTime() >= Date.now());
    if (leadQuickFilter === "OVERDUE") return Boolean(lead.nextActivityAt && new Date(lead.nextActivityAt).getTime() < Date.now());
    return true;
  }), [leads, normalizedQuery, leadQuickFilter]);

  const visibleDeals = useMemo(() => deals.filter((deal) => {
    if (!normalizedQuery) return true;
    return [deal.id, deal.storeName, deal.primaryContact || "", deal.owner, deal.sourceLeadCode || "", deal.quotationNumber || ""]
      .join(" ").toLowerCase().includes(normalizedQuery);
  }), [deals, normalizedQuery]);

  const visibleActivities = useMemo(() => activities.filter((activity) => {
    const matchesQuery = !normalizedQuery || [
      activity.id, activity.relatedName, activity.owner, activity.type, activity.purposeCode || "",
      activity.purposeDetail || "", activity.leadCode || "", activity.dealCode || "",
    ].join(" ").toLowerCase().includes(normalizedQuery);
    if (!matchesQuery) return false;
    const scheduled = new Date(activity.scheduledAt);
    const now = new Date();
    if (activityPageFilter === "TODAY") return !["COMPLETED", "CANCELLED"].includes(activity.status) && isSameLocalDay(scheduled, now);
    if (activityPageFilter === "OVERDUE") return activity.status === "OVERDUE";
    if (activityPageFilter === "UPCOMING") return !["COMPLETED", "CANCELLED", "OVERDUE"].includes(activity.status) && scheduled.getTime() > now.getTime();
    if (activityPageFilter === "COMPLETED") return activity.status === "COMPLETED";
    return true;
  }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()), [activities, normalizedQuery, activityPageFilter]);

  const overdueCount = activities.filter((item) => item.status === "OVERDUE").length;
  const newLeadCount = leads.filter((lead) => lead.status === "NEW").length;
  const actionTodayLeadCount = leads.filter((lead) => lead.nextActivityAt && isSameLocalDay(new Date(lead.nextActivityAt), new Date()) && new Date(lead.nextActivityAt).getTime() >= Date.now()).length;
  const overdueLeadCount = leads.filter((lead) => lead.nextActivityAt && new Date(lead.nextActivityAt).getTime() < Date.now()).length;
  const noNextLeads = leads.filter((lead) => !lead.nextActivity && !["CONVERTED", "LOST"].includes(lead.status));
  const priorityActivities = activities.filter((item) => item.bucket === "TODAY" || item.status === "OVERDUE");
  const calendarActivities = activities
    .filter((activity) => !["COMPLETED", "CANCELLED"].includes(activity.status))
    .filter((activity) => calendarView === "day" ? isSameLocalDay(new Date(activity.scheduledAt), new Date()) : isWithinCurrentWeek(new Date(activity.scheduledAt)))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const weekDays = useMemo(() => {
    const start = startOfLocalWeek();
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, []);
  const openDeals = visibleDeals.filter((deal) => !["CLOSED_WON", "CLOSED_LOST"].includes(deal.stage));
  const wonDeals = visibleDeals.filter((deal) => deal.stage === "CLOSED_WON");
  const lostDeals = visibleDeals.filter((deal) => deal.stage === "CLOSED_LOST");

  const selectableBusinessUnits = businessUnits.length
    ? businessUnits
    : [{ id: "fallback-qpos", code: "QPOS", name: "QPOS", status: "ACTIVE" }];

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  }

  function blockQAPreviewWrite() {
    if (!previewReadOnly) return false;
    showToast("Role / Scope Preview is read-only on Real Data. Switch to QA Demo Data to test safely.");
    return true;
  }

  async function reloadCRM(targetBU = businessUnit) {
    const [nextLeads, nextDeals, nextActivities, nextPerformance, nextCommissions] = await Promise.all([
      fetchCRMLeads(targetBU || "ALL", undefined, crmDataScope),
      fetchCRMDeals(targetBU || "ALL", undefined, crmDataScope),
      fetchCRMActivities(targetBU || "ALL", undefined, crmDataScope),
      fetchCRMPerformance(targetBU || "ALL", periodMonth),
      fetchCRMCommissions(targetBU || "ALL", periodMonth),
    ]);
    setLeads(nextLeads);
    setDeals(nextDeals);
    setActivities(nextActivities);
    setPerformance(nextPerformance);
    setCommissions(nextCommissions);
    if (selectedLead) setSelectedLead(nextLeads.find((item) => item.id === selectedLead.id) || null);
    if (selectedDeal) setSelectedDeal(nextDeals.find((item) => item.id === selectedDeal.id) || null);
  }

  function startDealDrag(event: DragEvent<HTMLElement>, deal: CRMDeal) {
    if (["CLOSED_WON", "CLOSED_LOST"].includes(deal.stage) || movingDealCode) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", deal.id);
    setDraggingDealCode(deal.id);
  }

  function endDealDrag() {
    window.setTimeout(() => setDraggingDealCode(null), 0);
    setDragOverStage(null);
    setLostDropActive(false);
  }

  async function moveDealByDrop(deal: CRMDeal, targetStage: DealStage) {
    if (blockQAPreviewWrite()) return;
    if (deal.stage === targetStage || movingDealCode) return;
    if (targetStage === "CLOSED_WON") {
      showToast(d.wonLockedHint);
      return;
    }
    if (targetStage === "CLOSED_LOST") {
      setStageDeal(deal);
      setDealNextStage("CLOSED_LOST");
      return;
    }

    const previousDeal = deal;
    setMovingDealCode(deal.id);
    setDeals((items) => items.map((item) => item.id === deal.id ? { ...item, stage: targetStage } : item));
    try {
      const updated = await changeCRMDealStage(deal.id, { stage: targetStage });
      setDeals((items) => items.map((item) => item.id === deal.id ? updated : item));
      if (selectedDeal?.id === deal.id) setSelectedDeal(updated);
      showToast(`${updated.id} · ${prettyCode(updated.stage)}`);
    } catch (error) {
      setDeals((items) => items.map((item) => item.id === deal.id ? previousDeal : item));
      showToast(error instanceof Error ? error.message : (c.loadError as string));
    } finally {
      setMovingDealCode(null);
    }
  }

  function dropDealOnStage(event: DragEvent<HTMLElement>, stage: DealStage) {
    event.preventDefault();
    const dealCode = event.dataTransfer.getData("text/plain") || draggingDealCode;
    const deal = deals.find((item) => item.id === dealCode);
    setDragOverStage(null);
    setLostDropActive(false);
    if (deal) void moveDealByDrop(deal, stage);
    window.setTimeout(() => setDraggingDealCode(null), 0);
  }

  function dropDealAsLost(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const dealCode = event.dataTransfer.getData("text/plain") || draggingDealCode;
    const deal = deals.find((item) => item.id === dealCode);
    setLostDropActive(false);
    if (deal) void moveDealByDrop(deal, "CLOSED_LOST");
    window.setTimeout(() => setDraggingDealCode(null), 0);
  }

  async function createLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blockQAPreviewWrite() || savingLead) return;
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
      assignmentMode: (isSharedContext || workspaceContext.canCreateSharedLead) ? "UNASSIGNED" as const : "SELF" as const,
    };
    if (!payload.businessUnitCode || !payload.storeName || !payload.primaryContact || !payload.phone || !payload.province) return;

    setSavingLead(true);
    try {
      let created: CRMLead;
      try {
        created = await createCRMLead(payload);
      } catch (error) {
        if (error instanceof CRMApiError && error.code === "CRM_LEAD_POSSIBLE_DUPLICATE") {
          if (!window.confirm(c.duplicatePrompt as string)) return;
          created = await createCRMLead({ ...payload, allowDuplicate: true });
        } else throw error;
      }
      setShowNewLead(false);
      setActiveTab("leads");
      setBusinessUnit(created.businessUnit);
      setNewLeadSource("OWN_LEAD");
      formElement.reset();
      await reloadCRM(created.businessUnit);
      setSelectedLead(created);
      showToast(c.createdReal as string);
    } catch (error) {
      showToast(error instanceof Error ? error.message : (c.loadError as string));
    } finally {
      setSavingLead(false);
    }
  }

  async function openConvertDeal(lead: CRMLead) {
    if (blockQAPreviewWrite() || loadingConvertProducts) return;
    setLoadingConvertProducts(true);
    try {
      const options = (await fetchCRMProductOptions(lead.businessUnit)).filter((item) => item.status === "ACTIVE");
      setConvertProductOptions(options);
      const first = options.find((item) => item.pointType === "SOFTWARE") || options[0];
      setConvertProductLineDraft(first ? [productDraftFromOption(first)] : []);
      setConvertCurrency((first?.currency || "LAK") as DealCurrency);
      setConvertLead(lead);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to load Product Source.");
    } finally {
      setLoadingConvertProducts(false);
    }
  }

  function addConvertProductLine() {
    const selected = new Set(convertProductLineDraft.map((item) => item.productCode));
    const option = convertProductOptions.find((item) => item.status === "ACTIVE" && !selected.has(item.productCode));
    if (!option) {
      showToast("All available Products are already in this Deal. Increase quantity instead.");
      return;
    }
    setConvertProductLineDraft((items) => [...items, productDraftFromOption(option)]);
  }

  function updateConvertProductLine(index: number, patch: Partial<DealProductDraft>) {
    setConvertProductLineDraft((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  async function convertToDeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blockQAPreviewWrite() || !convertLead || savingDeal) return;
    if (!convertProductLineDraft.length) {
      showToast("Add at least one Product before creating the Deal.");
      return;
    }
    const form = new FormData(event.currentTarget);
    setSavingDeal(true);
    try {
      const created = await convertCRMLeadToDeal(convertLead.id, {
        currency: convertCurrency,
        expectedCloseDate: String(form.get("expectedCloseDate") || "").trim() || undefined,
        productNote: String(form.get("productNote") || "").trim() || undefined,
        productLines: convertProductLineDraft.map(({ productCode, quantity, unitPrice }) => ({ productCode, quantity, unitPrice })),
      });
      setConvertLead(null);
      setConvertProductLineDraft([]);
      setConvertProductOptions([]);
      setSelectedLead(null);
      setSelectedDeal(created);
      setActiveTab("pipeline");
      await reloadCRM(created.businessUnit);
      showToast(`${created.id} · ${d.createDeal}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : (c.loadError as string));
    } finally {
      setSavingDeal(false);
    }
  }

  async function saveDealCommercial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blockQAPreviewWrite() || !editDeal || savingDeal) return;
    const form = new FormData(event.currentTarget);
    setSavingDeal(true);
    try {
      const updated = await updateCRMDeal(editDeal.id, {
        currency: String(form.get("currency") || editDeal.currency) as DealCurrency,
        expectedCloseDate: String(form.get("expectedCloseDate") || "").trim() || undefined,
        productNote: String(form.get("productNote") || "").trim() || undefined,
      });
      setEditDeal(null);
      setSelectedDeal(updated);
      await reloadCRM();
      showToast(`${updated.id} · Deal updated`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : (c.loadError as string));
    } finally {
      setSavingDeal(false);
    }
  }

  async function changeDealStage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blockQAPreviewWrite() || !stageDeal || savingDeal) return;
    const form = new FormData(event.currentTarget);
    setSavingDeal(true);
    try {
      const updated = await changeCRMDealStage(stageDeal.id, {
        stage: dealNextStage,
        lostReason: String(form.get("lostReason") || "").trim() || undefined,
      });
      setStageDeal(null);
      setSelectedDeal(updated);
      await reloadCRM();
      showToast(`${updated.id} · ${prettyCode(updated.stage)}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : (c.loadError as string));
    } finally {
      setSavingDeal(false);
    }
  }

  async function scheduleActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blockQAPreviewWrite() || !activityTarget || savingActivity) return;
    const form = new FormData(event.currentTarget);
    const scheduledAt = toIsoFromLocal(form.get("scheduledAt"));
    if (!scheduledAt) return;
    const payload = {
      type: String(form.get("type")) as ActivityType,
      purposeCode: String(form.get("purposeCode") || "").trim(),
      purposeDetail: String(form.get("purposeDetail") || "").trim() || undefined,
      scheduledAt,
      note: String(form.get("note") || "").trim() || undefined,
    };
    setSavingActivity(true);
    try {
      if (activityTarget.kind === "LEAD") await createCRMLeadActivity(activityTarget.id, payload);
      else await createCRMDealActivity(activityTarget.id, payload);
      setActivityTarget(null);
      setScheduleActivityType("CALL");
      setSchedulePurpose(ACTIVITY_PURPOSES.CALL[0]);
      await reloadCRM();
      showToast(c.activitySaved as string);
    } catch (error) {
      showToast(error instanceof Error ? error.message : (c.loadError as string));
    } finally {
      setSavingActivity(false);
    }
  }

  async function completeActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blockQAPreviewWrite() || !activityAction || savingActivity) return;
    const form = new FormData(event.currentTarget);
    const payload: Parameters<typeof completeCRMActivity>[1] = {
      outcome: String(form.get("outcome") || ""),
      resultNote: String(form.get("resultNote") || "").trim(),
    };
    if (completeNext) {
      const nextScheduledAt = toIsoFromLocal(form.get("nextScheduledAt"));
      if (!nextScheduledAt) return;
      payload.nextActivity = {
        type: String(form.get("nextType")) as ActivityType,
        purposeCode: String(form.get("nextPurposeCode") || "").trim(),
        purposeDetail: String(form.get("nextPurposeDetail") || "").trim() || undefined,
        scheduledAt: nextScheduledAt,
        note: String(form.get("nextNote") || "").trim() || undefined,
      };
    }
    if (completeUpdateStage && activityAction.activity.relatedType === "DEAL") {
      payload.dealStage = completeDealStage;
      payload.stageReason = String(form.get("stageReason") || "").trim() || undefined;
      payload.lostReason = String(form.get("lostReason") || "").trim() || undefined;
    }
    setSavingActivity(true);
    try {
      await completeCRMActivity(activityAction.activity.id, payload);
      setActivityAction(null);
      setCompleteNext(false);
      setNextActivityType("FOLLOW_UP");
      setNextPurpose(ACTIVITY_PURPOSES.FOLLOW_UP[0]);
      setCompleteUpdateStage(false);
      setCompleteDealStage("NEW_DEAL");
      await reloadCRM();
      showToast(c.saveComplete as string);
    } catch (error) {
      showToast(error instanceof Error ? error.message : (c.loadError as string));
    } finally {
      setSavingActivity(false);
    }
  }

  async function rescheduleActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blockQAPreviewWrite() || !activityAction || savingActivity) return;
    const form = new FormData(event.currentTarget);
    const scheduledAt = toIsoFromLocal(form.get("scheduledAt"));
    if (!scheduledAt) return;
    setSavingActivity(true);
    try {
      await rescheduleCRMActivity(activityAction.activity.id, {
        scheduledAt,
        reason: String(form.get("reason") || "").trim(),
      });
      setActivityAction(null);
      await reloadCRM();
      showToast(c.saveSchedule as string);
    } catch (error) {
      showToast(error instanceof Error ? error.message : (c.loadError as string));
    } finally {
      setSavingActivity(false);
    }
  }

  function openDealStage(deal: CRMDeal) {
    setStageDeal(deal);
    setDealNextStage(deal.stage === "NEW_DEAL" ? "DEMO" : deal.stage);
  }

  const navLabels = { home: "Home", leads: "Leads", pipeline: "Pipeline", activities: "Activities", customers: "Customers", performance: "Performance", commission: "Commission", settings: "Settings" };

  function navigateShared(destination: CRMUnifiedDestination) {
    setActiveTab(destination === "settings" ? "crm-settings" : destination);
  }

  function openLeadFilter(filter: LeadQuickFilter) {
    setLeadQuickFilter(filter);
    setActiveTab("leads");
  }

  async function changeCRMDataMode(mode: CRMDataMode) {
    if (mode === dataMode) return;
    setCRMDataMode(mode);
    setDataModeState(mode);
    setSelectedLead(null);
    setSelectedDeal(null);
    setProductLineDeal(null);
    setLoadError("");
    if (mode === "QA_DEMO") {
      setBusinessUnit("QPOS");
      setQAPreviewRole("SALES");
      showToast("QA Demo Data Mode enabled. Changes stay in this browser and never touch Real Data.");
    } else {
      setQAPreviewRole("ACTUAL");
      showToast("Real Data Mode enabled.");
    }
  }

  async function resetDemoWorkspace() {
    if (!qaDemoMode) return;
    if (!window.confirm("Reset all CRM QA Demo changes back to the original sample data?")) return;
    resetCRMQADemoData();
    setSelectedLead(null);
    setSelectedDeal(null);
    setProductLineDeal(null);
    await reloadCRM("QPOS");
    showToast("CRM QA Demo Data reset.");
  }

  async function openProductLines(deal: CRMDeal) {
    if (["CLOSED_WON", "CLOSED_LOST"].includes(deal.stage)) return;
    setSavingProductLines(true);
    try {
      const options = (await fetchCRMProductOptions(deal.businessUnit)).filter((item) => item.status === "ACTIVE");
      setProductLineOptions(options);
      setProductLineDraft((deal.productLines || []).map((item) => ({
        productCode: item.productCode,
        productName: item.productName,
        pointType: item.pointType,
        unitLabel: item.unitLabel,
        inventoryManaged: item.inventoryManaged,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })));
      setProductLineDeal(deal);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to load Product Lines.");
    } finally {
      setSavingProductLines(false);
    }
  }

  function addProductLine() {
    const selected = new Set(productLineDraft.map((item) => item.productCode));
    const option = productLineOptions.find((item) => item.status === "ACTIVE" && !selected.has(item.productCode));
    if (!option) {
      showToast("All available Products are already in this Deal. Increase quantity instead.");
      return;
    }
    setProductLineDraft((items) => [...items, productDraftFromOption(option)]);
  }

  function updateProductLine(index: number, patch: Partial<DealProductDraft>) {
    setProductLineDraft((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  async function saveProductLines() {
    if (!productLineDeal || savingProductLines) return;
    if (!productLineDraft.length) {
      showToast("A Deal must contain at least one Product.");
      return;
    }
    setSavingProductLines(true);
    try {
      const updated = await saveCRMDealProductLines(productLineDeal.id, productLineDraft.map(({ productCode, quantity, unitPrice }) => ({ productCode, quantity, unitPrice })));
      setProductLineDeal(null);
      setProductLineOptions([]);
      setSelectedDeal(updated);
      await reloadCRM(updated.businessUnit);
      showToast(`${updated.id} · Product Lines saved`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to save Product Lines.");
    } finally {
      setSavingProductLines(false);
    }
  }

  async function runExternalGate(action: "LINK_QUOTATION" | "CONFIRM_QUOTATION" | "UPLOAD_PAYMENT_SLIP" | "FINANCE_CONFIRM_INVOICE") {
    if (!selectedDeal || !qaDemoMode || runningExternalGate) return;
    setRunningExternalGate(true);
    try {
      const updated = await runCRMQAExternalGate(selectedDeal.id, action);
      setSelectedDeal(updated);
      await reloadCRM(updated.businessUnit);
      showToast(`${updated.id} · QA External Gate updated`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to run QA External Gate.");
    } finally {
      setRunningExternalGate(false);
    }
  }

  const convertTotals = lineTotals(convertProductLineDraft);
  const productEditTotals = lineTotals(productLineDraft);

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
            <div className={styles.eyebrow}><QBMSIcon name="sparkle" size={15} />{c.foundation as string}</div>
            <h2>{c.pageTitle as string}</h2>
            <p>{c.foundationHint as string}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              <span className={styles.statusNeutral}>{workspaceContext.roleLabel}</span>
              <span className={styles.statusNeutral}>{workspaceContext.scopeLabel}</span>
              <span className={styles.statusNeutral}>One CRM · Role-based View</span>
            </div>
          </div>
          <div className={styles.heroActions}>
            <label className={styles.buPicker}>
              <span>{c.businessUnit as string}</span>
              <select value={businessUnit} onChange={(event) => setBusinessUnit(event.target.value)}>
                <option value="ALL">{c.allBU as string}</option>
                {selectableBusinessUnits.map((item) => <option key={item.id} value={item.code}>{item.code}</option>)}
              </select>
            </label>
            <button className={styles.primaryButton} type="button" disabled={previewReadOnly || !workspaceContext.canCreateLead} title={previewReadOnly ? "Role Preview is read-only on Real Data" : !workspaceContext.canCreateLead ? "This CRM role cannot create Leads" : undefined} onClick={() => setShowNewLead(true)}>
              <QBMSIcon name="plus" size={16} />{previewReadOnly ? "Preview Only" : c.newLead as string}
            </button>
          </div>
        </section>

        {CRM_QA_DEMO_AVAILABLE && (
          <section className={styles.panel} style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", border: qaDemoMode ? "1px solid #f59e0b" : undefined }}>
            <div style={{ minWidth: 260, flex: "1 1 360px" }}>
              <div className={styles.eyebrow}>QA DATA MODE · SAFE OPERATIONAL TRIAL</div>
              <strong style={{ display: "block", marginTop: 4, color: "#101828" }}>{qaDemoMode ? "QA Demo Data is active" : "Real Data is active"}</strong>
              <p style={{ margin: "4px 0 0", color: "#667085", fontSize: 12, lineHeight: 1.5 }}>
                {qaDemoMode
                  ? "Create Leads, complete Activities, convert Deals, drag Pipeline, edit Settings and simulate external gates. All QA changes stay in this browser only."
                  : "Real Data uses the normal CRM backend. Role Preview remains read-only so previewing another role cannot change production data."}
              </p>
            </div>
            <label className={styles.buPicker}>
              <span>Data Source</span>
              <select value={dataMode} onChange={(event) => void changeCRMDataMode(event.target.value as CRMDataMode)}>
                <option value="REAL">Real Data</option>
                <option value="QA_DEMO">QA Demo Data</option>
              </select>
            </label>
            {qaDemoMode && <button type="button" className={styles.secondaryButton} onClick={() => void resetDemoWorkspace()}>Reset Demo Data</button>}
          </section>
        )}

        {CRM_QA_PREVIEW_ENABLED && (
          <section className={styles.panel} style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", borderStyle: qaPreviewActive ? "solid" : "dashed" }}>
            <div style={{ minWidth: 240, flex: "1 1 320px" }}>
              <div className={styles.eyebrow}>QA DATA MODE · ROLE / SCOPE PREVIEW</div>
              <strong style={{ display: "block", marginTop: 4, color: "#101828" }}>Preview the same CRM as another role</strong>
              <p style={{ margin: "4px 0 0", color: "#667085", fontSize: 12, lineHeight: 1.5 }}>
                {qaDemoMode
                  ? "In QA Demo Data, Role Preview is interactive so you can test each role safely. It never changes your real CRM membership or real data."
                  : "On Real Data, Preview changes visibility and read scope only. It is read-only and does not change your real CRM membership, role or approval authority."}
              </p>
            </div>
            <label className={styles.buPicker}>
              <span>Preview As</span>
              <select value={qaPreviewRole} onChange={(event) => setQAPreviewRole(event.target.value as CRMQAPreviewRole)}>
                <option value="ACTUAL">Actual Access</option>
                <option value="SALES">Sales · Self</option>
                <option value="SALES_MANAGER">Sales Manager · Team</option>
                <option value="SALES_OPS">Sales Ops · BU</option>
                <option value="CRM_BU_ADMIN">CRM BU Admin · BU + Settings</option>
                <option value="VIEWER">Viewer · BU Read-only</option>
              </select>
            </label>
            <div style={{ display: "grid", gap: 5, minWidth: 160 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#667085" }}>Preview Status</span>
              <span className={qaPreviewActive ? styles.statusDanger : styles.statusNeutral}>
                {qaPreviewActive ? `${workspaceContext.roleLabel} · ${workspaceContext.scopeLabel}` : "Using Actual Access"}
              </span>
            </div>
          </section>
        )}

        {qaDemoMode && (
          <section className={styles.panel} style={{ padding: 14 }}>
            <div className={styles.eyebrow}>QA TRIAL GUIDE · END-TO-END</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginTop: 10 }}>
              {[
                ["1", "Set Point Rules", "Preview CRM BU Admin → Settings → Point Settings. Temporary Product Source starts at 0 Point."],
                ["2", "Create / Assign Lead", "Try Sales for Self scope, then Sales Ops for BU scope and assignment."],
                ["3", "Work Activities", "Schedule, complete or reschedule Activities and optionally update Deal Stage."],
                ["4", "Convert + Products", "Convert a Lead to Deal, then open QA Product Lines and select SW/HW products."],
                ["5", "Close Through Gates", "Link/confirm quotation, upload payment slip, then Finance Confirm + Invoice to recognize Points."],
              ].map(([step, title, hint]) => (
                <div key={step} style={{ padding: 11, border: "1px solid #e7eaf0", borderRadius: 10, background: "#fff" }}>
                  <span className={styles.statusNeutral}>STEP {step}</span>
                  <strong style={{ display: "block", marginTop: 7, color: "#101828", fontSize: 12 }}>{title}</strong>
                  <p style={{ margin: "4px 0 0", color: "#667085", fontSize: 11, lineHeight: 1.45 }}>{hint}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <nav className={styles.tabs} aria-label="CRM workspace">
          {([
            ["home", navLabels.home],
            ["leads", navLabels.leads],
            ["pipeline", navLabels.pipeline],
            ["activities", navLabels.activities],
            ["customers", navLabels.customers],
            ["performance", navLabels.performance],
            ["commission", navLabels.commission],
            ...(effectiveAccessProfile.canViewSettings ? [["crm-settings", navLabels.settings] as [WorkspaceTab, string]] : []),
          ] as Array<[WorkspaceTab, string]>).map(([key, label]) => (
            <button key={key} type="button" className={activeTab === key ? styles.activeTab : ""} onClick={() => setActiveTab(key)}>{label}</button>
          ))}
        </nav>

        {loadError && <div className={styles.panel} style={{ padding: 16 }}>{loadError}</div>}
        {sharedView && isSharedContext && (
          <CRMSharedScopeWorkspace
            key={`${dataMode}-${businessUnit}-${workspaceContext.roleCode}`}
            view={sharedView}
            contextLabel={workspaceContext.roleLabel}
            scopeLabel={workspaceContext.scopeLabel}
            businessUnit={businessUnit}
            period={periodMonth}
            query={query}
            leads={leads}
            deals={deals}
            activities={activities}
            access={effectiveAccessProfile}
            readOnlyPreview={previewReadOnly}
            onRefresh={() => reloadCRM()}
            onOpenLead={setSelectedLead}
            onOpenDeal={setSelectedDeal}
            onNewLead={() => setShowNewLead(true)}
            onNavigate={navigateShared}
          />
        )}

        {activeTab === "home" && !isSharedContext && (
          <section className={styles.workspace}>
            <div className={styles.sectionHeading}><div><h3>My Day</h3><p>Activity schedule and Lead attention in one daily workspace.</p></div></div>
            <div className={workflowStyles.leadAttentionGrid}>
              <button type="button" onClick={() => openLeadFilter("NEW")}><span>New Lead</span><strong>{newLeadCount}</strong><small>New Leads waiting for first action</small></button>
              <button type="button" onClick={() => openLeadFilter("ACTION_TODAY")}><span>Action Today</span><strong>{actionTodayLeadCount}</strong><small>Leads with Activity due today</small></button>
              <button type="button" onClick={() => openLeadFilter("OVERDUE")}><span>Lead Overdue</span><strong>{overdueLeadCount}</strong><small>Leads with overdue Activity</small></button>
              <button type="button" onClick={() => openLeadFilter("NO_ACTIVITY")}><span>No Activity</span><strong>{noNextLeads.length}</strong><small>Leads without a Next Activity</small></button>
            </div>

            <div className={workflowStyles.calendarPanel}>
              <div className={workflowStyles.calendarHeader}>
                <div><h4>Activity Calendar</h4><p>Today and Week stay on Home; the Activities tab gives the same CRM Activity object a full searchable history view.</p></div>
                <div className={workflowStyles.viewSwitch}>
                  <button type="button" className={calendarView === "day" ? workflowStyles.active : ""} onClick={() => setCalendarView("day")}>Day</button>
                  <button type="button" className={calendarView === "week" ? workflowStyles.active : ""} onClick={() => setCalendarView("week")}>Week</button>
                </div>
              </div>
              {calendarView === "day" ? (
                <div className={workflowStyles.calendarList}>
                  {calendarActivities.length ? calendarActivities.map((item) => (
                    <article key={item.id} className={workflowStyles.calendarItem}>
                      <div className={workflowStyles.calendarTime}><strong>{new Date(item.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong><small>{new Date(item.scheduledAt).toLocaleDateString()}</small></div>
                      <span className={`${styles.activityIcon} ${item.status === "OVERDUE" ? styles.dangerIcon : ""}`}>{activityGlyph(item.type)}</span>
                      <div className={workflowStyles.calendarCopy}><div><strong>{item.relatedName}</strong><span>{activityLabel(item.type)} · {activityPurposeLabel(item)}</span></div><small>{item.relatedType} · {item.dealCode || item.leadCode}</small></div>
                      <span className={item.status === "OVERDUE" ? styles.statusDanger : styles.statusNeutral}>{prettyCode(item.status)}</span>
                      <ActivityButtons activity={item} c={c} onAction={setActivityAction} disabled={previewReadOnly} />
                    </article>
                  )) : <div className={workflowStyles.emptyCalendar}>No Activity scheduled today.</div>}
                </div>
              ) : (
                <div className={workflowStyles.weekGrid}>
                  {weekDays.map((day) => {
                    const dayItems = calendarActivities.filter((item) => isSameLocalDay(new Date(item.scheduledAt), day));
                    const today = isSameLocalDay(day, new Date());
                    return <section key={day.toISOString()} className={`${workflowStyles.weekDay} ${today ? workflowStyles.todayColumn : ""}`}>
                      <header><strong>{day.toLocaleDateString([], { weekday: "short" })}</strong><span>{day.getDate()}</span></header>
                      <div>{dayItems.length ? dayItems.map((item) => <article key={item.id} className={`${workflowStyles.weekActivity} ${item.status === "OVERDUE" ? workflowStyles.weekOverdue : ""}`}>
                        <button type="button" onClick={() => setActivityAction({ mode: "complete", activity: item })}>
                          <strong>{new Date(item.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {item.relatedName}</strong>
                          <span>{activityLabel(item.type)} · {activityPurposeLabel(item)}</span>
                        </button>
                        <button type="button" className={workflowStyles.weekReschedule} onClick={() => setActivityAction({ mode: "reschedule", activity: item })}>↻</button>
                      </article>) : <small className={workflowStyles.weekEmpty}>No activity</small>}</div>
                    </section>;
                  })}
                </div>
              )}
            </div>

            {overdueCount > 0 && (
              <div className={styles.panel}>
                <div className={styles.panelTitle}><strong>Overdue Activity</strong><span>{overdueCount}</span></div>
                <div className={styles.actionList}>
                  {priorityActivities.filter((item) => item.status === "OVERDUE").map((item) => (
                    <article className={styles.actionItem} key={item.id}>
                      <span className={`${styles.activityIcon} ${styles.dangerIcon}`}>{activityGlyph(item.type)}</span>
                      <div className={styles.actionCopy}><div className={styles.actionTopline}><strong>{activityLabel(item.type)}</strong><span className={styles.statusDanger}>Overdue</span></div><h4>{item.relatedName}</h4><p>{activityPurposeLabel(item)} · {localDateTime(item.scheduledAt)}</p></div>
                      <ActivityButtons activity={item} c={c} onAction={setActivityAction} disabled={previewReadOnly} />
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "leads" && !isSharedContext && (
          <section className={styles.workspace}>
            <div className={styles.sectionHeading}><div><h3>{c.leadTableTitle as string}</h3><p>All Leads live here. Add Activity from the Lead, or create a Deal when the Lead becomes a real opportunity.</p></div><span className={styles.resultCount}>{visibleLeads.length} Leads</span></div>
            <div className={workflowStyles.filterBar}>
              {([['ALL','All'],['NEW','New'],['ACTION_TODAY','Action Today'],['OVERDUE','Overdue'],['NO_ACTIVITY','No Activity']] as Array<[LeadQuickFilter,string]>).map(([key,label]) => <button type="button" key={key} className={leadQuickFilter === key ? workflowStyles.activeFilter : ""} onClick={() => setLeadQuickFilter(key)}>{label}</button>)}
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>{c.store as string}</th><th>{c.contact as string}</th><th>{c.province as string}</th><th>{c.source as string}</th><th>{c.status as string}</th><th>{c.owner as string}</th><th>{c.nextActivity as string}</th><th /></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={8}>{c.loadingLeads as string}</td></tr> : visibleLeads.length ? visibleLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td><strong>{lead.storeName}</strong><small>{lead.id} · {lead.businessUnit}</small></td>
                      <td>{lead.primaryContact}<small>{lead.phone}</small></td>
                      <td>{lead.province}</td>
                      <td>{prettyCode(lead.source)}{lead.sourceDetail ? <small>{lead.sourceDetail}</small> : null}</td>
                      <td><span className={styles.leadStatus}>{prettyCode(lead.status)}</span></td>
                      <td>{lead.owner}</td>
                      <td>{lead.nextActivity ? <>{activityLabel(lead.nextActivity)}<small>{localDateTime(lead.nextActivityAt)}</small></> : <span className={styles.warningText}>{c.noNextActivity as string}</span>}</td>
                      <td><div className={workflowStyles.rowActions}>
                        {!['CONVERTED','LOST'].includes(lead.status) && <button type="button" className={styles.secondaryButton} disabled={previewReadOnly} onClick={() => setActivityTarget({ kind: "LEAD", id: lead.id, name: lead.storeName })}>Activity</button>}
                        {!['CONVERTED','LOST'].includes(lead.status) && <button type="button" className={styles.primaryButton} disabled={previewReadOnly} onClick={() => void openConvertDeal(lead)}>Create Deal</button>}
                        <button type="button" className={styles.linkButton} onClick={() => setSelectedLead(lead)}>{c.open as string}</button>
                      </div></td>
                    </tr>
                  )) : <tr><td colSpan={8}>{c.noLeads as string}</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "pipeline" && !isSharedContext && (
          <section className={styles.workspace}>
            <div className={styles.sectionHeading}>
              <div>
                <h3>{c.pipelineTitle as string}</h3>
                <p>{d.dragHint}</p>
              </div>
              <span className={styles.resultCount}>{openDeals.length} {d.openDeals}</span>
            </div>

            {openDeals.length === 0 && (
              <div className={workflowStyles.pipelineEmptyGuide}>
                <div><strong>Pipeline contains Deals — not Leads.</strong><p>Create a Deal from a Lead when it becomes a real sales opportunity. The Deal will appear in New Deal and can then be dragged between stages.</p></div>
                <button type="button" className={styles.primaryButton} onClick={() => { setLeadQuickFilter("ALL"); setActiveTab("leads"); }}>Go to My Leads</button>
              </div>
            )}

            <div className={pipelineStyles.pipelineSummary}>
              <div className={pipelineStyles.summaryCard}><span>{d.openDeals}</span><strong>{openDeals.length}</strong></div>
              <div className={pipelineStyles.summaryCard}><span>{d.openValue}</span><strong>{moneySummary(openDeals)}</strong></div>
              <div className={pipelineStyles.summaryCard}><span>{d.closedWon}</span><strong>{wonDeals.length}</strong></div>
              <div className={pipelineStyles.summaryCard}><span>{d.closedLost}</span><strong>{lostDeals.length}</strong></div>
            </div>

            <div className={pipelineStyles.pipelineViewport}>
              <div className={pipelineStyles.pipelineBoard} style={{ gridTemplateColumns: `repeat(${ACTIVE_PIPELINE_STAGES.length}, minmax(260px, 1fr))` }}>
                {ACTIVE_PIPELINE_STAGES.map((stage) => {
                  const stageDeals = openDeals.filter((deal) => deal.stage === stage);
                  const isDropTarget = Boolean(draggingDealCode && dragOverStage === stage);
                  return (
                    <section
                      key={stage}
                      className={`${pipelineStyles.pipelineColumn} ${isDropTarget ? pipelineStyles.dropTarget : ""}`}
                      onDragEnter={(event) => { event.preventDefault(); if (draggingDealCode) setDragOverStage(stage); }}
                      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; if (draggingDealCode) setDragOverStage(stage); }}
                      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOverStage(null); }}
                      onDrop={(event) => dropDealOnStage(event, stage)}
                    >
                      <header className={pipelineStyles.columnHeader}>
                        <div><strong>{prettyCode(stage)}</strong><small>{moneySummary(stageDeals)}</small></div>
                        <span>{stageDeals.length}</span>
                      </header>
                      <div className={pipelineStyles.columnCards}>
                        {stageDeals.length ? stageDeals.map((deal) => {
                          const activityState = nextActivityState(deal);
                          const moving = movingDealCode === deal.id;
                          return (
                            <article
                              className={`${pipelineStyles.dealCard} ${draggingDealCode === deal.id ? pipelineStyles.draggingCard : ""} ${moving ? pipelineStyles.movingCard : ""}`}
                              key={deal.id}
                              draggable={!moving && !previewReadOnly}
                              onDragStart={(event) => startDealDrag(event, deal)}
                              onDragEnd={endDealDrag}
                              onClick={() => { if (draggingDealCode !== deal.id && !moving) setSelectedDeal(deal); }}
                              title={d.dragHint}
                            >
                              <div className={pipelineStyles.cardTopline}><span>{deal.id}</span><span>{deal.businessUnit}</span></div>
                              <h4>{deal.storeName}</h4>
                              <strong className={pipelineStyles.dealValue}>{money(deal.value, deal.currency)}</strong>
                              <p>{deal.owner}</p>
                              <div className={pipelineStyles.cardFacts}>
                                {deal.packageCode && <span>{prettyCode(deal.packageCode)} · {deal.licenseQuantity || 1} license</span>}
                                {deal.sourceLeadCode && <span>Lead · {deal.sourceLeadCode}</span>}
                                {deal.quotationNumber && <span>QT · {deal.quotationNumber}</span>}
                              </div>
                              <div className={`${pipelineStyles.activityPill} ${pipelineStyles[`activity${activityState}`]}`}>
                                {activityState === "NONE"
                                  ? `⚠ ${c.noNextActivity as string}`
                                  : `${activityState === "OVERDUE" ? "● " : activityState === "TODAY" ? "◉ " : "○ "}${activityLabel(deal.nextActivity!)} · ${localDateTime(deal.nextActivityAt)}`}
                              </div>
                              {moving && <div className={pipelineStyles.movingLabel}>{d.moving}</div>}
                            </article>
                          );
                        }) : <div className={pipelineStyles.emptyColumn}>{d.noDeals}</div>}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>

            <div className={pipelineStyles.outcomeDock}>
              <div
                className={`${pipelineStyles.lostZone} ${lostDropActive ? pipelineStyles.lostZoneActive : ""}`}
                onDragEnter={(event) => { event.preventDefault(); if (draggingDealCode) setLostDropActive(true); }}
                onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; if (draggingDealCode) setLostDropActive(true); }}
                onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setLostDropActive(false); }}
                onDrop={dropDealAsLost}
              >
                <strong>{d.lostDrop}</strong><span>{d.lostDropHint}</span>
              </div>
              <div className={pipelineStyles.wonZone}>
                <strong>🔒 {d.wonLocked}</strong><span>{d.wonLockedHint}</span>
              </div>
            </div>
          </section>
        )}

        {activeTab === "activities" && !isSharedContext && (
          <section className={styles.workspace}>
            <div className={styles.sectionHeading}>
              <div><h3>My Activities</h3><p>The same Activity records used by Home, Leads and Deals — shown here as a complete personal history.</p></div>
              <span className={styles.resultCount}>{visibleActivities.length} Activities</span>
            </div>
            <div className={workflowStyles.filterBar}>
              {([['ALL','All'],['TODAY','Today'],['OVERDUE','Overdue'],['UPCOMING','Upcoming'],['COMPLETED','Completed']] as Array<[ActivityPageFilter,string]>).map(([key,label]) => (
                <button type="button" key={key} className={activityPageFilter === key ? workflowStyles.activeFilter : ""} onClick={() => setActivityPageFilter(key)}>{label}</button>
              ))}
            </div>
            <div className={styles.activityTable}>
              {loading ? <div className={styles.panel} style={{ padding: 16 }}>Loading Activities...</div> : visibleActivities.length ? visibleActivities.map((item) => (
                <article className={styles.activityRow} key={item.id}>
                  <span className={`${styles.activityIcon} ${item.status === "OVERDUE" ? styles.dangerIcon : ""}`}>{activityGlyph(item.type)}</span>
                  <div className={styles.activityMain}><div><strong>{activityLabel(item.type)}</strong><span>{item.id}</span></div><h4>{item.relatedName}</h4><p>{activityPurposeLabel(item)} · {item.relatedType}</p></div>
                  <div className={styles.activityMeta}><span>Schedule</span><strong>{localDateTime(item.scheduledAt)}</strong></div>
                  <div className={styles.activityMeta}><span>Status</span><strong>{prettyCode(item.status)}</strong></div>
                  {previewReadOnly ? <span className={styles.statusNeutral}>Preview only</span> : <ActivityButtons activity={item} c={c} onAction={setActivityAction} />}
                </article>
              )) : <div className={styles.panel} style={{ padding: 16 }}>No Activities match this view.</div>}
            </div>
          </section>
        )}


        {activeTab === "customers" && (
          <CRMCustomersWorkspace
            key={`${dataMode}-${businessUnit}-${workspaceContext.roleCode}-${crmDataScope}`}
            businessUnit={businessUnit}
            scope={crmDataScope}
            access={effectiveAccessProfile}
            deals={visibleDeals}
            onOpenDeal={setSelectedDeal}
            onDealCreated={(deal) => {
              setDeals((current) => [deal, ...current.filter((item) => item.id !== deal.id)]);
              setSelectedDeal(deal);
              showToast(`New Opportunity ${deal.id} created.`);
            }}
            readOnly={previewReadOnly}
          />
        )}

        {activeTab === "performance" && !isSharedContext && (
          <section className={styles.workspace}>
            <div className={styles.sectionHeading}>
              <div><h3>My Performance</h3><p>One CRM definition: SW Point Target comes from Sales Target Settings. Actual Point waits for Deal Product Lines + Point Recognition.</p></div>
              <label className={styles.buPicker}><span>Period</span><input type="month" value={periodMonth} onChange={(event) => setPeriodMonth(event.target.value)} /></label>
            </div>
            <div className={workflowStyles.performanceHero}>
              <div>
                <span>SW Point Target</span>
                <strong>{analyticsLoading ? "…" : performance?.pointTarget.swPoints ?? 0}</strong>
                <small>{performance?.pointTarget.source ? `${prettyCode(performance.pointTarget.source)} Setting` : "Sales Target Setting"}</small>
              </div>
              <div>
                <span>Actual SW Point</span>
                <strong>{analyticsLoading ? "…" : performance?.pointAchievement.swPoints ?? "—"}</strong>
                <small>{performance?.pointAchievement.status === "PENDING_PRODUCT_LINES" ? "Pending Deal Product Lines" : "Recognized Point"}</small>
              </div>
              <div className={workflowStyles.progressArea}>
                <div><span>Achievement Rate</span><strong>{performance?.pointAchievement.rate == null ? "Pending" : `${performance.pointAchievement.rate}%`}</strong></div>
                <div className={workflowStyles.progressTrack}><span style={{ width: `${Math.min(performance?.pointAchievement.rate ?? 0, 100)}%` }} /></div>
                <small>{performance?.pointAchievement.remaining == null ? "Point Recognition not connected yet" : `${performance.pointAchievement.remaining} SW Point remaining`}</small>
              </div>
            </div>
            <div className={workflowStyles.performanceGrid}>
              <div><span>New Leads</span><strong>{performance?.funnel.newLeads ?? 0}</strong><small>created in period</small></div>
              <div><span>Lead → Deal</span><strong>{performance?.funnel.convertedLeads ?? 0}</strong><small>{performance?.funnel.leadToDealRate ?? 0}% conversion</small></div>
              <div><span>Won Deals</span><strong>{performance?.operational.wonDeals ?? 0}</strong><small>{performance?.operational.wonLicenses ?? 0} won licenses · operational only</small></div>
              <div><span>Activities Completed</span><strong>{performance?.activity.completed ?? 0}</strong><small>{performance?.activity.overdue ?? 0} currently overdue</small></div>
            </div>
            <div className={workflowStyles.revenueStrip}>
              <span>Won Value</span>
              <strong>{money(performance?.operational.wonValue.LAK ?? 0, "LAK")}</strong>
              <strong>{money(performance?.operational.wonValue.USD ?? 0, "USD")}</strong>
              <strong>{money(performance?.operational.wonValue.THB ?? 0, "THB")}</strong>
            </div>
            <div className={styles.panel} style={{ padding: 14 }}>
              <strong>Target Revenue: {money(performance?.pointTarget.revenue ?? 0, performance?.pointTarget.currency || "LAK")}</strong>
              <p style={{ margin: "6px 0 0", color: "#667085", fontSize: 12 }}>License quantity remains an operational metric. It is no longer used as the Sales Target achievement definition.</p>
            </div>
          </section>
        )}

        {activeTab === "commission" && !isSharedContext && (
          <section className={styles.workspace}>
            <div className={styles.sectionHeading}>
              <div><h3>My Commission</h3><p>Point-based only. The old Software 5% / Hardware 1% projection is no longer shown or calculated in this workspace.</p></div>
              <label className={styles.buPicker}><span>Period</span><input type="month" value={periodMonth} onChange={(event) => setPeriodMonth(event.target.value)} /></label>
            </div>
            <div className={workflowStyles.performanceGrid}>
              <div><span>Recognized SW Point</span><strong>{commissions?.recognized.swPoints ?? "—"}</strong><small>{commissions?.recognitionStatus === "PENDING_PRODUCT_LINES" ? "Pending Product Lines" : "Recognized"}</small></div>
              <div><span>Recognized HW Point</span><strong>{commissions?.recognized.hwPoints ?? "—"}</strong><small>{commissions?.recognitionStatus === "PENDING_PRODUCT_LINES" ? "Pending Product Lines" : "Recognized"}</small></div>
              <div><span>Commission</span><strong>{commissions?.recognized.amountLAK == null ? "—" : money(commissions.recognized.amountLAK, "LAK")}</strong><small>Based on monthly Point snapshot</small></div>
              <div><span>Won Deals</span><strong>{commissions?.wonDeals ?? 0}</strong><small>{periodMonth}</small></div>
            </div>
            <div className={styles.panel} style={{ padding: 16 }}>
              <div className={styles.sectionHeading}>
                <div><h3 style={{ fontSize: 16 }}>Effective Commission Plan</h3><p>Precedence: Individual Override → Team → BU Default.</p></div>
                <span className={styles.statusNeutral}>{commissions?.effectivePlan?.scopeType || "Not Configured"}</span>
              </div>
              {commissions?.effectivePlan ? (
                <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                  <div><strong>{commissions.effectivePlan.name}</strong><div style={{ color: "#667085", fontSize: 12, marginTop: 4 }}>HW: {new Intl.NumberFormat("en-US").format(commissions.effectivePlan.hardwareLAKPerPoint)} LAK / Point · {commissions.effectivePlan.sourcePeriod ? String(commissions.effectivePlan.sourcePeriod).slice(0, 7) : periodMonth}</div></div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {commissions.effectivePlan.tiers.map((tier) => <span key={tier.tierCode} className={styles.statusNeutral}>{tier.name}: {tier.minSWPoints}{tier.maxSWPoints == null ? "+" : `–${tier.maxSWPoints}`} → {new Intl.NumberFormat("en-US").format(tier.lakPerSWPoint)} LAK/SW Point</span>)}
                  </div>
                </div>
              ) : <p style={{ margin: "14px 0 0", color: "#b54708" }}>No Commission Plan configured for this context.</p>}
            </div>
            <div className={styles.panel} style={{ padding: 14 }}>
              <strong>{qaDemoMode ? "QA Point Recognition" : "Point Recognition Pending"}</strong>
              <p style={{ margin: "6px 0 0", color: "#667085", fontSize: 12 }}>{commissions?.message || "Actual commission becomes available after Product Master / Deal Product Lines / Point Recognition are connected."}</p>
            </div>
          </section>
        )}

        {activeTab === "crm-settings" && effectiveAccessProfile.canViewSettings && (
          <CRMBUSettingsPanel businessUnit={businessUnit} period={periodMonth} access={effectiveAccessProfile} />
        )}

      </div>

      {selectedLead && (
        <div className={styles.overlay} onMouseDown={() => setSelectedLead(null)}>
          <aside className={styles.drawer} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.drawerHeader}><div><span>{c.leadDetail as string}</span><h3>{selectedLead.storeName}</h3></div><button type="button" onClick={() => setSelectedLead(null)}>×</button></div>
            {canOperateSelected && !['CONVERTED', 'LOST'].includes(selectedLead.status) && (
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <button type="button" className={styles.primaryButton} disabled={previewReadOnly} onClick={() => setActivityTarget({ kind: "LEAD", id: selectedLead.id, name: selectedLead.storeName })}>+ Activity</button>
                <button type="button" className={styles.primaryButton} disabled={previewReadOnly} onClick={() => void openConvertDeal(selectedLead)}>Create Deal</button>
              </div>
            )}
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
            <Detail label={c.notes as string} value={selectedLead.note || "—"} wide />
            <div className={workflowStyles.timelineSection}>
              <div className={workflowStyles.timelineHeader}><strong>Activity Timeline</strong>{canOperateSelected && <button type="button" className={styles.secondaryButton} disabled={previewReadOnly} onClick={() => setActivityTarget({ kind: "LEAD", id: selectedLead.id, name: selectedLead.storeName })}>+ Activity</button>}</div>
              {activities.filter((item) => item.leadCode === selectedLead.id).length ? activities.filter((item) => item.leadCode === selectedLead.id).map((item) => (
                <article key={item.id} className={workflowStyles.timelineItem}><span className={styles.activityIcon}>{activityGlyph(item.type)}</span><div><strong>{activityLabel(item.type)} · {activityPurposeLabel(item)}</strong><p>{localDateTime(item.scheduledAt)} · {prettyCode(item.status)}</p>{item.resultNote && <small>{item.resultNote}</small>}</div></article>
              )) : <div className={workflowStyles.emptyTimeline}>No Activity yet.</div>}
            </div>
          </aside>
        </div>
      )}

      {selectedDeal && (
        <div className={styles.overlay} onMouseDown={() => setSelectedDeal(null)}>
          <aside className={styles.drawer} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.drawerHeader}><div><span>{d.dealDetail}</span><h3>{selectedDeal.storeName}</h3></div><button type="button" onClick={() => setSelectedDeal(null)}>×</button></div>
            {canOperateSelected && !['CLOSED_WON', 'CLOSED_LOST'].includes(selectedDeal.stage) && (
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <button type="button" className={styles.primaryButton} disabled={previewReadOnly} onClick={() => setActivityTarget({ kind: "DEAL", id: selectedDeal.id, name: selectedDeal.storeName })}>{c.scheduleNext as string}</button>
                <button type="button" className={styles.secondaryButton} disabled={previewReadOnly} onClick={() => setEditDeal(selectedDeal)}>Edit Deal</button>
                <button type="button" className={styles.secondaryButton} disabled={previewReadOnly} onClick={() => openDealStage(selectedDeal)}>{d.changeStage}</button>
                <button type="button" className={styles.secondaryButton} disabled={previewReadOnly || savingProductLines} onClick={() => void openProductLines(selectedDeal)}>Edit Products</button>
              </div>
            )}
            <Detail label="Deal Code" value={selectedDeal.id} />
            <Detail label={d.sourceLead} value={selectedDeal.sourceLeadCode || "—"} />
            <Detail label="Customer" value={selectedDeal.customerCode ? `${selectedDeal.customerCode} · ${selectedDeal.customerName || selectedDeal.storeName}` : (selectedDeal.stage === "CLOSED_WON" ? "Customer link pending" : "Created/linked at Closed Won")} />
            {selectedDeal.customerLinkedAt && <Detail label="Customer Linked" value={localDateTime(selectedDeal.customerLinkedAt)} />}
            <Detail label={c.businessUnit as string} value={selectedDeal.businessUnit} />
            <Detail label={d.stage} value={prettyCode(selectedDeal.stage)} />
            <Detail label={c.owner as string} value={selectedDeal.owner} />
            <Detail label="Software Quantity" value={String(selectedDeal.licenseQuantity || 0)} />
            <Detail label="Software Value" value={money(selectedDeal.softwareValue || 0, selectedDeal.currency)} />
            <Detail label="Hardware Value" value={money(selectedDeal.hardwareValue || 0, selectedDeal.currency)} />
            <Detail label={d.dealValue} value={money(selectedDeal.value, selectedDeal.currency)} />
            <Detail label={d.expectedClose} value={selectedDeal.expectedCloseDate || "—"} />
            <Detail label="Product Note" value={selectedDeal.productNote || "—"} wide />
            <Detail label={c.nextActivity as string} value={selectedDeal.nextActivity ? `${activityLabel(selectedDeal.nextActivity)} · ${localDateTime(selectedDeal.nextActivityAt)}` : "—"} />
            <Detail label={c.quotation as string} value={selectedDeal.quotationNumber || "—"} />
            <Detail label="Quotation Confirmed" value={selectedDeal.quotationConfirmed ? "Yes" : "No"} />
            <Detail label="Payment Slip" value={selectedDeal.paymentSlipUploaded ? "Uploaded" : "Not Uploaded"} />
            <Detail label="Finance Confirmed" value={selectedDeal.financePaymentConfirmed ? "Yes" : "No"} />
            <Detail label="Invoice" value={selectedDeal.invoiceNumber || "—"} />
            {selectedDeal.productLines?.length ? (
              <div className={workflowStyles.timelineSection}>
                <div className={workflowStyles.timelineHeader}><strong>Product Lines</strong>{!['CLOSED_WON','CLOSED_LOST'].includes(selectedDeal.stage) && canOperateSelected && <button type="button" className={styles.secondaryButton} disabled={previewReadOnly || savingProductLines} onClick={() => void openProductLines(selectedDeal)}>Edit Products</button>}</div>
                {selectedDeal.productLines.map((item) => (
                  <article key={item.id} className={workflowStyles.timelineItem}>
                    <span className={styles.activityIcon}>{item.pointType === "SOFTWARE" ? "SW" : "HW"}</span>
                    <div><strong>{item.productName}</strong><p>{item.productCode} · {item.quantity} {item.unitLabel || "Unit"} · {money(item.lineValue, selectedDeal.currency)}</p></div>
                  </article>
                ))}
              </div>
            ) : <div className={styles.panel} style={{ padding: 12, marginTop: 10 }}><strong>No Product Lines</strong><p style={{ margin: "4px 0 0", color: "#667085", fontSize: 12 }}>Add Software and/or Hardware products so Deal value, Point and Commission can be calculated from actual items.</p></div>}
            {selectedDeal.pointRecognition && (
              <div className={styles.panel} style={{ padding: 12, marginTop: 10 }}>
                <strong>Point Recognition Snapshot</strong>
                <p style={{ margin: "6px 0 0", color: "#667085", fontSize: 12 }}>
                  {selectedDeal.pointRecognition.swPoints} SW Point · {selectedDeal.pointRecognition.hwPoints} HW Point · {new Intl.NumberFormat("en-US").format(selectedDeal.pointRecognition.amountLAK)} LAK Commission
                </p>
              </div>
            )}
            {qaDemoMode && !['CLOSED_WON','CLOSED_LOST'].includes(selectedDeal.stage) && (
              <div className={styles.panel} style={{ padding: 12, marginTop: 10 }}>
                <div className={styles.eyebrow}>QA EXTERNAL GATE SIMULATOR</div>
                <p style={{ margin: "5px 0 10px", color: "#667085", fontSize: 12 }}>Simulates future Quotation / Finance integration only inside QA Demo Data. Closed Won stays system-controlled.</p>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {!selectedDeal.quotationNumber && <button type="button" className={styles.secondaryButton} disabled={runningExternalGate} onClick={() => void runExternalGate("LINK_QUOTATION")}>1. Link Quotation</button>}
                  {selectedDeal.quotationNumber && !selectedDeal.quotationConfirmed && <button type="button" className={styles.secondaryButton} disabled={runningExternalGate} onClick={() => void runExternalGate("CONFIRM_QUOTATION")}>2. Confirm Quotation</button>}
                  {selectedDeal.quotationConfirmed && !selectedDeal.paymentSlipUploaded && <button type="button" className={styles.secondaryButton} disabled={runningExternalGate} onClick={() => void runExternalGate("UPLOAD_PAYMENT_SLIP")}>3. Upload Payment Slip</button>}
                  {selectedDeal.stage === "AWAITING_PAYMENT" && selectedDeal.paymentSlipUploaded && !selectedDeal.financePaymentConfirmed && <button type="button" className={styles.primaryButton} disabled={runningExternalGate} onClick={() => void runExternalGate("FINANCE_CONFIRM_INVOICE")}>4. Finance Confirm + Invoice</button>}
                </div>
              </div>
            )}
            {selectedDeal.lostReason && <Detail label={d.lostReason} value={selectedDeal.lostReason} wide />}
            <div className={workflowStyles.timelineSection}>
              <div className={workflowStyles.timelineHeader}><strong>Activity Timeline</strong>{canOperateSelected && !['CLOSED_WON','CLOSED_LOST'].includes(selectedDeal.stage) && <button type="button" className={styles.secondaryButton} disabled={previewReadOnly} onClick={() => setActivityTarget({ kind: "DEAL", id: selectedDeal.id, name: selectedDeal.storeName })}>+ Activity</button>}</div>
              {activities.filter((item) => item.dealCode === selectedDeal.id).length ? activities.filter((item) => item.dealCode === selectedDeal.id).map((item) => (
                <article key={item.id} className={workflowStyles.timelineItem}><span className={styles.activityIcon}>{activityGlyph(item.type)}</span><div><strong>{activityLabel(item.type)} · {activityPurposeLabel(item)}</strong><p>{localDateTime(item.scheduledAt)} · {prettyCode(item.status)}</p>{item.resultNote && <small>{item.resultNote}</small>}</div></article>
              )) : <div className={workflowStyles.emptyTimeline}>No Activity yet.</div>}
            </div>
          </aside>
        </div>
      )}

      {showNewLead && (
        <div className={styles.overlay} onMouseDown={() => !savingLead && setShowNewLead(false)}>
          <form className={styles.modal} onSubmit={createLead} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.drawerHeader}><div><span>{qaDemoMode ? "QA DEMO DATA" : "REAL DATA"}</span><h3>{c.createLead as string}</h3><p>{c.createLeadHint as string}</p></div><button type="button" disabled={savingLead} onClick={() => setShowNewLead(false)}>×</button></div>
            <div className={styles.formGrid}>
              <label className={styles.field}><span>{c.businessUnit as string} *</span><select name="businessUnit" defaultValue={businessUnit === "ALL" ? selectableBusinessUnits[0]?.code : businessUnit} required>{selectableBusinessUnits.map((item) => <option key={item.id} value={item.code}>{item.code}</option>)}</select></label>
              <Field label={`${c.store as string} *`} name="storeName" required />
              <Field label={`${c.contact as string} *`} name="primaryContact" required />
              <Field label={`${c.phone as string} *`} name="phone" required />
              <Field label={`${c.province as string} *`} name="province" required />
              <label className={styles.field}><span>{c.source as string} *</span><select name="source" value={newLeadSource} onChange={(event) => setNewLeadSource(event.target.value as LeadSource)}>{LEAD_SOURCES.map((source) => <option key={source} value={source}>{prettyCode(source)}</option>)}</select></label>
              {newLeadSource === "OTHER" && <Field label={`${c.sourceDetail as string} *`} name="sourceDetail" required />}
              <Field label={`${c.email as string} (${c.optional as string})`} name="email" type="email" />
              <Field label={`${c.whatsapp as string} (${c.optional as string})`} name="whatsapp" />
            </div>
            <div className={styles.modalFooter}><button type="button" className={styles.secondaryButton} disabled={savingLead} onClick={() => setShowNewLead(false)}>{c.cancel as string}</button><button type="submit" className={styles.primaryButton} disabled={savingLead}>{savingLead ? c.saving as string : c.saveLead as string}</button></div>
          </form>
        </div>
      )}

      {convertLead && (
        <div className={styles.overlay} onMouseDown={() => !savingDeal && setConvertLead(null)}>
          <form className={styles.modal} onSubmit={convertToDeal} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div><span>{convertLead.id}</span><h3>{d.convertTitle}</h3><p>Add the Software and Hardware this customer plans to buy. You can keep adding Products; Deal value is calculated from Product Lines.</p></div>
              <button type="button" disabled={savingDeal} onClick={() => setConvertLead(null)}>×</button>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {convertProductLineDraft.length ? convertProductLineDraft.map((item, index) => (
                <div key={`${item.productCode}-${index}`} className={styles.panel} style={{ padding: 12 }}>
                  <div className={styles.formGrid}>
                    <label className={styles.field}>
                      <span>Product *</span>
                      <select value={item.productCode} onChange={(event) => {
                        const option = convertProductOptions.find((candidate) => candidate.productCode === event.target.value);
                        if (!option) return;
                        updateConvertProductLine(index, productDraftFromOption(option));
                      }}>
                        {convertProductOptions.filter((option) => option.status === "ACTIVE" && (option.productCode === item.productCode || !convertProductLineDraft.some((line, lineIndex) => lineIndex !== index && line.productCode === option.productCode))).map((option) => (
                          <option key={option.productCode} value={option.productCode}>{option.productName} · {option.productCode} · {option.pointType === "SOFTWARE" ? "SW" : "HW"}</option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span>Quantity *</span>
                      <input type="number" min="1" step="1" value={item.quantity} onChange={(event) => updateConvertProductLine(index, { quantity: Math.max(1, Math.trunc(Number(event.target.value || 1))) })} />
                    </label>
                    <label className={styles.field}>
                      <span>Unit Price ({convertCurrency})</span>
                      <input type="number" min="0" value={item.unitPrice} onChange={(event) => updateConvertProductLine(index, { unitPrice: Math.max(0, Number(event.target.value || 0)) })} />
                    </label>
                    <div className={styles.field}>
                      <span>Product Type</span>
                      <strong style={{ minHeight: 40, display: "flex", alignItems: "center", color: "#344054" }}>{item.pointType === "SOFTWARE" ? "Software" : "Hardware"} · {item.unitLabel || "Unit"}</strong>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <small style={{ color: "#667085" }}>{item.inventoryManaged ? "Inventory-managed product (future Inventory integration)" : "Non-inventory product"} · Line Total {money(Number(item.quantity || 0) * Number(item.unitPrice || 0), convertCurrency)}</small>
                    <button type="button" className={styles.linkButton} onClick={() => setConvertProductLineDraft((items) => items.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
                  </div>
                </div>
              )) : <div className={styles.panel} style={{ padding: 14, color: "#667085" }}>No Product selected yet. Add at least one Product to create the Deal.</div>}

              <button type="button" className={styles.secondaryButton} disabled={convertProductLineDraft.length >= convertProductOptions.filter((option) => option.status === "ACTIVE").length} onClick={addConvertProductLine}>+ Add Product</button>

              <div className={styles.panel} style={{ padding: 12 }}>
                <strong>Deal Summary</strong>
                <div style={{ marginTop: 8, display: "grid", gap: 5, color: "#667085", fontSize: 12 }}>
                  <span>Software: {money(convertTotals.software, convertCurrency)}</span>
                  <span>Hardware: {money(convertTotals.hardware, convertCurrency)}</span>
                  <b style={{ color: "#101828" }}>Deal Total: {money(convertTotals.total, convertCurrency)}</b>
                </div>
              </div>
            </div>

            <div className={styles.formGrid} style={{ marginTop: 12 }}>
              <label className={styles.field}><span>{d.currency}</span><select value={convertCurrency} onChange={(event) => setConvertCurrency(event.target.value as DealCurrency)}><option value="LAK">LAK</option><option value="USD">USD</option><option value="THB">THB</option></select></label>
              <Field label={`${d.expectedClose} (${c.optional as string})`} name="expectedCloseDate" type="date" />
              <Field label={`Product / Commercial Note (${c.optional as string})`} name="productNote" />
            </div>
            <div className={styles.modalFooter}><button type="button" className={styles.secondaryButton} disabled={savingDeal} onClick={() => setConvertLead(null)}>{c.cancel as string}</button><button type="submit" className={styles.primaryButton} disabled={savingDeal || !convertProductLineDraft.length}>{savingDeal ? c.saving as string : d.createDeal}</button></div>
          </form>
        </div>
      )}

      {editDeal && (
        <div className={styles.overlay} onMouseDown={() => !savingDeal && setEditDeal(null)}>
          <form className={styles.modal} onSubmit={saveDealCommercial} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.drawerHeader}><div><span>{editDeal.id}</span><h3>Edit Deal</h3><p>Product quantities and prices are edited separately in Product Lines so Deal totals stay derived from actual items.</p></div><button type="button" disabled={savingDeal} onClick={() => setEditDeal(null)}>×</button></div>
            <div className={styles.formGrid}>
              <label className={styles.field}><span>{d.currency}</span><select name="currency" defaultValue={editDeal.currency}><option value="LAK">LAK</option><option value="USD">USD</option><option value="THB">THB</option></select></label>
              <label className={styles.field}><span>{d.expectedClose}</span><input name="expectedCloseDate" type="date" defaultValue={editDeal.expectedCloseDate || ""} /></label>
              <label className={`${styles.field} ${styles.detailWide}`}><span>Product / Commercial Note</span><input name="productNote" defaultValue={editDeal.productNote || ""} /></label>
            </div>
            <div className={styles.panel} style={{ padding: 12, marginTop: 12 }}>
              <strong>Derived Commercial Value</strong>
              <p style={{ margin: "5px 0 0", color: "#667085", fontSize: 12 }}>Software {money(editDeal.softwareValue || 0, editDeal.currency)} · Hardware {money(editDeal.hardwareValue || 0, editDeal.currency)} · Total {money(editDeal.value || 0, editDeal.currency)}</p>
            </div>
            <div className={styles.modalFooter}><button type="button" className={styles.secondaryButton} onClick={() => setEditDeal(null)}>Cancel</button><button type="submit" className={styles.primaryButton} disabled={savingDeal}>{savingDeal ? "Saving..." : "Save Deal"}</button></div>
          </form>
        </div>
      )}

      {productLineDeal && (
        <div className={styles.overlay} onMouseDown={() => !savingProductLines && setProductLineDeal(null)}>
          <div className={styles.modal} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <span>PRODUCT SELECTOR</span>
                <h3>Deal Product Lines</h3>
                <p>{productLineDeal.storeName} · Add, change quantity/price, or remove Software and Hardware. Product is selected from the controlled source.</p>
              </div>
              <button type="button" disabled={savingProductLines} onClick={() => setProductLineDeal(null)}>×</button>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {productLineDraft.length ? productLineDraft.map((item, index) => (
                <div key={`${item.productCode}-${index}`} className={styles.panel} style={{ padding: 12 }}>
                  <div className={styles.formGrid}>
                    <label className={styles.field}>
                      <span>Product *</span>
                      <select value={item.productCode} onChange={(event) => {
                        const option = productLineOptions.find((candidate) => candidate.productCode === event.target.value);
                        if (!option) return;
                        updateProductLine(index, productDraftFromOption(option));
                      }}>
                        {productLineOptions.filter((option) => option.status === "ACTIVE" && (option.productCode === item.productCode || !productLineDraft.some((line, lineIndex) => lineIndex !== index && line.productCode === option.productCode))).map((option) => (
                          <option key={option.productCode} value={option.productCode}>{option.productName} · {option.productCode} · {option.pointType === "SOFTWARE" ? "SW" : "HW"}</option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span>Quantity *</span>
                      <input type="number" min="1" step="1" value={item.quantity} onChange={(event) => updateProductLine(index, { quantity: Math.max(1, Math.trunc(Number(event.target.value || 1))) })} />
                    </label>
                    <label className={styles.field}>
                      <span>Unit Price ({productLineDeal.currency})</span>
                      <input type="number" min="0" value={item.unitPrice} onChange={(event) => updateProductLine(index, { unitPrice: Math.max(0, Number(event.target.value || 0)) })} />
                    </label>
                    <div className={styles.field}>
                      <span>Product Type</span>
                      <strong style={{ minHeight: 40, display: "flex", alignItems: "center", color: "#344054" }}>{item.pointType === "SOFTWARE" ? "Software" : "Hardware"} · {item.unitLabel || "Unit"}</strong>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <small style={{ color: "#667085" }}>{item.inventoryManaged ? "Inventory-managed product (future Inventory integration)" : "Non-inventory product"} · Line Total {money(Number(item.quantity || 0) * Number(item.unitPrice || 0), productLineDeal.currency)}</small>
                    <button type="button" className={styles.linkButton} onClick={() => setProductLineDraft((items) => items.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
                  </div>
                </div>
              )) : <div className={styles.panel} style={{ padding: 14, color: "#667085" }}>No Product Lines yet. A Deal must have at least one Product before saving.</div>}
              <button type="button" className={styles.secondaryButton} disabled={productLineDraft.length >= productLineOptions.filter((option) => option.status === "ACTIVE").length} onClick={addProductLine}>+ Add Product</button>
              <div className={styles.panel} style={{ padding: 12 }}>
                <strong>Deal Summary</strong>
                <div style={{ marginTop: 8, display: "grid", gap: 5, color: "#667085", fontSize: 12 }}>
                  <span>Software: {money(productEditTotals.software, productLineDeal.currency)}</span>
                  <span>Hardware: {money(productEditTotals.hardware, productLineDeal.currency)}</span>
                  <b style={{ color: "#101828" }}>Deal Total: {money(productEditTotals.total, productLineDeal.currency)}</b>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryButton} disabled={savingProductLines} onClick={() => setProductLineDeal(null)}>Cancel</button>
              <button type="button" className={styles.primaryButton} disabled={savingProductLines || !productLineDraft.length} onClick={() => void saveProductLines()}>{savingProductLines ? "Saving..." : "Save Product Lines"}</button>
            </div>
          </div>
        </div>
      )}

      {stageDeal && (
        <div className={styles.overlay} onMouseDown={() => !savingDeal && setStageDeal(null)}>
          <form className={styles.modal} onSubmit={changeDealStage} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.drawerHeader}><div><span>{stageDeal.id}</span><h3>{d.changeStage}</h3><p>{stageDeal.storeName}</p></div><button type="button" disabled={savingDeal} onClick={() => setStageDeal(null)}>×</button></div>
            <div className={styles.formGrid}>
              <label className={styles.field}><span>{d.stage} *</span><select value={dealNextStage} onChange={(event) => setDealNextStage(event.target.value as DealStage)}>{PIPELINE_STAGES.filter((stage) => stage !== "CLOSED_WON").map((stage) => <option key={stage} value={stage}>{prettyCode(stage)}</option>)}</select></label>
              {dealNextStage === "CLOSED_LOST" && <Field label={`${d.lostReason} *`} name="lostReason" required />}
            </div>
            {dealNextStage === "QUOTATION" && <p style={{ color: "#b54708", fontSize: 12 }}>{d.quotationGate}</p>}
            {dealNextStage === "AWAITING_PAYMENT" && <p style={{ color: "#b54708", fontSize: 12 }}>{d.awaitingPaymentGate}</p>}
            <div className={styles.modalFooter}><button type="button" className={styles.secondaryButton} disabled={savingDeal} onClick={() => setStageDeal(null)}>{c.cancel as string}</button><button type="submit" className={styles.primaryButton} disabled={savingDeal}>{savingDeal ? c.saving as string : d.saveStage}</button></div>
          </form>
        </div>
      )}

      {activityTarget && (
        <div className={styles.overlay} onMouseDown={() => !savingActivity && setActivityTarget(null)}>
          <form className={styles.modal} onSubmit={scheduleActivity} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.drawerHeader}><div><span>REAL ACTIVITY · {activityTarget.kind}</span><h3>{c.createActivity as string}</h3><p>{activityTarget.name} · {activityTarget.id}</p></div><button type="button" disabled={savingActivity} onClick={() => setActivityTarget(null)}>×</button></div>
            <div className={styles.formGrid}>
              <label className={styles.field}><span>{c.type as string} *</span><select name="type" value={scheduleActivityType} onChange={(event) => { const nextType = event.target.value as ActivityType; setScheduleActivityType(nextType); setSchedulePurpose(ACTIVITY_PURPOSES[nextType][0]); }}>{ACTIVITY_TYPES.map((type) => <option key={type} value={type}>{activityLabel(type)}</option>)}</select></label>
              <label className={styles.field}><span>{c.purpose as string} *</span><select name="purposeCode" value={schedulePurpose} onChange={(event) => setSchedulePurpose(event.target.value)}>{ACTIVITY_PURPOSES[scheduleActivityType].map((purpose) => <option key={purpose} value={purpose}>{prettyCode(purpose)}</option>)}</select></label>
              {schedulePurpose === "OTHER" && <Field label={`${c.specifyPurpose as string} *`} name="purposeDetail" required />}
              <Field label={`${c.schedule as string} *`} name="scheduledAt" type="datetime-local" required />
              <Field label={`${c.note as string} (${c.optional as string})`} name="note" />
            </div>
            <div className={styles.modalFooter}><button type="button" className={styles.secondaryButton} disabled={savingActivity} onClick={() => setActivityTarget(null)}>{c.cancel as string}</button><button type="submit" className={styles.primaryButton} disabled={savingActivity}>{savingActivity ? c.saving as string : c.createActivity as string}</button></div>
          </form>
        </div>
      )}

      {activityAction?.mode === "complete" && (
        <div className={styles.overlay} onMouseDown={() => !savingActivity && setActivityAction(null)}>
          <form className={styles.modal} onSubmit={completeActivity} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.drawerHeader}><div><span>{activityAction.activity.id}</span><h3>{c.completeActivity as string}</h3><p>{c.completeHint as string}</p></div><button type="button" disabled={savingActivity} onClick={() => setActivityAction(null)}>×</button></div>
            <div className={styles.formGrid}>
              <label className={styles.field}><span>{c.outcome as string} *</span><select name="outcome" required defaultValue={OUTCOMES[activityAction.activity.type][0]}>{OUTCOMES[activityAction.activity.type].map((outcome) => <option key={outcome} value={outcome}>{prettyCode(outcome)}</option>)}</select></label>
              <Field label={`${c.result as string} *`} name="resultNote" required />
              <label className={styles.field}><span>{c.scheduleNextAfter as string}</span><input type="checkbox" checked={completeNext} onChange={(event) => setCompleteNext(event.target.checked)} /></label>
              {completeNext && <>
                <label className={styles.field}><span>{c.nextType as string} *</span><select name="nextType" value={nextActivityType} onChange={(event) => { const nextType = event.target.value as ActivityType; setNextActivityType(nextType); setNextPurpose(ACTIVITY_PURPOSES[nextType][0]); }}>{ACTIVITY_TYPES.map((type) => <option key={type} value={type}>{activityLabel(type)}</option>)}</select></label>
                <label className={styles.field}><span>{c.nextPurpose as string} *</span><select name="nextPurposeCode" value={nextPurpose} onChange={(event) => setNextPurpose(event.target.value)}>{ACTIVITY_PURPOSES[nextActivityType].map((purpose) => <option key={purpose} value={purpose}>{prettyCode(purpose)}</option>)}</select></label>
                {nextPurpose === "OTHER" && <Field label={`${c.nextSpecifyPurpose as string} *`} name="nextPurposeDetail" required />}
                <Field label={`${c.nextSchedule as string} *`} name="nextScheduledAt" type="datetime-local" required />
                <Field label={`Next Activity Note (${c.optional as string})`} name="nextNote" />
              </>}
              {activityAction.activity.relatedType === "DEAL" && <>
                <label className={styles.field}><span>Update Deal Stage</span><input type="checkbox" checked={completeUpdateStage} onChange={(event) => {
                  const checked = event.target.checked;
                  setCompleteUpdateStage(checked);
                  const current = deals.find((deal) => deal.id === activityAction.activity.dealCode);
                  if (checked && current) setCompleteDealStage(current.stage === "NEW_DEAL" ? "DEMO" : current.stage);
                }} /></label>
                {completeUpdateStage && <>
                  <label className={styles.field}><span>New Deal Stage *</span><select value={completeDealStage} onChange={(event) => setCompleteDealStage(event.target.value as DealStage)}>{PIPELINE_STAGES.filter((stage) => stage !== "CLOSED_WON").map((stage) => <option key={stage} value={stage}>{prettyCode(stage)}</option>)}</select></label>
                  {completeDealStage === "CLOSED_LOST" ? <Field label="Lost Reason *" name="lostReason" required /> : <Field label={`Stage Note (${c.optional as string})`} name="stageReason" />}
                </>}
              </>}
            </div>
            <div className={styles.modalFooter}><button type="button" className={styles.secondaryButton} onClick={() => setActivityAction(null)}>{c.cancel as string}</button><button type="submit" className={styles.primaryButton} disabled={savingActivity}>{savingActivity ? c.saving as string : c.saveComplete as string}</button></div>
          </form>
        </div>
      )}

      {activityAction?.mode === "reschedule" && (
        <div className={styles.overlay} onMouseDown={() => !savingActivity && setActivityAction(null)}>
          <form className={styles.modal} onSubmit={rescheduleActivity} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.drawerHeader}><div><span>{activityAction.activity.id}</span><h3>{c.rescheduleActivity as string}</h3><p>{c.rescheduleHint as string}</p></div><button type="button" disabled={savingActivity} onClick={() => setActivityAction(null)}>×</button></div>
            <div className={styles.formGrid}><Field label={`${c.newSchedule as string} *`} name="scheduledAt" type="datetime-local" required /><Field label={`${c.rescheduleReason as string} *`} name="reason" required /></div>
            <div className={styles.modalFooter}><button type="button" className={styles.secondaryButton} onClick={() => setActivityAction(null)}>{c.cancel as string}</button><button type="submit" className={styles.primaryButton} disabled={savingActivity}>{savingActivity ? c.saving as string : c.saveSchedule as string}</button></div>
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

function ActivityButtons({ activity, c, onAction, disabled = false }: { activity: CRMActivity; c: Record<string, unknown>; onAction: (value: { mode: "complete" | "reschedule"; activity: CRMActivity }) => void; disabled?: boolean }) {
  if (["COMPLETED", "CANCELLED"].includes(activity.status)) return <span className={styles.leadStatus}>{prettyCode(activity.status)}</span>;
  return <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button type="button" className={styles.secondaryButton} disabled={disabled} onClick={() => onAction({ mode: "complete", activity })}>{c.complete as string}</button><button type="button" className={styles.secondaryButton} disabled={disabled} onClick={() => onAction({ mode: "reschedule", activity })}>{c.reschedule as string}</button></div>;
}

function activityPurposeLabel(activity: CRMActivity) {
  if (activity.purposeCode === "OTHER") return activity.purposeDetail || activity.subject;
  return activity.purposeCode ? prettyCode(activity.purposeCode) : activity.subject;
}

function activityLabel(type: ActivityType) {
  return type === "PAYMENT" ? "Payment Follow-up" : prettyCode(type);
}

function activityGlyph(type: ActivityType) {
  const glyphs: Record<ActivityType, string> = { CALL: "☎", VISIT: "↗", MEETING: "◎", DEMO: "▣", FOLLOW_UP: "↻", QUOTATION: "Q", CONTRACT: "C", PAYMENT: "$" };
  return glyphs[type];
}
