import { compile } from '@inlang/paraglide-js';
import COMPILE_OPTIONS from '../../src/i18n/compile-options.ts';

// The vite plugin compiles the messages for dev, build and the tests.
// tsc starts no plugin, so `pnpm typecheck` runs this first
await compile(COMPILE_OPTIONS);
