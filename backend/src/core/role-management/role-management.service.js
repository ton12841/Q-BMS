import {
  createCustomAdminRole,
  getRoleManagementCounts,
  listRoleManagementPermissions,
  listRoleManagementRoles,
  updateRoleManagementRole,
} from './role-management.repository.js';

function mapRole(row) {
  const protectedRole =
    row.code === 'EMPLOYEE' ||
    row.code === 'SUPER_ADMIN' ||
    row.role_category !== 'ADMIN';

  return {
    id: String(row.id),
    code: row.code,
    name: row.name,
    description: row.description || null,
    category: row.role_category,
    isSystemRole: Boolean(row.is_system_role),
    isAssignable: Boolean(row.is_assignable),
    status: row.status,
    sortOrder: Number(row.sort_order || 0),
    assignedUserCount: Number(row.assigned_user_count || 0),
    isProtected: protectedRole,
    canEditDefinition:
      row.role_category === 'ADMIN' && !row.is_system_role,
    canEditPermissions:
      row.role_category === 'ADMIN' &&
      row.code !== 'SUPER_ADMIN',
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
  };
}

function mapPermission(row) {
  return {
    id: String(row.id),
    code: row.code,
    name: row.name,
    description: row.description || null,
    group: row.permission_group || 'Other',
    levelGradePolicyEligible: Boolean(row.level_grade_policy_eligible),
  };
}

export async function getRoleManagementOverview() {
  const [counts, roles, permissions] = await Promise.all([
    getRoleManagementCounts(),
    listRoleManagementRoles(),
    listRoleManagementPermissions(),
  ]);

  return {
    counts: {
      totalRoles: Number(counts.total_roles || 0),
      systemRoles: Number(counts.system_roles || 0),
      customRoles: Number(counts.custom_roles || 0),
      activeRoles: Number(counts.active_roles || 0),
      permissions: Number(counts.permission_count || 0),
    },
    roles: roles.map(mapRole),
    permissions: permissions.map(mapPermission),
    rules: {
      employeeRoleProtected: true,
      superAdminRoleProtected: true,
      systemAdminRoleDefinitionLocked: true,
      systemAdminRolePermissionsEditable: true,
      customRoleCategory: 'ADMIN',
      hardDeleteDisabled: true,
    },
  };
}

export async function createRoleManagementRole(input) {
  return createCustomAdminRole(input);
}

export async function updateRoleManagementRoleService(input) {
  return updateRoleManagementRole(input);
}
