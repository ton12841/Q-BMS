import { AUTH_API_URL } from "@/modules/auth/api/auth.api";

export type RoleManagementPermission = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  group: string;
  levelGradePolicyEligible: boolean;
};

export type RoleManagementRole = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  isSystemRole: boolean;
  isAssignable: boolean;
  status: string;
  sortOrder: number;
  assignedUserCount: number;
  isProtected: boolean;
  canEditDefinition: boolean;
  canEditPermissions: boolean;
  permissions: Array<{
    code: string;
    name: string;
    permissionGroup: string | null;
  }>;
};

export type RoleManagementOverview = {
  counts: {
    totalRoles: number;
    systemRoles: number;
    customRoles: number;
    activeRoles: number;
    permissions: number;
  };
  roles: RoleManagementRole[];
  permissions: RoleManagementPermission[];
  rules: {
    employeeRoleProtected: boolean;
    superAdminRoleProtected: boolean;
    systemAdminRoleDefinitionLocked: boolean;
    systemAdminRolePermissionsEditable: boolean;
    customRoleCategory: string;
    hardDeleteDisabled: boolean;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

async function parse<T>(response: Response) {
  const payload = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || `API returned ${response.status}.`);
  }

  return payload.data;
}

export async function fetchRoleManagementOverview(signal?: AbortSignal) {
  const response = await fetch(
    `${AUTH_API_URL}/api/super-admin/role-management/overview`,
    {
      credentials: "include",
      cache: "no-store",
      signal,
      headers: { Accept: "application/json" },
    }
  );

  return parse<RoleManagementOverview>(response);
}

export async function createRoleManagementRole(input: {
  code: string;
  name: string;
  description: string;
  permissionCodes: string[];
}) {
  const response = await fetch(
    `${AUTH_API_URL}/api/super-admin/role-management/roles`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(input),
    }
  );

  return parse<{ id: string; code: string; name: string }>(response);
}

export async function updateRoleManagementRole(
  roleId: string,
  input: {
    name?: string;
    description?: string;
    status?: string;
    permissionCodes: string[];
  }
) {
  const response = await fetch(
    `${AUTH_API_URL}/api/super-admin/role-management/roles/${encodeURIComponent(
      roleId
    )}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(input),
    }
  );

  return parse<{
    id: string;
    code: string;
    name: string;
    status: string;
    permissionCodes: string[];
  }>(response);
}
