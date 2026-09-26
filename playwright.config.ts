import { defineConfig, devices } from '@playwright/test';

/**
 * The browser tests: the game as a player meets it.
 *
 * Everything else in the repository is tested without a screen. The
 * battle engine, the world derivation and the server's rules are
 * all checked by reading what a function returned, which is the right
 * way to check them and says nothing at all about whether the game can
 * be played. The bugs that got through were never wrong answers; they
 * were a tab that stopped responding, a dialog that tore the page down
 * when a button was pressed, a sprite drawn past the edge of its
 * square. None of those are visible to a unit test.
 *
 * So these drive the real thing: a real browser, the real dev server,
 * and the real local database with a real account signing in.
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
 * What the app is pointed at while the tests run: the local database
 * `pnpm db` serves, with the real shiny odds a player meets rather than
 * the loud dev ones
 */
const STAGED = {
  // The tests' own environment rather than the developer's .env (see test/env/.env.test)
  OVERWANDER_ENV_DIR: 'test/env',
  VITE_REAL_SHINY_ODDS: 'true',
  DATABASE_URL:
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/overwander',
  // Better Auth under test: a throwaway secret, and the origin the browsers open
  BETTER_AUTH_SECRET: 'e2e-secret-that-is-at-least-thirty-two-characters',
  BETTER_AUTH_URL: ORIGIN,
};

export default defineConfig({
  testDir: 'e2e',
  /**
   * One at a time. The local database holds a single store, so two specs
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
