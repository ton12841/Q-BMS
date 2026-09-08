import type {Locale} from "@/i18n/config";

export type Employee = {
  id: string;
  employee_code: string;
  company_email: string | null;
  first_name: string;
  last_name: string;
  nickname: string | null;
  employment_type: string | null;
  employee_status: string;
  employee_record_type: string;
  profile_status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "COMPLETE";
  work_location: string | null;
  start_date: string | null;
  probation_days: number | null;
  probation_end_date: string | null;
  contract_end_date: string | null;
  hr_note?: string | null;
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
  assignment_status: string | null;
  effective_from: string | null;
  effective_to: string | null;
  account_setup_request_id: string | null;
  account_setup_status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | null;
  account_setup_company_email: string | null;
  account_setup_requested_at: string | null;
  account_setup_completed_at: string | null;
  invitation_id: string | null;
  invitation_status: "DRAFT" | "QUEUED" | "SENT" | "ACCEPTED" | "EXPIRED" | "REVOKED" | null;
  invited_email: string | null;
  invitation_sent_at: string | null;
  invitation_expires_at: string | null;
  invitation_accepted_at: string | null;
  user_id: string | null;
  qbms_account_status: string | null;
  created_at: string;
  updated_at: string;
};

export type EmployeeWritePayload = {
  employee_code: string;
  first_name: string;
  last_name: string;
  nickname: string;
  employment_type: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
  work_location: string;
  start_date: string;
  probation_days: number | null;
  probation_end_date: string;
  contract_end_date: string;
  hr_note: string;
  business_unit_id: string;
  position_id: string;
  job_grade_id: string;
  assignment_effective_from: string;
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

export async function fetchEmployees(
  locale: Locale,
  signal?: AbortSignal
): Promise<Employee[]> {
  const data = await requestJson<Employee[]>(
    `/api/employees?lang=${locale}`,
    "Employee",
    {signal}
  );

  if (!Array.isArray(data)) {
    throw new Error("Invalid Employee API response.");
  }

  return data;
}

export async function fetchEmployeeDetail(
  id: string,
  locale: Locale
): Promise<Employee> {
  return requestJson<Employee>(
    `/api/employees/${id}?lang=${locale}`,
    "Employee"
  );
}

export async function createEmployee(
  payload: EmployeeWritePayload
): Promise<Employee> {
  return requestJson<Employee>(
    "/api/employees",
    "Employee",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function updateEmployee(
  id: string,
  payload: EmployeeWritePayload
): Promise<Employee> {
  return requestJson<Employee>(
    `/api/employees/${id}`,
    "Employee",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}
