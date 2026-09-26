import { readFileSync } from 'node:fs';

/**
 * The game's own rows out of a Supabase data dump, as SQL for psql.
 *
 * `supabase db dump --data-only --use-copy` also carries Supabase's own schemas
 * (auth, storage and the rest), which the self-hosted database does not
 * have. This keeps each `COPY` into `public` and each `public` sequence
 * value, with triggers off so the rows land exactly as dumped:
 *
 *   node scripts/public-data.ts data.sql | docker compose exec -T db \
 *     psql -U postgres -d overwander -v ON_ERROR_STOP=1 --single-transaction
 */

const path = process.argv[2] ?? '';

if (path === '') {
  console.error('Usage: node scripts/public-data.ts <data.sql>');
  process.exit(1);
}

const lines = readFileSync(path, 'utf8').split('\n');

// COPY keeps each row on one line, which is what makes filtering by line safe
if (lines.some((line) => line.startsWith('INSERT INTO "public".'))) {
  console.error('This dump uses INSERT statements. Dump again with --use-copy.');
  process.exit(1);
}
const out: string[] = ['SET session_replication_role = replica;'];
let copying = false;
let tables = 0;

for (const line of lines) {
  if (copying) {
    out.push(line);
    copying = line !== '\\.';
  } else if (line.startsWith('COPY "public".')) {
    // The baseline seeds some rows, such as the switches, which the dump's own replace
    out.push(`DELETE FROM ${line.slice('COPY '.length, line.indexOf(' ('))};`, line);
    copying = true;
    tables += 1;
  } else if (line.startsWith('SELECT pg_catalog.setval(\'"public"')) {
    out.push(line);
  }
}

process.stdout.write(`${out.join('\n')}\n`);
console.error(`${tables} tables`);
