import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/config/database/postgres.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(
  here,
  '../../database/migrations/20260903_014_platform_diagnostics_foundation.sql'
);

try {
  const sql = await fs.readFile(sqlPath, 'utf8');
  await db.query(sql);

  const result = await db.query(`
    SELECT COUNT(*)::int AS permission_count
    FROM permissions
    WHERE code = 'system.platform_diagnostics.view'
  `);

  console.log(
    `Q BMS v2.2.12.0 Platform Diagnostics foundation applied: ` +
    `${result.rows[0].permission_count} permission ready.`
  );
} finally {
  if (typeof db.end === 'function') {
    await db.end();
  }
}
