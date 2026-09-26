import { defineConfig } from 'vitest/config';

/**
 * The database suite: server modules run against the local Postgres
 * that `pnpm db` starts, with every migration applied. It clears the
 * game's rows, accounts included, between cases, so it runs apart from
 * everything else and one file at a time, and never beside the e2e
 * suite, whose browsers would lose the accounts they signed in as
 */
export default defineConfig({
  // The tests' own environment, not the developer's .env (see test/env/.env.test)
  envDir: 'test/env',
  resolve: {
    // The `server-only` marker throws when Node imports it for real;
    // SolidStart is not in this config to resolve it away, so the
    // suite maps it to an empty module itself
    alias: { 'server-only': new URL('test/db/__server-only.ts', import.meta.url).pathname },
  },
  test: {
    // The server modules read the connection the way the app does. The
    // local default stands in when nothing set it, as in `clients.ts`
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/overwander',
    },
    include: ['test/db/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
