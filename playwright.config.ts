import { execSync } from 'node:child_process';
import { defineConfig, devices } from '@playwright/test';

/**
 * The browser tests: the game as a player meets it.
 *
 * Everything else in the repository is tested without a screen. The
 * battle engine, the world derivation and the security policies are
 * all checked by reading what a function returned, which is the right
 * way to check them and says nothing at all about whether the game can
 * be played. The bugs that got through were never wrong answers; they
 * were a tab that stopped responding, a dialog that tore the page down
 * when a button was pressed, a sprite drawn past the edge of its
 * square. None of those are visible to a unit test.
 *
 * So these drive the real thing: a real browser, the real dev server,
 * and the real local Supabase stack with a real account signing in.
 * It is slow by the standards of the rest of the suite and it is
 * meant to be, because nothing is stubbed out.
 */

const PORT = 4321;
/**
 * `localhost` rather than an address: the dev server binds the IPv6
 * loopback, so polling 127.0.0.1 waits out the whole timeout on a
 * server that has been up since the first second
 */
const ORIGIN = `http://localhost:${PORT}`;

const onCI = process.env.CI != null;

/**
 * The stack's own connection values, asked of the CLI so the suite
 * runs on a machine with no `.env` at all. The published local demo
 * keys are the fallback for a stack that is up but a CLI that is not
 * answering; a developer's `.env` is neither read nor written.
 */
function stackEnv(): Record<string, string> {
  const fallback = {
    SUPABASE_URL: 'http://127.0.0.1:54321',
    SUPABASE_DB_URL: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    SUPABASE_ANON_KEY:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    SUPABASE_SERVICE_ROLE_KEY:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
    SUPABASE_JWT_SECRET: 'super-secret-jwt-token-with-at-least-32-characters-long',
  };

  try {
    const printed = execSync('supabase status -o env', { encoding: 'utf8' });
    const parsed: Record<string, string | undefined> = Object.fromEntries(
      printed
        .split('\n')
        .map((line) => /^(\w+)="?([^"]*)"?$/.exec(line))
        .filter((match): match is RegExpExecArray => match != null)
        .map((match) => [match[1], match[2]]),
    );

    return {
      SUPABASE_URL: parsed.API_URL ?? fallback.SUPABASE_URL,
      SUPABASE_DB_URL: parsed.DB_URL ?? fallback.SUPABASE_DB_URL,
      SUPABASE_ANON_KEY: parsed.ANON_KEY ?? fallback.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: parsed.SERVICE_ROLE_KEY ?? fallback.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_JWT_SECRET: parsed.JWT_SECRET ?? fallback.SUPABASE_JWT_SECRET,
    };
  } catch {
    return fallback;
  }
}

const STACK = stackEnv();

/**
 * What the app is pointed at while the tests run: the local stack,
 * with the real shiny odds a player meets rather than the loud dev
 * ones
 */
const STAGED = {
  VITE_REAL_SHINY_ODDS: 'true',
  VITE_SUPABASE_URL: STACK.SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: STACK.SUPABASE_ANON_KEY,
  ...STACK,
};

export default defineConfig({
  testDir: 'e2e',
  /**
   * One at a time. The local stack holds a single store, so two specs
   * signing in and writing catches at once would be reading each
   * other's world
   */
  fullyParallel: false,
  workers: 1,
  forbidOnly: onCI,
  retries: onCI ? 1 : 0,
  /**
   * Generous, and deliberately so: a cold dev server compiles the app
   * on the first request
   */
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: onCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: ORIGIN,
    // Kept only where something went wrong, since a trace of a passing
    // run is a few megabytes nobody will open
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm exec vite dev --port ${PORT}`,
    url: ORIGIN,
    reuseExistingServer: !onCI,
    timeout: 180_000,
    env: STAGED,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
