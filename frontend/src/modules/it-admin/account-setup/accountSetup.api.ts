import type {Locale} from "@/i18n/config";

export type AccountSetupRequest = {
  id: string;
  employee_id: string;
  request_status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  assigned_to_user_id: string | null;
  company_email: string | null;
  it_note: string | null;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  employee_code: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  start_date: string | null;
  employee_status: string;
  profile_status: string;
  employee_company_email: string | null;
  assignment_id: string | null;
  business_unit_id: string | null;
  business_unit_code: string | null;
  business_unit_name: string | null;
  position_id: string | null;
  position_code: string | null;
  position_name: string | null;
  job_grade_id: string | null;
  grade_number: number | null;
  job_grade_name: string | null;
  job_level_id: string | null;
  job_level_code: string | null;
  job_level_name: string | null;
  invitation_id: string | null;
  invitation_status: "DRAFT" | "QUEUED" | "SENT" | "ACCEPTED" | "EXPIRED" | "REVOKED" | null;
  invited_email: string | null;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

async function requestJson<T>(
  path: string,
  label: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? {"Content-Type": "application/json"} : {}),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || `${label} API returned ${response.status}.`);
  }

  return payload.data;
}

export async function fetchAccountSetupQueue(
  locale: Locale,
  signal?: AbortSignal
): Promise<AccountSetupRequest[]> {
  const data = await requestJson<AccountSetupRequest[]>(
    `/api/it-admin/account-setup?lang=${locale}`,
    "IT Account Setup",
    {signal}
  );

  if (!Array.isArray(data)) {
    throw new Error("Invalid IT Account Setup API response.");
  }

  return data;
}

export async function startAccountSetupRequest(
  id: string,
  locale: Locale
): Promise<AccountSetupRequest> {
  return requestJson<AccountSetupRequest>(
    `/api/it-admin/account-setup/${id}/start?lang=${locale}`,
    "IT Account Setup",
    {method: "PATCH"}
  );
}

export async function completeAccountSetupRequest(
  id: string,
  locale: Locale,
  payload: {company_email: string; it_note: string}
): Promise<AccountSetupRequest> {
  return requestJson<AccountSetupRequest>(
    `/api/it-admin/account-setup/${id}/complete?lang=${locale}`,
    "IT Account Setup",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}
