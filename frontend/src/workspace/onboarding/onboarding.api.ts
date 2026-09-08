import {AUTH_API_URL} from "@/modules/auth/api/auth.api";

export type OnboardingTask = {
  id: string | number;
  task_code: string;
  task_name: string;
  owner_type: "EMPLOYEE" | "HR" | "ADMIN" | "IT" | string;
  task_status: string;
  completed_at: string | null;
  metadata?: Record<string, unknown> | null;
};

export type OnboardingBundle = {
  employee: {
    id: string | number;
    employee_code: string;
    company_email: string | null;
    first_name: string;
    last_name: string;
    nickname: string | null;
    employee_status: string;
    profile_status: string;
    business_unit_name: string | null;
    position_name: string | null;
    grade_number: number | null;
    job_grade_name: string | null;
    job_level_name: string | null;
  };
  onboarding_case: {id: string | number; case_status: string; submitted_at: string | null};
  personal: {
    date_of_birth: string | null;
    gender: string | null;
    nationality: string | null;
    national_id: string | null;
    mobile: string | null;
    personal_email: string | null;
    current_address: string | null;
    permanent_address: string | null;
  } | null;
  emergency: {
    contact_name: string;
    relationship: string;
    phone: string;
    alternate_phone: string | null;
  } | null;
  bank: {
    bank_name: string;
    account_name: string;
    account_number: string;
    currency: string;
    bank_branch: string | null;
  } | null;
  documents: Array<{
    id: string | number;
    document_type: string;
    document_url: string;
    status: string;
    created_at: string | null;
  }>;
  policy: {policy_code: string; policy_version: string; acknowledged_at: string} | null;
  tasks: OnboardingTask[];
  progress: number;
  workflow_progress: number;
  can_submit: boolean;
  is_submitted: boolean;
};

type ApiResponse<T> = {success: boolean; data: T; message?: string; code?: string | null};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${AUTH_API_URL}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init.body ? {"Content-Type": "application/json"} : {}),
      ...(init.headers || {}),
    },
  });
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || `Onboarding API returned ${response.status}.`);
  }
  return payload.data;
}

export function fetchMyOnboarding(locale: string, signal?: AbortSignal) {
  return request<OnboardingBundle>(`/api/onboarding/me?lang=${encodeURIComponent(locale)}`, {signal});
}
export function savePersonal(payload: Record<string, unknown>) {
  return request<OnboardingBundle>("/api/onboarding/me/personal", {method: "PUT", body: JSON.stringify(payload)});
}
export function saveEmergency(payload: Record<string, unknown>) {
  return request<OnboardingBundle>("/api/onboarding/me/emergency", {method: "PUT", body: JSON.stringify(payload)});
}
export function saveBank(payload: Record<string, unknown>) {
  return request<OnboardingBundle>("/api/onboarding/me/bank", {method: "PUT", body: JSON.stringify(payload)});
}
export function addDocument(payload: Record<string, unknown>) {
  return request<OnboardingBundle>("/api/onboarding/me/documents", {method: "POST", body: JSON.stringify(payload)});
}
export function acknowledgePolicy() {
  return request<OnboardingBundle>("/api/onboarding/me/policy/acknowledge", {method: "POST"});
}
export function submitOnboarding() {
  return request<OnboardingBundle>("/api/onboarding/me/submit", {method: "POST"});
}
