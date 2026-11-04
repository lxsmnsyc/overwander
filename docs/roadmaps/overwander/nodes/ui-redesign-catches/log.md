# Log: ui-redesign-catches

## 2026-11-05

- Branch `feat/ui-redesign-catches` from `origin/main` (4bdab9f9b). No earlier work for this node.
- Dev data: `pnpm db`, `pnpm db:migrate`, `pnpm seed` (alice, bob) on port 54324. Production's `db` untouched.

## Inventory

From `index.tsx`, `sheet.tsx`, `describe.tsx` and `sections/`. Each line: from -> to. Ticked once it has its place in the new sheet.

### Frame and heading (sheet.tsx)

- [x] Dialog (`width="broad"`, `layout="sheet"`), open only once the record for this id is in and no side dialog is up -> same rules, `quiet` sheet with the hero as its heading, new `sheet` width (1216px at 1280).
- [x] Nameplate title: sr-only lead "Pokemon Info", name (nickname, species, "Egg", "Catch" while loading), `(species)` when nicknamed, gender mark with label, shiny icon -> hero name row, the name in Fredoka 30; the title and lead stay as the dialog's accessible name.
- [x] Nameplate lead: the ball sprite -> the stage's top left corner.
- [x] Description (own or theirs, sr-only) -> kept as the dialog's description.
- [x] Box chip (owner only): Menu of boxes, Default, New box dialog -> hero top right.
- [x] Badges: Favorite, Locked, Shadow, Gigantamax, Buddy, In a raid -> hero badge row, each only when it applies.
- [x] Actions menu (owner, or anyone when `onDex`): Favorite, Lock, Use item, Auction, Name, Buddy, View in dex, Release; disabled rules -> hero top right, unchanged entries.
- [x] Close in the dock -> a close button top right of the hero (closeSheet: also drops a half-made release, the history and the bag).

### Portrait column (sheet.tsx, PortraitSection)

- [x] Field stage with the sprite (idle, aura, shiny, female, sized) -> hero stage, 220x150.
- [x] Level box on the stage -> level tag after the name (`catch_level`), the shown level including queued candy.
- [x] Stars (role img, label) and sigil -> hero row under the chips.
- [x] HP bar, `health/max`, "Fainted", status squares -> same hero row.
- [x] Chips: category, types, height, weight, friendship (tooltip), steps walked -> hero chip row.
- [x] Tera type -> hero tile.
- [x] Candy count (`?` when the read failed) -> hero candy tile.
- [x] Level Up button (owner; cost badge; Lv. n at max; disabled rules) -> in the candy tile.

### Evolution (EvolutionSection)

- [x] "Evolves into" list: coat per option (met, revealed, shiny, female, called), condition or "ready", row title with the full method, Evolve (owner; disabled while frozen or unavailable) -> right column, a vertical line from this pokemon down to each option.
- [x] "No evolutions or forms" once the answer is in -> same card.

### Stats (StatsSection)

- [x] Heading, Hint with six lines, nature badge -> left column card heading.
- [x] Per stat: nature mark (title, aria), name, bar against its best, total, IV (gold at max), EV input (owner) or EV number -> table; the six bars -> the hexagon, which reads the same way (each total against the pokemon's best). The help line about the bars now says the shape (`catch_stats_help_shape` replaces `catch_stats_help_bars`).
- [x] Remaining, Undo, Save (owner, while something is laid out) -> under the table.

### Battle (BattleSection)

- [x] Moves: heading with Hint, Undo and Save while reordered, drag reorder, MoveTooltip per move, type sigil and category per move, empty and locked slots (locked tooltip says what opens it) -> centre card, moves as cards 3 wide (2 under 32rem of column). The type sigil and category sprite -> the type's colour as the card's stripe and "type · category · power · PP" written under the name (board proposal). Empty and locked cards say so in words.
- [x] Abilities: heading with Hint, Undo/Save, reorder, ability tooltip, badge tone by kind (regular, hidden, signature), empty and locked slots -> card under the moves.
- [x] Held items: heading with Hint, Undo/Save, reorder, HoverCard with Take (owner) or Close, give square (+) opening the bag picker, empty and locked squares -> card beside abilities.
- [x] Give picker (InventoryPicker) -> unchanged.

### Dock and history

- [x] Ball sprite and history line (`describeHistory`) -> Origin card, right column foot.
- [x] History (n) button and the History dialog (HistorySection: ball, owner name or link, acquisition, date, price) -> button in the Origin card, dialog unchanged.

### Egg

- [x] Egg portrait, "Hatching" progress bar, progress note (buddy or idle), Hatch it (owner, disabled until ready) -> hero (egg on the stage, "Egg" as the name), a hatching card in the body, Origin card.

### States

- [x] Loading note and missing note -> kept inside the sheet body.
- [x] Read-only (auction lot, battle): no box chip, no inputs, Actions only with `onDex` -> same.
- [x] Someone else's catch: treated as absent -> same.
- [x] Frozen (fighting or locked): inputs and buttons disabled -> same.

### Side dialogs (unchanged, kept mounted where they are)

- [x] Release confirm (blocked reasons, pays and returns note, Release, Keep it).
- [x] Naming dialog (field, draft note, Save, Never mind).
- [x] Use item InventoryPicker (lead portrait, TargetStrip, confirm, warn).
- [x] Fold picker (CatchPicker), Ability patch, Increase PP, Bottle cap dialogs; teaching forms via `askTeachings`.
- [x] Toasts for every write.

## Notes

- Before shots were taken against the running dev server while the first edits landed. Only the wide shot was taken after a source edit; it was retaken on a clean stash. The read-only before shots show the visited profile over the sheet; the script now presses Escape to close it, and they were retaken on a clean stash too.
- Read-only data: Bob walks with a Charizard and has a trade entry on Alice's Charmeleon, so History -> Bob -> his buddy opens a read-only sheet. Only the dev db was written.
- Found: a read-only sheet showed the evolutions of the last own pokemon that was open (the resource keeps its last answer once its key goes null). The sheet now passes no options when the reader does not own it, which hides the card. Same behaviour on `main` (see `before/desktop-*-readonly.png`).
- The rise animation fills `backwards`, not `both`: with `both` a card at rest kept an identity transform, which makes it a containing block for anything fixed inside.
- The board's "ready" ring pulses forever; the overworld gate ruled out endless pulses, so a ready evolution gets a still leaf ring.
- No separate split commit: the new parts (`HeroSection`, `HeroTiles`, `OriginSection`, `StatHexagon`, `metrics.ts`) came out of `sheet.tsx` as the layout changed, so a behaviour-only split would have been redone at once.
- Sideways (844x390) first showed the hero filling the fixed-height panel with the columns clipped under it. `layout="sheet"` now fixes its height only at 48rem wide and 32rem tall, so the panel scrolls there. Recorded as a deviation (the dex entry uses the same layout).
- Checks: typecheck 0, oxlint exit 0, `pnpm test --maxWorkers=2` 282 files and 5835 tests passed.
