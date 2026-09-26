import { execSync } from 'node:child_process';

/**
 * Make sure the local database is up and current before any spec runs.
 * Both steps leave a database that is already there alone
 */
export default function globalSetup(): void {
  execSync('pnpm db', { stdio: 'inherit' });
  execSync('pnpm migrate', { stdio: 'inherit' });
}
