import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/config/database/postgres.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(
  here,
  '../../database/migrations/20260903_008_user_identity_management_foundation.sql'
);

try {
  const sql = await fs.readFile(sqlPath, 'utf8');
  await db.query(sql);

  const result = await db.query(`
    SELECT COUNT(*)::int AS permission_count
    FROM permissions
    WHERE code IN (
      'system.user_identity.view',
      'system.user_identity.manage'
    )
  `);

  console.log(
    `Q BMS v2.2.5.0 User & Identity Management foundation applied: ` +
    `${result.rows[0].permission_count} permissions ready.`
  );
} finally {
  if (typeof db.end === 'function') {
    await db.end();
  }
}
