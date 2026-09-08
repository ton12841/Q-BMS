import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/config/database/postgres.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.resolve(
  here,
  '../../database/migrations/20260903_015_platform_hardening_baseline.sql'
);

try {
  const sql = await fs.readFile(migrationPath, 'utf8');
  await db.query(sql);

  const result = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM permissions WHERE code IN (
        'organization.master.view',
        'organization.master.manage'
      )) AS organization_permissions,
      (SELECT COUNT(*)::int FROM employee_reporting_lines
       WHERE relationship_type = 'PRIMARY'
         AND status = 'ACTIVE'
         AND effective_to IS NULL) AS active_primary_reporting_lines,
      (SELECT COUNT(*)::int
       FROM pg_constraint
       WHERE conname IN (
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
         'fk_activation_events_actor'
       )) AS integrity_constraints
  `);

  const row = result.rows[0];
  if (Number(row.organization_permissions) !== 2) {
    throw new Error('Organization permission migration verification failed.');
  }
  if (Number(row.integrity_constraints) !== 23) {
    throw new Error(
      `Data-integrity verification failed: expected 23 constraints, got ${row.integrity_constraints}.`
    );
  }

  console.log(
    `Q BMS v2.2.14.0 hardening migration applied: ` +
    `${row.organization_permissions} Organization permissions, ` +
    `${row.integrity_constraints} integrity constraints, ` +
    `${row.active_primary_reporting_lines} active primary reporting lines.`
  );
} finally {
  if (typeof db.end === 'function') {
    await db.end();
  }
}
