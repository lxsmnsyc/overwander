# Outcome: deps-update

## Built

- Every dependency at its newest release inside its current major: better-auth and `@better-auth/passkey` 1.7.13 (passkey still pinned exactly), `@solidjs/start` 2.1.0, solid-js 1.9.17, vite 8.3.5, vitest 5.0.5, `@playwright/test` 1.64.1, oxlint 1.89.0, oxfmt 0.74.0, oxlint-tsgolint 7.0.2005, wrangler 4.152.0, sharp 0.35.5, pg 8.23.1, jose 6.2.13, `@types/node` 26.6.5.
- `e2e/vite-hooks.ts`, registered from `playwright.config.ts`: a Node load hook that gives the modules the specs import from `src` what vite gives them (YAML as a module, `import.meta.env` from `test/env`, and the eager YAML `import.meta.glob`).

## Deviations

- Three fixes for problems already on main, kept on this branch at the maintainer's request:
  - Eleven files in `src` and `test` were not formatted. oxfmt 0.70 already flagged them; they are reformatted in their own commit.
  - `test/db/tera-shards.test.ts`, "keeps the Tera type through a trade", failed on every run: `offerTrade` refuses a player's last pokemon, and the test's owner held only the one it offered. The owner now has a spare.
  - No spec loaded. Playwright put the first `.yaml` import through its TypeScript transform and failed. The hook above fixes loading.
- `nitro` stays on `3.0.260903-beta`, the newest build of its line. `typescript` stays on `7.1.0-beta`, the newest beta of 7.1; only dev nightlies are newer.
- No changeset: none of the bumps changes what a player sees.

## Stubs left

- None.

## Gotchas

- Most e2e specs fail. In the run that was stopped after 46 of 59 tests, 43 failed, mostly by timing out: the specs went stale while the suite could not load, and a new player now starts on a Portal whose dialog covers the world. Main fails the same specs with the same hook. Repairing them is `e2e-specs`.
- The hook's `import.meta.glob` handles only `{ eager: true, import: 'default' }` over YAML, the one shape the data registries use. A module the specs import that globs anything else throws a clear error.
- `tera-sites.test.ts` times out under the full `pnpm test` and passes alone, as GOAL.md says. Under this run's load three more files timed out the same way and passed when rerun alone.

## Proposed learnings

- A module the e2e specs import must load outside vite, or `e2e/vite-hooks.ts` must learn the vite feature it uses | Playwright does not run vite, and CI does not run e2e, so a break goes unseen | `src`, `e2e` | yes: `playwright test --list` exits non-zero when a spec fails to load.

## Verification

- `pnpm outdated`: nothing listed.
- `pnpm typecheck` and `pnpm exec oxlint src test e2e playwright.config.ts`: exit 0.
- `pnpm test`: 5292 passed; the 5 timeouts passed when their files were rerun alone.
- `pnpm test:db`: 170 passed.
- `pnpm build`: succeeds.
- `pnpm exec playwright test --list`: 59 tests in 22 files load. `pnpm test:e2e`: failing, see Gotchas.

## Size

- Estimated S, actual M. Three problems already on main surfaced once the checks ran.
