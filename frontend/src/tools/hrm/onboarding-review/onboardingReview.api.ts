export type ReviewCase = {
  onboarding_case_id: string;
  case_status: 'SUBMITTED' | 'CHANGES_REQUESTED' | 'HR_APPROVED' | string;
  submitted_at: string | null;
  updated_at: string | null;
  employee_id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  company_email: string | null;
  employee_status: string;
  profile_status: string;
  start_date: string | null;
  business_unit_id: string | null;
  business_unit_name: string | null;
  position_id: string | null;
  position_name: string | null;
  job_grade_id: string | null;
  grade_number: number | null;
  job_grade_name: string | null;
  job_level_name: string | null;
  hr_review_task_status: string | null;
  asset_task_status: string | null;
  latest_review_action: string | null;
  latest_review_note: string | null;
  latest_review_at: string | null;
};

export type ReviewHistory = {
  id: string;
  onboarding_case_id: string;
  employee_id: string;
  reviewer_user_id: string | null;
  review_action: string;
  review_note: string | null;
  created_at: string;
};

export type OnboardingTask = {
  id: string;
  task_code: string;
  task_name: string;
  owner_type: string;
  task_status: string;
  completed_at: string | null;
  metadata: Record<string, unknown> | null;
};

export type ReviewDetail = {
  review_case: ReviewCase & Record<string, unknown>;
  onboarding: {
    employee: ReviewCase & {
      id: string;
      employment_type?: string | null;
      work_location?: string | null;
    };
    personal: Record<string, any> | null;
    emergency: Record<string, any> | null;
    bank: Record<string, any> | null;
    documents: Array<{id: string; document_type: string; document_url: string; status: string; created_at: string}>;
    policy: {policy_code: string; policy_version: string; acknowledged_at: string} | null;
    tasks: OnboardingTask[];
    progress: number;
    workflow_progress: number;
    can_submit: boolean;
    is_submitted: boolean;
  };
  history: ReviewHistory[];
};

type ApiResponse<T> = { success: boolean; data: T; message?: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000';

async function requestJson<T>(path: string, label: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init.body ? {'Content-Type': 'application/json'} : {}),
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || `${label} API returned ${response.status}.`);
  }
  return payload.data;
}

export function fetchOnboardingReviews(locale = 'en', signal?: AbortSignal) {
  return requestJson<ReviewCase[]>(`/api/hrm/onboarding-reviews?lang=${encodeURIComponent(locale)}`, 'HR Review', {signal});
}

export function fetchOnboardingReview(employeeId: string, locale = 'en', signal?: AbortSignal) {
  return requestJson<ReviewDetail>(`/api/hrm/onboarding-reviews/${encodeURIComponent(employeeId)}?lang=${encodeURIComponent(locale)}`, 'HR Review detail', {signal});
}

export function requestOnboardingChanges(employeeId: string, note: string, locale = 'en') {
  return requestJson<ReviewDetail>(`/api/hrm/onboarding-reviews/${encodeURIComponent(employeeId)}/request-changes?lang=${encodeURIComponent(locale)}`, 'Request changes', {
    method: 'POST',
    body: JSON.stringify({note}),
  });
}

export function approveOnboarding(employeeId: string, note: string, locale = 'en') {
  return requestJson<ReviewDetail>(`/api/hrm/onboarding-reviews/${encodeURIComponent(employeeId)}/approve?lang=${encodeURIComponent(locale)}`, 'Approve onboarding', {
    method: 'POST',
    body: JSON.stringify({note}),
  });
}
