import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/config/database/postgres.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(
  here,
  '../../database/migrations/20260902_005_organization_level_grade_master.sql'
);

const requiredTables = ['job_levels', 'job_grades'];

try {
  const tableCheck = await db.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = ANY($1::text[])
  `, [requiredTables]);

  const existing = new Set(tableCheck.rows.map((row) => row.table_name));
  const missing = requiredTables.filter((name) => !existing.has(name));

  if (missing.length) {
    throw new Error(
      `Organization schema is incomplete. Missing table(s): ${missing.join(', ')}`
    );
  }

  const sql = await fs.readFile(sqlPath, 'utf8');
  await db.query(sql);

  const summary = await db.query(`
    SELECT
      (SELECT COUNT(*)::int
         FROM job_levels
        WHERE code IN ('LEVEL_0', 'LEVEL_I', 'LEVEL_II', 'LEVEL_III', 'LEVEL_IV', 'LEVEL_V')) AS level_count,
      (SELECT COUNT(DISTINCT grade_number)::int
         FROM job_grades
        WHERE grade_number BETWEEN 1 AND 14) AS grade_count
  `);

  console.log(
    `Q BMS v2.1.9.1 Organization Level / Grade Master applied: ` +
    `${summary.rows[0].level_count} levels, ${summary.rows[0].grade_count} grades.`
  );
} finally {
  if (typeof db.end === 'function') await db.end();
}
