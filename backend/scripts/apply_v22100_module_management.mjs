import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/config/database/postgres.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(
  here,
  '../../database/migrations/20260903_012_module_management_foundation.sql'
);

try {
  const sql = await fs.readFile(sqlPath, 'utf8');
  await db.query(sql);

  const result = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE item_type = 'MODULE')::int AS modules,
      COUNT(*) FILTER (WHERE item_type = 'TOOL')::int AS tools,
      COUNT(*) FILTER (WHERE lifecycle_status = 'HOLD')::int AS hold_items
    FROM platform_registry_items
  `);

  const row = result.rows[0];

  console.log(
    `Q BMS v2.2.10.0 Module Management foundation applied: ` +
    `${row.modules} Modules, ${row.tools} Tools, ${row.hold_items} HOLD.`
  );
} finally {
  if (typeof db.end === 'function') {
    await db.end();
  }
}
