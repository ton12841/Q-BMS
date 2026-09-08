import type { Locale } from "@/i18n/config";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

export type ReportingAssignment = {
  assignmentId: string;
  employeeId: string;
  employeeCode: string | null;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  employeeStatus: string | null;
  businessUnit: { id: string; code: string; name: string };
  position: { id: string; code: string; name: string };
  jobGrade: { id: string; gradeNumber: number; name: string };
  jobLevel: { id: string | null; code: string; name: string };
  effectiveFrom: string | null;
};

export type ReportingLine = {
  id: string;
  employeeAssignmentId: string;
  reportsToAssignmentId: string;
  relationshipType: "PRIMARY" | "DOTTED";
  status: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isCurrent: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  employee: {
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
  manager: {
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
};

export type ReportingLinesOverview = {
  counts: {
    activeAssignments: number;
    activePrimary: number;
    activeDotted: number;
    withoutPrimary: number;
    history: number;
  };
  assignments: ReportingAssignment[];
  lines: ReportingLine[];
  rules: {
    managerSource: string;
    primaryManagerLimit: number;
    dottedManagerLimit: number | null;
    futureEffectiveDates: boolean;
    cycleDetection: boolean;
    hardDelete: boolean;
    departmentStatus: string;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
};

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
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

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || `Reporting Lines API returned ${response.status}.`);
  }

  return payload.data;
}

export function fetchReportingLinesOverview(locale: Locale, signal?: AbortSignal) {
  return requestJson<ReportingLinesOverview>(
    `/api/organization/reporting-lines/overview?lang=${locale}`,
    { signal }
  );
}

export function saveReportingLine(
  locale: Locale,
  payload: {
    employee_assignment_id: string;
    reports_to_assignment_id: string;
    relationship_type: "PRIMARY" | "DOTTED";
    effective_from: string;
  }
) {
  return requestJson<ReportingLine>(
    `/api/organization/reporting-lines?lang=${locale}`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export function endReportingLine(
  id: string,
  locale: Locale,
  effectiveTo: string
) {
  return requestJson<ReportingLine>(
    `/api/organization/reporting-lines/${id}/end?lang=${locale}`,
    { method: "POST", body: JSON.stringify({ effective_to: effectiveTo }) }
  );
}
