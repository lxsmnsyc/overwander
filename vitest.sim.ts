import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

/**
 * The AI simulation: whole AI-against-AI battles played headless, which
 * takes minutes, so it runs on its own as `pnpm ai:sim` rather than with
 * the unit tests
 */
export default defineConfig((env) => {
  // The root's `projects` list the unit suite, which these do not run
  const root = typeof viteConfig === 'function' ? viteConfig(env) : viteConfig;
  const { projects: _projects, ...rootTest } = root.test ?? {};

  return mergeConfig(
    { ...root, test: rootTest },
    {
      test: {
        // The server build of Solid, as the engine runs outside a tab
        environment: 'node',
        include: ['test/sim/**/*.sim.ts'],
        testTimeout: 30 * 60 * 1000,
      },
    },
  );
});
