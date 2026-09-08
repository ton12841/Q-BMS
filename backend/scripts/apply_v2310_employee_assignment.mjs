import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/config/database/postgres.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(
  here,
  '../../database/migrations/20260904_017_employee_organization_assignment_management.sql'
);

try {
  const sql = await fs.readFile(sqlPath, 'utf8');
  await db.query(sql);

  const result = await db.query(`
    SELECT
      COUNT(*) FILTER (
        WHERE code IN (
          'employee.master.view',
          'employee.master.manage',
          'employee.organization_assignment.view',
          'employee.organization_assignment.manage'
        )
      )::int AS permissions,
      (
        SELECT COUNT(*)::int
        FROM role_permissions rp
        JOIN roles r ON r.id = rp.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE r.code = 'HR_EMPLOYEE_ADMIN'
          AND p.code IN (
            'employee.master.view',
            'employee.master.manage',
            'employee.organization_assignment.view',
            'employee.organization_assignment.manage'
          )
      ) AS hr_bindings
    FROM permissions
  `);

  console.log(
    `Q BMS v2.3.1.0 Employee Organization Assignment migration applied: ` +
    `${result.rows[0].permissions} permissions, ${result.rows[0].hr_bindings} HR bindings.`
  );
} finally {
  if (typeof db.end === 'function') await db.end();
}
