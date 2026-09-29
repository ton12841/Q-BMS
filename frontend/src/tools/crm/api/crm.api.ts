import type {
  CRMBusinessUnit,
  CRMActivity,
  CRMActivityCompletePayload,
  CRMActivityCreatePayload,
  CRMActivityReschedulePayload,
  CRMDeal,
  CRMDealConvertPayload,
  CRMDealStagePayload,
  CRMDealUpdatePayload,
  CRMPerformance,
  CRMCommissionSummary,
  CRMLead,
  CRMLeadCreatePayload,
  CRMLeadAssignmentPayload,
  CRMAccessProfile,
  CRMBUSettingsSnapshot,
  CRMCommissionTier,
  CRMPipelineStageSetting,
  CRMPointRule,
  CRMDealProductLine,
  CRMDealProductLineInput,
  CRMProductOption,
  CRMProductMasterPayload,
  CRMCustomerMaster,
  CRMCustomerMasterPayload,
  CRMCustomerDealCreatePayload,
  CRMDataMode,
} from "../crm.types";

import {
  CRM_QA_DEMO_AVAILABLE,
  demoAccessProfile,
  demoActivities,
  demoAssignLead,
  demoBusinessUnits,
  demoChangeDealStage,
  demoCommission,
  demoCompleteActivity,
  demoConvertLeadToDeal,
  demoCreateActivity,
  demoCreateLead,
  demoCreateCustomerDeal,
  demoDeals,
  demoExternalGate,
  demoLeads,
  demoPerformance,
  demoRescheduleActivity,
  demoSaveCommission,
  demoSaveDealProductLines,
  demoSaveGeneral,
  demoSaveMember,
  demoSavePipeline,
  demoSavePoints,
  demoSaveProductMaster,
  demoSaveCustomerMaster,
  demoSaveTarget,
  demoSaveTeam,
  demoSettings,
  demoUpdateDeal,
  getCRMDataMode,
  resetCRMQADemoData,
  setCRMDataMode,
  type CRMQAExternalGateAction,
} from "../crm.qa-demo";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  details?: unknown;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

export class CRMApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "CRMApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function qaDemoEnabled() {
  return CRM_QA_DEMO_AVAILABLE && getCRMDataMode() === "QA_DEMO";
}

function demoResult<T>(fn: () => T): Promise<T> {
  try {
    return Promise.resolve(fn());
  } catch (error) {
    const source = error as Error & { status?: number; code?: string; details?: unknown };
    return Promise.reject(new CRMApiError(source.message || "QA Demo operation failed.", source.status || 400, source.code, source.details));
  }
}

export { getCRMDataMode, setCRMDataMode, resetCRMQADemoData, CRM_QA_DEMO_AVAILABLE };

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !payload?.success) {
    throw new CRMApiError(
      payload?.message || `CRM API returned ${response.status}.`,
      response.status,
      payload?.code,
      payload?.details
    );
  }
  return payload.data as T;
}

export async function fetchCRMBusinessUnits(signal?: AbortSignal): Promise<CRMBusinessUnit[]> {
  if (qaDemoEnabled()) return demoBusinessUnits();
  const data = await requestJson<CRMBusinessUnit[]>("/api/crm/context/business-units", { signal });
  return Array.isArray(data) ? data : [];
}

export async function fetchCRMLeads(businessUnitCode: string, signal?: AbortSignal, scope: "AUTO" | "SELF" | "TEAM" | "BU" | "SHARED" = "AUTO"): Promise<CRMLead[]> {
  if (qaDemoEnabled()) return demoLeads(businessUnitCode || "ALL", scope);
  const params = new URLSearchParams({ business_unit: businessUnitCode || "ALL", scope });
  const data = await requestJson<CRMLead[]>(`/api/crm/leads?${params.toString()}`, { signal });
  return Array.isArray(data) ? data : [];
}

export async function createCRMLead(payload: CRMLeadCreatePayload): Promise<CRMLead> {
  if (qaDemoEnabled()) return demoResult(() => demoCreateLead(payload));
  return requestJson<CRMLead>("/api/crm/leads", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function assignCRMLeadOwner(leadCode: string, payload: CRMLeadAssignmentPayload): Promise<CRMLead> {
  if (qaDemoEnabled()) return demoResult(() => demoAssignLead(leadCode, payload));
  return requestJson<CRMLead>(`/api/crm/leads/${encodeURIComponent(leadCode)}/owner`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchCRMProductOptions(businessUnitCode: string, signal?: AbortSignal): Promise<CRMProductOption[]> {
  const effectiveBU = businessUnitCode === "ALL" ? "QPOS" : businessUnitCode;
  if (qaDemoEnabled()) return demoSettings(effectiveBU, new Date().toISOString().slice(0, 7)).productOptions;
  const params = new URLSearchParams({ business_unit: effectiveBU });
  const data = await requestJson<CRMProductOption[]>(`/api/crm/context/products?${params.toString()}`, { signal });
  return Array.isArray(data) ? data : [];
}

export async function fetchCRMDeals(businessUnitCode: string, signal?: AbortSignal, scope: "AUTO" | "SELF" | "TEAM" | "BU" | "SHARED" = "AUTO"): Promise<CRMDeal[]> {
  if (qaDemoEnabled()) return demoDeals(businessUnitCode || "ALL", scope);
  const params = new URLSearchParams({ business_unit: businessUnitCode || "ALL", scope });
  const data = await requestJson<CRMDeal[]>(`/api/crm/deals?${params.toString()}`, { signal });
  return Array.isArray(data) ? data : [];
}

export async function convertCRMLeadToDeal(leadCode: string, payload: CRMDealConvertPayload): Promise<CRMDeal> {
  if (qaDemoEnabled()) return demoResult(() => demoConvertLeadToDeal(leadCode, payload));
  return requestJson<CRMDeal>(`/api/crm/leads/${encodeURIComponent(leadCode)}/convert-deal`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCRMDeal(dealCode: string, payload: CRMDealUpdatePayload): Promise<CRMDeal> {
  if (qaDemoEnabled()) return demoResult(() => demoUpdateDeal(dealCode, payload));
  return requestJson<CRMDeal>(`/api/crm/deals/${encodeURIComponent(dealCode)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function changeCRMDealStage(dealCode: string, payload: CRMDealStagePayload): Promise<CRMDeal> {
  if (qaDemoEnabled()) return demoResult(() => demoChangeDealStage(dealCode, payload));
  return requestJson<CRMDeal>(`/api/crm/deals/${encodeURIComponent(dealCode)}/stage`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchCRMActivities(businessUnitCode: string, signal?: AbortSignal, scope: "AUTO" | "SELF" | "TEAM" | "BU" | "SHARED" = "AUTO"): Promise<CRMActivity[]> {
  if (qaDemoEnabled()) return demoActivities(businessUnitCode || "ALL", scope);
  const params = new URLSearchParams({ business_unit: businessUnitCode || "ALL", scope });
  const data = await requestJson<CRMActivity[]>(`/api/crm/activities?${params.toString()}`, { signal });
  return Array.isArray(data) ? data : [];
}

export async function createCRMLeadActivity(leadCode: string, payload: CRMActivityCreatePayload): Promise<CRMActivity> {
  if (qaDemoEnabled()) return demoResult(() => demoCreateActivity("LEAD", leadCode, payload));
  return requestJson<CRMActivity>(`/api/crm/leads/${encodeURIComponent(leadCode)}/activities`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createCRMDealActivity(dealCode: string, payload: CRMActivityCreatePayload): Promise<CRMActivity> {
  if (qaDemoEnabled()) return demoResult(() => demoCreateActivity("DEAL", dealCode, payload));
  return requestJson<CRMActivity>(`/api/crm/deals/${encodeURIComponent(dealCode)}/activities`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function completeCRMActivity(activityCode: string, payload: CRMActivityCompletePayload): Promise<CRMActivity> {
  if (qaDemoEnabled()) return demoResult(() => demoCompleteActivity(activityCode, payload));
  return requestJson<CRMActivity>(`/api/crm/activities/${encodeURIComponent(activityCode)}/complete`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function rescheduleCRMActivity(activityCode: string, payload: CRMActivityReschedulePayload): Promise<CRMActivity> {
  if (qaDemoEnabled()) return demoResult(() => demoRescheduleActivity(activityCode, payload));
  return requestJson<CRMActivity>(`/api/crm/activities/${encodeURIComponent(activityCode)}/reschedule`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}


export async function fetchCRMPerformance(businessUnitCode: string, period: string, signal?: AbortSignal): Promise<CRMPerformance> {
  if (qaDemoEnabled()) return demoPerformance(businessUnitCode === "ALL" ? "QPOS" : businessUnitCode, period);
  const params = new URLSearchParams({ business_unit: businessUnitCode || "ALL", period });
  return requestJson<CRMPerformance>(`/api/crm/performance?${params.toString()}`, { signal });
}

export async function fetchCRMCommissions(businessUnitCode: string, period: string, signal?: AbortSignal): Promise<CRMCommissionSummary> {
  if (qaDemoEnabled()) return demoCommission(businessUnitCode === "ALL" ? "QPOS" : businessUnitCode, period);
  const params = new URLSearchParams({ business_unit: businessUnitCode || "ALL", period });
  return requestJson<CRMCommissionSummary>(`/api/crm/commissions?${params.toString()}`, { signal });
}


export async function fetchCRMAccessProfile(signal?: AbortSignal): Promise<CRMAccessProfile> {
  if (qaDemoEnabled()) return demoAccessProfile();
  return requestJson<CRMAccessProfile>("/api/crm/access", { signal });
}

export async function fetchCRMBUSettings(businessUnitCode: string, period: string, signal?: AbortSignal): Promise<CRMBUSettingsSnapshot> {
  if (qaDemoEnabled()) return demoSettings(businessUnitCode === "ALL" ? "QPOS" : businessUnitCode, period);
  const params = new URLSearchParams({ period });
  return requestJson<CRMBUSettingsSnapshot>(`/api/crm/settings/${encodeURIComponent(businessUnitCode)}?${params.toString()}`, { signal });
}

export async function saveCRMBUGeneralSetting(businessUnitCode: string, payload: { currency: string; timezone: string; defaultSWPointTarget: number; period?: string }) {
  if (qaDemoEnabled()) { demoSaveGeneral(businessUnitCode, payload); return { success: true }; }
  return requestJson<{ success: boolean }>(`/api/crm/settings/${encodeURIComponent(businessUnitCode)}/general`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function saveCRMBUMemberSetting(businessUnitCode: string, payload: {
  userId: string; status: "ACTIVE" | "INACTIVE"; effectiveFrom: string; effectiveTo?: string; roleCodes: string[]; teamIds: string[];
}) {
  if (qaDemoEnabled()) { demoSaveMember(businessUnitCode, payload); return { success: true }; }
  return requestJson<{ success: boolean }>(`/api/crm/settings/${encodeURIComponent(businessUnitCode)}/member`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function saveCRMSalesTeamSetting(businessUnitCode: string, payload: {
  teamId?: string; teamCode: string; name: string; managerUserId?: string; status: "ACTIVE" | "INACTIVE";
}) {
  if (qaDemoEnabled()) return { id: demoSaveTeam(businessUnitCode, payload) };
  return requestJson<{ id: string | null }>(`/api/crm/settings/${encodeURIComponent(businessUnitCode)}/team`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function saveCRMPipelineSetting(businessUnitCode: string, stages: CRMPipelineStageSetting[]) {
  if (qaDemoEnabled()) { demoSavePipeline(businessUnitCode, stages); return { success: true }; }
  return requestJson<{ success: boolean }>(`/api/crm/settings/${encodeURIComponent(businessUnitCode)}/pipeline`, { method: "PUT", body: JSON.stringify({ stages }) });
}

export async function saveCRMProductMasterSetting(businessUnitCode: string, payload: CRMProductMasterPayload): Promise<CRMProductOption> {
  if (qaDemoEnabled()) return demoSaveProductMaster(businessUnitCode, payload);
  return requestJson<CRMProductOption>(`/api/crm/settings/${encodeURIComponent(businessUnitCode)}/product-master`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchCRMCustomers(businessUnitCode: string, scope = "AUTO", signal?: AbortSignal): Promise<CRMCustomerMaster[]> {
  if (qaDemoEnabled()) return demoSettings(businessUnitCode === "ALL" ? "QPOS" : businessUnitCode, new Date().toISOString().slice(0, 7)).customerMaster;
  const params = new URLSearchParams({ business_unit: businessUnitCode || "ALL", scope });
  return requestJson<CRMCustomerMaster[]>(`/api/crm/customers?${params.toString()}`, { signal });
}

export async function saveCRMCustomerMaster(businessUnitCode: string, payload: CRMCustomerMasterPayload): Promise<CRMCustomerMaster> {
  if (qaDemoEnabled()) return demoSaveCustomerMaster(businessUnitCode, payload);
  return requestJson<CRMCustomerMaster>(`/api/crm/customers/${encodeURIComponent(businessUnitCode)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function createCRMCustomerDeal(businessUnitCode: string, customerCode: string, payload: CRMCustomerDealCreatePayload): Promise<CRMDeal> {
  if (qaDemoEnabled()) return demoCreateCustomerDeal(businessUnitCode, customerCode, payload);
  return requestJson<CRMDeal>(`/api/crm/customers/${encodeURIComponent(businessUnitCode)}/${encodeURIComponent(customerCode)}/deals`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Backward-compatible alias for any older Settings callers. Customer Master is operational data, not Settings.
export const saveCRMCustomerMasterSetting = saveCRMCustomerMaster;

export async function saveCRMPointSetting(businessUnitCode: string, period: string, rules: CRMPointRule[]) {
  if (qaDemoEnabled()) { demoSavePoints(businessUnitCode, period, rules); return { success: true }; }
  return requestJson<{ success: boolean }>(`/api/crm/settings/${encodeURIComponent(businessUnitCode)}/points`, {
    method: "PUT",
    body: JSON.stringify({ period, rules: rules.map(({ productCode, productName, pointType, unitLabel, pointsPerUnit }) => ({ productCode, productName, pointType, unitLabel, pointsPerUnit })) }),
  });
}

export async function saveCRMSalesTargetSetting(businessUnitCode: string, payload: {
  period: string; ownerUserId?: string; teamId?: string; targetSWPoints: number; targetRevenue: number; currency: string;
}) {
  if (qaDemoEnabled()) return { id: demoSaveTarget(businessUnitCode, payload) };
  return requestJson<{ id: string }>(`/api/crm/settings/${encodeURIComponent(businessUnitCode)}/target`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function saveCRMCommissionSetting(businessUnitCode: string, payload: {
  period: string; scopeType: "BU" | "TEAM" | "USER"; teamId?: string; ownerUserId?: string;
  name: string; hardwareLAKPerPoint: number; status: "OPEN" | "LOCKED" | "INACTIVE"; ruleSource?: string; tiers: CRMCommissionTier[];
}) {
  if (qaDemoEnabled()) return { id: demoSaveCommission(businessUnitCode, payload) };
  return requestJson<{ id: string }>(`/api/crm/settings/${encodeURIComponent(businessUnitCode)}/commission`, { method: "PUT", body: JSON.stringify(payload) });
}


export async function saveCRMDealProductLines(
  dealCode: string,
  lines: CRMDealProductLineInput[] | Omit<CRMDealProductLine, "id" | "lineValue">[]
): Promise<CRMDeal> {
  if (qaDemoEnabled()) return demoResult(() => demoSaveDealProductLines(dealCode, lines as Omit<CRMDealProductLine, "id" | "lineValue">[]));
  return requestJson<CRMDeal>(`/api/crm/deals/${encodeURIComponent(dealCode)}/products`, {
    method: "PUT",
    body: JSON.stringify({ lines: lines.map(({ productCode, quantity, unitPrice }) => ({ productCode, quantity, unitPrice })) }),
  });
}

// Backward-compatible alias for older QA-only callers. New UI uses saveCRMDealProductLines in both modes.
export const saveCRMQADemoDealProductLines = saveCRMDealProductLines;

export async function runCRMQAExternalGate(dealCode: string, action: CRMQAExternalGateAction): Promise<CRMDeal> {
  if (!qaDemoEnabled()) throw new CRMApiError("QA External Gate Simulator is available only in QA Demo Data Mode.", 409, "CRM_QA_DEMO_ONLY");
  return demoResult(() => demoExternalGate(dealCode, action));
}

export type { CRMQAExternalGateAction, CRMDataMode };
