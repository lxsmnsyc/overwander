import { execSync } from 'node:child_process';
import postgres from 'postgres';
import migrate from '../db/migrate.ts';

/**
 * The one place the tests learn which database to use: the throwaway
 * development instance (`compose.dev.yaml`), never production. Only
 * `TEST_DATABASE_URL` can move it, and a database whose name does not
 * end in `_dev` is refused, so no environment can point a suite that
 * clears rows at the live game's data.
 */

const DISPOSABLE = /_dev$/;

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54324/overwander_dev';

/** Throws unless the URL names the disposable development database */
export function assertTestDatabase(url: string): string {
  const name = new URL(url).pathname.slice(1);

  if (!DISPOSABLE.test(name)) {
    throw new Error(
      `Refusing to test against "${name}": tests only run on a database named *_dev.`,
    );
  }
  return url;
}

assertTestDatabase(TEST_DATABASE_URL);

/** Start the development instance, unless it is already up, and bring its schema up to date */
export async function prepareTestDatabase(): Promise<void> {
  // Only the default instance is ours to start; any other was started by whoever set it
  if (process.env.TEST_DATABASE_URL == null) {
    execSync('docker compose -f compose.dev.yaml up --detach --wait', { stdio: 'inherit' });
  }

  const sql = postgres(TEST_DATABASE_URL, { prepare: false, max: 1, onnotice: () => undefined });

  try {
    await migrate(sql, 'db/migrations');
  } finally {
    await sql.end();
  }
}
