import type { Locale } from "@/i18n/config";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

export type EmployeeAssignmentManager = {
  assignmentId: string;
  employeeId: string;
  employeeCode: string | null;
  displayName: string;
  businessUnitCode: string | null;
  businessUnitName: string | null;
  positionCode: string | null;
  positionName: string | null;
};

export type EmployeeOrganizationAssignment = {
  assignmentId: string;
  employeeId: string;
  businessUnit: {
    id: string;
    code: string;
    name: string;
  };
  position: {
    id: string;
    code: string;
    name: string;
  };
  jobGrade: {
    id: string;
    gradeNumber: number;
    name: string;
  };
  jobLevel: {
    id: string;
    code: string;
    name: string;
  };
  status: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  changeType: string;
  changeReason: string | null;
  changeNote: string | null;
  createdByUserId: string | null;
  createdByEmail: string | null;
  createdAt: string | null;
  manager: EmployeeAssignmentManager | null;
};

export type EmployeeManagerCandidate = {
  assignmentId: string;
  employeeId: string;
  employeeCode: string | null;
  displayName: string;
  businessUnitCode: string;
  businessUnitName: string;
  positionCode: string;
  positionName: string;
  gradeNumber: number;
  jobGradeName: string;
  jobLevelCode: string;
  jobLevelName: string;
};

export type EmployeeAssignmentOverview = {
  employee: {
    id: string;
    employeeCode: string;
    companyEmail: string | null;
    firstName: string;
    lastName: string;
    nickname: string | null;
    displayName: string;
    employeeStatus: string;
    employmentType: string | null;
    startDate: string | null;
    workLocation: string | null;
  };
  current: EmployeeOrganizationAssignment | null;
  history: EmployeeOrganizationAssignment[];
  managerCandidates: EmployeeManagerCandidate[];
  rules: {
    departmentStatus: string;
    jobLevelDerivedFromGrade: boolean;
    activeAssignmentHistoryImmutable: boolean;
    futureAssignmentScheduling: boolean;
    managerSource: string;
    reportingContinuityOnTransition: boolean;
    dottedReportingManagedSeparately: boolean;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

async function requestJson<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });

  const payload = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload?.message ||
        `Employee Organization Assignment API returned ${response.status}.`
    );
  }

  return payload.data;
}

export function fetchEmployeeAssignmentOverview(
  employeeId: string,
  locale: Locale,
  signal?: AbortSignal
) {
  return requestJson<EmployeeAssignmentOverview>(
    `/api/employees/${encodeURIComponent(
      employeeId
    )}/organization-assignments/overview?lang=${locale}`,
    { signal }
  );
}

export function transitionEmployeeAssignment(
  employeeId: string,
  locale: Locale,
  payload: {
    business_unit_id: string;
    position_id: string;
    job_grade_id: string;
    effective_from: string;
    change_type:
      | "TRANSFER"
      | "PROMOTION"
      | "LATERAL_MOVE"
      | "CORRECTION";
    change_reason: string;
    change_note: string;
    primary_manager_assignment_id: string | null;
  }
) {
  return requestJson<EmployeeAssignmentOverview>(
    `/api/employees/${encodeURIComponent(
      employeeId
    )}/organization-assignments/transitions?lang=${locale}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}
