import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Sql } from 'postgres';

/**
 * Applies the files in `db/migrations` that the database has not seen,
 * in filename order, and records each in `schema_migrations`.
 *
 * Everything pending runs in one transaction under an advisory lock, so
 * a failure applies nothing and two servers starting at once do not
 * both migrate. A migration that cannot run in a transaction, such as
 * `create index concurrently`, is run by hand instead.
 */

/** Any fixed number, shared by everything that migrates this database */
const LOCK = 7_391_004;

/** The migrations applied now, by file name, or none when the database was current */
export default async function migrate(sql: Sql, dir: string): Promise<string[]> {
  const files: string[] = [];

  for (const file of (await readdir(dir)).sort()) {
    if (file.endsWith('.sql')) {
      files.push(file);
    }
  }

  return sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(${LOCK})`;
    await tx`
      create table if not exists schema_migrations (
        version text primary key,
        applied_at timestamptz not null default now()
      )
    `;

    const done = new Set<string>();

    for (const row of await tx`select version from schema_migrations`) {
      done.add(String(row.version));
    }

    const applied: string[] = [];

    for (const file of files) {
      if (done.has(file)) {
        continue;
      }
      await tx.unsafe(await readFile(join(dir, file), 'utf8'));
      await tx`insert into schema_migrations (version) values (${file})`;
      applied.push(file);
    }
    return applied;
  });
}
