import { execSync } from 'node:child_process';
import postgres from 'postgres';
import migrate from '../db/migrate.ts';

/**
 * The one place the tests learn which database to use. It is the
 * instance `compose.test.yaml` runs, never the one `pnpm dev` or the
 * server uses: only `TEST_DATABASE_URL` can move it, and a database
 * whose name does not end in `_test` is refused, so no environment can
 * point a suite that clears rows at real data.
 */

const TEST_NAME = /_test$/;

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:test@127.0.0.1:54323/overwander_test';

/** Throws unless the URL names a test database */
export function assertTestDatabase(url: string): string {
  const name = new URL(url).pathname.slice(1);

  if (!TEST_NAME.test(name)) {
    throw new Error(`Refusing to test against "${name}": a test database's name ends in _test.`);
  }
  return url;
}

assertTestDatabase(TEST_DATABASE_URL);

/** Start the test instance, unless it is already up, and bring its schema up to date */
export async function prepareTestDatabase(): Promise<void> {
  // Only the default instance is ours to start; any other was started by whoever set it
  if (process.env.TEST_DATABASE_URL == null) {
    execSync('docker compose -f compose.test.yaml up --detach --wait', { stdio: 'inherit' });
  }

  const sql = postgres(TEST_DATABASE_URL, { prepare: false, max: 1, onnotice: () => undefined });

  try {
    await migrate(sql, 'db/migrations');
  } finally {
    await sql.end();
  }
}
