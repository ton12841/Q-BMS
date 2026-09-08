import { AUTH_API_URL } from "@/modules/auth/api/auth.api";

export type PlatformRegistryItem = {
  id: string;
  code: string;
  type: "MODULE" | "TOOL";
  name: string;
  domain: string;
  ownership: string;
  lifecycleStatus: string;
  availabilityStatus: string;
  permissionNamespace: string | null;
  namespacePermissionCount: number;
  description: string | null;
  sortOrder: number;
  isSystemItem: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ModuleManagementOverview = {
  counts: {
    totalItems: number;
    modules: number;
    tools: number;
    holdItems: number;
    catalogItems: number;
  };
  items: PlatformRegistryItem[];
  mode: string;
  rules: {
    registryIsSourceOfTruth: boolean;
    enableDisableDisabled: boolean;
    lifecycleMutationDisabled: boolean;
    routeMutationDisabled: boolean;
    permissionRegistrationDisabled: boolean;
    crmHoldPreserved: boolean;
    expectedModuleCount: number;
    expectedToolCount: number;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export async function fetchModuleManagementOverview(signal?: AbortSignal) {
  const response = await fetch(
    `${AUTH_API_URL}/api/super-admin/module-management/overview`,
    {
      credentials: "include",
      cache: "no-store",
      signal,
      headers: { Accept: "application/json" },
    }
  );

  const payload = (await response
    .json()
    .catch(() => null)) as ApiResponse<ModuleManagementOverview> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload?.message || `Module Management API returned ${response.status}.`
    );
  }

  return payload.data;
}
