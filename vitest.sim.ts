import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

/**
 * The AI simulation: whole AI-against-AI battles played headless, which
 * takes minutes, so it runs on its own as `pnpm ai:sim` rather than with
 * the unit tests
 */
export default defineConfig((env) =>
  mergeConfig(typeof viteConfig === 'function' ? viteConfig(env) : viteConfig, {
    test: {
      include: ['test/sim/**/*.sim.ts'],
      testTimeout: 30 * 60 * 1000,
    },
  }),
);
