import { AUTH_API_URL } from "@/modules/auth/api/auth.api";

export type AccessControlPermission = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  group: string;
};

export type AccessControlRolePermission = {
  code: string;
  name: string;
  permissionGroup: string | null;
};

export type AccessControlRole = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  isSystemRole: boolean;
  isAssignable: boolean;
  status: string;
  sortOrder: number;
  permissions: AccessControlRolePermission[];
};

export type AccessControlUser = {
  id: string;
  employeeId: string | null;
  employeeCode: string | null;
  email: string | null;
  accountStatus: string | null;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  displayName: string;
  roleCodes: string[];
  organization: {
    businessUnitCode: string | null;
    businessUnitName: string | null;
    positionCode: string | null;
    positionName: string | null;
    jobLevelId: string | null;
    jobLevelCode: string | null;
    jobLevelName: string | null;
    jobGradeId: string | null;
    gradeNumber: number | null;
    jobGradeName: string | null;
  };
};

export type AccessControlOverview = {
  counts: {
    users: number;
    roles: number;
    permissions: number;
    adminRoles: number;
  };
  roles: AccessControlRole[];
  permissions: AccessControlPermission[];
  users: AccessControlUser[];
  rules: {
    baseRole: string;
    superAdminRole: string;
    employeeBaseRoleIsMandatory: boolean;
    superAdminIndependentFromOrganization: boolean;
    gradeOverridesLevel: boolean;
    note: string;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

async function requestJson<T>(
  path: string,
  label: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${AUTH_API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
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

export function fetchAccessControlOverview(signal?: AbortSignal) {
  return requestJson<AccessControlOverview>(
    "/api/super-admin/access-control/overview",
    "Access Control",
    { signal }
  );
}

export function updateAccessControlUserRoles(
  userId: string,
  roleCodes: string[]
) {
  return requestJson<{
    userId: string;
    roleCodes: string[];
    enforcedBaseRole: boolean;
  }>(
    `/api/super-admin/access-control/users/${encodeURIComponent(userId)}/roles`,
    "Update user roles",
    {
      method: "PUT",
      body: JSON.stringify({ roleCodes }),
    }
  );
}

export type LevelGradePermission = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  group: string;
};

export type JobLevelPermissionPolicy = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  permissionCodes: string[];
};

export type JobGradePermissionOverride = {
  permissionCode: string;
  effect: "GRANT" | "REVOKE";
};

export type JobGradePermissionPolicy = {
  id: string;
  gradeNumber: number;
  name: string;
  sortOrder: number;
  jobLevelId: string;
  jobLevelCode: string;
  jobLevelName: string;
  overrides: JobGradePermissionOverride[];
};

export type OrganizationPermissionPolicy = {
  permissions: LevelGradePermission[];
  levels: JobLevelPermissionPolicy[];
  grades: JobGradePermissionPolicy[];
  rules: {
    rolePermissionsAreAdditive: boolean;
    levelProvidesDefaults: boolean;
    gradeOverridesLevel: boolean;
    gradeEffects: string[];
    rolePermissionsCannotBeRevokedByOrganizationPolicy: boolean;
  };
};

export function fetchOrganizationPermissionPolicy(signal?: AbortSignal) {
  return requestJson<OrganizationPermissionPolicy>(
    "/api/super-admin/access-control/organization-policy",
    "Level / Grade permission policy",
    { signal }
  );
}

export function updateJobLevelPermissionPolicy(
  jobLevelId: string,
  permissionCodes: string[]
) {
  return requestJson<{
    jobLevelId: string;
    permissionCodes: string[];
  }>(
    `/api/super-admin/access-control/organization-policy/levels/${encodeURIComponent(jobLevelId)}`,
    "Update Job Level permission policy",
    {
      method: "PUT",
      body: JSON.stringify({ permissionCodes }),
    }
  );
}

export function updateJobGradePermissionPolicy(
  jobGradeId: string,
  overrides: JobGradePermissionOverride[]
) {
  return requestJson<{
    jobGradeId: string;
    overrides: JobGradePermissionOverride[];
  }>(
    `/api/super-admin/access-control/organization-policy/grades/${encodeURIComponent(jobGradeId)}`,
    "Update Job Grade permission policy",
    {
      method: "PUT",
      body: JSON.stringify({ overrides }),
    }
  );
}

export type EffectivePermissionSource = {
  type: "ROLE" | "LEVEL" | "GRADE";
  code: string;
  effect: string;
};

export type EffectivePermissionItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  group: string;
  policyEligible: boolean;
  roleGranted: boolean;
  roleCodes: string[];
  levelGranted: boolean;
  gradeEffect: "INHERIT" | "GRANT" | "REVOKE";
  organizationGranted: boolean;
  effective: boolean;
  sources: EffectivePermissionSource[];
};

export type EffectivePermissionEvaluation = {
  roleCodes: string[];
  jobLevelId: string | null;
  jobGradeId: string | null;
  permissions: EffectivePermissionItem[];
  counts: {
    total: number;
    effective: number;
    roleGranted: number;
    organizationGranted: number;
    gradeOverrides: number;
  };
};

export type UserEffectivePermissionPreview = {
  mode: "ACTUAL_USER";
  user: {
    id: string;
    employeeId: string | null;
    employeeCode: string | null;
    email: string | null;
    displayName: string;
    accountStatus: string | null;
    employeeStatus: string | null;
  };
  organization: {
    businessUnitId: string | null;
    businessUnitCode: string | null;
    businessUnitName: string | null;
    positionId: string | null;
    positionCode: string | null;
    positionName: string | null;
    jobLevelId: string | null;
    jobLevelCode: string | null;
    jobLevelName: string | null;
    jobGradeId: string | null;
    gradeNumber: number | null;
    jobGradeName: string | null;
  };
  evaluation: EffectivePermissionEvaluation;
  rules: {
    readOnly: boolean;
    rolePermissionsAreAdditive: boolean;
    gradeOverridesLevel: boolean;
    gradeCannotRevokeRole: boolean;
  };
};

export type SimulatedEffectivePermissionPreview = {
  mode: "SIMULATION";
  selection: {
    roleCodes: string[];
    jobLevelId: string | null;
    jobGradeId: string | null;
  };
  evaluation: EffectivePermissionEvaluation;
  rules: {
    readOnly: boolean;
    persisted: boolean;
    rolePermissionsAreAdditive: boolean;
    gradeOverridesLevel: boolean;
    gradeCannotRevokeRole: boolean;
  };
};

export function fetchUserEffectivePermissionPreview(
  userId: string,
  signal?: AbortSignal
) {
  return requestJson<UserEffectivePermissionPreview>(
    `/api/super-admin/access-control/effective-preview/users/${encodeURIComponent(userId)}`,
    "Effective permission preview",
    { signal }
  );
}

export function simulateEffectivePermissionPreview(
  roleCodes: string[],
  jobLevelId: string | null,
  jobGradeId: string | null
) {
  return requestJson<SimulatedEffectivePermissionPreview>(
    "/api/super-admin/access-control/effective-preview/simulate",
    "Effective permission simulation",
    {
      method: "POST",
      body: JSON.stringify({
        roleCodes,
        jobLevelId,
        jobGradeId,
      }),
    }
  );
}

