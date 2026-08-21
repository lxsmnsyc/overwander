import { defineConfig } from 'vitest/config';

/**
 * The RLS tests, run apart from everything else: they need the local
 * Supabase stack, and they clear its rows — accounts included —
 * between cases. Run as `pnpm test:rules` while nothing else is using
 * the stack; beside the e2e suite they would delete the accounts the
 * browsers are signed in as. One file at a time for the same reason
 */
export default defineConfig({
  test: {
    include: ['test/rls/**/*.test.ts'],
    fileParallelism: false,
    // The first case pays for the emulator's handshake, and clearing
    // the store between cases is a round trip of its own
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
