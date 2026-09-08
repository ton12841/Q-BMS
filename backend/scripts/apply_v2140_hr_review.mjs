import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/config/database/postgres.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(here, '../../database/migrations/20260902_002_hr_onboarding_review.sql');
const sql = await fs.readFile(sqlPath, 'utf8');

try {
  await db.query(sql);
  console.log('Q BMS v2.1.4.0 HR onboarding review migration applied.');
} finally {
  if (typeof db.end === 'function') await db.end();
}
