import { defineConfig } from 'vitest/config';

/**
 * The RLS tests, run apart from everything else: they need the local
 * Supabase stack, and they clear its rows — accounts included —
 * between cases. Run as `pnpm test:rules` while nothing else is using
 * the stack; beside the e2e suite they would delete the accounts the
 * browsers are signed in as. One file at a time for the same reason
 */
export default defineConfig({
  resolve: {
    // The `server-only` marker throws when Node imports it for real;
    // SolidStart is not in this config to resolve it away, so the
    // suite maps it to an empty module itself
    alias: { 'server-only': new URL('test/rls/__server-only.ts', import.meta.url).pathname },
  },
  test: {
    // The server modules read the connection from the environment the
    // way the app does. The local stack's default stands in when
    // nothing set it, the same fallback `clients.ts` keeps, so the
    // suite runs against a fresh `supabase start` with no .env at all
    env: {
      SUPABASE_DB_URL:
        process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    },
    include: ['test/rls/**/*.test.ts'],
    fileParallelism: false,
    // The first case pays for the emulator's handshake, and clearing
    // the store between cases is a round trip of its own
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
