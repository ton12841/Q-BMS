import {
  getAccessControlCounts,
  listAccessControlPermissions,
  listAccessControlRoles,
  listAccessControlUsers,
  replaceAssignableUserRoles,
  listOrganizationPermissionPolicy,
  replaceJobGradePermissionOverrides,
  replaceJobLevelPermissionGrants,
  getPermissionPreviewContext,
  evaluateEffectivePermissions,
  resolveSimulationSelection,
} from './access-control.repository.js';

function mapRole(row) {
  return {
    id: String(row.id),
    code: row.code,
    name: row.name,
    description: row.description || null,
    category: row.role_category || 'CUSTOM',
    isSystemRole: Boolean(row.is_system_role),
    isAssignable: Boolean(row.is_assignable),
    status: row.status,
    sortOrder: Number(row.sort_order || 0),
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
  };
}

function mapUser(row) {
  const displayName =
    [row.first_name, row.last_name].filter(Boolean).join(' ').trim() ||
    row.nickname ||
    row.email ||
    `User ${row.id}`;

  return {
    id: String(row.id),
    employeeId: row.employee_id ? String(row.employee_id) : null,
    employeeCode: row.employee_code || null,
    email: row.email || null,
    accountStatus: row.account_status || null,
    firstName: row.first_name || null,
    lastName: row.last_name || null,
    nickname: row.nickname || null,
    displayName,
    roleCodes: Array.isArray(row.role_codes) ? row.role_codes : [],
    organization: {
      businessUnitCode: row.business_unit_code || null,
      businessUnitName: row.business_unit_name || null,
      positionCode: row.position_code || null,
      positionName: row.position_name || null,
      jobLevelId: row.job_level_id ? String(row.job_level_id) : null,
      jobLevelCode: row.job_level_code || null,
      jobLevelName: row.job_level_name || null,
      jobGradeId: row.job_grade_id ? String(row.job_grade_id) : null,
      gradeNumber:
        row.grade_number === null || row.grade_number === undefined
          ? null
          : Number(row.grade_number),
      jobGradeName: row.job_grade_name || null,
    },
  };
}

export async function getAccessControlOverview() {
  const [counts, roles, permissions, users] = await Promise.all([
    getAccessControlCounts(),
    listAccessControlRoles(),
    listAccessControlPermissions(),
    listAccessControlUsers(),
  ]);

  return {
    counts: {
      users: Number(counts.user_count || 0),
      roles: Number(counts.role_count || 0),
      permissions: Number(counts.permission_count || 0),
      adminRoles: Number(counts.admin_role_count || 0),
    },
    roles: roles.map(mapRole),
    permissions: permissions.map(mapPermission),
    users: users.map(mapUser),
    rules: {
      baseRole: 'EMPLOYEE',
      superAdminRole: 'SUPER_ADMIN',
      employeeBaseRoleIsMandatory: true,
      superAdminIndependentFromOrganization: true,
      gradeOverridesLevel: true,
      note:
        'Level / Grade permission policy is a separate policy layer and will be implemented without changing Role assignment.',
    },
  };
}

export async function updateAccessControlUserRoles({
  userId,
  roleCodes,
  actorUserId,
}) {
  if (!Array.isArray(roleCodes)) {
    const error = new Error('roleCodes must be an array.');
    error.statusCode = 400;
    error.code = 'ACCESS_CONTROL_ROLE_CODES_REQUIRED';
    throw error;
  }

  return replaceAssignableUserRoles({
    userId,
    roleCodes,
    actorUserId,
  });
}

export async function getOrganizationPermissionPolicy() {
  const data = await listOrganizationPermissionPolicy();

  return {
    permissions: data.permissions.map((permission) => ({
      id: String(permission.id),
      code: permission.code,
      name: permission.name,
      description: permission.description || null,
      group: permission.permission_group || 'Employee Workspace',
    })),
    levels: data.levels.map((level) => ({
      id: String(level.id),
      code: level.code,
      name: level.name,
      description: level.description || null,
      sortOrder: Number(level.sort_order || 0),
      permissionCodes: Array.isArray(level.permission_codes)
        ? level.permission_codes
        : [],
    })),
    grades: data.grades.map((grade) => ({
      id: String(grade.id),
      gradeNumber: Number(grade.grade_number),
      name: grade.name,
      sortOrder: Number(grade.sort_order || 0),
      jobLevelId: String(grade.job_level_id),
      jobLevelCode: grade.job_level_code,
      jobLevelName: grade.job_level_name,
      overrides: Array.isArray(grade.overrides) ? grade.overrides : [],
    })),
    rules: {
      rolePermissionsAreAdditive: true,
      levelProvidesDefaults: true,
      gradeOverridesLevel: true,
      gradeEffects: ['GRANT', 'REVOKE'],
      rolePermissionsCannotBeRevokedByOrganizationPolicy: true,
    },
  };
}

export async function updateJobLevelPermissionPolicy({
  jobLevelId,
  permissionCodes,
  actorUserId,
}) {
  if (!Array.isArray(permissionCodes)) {
    const error = new Error('permissionCodes must be an array.');
    error.statusCode = 400;
    error.code = 'JOB_LEVEL_PERMISSION_CODES_REQUIRED';
    throw error;
  }

  return replaceJobLevelPermissionGrants({
    jobLevelId,
    permissionCodes,
    actorUserId,
  });
}

export async function updateJobGradePermissionPolicy({
  jobGradeId,
  overrides,
  actorUserId,
}) {
  if (!Array.isArray(overrides)) {
    const error = new Error('overrides must be an array.');
    error.statusCode = 400;
    error.code = 'JOB_GRADE_OVERRIDES_REQUIRED';
    throw error;
  }

  return replaceJobGradePermissionOverrides({
    jobGradeId,
    overrides,
    actorUserId,
  });
}

export async function getUserEffectivePermissionPreview(userId) {
  const context = await getPermissionPreviewContext(userId);

  if (!context) {
    const error = new Error('Q BMS user was not found.');
    error.statusCode = 404;
    error.code = 'PERMISSION_PREVIEW_USER_NOT_FOUND';
    throw error;
  }

  const evaluation = await evaluateEffectivePermissions({
    userId,
    jobLevelId: context.job_level_id || null,
    jobGradeId: context.job_grade_id || null,
  });

  const displayName =
    [context.first_name, context.last_name].filter(Boolean).join(' ').trim() ||
    context.nickname ||
    context.email ||
    `User ${context.id}`;

  return {
    mode: 'ACTUAL_USER',
    user: {
      id: String(context.id),
      employeeId: context.employee_id ? String(context.employee_id) : null,
      employeeCode: context.employee_code || null,
      email: context.email || null,
      displayName,
      accountStatus: context.account_status || null,
      employeeStatus: context.employee_status || null,
    },
    organization: {
      businessUnitId: context.business_unit_id
        ? String(context.business_unit_id)
        : null,
      businessUnitCode: context.business_unit_code || null,
      businessUnitName: context.business_unit_name || null,
      positionId: context.position_id ? String(context.position_id) : null,
      positionCode: context.position_code || null,
      positionName: context.position_name || null,
      jobLevelId: context.job_level_id ? String(context.job_level_id) : null,
      jobLevelCode: context.job_level_code || null,
      jobLevelName: context.job_level_name || null,
      jobGradeId: context.job_grade_id ? String(context.job_grade_id) : null,
      gradeNumber:
        context.grade_number === null || context.grade_number === undefined
          ? null
          : Number(context.grade_number),
      jobGradeName: context.job_grade_name || null,
    },
    evaluation,
    rules: {
      readOnly: true,
      rolePermissionsAreAdditive: true,
      gradeOverridesLevel: true,
      gradeCannotRevokeRole: true,
    },
  };
}

export async function simulateEffectivePermissionPreview({
  roleCodes,
  jobLevelId,
  jobGradeId,
}) {
  const selection = await resolveSimulationSelection({
    roleCodes,
    jobLevelId,
    jobGradeId,
  });

  const evaluation = await evaluateEffectivePermissions({
    roleCodes: selection.roleCodes,
    jobLevelId: selection.jobLevelId,
    jobGradeId: selection.jobGradeId,
  });

  return {
    mode: 'SIMULATION',
    selection,
    evaluation,
    rules: {
      readOnly: true,
      persisted: false,
      rolePermissionsAreAdditive: true,
      gradeOverridesLevel: true,
      gradeCannotRevokeRole: true,
    },
  };
}

