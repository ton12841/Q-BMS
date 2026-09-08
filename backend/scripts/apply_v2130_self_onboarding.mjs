import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/config/database/postgres.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(here, '../../database/migrations/20260902_001_employee_self_onboarding.sql');
const sql = await fs.readFile(sqlPath, 'utf8');

try {
  await db.query(sql);
  console.log('Q BMS v2.1.3.0 self-onboarding migration applied.');
} finally {
  if (typeof db.end === 'function') {
    await db.end();
  }
}
