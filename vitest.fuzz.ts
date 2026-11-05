import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

/**
 * The property tests over random battles. Each run plays whole
 * AI-against-AI fights, which takes minutes, so it runs on its own as
 * `pnpm fuzz`. FUZZ_RUNS sets how many battles a property plays and
 * FUZZ_SEED replays a failure
 */
export default defineConfig((env) =>
  mergeConfig(typeof viteConfig === 'function' ? viteConfig(env) : viteConfig, {
    test: {
      include: ['test/fuzz/**/*.fuzz.ts'],
      testTimeout: 6 * 60 * 60 * 1000,
      hookTimeout: 5 * 60 * 1000,
    },
  }),
);
