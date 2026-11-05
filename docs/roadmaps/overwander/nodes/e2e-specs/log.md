# Log: e2e-specs

## Findings, in the order they surfaced

- The web server starts before the global setup, and the server migrates the database as it boots. With the dev database stopped, the first run failed with `ECONNREFUSED` on port 54324 until the 180 s webServer timeout. The server command now starts the database first.
- The root `.env` leaked into the dev server. `OVERWANDER_ENV_DIR=test/env` moves vite's env directory, but the server still loaded production's `.env`, and an empty value in `test/env` does not beat it. The server ran `VITE_WORLD_GENERATION=2` while the specs wrote generation 1 rows. `playwright.config.ts` now sets the seed and the generation outright.
- `standBeside` had two causes. The generation mismatch above put its row in a world the server never read. After that, a race remained: a new player has no position row, the page rolls a start position and saves it once the world is up, and that save overwrote the staged row. The helper now waits for the page's own row, then upserts and reloads.
- The Portal dialog from the brief did not open in any run on the current HUD (the board says "Portal ahead of you" and nothing covers it). `signIn` still closes an open dialog before returning.
- A cold dev server answers `/` before it has compiled the app, so the first sign-up took longer than a spec waits ("Loading session" for over a minute). The global setup now signs one throwaway account up first. `signIn` and a new `reloadGame` reload a page stuck on the loading text.
- The gifts shelf is now tabbed (Catches, Items) and holds 15 starters, so the old "three starters" and balls-on-the-same-shelf specs were stale. The Gifts menu key wears a count ("Gifts 16"), so the exact name no longer matched.
- Hover cards open over the square or the tab bar and swallow a pointer press. Shelf squares and tabs are pressed with a dispatched click.
- Generated columns on `caught` grew (`hurt`), which broke the hand-kept list in `copyable`. `insertRow` now reads the generated columns from the catalog.
- The auction lot card for an item is named after the item, not "Info". The bid and collect messages sit in a status line, and the lot card is told from terracotta dialogs by having no `tc-dialog`.

## Decisions

- Kept five specs and folded three single tests into them: sign out, the second-screen stand-down and the card that goes when its square leaves the page.
- `battle.spec.ts` now waits for the demo raid to say how it ended. The old tests of the demo page (new seed, party cards) were dropped, the card and size checks kept inside one test.
- The auction spec keeps the pokemon lot. The item lot shares the board, bid and collect path. No database test covers item escrow for auctions (`test/model/auction.test.ts` covers the rules only), so the item lot is the one thing the cut loses. Listed in the outcome.
- `safari.spec.ts` tries up to three encounters before it skips, so a fled pokemon does not skip the run.
