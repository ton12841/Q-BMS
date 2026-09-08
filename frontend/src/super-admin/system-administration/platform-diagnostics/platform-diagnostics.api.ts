import { AUTH_API_URL } from "@/modules/auth/api/auth.api";

export type PlatformDiagnosticStatus =
  | "READY"
  | "WAITING"
  | "WARN"
  | "FAIL";

export type PlatformDiagnosticCheck = {
  code: string;
  category: string;
  name: string;
  status: PlatformDiagnosticStatus;
  summary: string;
  details: Record<string, unknown>;
};

export type PlatformDiagnosticsOverview = {
  overallStatus: string;
  generatedAt: string;
  counts: {
    ready: number;
    waiting: number;
    warning: number;
    fail: number;
  };
  checks: PlatformDiagnosticCheck[];
  mode: string;
  rules?: {
    diagnosticsDoNotMutateData: boolean;
    waitingIsNotSystemFailure: boolean;
    positionMasterPendingIsExpected: boolean;
    departmentHoldIsExpected: boolean;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export async function fetchPlatformDiagnosticsOverview(signal?: AbortSignal) {
  const response = await fetch(
    `${AUTH_API_URL}/api/super-admin/platform-diagnostics/overview`,
    {
      credentials: "include",
      cache: "no-store",
      signal,
      headers: { Accept: "application/json" },
    }
  );

  const payload = (await response
    .json()
    .catch(() => null)) as ApiResponse<PlatformDiagnosticsOverview> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload?.message || `Platform Diagnostics API returned ${response.status}.`
    );
  }

  return payload.data;
}
