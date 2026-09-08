import { db } from '../../config/database/postgres.js';

export async function databasePing() {
  const result = await db.query(`
    SELECT
      NOW() AS database_time,
      current_database() AS database_name,
      current_user AS database_user
  `);

  return result.rows[0];
}

export async function checkTablePresence(tableNames) {
  const result = await db.query(
    `
      SELECT
        requested.table_name,
        to_regclass('public.' || requested.table_name) IS NOT NULL AS exists
      FROM unnest($1::text[]) AS requested(table_name)
      ORDER BY requested.table_name
    `,
    [tableNames]
  );

  return result.rows;
}

export async function getAccessIntegrity() {
  const expectedPermissions = [
    'system.user_identity.view',
    'system.audit_log.view',
    'system.role_management.view',
    'system.role_management.manage',
    'system.permission_management.view',
    'system.module_management.view',
    'system.configuration.view',
    'system.platform_diagnostics.view',
  ];

  const result = await db.query(
    `
      SELECT
        EXISTS(
          SELECT 1 FROM roles WHERE code = 'EMPLOYEE'
        ) AS employee_role_exists,
        EXISTS(
          SELECT 1 FROM roles WHERE code = 'SUPER_ADMIN'
        ) AS super_admin_role_exists,

        (
          SELECT COUNT(*)::int
          FROM permissions p
          WHERE p.code = ANY($1::text[])
        ) AS expected_permission_count,

        (
          SELECT COUNT(*)::int
          FROM role_permissions rp
          JOIN roles r ON r.id = rp.role_id
          JOIN permissions p ON p.id = rp.permission_id
          WHERE r.code = 'SUPER_ADMIN'
            AND p.code = ANY($1::text[])
        ) AS super_admin_binding_count
    `,
    [expectedPermissions]
  );

  return {
    ...result.rows[0],
    expectedPermissions,
  };
}

export async function getOrganizationIntegrity() {
  const result = await db.query(`
    SELECT
      (
        SELECT COUNT(*)::int
        FROM job_levels
        WHERE code IN (
          'LEVEL_0',
          'LEVEL_I',
          'LEVEL_II',
          'LEVEL_III',
          'LEVEL_IV',
          'LEVEL_V'
        )
      ) AS canonical_levels,

      (
        SELECT COUNT(DISTINCT grade_number)::int
        FROM job_grades
        WHERE grade_number BETWEEN 1 AND 14
      ) AS canonical_grades,

      (
        SELECT COUNT(*)::int
        FROM positions
        WHERE status = 'ACTIVE'
      ) AS active_positions,

      (
        SELECT COUNT(*)::int
        FROM business_units
        WHERE status = 'ACTIVE'
      ) AS active_business_units
  `);

  return result.rows[0];
}

export async function getPlatformRegistryIntegrity() {
  const result = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE item_type = 'MODULE')::int AS modules,
      COUNT(*) FILTER (WHERE item_type = 'TOOL')::int AS tools,
      COUNT(*) FILTER (
        WHERE code = 'CRM'
          AND lifecycle_status = 'HOLD'
          AND availability_status = 'RESERVED'
      )::int AS crm_hold,
      COUNT(*)::int AS total_items
    FROM platform_registry_items
  `);

  return result.rows[0];
}

export async function getConfigurationIntegrity() {
  const result = await db.query(`
    SELECT
      COUNT(*)::int AS total_settings,

      COUNT(*) FILTER (
        WHERE config_key = 'organization.department_module_status'
          AND value_json = '"HOLD"'::jsonb
      )::int AS department_hold,

      COUNT(*) FILTER (
        WHERE config_key = 'platform.crm_status'
          AND value_json = '"HOLD"'::jsonb
      )::int AS crm_hold,

      COUNT(*) FILTER (
        WHERE config_key = 'localization.supported_locales'
          AND value_json = '["en","lo","th"]'::jsonb
      )::int AS locales_match,

      COUNT(*) FILTER (
        WHERE mutability = 'LOCKED'
      )::int AS locked_settings
    FROM system_configuration_registry
  `);

  return result.rows[0];
}

export async function getAuditIntegrity() {
  const result = await db.query(`
    SELECT
      COUNT(*)::int AS audit_events,
      MAX(created_at) AS latest_event_at
    FROM audit_logs
  `);

  return result.rows[0];
}

export async function getOnboardingIntegrity() {
  const result = await db.query(`
    SELECT
      (
        SELECT COUNT(*)::int
        FROM employees
        WHERE employee_status = 'ACTIVE'
      ) AS active_employees,

      (
        SELECT COUNT(*)::int
        FROM onboarding_cases
      ) AS onboarding_cases,

      (
        SELECT COUNT(*)::int
        FROM onboarding_tasks
      ) AS onboarding_tasks
  `);

  return result.rows[0];
}

export async function getPlatformHardeningIntegrity() {
  const expectedConstraints = [
    'fk_employee_profile_details_employee',
    'fk_employee_emergency_contacts_employee',
    'fk_employee_bank_accounts_employee',
    'fk_employee_documents_employee',
    'fk_employee_policy_ack_employee',
    'fk_onboarding_cases_employee',
    'fk_onboarding_tasks_case',
    'fk_onboarding_tasks_employee',
    'fk_onboarding_reviews_case',
    'fk_onboarding_reviews_employee',
    'fk_onboarding_reviews_reviewer',
    'fk_asset_assignments_asset',
    'fk_asset_assignments_employee',
    'fk_asset_assignments_assigned_by',
    'fk_asset_assignments_returned_by',
    'fk_asset_gate_events_case',
    'fk_asset_gate_events_employee',
    'fk_asset_gate_events_asset',
    'fk_asset_gate_events_assignment',
    'fk_asset_gate_events_actor',
    'fk_activation_events_case',
    'fk_activation_events_employee',
    'fk_activation_events_actor',
  ];

  const result = await db.query(
    `SELECT
       (SELECT COUNT(*)::int
        FROM pg_constraint
        WHERE conname = ANY($1::text[])) AS integrity_constraints,
       (SELECT COUNT(*)::int
        FROM permissions
        WHERE code IN ('organization.master.view', 'organization.master.manage')) AS organization_permissions,
       (SELECT COUNT(*)::int
        FROM role_permissions rp
        JOIN roles r ON r.id = rp.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE r.code = 'HR_EMPLOYEE_ADMIN'
          AND p.code = 'organization.master.view') AS hr_org_view_binding`,
    [expectedConstraints]
  );

  return {
    ...result.rows[0],
    expectedConstraintCount: expectedConstraints.length,
  };
}



export async function getReportingLinesIntegrity() {
  const result = await db.query(`
    SELECT
      (SELECT COUNT(*)::int
       FROM permissions
       WHERE code IN (
         'organization.reporting_lines.view',
         'organization.reporting_lines.manage'
       )) AS permission_count,

      (SELECT COUNT(*)::int
       FROM role_permissions rp
       JOIN roles r ON r.id = rp.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE r.code = 'HR_EMPLOYEE_ADMIN'
         AND p.code IN (
           'organization.reporting_lines.view',
           'organization.reporting_lines.manage'
         )) AS hr_bindings,

      (SELECT COUNT(*)::int
       FROM pg_indexes
       WHERE schemaname = 'public'
         AND indexname IN (
           'uq_employee_current_primary_reporting_line',
           'uq_employee_current_reporting_pair',
           'idx_employee_reporting_lines_effective_dates'
         )) AS reporting_indexes,

      (SELECT COUNT(*)::int
       FROM employee_assignments ea
       JOIN employees e ON e.id = ea.employee_id
       WHERE e.archived_at IS NULL
         AND ea.is_primary = TRUE
         AND ea.assignment_status = 'ACTIVE'
         AND ea.effective_to IS NULL) AS active_assignments,

      (SELECT COUNT(*)::int
       FROM employee_reporting_lines
       WHERE status = 'ACTIVE'
         AND effective_to IS NULL) AS active_lines,

      (SELECT COUNT(*)::int
       FROM employee_reporting_lines rl
       LEFT JOIN employee_assignments child ON child.id = rl.employee_assignment_id
       LEFT JOIN employee_assignments manager ON manager.id = rl.reports_to_assignment_id
       WHERE rl.status = 'ACTIVE'
         AND rl.effective_to IS NULL
         AND (
           child.id IS NULL OR manager.id IS NULL
           OR child.assignment_status <> 'ACTIVE'
           OR manager.assignment_status <> 'ACTIVE'
           OR child.effective_to IS NOT NULL
           OR manager.effective_to IS NOT NULL
         )) AS invalid_current_lines
  `);

  return result.rows[0];
}
