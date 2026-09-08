import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/config/database/postgres.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(
  here,
  '../../database/migrations/20260903_007_level_grade_permission_policy.sql'
);

try {
  const sql = await fs.readFile(sqlPath, 'utf8');
  await db.query(sql);

  const result = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM permissions WHERE level_grade_policy_eligible = TRUE) AS eligible_permissions,
      (SELECT COUNT(*)::int FROM job_levels WHERE status = 'ACTIVE') AS active_levels,
      (SELECT COUNT(*)::int FROM job_grades WHERE status = 'ACTIVE') AS active_grades
  `);

  const row = result.rows[0];
  console.log(
    `Q BMS v2.2.1.0 Level / Grade Permission Policy applied: ` +
    `${row.eligible_permissions} eligible permissions, ` +
    `${row.active_levels} levels, ${row.active_grades} grades.`
  );
} finally {
  if (typeof db.end === 'function') {
    await db.end();
  }
}
