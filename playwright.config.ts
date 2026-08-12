import { defineConfig, devices } from '@playwright/test';

/**
 * The browser tests: the game as a player meets it.
 *
 * Everything else in the repository is tested without a screen. The
 * battle engine, the world derivation and the security rules are all
 * checked by reading what a function returned, which is the right way
 * to check them and says nothing at all about whether the game can be
 * played. The bugs that got through were never wrong answers — they
 * were a tab that stopped responding, a dialog that tore the page down
 * when a button was pressed, a sprite drawn past the edge of its
 * square. None of those are visible to a unit test.
 *
 * So these drive the real thing: a real browser, the real dev server,
 * and a real Firebase emulator with a real account signing in. It is
 * slow by the standards of the rest of the suite and it is meant to
 * be — the point is that nothing is stubbed out, because the parts
 * that were stubbed out are where the bugs were.
 */

const PROJECT_ID = 'demo-poketerra';
const PORT = 4321;
/**
 * `localhost` rather than an address: the dev server binds the IPv6
 * loopback, so polling 127.0.0.1 waits out the whole timeout on a
 * server that has been up since the first second
 */
const ORIGIN = `http://localhost:${PORT}`;

const onCI = process.env.CI != null;

/**
 * What the app is pointed at while the tests run.
 *
 * These are passed to the dev server rather than written to a file.
 * A developer's own `.env` is theirs — it holds real Firebase
 * credentials and is not in version control — so the tests must
 * neither read from it nor write to it. Passing them inline also means
 * the suite runs on a machine that has no `.env` at all, which is what
 * a CI runner is.
 *
 * The values are the emulator's own: it accepts any key and cares only
 * about the project id, which has to be the one the emulator was
 * started for. A mismatch there is silent — the app talks happily to a
 * second, empty project — so it is set in both places from one
 * constant
 */
const EMULATED = {
  VITE_FIREBASE_EMULATOR: 'true',
  VITE_FIREBASE_PROJECT_ID: PROJECT_ID,
  FIREBASE_PROJECT_ID: PROJECT_ID,
  VITE_FIREBASE_API_KEY: 'demo-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: `${PROJECT_ID}.firebaseapp.com`,
  VITE_FIREBASE_APP_ID: 'demo-app-id',
};

export default defineConfig({
  testDir: 'e2e',
  /**
   * One at a time. The emulator holds a single store for the project,
   * so two specs signing in and writing catches at once would be
   * reading each other's world
   */
  fullyParallel: false,
  workers: 1,
  forbidOnly: onCI,
  retries: onCI ? 1 : 0,
  /**
   * Generous, and deliberately so: a cold dev server compiles the app
   * on the first request, and the first sign-in pays for the auth
   * emulator's handshake as well
   */
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: onCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: ORIGIN,
    // Kept only where something went wrong, since a trace of a passing
    // run is a few megabytes nobody will open
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Through a launcher, which clears away the Java emulator a
      // previous run may have orphaned before starting a fresh set
      command: `node e2e/emulators.ts ${PROJECT_ID}`,
      /**
       * Waited on at the **auth** emulator rather than at Firestore.
       *
       * Firestore's emulator is a Java process the CLI supervises, and
       * it outlives a `pkill` on the CLI often enough to matter: a
       * half-dead set of emulators leaves port 8080 answering with no
       * auth emulator behind it, `reuseExistingServer` takes that for
       * a running suite, and every test then fails signing in with
       * `auth/network-request-failed`. Auth is the one the tests
       * actually need first, so it is the one that decides whether the
       * emulators are up
       */
      url: 'http://127.0.0.1:9099/',
      reuseExistingServer: !onCI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: `pnpm exec vite dev --port ${PORT}`,
      url: ORIGIN,
      reuseExistingServer: !onCI,
      timeout: 180_000,
      env: EMULATED,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
