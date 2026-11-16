# Outcome: ui-redesign-finish

## Built

The capture pass for the story. Nothing new was built here beyond the fixes listed under Deviations; the three build nodes landed earlier on `feat/ui-redesign-finish`.

## Captures

- Staging: `pnpm db`, `pnpm db:migrate` and `pnpm seed` on the throwaway database (port 54324, `overwander_dev`), then `pnpm dev` (which reads `.env.development`). Scripts lived in the session scratchpad and are not committed. Every script that wrote data built its connection from one constant and refused any name other than `overwander_dev` on 54324. Production (`db` on 54322, `overwander-app-1`, `overwander-db-1`, `overwander-tunnel-1`) was never connected to or touched.
- Data staged over the owner connection: users Carol, Dave and Erin beside the seed's Alice and Bob; 10 starter pokemon claimed through the Gifts shelf and copied to the friends; two friendships and a request each way; six trades (open both ways, an open ask, accepted, declined, cancelled); eight auction lots in every state (Winning, Outbid, Won, Sold, Unsold, one running of Alice's, a pokemon lot, a lot with no bid); two announcements; 25,000 gold. A raid lobby (Bloodmoon Ursaluna) and a duel lobby were hosted by Bob through the real UI, with Alice invited; Alice joined through the real UI.
- Overworld counters: a Playwright spec (run with the repo's own `playwright` and `e2e/vite-hooks.ts` so `src` imports resolve) worked out landmarks and the 3-hourly wanderers in Node from the live world (seed `lxsmnsyc`, generation 2), wrote Alice's position beside each, then hovered the cells round the player, read the board's title and pressed the one named. A Safari encounter was found the same way from `ChunkSnapshot` spawns. The second-factor step was reached by answering the sign-in request with `twoFactorRedirect`.
- Sizes: 1280x720 and 390x844, light and dark (`colorScheme`), signed in as Alice. The phone menu is three tabs (You, Play, Inbox), so the scripts press the tab first.
- Folder: `/private/tmp/claude-501/-Users-alexis-Documents-GitHub-poketerra/8a575061-3d8f-4fb2-b74b-24dda4f11186/scratchpad/shots-finish/`, 356 shots named `<screen>-<state>__<size>__<theme>.png`.
- Board shots to compare against were the ones the approval gate rendered (`shots/<Board>-<n>.png`, 1280x720); each desktop shot was read against its board, the phone shots against the Phone sections of the three build briefs.

## Deviations

Fixed on `feat/ui-redesign-finish`:

- Trade offer (from the profile's Friends pane): the dialog opened behind the profile and was invisible. Dialogs in one container stacked in the order they were made, and the profile is made lazily. `Dialog` now moves its container to the end when it opens (`styled/dialog.tsx`).
- Auctions: the hover card stayed over the Bid sheet after pressing Bid, Collect or a seller. The item square's card and the pokemon lot's card now close on the press (`items/ItemGrid.tsx`, `auction-tab/lot-actions.tsx`, `board.tsx`).
- Auctions and Gifts: the items tray was a 32rem box in the middle of the pane while the pokemon tray ran full width. The board's items tray, the sell mode's bag tray (new `fill` prop on `InventoryPicker`) and the gifts items tray now fill the pane, as on the boards.
- Raids, Battle, Notices, Gifts and Auctions: the nameplate icon the boards show was missing (`routes/index.tsx`). The raid and duel lobbies keep a plain title, as on their boards.
- World map on a phone: the chip row ran Ground, Sky, a long place name and then the Key chip off screen, with the place name clipped. The place now comes last in the row and drops its chunk line on a phone, so the Key chip and the showpieces are in reach.

Left as the maintainer accepted: no Take back on a running lot, the lair hero without a bubble, dialog widths on the existing scale, Safari's level pill, ProfileTab for the staff panel, awards in rows of eight, quest chains' claimed counts, longer Friends and Trades sentences in tooltips.

Seen and left (small, shared pieces, not worth a risky change here):

- The catch picker tray in the breeder, groomer, tutor and trade pickers is narrower than the dialog (the board draws it full width).
- The auction board's pokemon tray draws every empty square of its grid, so it runs past the dock and scrolls; the board shows two rows.
- Announcement banners shrink to their text instead of the board's fixed width, and sit over a dialog's nameplate while they last.
- The command bar's suggestions for `tp pl` list the argument name (`player:`), not the three values the board shows; values appear after the colon.
- Quest chain names in the rail truncate when the ready count is on the row.

## Not reached

- Factory: the nearest Rented-rule Frontier Brain was "not taking challengers" in this window, so the crate tray was not shown (the Stop counter that shares its furniture was captured).
- Safari Fled and exited, and the Caught state on phone: only the idle, Bag and Caught states on desktop light, and the idle state in the other three, were captured.
- NPC forms: Say (Kurt), shop Buy (Chef, Geologist, Vendor), Move Tutor and Move Reminder (teach, but with no Pokemon able to learn, so the move cards were not shown), Breeder and Groomer (pick), Daycare, Nurse Joy and Trader. Shop Sell, the Ask list with a have-line and the teach move cards were not staged: no pokemon with forgettable moves or sellable stock was set up.
- Duel and raid lobbies with two full parties and a countdown, and a live raid lair on phone dark and light for the Max Raid: lair dialogs were captured for the Legendary and Max Raid sites on desktop light and the first three sizes only.
- Awards and Teams panes populated with real data (Alice has no battles, badges or saved teams).
- The staff panel and the Development settings pane's behaviour beyond opening it.

## Stubs left

- None.

## Gotchas

- The dev server compiles on first load for over a minute; a script that signs in must wait, and `waitFor` on the sign-in field rather than a Sign in tab (the mode switch is a `Segmented`, so its parts are radios).
- Wanderers, raid lobbies and Stop challengers follow 15 minute to 3 hour windows. Stage and capture a raid within its window (3 hours from `window_at`).
- A hover-card press leaves the card up under a sheet unless the action closes it: pass `close` into the card's footer (see the fix above).
- `CHUNK_CELLS` is 16, not 25; a landmark's cell index is `y * 16 + x`.

## Proposed learnings

- A dialog that can be opened from inside another must stack after it | made lazily, a dialog sits under one made with the page | src/components/styled | yes (a render test that opens two dialogs in either order)
- An action in a hover card closes the card first | the card otherwise stays over the sheet the action opens | src/components | no

## Verification

- `pnpm typecheck`: clean.
- `rtk proxy pnpm exec oxlint src test`: exit 0 (warnings only, none new).
- `pnpm exec oxfmt` on the touched files.
- `pnpm exec vitest run test/components test/i18n`: 16 files, 101 tests passed.
- `pnpm test` (full suite) is not part of this pass; it runs once after the capture pass for the story.

## Size

- Estimated M, actual L: the capture pass needs a staged world, and each overworld counter is a minute of browser time per size and theme.
