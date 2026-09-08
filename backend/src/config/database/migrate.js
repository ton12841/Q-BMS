import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.resolve(
  __dirname,
  '../../../../database/migrations'
);

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function run() {
  const client = await db.connect();

  try {
    await ensureMigrationTable(client);

    const entries = await fs.readdir(migrationsDir);
    const files = entries
      .filter((name) => name.endsWith('.sql'))
      .sort();

    const appliedResult = await client.query(
      'SELECT filename FROM schema_migrations'
    );
    const applied = new Set(
      appliedResult.rows.map((row) => row.filename)
    );

    let appliedCount = 0;

    for (const filename of files) {
      if (applied.has(filename)) {
        console.log(`SKIP  ${filename}`);
        continue;
      }

      const fullPath = path.join(migrationsDir, filename);
      const sql = await fs.readFile(fullPath, 'utf8');

      console.log(`RUN   ${filename}`);

      await client.query('BEGIN');

      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [filename]
        );
        await client.query('COMMIT');
        appliedCount += 1;
        console.log(`DONE  ${filename}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log('');
    console.log(`Database migration complete. Applied: ${appliedCount}`);
  } finally {
    client.release();
    await db.end();
  }
}

run().catch((error) => {
  console.error('');
  console.error('Database migration failed.');
  console.error(error);
  process.exit(1);
});
