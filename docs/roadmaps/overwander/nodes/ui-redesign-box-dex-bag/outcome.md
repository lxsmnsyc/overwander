# Outcome: ui-redesign-box-dex-bag

## Built

- **Boxes** (`src/components/catches/catches-list/`), on the approved "Boxes" board. What the screen saves and how (filing, sorting, releasing, marks, boxes) is unchanged.
  - The dialog opens at the `sheet` width (76rem). The top line keeps the summary, New box and Select; Done replaces both while selecting.
  - **Rail** (`rail.tsx`): Find a box, then Default and the made boxes (grip, swatch, name, count pill), Let go today, the hint line and "n of 32 boxes used". Drop, drag and reorder are as before. On a phone it stays a chip row.
  - **Heading** (`heading.tsx`): one line with swatch, name, Built in badge on Default, the fill line, Add pokemon on an empty made box and the menu. The menu's inline questions are soft cards under it.
  - **Search row**: search, This box / All boxes as the new `Segmented`, sort and a square order button, and Pick all while selecting. The range line under it carries the slot-order note at its right end (`CatchGrid` `orderNote`).
  - **Selection bar** (`actions.tsx`): a full-width green band under the title. Move (a green menu), Favorite, Lock, Release, Clear, and the held-back line. The second press shows Let n go?, Keep them, the candy pills and the items note.
  - **Squares** (`CatchBox.tsx`, face in the new `box-square.tsx`): 12px squares that lift on hover, "Lv. n" over the HP bar, favourite and lock top left, shiny and shadow top right in arcane, purified in gold, a round tick or cross over the bar, dashed gaps with their `#NNN`, Put here and drop targets kept. "Drop here" is now a message.
  - **Hover card** (`CatchCard.tsx`): stars and sigil, the name large with level, gender and nature beside it, type pills tinted by type, the HP bar, then moves, ability pills and item squares in three columns. The picker hides the `HoverCard` bar for screen readers only (`quietTitle`), since the card names itself.
  - **Proposals, approved**: a fill meter under each made box in the rail (count over the box's rows, at least one box's worth), and a Picked tray (`picked-tray.tsx`) under the box while selecting, with up to 14 picks drawn, "+n more", and how many boxes they come from.
  - The let-go list (`released.tsx`) is rows with a still sprite and pages at `LIST_PAGE`.
- **Bag** (`src/components/items/inventory-list/`). `index.tsx` is now `BagDialog`; the route mounts it in place of its own `Dialog`.
  - 59rem (`rail` width) with a rail of pockets (`RailTabs`, `RailTab`), each with a colour square and count; the open pocket is still remembered per device. Candies is a gold tray.
  - The pocket's name and stack count head the tray; search, the 6x5 tray (3:2 squares, ink count pills, gold price notes) and the pager under it.
  - About the bag stays the `Hint` at the sheet's top right.
  - **Proposal, approved**: pressing an item docks `DetailPanel.tsx` on the right (art, count, pocket, sell price, description, the pokemon it would help, its verb). The sheet is 76rem while docked. The verb runs the press the square used to run (Use it on…, Open the raid with…, Climb out with…). An item with no use from the bag shows the panel without a verb. Pressing the square again, or its close button, puts it back. On a phone the panel is a sheet across the foot of the dialog.
  - The panel's "helps" list reads `readBox` (the kept box the picker reads) filtered by the picker's own rule (`isUsableOn`, not in a battle). No new server read.
- **Pokedex** (`src/components/dex/`). `PokedexDialog.tsx` wraps `PokedexTab` at the `rail` width with a dock note; the route mounts it.
  - Rail: seen and caught as number tiles, "of n", then a row per region with its seen count and caught bar, lit for the page showing.
  - Find and All / Caught / Missing on one row; the pager between it and the grid; larger 10:7 squares with the number bottom left; a key under the grid.
  - **Proposals, approved**: a forms mark on squares whose species has more than one form, and a gold star on a region with everything caught.
  - The forms dialog keeps its grid, count and Close on the restyled grid; a form's square shows its whole name as a tooltip.
- **Dex entry** (`dex-entry-dialog/`): `sheet` width and layout. A hero like the catch sheet's, washed in the first type's colour: square steps either side of "#NNN Name", category, type pills, seen and caught, close. Left: the field stage with coat and sex as `Segmented`, four fact tiles, the evolution line card with each method written between stages (and on the tooltip as before). Centre: base stats, abilities (born, "· hidden", "· signature"), habitat cards. Right: moves with Level / Machines / Egg tabs, scrolling in its card, each row with a type stripe. Unmet: ???, the silhouette, and the dashed "Meet this pokemon…" across centre and right.
- **Item dialogs**: Bottle Cap uses `RadioGroup cards`; Ability Patch's choices are the same cards; `MovePicker` rows take the catch sheet's move card (type stripe, name, sigil, category). The catch picker takes every change through the shared grid, squares and card; nothing else in it moved.
- **Phone (390x844)**: every screen is one column. Boxes keeps its chip row; the Bag's pockets and the Pokedex's regions are chip rows; the Bag's panel is a sheet across the foot; the dex entry stacks hero, portrait, tiles, evolution, stats, abilities, habitat, moves.
- **Styled** (shared, additive): `rail.tsx` (`RAIL`, `railRow`, `RailCount`, `RailTab`, `RailTabs`), `segmented.tsx` (`Segmented`), `card.ts` (`CARD`, `CARD_TITLE`, `riseAfter`, `tint`, lifted from the catch sheet; `catch-dialog/metrics.ts` re-exports them), `Dialog` width `rail` (59rem), `RadioGroup` `cards`, `Menu` tone `primary`, `HoverCard` `quietTitle`, `TabPane` `class`.
- Inventory: every item in `log.md` is ticked, with where it went noted below the list.
- Splits first, behaviour unchanged: `InventoryList.tsx` became `items/inventory-list/` (body, pockets, BagHint); `dex-entry-dialog/body.tsx` became one section per card under `sections/`.

## Deviations

- Files outside the owned paths: `src/routes/index.tsx` (the Bag and Pokedex mounts become `BagDialog` and `PokedexDialog`), `src/components/styled/*` (listed above), `src/i18n/messages/{en,ja,es}.json` (new strings below).
- `CatchBox.tsx` keeps its path and only its square face moved out (`box-square.tsx`): eleven importers outside the owned paths read `CatchBox`. `InventoryPicker.tsx` and `catch-picker/box.tsx` were not split: they changed little here.
- The move tabs in the dex entry are not paged. Their length is fixed by species data, not by the player, so `paged-lists` does not reach them; they scroll in their card as the board draws them.
- Boxes and the Bag scroll inside their panel at 1280x720 (`page` layout), as the boards' own content runs past their frames. The dex entry is a fixed `sheet` layout.
- The Bag sheet's width jumps between 59rem and 76rem rather than animating: a width transition on the dialog's placed box would fight the presets' transition property.
- A bag square is announced as the item and its count ("Potion, 12 carried"), since a press now docks the panel; the verb is on the panel. The square carries `aria-expanded`, and closing the panel returns focus to it.
- The hover card keeps the `HoverCard` frame (its footer with the verb). The board draws the verb inside the card body.
- The Bag's dock note and the Pokedex's dock note are new strings the boards carry.
- New strings: `catch_box_drop_here`, `catch_picked`, `catch_picked_more`, `catch_picked_from`, `item_pocket_stacks`, `item_pocket_piles`, `item_press_note`, `item_panel_sells`, `item_panel_helps`, `item_panel_helps_count`, `item_panel_helps_none`, `item_panel_use`, `item_panel_close`, `dex_entry_forms`, `dex_tile_seen`, `dex_tile_caught`, `dex_regions`, `dex_key_caught`, `dex_key_seen`, `dex_key_unmet`, `dex_key_forms`, `dex_press_note`, `dex_tile_height`, `dex_tile_weight`, `dex_tile_candy`, `dex_tile_hatch`, `dex_total_label`, `dex_ability_hidden`, `dex_ability_signature`.

## Stubs left

- None.

## Handoffs

For `ui-redesign-social`:

- **Rail**: `RAIL`, `railRow(current)`, `RailCount` (`lit` for a search's match counts), `RailTab` and `RailTabs` from `src/components/styled`. Width is the caller's (`md:w-[13rem]` and up). It turns into a chip row below `md`.
- **Segmented control**: `Segmented` (`label`, `value`, `options`, `onChange`), a radio group on one track.
- **Detail panel**: `items/inventory-list/DetailPanel.tsx` is the pattern: an `aside` that is a bottom sheet below `md` and a 18.75rem column with a left keyline from `md`, opened by a press on a square and widening its dialog from `rail` to `sheet`.
- **Cards**: `CARD`, `CARD_TITLE`, `riseAfter`, `tint` from `styled`.

## Gotchas

- The dialog's placed box is translated to centre it, so a `fixed` child (the Bag's phone sheet) is placed against the dialog, not the window. It sits across the dialog's foot, over the dock.
- The green selection band bleeds to the sheet's edges with negative margins and `grow basis-full` inside the dialog's `bar` row; anything else put in `bar` beside it wraps under it.
- `RailTab` rows pick their height from `md:min-h-10`; the Bag overrides it with `md:!min-h-9` so twelve pockets fit beside the tray.
- A form's corner label is cut at six columns in the forms dialog. Its `title` carries the whole name.

## Proposed learnings

- A rail of places is `styled/rail.tsx`, a chip row on a phone | the box, bag and dex rails were three hand-rolled lists | src/components | no
- A width cap a caller needs on a shared tray is a `fill` prop, not a class | `ItemGrid`, `CandyGrid`, `PokedexGrid` and `CatchBox` each drew their own max width | src/components | no

## Verification

- `pnpm typecheck`: exit 0.
- `rtk proxy pnpm exec oxlint src test`: exit 0.
- `pnpm test --maxWorkers=2`: exit 0, 288 files, 5859 tests passed.
- The first full run failed one test (`test/i18n/no-machine-formatting.test.ts`: the hatch tile called `toLocaleString`); it now uses `formatNumber`.
- Captures: a Node and Playwright script against `pnpm dev` (run with `RELEASE_GRACE=1` so the let-go list exists) and the dev database from `pnpm db`, signed in as the seed's alice. `seed-box.mjs` stages the data (boxes with gaps, eggs, a fainted one, an empty made box, two let go today, 40 bag stacks across every pocket (an unregistered item id, 320, was dropped from the stage: a bag search throws on an item the registry does not know, on `main` too), 7 candy piles, a dex with Kanto complete and forms met). Folder `/private/tmp/claude-501/-Users-alexis-Documents-GitHub-poketerra/ace141b8-b1f0-4d53-a0be-72de5b09d760/scratchpad/shots-box/`:
  - `board/`: the four boards through the battle node's `support.js` stand-in: `box-{browse,props,select,release}`, `bag`, `bag-props`, `dex`, `dex-props`, `entry-{met,moves-machines,unmet}`.
  - `before/`: the old screens, desktop light (every state), desktop dark and phone light (the main ones).
  - `after/`: `{desktop,phone}-{light,dark}-*` for `box-{browse,select,all,empty,letgo}`, `bag-{all,pocket,candies,panel}`, `dex`, `dex-{find,johto,forms}`, `entry-{met,unmet}`, `picker` (Use it on from the panel), `cap`, `patch`, `pp`; desktop `shared-{gifts,profile,battle}`; and `desktop-light-shared-{buddy-picker,teams,team-pick,trades,box-picked-tray,box-hover-select}` and `desktop-light-bag-panel-usable`.
  - Each desktop shot was compared with its board. Kept differences:
    - The boards' "Show proposals" and "Show unmet" switches are board furniture.
    - The hover card keeps its footer bar.
    - Boxes and the Bag scroll in their panel at 720px tall.
    - Sprites are the game's own.
  - Some shots caught squares before their sprites loaded (blank squares); the layout is what they are for.
- Not reached by the seed and not captured: an auction board and a trade offer with pokemon on both sides (the shared grid and card are the same pieces the gifts shelf and the buddy picker show), an NPC form.

## Size

- Estimated L, actual L.
