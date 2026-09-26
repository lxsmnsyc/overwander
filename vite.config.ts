/// <reference types="vitest/config" />
import { solidStart } from '@solidjs/start/config';
import tailwindcss from '@tailwindcss/vite';
import { nitro } from 'nitro/vite';
import solidMarked from 'vite-plugin-solid-marked';
import { defineConfig, loadEnv } from 'vite';

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

/**
 * One id per build, shared by the client and server bundles. A tab
 * names it on every server call, and a call from a build that is no
 * longer live is refused: server functions are addressed by their
 * place in a file, so an old tab's arguments would reach the wrong one
 */
const BUILD_ID =
  process.env.BUILD_ID != null && process.env.BUILD_ID !== ''
    ? process.env.BUILD_ID
    : String(Date.now());

/** The year-long cache the stamped files take, as `public/_headers` gives them */
const IMMUTABLE = { 'cache-control': 'public, max-age=31536000, immutable' };

/**
 * The same headers for a server with no sprite host, which serves the
 * files itself. The two indexes that hand out the stamps keep one
 * address, so they are checked on every read
 */
const ROUTE_RULES = {
  '/sprites/**': { headers: IMMUTABLE },
  '/sounds/**': { headers: IMMUTABLE },
  '/sprites/stamps.json': { headers: { 'cache-control': 'no-cache' } },
  '/sprites/pokemon/coats.json': { headers: { 'cache-control': 'no-cache' } },
};

/**
 * With a sprite host set, the sprites and sounds are served from there
 * (see `wrangler.jsonc`), so the app's own output leaves them out
 */
function publicIgnore(mode: string): string[] {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const hosted = 'VITE_SPRITE_ORIGIN' in env && env.VITE_SPRITE_ORIGIN !== '';

  return hosted ? ['public/sprites/**', 'public/sounds/**'] : [];
}

export default defineConfig(({ mode }) => ({
  define: {
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(BUILD_ID),
  },
  // Tailwind reads its configuration out of src/app.css rather than a
  // config file of its own, so the plugin is all the wiring there is
  plugins: [
    tailwindcss(),
    // The release pages under docs/ are imported as components, and
    // this is what turns them into JSX. It runs before SolidStart's
    // own plugin because what it emits is JSX for that to compile,
    // and it is what keeps a markdown parser out of the browser
    solidMarked({}),
    solidStart({
      devOverlay: false,
      middleware: 'src/middleware/index.ts',
    }),
    ...(forTests
      ? []
      : [
          nitro({
            preset: 'node-server',
            ignore: publicIgnore(mode),
            routeRules: ROUTE_RULES,
            // The live feed that replaced Supabase Realtime (src/server/live)
            features: { websocket: true },
            handlers: [{ route: '/_live', handler: './src/server/live/socket.ts' }],
            // Brings the database up to date before the first request is served
            plugins: ['./src/server/migrate-on-start.ts'],
          }),
        ]),
  ],
  server: {
    watch: {
      // The sprite processor writes a credit row into docs/, and
      // nothing in the app imports docs/ — a doc edit reloading the
      // game is a reload for nothing. public/ stays watched: a
      // freshly packed sheet should show up without a manual reload,
      // even though the pack's own write reloads the processor page
      ignored: ['**/docs/**'],
    },
  },
  ssr: {
    // `server-only` is a marker, not a library. SolidStart's
    // `boundary-modules` plugin resolves it to an empty module on the
    // server and refuses it on the client — which is the whole of how
    // `src/server/*` is kept out of the browser bundle.
    //
    // It only gets to do that if Vite asks it. A bare import of a
    // package that is really there is **externalized** for SSR before
    // the plugin pipeline sees it, so Node ends up requiring the real
    // `server-only`, whose entire body is a `throw`. Every route 500s
    // with "This module cannot be imported from a Client Component
    // module" and nothing in the stack names the importer, because
    // there is no importer at fault: the boundary check never ran.
    //
    // Keeping it non-external puts the marker back in front of the
    // plugin that understands it
    noExternal: ['server-only'],
  },
  environments: {
    // The same for Nitro's own handlers (the live socket), which the dev
    // server otherwise loads with the real, throwing `server-only`
    nitro: { resolve: { noExternal: ['server-only'] } },
  },
  test: {
    // The world tests generate thousands of chunks and sit near 5 seconds alone,
    // so the default timeout fails them whenever the machine is busy
    testTimeout: 20_000,
    /**
     * The battle engine and the modules that field it are
     * `client-only`: they are played in a browser and nothing on the
     * server replays them. Vitest is neither browser nor server, and
     * the marker's own body throws, so it is resolved to nothing for
     * the tests that exercise the engine directly
     */
    alias: [
      {
        find: /^client-only$/,
        replacement: new URL('./test/stubs/client-only.ts', import.meta.url).pathname,
      },
    ],
    /**
     * `test/rls` needs the local Supabase stack and clears it between
     * cases — run inside `pnpm test` it fails on a machine with no
     * stack, and run beside the e2e suite it deletes the accounts the
     * browsers are signed in as. It runs on its own as `pnpm
     * test:rules` (see `vitest.rules.ts`).
     *
     * `e2e` is left out because those are Playwright specs, and
     * Playwright refuses to have its `test` called by another runner
     */
    exclude: ['**/node_modules/**', '**/dist/**', '.output/**', 'test/rls/**', 'e2e/**'],
  },
}));
