import type { Locale } from "@/i18n/config";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

export type OrganizationChartNode = {
  assignmentId: string;
  employeeId: string;
  employeeCode: string | null;
  displayName: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  initials: string;
  workLocation: string | null;
  businessUnit: { id: string; code: string; name: string };
  position: { id: string; code: string; name: string };
  jobGrade: { id: string; gradeNumber: number; name: string };
  jobLevel: { id: string; code: string; name: string };
  effectiveFrom: string | null;
};

export type OrganizationChartEdge = {
  id: string;
  employeeAssignmentId: string;
  reportsToAssignmentId: string;
  relationshipType: "PRIMARY" | "DOTTED";
  effectiveFrom: string | null;
};

export type OrganizationChartData = {
  generatedFrom: string;
  readOnly: boolean;
  departmentStatus: string;
  nodes: OrganizationChartNode[];
  edges: OrganizationChartEdge[];
  businessUnits: Array<{ id: string; code: string; name: string }>;
  counts: {
    employees: number;
    primaryLines: number;
    dottedLines: number;
    roots: number;
    withoutPrimaryManager: number;
  };
  integrity: {
    orphanEdgeCount: number;
    duplicatePrimaryCount: number;
  };
};

async function requestJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
    signal,
    headers: { Accept: "application/json" },
  });

  const payload = await response.json().catch(() => null) as
    | { success?: boolean; data?: T; message?: string }
    | null;

  if (!response.ok || !payload?.success || !payload.data) {
    throw new Error(
      payload?.message || `Organization Chart API returned ${response.status}.`
    );
  }

  return payload.data;
}

export function fetchOrganizationChart(locale: Locale, signal?: AbortSignal) {
  return requestJson<OrganizationChartData>(
    `/api/organization/chart?lang=${locale}`,
    signal
  );
}
