import { execSync } from 'node:child_process';

/**
 * Make sure the local stack is standing before any spec runs.
 * `supabase start` is idempotent: a running stack is left alone, the
 * way the old harness reused a live emulator set.
 */
export default function globalSetup(): void {
  execSync('supabase start', { stdio: 'inherit' });
}
