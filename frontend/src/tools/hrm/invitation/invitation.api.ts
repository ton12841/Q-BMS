import type {Locale} from '@/i18n/config';

export type HRInvitationRow = {
  employee_id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  company_email: string;
  employee_status: string;
  profile_status: string;
  start_date: string | null;
  account_setup_request_id: string;
  account_setup_status: 'COMPLETED';
  invitation_id: string | null;
  invitation_public_id: string | null;
  invited_email: string | null;
  invitation_status: 'DRAFT' | 'QUEUED' | 'SENT' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED' | null;
  queued_at: string | null;
  sent_at: string | null;
  expires_at: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
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
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'http://localhost:4000';

async function requestJson<T>(
  path: string,
  label: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
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

export async function fetchInvitationQueue(
  locale: Locale,
  signal?: AbortSignal
): Promise<HRInvitationRow[]> {
  const data = await requestJson<HRInvitationRow[]>(
    `/api/hrm/invitations?lang=${locale}`,
    'HR Invitation',
    {signal}
  );

  if (!Array.isArray(data)) {
    throw new Error('Invalid HR Invitation API response.');
  }

  return data;
}

export async function queueInvitation(
  employeeId: string,
  locale: Locale
): Promise<HRInvitationRow> {
  return requestJson<HRInvitationRow>(
    `/api/hrm/invitations/${employeeId}/queue?lang=${locale}`,
    'HR Invitation',
    {method: 'POST'}
  );
}

export async function revokeInvitation(
  employeeId: string,
  locale: Locale
): Promise<HRInvitationRow> {
  return requestJson<HRInvitationRow>(
    `/api/hrm/invitations/${employeeId}/revoke?lang=${locale}`,
    'HR Invitation',
    {method: 'POST'}
  );
}
