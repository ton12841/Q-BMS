export type ActivationCase = {
  onboarding_case_id: string;
  case_status: string;
  onboarding_completed_at: string | null;
  updated_at: string;
  employee_id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  company_email: string | null;
  employee_status: string;
  profile_status: string;
  start_date: string | null;
  user_id: string | null;
  user_account_status: string | null;
  identity_linked: boolean;
  business_unit_name: string | null;
  position_name: string | null;
  grade_number: number | null;
  job_level_name: string | null;
  activation_task_status: string | null;
  latest_activation_event: string | null;
  latest_activation_note: string | null;
  latest_activation_at: string | null;
};

export type ActivationCheck = { code: string; label: string; passed: boolean };
export type ActivationTask = { id: string; task_code: string; task_name: string; owner_type: string; task_status: string; completed_at: string | null; metadata: Record<string, unknown> | null };
export type ActivationHistory = { id: string; event_type: string; note: string | null; metadata: Record<string, unknown> | null; created_at: string };
export type ActivationDetail = {
  activation: ActivationCase & Record<string, any>;
  tasks: ActivationTask[];
  checks: ActivationCheck[];
  history: ActivationHistory[];
  can_activate: boolean;
  is_active: boolean;
};

type ApiResponse<T> = { success: boolean; data: T; message?: string; details?: unknown };
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000';

async function requestJson<T>(path: string, label: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.message || `${label} API returned ${response.status}.`);
  return payload.data;
}

export function fetchActivations(locale = 'en', signal?: AbortSignal) {
  return requestJson<ActivationCase[]>(`/api/hrm/activations?lang=${encodeURIComponent(locale)}`, 'Employee Activation', { signal });
}

export function fetchActivation(employeeId: string, locale = 'en', signal?: AbortSignal) {
  return requestJson<ActivationDetail>(`/api/hrm/activations/${encodeURIComponent(employeeId)}?lang=${encodeURIComponent(locale)}`, 'Employee Activation detail', { signal });
}

export function activateEmployee(employeeId: string, note: string, locale = 'en') {
  return requestJson<ActivationDetail>(`/api/hrm/activations/${encodeURIComponent(employeeId)}/activate?lang=${encodeURIComponent(locale)}`, 'Activate Employee', {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}
