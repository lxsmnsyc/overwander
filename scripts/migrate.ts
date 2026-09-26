import postgres from 'postgres';
import migrate from '../db/migrate.ts';

/** `pnpm migrate`: bring the database in SUPABASE_DB_URL up to date with db/migrations */
const url = process.env.SUPABASE_DB_URL ?? '';

if (url === '') {
  console.error('Set SUPABASE_DB_URL to the database to migrate.');
  process.exit(1);
}

const sql = postgres(url, { prepare: false, onnotice: () => undefined });
const applied = await migrate(sql, 'db/migrations');

console.log(applied.length === 0 ? 'Already up to date.' : `Applied ${applied.join(', ')}`);
await sql.end();
