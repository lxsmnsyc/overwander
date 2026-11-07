# Log: ui-redesign-box-dex-bag

## Inventory (2026-11-07, read from the components)

Paths are under `src/components/`. Each item gets ticked when it has a place in the built screen.

### How the screens open

- [x] One page: every panel is a dialog over the world, chosen by `game.dialog()` (`src/routes/index.tsx:147`).
- [x] Keypad group You: Boxes (`panel_boxes`, `BoxIcon`), Bag (`panel_bag`, `BagIcon`), Pokedex (`panel_pokedex`, `SearchIcon`), then Profile (`app/GameMenu.tsx:124-133`).
- [x] Mounts: Boxes `CatchesList` (broad, :173); Pokedex dialog (wide, terse, `panel_pokedex_description`, Close, :180); Bag dialog (wide, terse, `aside={<BagHint/>}`, Close, :196). `CatchDialog`, `SpeciesFormsDialog` and `DexEntryDialog` are mounted over everything (~:414-462).

### Boxes (`catches/catches-list/*`)

- [x] Dialog `broad`, title `panel_boxes`, lead `BoxIcon`, shown description `catch_boxes_summary({total, count})`, `aside`, `bar` while selecting. Wrapped in `BattleData` (Close only while loading). `viewOnly` prop exists, no caller.
- [x] Aside: New box `catch_box_new` (`PlusIcon`, toggles pressed, hidden on phone), Select `catch_select` (`SelectIcon`); while selecting, Done `catch_done`. All disabled while `busy()`.
- [x] Rail (`rail.tsx`, `nav` labelled `panel_boxes`; a chip row on phone):
  - [x] Find a box `catch_rail_find` (desktop only).
  - [x] Box rows: Default first (built in, `DEFAULT_BOX_TONE`, no grip), then made boxes; grip (desktop, own), swatch, name, count pill. Search across all boxes: match counts, tide pills. States: current (`aria-current`), drop target (dashed leaf), dragging.
  - [x] Drop pokemon (or every picked one) on a box to file it; drag a box by its grip to reorder (`BOX_DRAG`, `arrangeBoxes`).
  - [x] Phone + chip `catch_box_new`; New box form (`catch_rail_new_with({count})` with picks, else `catch_box_new`; verb `catch_box_make_it`).
  - [x] Let go today (`ClockIcon`, `catch_let_go_title`, count) when `letGo > 0`.
  - [x] Hint line (desktop): `catch_rail_counting` / `catch_rail_drag_picked({count})` (leaf) / `catch_rail_drag`.
  - [x] `catch_rail_used({count, max: 32})`.
- [x] Let-go list (`released.tsx`): `catch_let_go_title`, `catch_let_go_note`, rows (name, `catch_level`, `catch_take_back({candy})`), empty `catch_let_go_none`, toasts `catch_take_back_gone`, `_no_candy`, `_done`. Not paged.
- [x] Box heading (`heading.tsx`): swatch, name, Built in badge `catch_heading_built_in`; fill line (`catch_heading_picking` (+ `_place`), `_default({count})`, `_empty`, `_count`, `_slots` + `_gaps`); Add pokemon `catch_heading_add` (empty made box, not selecting).
  - [x] Menu `catch_heading_menu({name})`: Rename, Change colour, (sep) Lay out by dex number (+ hint; disabled empty), Close up the gaps (+ hint; disabled no gaps), Move all `({count})` (disabled empty), (sep, danger) Delete.
  - [x] Inline: BoxForm for rename/colour (`catch_heading_rename_box`, `_colour_of`, verb `catch_heading_save`); Move all `Select` `catch_heading_move_all_to` + `catch_heading_move_them` + `ui_never_mind`; Delete twice `catch_heading_delete_ask({name, count})`, `_delete_it`, `_keep_it`.
  - [x] Toasts: `catch_laid_out`, `catch_gaps_closed`, `catch_moved_all`, `catch_deleted`, `catch_bad_name`, `catch_made`, `catch_made_with`.
- [x] Inline `CatchPicker` (index.tsx:682): `fill`; `box` or null for all boxes; empty notes `catch_empty_default`, `_box`, `_theirs`; empty card `catch_empty_card_title`/`_note`; placeholders `catch_picker_search_all`/`_box`; scroll line `catch_view_slots`/`catch_view_showing`; all-boxes results `catch_found_in({count, boxes})` + `catch_found_note`, box tag on each square.
  - [x] Aside: This box / All boxes (`catch_where_to_search`, `catch_this_box`, `catch_picker_all_boxes`; only once a box is made); Sort `catch_sort` (first `catch_sort_box_order` or `catch_sort_slot_order`, then caught, level, values, friendship, dex, box name, hp, walked; writes `sort:`); Order (`SwapIcon`, `catch_highest_first`/`_lowest_first`, writes `order:asc`, disabled in box/slot order); Pick all `catch_pick_all` (selecting).
  - [x] Press: browsing opens the sheet (`catch_picker_open`); selecting toggles (`catch_picker_add`), shift-press picks a run, in-battle refused `catch_in_battle`.
  - [x] Drag every own square (a picked one carries all picks); drop on a square or gap in a made box with no search; Put here gaps while selecting (`catch_put_picked`); long-press on touch starts selecting.
- [x] Under the box: `catch_slot_order_note` (made box, slot order, not empty).
- [x] Dock: `catch_press_note` (desktop) / `catch_long_press_note` (phone) when not selecting; Close `ui_close`.
- [x] Selection bar (`actions.tsx`): `catch_selected({count})`; Move menu (`catch_move_to`, boxes with swatch and count, `catch_move_here_now` disabled, `catch_move_new_box`); Favorite/Unfavorite count; Lock/Unlock count; Release twice (`catch_release_count`, then `catch_release_ask`; Clear becomes `catch_keep_them`; candy price badges `catch_candy_pile`, `catch_release_items`); Clear `catch_clear`; held-back line `catch_release_held` (`catch_held_battle`, `_favorite`, `_locked`); bulk toasts.
- [x] BoxForm: `TextField` (`BOX_NAME_LIMIT`, Enter submits), 10 colour swatches (`catch_box_colour`), verb, `ui_never_mind`.
- [x] State: last open box remembered for the session; leaving select mode clears picks; `busy` during server calls.

### Catch picker (`catches/catch-picker/*`, `CatchGrid`, `CatchBox`, `CatchCard`)

- [x] Dialog `wide`; title `props.title` / `pick_catch_title` / `catch_picker_theirs`; description from `purpose()`; dock Pick none `catch_picker_none` (single, has value), Close; trigger button when no `open`; `inline` draws the grid only.
- [x] Loading `pick_catch_loading`; failure `catch_picker_failed` (keeps last list).
- [x] Search row: box switcher `Select` (`catch_picker_box`, All boxes, Default, boxes with tone); `Search` (`CATCH_VOCABULARY`, `catch_search_placeholder`); aside note `catch_picker_strongest_first`.
- [x] `catch_picker_picks_stay`; caller `results`; range `catch_grid_range` (when it scrolls).
- [x] Empty `catch_picker_empty`/`catch_grid_empty`; no match `catch_picker_no_match`/`_theirs`; empty card over an empty made box.
- [x] Single-pick second press: `Status` warning, `catch_picker_confirm({verb, name})`, `battle_cancel`.
- [x] Multi-pick confirm `catch_picker_take_count` / `_take_of`, `catch_picker_sure`; not when live or viewOnly.
- [x] Give-item `InventoryPicker` (`catch_give_title`, `_description`, `_verb`, `_empty`; holdable only).
- [x] Squares (`asBoxEntry`): sprite or egg (faster idle near hatching), shiny, shadow, purified, locked, favorite marks, level, HP bar (leaf, gold, ember), egg walk bar, fainted wash, picked ✓, refused ✕ with reason (`catch_refused_label`), box tag, `describeCatch` label.
- [x] Hover card: `titleCatch`, `CatchCard` body, verb button (`catch_picker_open`, `_add`, `ui_remove_action`, caller verb, `catch_picker_pick_verb`); no card on coarse pointer with long-press. Pressing the square = the card's verb.
- [x] Modes: single, multiple (cap, shift-run), live, load, viewOnly, disabled. Newest first; made box in slot order with gaps and a spare row; `sort:`/`order:`; caller filter and reason; `is:duplicate` over the whole list.
- [x] `CatchBox`: `BOX_COLUMNS` 6 x 5, widths 5/6/8 from `settings().boxColumns`, `columns: 3`; scrolls in a 5-row frame (not paged), 2 rows overscan, `onView`; edge scroll while dragging (56px); `fill` 7:4 squares; gaps dashed, `#NNN` when numbered, "Drop here" (hard-coded, not a message), Put here (`catch_box_put_here`, `catch_box_put_in_slot`); `compact`; `cardOnly`; long-press; label `catch_box_label`.
- [x] `CatchCard`: IV stars `catch_stars`, sigil; marks and name or `ui_egg`; egg: hatch bar, `catch_steps_walked`; else type badges, `catch_level`, gender, nature, HP x/max, `StatusSquares`, three columns (moves `catch_no_move`, abilities `catch_no_ability` tinted by `ABILITY_PILLS`, held items with hover card Take `catch_take` / Close, owner's + `catch_give_item`, room from `getHeldItemRoom`).
- [x] Opened from: Boxes (inline and Add to), pick-catch / terms / pick-team forms, TeamsCard, auction board, BuddyCard, Bag's Use it on, trades (answer, offer both sides), catch sheet fold.

### Item dialogs (`BottleCapDialog`, `AbilityPatchDialog`, `IncreasePPDialog`, `MovePicker`)

- [x] Shared: narrow dialog, `getCaught` under Suspense (`catch_reading_record`), sprite at scale 4 (egg, shiny, female), the choice, `Status`, Use `catch_use_item({item})` / `catch_using`, Cancel `battle_cancel`; `onUsed(message)`.
- [x] Bottle Cap: title item name, `catch_cap_description({max})`, radio per stat (value -> 31, or `catch_cap_already` disabled), lowest by default, `catch_cap_all_perfect`, `catch_cap_failed`, `catch_cap_used`.
- [x] Ability Patch: `catch_patch_title`, `catch_patch_description`, `catch_patch_gains`, `catch_patch_room` or a radio of abilities to give up, `catch_patch_no_signature`, `SignatureLearned` sound, `catch_patch_failed`, `_gained`, `_replaced`.
- [x] Increase PP: `catch_pp_title`, `catch_pp_description({item})`, `MovePicker` with "PP -> amount" aside (`catch_pp_to`), refusals `catch_pp_full`, `_no_effect`, `_nothing_chosen`, empties `catch_pp_no_moves`, `_all_full`, first that can take it by default, `catch_pp_failed`, `catch_pp_used`.
- [x] MovePicker: radio cards of `MoveLine` (tooltip, name, type `Sigil` 18px, `MoveCategorySprite` 45px), refusal badge or aside; exports reused by teach-move, pick-move, pick-catch-then.

### Pokedex (`dex/*`)

- [x] Reads `getPokedex` again on record changes; loading `dex_loading`.
- [x] Counts `dex_seen` (tide), `dex_caught` (leaf), `dex_of`.
- [x] Region chips: `regionName`, seen/total, caught bar, `dex_region_label`; press turns to the first number.
- [x] Find `dex_find` / `dex_find_placeholder`: number turns and rings gold; name finds only met.
- [x] Filter `dex_show`: All `item_pocket_all`, Caught `dex_filter_caught`, Missing `dex_filter_missing`.
- [x] Pager: `dex_earlier`, range ("#001 – #030 · Kanto" or `dex_nothing_here`), `dex_later`.
- [x] Grid: 6 x 5 = 30 always; unmet (number only, `dex_entry_unmet`), seen silhouette (`dex_entry_seen`), caught (`dex_entry_caught`); still sprites facing DownLeft; `#NNN` or form label; every square a button; base forms only, a caught form counts for its base.
- [x] Press: more than one form opens `SpeciesFormsDialog`, else `DexEntryDialog`.
- [x] Forms dialog: narrow, terse, `dex_forms_of({number})`, `dex_forms_description`, grid sized to the forms (`dex_forms_label`), `dex_forms_found`, Close; a press opens that form's entry.
- [x] Dex entry: broad, sheet layout, quiet, `dex_entry_title` (screen readers). Bar: previous/next `StepButton` (`dex_previous`, `dex_next`, printed dex or the form set, stops at ends), `#NNN Name` or ???, category or `dex_unknown_category`, types, seen and caught badges, `CloseButton`. `BattleData`; `dex_no_species`.
  - [x] Left: `SpeciesCoat` 144px turning (silhouette if not owned; shiny only if owned), coat toggle `dex_coat` (`dex_coat_regular`, `catch_shiny`), sex toggle `dex_sex` (when a female sheet exists); height, weight, candy (`battle_candy_earned`, ? when unreadable), `dex_hatch_steps`; evolution line `dex_line` with hint (`dex_line_help` `_hover`, `_press`, `_unmet`), indented stages, arrows, small sprites, ??? when unmet, other stages open their entry, method tooltip, scrolls in its box.
  - [x] Right (unmet: `dex_meet_first`): base stats `dex_base_stats` + hint, six bars (`STAT_BARS`, `STAT_CEILING`), `dex_total`; abilities `catch_abilities` + hint (plain, hidden tide, signature gold, tooltips); habitat `dex_habitat` + hint (lairs `dex_lair` + biomes, biomes `dex_all_biomes` + hours, towns `dex_towns` + hours, `dex_extinct({fossils})`, `dex_habitat_none`); moves `catch_moves` + hint, tabs Level `dex_tab_level`, Machines `item_pocket_machines`, Egg `ui_egg`, rows (level, sigil, category, name, `dex_move_power_pp` / `catch_pp_amount`, tooltip), empties `dex_moves_none_level`, `_machines`, `_egg`. Not paged.

### Bag (`items/*`)

- [x] `BagHint` (`item_bag_help`, `_use`, `_medicine`, `_held`, `_machines`, `_training`, `_fossils`, `_candies`).
- [x] `getInventory` and `getCandies` under Suspense (`item_bag_loading`).
- [x] Vertical `TabGroup` (192px side list from md, scrolling bar on phone): All `item_pocket_all` + count; one per type in `ITEM_TYPE_ORDER` (`POCKET_NAMES`: Medicine, Poke Balls, Berries, Held items, Machines, Key items, Evolution, Valuables, Training, Fossils) + count; divider; Candies `item_pocket_candies` + count. Remembered per device (`settings().bagPocket`), emptied pocket falls back to All.
- [x] Panes: `ItemGrid` (empty `item_bag_empty` or read error); per type filtered; Candies `CandyGrid`.
- [x] Press: relic opens a mythical raid lobby (`item_relic_no_place`, `item_relic_nothing`) and switches to Raids; Escape Rope (`item_rope_refused`, `item_rope_used`); usable item opens Use it on (`item_use_on`, `catch_use`, `item_use_on_empty`; only pokemon it helps, not in battle); non-usable does nothing; repeatable items keep the picker open.
- [x] After a pick: machine -> teach form; PP Up / Max -> `IncreasePPDialog`; Bottle Cap -> `BottleCapDialog`; Ability Patch -> `AbilityPatchDialog`; else spent at once, `spentToast` and cue; a levelling candy queues the teach form; `catch_taught`.
- [x] Square labels `item_cell_carried`, `relicVerb` (`item_open_raid_with`, `item_climb_out_with`, `item_cell_verb`).
- [x] `ItemGrid`: 6 x 5 = 30, `max-w-lg`, tide frame; search (`ITEM_VOCABULARY`, `item_search_placeholder`) unless `bare`; `item_nothing_matches`; square (sprite, count pill, gold note pill, selected leaf, blocked grey, cardOnly, disabled); tooltip (`detailItem`, `item_amount_in_bag`); hover card only with more than one action; empty squares; pager below (`pager_previous`, `pager_page`, `pager_next`).
- [x] `CandyGrid`: six columns, gold frame, no search or pager; `CandySprite` + count; tooltip `item_candy_name`, `item_candy_description`, `item_candy_label`; empty `item_candy_none`.
- [x] `ItemCard`, `spent-toast` (plain, or coat + `item_spent_title` + "stat from -> to"; `playSpentCue`), `say-items` (`ui_item_times`, `FIND_TONES`).
- [x] `InventoryPicker`: dialog or inline; `item_picker_title`, `item_picker_choose_one`/`_many`, trigger `item_picker_pick`; header slot; grid; empty; pending panel (sprite, name, stepper `item_picker_less` / input / `item_picker_more` / `item_picker_max`, sum, refuse, warn, Cancel and confirm inline); below slot; multi confirm (`catch_picker_sure`); dock (confirm, `catch_picker_none`, Close); modes single, multiple, keepOpen, confirm/warn, blocked, counts=false, cardOnly. Callers: pick-item form, Safari, BattleSection, catch sheet, catch-picker give, auction board.

### Not these screens

- `BuddyCard` (profile), `TeamStrip`, `TeamRow` (profile teams, team picks, lobby, history, preview), `TargetStrip` (catch sheet's use-item header) keep their look unless a shared piece changes under them.

### Shared pieces (a change here reaches other screens)

- `CatchBox`, `CatchGrid`, `CatchCard`, `CatchPicker`, `catch-summary.ts`, `ItemGrid`, `ItemCard`, `InventoryPicker`, the three item dialogs, `MovePicker`, `PokedexGrid`, `spentToast`, `StatusSquares`, `BoxForm`, `RailBox`.

## Notes

### 2026-11-07: setup

- Boards rendered through the battle node's `support.js` stand-in into `shots-box/board/` (Box browse, proposals, selecting, release question; Bag with and without the panel; Pokedex with proposals; entry met, Machines tab, unmet).
- Dev data: `shots-box/seed-box.mjs` stages alice in the dev database only: five made boxes (Fire squad with gaps, Ghosts, Breeding with eggs and a fainted one, Shinies empty, Trade bait), 52 in Default, two let go today, 41 bag stacks across every pocket, 7 candy piles, a dex with Kanto all caught, Johto partly, and a few forms (Unown, Charizard).
- The let-go list needs `RELEASE_GRACE=1` on the dev server.

### Decisions

- **Split**: `CatchBox.tsx` keeps its path (eleven importers outside the owned paths); its square face moves to a part file beside it rather than renaming the module. `InventoryList.tsx` becomes the `items/bag/` folder, since the route is its only importer and the dialog moves in with it. `dex-entry-dialog/body.tsx` splits into sections. `InventoryPicker.tsx` and `catch-picker/box.tsx` stay whole: restyling them touches little, and a split would only move code.
- **Move tabs are not paged**: their length is fixed by the species data, not by the player, so the `paged-lists` rule does not reach them. They scroll in their card as the board draws them. The let-go list grows with the player's releases, so it pages at `LIST_PAGE`.
- **Bag panel's pokemon**: read through `readBox`, the same kept box the Use it on picker reads, filtered by the same `isUsableOn` and battle lock. No new server read.

### Where each part went (2026-11-07)

- **Boxes**: `CatchesList` opens at `sheet` width. The top line keeps the summary, New box and Select (Done while selecting). The rail is `styled/rail.tsx`'s look with a fill meter under each made box (count over the rows it fills, never less than one box). The heading is one line. This box / All boxes is the new `Segmented`. The range line carries the slot-order note through the new `CatchGrid` `orderNote` prop, so the note under the box is gone from there. The selection bar is a full-width green band (`actions.tsx`); while asking to release it shows the danger button, Keep them, the candy pills and the items note, and the held-back line stays in both states. The Picked tray (`picked-tray.tsx`) sits under the box while selecting.
- **Squares**: the face moved to `catches/box-square.tsx` (`BoxEntry` is re-exported from `CatchBox`). Level is written "Lv. n" over the bar; favourite and lock top left; shiny and shadow top right in arcane; purified in gold; a round tick or cross over the bar. "Drop here" is now `catch_box_drop_here`.
- **Hover card**: `CatchCard` heads itself with the name large; the picker passes `quietTitle` so the `HoverCard` bar is for screen readers only there. Other callers of `CatchCard` keep the bar.
- **Let-go list**: rows with a still sprite, paged at `LIST_PAGE`.
- **Bag**: `items/inventory-list/index.tsx` is `BagDialog` (the route mounts it in place of its own `Dialog`). Pockets are `RailTab`s; the open pocket heads the tray with its stack count. Pressing a square docks `DetailPanel.tsx`; its verb calls the old press. The sheet is `rail` (59rem) and `sheet` (76rem) while docked. A dock note says what a press does.
- **Pokedex**: `PokedexDialog.tsx` wraps `PokedexTab` at `rail` width with a dock note. Count tiles, region rows (current region lit, gold star when complete), find and filter row, pager, grid with forms mark, key.
- **Forms dialog**: unchanged layout on the restyled grid; a form's square says its name in a tooltip, since the corner cuts it.
- **Dex entry**: the hero is the first child of the panel rather than the dialog's `bar`. The step buttons are square `Button`s. Sections are cards (`styled/card.ts`). The method of each evolution is written between stages as well as on the tooltip.
- **Item dialogs**: `RadioGroup` `cards`; Ability Patch cards; `MovePicker` cards with a type stripe.
