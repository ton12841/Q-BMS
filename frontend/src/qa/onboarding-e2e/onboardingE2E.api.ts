export type QaEmployeeRow = {
  employee_id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  company_email: string | null;
  employee_status: string;
  profile_status: string;
  is_test_account: boolean;
  qa_profile_key: string | null;
  onboarding_case_status: string;
  account_setup_status: string;
  invitation_status: string;
  identity_linked: boolean;
  user_account_status: string;
};

export type QaStep = {
  number: number;
  code: string;
  title: string;
  done: boolean;
  status: 'DONE' | 'CURRENT' | 'WAITING';
  evidence: string;
  href: string;
};

export type OnboardingQaDetail = {
  employee: Record<string, any>;
  accountSetup: Record<string, any> | null;
  invitation: Record<string, any> | null;
  onboardingCase: Record<string, any> | null;
  tasks: Array<Record<string, any>>;
  latestReview: Record<string, any> | null;
  latestAssetGateEvent: Record<string, any> | null;
  activeAssetCount: number;
  latestActivationEvent: Record<string, any> | null;
  steps: QaStep[];
  blockers: string[];
  currentStep: QaStep | null;
  completedSteps: number;
  e2eComplete: boolean;
};

type ApiResponse<T> = { success: boolean; data: T; message?: string };
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000';

async function requestJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal,
  });
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.message || `QA API returned ${response.status}.`);
  return payload.data;
}

export async function fetchOnboardingQaEmployees(signal?: AbortSignal) {
  return requestJson<QaEmployeeRow[]>('/api/qa/onboarding-e2e', signal);
}

export async function fetchOnboardingQaDetail(employeeId: string, signal?: AbortSignal) {
  return requestJson<OnboardingQaDetail>(`/api/qa/onboarding-e2e/${employeeId}`, signal);
}
