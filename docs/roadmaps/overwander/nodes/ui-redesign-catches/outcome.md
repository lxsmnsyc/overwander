# Outcome: ui-redesign-catches

## Built

- **Catch sheet** (`src/components/catches/catch-dialog/`), rebuilt on the approved "Catch sheet" board (`docs/design/field-kit/Sheet.dc.html`). Every prop of `CatchDialog`, every store call, write and toast is unchanged; the call sites in the box, the battle view, the profile and the admin dialogs are untouched.
  - The `Dialog` is `quiet` with the new `sheet` width (`w-[min(96vw,76rem)]`, 1216px at 1280) and `layout="sheet"`. The title and description stay as the dialog's accessible name and sentence.
  - **Hero** (`sections/HeroSection.tsx`): the field stage (`sections/PortraitSection.tsx`, now the stage only) with the ball on its corner; the name in Fredoka 30, the species when nicknamed, gender, shiny, and the level as an ink tag; the chips (types, category, height, weight, friendship with its tooltip, steps); stars, sigil, health bar, Fainted and status squares; the marks (Favorite, Buddy, Locked, Shadow, Gigantamax, In a raid) only where they apply. The header is washed in the first type's colour (`tint` in `metrics.ts`, a `color-mix` into `paper`, so it works at night).
  - Top right: box chip (owner), Actions (owner, or anyone where `onDex` is given), and a `CloseButton` running the same `closeSheet`.
  - **Tiles** (`sections/HeroTiles.tsx`): the tera type tinted in its type's colour, and the candy tile (`catch_candy_held`) with Level Up and its candy cost, disabled on the same four conditions as before. The candy tile is drawn only on the reader's own pokemon: on anyone else's the pile (the reader's) read as the owner's.
  - **Left**: Stats (`sections/StatsSection.tsx`): heading, Hint and, beside them as on the board, a nature badge naming the stat raised and lowered (`catch_nature_shift`, cut with an ellipsis and spelled out in its title when it does not fit), the **hexagon** (`sections/StatHexagon.tsx`, 156px tall), then mark, name, total, IV, EV input (or number), and a Remaining, Undo and Save row that is as tall as its buttons whether they show or not. The whole column fits at 1280x720.
  - **Centre**: `sections/BattleSection.tsx` is a container (`@container`). Moves are compact 36px cards two to a row, each as main drew it (name, type sigil, category badge) plus a thin type-coloured left edge; power and PP are in the existing move tooltip, and on a phone also as small trailing text under the name (`catch_move_numbers`, `catch_move_numbers_status`, never wrapped). Drag reorder, Undo and Save, and "Drag to reorder" while it can be. Empty and locked cards say so in words; locked keeps its tooltip. All eight slots fit at 1280x720 without the column scrolling. Abilities (tinted by kind) and Held items sit under them side by side: the items are a wrapping row of 48px squares (give square, `HoverCard` with Take). At 1280 their card is four squares wide, so eight slots are two rows of four; on a phone they run six to a row.
  - **Right**: Evolution (`sections/EvolutionSection.tsx`) as a vertical line from the pokemon down to what it becomes (coat drawn to the reader's dex, name once met, condition or "ready", Evolve per option, the method as the option's title). One option stands under the arrow; a line that branches (Eevee's eight, Rotom's appliances, Deoxys' formes) lays its options out as tiles, as many to a row as the card has room for (two on desktop, three on a phone), and the column scrolls when it is longer than the sheet. An Origin card (`sections/OriginSection.tsx`, `catch_origin`) under it: ball, history line, History (n). The dock is gone.
  - **Egg**: hero with the egg and "Egg", then a Hatching card (bar, note, Hatch it) and the Origin card.
  - **Phone (below `md`)**: one scrolling column: controls in the top row, portrait and name on one row, chips and rows full width, tiles under, then Moves (two wide), Abilities, Held items, Stats, Evolution, Origin.
  - **Motion**: each card rises in (`rise-in`, `--motion-base`, `ease-settle`) two stagger steps after the one before, left to right. The hexagon's values grow out of its middle (`grow-in`, `--motion-scene`, `ease-spring`, 200ms in). Move cards lift 3px on hover on the spring. All are `motion-crossfade`, so reduce motion leaves a 120ms fade.
- `metrics.ts`: `CARD`, `CARD_TITLE`, `riseAfter(n)`, `tint(colour, amount)`.
- Inventory: `log.md` lists every control, section and piece of state of `index.tsx`, `sheet.tsx`, `describe.tsx` and the sections. Every item has a place; nothing is lost.

## Deviations

- Files outside the owned paths:
  - `src/components/styled/dialog.tsx` (shared path): a fourth `DialogWidth`, `sheet`. And `layout="sheet"` now fixes its height only on a screen at least 48rem wide **and** 32rem tall; a shorter one (a phone held sideways, 844x390) scrolls the whole panel instead of clipping it, with the columns side by side. The dex entry dialog is the other `layout="sheet"` user and gets the same fallback.
  - `src/app.css`: a `grow-in` keyframe (opacity and `scale(var(--motion-grow-origin))`), so reduce motion leaves only its fade.
  - `src/i18n/messages/{en,ja,es}.json`: new `catch_stats_help_shape`, `catch_stat_value`, `catch_nature_shift`, `catch_move_numbers`, `catch_move_numbers_status`, `catch_drag_reorder`, `catch_candy_held`, `catch_origin`. `catch_stats_help_bars` is removed (the bars are gone).
- The six stat bars are replaced by the hexagon, as the board has it. The hexagon reads the same thing (each total against the pokemon's best).
- The close button sits in the header, against the `dialog-layout` rule of one way out in the dock: the board moves Close there and the dock is gone.
- The nature badge drops under the Stats heading when it does not fit beside it (English "Jolly · ▲Speed ▼Sp. Attack" is wider than the board's "Atk").
- Accepted by the maintainer at the gate (2026-11-05): the stat bars replaced by the hexagon; Close in the header, an exception to `dialog-layout` for this sheet only; a still green ring on a ready evolution instead of the board's endless pulse; every locked slot drawn; long stat names cut at 768 to 1024 wide; the phone layout; the `layout="sheet"` height rule.
- Changed at the gate: moves are two to a row of compact cards keeping main's sigil and category badge (the board's three-wide cards with written facts are gone); held items are a wrapping row, not a three-wide grid; the stats column fits at 720 with the nature badge beside the heading; the candy tile is hidden on a sheet that is not the reader's.
- The board shows four moves, one empty and one locked card. The sheet draws every slot up to eight as it did before; all eight fit at 1280x720.
- Fix: a sheet opened read-only showed the evolutions of the last own pokemon that was open (the resource keeps its last answer). It now passes none when the reader does not own it, and the card is not drawn. The same was true on `main`.
- No separate behaviour-only split commit; see log.

## Stubs left

- None.

## Handoffs

For `ui-redesign-box-dex-bag`:

- **Stat hexagon**: `src/components/catches/catch-dialog/sections/StatHexagon.tsx`, default export `StatHexagon`. Props `stats: HexagonStat[]` (six `{ name, value, tone? }`, clockwise from the top; `tone` is a `fill-*` class), `label` (the screen reader's text) and `class`. It scales to its width (`viewBox` 240x200) and measures every corner against the largest value. The summary order clockwise from the top is HP, Attack, Defense, Speed, Sp. Defense, Sp. Attack (`HEXAGON_ORDER` in `StatsSection.tsx`). The dex can feed it base stats. Lift it into `src/components/styled` or `src/components/sprites` if the dex uses it, so the dex does not import from the sheet.
- **Move card**: the card is markup inside `BattleSection.tsx` (`MOVE_CARD`, `describeMoveNumbers`): a 36px `rounded-[10px] border-2 border-line bg-paper` grid with a `w-1.5` left edge in `TYPE_COLORS[type]`, the name `text-sm font-bold`, `Sigil` (18) and `MoveCategorySprite` (45) on the right, power and PP on a phone only, a 2px hover lift on `ease-spring`, wrapped in `MoveTooltip`. To reuse it, move it and `describeMoveNumbers` into a `MoveCard` component.
- `CARD`, `CARD_TITLE`, `riseAfter` and `tint` in `catch-dialog/metrics.ts` are the sheet's card look; the box and dex can use the same if they lift them to `styled`.

## Gotchas

- A card's rise fills `backwards`. With `both` a card at rest kept an identity transform and became the containing block for anything fixed inside it.
- The moves grid and the abilities and items row switch on the container (`@lg`, 32rem of the centre column), not the window.
- The hero's info block is `contents` below `md`, so its rows are grid items of the hero; a new row needs `col-span-2`.
- The evolution card is drawn only once the options are in, and never on a sheet that is not the reader's.
- At 768 to 1024 wide the left column is 15rem, so long stat names truncate in the table (seen in the sideways shot).
- The base layer makes every `ul` a `flex-col`; a list meant as a row needs `flex-row` written out (the held items stacked into a column without it).
- The worn ability of an all-form species (Ogerpon's mask ability, a Terastal shape's Embody Aspect) is a battle-time fact, not on the record, so the sheet shows the record's abilities only, as before.

## Proposed learnings

- A rise or grow on something that stays on screen fills `backwards`, not `both` | a filled transform at rest makes a containing block for fixed children | src/components | no
- A width cap inside a panel switches on `@container` sizes | the sheet's columns are narrower than the window says | src/components | no

## Verification

- `pnpm typecheck`: exit 0.
- `rtk proxy pnpm exec oxlint src test`: exit 0.
- `pnpm test --maxWorkers=2`: 282 files, 5835 tests passed (before and after the gate fixes).
- Captures: a Node and Playwright script against `pnpm dev` and the dev database from `pnpm db`, signed in as the seed's alice. Dev data set by hand: a nicknamed shiny Charmeleon at 41 with four moves, two abilities, Charcoal and a trade history (full); the claimed Bulbasaur with three moves (slots); an egg at 1,280 of 5,120 steps; a shadow Houndoom (shadow); Bob's shiny Charizard as his buddy, opened from the history (read-only); 86 Charmander candy. Folder `/private/tmp/claude-501/-Users-alexis-Documents-GitHub-poketerra/7eec9570-9610-4c90-911c-8b0807a9b113/scratchpad/shots-catches/`:
  - `board/sheet.png`: the approved board, rendered through the `support.js` stand-in.
  - `before/` and `after/`: `{desktop,phone}-{light,dark}-{full,slots,egg,shadow,readonly}.png`, `phone-{light,dark}-full-foot.png` (the column scrolled to its foot), `sideways-844x390-light-full.png`, `wide-2560x1080-light-full.png`.
  - `after/` only: `sideways-844x390-light-full-foot.png`, `desktop-light-full-hover-move.png` (move tooltip over a lifted card), `desktop-light-full-actions.png` (the Actions menu).
  - `after/` only, after the gate fixes: `form-{deoxys,rotom,ogerpon,eevee}-{desktop,phone}-light.png` and `form-*-phone-light-foot.png` (the phone column at its foot). `desktop-light-full`, `desktop-light-readonly` and `phone-light-full` are retaken after the fixes; the other `after/` shots are from before them.
  - Each desktop shot was compared with the board. Kept differences: eight move slots drawn instead of six, two moves to a row as the maintainer asked, the still ready ring, the tera tile tinted by the tera type rather than a fixed blue.
- Form cases (own catches, dev db only): Attack Deoxys (form id 1038601), Wash Rotom (1047902), Wellspring Mask Ogerpon (1101701, tera Water), Eevee at full friendship.
  - Deoxys and Rotom: their formes and appliances are offered as evolution options with an item condition, so the evolution card branches like Eevee's.
  - Eevee: eight options. They were a column eight pictures long; they are now tiles (two to a row on desktop, three on a phone) and the right column scrolls on desktop.
  - Ogerpon: the long name wrapped badly on a phone (cut to "Wellspring Mask..."); the hero name now wraps below `md` and truncates above it. Two types and its tera tile fit.
  - Every form: the evolution condition squeezed each part into a column of its own in a narrow tile; its parts now wrap as a line.
- Motion measured in the browser just after opening: cards at opacity 0 and 4px down with delays 0 to 300ms in 60ms steps, the hexagon at scale 0.15; at rest every card has `transform: none`. With reduce motion: 120ms, no delays, no movement.

## Size

- Estimated L, actual L.
