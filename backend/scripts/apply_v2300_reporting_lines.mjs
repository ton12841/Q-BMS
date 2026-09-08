import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/config/database/postgres.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.resolve(
  here,
  '../../database/migrations/20260903_016_reporting_lines_management.sql'
);

try {
  const sql = await fs.readFile(migrationPath, 'utf8');
  await db.query(sql);

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
       FROM role_permissions rp
       JOIN roles r ON r.id = rp.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE r.code = 'SUPER_ADMIN'
         AND p.code IN (
           'organization.reporting_lines.view',
           'organization.reporting_lines.manage'
         )) AS super_admin_bindings,

      (SELECT COUNT(*)::int
       FROM pg_indexes
       WHERE schemaname = 'public'
         AND indexname IN (
           'uq_employee_current_primary_reporting_line',
           'uq_employee_current_reporting_pair',
           'idx_employee_reporting_lines_effective_dates'
         )) AS reporting_indexes
  `);

  const row = result.rows[0];
  if (Number(row.permission_count) !== 2) {
    throw new Error('Reporting Lines permission verification failed.');
  }
  if (Number(row.hr_bindings) !== 2 || Number(row.super_admin_bindings) !== 2) {
    throw new Error('Reporting Lines role binding verification failed.');
  }
  if (Number(row.reporting_indexes) !== 3) {
    throw new Error('Reporting Lines index verification failed.');
  }

  console.log(
    `Q BMS v2.3.0.0 Reporting Lines migration applied: ` +
    `${row.permission_count} permissions, ` +
    `${row.hr_bindings} HR bindings, ` +
    `${row.reporting_indexes} reporting indexes.`
  );
} finally {
  if (typeof db.end === 'function') await db.end();
}
