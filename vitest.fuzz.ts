import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

/**
 * The property tests over random battles and random stretches of the
 * world. Each run plays whole AI-against-AI fights or builds whole
 * chunks, which takes minutes, so it runs on its own as `pnpm fuzz`.
 * FUZZ_RUNS sets how many inputs a property tries and FUZZ_SEED
 * replays a failure
 */
export default defineConfig((env) =>
  mergeConfig(typeof viteConfig === 'function' ? viteConfig(env) : viteConfig, {
    // The `server-only` marker throws when Node imports it for real.
    // The fuzz suite reads the server's constants and pure builders,
    // never its database
    resolve: {
      alias: { 'server-only': new URL('test/db/__server-only.ts', import.meta.url).pathname },
    },
    test: {
      include: ['test/fuzz/**/*.fuzz.ts'],
      testTimeout: 6 * 60 * 60 * 1000,
      hookTimeout: 5 * 60 * 1000,
    },
  }),
);
