import type {
  ActivityType,
  CRMBusinessUnit,
  CRMAccessProfile,
  CRMActivity,
  CRMActivityCompletePayload,
  CRMActivityCreatePayload,
  CRMActivityReschedulePayload,
  CRMBUSettingsSnapshot,
  CRMCommissionPlanSetting,
  CRMCommissionSummary,
  CRMDeal,
  CRMDealConvertPayload,
  CRMDealProductLine,
  CRMDealStagePayload,
  CRMDealUpdatePayload,
  CRMLead,
  CRMLeadAssignmentPayload,
  CRMLeadCreatePayload,
  CRMPerformance,
  CRMPointRecognition,
  CRMProductMasterPayload,
  CRMCustomerMaster,
  CRMCustomerMasterPayload,
  CRMCustomerDealCreatePayload,
  CRMProductOption,
  CRMSalesPointTarget,
  CRMDataMode,
  DealCurrency,
  DealStage,
} from "./crm.types";

const MODE_KEY = "qbms.crm.qa.data-mode.v290";
const STORE_KEY = "qbms.crm.qa.demo-store.v290";
const STORE_VERSION = 3;

export const CRM_QA_DEMO_AVAILABLE = process.env.NODE_ENV !== "production";

export type CRMQAScope = "AUTO" | "SELF" | "TEAM" | "BU" | "SHARED";
export type CRMQAExternalGateAction = "LINK_QUOTATION" | "CONFIRM_QUOTATION" | "UPLOAD_PAYMENT_SLIP" | "FINANCE_CONFIRM_INVOICE";

type DemoState = {
  version: number;
  currentUserId: string;
  businessUnits: CRMBusinessUnit[];
  access: CRMAccessProfile;
  settings: Record<string, CRMBUSettingsSnapshot>;
  leads: CRMLead[];
  deals: CRMDeal[];
  activities: CRMActivity[];
  counters: { lead: number; deal: number; activity: number; quotation: number; invoice: number; line: number };
  updatedAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

function currentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

function dateOnly(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function atTime(offsetDays: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function productOptions() {
  return [
    { productCode: "PRD-0001", productName: "QPOS Handheld", category: "POS Software", pointType: "SOFTWARE" as const, unitLabel: "License / Year", inventoryManaged: false, defaultUnitPrice: 3000000, currency: "LAK" as const, source: "PRODUCT_MASTER" as const, status: "ACTIVE" as const },
    { productCode: "PRD-0002", productName: "QPOS QSR", category: "POS Software", pointType: "SOFTWARE" as const, unitLabel: "License / Year", inventoryManaged: false, defaultUnitPrice: 5000000, currency: "LAK" as const, source: "PRODUCT_MASTER" as const, status: "ACTIVE" as const },
    { productCode: "PRD-0003", productName: "QPOS FSR", category: "POS Software", pointType: "SOFTWARE" as const, unitLabel: "License / Year", inventoryManaged: false, defaultUnitPrice: 7000000, currency: "LAK" as const, source: "PRODUCT_MASTER" as const, status: "ACTIVE" as const },
    { productCode: "PRD-0004", productName: "QPOS Buffet", category: "POS Software", pointType: "SOFTWARE" as const, unitLabel: "License / Year", inventoryManaged: false, defaultUnitPrice: 9000000, currency: "LAK" as const, source: "PRODUCT_MASTER" as const, status: "ACTIVE" as const },
    { productCode: "PRD-0005", productName: "SUNMI P2", category: "POS Hardware", pointType: "HARDWARE" as const, unitLabel: "Unit", inventoryManaged: true, defaultUnitPrice: 5500000, currency: "LAK" as const, source: "PRODUCT_MASTER" as const, status: "ACTIVE" as const },
    { productCode: "PRD-0006", productName: "SUNMI V3E", category: "POS Hardware", pointType: "HARDWARE" as const, unitLabel: "Unit", inventoryManaged: true, defaultUnitPrice: 6900000, currency: "LAK" as const, source: "PRODUCT_MASTER" as const, status: "ACTIVE" as const },
    { productCode: "PRD-0007", productName: "SUNMI D3 Single Screen", category: "POS Hardware", pointType: "HARDWARE" as const, unitLabel: "Unit", inventoryManaged: true, defaultUnitPrice: 12900000, currency: "LAK" as const, source: "PRODUCT_MASTER" as const, status: "ACTIVE" as const },
    { productCode: "PRD-0008", productName: "SUNMI D3 Dual Screen", category: "POS Hardware", pointType: "HARDWARE" as const, unitLabel: "Unit", inventoryManaged: true, defaultUnitPrice: 14900000, currency: "LAK" as const, source: "PRODUCT_MASTER" as const, status: "ACTIVE" as const },
    { productCode: "PRD-0009", productName: "Printer XP-80T", category: "Peripheral", pointType: "HARDWARE" as const, unitLabel: "Unit", inventoryManaged: true, defaultUnitPrice: 1590000, currency: "LAK" as const, source: "PRODUCT_MASTER" as const, status: "ACTIVE" as const },
    { productCode: "PRD-0010", productName: "Cash Drawer LB-405", category: "Peripheral", pointType: "HARDWARE" as const, unitLabel: "Unit", inventoryManaged: true, defaultUnitPrice: 1290000, currency: "LAK" as const, source: "PRODUCT_MASTER" as const, status: "ACTIVE" as const },
  ];
}

function commissionPlan(): CRMCommissionPlanSetting {
  return {
    id: "qa-plan-qpos",
    scopeType: "BU",
    name: "QPOS Standard Point Commission",
    modelType: "FINAL_MONTHLY_TIER",
    hardwareLAKPerPoint: 25000,
    status: "OPEN",
    ruleSource: "QA_DEMO",
    sourcePeriod: currentPeriod(),
    locked: false,
    tiers: [
      { tierCode: "BASE", name: "Base", minSWPoints: 0, maxSWPoints: 29, lakPerSWPoint: 100000, position: 1 },
      { tierCode: "TIER_1", name: "Tier 1", minSWPoints: 30, maxSWPoints: 35, lakPerSWPoint: 130000, position: 2 },
      { tierCode: "TIER_2", name: "Tier 2", minSWPoints: 36, maxSWPoints: 44, lakPerSWPoint: 150000, position: 3 },
      { tierCode: "TIER_3", name: "Tier 3", minSWPoints: 45, maxSWPoints: 59, lakPerSWPoint: 180000, position: 4 },
      { tierCode: "TIER_4", name: "Tier 4", minSWPoints: 60, maxSWPoints: null, lakPerSWPoint: 200000, position: 5 },
    ],
  };
}

function qposSettings(): CRMBUSettingsSnapshot {
  const period = currentPeriod();
  return {
    businessUnit: { id: "qa-bu-qpos", code: "QPOS", name: "QPOS", status: "ACTIVE" },
    period,
    periodLocked: false,
    general: { status: "ACTIVE", currency: "LAK", timezone: "Asia/Vientiane", defaultSWPointTarget: 30 },
    users: [
      { id: "qa-sales-01", email: "sales01@iquritech.com", employeeCode: "QA-S01", name: "Sales 01" },
      { id: "qa-sales-02", email: "sales02@iquritech.com", employeeCode: "QA-S02", name: "Sales 02" },
      { id: "qa-sales-03", email: "sales03@iquritech.com", employeeCode: "QA-S03", name: "Sales 03" },
      { id: "qa-ops-01", email: "salesops@iquritech.com", employeeCode: "QA-OPS", name: "Sales Ops" },
    ],
    roles: [
      { code: "CRM_BU_ADMIN", name: "CRM BU Admin", accessLevel: 4, dataScope: "BU", capabilities: ["settings.view","settings.manage","members.manage","teams.manage","pipeline.manage","product.manage","customer.manage","points.manage","targets.manage","commission.manage","lead.shared.view","lead.assign","deal.shared.view","activity.shared.view","performance.team.view","commission.team.view"], isSystem: true },
      { code: "SALES_OPS", name: "Sales Ops", accessLevel: 3, dataScope: "BU", capabilities: ["settings.view","product.manage","customer.manage","points.manage","targets.manage","commission.manage","lead.shared.view","lead.assign","deal.shared.view","activity.shared.view","performance.team.view","commission.team.view"], isSystem: true },
      { code: "SALES_MANAGER", name: "Sales Manager", accessLevel: 3, dataScope: "TEAM", capabilities: ["lead.team.view","deal.team.view","activity.team.view","performance.team.view","commission.team.view"], isSystem: true },
      { code: "SALES", name: "Sales", accessLevel: 2, dataScope: "SELF", capabilities: ["lead.self.view","lead.self.manage","deal.self.view","deal.self.manage","activity.self.view","activity.self.manage","performance.self.view","commission.self.view"], isSystem: true },
      { code: "VIEWER", name: "Viewer", accessLevel: 1, dataScope: "BU", capabilities: ["lead.shared.view","deal.shared.view","activity.shared.view"], isSystem: true },
    ],
    members: [
      { id: "qa-m-01", userId: "qa-sales-01", name: "Sales 01", email: "sales01@iquritech.com", employeeCode: "QA-S01", status: "ACTIVE", effectiveFrom: dateOnly(-120), roleCodes: ["SALES","CRM_BU_ADMIN"], teamIds: ["qa-team-a"] },
      { id: "qa-m-02", userId: "qa-sales-02", name: "Sales 02", email: "sales02@iquritech.com", employeeCode: "QA-S02", status: "ACTIVE", effectiveFrom: dateOnly(-100), roleCodes: ["SALES"], teamIds: ["qa-team-a"] },
      { id: "qa-m-03", userId: "qa-sales-03", name: "Sales 03", email: "sales03@iquritech.com", employeeCode: "QA-S03", status: "ACTIVE", effectiveFrom: dateOnly(-90), roleCodes: ["SALES"], teamIds: ["qa-team-b"] },
      { id: "qa-m-04", userId: "qa-ops-01", name: "Sales Ops", email: "salesops@iquritech.com", employeeCode: "QA-OPS", status: "ACTIVE", effectiveFrom: dateOnly(-150), roleCodes: ["SALES_OPS"], teamIds: [] },
    ],
    teams: [
      { id: "qa-team-a", teamCode: "TEAM_A", name: "Sales Team A", managerUserId: "qa-sales-01", managerName: "Sales 01", status: "ACTIVE", memberCount: 2 },
      { id: "qa-team-b", teamCode: "TEAM_B", name: "Sales Team B", managerUserId: "qa-sales-03", managerName: "Sales 03", status: "ACTIVE", memberCount: 1 },
    ],
    pipelineStages: [
      { stageCode: "NEW_DEAL", label: "New Deal", position: 1, isEnabled: true, isSystemControlled: false },
      { stageCode: "DEMO", label: "Demo", position: 2, isEnabled: true, isSystemControlled: false },
      { stageCode: "QUOTATION", label: "Quotation", position: 3, isEnabled: true, isSystemControlled: false },
      { stageCode: "NEGOTIATION", label: "Negotiation", position: 4, isEnabled: true, isSystemControlled: false },
      { stageCode: "CONTRACT", label: "Contract", position: 5, isEnabled: true, isSystemControlled: false },
      { stageCode: "AWAITING_PAYMENT", label: "Awaiting Payment", position: 6, isEnabled: true, isSystemControlled: false },
      { stageCode: "CLOSED_WON", label: "Closed Won", position: 7, isEnabled: true, isSystemControlled: true },
      { stageCode: "CLOSED_LOST", label: "Closed Lost", position: 8, isEnabled: true, isSystemControlled: false },
    ],
    productOptions: productOptions(),
    customerMaster: [
      { id: "qa-customer-1", customerCode: "CUS-00001", displayName: "Existing QA Customer", legalCompanyName: "Existing QA Customer Co., Ltd.", customerType: "BUSINESS", primaryContact: "Ms. Customer", phone: "020 5000 0001", email: "customer@example.com", province: "Vientiane Capital", status: "ACTIVE", dealCount: 1, wonDealCount: 1, wonValueLAK: 5000000 },
    ],
    pointRules: productOptions().map((item, index) => ({
      id: `qa-point-${index + 1}`,
      productCode: item.productCode,
      productName: item.productName,
      pointType: item.pointType,
      unitLabel: item.unitLabel,
      pointsPerUnit: 0,
      locked: false,
    })),
    targets: [
      { id: "qa-target-bu", targetSWPoints: 30, targetRevenue: 0, currency: "LAK", locked: false },
      { id: "qa-target-s01", ownerUserId: "qa-sales-01", ownerName: "Sales 01", targetSWPoints: 30, targetRevenue: 0, currency: "LAK", locked: false },
      { id: "qa-target-s02", ownerUserId: "qa-sales-02", ownerName: "Sales 02", targetSWPoints: 30, targetRevenue: 0, currency: "LAK", locked: false },
      { id: "qa-target-s03", ownerUserId: "qa-sales-03", ownerName: "Sales 03", targetSWPoints: 30, targetRevenue: 0, currency: "LAK", locked: false },
    ],
    commissionPlans: [commissionPlan()],
  };
}

function line(id: string, productCode: string, productName: string, pointType: "SOFTWARE" | "HARDWARE", quantity: number, unitPrice: number, inventoryManaged: boolean): CRMDealProductLine {
  return { id, productCode, productName, pointType, quantity, unitPrice, lineValue: quantity * unitPrice, inventoryManaged, unitLabel: pointType === "SOFTWARE" ? "License / Year" : "Unit" };
}

function seedState(): DemoState {
  const qpos = qposSettings();
  const businessUnits: CRMBusinessUnit[] = [qpos.businessUnit];
  const access: CRMAccessProfile = {
    userId: "qa-sales-01",
    isSuperAdmin: false,
    canViewSettings: true,
    memberships: [{
      membershipId: "qa-m-01",
      businessUnitId: qpos.businessUnit.id,
      businessUnit: "QPOS",
      businessUnitName: "QPOS",
      status: "ACTIVE",
      effectiveFrom: dateOnly(-120),
      roles: [{
        code: "CRM_BU_ADMIN", name: "CRM BU Admin", accessLevel: 4, dataScope: "BU",
        capabilities: ["settings.view","settings.manage","members.manage","teams.manage","pipeline.manage","product.manage","points.manage","targets.manage","commission.manage","lead.shared.view","lead.assign","deal.shared.view","activity.shared.view","performance.team.view","commission.team.view"],
      }],
    }],
  };

  const leads: CRMLead[] = [
    { id: "LEAD-QA-001", storeName: "Mekong Cafe", primaryContact: "Ms. A", phone: "020 5551 0001", province: "Vientiane Capital", source: "EVENT", sourceDetail: "QPOS Demo Day", businessUnit: "QPOS", businessUnitName: "QPOS", owner: "Sales 01", ownerUserId: "qa-sales-01", status: "FOLLOW_UP", nextActivity: "DEMO", nextActivityAt: atTime(0, 15, 0), createdAt: atTime(-4, 9), updatedAt: nowIso() },
    { id: "LEAD-QA-002", storeName: "Kham Bakery", primaryContact: "Mr. B", phone: "020 5551 0002", province: "Vientiane Capital", source: "FACEBOOK", businessUnit: "QPOS", businessUnitName: "QPOS", owner: "Sales 01", ownerUserId: "qa-sales-01", status: "NEW", createdAt: atTime(-1, 11), updatedAt: nowIso() },
    { id: "LEAD-QA-003", storeName: "Naga Noodle", primaryContact: "Ms. C", phone: "020 5551 0003", province: "Vientiane Capital", source: "REFERRAL", businessUnit: "QPOS", businessUnitName: "QPOS", owner: "Sales 02", ownerUserId: "qa-sales-02", status: "CONTACTED", nextActivity: "FOLLOW_UP", nextActivityAt: atTime(-1, 10), createdAt: atTime(-8, 8), updatedAt: nowIso() },
    { id: "LEAD-QA-004", storeName: "River Mart", primaryContact: "Mr. D", phone: "020 5551 0004", province: "Savannakhet", source: "IMPORT", businessUnit: "QPOS", businessUnitName: "QPOS", owner: "Unassigned", status: "UNASSIGNED", createdAt: atTime(-2, 14), updatedAt: nowIso() },
    { id: "LEAD-QA-005", storeName: "Lotus Grill", primaryContact: "Ms. E", phone: "020 5551 0005", province: "Champasak", source: "WEBSITE", businessUnit: "QPOS", businessUnitName: "QPOS", owner: "Sales 03", ownerUserId: "qa-sales-03", status: "FOLLOW_UP", nextActivity: "MEETING", nextActivityAt: atTime(1, 13), createdAt: atTime(-7, 10), updatedAt: nowIso() },
  ];

  const deals: CRMDeal[] = [
    { id: "DEAL-QA-001", sourceLeadCode: "LEAD-QA-101", storeName: "Morning Bean", primaryContact: "Mr. F", businessUnit: "QPOS", businessUnitName: "QPOS", owner: "Sales 01", ownerUserId: "qa-sales-01", stage: "DEMO", value: 11900000, currency: "LAK", expectedCloseDate: dateOnly(10), packageCode: "QSR", licenseQuantity: 1, softwareValue: 5000000, hardwareValue: 6900000, productLines: [line("QA-LINE-001","PRD-0002","QPOS QSR","SOFTWARE",1,5000000,false), line("QA-LINE-002","PRD-0006","SUNMI V3E","HARDWARE",1,6900000,true)], nextActivity: "DEMO", nextActivityAt: atTime(0, 16), createdAt: atTime(-5, 10), updatedAt: nowIso() },
    { id: "DEAL-QA-002", sourceLeadCode: "LEAD-QA-102", storeName: "City Hotpot", primaryContact: "Ms. G", businessUnit: "QPOS", businessUnitName: "QPOS", owner: "Sales 02", ownerUserId: "qa-sales-02", stage: "QUOTATION", value: 19900000, currency: "LAK", expectedCloseDate: dateOnly(7), packageCode: "FSR", licenseQuantity: 1, softwareValue: 7000000, hardwareValue: 12900000, productLines: [line("QA-LINE-003","PRD-0003","QPOS FSR","SOFTWARE",1,7000000,false), line("QA-LINE-004","PRD-0007","SUNMI D3 Single Screen","HARDWARE",1,12900000,true)], quotationNumber: "QT-QA-0001", quotationConfirmed: false, nextActivity: "QUOTATION", nextActivityAt: atTime(1, 11), createdAt: atTime(-9, 9), updatedAt: nowIso() },
    { id: "DEAL-QA-003", sourceLeadCode: "LEAD-QA-103", storeName: "Green Bowl", primaryContact: "Mr. H", businessUnit: "QPOS", businessUnitName: "QPOS", owner: "Sales 03", ownerUserId: "qa-sales-03", stage: "NEGOTIATION", value: 23900000, currency: "LAK", expectedCloseDate: dateOnly(14), packageCode: "BUFFET", licenseQuantity: 1, softwareValue: 9000000, hardwareValue: 14900000, productLines: [line("QA-LINE-005","PRD-0004","QPOS Buffet","SOFTWARE",1,9000000,false), line("QA-LINE-006","PRD-0008","SUNMI D3 Dual Screen","HARDWARE",1,14900000,true)], quotationNumber: "QT-QA-0002", quotationConfirmed: true, nextActivity: "FOLLOW_UP", nextActivityAt: atTime(2, 10), createdAt: atTime(-12, 13), updatedAt: nowIso() },
  ];

  const activities: CRMActivity[] = [
    { id: "ACT-QA-001", type: "DEMO", subject: "PRODUCT_DEMO", purposeCode: "PRODUCT_DEMO", relatedName: "Mekong Cafe", relatedType: "LEAD", leadCode: "LEAD-QA-001", primaryContact: "Ms. A", businessUnit: "QPOS", businessUnitName: "QPOS", owner: "Sales 01", ownerUserId: "qa-sales-01", scheduledAt: atTime(0, 15), status: "SCHEDULED", bucket: "TODAY", createdAt: atTime(-1, 9), updatedAt: nowIso() },
    { id: "ACT-QA-002", type: "FOLLOW_UP", subject: "AFTER_CALL", purposeCode: "AFTER_CALL", relatedName: "Naga Noodle", relatedType: "LEAD", leadCode: "LEAD-QA-003", primaryContact: "Ms. C", businessUnit: "QPOS", businessUnitName: "QPOS", owner: "Sales 02", ownerUserId: "qa-sales-02", scheduledAt: atTime(-1, 10), status: "OVERDUE", bucket: "OVERDUE", createdAt: atTime(-3, 9), updatedAt: nowIso() },
    { id: "ACT-QA-003", type: "DEMO", subject: "QSR_DEMO", purposeCode: "QSR_DEMO", relatedName: "Morning Bean", relatedType: "DEAL", dealCode: "DEAL-QA-001", businessUnit: "QPOS", businessUnitName: "QPOS", owner: "Sales 01", ownerUserId: "qa-sales-01", scheduledAt: atTime(0, 16), status: "SCHEDULED", bucket: "TODAY", createdAt: atTime(-2, 11), updatedAt: nowIso() },
    { id: "ACT-QA-004", type: "QUOTATION", subject: "QUOTATION_FOLLOW_UP", purposeCode: "QUOTATION_FOLLOW_UP", relatedName: "City Hotpot", relatedType: "DEAL", dealCode: "DEAL-QA-002", businessUnit: "QPOS", businessUnitName: "QPOS", owner: "Sales 02", ownerUserId: "qa-sales-02", scheduledAt: atTime(1, 11), status: "SCHEDULED", createdAt: atTime(-2, 15), updatedAt: nowIso() },
  ];

  return {
    version: STORE_VERSION,
    currentUserId: "qa-sales-01",
    businessUnits,
    access,
    settings: { QPOS: qpos },
    leads,
    deals,
    activities,
    counters: { lead: 5, deal: 3, activity: 4, quotation: 2, invoice: 0, line: 6 },
    updatedAt: nowIso(),
  };
}

function readState(): DemoState {
  if (typeof window === "undefined") return seedState();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as DemoState;
    if (parsed?.version !== STORE_VERSION) return seedState();
    return parsed;
  } catch {
    return seedState();
  }
}

function writeState(state: DemoState) {
  state.updatedAt = nowIso();
  if (typeof window !== "undefined") window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function updateState(mutator: (state: DemoState) => void): DemoState {
  const state = readState();
  mutator(state);
  writeState(state);
  return state;
}

export function getCRMDataMode(): CRMDataMode {
  if (!CRM_QA_DEMO_AVAILABLE || typeof window === "undefined") return "REAL";
  return window.localStorage.getItem(MODE_KEY) === "QA_DEMO" ? "QA_DEMO" : "REAL";
}

export function setCRMDataMode(mode: CRMDataMode) {
  if (!CRM_QA_DEMO_AVAILABLE || typeof window === "undefined") return;
  window.localStorage.setItem(MODE_KEY, mode);
}

export function resetCRMQADemoData() {
  if (typeof window === "undefined") return;
  const fresh = seedState();
  writeState(fresh);
}

function memberForUser(state: DemoState, businessUnit: string, userId: string) {
  return state.settings[businessUnit]?.members.find((member) => member.userId === userId);
}

function ownerIdsForScope(state: DemoState, businessUnit: string, scope: CRMQAScope): string[] | null {
  if (scope === "BU" || scope === "SHARED") return null;
  if (scope === "SELF" || scope === "AUTO") return [state.currentUserId];
  if (scope === "TEAM") {
    const settings = state.settings[businessUnit];
    const actor = memberForUser(state, businessUnit, state.currentUserId);
    if (!settings || !actor?.teamIds.length) return [state.currentUserId];
    const teamIds = new Set(actor.teamIds);
    return settings.members.filter((member) => member.teamIds.some((id) => teamIds.has(id))).map((member) => member.userId);
  }
  return [state.currentUserId];
}

function filterScope<T extends { businessUnit: string; ownerUserId?: string }>(items: T[], businessUnit: string, scope: CRMQAScope) {
  const buItems = businessUnit === "ALL" ? items : items.filter((item) => item.businessUnit === businessUnit);
  if (businessUnit === "ALL" && (scope === "BU" || scope === "SHARED")) return clone(buItems);
  const effectiveBU = businessUnit === "ALL" ? "QPOS" : businessUnit;
  const owners = ownerIdsForScope(readState(), effectiveBU, scope);
  return clone(owners ? buItems.filter((item) => item.ownerUserId && owners.includes(item.ownerUserId)) : buItems);
}

export function demoBusinessUnits() {
  return clone(readState().businessUnits);
}

export function demoAccessProfile() {
  return clone(readState().access);
}

export function demoLeads(businessUnit: string, scope: CRMQAScope) {
  return filterScope(readState().leads, businessUnit, scope);
}

export function demoDeals(businessUnit: string, scope: CRMQAScope) {
  return filterScope(readState().deals, businessUnit, scope);
}

export function demoActivities(businessUnit: string, scope: CRMQAScope) {
  const state = readState();
  const items = state.activities.map((activity) => {
    if (["COMPLETED","CANCELLED"].includes(activity.status)) return activity;
    const overdue = new Date(activity.scheduledAt).getTime() < Date.now();
    return overdue ? { ...activity, status: "OVERDUE" as const, bucket: "OVERDUE" as const } : activity;
  });
  return filterScope(items, businessUnit, scope);
}

function nextCode(prefix: string, value: number) {
  return `${prefix}-${String(value).padStart(3, "0")}`;
}

function ownerName(state: DemoState, businessUnit: string, ownerUserId?: string) {
  if (!ownerUserId) return "Unassigned";
  return memberForUser(state, businessUnit, ownerUserId)?.name || `User ${ownerUserId}`;
}

export function demoCreateLead(payload: CRMLeadCreatePayload): CRMLead {
  let created!: CRMLead;
  updateState((state) => {
    const duplicates = state.leads.filter((lead) => lead.businessUnit === payload.businessUnitCode && lead.phone === payload.phone && !["LOST"].includes(lead.status));
    if (duplicates.length && !payload.allowDuplicate) {
      const error = new Error("A possible duplicate QA Lead already exists for this phone number.");
      (error as Error & { status?: number; code?: string; details?: unknown }).status = 409;
      (error as Error & { status?: number; code?: string; details?: unknown }).code = "CRM_LEAD_POSSIBLE_DUPLICATE";
      (error as Error & { status?: number; code?: string; details?: unknown }).details = { candidates: duplicates };
      throw error;
    }
    state.counters.lead += 1;
    const ownerUserId = payload.assignmentMode === "UNASSIGNED" ? undefined : state.currentUserId;
    created = {
      id: nextCode("LEAD-QA", state.counters.lead),
      storeName: payload.storeName,
      primaryContact: payload.primaryContact,
      phone: payload.phone,
      email: payload.email,
      whatsapp: payload.whatsapp,
      province: payload.province,
      source: payload.source,
      sourceDetail: payload.sourceDetail,
      businessUnit: payload.businessUnitCode,
      businessUnitName: payload.businessUnitCode,
      owner: ownerName(state, payload.businessUnitCode, ownerUserId),
      ownerUserId,
      status: ownerUserId ? "NEW" : "UNASSIGNED",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.leads.unshift(created);
  });
  return clone(created);
}

export function demoAssignLead(leadCode: string, payload: CRMLeadAssignmentPayload): CRMLead {
  let updated!: CRMLead;
  updateState((state) => {
    const lead = state.leads.find((item) => item.id === leadCode);
    if (!lead) throw new Error("QA Lead not found.");
    if (["CONVERTED","LOST"].includes(lead.status)) throw new Error("Closed or converted Lead cannot be reassigned.");
    lead.ownerUserId = payload.ownerUserId || undefined;
    lead.owner = ownerName(state, lead.businessUnit, lead.ownerUserId);
    lead.status = lead.ownerUserId ? (lead.status === "UNASSIGNED" ? "ASSIGNED" : lead.status) : "UNASSIGNED";
    lead.updatedAt = nowIso();
    updated = lead;
  });
  return clone(updated);
}

function buildDemoProductLines(state: DemoState, businessUnit: string, inputs: CRMDealConvertPayload["productLines"]): CRMDealProductLine[] {
  if (!Array.isArray(inputs) || !inputs.length) throw new Error("Add at least one Product before creating the Deal.");
  if (inputs.length > 100) throw new Error("A Deal can contain up to 100 Product Lines.");
  const settings = state.settings[businessUnit];
  if (!settings) throw new Error("QA Product Source not found for this Business Unit.");
  const seen = new Set<string>();
  return inputs.map((input) => {
    const productCode = String(input.productCode || "").trim().toUpperCase();
    if (!productCode) throw new Error("Product is required.");
    if (seen.has(productCode)) throw new Error(`Product ${productCode} is already in this Deal. Change quantity instead of adding it twice.`);
    seen.add(productCode);
    const product = settings.productOptions.find((item) => item.productCode === productCode && item.status === "ACTIVE");
    if (!product) throw new Error(`Product ${productCode} is not available in the controlled Product Source.`);
    const quantity = Math.max(1, Math.trunc(Number(input.quantity || 1)));
    const unitPrice = Math.max(0, Number(input.unitPrice || 0));
    state.counters.line += 1;
    return {
      id: `QA-LINE-${String(state.counters.line).padStart(3,"0")}`,
      productCode: product.productCode,
      productName: product.productName,
      pointType: product.pointType,
      unitLabel: product.unitLabel,
      inventoryManaged: product.inventoryManaged,
      quantity,
      unitPrice,
      lineValue: quantity * unitPrice,
    };
  });
}

function applyDemoDealTotals(deal: CRMDeal) {
  const lines = deal.productLines || [];
  deal.softwareValue = lines.filter((item) => item.pointType === "SOFTWARE").reduce((sum, item) => sum + item.lineValue, 0);
  deal.hardwareValue = lines.filter((item) => item.pointType === "HARDWARE").reduce((sum, item) => sum + item.lineValue, 0);
  deal.value = deal.softwareValue + deal.hardwareValue;
  deal.licenseQuantity = lines.filter((item) => item.pointType === "SOFTWARE").reduce((sum, item) => sum + item.quantity, 0) || 1;
}

export function demoConvertLeadToDeal(leadCode: string, payload: CRMDealConvertPayload): CRMDeal {
  let created!: CRMDeal;
  updateState((state) => {
    const lead = state.leads.find((item) => item.id === leadCode);
    if (!lead) throw new Error("QA Lead not found.");
    if (["CONVERTED","LOST"].includes(lead.status)) throw new Error("Lead cannot be converted.");
    const lines = buildDemoProductLines(state, lead.businessUnit, payload.productLines);
    state.counters.deal += 1;
    created = {
      id: nextCode("DEAL-QA", state.counters.deal),
      sourceLeadCode: lead.id,
      storeName: lead.storeName,
      primaryContact: lead.primaryContact,
      businessUnit: lead.businessUnit,
      businessUnitName: lead.businessUnitName,
      owner: lead.owner,
      ownerUserId: lead.ownerUserId || state.currentUserId,
      stage: "NEW_DEAL",
      value: 0,
      currency: payload.currency || "LAK",
      expectedCloseDate: payload.expectedCloseDate,
      licenseQuantity: 1,
      softwareValue: 0,
      hardwareValue: 0,
      productNote: payload.productNote,
      productLines: lines,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    applyDemoDealTotals(created);
    state.deals.unshift(created);
    lead.status = "CONVERTED";
    lead.nextActivity = undefined;
    lead.nextActivityAt = undefined;
    lead.updatedAt = nowIso();
    for (const activity of state.activities) {
      if (activity.leadCode === lead.id && !["COMPLETED","CANCELLED"].includes(activity.status)) {
        activity.relatedType = "DEAL";
        activity.leadCode = undefined;
        activity.dealCode = created.id;
        activity.updatedAt = nowIso();
      }
    }
    syncNextActivity(state, "DEAL", created.id);
  });
  return clone(created);
}

export function demoCreateCustomerDeal(businessUnit: string, customerCode: string, payload: CRMCustomerDealCreatePayload): CRMDeal {
  let created!: CRMDeal;
  updateState((state) => {
    const settings = state.settings[businessUnit];
    if (!settings) throw new Error("QA Business Unit not found.");
    const customer = settings.customerMaster.find((item) => item.customerCode === customerCode);
    if (!customer) throw new Error("QA Customer not found.");
    if (customer.status !== "ACTIVE") throw new Error("Inactive Customer cannot create a new Opportunity.");
    const lines = buildDemoProductLines(state, businessUnit, payload.productLines);
    state.counters.deal += 1;
    created = {
      id: nextCode("DEAL-QA", state.counters.deal),
      storeName: customer.displayName,
      primaryContact: customer.primaryContact,
      customerId: customer.id,
      customerCode: customer.customerCode,
      customerName: customer.displayName,
      customerLinkedAt: nowIso(),
      businessUnit,
      businessUnitName: settings.businessUnit.name,
      owner: ownerName(state, businessUnit, state.currentUserId),
      ownerUserId: state.currentUserId,
      stage: "NEW_DEAL",
      value: 0,
      currency: payload.currency || "LAK",
      expectedCloseDate: payload.expectedCloseDate,
      licenseQuantity: 1,
      softwareValue: 0,
      hardwareValue: 0,
      productNote: payload.productNote,
      productLines: lines,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    applyDemoDealTotals(created);
    state.deals.unshift(created);
    customer.dealCount = Number(customer.dealCount || 0) + 1;
  });
  return clone(created);
}

export function demoUpdateDeal(dealCode: string, payload: CRMDealUpdatePayload): CRMDeal {
  let updated!: CRMDeal;
  updateState((state) => {
    const deal = state.deals.find((item) => item.id === dealCode);
    if (!deal) throw new Error("QA Deal not found.");
    if (["CLOSED_WON","CLOSED_LOST"].includes(deal.stage)) throw new Error("Closed Deal cannot be edited.");
    deal.currency = payload.currency || deal.currency;
    deal.expectedCloseDate = payload.expectedCloseDate ?? deal.expectedCloseDate;
    deal.productNote = payload.productNote ?? deal.productNote;
    deal.updatedAt = nowIso();
    updated = deal;
  });
  return clone(updated);
}

export function demoSaveDealProductLines(dealCode: string, lines: Omit<CRMDealProductLine, "id" | "lineValue">[]): CRMDeal {
  let updated!: CRMDeal;
  updateState((state) => {
    const deal = state.deals.find((item) => item.id === dealCode);
    if (!deal) throw new Error("QA Deal not found.");
    if (["CLOSED_WON","CLOSED_LOST"].includes(deal.stage)) throw new Error("Closed Deal product lines are locked.");
    const inputs = lines.map((item) => ({ productCode: item.productCode, quantity: item.quantity, unitPrice: item.unitPrice }));
    deal.productLines = buildDemoProductLines(state, deal.businessUnit, inputs);
    applyDemoDealTotals(deal);
    deal.updatedAt = nowIso();
    updated = deal;
  });
  return clone(updated);
}

function assertDemoStageGate(deal: CRMDeal, stage: DealStage, payload: CRMDealStagePayload) {
  if (["CLOSED_WON","CLOSED_LOST"].includes(deal.stage)) throw new Error("Closed Deal cannot be moved.");
  if (stage === "CLOSED_WON") throw new Error("Closed Won is system controlled. Use QA Finance Gate in Demo Data Mode.");
  if (stage === "QUOTATION" && !deal.quotationNumber) throw new Error("QA Gate: link a Quotation before moving to Quotation.");
  if (stage === "AWAITING_PAYMENT" && (!deal.quotationNumber || !deal.quotationConfirmed)) throw new Error("QA Gate: confirm the Quotation before Awaiting Payment.");
  if (stage === "CLOSED_LOST" && !payload.lostReason?.trim()) throw new Error("Lost Reason is required.");
}

export function demoChangeDealStage(dealCode: string, payload: CRMDealStagePayload): CRMDeal {
  let updated!: CRMDeal;
  updateState((state) => {
    const deal = state.deals.find((item) => item.id === dealCode);
    if (!deal) throw new Error("QA Deal not found.");
    assertDemoStageGate(deal, payload.stage, payload);
    deal.stage = payload.stage;
    if (payload.stage === "CLOSED_LOST") {
      deal.lostReason = payload.lostReason;
      deal.closedLostAt = nowIso();
    }
    deal.updatedAt = nowIso();
    updated = deal;
  });
  return clone(updated);
}

function relatedRecord(state: DemoState, kind: "LEAD" | "DEAL", code: string) {
  if (kind === "LEAD") return state.leads.find((item) => item.id === code);
  return state.deals.find((item) => item.id === code);
}

function syncNextActivity(state: DemoState, kind: "LEAD" | "DEAL", code: string) {
  const record = relatedRecord(state, kind, code);
  if (!record) return;
  const active = state.activities
    .filter((item) => item.relatedType === kind && (kind === "LEAD" ? item.leadCode === code : item.dealCode === code) && !["COMPLETED","CANCELLED"].includes(item.status))
    .sort((a,b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
  record.nextActivity = active?.type;
  record.nextActivityAt = active?.scheduledAt;
  record.updatedAt = nowIso();
}

export function demoCreateActivity(kind: "LEAD" | "DEAL", code: string, payload: CRMActivityCreatePayload): CRMActivity {
  let created!: CRMActivity;
  updateState((state) => {
    const record = relatedRecord(state, kind, code);
    if (!record) throw new Error(`QA ${kind} not found.`);
    state.counters.activity += 1;
    created = {
      id: nextCode("ACT-QA", state.counters.activity),
      type: payload.type,
      subject: payload.purposeCode === "OTHER" ? payload.purposeDetail || "OTHER" : payload.purposeCode,
      purposeCode: payload.purposeCode,
      purposeDetail: payload.purposeDetail,
      relatedName: record.storeName,
      relatedType: kind,
      leadCode: kind === "LEAD" ? code : undefined,
      dealCode: kind === "DEAL" ? code : undefined,
      primaryContact: record.primaryContact,
      businessUnit: record.businessUnit,
      businessUnitName: record.businessUnitName,
      owner: record.owner,
      ownerUserId: record.ownerUserId,
      scheduledAt: payload.scheduledAt,
      status: "SCHEDULED",
      note: payload.note,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.activities.push(created);
    syncNextActivity(state, kind, code);
    if (kind === "LEAD" && "status" in record && ["NEW","ASSIGNED"].includes(record.status)) record.status = "FOLLOW_UP";
  });
  return clone(created);
}

export function demoCompleteActivity(activityCode: string, payload: CRMActivityCompletePayload): CRMActivity {
  let updated!: CRMActivity;
  updateState((state) => {
    const activity = state.activities.find((item) => item.id === activityCode);
    if (!activity) throw new Error("QA Activity not found.");
    if (["COMPLETED","CANCELLED"].includes(activity.status)) throw new Error("Activity is already closed.");
    activity.status = "COMPLETED";
    activity.outcome = payload.outcome;
    activity.resultNote = payload.resultNote;
    activity.completedAt = nowIso();
    activity.updatedAt = nowIso();
    if (payload.dealStage && activity.dealCode) {
      const deal = state.deals.find((item) => item.id === activity.dealCode);
      if (deal && deal.stage !== payload.dealStage) {
        assertDemoStageGate(deal, payload.dealStage, { stage: payload.dealStage, lostReason: payload.lostReason, reason: payload.stageReason });
        deal.stage = payload.dealStage;
        if (payload.dealStage === "CLOSED_LOST") { deal.lostReason = payload.lostReason; deal.closedLostAt = nowIso(); }
        deal.updatedAt = nowIso();
      }
    }
    if (payload.nextActivity) {
      state.counters.activity += 1;
      const next: CRMActivity = {
        id: nextCode("ACT-QA", state.counters.activity),
        type: payload.nextActivity.type,
        subject: payload.nextActivity.purposeCode === "OTHER" ? payload.nextActivity.purposeDetail || "OTHER" : payload.nextActivity.purposeCode,
        purposeCode: payload.nextActivity.purposeCode,
        purposeDetail: payload.nextActivity.purposeDetail,
        relatedName: activity.relatedName,
        relatedType: activity.relatedType,
        leadCode: activity.leadCode,
        dealCode: activity.dealCode,
        businessUnit: activity.businessUnit,
        businessUnitName: activity.businessUnitName,
        owner: activity.owner,
        ownerUserId: activity.ownerUserId,
        scheduledAt: payload.nextActivity.scheduledAt,
        status: "SCHEDULED",
        note: payload.nextActivity.note,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      state.activities.push(next);
    }
    if (activity.leadCode) syncNextActivity(state, "LEAD", activity.leadCode);
    if (activity.dealCode) syncNextActivity(state, "DEAL", activity.dealCode);
    updated = activity;
  });
  return clone(updated);
}

export function demoRescheduleActivity(activityCode: string, payload: CRMActivityReschedulePayload): CRMActivity {
  let updated!: CRMActivity;
  updateState((state) => {
    const activity = state.activities.find((item) => item.id === activityCode);
    if (!activity) throw new Error("QA Activity not found.");
    if (["COMPLETED","CANCELLED"].includes(activity.status)) throw new Error("Closed Activity cannot be rescheduled.");
    activity.scheduledAt = payload.scheduledAt;
    activity.status = "RESCHEDULED";
    activity.rescheduleReason = payload.reason;
    activity.updatedAt = nowIso();
    if (activity.leadCode) syncNextActivity(state, "LEAD", activity.leadCode);
    if (activity.dealCode) syncNextActivity(state, "DEAL", activity.dealCode);
    updated = activity;
  });
  return clone(updated);
}

function effectivePlan(settings: CRMBUSettingsSnapshot, ownerUserId?: string) {
  const member = settings.members.find((item) => item.userId === ownerUserId);
  return settings.commissionPlans.find((plan) => plan.scopeType === "USER" && plan.ownerUserId === ownerUserId)
    || settings.commissionPlans.find((plan) => plan.scopeType === "TEAM" && plan.teamId && member?.teamIds.includes(plan.teamId))
    || settings.commissionPlans.find((plan) => plan.scopeType === "BU")
    || null;
}

function recognitionForDeal(state: DemoState, deal: CRMDeal): CRMPointRecognition {
  const settings = state.settings[deal.businessUnit];
  const period = currentPeriod();
  const lineSnapshots = (deal.productLines || []).map((item) => {
    const rule = settings?.pointRules.find((candidate) => candidate.productCode === item.productCode);
    const pointsPerUnit = Number(rule?.pointsPerUnit || 0);
    return { productCode: item.productCode, productName: item.productName, pointType: item.pointType, quantity: item.quantity, pointsPerUnit, totalPoints: pointsPerUnit * item.quantity };
  });
  const swPoints = lineSnapshots.filter((item) => item.pointType === "SOFTWARE").reduce((sum, item) => sum + item.totalPoints, 0);
  const hwPoints = lineSnapshots.filter((item) => item.pointType === "HARDWARE").reduce((sum, item) => sum + item.totalPoints, 0);
  return { recognizedAt: nowIso(), period, swPoints, hwPoints, amountLAK: 0, commissionPlanName: effectivePlan(settings, deal.ownerUserId)?.name, lineSnapshots };
}

function recalculateCommissionAmounts(state: DemoState, businessUnit: string, period: string) {
  const settings = state.settings[businessUnit];
  if (!settings) return;
  const owners = new Set(state.deals.filter((deal) => deal.businessUnit === businessUnit && deal.pointRecognition?.period === period).map((deal) => deal.ownerUserId).filter(Boolean) as string[]);
  for (const ownerUserId of owners) {
    const items = state.deals.filter((deal) => deal.businessUnit === businessUnit && deal.ownerUserId === ownerUserId && deal.pointRecognition?.period === period);
    const sw = items.reduce((sum, deal) => sum + Number(deal.pointRecognition?.swPoints || 0), 0);
    const plan = effectivePlan(settings, ownerUserId);
    const tier = plan?.tiers.find((item) => sw >= item.minSWPoints && (item.maxSWPoints == null || sw <= item.maxSWPoints));
    const swRate = Number(tier?.lakPerSWPoint || 0);
    const hwRate = Number(plan?.hardwareLAKPerPoint || 0);
    for (const deal of items) {
      if (!deal.pointRecognition) continue;
      deal.pointRecognition.amountLAK = deal.pointRecognition.swPoints * swRate + deal.pointRecognition.hwPoints * hwRate;
      deal.pointRecognition.commissionPlanName = plan?.name;
    }
  }
}

function ensureDemoCustomerForDeal(state: DemoState, deal: CRMDeal) {
  const settings = state.settings[deal.businessUnit];
  if (!settings) return;
  let customer = settings.customerMaster.find((item) => item.id === deal.customerId)
    || settings.customerMaster.find((item) => item.displayName.trim().toLowerCase() === deal.storeName.trim().toLowerCase());
  if (!customer) {
    const nextNumber = settings.customerMaster.reduce((max, item) => {
      const match = item.customerCode.match(/^CUS-(\d+)$/);
      return Math.max(max, match ? Number(match[1]) : 0);
    }, 0) + 1;
    customer = {
      id: `qa-customer-${nextNumber}`,
      customerCode: `CUS-${String(nextNumber).padStart(5, "0")}`,
      displayName: deal.storeName,
      customerType: "BUSINESS",
      primaryContact: deal.primaryContact,
      status: "ACTIVE",
      dealCount: 0,
      wonDealCount: 0,
      wonValueLAK: 0,
    };
    settings.customerMaster.push(customer);
  }
  customer.status = "ACTIVE";
  customer.dealCount = Math.max(1, Number(customer.dealCount || 0));
  customer.wonDealCount = Math.max(1, Number(customer.wonDealCount || 0));
  if (deal.currency === "LAK") customer.wonValueLAK = Number(customer.wonValueLAK || 0) + Number(deal.value || 0);
  deal.customerId = customer.id;
  deal.customerCode = customer.customerCode;
  deal.customerName = customer.displayName;
  deal.customerLinkedAt = nowIso();
}

export function demoExternalGate(dealCode: string, action: CRMQAExternalGateAction): CRMDeal {
  let updated!: CRMDeal;
  updateState((state) => {
    const deal = state.deals.find((item) => item.id === dealCode);
    if (!deal) throw new Error("QA Deal not found.");
    if (["CLOSED_WON","CLOSED_LOST"].includes(deal.stage)) throw new Error("Closed Deal external gates are locked.");
    if (action === "LINK_QUOTATION") {
      state.counters.quotation += 1;
      deal.quotationNumber = `QT-QA-${String(state.counters.quotation).padStart(4,"0")}`;
    } else if (action === "CONFIRM_QUOTATION") {
      if (!deal.quotationNumber) throw new Error("Link a QA Quotation first.");
      deal.quotationConfirmed = true;
    } else if (action === "UPLOAD_PAYMENT_SLIP") {
      if (!deal.quotationConfirmed) throw new Error("Confirm the QA Quotation first.");
      deal.paymentSlipUploaded = true;
    } else if (action === "FINANCE_CONFIRM_INVOICE") {
      if (deal.stage !== "AWAITING_PAYMENT") throw new Error("Move Deal to Awaiting Payment before Finance confirmation.");
      if (!deal.paymentSlipUploaded) throw new Error("Upload QA Payment Slip first.");
      state.counters.invoice += 1;
      deal.financePaymentConfirmed = true;
      deal.invoiceNumber = `INV-QA-${String(state.counters.invoice).padStart(4,"0")}`;
      deal.stage = "CLOSED_WON";
      deal.closedWonAt = nowIso();
      ensureDemoCustomerForDeal(state, deal);
      deal.pointRecognition = recognitionForDeal(state, deal);
      recalculateCommissionAmounts(state, deal.businessUnit, deal.pointRecognition.period);
    }
    deal.updatedAt = nowIso();
    updated = deal;
  });
  return clone(updated);
}

function targetFor(settings: CRMBUSettingsSnapshot, userId: string): CRMSalesPointTarget | undefined {
  const member = settings.members.find((item) => item.userId === userId);
  return settings.targets.find((item) => item.ownerUserId === userId)
    || settings.targets.find((item) => item.teamId && member?.teamIds.includes(item.teamId))
    || settings.targets.find((item) => !item.ownerUserId && !item.teamId);
}

export function demoPerformance(businessUnit: string, period: string): CRMPerformance {
  const state = readState();
  const effectiveBU = businessUnit === "ALL" ? "QPOS" : businessUnit;
  const settings = state.settings[effectiveBU] || qposSettings();
  const userId = state.currentUserId;
  const deals = state.deals.filter((deal) => deal.businessUnit === effectiveBU && deal.ownerUserId === userId);
  const leads = state.leads.filter((lead) => lead.businessUnit === effectiveBU && lead.ownerUserId === userId);
  const activities = state.activities.filter((activity) => activity.businessUnit === effectiveBU && activity.ownerUserId === userId);
  const inPeriod = (value?: string) => Boolean(value && value.slice(0,7) === period);
  const won = deals.filter((deal) => deal.stage === "CLOSED_WON" && inPeriod(deal.closedWonAt));
  const recognized = won.filter((deal) => deal.pointRecognition?.period === period);
  const swPoints = recognized.reduce((sum, deal) => sum + Number(deal.pointRecognition?.swPoints || 0), 0);
  const hwPoints = recognized.reduce((sum, deal) => sum + Number(deal.pointRecognition?.hwPoints || 0), 0);
  const target = targetFor(settings, userId);
  const targetSW = Number(target?.targetSWPoints ?? settings.general.defaultSWPointTarget ?? 0);
  const newLeads = leads.filter((lead) => inPeriod(lead.createdAt)).length;
  const convertedLeads = leads.filter((lead) => lead.status === "CONVERTED" && inPeriod(lead.updatedAt)).length;
  const dealsCreated = deals.filter((deal) => inPeriod(deal.createdAt)).length;
  const completed = activities.filter((item) => item.status === "COMPLETED" && inPeriod(item.completedAt || item.updatedAt)).length;
  const overdue = demoActivities(effectiveBU, "SELF").filter((item) => item.status === "OVERDUE").length;
  const wonValue: Record<DealCurrency, number> = { LAK: 0, USD: 0, THB: 0 };
  won.forEach((deal) => { wonValue[deal.currency] += Number(deal.value || 0); });
  return {
    period,
    pointTarget: { swPoints: targetSW, revenue: Number(target?.targetRevenue || 0), currency: target?.currency || settings.general.currency, source: target?.ownerUserId ? "USER" : target?.teamId ? "TEAM" : "BU_DEFAULT" },
    pointAchievement: { swPoints, hwPoints, rate: targetSW > 0 ? swPoints / targetSW : 0, remaining: Math.max(0, targetSW - swPoints), status: "READY" },
    operational: { wonLicenses: won.reduce((sum, deal) => sum + Number(deal.licenseQuantity || 0), 0), wonDeals: won.length, wonValue },
    funnel: { newLeads, convertedLeads, dealsCreated, wonDeals: won.length, leadToDealRate: newLeads ? convertedLeads / newLeads : 0, dealToWonRate: dealsCreated ? won.length / dealsCreated : 0 },
    activity: { completed, overdue },
  };
}

export function demoCommission(businessUnit: string, period: string): CRMCommissionSummary {
  const state = readState();
  const effectiveBU = businessUnit === "ALL" ? "QPOS" : businessUnit;
  const settings = state.settings[effectiveBU] || qposSettings();
  const userId = state.currentUserId;
  const recognizedDeals = state.deals.filter((deal) => deal.businessUnit === effectiveBU && deal.ownerUserId === userId && deal.pointRecognition?.period === period);
  const swPoints = recognizedDeals.reduce((sum, deal) => sum + Number(deal.pointRecognition?.swPoints || 0), 0);
  const hwPoints = recognizedDeals.reduce((sum, deal) => sum + Number(deal.pointRecognition?.hwPoints || 0), 0);
  const amountLAK = recognizedDeals.reduce((sum, deal) => sum + Number(deal.pointRecognition?.amountLAK || 0), 0);
  const wonDeals = state.deals.filter((deal) => deal.businessUnit === effectiveBU && deal.ownerUserId === userId && deal.stage === "CLOSED_WON" && deal.closedWonAt?.slice(0,7) === period).length;
  return {
    period,
    recognitionStatus: "READY",
    recognized: { swPoints, hwPoints, amountLAK },
    wonDeals,
    effectivePlan: effectivePlan(settings, userId),
    message: "QA Demo: Point is recognized only when the simulated Finance gate closes a Deal Won. Point values come from Point Settings and are snapshotted at recognition.",
  };
}

export function demoSettings(businessUnit: string, period: string): CRMBUSettingsSnapshot {
  const state = readState();
  const base = state.settings[businessUnit] || qposSettings();
  return clone({ ...base, period, periodLocked: period < currentPeriod() });
}

export function demoSaveGeneral(businessUnit: string, payload: { currency: string; timezone: string; defaultSWPointTarget: number; period?: string }) {
  updateState((state) => {
    const settings = state.settings[businessUnit];
    if (!settings) throw new Error("QA BU Settings not found.");
    settings.general.currency = payload.currency as DealCurrency;
    settings.general.timezone = payload.timezone;
    settings.general.defaultSWPointTarget = Number(payload.defaultSWPointTarget || 0);
  });
}

export function demoSaveMember(businessUnit: string, payload: { userId: string; status: "ACTIVE" | "INACTIVE"; effectiveFrom: string; effectiveTo?: string; roleCodes: string[]; teamIds: string[] }) {
  updateState((state) => {
    const settings = state.settings[businessUnit];
    const member = settings?.members.find((item) => item.userId === payload.userId);
    if (!settings || !member) throw new Error("QA CRM member not found.");
    Object.assign(member, payload);
  });
}

export function demoSaveTeam(businessUnit: string, payload: { teamId?: string; teamCode: string; name: string; managerUserId?: string; status: "ACTIVE" | "INACTIVE" }) {
  let id = payload.teamId;
  updateState((state) => {
    const settings = state.settings[businessUnit];
    if (!settings) throw new Error("QA BU Settings not found.");
    const existing = payload.teamId ? settings.teams.find((item) => item.id === payload.teamId) : undefined;
    if (existing) Object.assign(existing, payload);
    else {
      id = `qa-team-${settings.teams.length + 1}`;
      settings.teams.push({ id, teamCode: payload.teamCode, name: payload.name, managerUserId: payload.managerUserId, managerName: settings.users.find((item) => item.id === payload.managerUserId)?.name, status: payload.status, memberCount: 0 });
    }
  });
  return id || null;
}

export function demoSavePipeline(businessUnit: string, stages: CRMBUSettingsSnapshot["pipelineStages"]) {
  updateState((state) => { const settings = state.settings[businessUnit]; if (!settings) throw new Error("QA BU Settings not found."); settings.pipelineStages = clone(stages); });
}

export function demoSaveProductMaster(businessUnit: string, payload: CRMProductMasterPayload): CRMProductOption {
  let result: CRMProductOption | null = null;
  updateState((state) => {
    const settings = state.settings[businessUnit];
    if (!settings) throw new Error("QA BU Settings not found.");
    const existing = payload.productId
      ? settings.productOptions.find((item) => item.id === payload.productId || item.productCode === payload.productId)
      : undefined;
    const nextNumber = settings.productOptions.reduce((max, item) => {
      const match = item.productCode.match(/^PRD-(\d+)$/);
      return Math.max(max, match ? Number(match[1]) : 0);
    }, 0) + 1;
    const productCode = existing?.productCode || `PRD-${String(nextNumber).padStart(4, "0")}`;
    const next: CRMProductOption = {
      id: existing?.id || `qa-product-${nextNumber}`,
      productCode,
      productName: payload.productName,
      pointType: payload.productType,
      category: payload.category,
      unitLabel: payload.unitLabel,
      inventoryManaged: payload.productType === "HARDWARE" ? payload.inventoryManaged : false,
      defaultUnitPrice: Number(payload.defaultUnitPrice || 0),
      currency: payload.currency,
      description: payload.description,
      source: "PRODUCT_MASTER",
      status: payload.status,
    };
    if (existing) Object.assign(existing, next); else settings.productOptions.push(next);
    result = clone(next);
  });
  if (!result) throw new Error("QA Product Master save failed.");
  return result;
}

export function demoSaveCustomerMaster(businessUnit: string, payload: CRMCustomerMasterPayload): CRMCustomerMaster {
  let result: CRMCustomerMaster | null = null;
  updateState((state) => {
    const settings = state.settings[businessUnit];
    if (!settings) throw new Error("QA BU Settings not found.");
    const existing = payload.customerId
      ? settings.customerMaster.find((item) => item.id === payload.customerId || item.customerCode === payload.customerId)
      : undefined;
    const nextNumber = settings.customerMaster.reduce((max, item) => {
      const match = item.customerCode.match(/^CUS-(\d+)$/);
      return Math.max(max, match ? Number(match[1]) : 0);
    }, 0) + 1;
    const next: CRMCustomerMaster = {
      id: existing?.id || `qa-customer-${nextNumber}`,
      customerCode: existing?.customerCode || `CUS-${String(nextNumber).padStart(5, "0")}`,
      displayName: payload.displayName,
      legalCompanyName: payload.legalCompanyName,
      customerType: payload.customerType,
      primaryContact: payload.primaryContact,
      phone: payload.phone,
      email: payload.email,
      whatsapp: payload.whatsapp,
      province: payload.province,
      status: payload.status,
      note: payload.note,
      dealCount: existing?.dealCount || 0,
      wonDealCount: existing?.wonDealCount || 0,
      wonValueLAK: existing?.wonValueLAK || 0,
    };
    if (existing) Object.assign(existing, next); else settings.customerMaster.push(next);
    result = clone(next);
  });
  if (!result) throw new Error("QA Customer Master save failed.");
  return result;
}

export function demoSavePoints(businessUnit: string, period: string, rules: CRMBUSettingsSnapshot["pointRules"]) {
  updateState((state) => {
    const settings = state.settings[businessUnit];
    if (!settings) throw new Error("QA BU Settings not found.");
    if (period < currentPeriod()) throw new Error("Past QA Point periods are locked.");
    settings.pointRules = rules.map((item, index) => ({ ...item, id: item.id || `qa-point-${index + 1}`, locked: false }));
  });
}

export function demoSaveTarget(businessUnit: string, payload: { period: string; ownerUserId?: string; teamId?: string; targetSWPoints: number; targetRevenue: number; currency: string }) {
  let id = "";
  updateState((state) => {
    const settings = state.settings[businessUnit];
    if (!settings) throw new Error("QA BU Settings not found.");
    const existing = settings.targets.find((item) => item.ownerUserId === payload.ownerUserId && item.teamId === payload.teamId);
    if (existing) { Object.assign(existing, { targetSWPoints: payload.targetSWPoints, targetRevenue: payload.targetRevenue, currency: payload.currency as DealCurrency }); id = existing.id; }
    else { id = `qa-target-${settings.targets.length + 1}`; settings.targets.push({ id, teamId: payload.teamId, teamName: settings.teams.find((item) => item.id === payload.teamId)?.name, ownerUserId: payload.ownerUserId, ownerName: settings.users.find((item) => item.id === payload.ownerUserId)?.name, targetSWPoints: payload.targetSWPoints, targetRevenue: payload.targetRevenue, currency: payload.currency as DealCurrency, locked: false }); }
  });
  return id;
}

export function demoSaveCommission(businessUnit: string, payload: { period: string; scopeType: "BU" | "TEAM" | "USER"; teamId?: string; ownerUserId?: string; name: string; hardwareLAKPerPoint: number; status: "OPEN" | "LOCKED" | "INACTIVE"; ruleSource?: string; tiers: CRMCommissionPlanSetting["tiers"] }) {
  let id = "";
  updateState((state) => {
    const settings = state.settings[businessUnit];
    if (!settings) throw new Error("QA BU Settings not found.");
    const existing = settings.commissionPlans.find((item) => item.scopeType === payload.scopeType && item.teamId === payload.teamId && item.ownerUserId === payload.ownerUserId);
    const next = { id: existing?.id || `qa-plan-${settings.commissionPlans.length + 1}`, scopeType: payload.scopeType, teamId: payload.teamId, teamName: settings.teams.find((item) => item.id === payload.teamId)?.name, ownerUserId: payload.ownerUserId, ownerName: settings.users.find((item) => item.id === payload.ownerUserId)?.name, name: payload.name, modelType: "FINAL_MONTHLY_TIER", hardwareLAKPerPoint: payload.hardwareLAKPerPoint, status: payload.status, ruleSource: payload.ruleSource || "QA_DEMO", sourcePeriod: payload.period, locked: payload.status === "LOCKED", tiers: clone(payload.tiers) } satisfies CRMCommissionPlanSetting;
    if (existing) Object.assign(existing, next); else settings.commissionPlans.push(next);
    id = next.id;
    recalculateCommissionAmounts(state, businessUnit, payload.period);
  });
  return id;
}
