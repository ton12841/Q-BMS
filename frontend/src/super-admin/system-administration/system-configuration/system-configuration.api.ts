import { AUTH_API_URL } from "@/modules/auth/api/auth.api";

export type SystemConfigurationSetting = {
  id: string;
  key: string;
  group: string;
  valueType: string;
  value: unknown;
  name: string;
  description: string | null;
  sourceOfTruth: string;
  mutability: string;
  status: string;
  sortOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SystemConfigurationOverview = {
  counts: {
    totalSettings: number;
    groups: number;
    lockedSettings: number;
    activeSettings: number;
  };
  settings: SystemConfigurationSetting[];
  mode: string;
  rules: {
    canonicalRegistry: boolean;
    mutationDisabled: boolean;
    approvalFlowRequiredBeforeMutation: boolean;
    auditRequiredBeforeMutation: boolean;
    secretsExcluded: boolean;
    runtimeEnvironmentValuesExcluded: boolean;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export async function fetchSystemConfigurationOverview(signal?: AbortSignal) {
  const response = await fetch(
    `${AUTH_API_URL}/api/super-admin/system-configuration/overview`,
    {
      credentials: "include",
      cache: "no-store",
      signal,
      headers: { Accept: "application/json" },
    }
  );

  const payload = (await response
    .json()
    .catch(() => null)) as ApiResponse<SystemConfigurationOverview> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload?.message || `System Configuration API returned ${response.status}.`
    );
  }

  return payload.data;
}
