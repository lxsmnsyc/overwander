import { defineConfig } from 'vitest/config';
import { TEST_DATABASE_URL } from './test/test-database.ts';
import yamlData from './plugins/yaml.ts';

/**
 * The database suite: server modules run against the throwaway
 * development database (`compose.dev.yaml`), which the setup starts and
 * migrates. It clears the game's rows, accounts included, between cases,
 * so it runs one file at a time and never beside the e2e suite
 */
export default defineConfig({
  plugins: [yamlData()],
  // The tests' own environment, not the root .env (see test/env/.env.test)
  envDir: 'test/env',
  resolve: {
    // The `server-only` marker throws when Node imports it for real;
    // SolidStart is not in this config to resolve it away, so the
    // suite maps it to an empty module itself
    alias: { 'server-only': new URL('test/db/__server-only.ts', import.meta.url).pathname },
  },
  test: {
    // The server modules read DATABASE_URL, which is set here to the test
    // instance whatever the shell says, so no environment reaches real data
    env: { DATABASE_URL: TEST_DATABASE_URL },
    globalSetup: ['test/db/global-setup.ts'],
    include: ['test/db/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
