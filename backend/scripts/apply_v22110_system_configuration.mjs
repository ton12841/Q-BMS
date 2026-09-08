import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/config/database/postgres.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(
  here,
  '../../database/migrations/20260903_013_system_configuration_foundation.sql'
);

try {
  const sql = await fs.readFile(sqlPath, 'utf8');
  await db.query(sql);

  const result = await db.query(`
    SELECT
      COUNT(*)::int AS settings,
      COUNT(DISTINCT config_group)::int AS groups,
      COUNT(*) FILTER (WHERE mutability = 'LOCKED')::int AS locked
    FROM system_configuration_registry
  `);

  const row = result.rows[0];

  console.log(
    `Q BMS v2.2.11.0 System Configuration foundation applied: ` +
    `${row.settings} settings, ${row.groups} groups, ${row.locked} locked.`
  );
} finally {
  if (typeof db.end === 'function') {
    await db.end();
  }
}
