import { defineConfig } from 'vitest/config';

/**
 * The Firestore rules tests, which are run apart from everything
 * else.
 *
 * They are a separate configuration rather than a separate project
 * because they want the opposite of what the app's config provides:
 * no SolidStart, no Tailwind and no module boundaries — they import
 * one file of collection names and talk to a server — while what they
 * do need is a run that does not overlap with itself. The emulator
 * holds one store for the whole project, and the tests clear it
 * between cases, so two files running at once would be clearing each
 * other's documents out from under them.
 *
 * Run through `pnpm test:rules`, which brings an emulator up around
 * this and takes it down again.
 */
export default defineConfig({
  test: {
    include: ['test/firestore/**/*.test.ts'],
    fileParallelism: false,
    // The first case pays for the emulator's handshake, and clearing
    // the store between cases is a round trip of its own
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
