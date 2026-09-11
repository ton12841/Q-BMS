import type {
  CRMBusinessUnit,
  CRMLead,
  CRMLeadCreatePayload,
} from "../crm.types";

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
  const data = await requestJson<CRMBusinessUnit[]>(
    "/api/crm/context/business-units",
    { signal }
  );
  return Array.isArray(data) ? data : [];
}

export async function fetchCRMLeads(
  businessUnitCode: string,
  signal?: AbortSignal
): Promise<CRMLead[]> {
  const params = new URLSearchParams({ business_unit: businessUnitCode || "ALL" });
  const data = await requestJson<CRMLead[]>(`/api/crm/leads?${params.toString()}`, { signal });
  return Array.isArray(data) ? data : [];
}

export async function createCRMLead(payload: CRMLeadCreatePayload): Promise<CRMLead> {
  return requestJson<CRMLead>("/api/crm/leads", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
