export type WorkspaceEmployee = {
  id: number;
  employee_code: string | null;
  company_email: string | null;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  display_name: string;
  employment_type: string | null;
  employee_status: string | null;
  profile_status: string | null;
  work_location: string | null;
  start_date: string | null;
  probation_end_date: string | null;
  contract_end_date: string | null;
  mobile: string | null;
  personal_email: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  emergency_relationship: string | null;
  emergency_phone: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_masked: string | null;
  assignment_id: number | null;
  assignment_effective_from: string | null;
  business_unit_id: number | null;
  business_unit_code: string | null;
  business_unit_name: string | null;
  position_id: number | null;
  position_code: string | null;
  position_name: string | null;
  job_grade_id: number | null;
  grade_number: number | null;
  job_grade_name: string | null;
  job_level_id: number | null;
  job_level_code: string | null;
  job_level_name: string | null;
  manager_employee_code: string | null;
  manager_first_name: string | null;
  manager_last_name: string | null;
  manager_nickname: string | null;
  onboarding_completed_at: string | null;
  activated_at: string | null;
};

export type WorkspaceDocument = {
  id: number;
  document_type: string | null;
  document_url: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type WorkspaceAsset = {
  assignment_id: number;
  assigned_at: string | null;
  assignment_notes: string | null;
  asset_id: number;
  asset_code: string | null;
  asset_name: string | null;
  asset_type: string | null;
  serial_number: string | null;
  asset_status: string | null;
};

export type EmployeeWorkspaceData = {
  employee: WorkspaceEmployee;
  documents: WorkspaceDocument[];
  assets: WorkspaceAsset[];
  summary: {
    document_count: number;
    asset_count: number;
    onboarding_complete: boolean;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

export async function fetchMyEmployeeWorkspace(
  locale = "en",
  signal?: AbortSignal
): Promise<EmployeeWorkspaceData> {
  const response = await fetch(
    `${API_URL}/api/workspace/employee/me?lang=${encodeURIComponent(locale)}`,
    {
      credentials: "include",
      cache: "no-store",
      signal,
      headers: { Accept: "application/json" },
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<EmployeeWorkspaceData>
    | null;

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload?.message || `Employee Workspace API returned ${response.status}.`
    );
  }

  return payload.data;
}
