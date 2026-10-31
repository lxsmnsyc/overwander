import type { CompilerOptions } from '@inlang/paraglide-js';

/**
 * How Paraglide compiles the messages, shared by the vite plugin and by
 * `scripts/i18n/compile.ts`, which `pnpm typecheck` runs first because
 * tsc never starts the plugin.
 *
 * The output under `src/i18n/paraglide` is generated and ignored by git.
 *
 * The strategy is the server's: a cookie the player set by choosing a
 * language, then the browser's `Accept-Language`, then English. The
 * browser does not run it. It reads the locale the server wrote on
 * `<html lang>`, so the two sides always render the same text (see
 * `locale.ts`)
 */
const COMPILE_OPTIONS: CompilerOptions = {
  project: './project.inlang',
  outdir: './src/i18n/paraglide',
  strategy: ['cookie', 'preferredLanguage', 'baseLocale'],
  cookieName: 'overwander-locale',
  cookieSameSite: 'lax',
  cookieSecure: 'auto',
  emitTsDeclarations: true,
  emitReadme: false,
};

export default COMPILE_OPTIONS;
