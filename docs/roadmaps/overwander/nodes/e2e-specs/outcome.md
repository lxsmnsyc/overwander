# Outcome: e2e-specs

## Status

- Not finished: `pnpm test:e2e` has not passed twice in a row. The last full run (alone) ended with 11 passed and 1 failed. `battle.spec.ts` waited 400 s for the demo raid to report an outcome and did not see one. The same test passed in 1.3 to 1.8 min on three earlier runs. The machine's load average was 17 to 21 from other processes (clang, go builds, other repos' test runs), and the demo fight runs on real time.
- Needs the maintainer's call: keep "runs to its end" and accept the flake under load, or weaken `battle.spec.ts` to "the health of a party moves" (the old assertion, about 15 s and deterministic).

## Scope changes (approved by the maintainer during the node)

- `auction-flow` no longer walks to a board. A new page, `/demo/auction` (`src/routes/demo/auction.tsx`, `src/components/demo/AuctionDemo.tsx`), mounts the real auction panel for the signed-in player under `GameProvider managing`, with no world, canvas or position. `openAuctionBoard` is deleted. The spec also checks that a bid reaches the seller's open board over the live socket.
- `starter-gift` runs on a new `/demo/gifts` page (`src/routes/demo/gifts.tsx`, `src/components/demo/GiftsDemo.tsx`), the real shelf with no world.
- Both demo pages read the session, which the other demos do not: `src/auth/context.tsx` lists them in `DEMOS_WITH_PLAYER`.
- Production gating: every route under `/demo` is already a 404 outside development (`src/routes/demo.tsx` returns the not-found page unless `import.meta.env.DEV`), so both new pages are gated by that layout and need no check of their own. The e2e server is `vite dev`, where `DEV` holds.
- `overworld.spec.ts` signs in once and runs its tests in order on one page (serial, shared page), with sign out last.
- `safari.spec.ts` no longer sweeps the map. `findSpawn` in `e2e/walk.ts` rolls the open five-minute window the way the game does (world seed, chunk, window, UTC, first `SPAWN_COUNT` spawns, land cells only), and `standBeside` puts the player next to it. A window turns over every five minutes, so up to three attempts each pick a fresh spawn for the clock at that moment. The browser is pinned to UTC (`timezoneId` in `playwright.config.ts`) so its zone matches.

## Built

- Five specs: `overworld`, `safari`, `battle`, `auction-flow`, `starter-gift`, updated to the redesigned HUD, gifts shelf, catch sheet and auction cards.
- `standBeside(page, player, at)` now holds. A test in `overworld.spec.ts` stands the player beside a Pokemon Center and reads the chunk back off the board label.
- `signIn` reloads a page stuck on "Loading session" and closes a dialog the start may have opened. `reloadGame` does the same for later reloads. The global setup signs one throwaway account up so the cold dev server has compiled the app before the first spec.
- Three single tests folded in because nothing else covers them in a browser: sign out (`overworld`), a screen standing down when the walk moves elsewhere over the live socket (`overworld`), and a tooltip leaving with its square (`starter-gift`).

## Root causes

- `signIn`: the Portal dialog from the brief did not open on the current HUD, so it was not the cause of the stale specs. The causes were the cold dev server (first sign-up took over a minute), the Gifts key wearing a count ("Gifts 16"), a tabbed gifts shelf with 15 starters, and hover cards covering squares and tabs.
- `standBeside`, two causes. (1) The dev server loaded production's root `.env` (`VITE_WORLD_GENERATION=2`) past `OVERWANDER_ENV_DIR`, and an empty value in `test/env` does not override it, so the specs wrote generation 1 rows the server never read. `playwright.config.ts` now sets seed and generation outright. (2) The page saves its own start position once the world is up and overwrote the staged row. The helper waits for that row, then upserts and reloads.
- `pnpm test:e2e` could not start with the dev database stopped: Playwright starts the web server before the global setup, and the server migrates on boot. The server command now starts the database first.

## Deleted specs and helpers

- `auctions`: board layout checks. The kept auction flow opens the board and uses its trays.
- `bag-use`, `pp`: item use and PP Up. The rules are in the unit and database suites.
- `battle-leave`: Leave on a live raid. Needs a staged raid (`raid.ts`, deleted). Not folded in. This is the one browser-only check lost, along with its countdown test.
- `boxes`: box filing, covered by `test/db/boxes.test.ts`.
- `catch-sheet`: sheet layout, redesigned in #286. The safari spec opens the sheet for a real catch.
- `command-bar`, `icons`, `pokedex`, `profile`, `world-map`, `pick-team`: panel layout checks. `overworld` opens the menu keys and a panel.
- `friends`, `profile-visit`: friend and profile reads, covered by `test/db`.
- `hover-card`: folded into `starter-gift` (tooltip leaves with its square).
- `second-screen`, sign out from `profile`: folded into `overworld`.
- `raids`: raid lobby list. Server side in `test/db/raid-rejoin.test.ts` and the reward tests.
- Helpers deleted: `e2e/raid.ts`, `e2e/stranger.ts`, and from `admin.ts` `stageAccount`, `setDexCounts`, `clearIdleRaids`, `clearAuctions`, `setBagItem`. From `game.ts`: `chooseAction`, `openCatch`.
- Lost without replacement: the auction item lot (Master Ball) and its collect path. No database test covers item escrow for auctions. The pokemon lot covers the board, bid and collect path.

## Checks

- `pnpm typecheck`: exit 0.
- `rtk proxy pnpm exec oxlint src test e2e playwright.config.ts`: exit 0 (one pre-existing `max-depth` warning in `e2e/walk.ts`).
- `pnpm test --maxWorkers=2`: see the PR description.
- `pnpm test:e2e`, alone: full runs in this session ended 11 passed and 1 failed each time (auction-flow twice, before the buyer stopped claiming a starter, and battle once). Last run: auction-flow, safari, overworld (7) and starter-gift (2) passed, battle failed as above. No run with 12 of 12.

## Where the time goes

- Under the machine's load (average 17 to 21), a full run took 12 to 23 min. On a quiet machine the specs took about half that.
- `safari`: 3.1 to 9 min. It sweeps cells with one pointer move and one browser round trip each, then walks to a spawn and throws balls. The sweep reach is now 4 cells (was 7).
- `battle`: 1.3 to 7 min. It waits for the engine, which runs on real time.
- `auction-flow`: 1 to 4.5 min. Two sign-ups, a starter, a listing, a bid, a close and a collect.
- Each overworld test spends most of its 6 to 50 s in `signIn`.

## Size

- Estimated M, actual L. The findings (environment leak, database start order, save race, tabbed gifts) each needed a run of the full stack to find, and runs took 12 to 23 min under load.
