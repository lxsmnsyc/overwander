/// <reference types="vitest/config" />
import solid from '@solidjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { fileRoutes } from 'filesystem-routing/vite';
import { nitro } from 'nitro/vite';
import solidMarked from 'unplugin-solid-marked';
import { defineConfig, loadEnv } from 'vite';
import yamlData from './scripts/vite/yaml.ts';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import COMPILE_OPTIONS from './src/i18n/compile-options.ts';

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
 * The Solid plugin stays, since it is what resolves the `server-only`
 * marker the modules under test import. Start mode (entries, middleware,
 * server functions) and the file routes stay out with Nitro: no test
 * renders a page or serves a request
 */
const forTests = process.env.VITEST != null;

/**
 * Where the tests' own environment lives, read in place of the root
 * .env so a developer's settings never change what a test sees. The
 * e2e dev server asks for it through OVERWANDER_ENV_DIR
 */
const ENV_DIR = forTests ? 'test/env' : process.env.OVERWANDER_ENV_DIR;

/**
 * One id per build, shared by the client and server bundles. A tab
 * names it on every server call, and a call from a build that is no
 * longer live is refused: a server function keeps its id while its
 * parameters change, so an old tab's arguments would reach it in the
 * wrong order
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
  const env = loadEnv(mode, ENV_DIR ?? process.cwd(), 'VITE_');
  const hosted = 'VITE_SPRITE_ORIGIN' in env && env.VITE_SPRITE_ORIGIN !== '';

  return hosted ? ['public/sprites/**', 'public/sounds/**'] : [];
}

export default defineConfig(({ mode }) => ({
  ...(ENV_DIR == null ? {} : { envDir: ENV_DIR }),
  define: {
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(BUILD_ID),
  },
  // Tailwind reads its configuration out of src/app.css rather than a
  // config file of its own, so the plugin is all the wiring there is
  plugins: [
    yamlData(),
    paraglideVitePlugin(COMPILE_OPTIONS),
    tailwindcss(),
    // The release pages under docs/ are imported as components, and
    // this is what turns them into JSX. It runs before the Solid plugin
    // because what it emits is JSX for that to compile, and it is what
    // keeps a markdown parser out of the browser
    solidMarked.vite({}),
    forTests
      ? solid()
      : solid({
          ssr: true,
          start: {
            middleware: './src/middleware/index.ts',
            devtools: false,
          },
          serverFunctions: true,
          // The route modules the file routes plugin emits end in a
          // `?pick=` query, and this makes the plugin compile them too
          extensions: ['.jsx', '.tsx'],
        }),
    // src/routes, served from `virtual:file-routes`. `httpMethods` turns
    // the uppercase exports of a route module (the Better Auth handler)
    // into request handlers, which the middleware dispatches
    ...(forTests ? [] : [fileRoutes({ httpMethods: true, types: true })]),
    ...(forTests
      ? []
      : [
          nitro({
            preset: 'node-server',
            ignore: publicIgnore(mode),
            routeRules: ROUTE_RULES,
            // The live feed that follows table changes (src/server/live)
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
    // `server-only` is a marker, not a library. The Solid plugin
    // resolves it to an empty module on the server and refuses it on
    // the client, which is the whole of how `src/server/*` is kept
    // out of the browser bundle.
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
    // Temporary, until the solid-2-tests child settles how the tests
    // run (possibly per group through `test.projects`).
    //
    // Said outright, since the Solid plugin reads it: an explicit `node`
    // gives the tests the server build of Solid, as SolidStart did. Left
    // unset, the plugin compiles them for the browser, where `isServer`
    // is false and the modules that touch `window` at import fail
    environment: 'node',
    /**
     * `test/db` needs the development database and clears it between cases,
     * so it runs on its own as `pnpm test:db` (see `vitest.db.ts`).
     *
     * `e2e` is left out because those are Playwright specs, and
     * Playwright refuses to have its `test` called by another runner
     */
    exclude: ['**/node_modules/**', '**/dist/**', '.output/**', 'test/db/**', 'e2e/**'],
  },
}));
