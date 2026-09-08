import { AUTH_API_URL } from "@/modules/auth/api/auth.api";

export type PermissionManagementPermission = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  group: string;
  levelGradePolicyEligible: boolean;
  roleCount: number;
  activeRoleCount: number;
  roles: Array<{
    code: string;
    name: string;
    status: string;
    category: string;
  }>;
};

export type PermissionManagementOverview = {
  counts: {
    totalPermissions: number;
    permissionGroups: number;
    policyEligible: number;
    unusedPermissions: number;
  };
  permissions: PermissionManagementPermission[];
  mode: string;
  rules: {
    permissionCodeImmutable: boolean;
    createDisabled: boolean;
    deleteDisabled: boolean;
    metadataEditDisabled: boolean;
    roleMembershipManagedInRoleManagement: boolean;
    levelGradePolicyManagedInOrganizationPolicy: boolean;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export async function fetchPermissionManagementOverview(signal?: AbortSignal) {
  const response = await fetch(
    `${AUTH_API_URL}/api/super-admin/permission-management/overview`,
    {
      credentials: "include",
      cache: "no-store",
      signal,
      headers: { Accept: "application/json" },
    }
  );

  const payload = (await response
    .json()
    .catch(() => null)) as ApiResponse<PermissionManagementOverview> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload?.message || `Permission Management API returned ${response.status}.`
    );
  }

  return payload.data;
}
