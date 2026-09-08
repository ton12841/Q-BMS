import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/config/database/postgres.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(
  here,
  '../../database/migrations/20260908_018_organization_chart_read_only.sql'
);

try {
  const sql = await fs.readFile(sqlPath, 'utf8');
  await db.query(sql);

  const result = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE code = 'organization.chart.view')::int AS permissions,
      (
        SELECT COUNT(*)::int
        FROM role_permissions rp
        JOIN roles r ON r.id = rp.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE p.code = 'organization.chart.view'
          AND r.code IN ('EMPLOYEE', 'HR_EMPLOYEE_ADMIN', 'SUPER_ADMIN')
      ) AS bindings
    FROM permissions
  `);

  console.log(
    `Q BMS v2.3.2.0 Organization Chart migration applied: ` +
    `${result.rows[0].permissions} permission, ${result.rows[0].bindings} role bindings.`
  );
} finally {
  if (typeof db.end === 'function') await db.end();
}
