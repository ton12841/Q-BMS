import {
  getPermissionManagementCounts,
  listPermissionManagementCatalog,
} from './permission-management.repository.js';

function mapPermission(row) {
  const roles = Array.isArray(row.roles) ? row.roles : [];

  return {
    id: String(row.id),
    code: row.code,
    name: row.name,
    description: row.description || null,
    group: row.permission_group || 'Other',
    levelGradePolicyEligible: Boolean(row.level_grade_policy_eligible),
    roleCount: Number(row.role_count || 0),
    activeRoleCount: Number(row.active_role_count || 0),
    roles: roles
      .filter((role) => role?.code)
      .sort((a, b) => String(a.code).localeCompare(String(b.code))),
  };
}

export async function getPermissionManagementOverview() {
  const [counts, permissions] = await Promise.all([
    getPermissionManagementCounts(),
    listPermissionManagementCatalog(),
  ]);

  return {
    counts: {
      totalPermissions: Number(counts.total_permissions || 0),
      permissionGroups: Number(counts.permission_groups || 0),
      policyEligible: Number(counts.policy_eligible || 0),
      unusedPermissions: Number(counts.unused_permissions || 0),
    },
    permissions: permissions.map(mapPermission),
    mode: 'READ_ONLY_FOUNDATION',
    rules: {
      permissionCodeImmutable: true,
      createDisabled: true,
      deleteDisabled: true,
      metadataEditDisabled: true,
      roleMembershipManagedInRoleManagement: true,
      levelGradePolicyManagedInOrganizationPolicy: true,
    },
  };
}
