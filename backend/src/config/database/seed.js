import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedsDir = path.resolve(
  __dirname,
  '../../../../database/seeds'
);

async function run() {
  const client = await db.connect();

  try {
    const entries = await fs.readdir(seedsDir);
    const files = entries
      .filter((name) => name.endsWith('.sql'))
      .sort();

    for (const filename of files) {
      const sql = await fs.readFile(
        path.join(seedsDir, filename),
        'utf8'
      );

      console.log(`RUN   ${filename}`);
      await client.query(sql);
      console.log(`DONE  ${filename}`);
    }

    console.log('');
    console.log('Database seed complete.');
  } finally {
    client.release();
    await db.end();
  }
}

run().catch((error) => {
  console.error('');
  console.error('Database seed failed.');
  console.error(error);
  process.exit(1);
});
