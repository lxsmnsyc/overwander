import { solidStart } from '@solidjs/start/config';
import tailwindcss from '@tailwindcss/vite';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

/**
 * Nitro is the server runtime: it is what turns the app into something
 * that can be deployed, and it is nothing the unit tests exercise.
 *
 * It is left out under Vitest because its plugin opens the watchers
 * and file handles a running server needs — several hundred of them —
 * and nothing closes them when the run ends, so every `vitest run` sat
 * at "Tests closed successfully but something prevents Vite server
 * from exiting" until the ten-second close timeout fired. Loading it
 * also drags in the production SSR manifest, which is not built during
 * a test run and throws on read.
 *
 * SolidStart stays, since it is what resolves the `server-only` and
 * `client-only` markers the modules under test import
 */
const forTests = process.env.VITEST != null;

export default defineConfig({
  // Tailwind reads its configuration out of src/app.css rather than a
  // config file of its own, so the plugin is all the wiring there is
  plugins: [tailwindcss(), solidStart(), ...(forTests ? [] : [nitro()])],
});
