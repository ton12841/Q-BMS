import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/config/database/postgres.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(
  here,
  '../../database/migrations/20260903_006_access_control_foundation.sql'
);

try {
  const sql = await fs.readFile(sqlPath, 'utf8');
  await db.query(sql);

  const result = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM roles WHERE code IN (
        'EMPLOYEE',
        'HR_EMPLOYEE_ADMIN',
        'IT_ACCOUNT_ADMIN',
        'INVENTORY_ADMIN',
        'PROCUREMENT_ADMIN',
        'FINANCE_ADMIN',
        'INSTALLATION_ADMIN',
        'MANAGEMENT_ADMIN',
        'SUPER_ADMIN'
      )) AS canonical_roles,
      (SELECT COUNT(*)::int FROM permissions WHERE code IN (
        'employee.workspace.access',
        'employee.profile.self.view',
        'employee.profile.self.edit',
        'employee.employment.self.view',
        'employee.documents.self.view',
        'employee.assets.self.view',
        'organization.directory.view',
        'employee.master.manage',
        'tool.hrm.access',
        'tool.it_admin.access',
        'tool.inventory.access',
        'tool.procurement.access',
        'tool.finance.access',
        'tool.installation.access',
        'tool.management.access',
        'system.access_control.view',
        'system.access_control.manage',
        'system.super_admin'
      )) AS canonical_permissions
  `);

  const summary = result.rows[0];
  console.log(
    `Q BMS v2.2.0.0 Access Control foundation applied: ` +
    `${summary.canonical_roles} canonical roles, ` +
    `${summary.canonical_permissions} canonical permissions.`
  );
} finally {
  if (typeof db.end === 'function') {
    await db.end();
  }
}
