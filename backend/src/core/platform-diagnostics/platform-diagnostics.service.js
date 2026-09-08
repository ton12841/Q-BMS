import {
  checkTablePresence,
  databasePing,
  getAccessIntegrity,
  getAuditIntegrity,
  getConfigurationIntegrity,
  getOnboardingIntegrity,
  getOrganizationIntegrity,
  getPlatformRegistryIntegrity,
  getPlatformHardeningIntegrity,
  getReportingLinesIntegrity,
} from './platform-diagnostics.repository.js';

const CORE_TABLES = [
  'users',
  'employees',
  'roles',
  'permissions',
  'user_roles',
  'role_permissions',
  'audit_logs',
];

const ORGANIZATION_TABLES = [
  'business_units',
  'job_levels',
  'job_grades',
  'positions',
  'position_job_grades',
  'employee_assignments',
  'employee_reporting_lines',
];

const ONBOARDING_TABLES = [
  'employee_profile_details',
  'employee_emergency_contacts',
  'employee_bank_accounts',
  'employee_policy_acknowledgements',
  'onboarding_cases',
  'onboarding_tasks',
  'onboarding_reviews',
];

const SUPER_ADMIN_TABLES = [
  'platform_registry_items',
  'system_configuration_registry',
];

function check({
  code,
  category,
  name,
  status,
  summary,
  details = {},
}) {
  return {
    code,
    category,
    name,
    status,
    summary,
    details,
  };
}

async function safeCheck(run, fallback) {
  try {
    return await run();
  } catch (error) {
    return fallback(error);
  }
}

function missingTables(rows) {
  return rows.filter((row) => !row.exists).map((row) => row.table_name);
}

export async function getPlatformDiagnosticsOverview() {
  const checks = [];

  const dbResult = await safeCheck(
    () => databasePing(),
    (error) => ({ error })
  );

  if (dbResult.error) {
    checks.push(
      check({
        code: 'DATABASE_CONNECTIVITY',
        category: 'Platform',
        name: 'Database Connectivity',
        status: 'FAIL',
        summary: dbResult.error.message || 'Database query failed.',
      })
    );

    return {
      overallStatus: 'FAIL',
      generatedAt: new Date().toISOString(),
      counts: {
        ready: 0,
        waiting: 0,
        warning: 0,
        fail: 1,
      },
      checks,
      mode: 'READ_ONLY',
    };
  }

  checks.push(
    check({
      code: 'DATABASE_CONNECTIVITY',
      category: 'Platform',
      name: 'Database Connectivity',
      status: 'READY',
      summary: 'PostgreSQL connection is responding.',
      details: {
        databaseName: dbResult.database_name,
        databaseUser: dbResult.database_user,
        databaseTime: dbResult.database_time,
      },
    })
  );

  for (const [code, category, name, tableNames] of [
    ['CORE_SCHEMA', 'Platform', 'Core Schema', CORE_TABLES],
    ['ORGANIZATION_SCHEMA', 'Organization', 'Organization Schema', ORGANIZATION_TABLES],
    ['ONBOARDING_SCHEMA', 'Onboarding', 'Onboarding Schema', ONBOARDING_TABLES],
    ['SUPER_ADMIN_SCHEMA', 'Super Admin', 'Super Admin Schema', SUPER_ADMIN_TABLES],
  ]) {
    const rows = await safeCheck(
      () => checkTablePresence(tableNames),
      (error) => ({ error })
    );

    if (rows.error) {
      checks.push(
        check({
          code,
          category,
          name,
          status: 'FAIL',
          summary: rows.error.message || 'Schema inspection failed.',
        })
      );
      continue;
    }

    const missing = missingTables(rows);

    checks.push(
      check({
        code,
        category,
        name,
        status: missing.length ? 'FAIL' : 'READY',
        summary: missing.length
          ? `Missing tables: ${missing.join(', ')}`
          : `${tableNames.length} required tables found.`,
        details: {
          required: tableNames,
          missing,
        },
      })
    );
  }

  const access = await safeCheck(
    () => getAccessIntegrity(),
    (error) => ({ error })
  );

  if (access.error) {
    checks.push(
      check({
        code: 'ACCESS_MODEL',
        category: 'Access',
        name: 'Access Model',
        status: 'FAIL',
        summary: access.error.message || 'Access integrity check failed.',
      })
    );
  } else {
    const expected = access.expectedPermissions.length;
    const permissionCount = Number(access.expected_permission_count || 0);
    const bindingCount = Number(access.super_admin_binding_count || 0);

    const accessReady =
      Boolean(access.employee_role_exists) &&
      Boolean(access.super_admin_role_exists) &&
      permissionCount === expected &&
      bindingCount === expected;

    checks.push(
      check({
        code: 'ACCESS_MODEL',
        category: 'Access',
        name: 'Access Model',
        status: accessReady ? 'READY' : 'FAIL',
        summary: accessReady
          ? 'Base roles and Super Admin system permissions are consistent.'
          : 'Role or Super Admin permission binding is incomplete.',
        details: {
          employeeRole: Boolean(access.employee_role_exists),
          superAdminRole: Boolean(access.super_admin_role_exists),
          expectedSystemPermissions: expected,
          permissionsFound: permissionCount,
          superAdminBindings: bindingCount,
        },
      })
    );
  }

  const organization = await safeCheck(
    () => getOrganizationIntegrity(),
    (error) => ({ error })
  );

  if (organization.error) {
    checks.push(
      check({
        code: 'ORGANIZATION_MASTER',
        category: 'Organization',
        name: 'Organization Master',
        status: 'FAIL',
        summary: organization.error.message || 'Organization master check failed.',
      })
    );
  } else {
    const levels = Number(organization.canonical_levels || 0);
    const grades = Number(organization.canonical_grades || 0);
    const positions = Number(organization.active_positions || 0);
    const businessUnits = Number(organization.active_business_units || 0);

    let status = 'READY';
    let summary = 'Canonical Level / Grade master is ready.';

    if (levels !== 6 || grades !== 14 || businessUnits < 1) {
      status = 'FAIL';
      summary = 'Canonical Organization master data is incomplete.';
    } else if (positions === 0) {
      status = 'WAITING';
      summary =
        'Level / Grade is ready; Position Master is waiting for real company positions.';
    }

    checks.push(
      check({
        code: 'ORGANIZATION_MASTER',
        category: 'Organization',
        name: 'Organization Master',
        status,
        summary,
        details: {
          canonicalLevels: levels,
          canonicalGrades: grades,
          activeBusinessUnits: businessUnits,
          activePositions: positions,
          departmentStatus: 'HOLD',
        },
      })
    );
  }


  const reporting = await safeCheck(
    () => getReportingLinesIntegrity(),
    (error) => ({ error })
  );

  if (reporting.error) {
    checks.push(
      check({
        code: 'REPORTING_LINES_MANAGEMENT',
        category: 'Organization',
        name: 'Reporting Lines Management',
        status: 'FAIL',
        summary: reporting.error.message || 'Reporting Lines integrity check failed.',
      })
    );
  } else {
    const permissionCount = Number(reporting.permission_count || 0);
    const hrBindings = Number(reporting.hr_bindings || 0);
    const reportingIndexes = Number(reporting.reporting_indexes || 0);
    const activeAssignments = Number(reporting.active_assignments || 0);
    const activeLines = Number(reporting.active_lines || 0);
    const invalidCurrentLines = Number(reporting.invalid_current_lines || 0);

    const technicallyReady =
      permissionCount === 2 &&
      hrBindings === 2 &&
      reportingIndexes === 3 &&
      invalidCurrentLines === 0;

    checks.push(
      check({
        code: 'REPORTING_LINES_MANAGEMENT',
        category: 'Organization',
        name: 'Reporting Lines Management',
        status: !technicallyReady ? 'FAIL' : activeAssignments === 0 ? 'WAITING' : 'READY',
        summary: !technicallyReady
          ? 'Reporting Lines management foundation is incomplete.'
          : activeAssignments === 0
            ? 'Reporting Lines management is ready; waiting for real Position / Employee Assignment data.'
            : `Reporting Lines management is ready with ${activeLines} active relationship(s).`,
        details: {
          permissions: permissionCount,
          hrBindings,
          reportingIndexes,
          activeAssignments,
          activeLines,
          invalidCurrentLines,
          departmentStatus: 'HOLD',
          futureEffectiveDates: false,
        },
      })
    );
  }

  const registry = await safeCheck(
    () => getPlatformRegistryIntegrity(),
    (error) => ({ error })
  );

  if (registry.error) {
    checks.push(
      check({
        code: 'PLATFORM_REGISTRY',
        category: 'Super Admin',
        name: 'Module / Tool Registry',
        status: 'FAIL',
        summary: registry.error.message || 'Platform Registry check failed.',
      })
    );
  } else {
    const modules = Number(registry.modules || 0);
    const tools = Number(registry.tools || 0);
    const crmHold = Number(registry.crm_hold || 0) === 1;

    const ready = modules === 10 && tools === 9 && crmHold;

    checks.push(
      check({
        code: 'PLATFORM_REGISTRY',
        category: 'Super Admin',
        name: 'Module / Tool Registry',
        status: ready ? 'READY' : 'FAIL',
        summary: ready
          ? '10 Modules / 9 Tools registered and CRM remains HOLD.'
          : 'Platform Registry does not match the canonical Q BMS registry.',
        details: {
          modules,
          tools,
          totalItems: Number(registry.total_items || 0),
          crmHold,
        },
      })
    );
  }

  const configuration = await safeCheck(
    () => getConfigurationIntegrity(),
    (error) => ({ error })
  );

  if (configuration.error) {
    checks.push(
      check({
        code: 'SYSTEM_CONFIGURATION',
        category: 'Super Admin',
        name: 'System Configuration',
        status: 'FAIL',
        summary:
          configuration.error.message || 'System Configuration check failed.',
      })
    );
  } else {
    const totalSettings = Number(configuration.total_settings || 0);
    const departmentHold = Number(configuration.department_hold || 0) === 1;
    const crmHold = Number(configuration.crm_hold || 0) === 1;
    const localesMatch = Number(configuration.locales_match || 0) === 1;

    const ready =
      totalSettings >= 10 &&
      departmentHold &&
      crmHold &&
      localesMatch;

    checks.push(
      check({
        code: 'SYSTEM_CONFIGURATION',
        category: 'Super Admin',
        name: 'System Configuration',
        status: ready ? 'READY' : 'FAIL',
        summary: ready
          ? 'Canonical non-secret platform settings are consistent.'
          : 'Canonical configuration registry is incomplete or inconsistent.',
        details: {
          totalSettings,
          lockedSettings: Number(configuration.locked_settings || 0),
          departmentHold,
          crmHold,
          localesMatch,
        },
      })
    );
  }

  const hardening = await safeCheck(
    () => getPlatformHardeningIntegrity(),
    (error) => ({ error })
  );

  if (hardening.error) {
    checks.push(
      check({
        code: 'PLATFORM_HARDENING',
        category: 'Governance',
        name: 'Platform Hardening Baseline',
        status: 'FAIL',
        summary: hardening.error.message || 'Platform hardening integrity check failed.',
      })
    );
  } else {
    const constraintCount = Number(hardening.integrity_constraints || 0);
    const expectedConstraintCount = Number(hardening.expectedConstraintCount || 0);
    const organizationPermissions = Number(hardening.organization_permissions || 0);
    const hrOrgViewBinding = Number(hardening.hr_org_view_binding || 0);
    const ready =
      constraintCount === expectedConstraintCount &&
      organizationPermissions === 2 &&
      hrOrgViewBinding === 1;

    checks.push(
      check({
        code: 'PLATFORM_HARDENING',
        category: 'Governance',
        name: 'Platform Hardening Baseline',
        status: ready ? 'READY' : 'FAIL',
        summary: ready
          ? 'Organization access guards and onboarding/HRM integrity constraints are ready.'
          : 'Platform hardening baseline is incomplete.',
        details: {
          integrityConstraints: constraintCount,
          expectedIntegrityConstraints: expectedConstraintCount,
          organizationPermissions,
          hrOrganizationViewBinding: hrOrgViewBinding,
        },
      })
    );
  }

  const audit = await safeCheck(
    () => getAuditIntegrity(),
    (error) => ({ error })
  );

  if (audit.error) {
    checks.push(
      check({
        code: 'AUDIT_INFRASTRUCTURE',
        category: 'Governance',
        name: 'Audit Infrastructure',
        status: 'FAIL',
        summary: audit.error.message || 'Audit Log check failed.',
      })
    );
  } else {
    checks.push(
      check({
        code: 'AUDIT_INFRASTRUCTURE',
        category: 'Governance',
        name: 'Audit Infrastructure',
        status: 'READY',
        summary: 'Audit Log storage is available.',
        details: {
          auditEvents: Number(audit.audit_events || 0),
          latestEventAt: audit.latest_event_at || null,
        },
      })
    );
  }

  const onboarding = await safeCheck(
    () => getOnboardingIntegrity(),
    (error) => ({ error })
  );

  if (onboarding.error) {
    checks.push(
      check({
        code: 'ONBOARDING_FOUNDATION',
        category: 'Onboarding',
        name: 'Employee Onboarding Foundation',
        status: 'FAIL',
        summary: onboarding.error.message || 'Onboarding check failed.',
      })
    );
  } else {
    checks.push(
      check({
        code: 'ONBOARDING_FOUNDATION',
        category: 'Onboarding',
        name: 'Employee Onboarding Foundation',
        status: 'READY',
        summary:
          'Onboarding tables and lifecycle foundation are available. End-to-end validation still depends on real Position Master data.',
        details: {
          activeEmployees: Number(onboarding.active_employees || 0),
          onboardingCases: Number(onboarding.onboarding_cases || 0),
          onboardingTasks: Number(onboarding.onboarding_tasks || 0),
        },
      })
    );
  }

  const counts = checks.reduce(
    (acc, item) => {
      if (item.status === 'READY') acc.ready += 1;
      else if (item.status === 'WAITING') acc.waiting += 1;
      else if (item.status === 'WARN') acc.warning += 1;
      else if (item.status === 'FAIL') acc.fail += 1;
      return acc;
    },
    { ready: 0, waiting: 0, warning: 0, fail: 0 }
  );

  const overallStatus =
    counts.fail > 0
      ? 'FAIL'
      : counts.warning > 0
        ? 'WARNING'
        : counts.waiting > 0
          ? 'READY_WITH_WAITING'
          : 'READY';

  return {
    overallStatus,
    generatedAt: new Date().toISOString(),
    counts,
    checks,
    mode: 'READ_ONLY',
    rules: {
      diagnosticsDoNotMutateData: true,
      waitingIsNotSystemFailure: true,
      positionMasterPendingIsExpected: true,
      departmentHoldIsExpected: true,
    },
  };
}
