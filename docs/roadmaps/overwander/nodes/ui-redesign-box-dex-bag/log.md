# Log: ui-redesign-box-dex-bag

## Inventory (2026-11-07, read from the components)

Paths are under `src/components/`. Each item gets ticked when it has a place in the built screen.

### How the screens open

- [ ] One page: every panel is a dialog over the world, chosen by `game.dialog()` (`src/routes/index.tsx:147`).
- [ ] Keypad group You: Boxes (`panel_boxes`, `BoxIcon`), Bag (`panel_bag`, `BagIcon`), Pokedex (`panel_pokedex`, `SearchIcon`), then Profile (`app/GameMenu.tsx:124-133`).
- [ ] Mounts: Boxes `CatchesList` (broad, :173); Pokedex dialog (wide, terse, `panel_pokedex_description`, Close, :180); Bag dialog (wide, terse, `aside={<BagHint/>}`, Close, :196). `CatchDialog`, `SpeciesFormsDialog` and `DexEntryDialog` are mounted over everything (~:414-462).

### Boxes (`catches/catches-list/*`)

- [ ] Dialog `broad`, title `panel_boxes`, lead `BoxIcon`, shown description `catch_boxes_summary({total, count})`, `aside`, `bar` while selecting. Wrapped in `BattleData` (Close only while loading). `viewOnly` prop exists, no caller.
- [ ] Aside: New box `catch_box_new` (`PlusIcon`, toggles pressed, hidden on phone), Select `catch_select` (`SelectIcon`); while selecting, Done `catch_done`. All disabled while `busy()`.
- [ ] Rail (`rail.tsx`, `nav` labelled `panel_boxes`; a chip row on phone):
  - [ ] Find a box `catch_rail_find` (desktop only).
  - [ ] Box rows: Default first (built in, `DEFAULT_BOX_TONE`, no grip), then made boxes; grip (desktop, own), swatch, name, count pill. Search across all boxes: match counts, tide pills. States: current (`aria-current`), drop target (dashed leaf), dragging.
  - [ ] Drop pokemon (or every picked one) on a box to file it; drag a box by its grip to reorder (`BOX_DRAG`, `arrangeBoxes`).
  - [ ] Phone + chip `catch_box_new`; New box form (`catch_rail_new_with({count})` with picks, else `catch_box_new`; verb `catch_box_make_it`).
  - [ ] Let go today (`ClockIcon`, `catch_let_go_title`, count) when `letGo > 0`.
  - [ ] Hint line (desktop): `catch_rail_counting` / `catch_rail_drag_picked({count})` (leaf) / `catch_rail_drag`.
  - [ ] `catch_rail_used({count, max: 32})`.
- [ ] Let-go list (`released.tsx`): `catch_let_go_title`, `catch_let_go_note`, rows (name, `catch_level`, `catch_take_back({candy})`), empty `catch_let_go_none`, toasts `catch_take_back_gone`, `_no_candy`, `_done`. Not paged.
- [ ] Box heading (`heading.tsx`): swatch, name, Built in badge `catch_heading_built_in`; fill line (`catch_heading_picking` (+ `_place`), `_default({count})`, `_empty`, `_count`, `_slots` + `_gaps`); Add pokemon `catch_heading_add` (empty made box, not selecting).
  - [ ] Menu `catch_heading_menu({name})`: Rename, Change colour, (sep) Lay out by dex number (+ hint; disabled empty), Close up the gaps (+ hint; disabled no gaps), Move all `({count})` (disabled empty), (sep, danger) Delete.
  - [ ] Inline: BoxForm for rename/colour (`catch_heading_rename_box`, `_colour_of`, verb `catch_heading_save`); Move all `Select` `catch_heading_move_all_to` + `catch_heading_move_them` + `ui_never_mind`; Delete twice `catch_heading_delete_ask({name, count})`, `_delete_it`, `_keep_it`.
  - [ ] Toasts: `catch_laid_out`, `catch_gaps_closed`, `catch_moved_all`, `catch_deleted`, `catch_bad_name`, `catch_made`, `catch_made_with`.
- [ ] Inline `CatchPicker` (index.tsx:682): `fill`; `box` or null for all boxes; empty notes `catch_empty_default`, `_box`, `_theirs`; empty card `catch_empty_card_title`/`_note`; placeholders `catch_picker_search_all`/`_box`; scroll line `catch_view_slots`/`catch_view_showing`; all-boxes results `catch_found_in({count, boxes})` + `catch_found_note`, box tag on each square.
  - [ ] Aside: This box / All boxes (`catch_where_to_search`, `catch_this_box`, `catch_picker_all_boxes`; only once a box is made); Sort `catch_sort` (first `catch_sort_box_order` or `catch_sort_slot_order`, then caught, level, values, friendship, dex, box name, hp, walked; writes `sort:`); Order (`SwapIcon`, `catch_highest_first`/`_lowest_first`, writes `order:asc`, disabled in box/slot order); Pick all `catch_pick_all` (selecting).
  - [ ] Press: browsing opens the sheet (`catch_picker_open`); selecting toggles (`catch_picker_add`), shift-press picks a run, in-battle refused `catch_in_battle`.
  - [ ] Drag every own square (a picked one carries all picks); drop on a square or gap in a made box with no search; Put here gaps while selecting (`catch_put_picked`); long-press on touch starts selecting.
- [ ] Under the box: `catch_slot_order_note` (made box, slot order, not empty).
- [ ] Dock: `catch_press_note` (desktop) / `catch_long_press_note` (phone) when not selecting; Close `ui_close`.
- [ ] Selection bar (`actions.tsx`): `catch_selected({count})`; Move menu (`catch_move_to`, boxes with swatch and count, `catch_move_here_now` disabled, `catch_move_new_box`); Favorite/Unfavorite count; Lock/Unlock count; Release twice (`catch_release_count`, then `catch_release_ask`; Clear becomes `catch_keep_them`; candy price badges `catch_candy_pile`, `catch_release_items`); Clear `catch_clear`; held-back line `catch_release_held` (`catch_held_battle`, `_favorite`, `_locked`); bulk toasts.
- [ ] BoxForm: `TextField` (`BOX_NAME_LIMIT`, Enter submits), 10 colour swatches (`catch_box_colour`), verb, `ui_never_mind`.
- [ ] State: last open box remembered for the session; leaving select mode clears picks; `busy` during server calls.

### Catch picker (`catches/catch-picker/*`, `CatchGrid`, `CatchBox`, `CatchCard`)

- [ ] Dialog `wide`; title `props.title` / `pick_catch_title` / `catch_picker_theirs`; description from `purpose()`; dock Pick none `catch_picker_none` (single, has value), Close; trigger button when no `open`; `inline` draws the grid only.
- [ ] Loading `pick_catch_loading`; failure `catch_picker_failed` (keeps last list).
- [ ] Search row: box switcher `Select` (`catch_picker_box`, All boxes, Default, boxes with tone); `Search` (`CATCH_VOCABULARY`, `catch_search_placeholder`); aside note `catch_picker_strongest_first`.
- [ ] `catch_picker_picks_stay`; caller `results`; range `catch_grid_range` (when it scrolls).
- [ ] Empty `catch_picker_empty`/`catch_grid_empty`; no match `catch_picker_no_match`/`_theirs`; empty card over an empty made box.
- [ ] Single-pick second press: `Status` warning, `catch_picker_confirm({verb, name})`, `battle_cancel`.
- [ ] Multi-pick confirm `catch_picker_take_count` / `_take_of`, `catch_picker_sure`; not when live or viewOnly.
- [ ] Give-item `InventoryPicker` (`catch_give_title`, `_description`, `_verb`, `_empty`; holdable only).
- [ ] Squares (`asBoxEntry`): sprite or egg (faster idle near hatching), shiny, shadow, purified, locked, favorite marks, level, HP bar (leaf, gold, ember), egg walk bar, fainted wash, picked ✓, refused ✕ with reason (`catch_refused_label`), box tag, `describeCatch` label.
- [ ] Hover card: `titleCatch`, `CatchCard` body, verb button (`catch_picker_open`, `_add`, `ui_remove_action`, caller verb, `catch_picker_pick_verb`); no card on coarse pointer with long-press. Pressing the square = the card's verb.
- [ ] Modes: single, multiple (cap, shift-run), live, load, viewOnly, disabled. Newest first; made box in slot order with gaps and a spare row; `sort:`/`order:`; caller filter and reason; `is:duplicate` over the whole list.
- [ ] `CatchBox`: `BOX_COLUMNS` 6 x 5, widths 5/6/8 from `settings().boxColumns`, `columns: 3`; scrolls in a 5-row frame (not paged), 2 rows overscan, `onView`; edge scroll while dragging (56px); `fill` 7:4 squares; gaps dashed, `#NNN` when numbered, "Drop here" (hard-coded, not a message), Put here (`catch_box_put_here`, `catch_box_put_in_slot`); `compact`; `cardOnly`; long-press; label `catch_box_label`.
- [ ] `CatchCard`: IV stars `catch_stars`, sigil; marks and name or `ui_egg`; egg: hatch bar, `catch_steps_walked`; else type badges, `catch_level`, gender, nature, HP x/max, `StatusSquares`, three columns (moves `catch_no_move`, abilities `catch_no_ability` tinted by `ABILITY_PILLS`, held items with hover card Take `catch_take` / Close, owner's + `catch_give_item`, room from `getHeldItemRoom`).
- [ ] Opened from: Boxes (inline and Add to), pick-catch / terms / pick-team forms, TeamsCard, auction board, BuddyCard, Bag's Use it on, trades (answer, offer both sides), catch sheet fold.

### Item dialogs (`BottleCapDialog`, `AbilityPatchDialog`, `IncreasePPDialog`, `MovePicker`)

- [ ] Shared: narrow dialog, `getCaught` under Suspense (`catch_reading_record`), sprite at scale 4 (egg, shiny, female), the choice, `Status`, Use `catch_use_item({item})` / `catch_using`, Cancel `battle_cancel`; `onUsed(message)`.
- [ ] Bottle Cap: title item name, `catch_cap_description({max})`, radio per stat (value -> 31, or `catch_cap_already` disabled), lowest by default, `catch_cap_all_perfect`, `catch_cap_failed`, `catch_cap_used`.
- [ ] Ability Patch: `catch_patch_title`, `catch_patch_description`, `catch_patch_gains`, `catch_patch_room` or a radio of abilities to give up, `catch_patch_no_signature`, `SignatureLearned` sound, `catch_patch_failed`, `_gained`, `_replaced`.
- [ ] Increase PP: `catch_pp_title`, `catch_pp_description({item})`, `MovePicker` with "PP -> amount" aside (`catch_pp_to`), refusals `catch_pp_full`, `_no_effect`, `_nothing_chosen`, empties `catch_pp_no_moves`, `_all_full`, first that can take it by default, `catch_pp_failed`, `catch_pp_used`.
- [ ] MovePicker: radio cards of `MoveLine` (tooltip, name, type `Sigil` 18px, `MoveCategorySprite` 45px), refusal badge or aside; exports reused by teach-move, pick-move, pick-catch-then.

### Pokedex (`dex/*`)

- [ ] Reads `getPokedex` again on record changes; loading `dex_loading`.
- [ ] Counts `dex_seen` (tide), `dex_caught` (leaf), `dex_of`.
- [ ] Region chips: `regionName`, seen/total, caught bar, `dex_region_label`; press turns to the first number.
- [ ] Find `dex_find` / `dex_find_placeholder`: number turns and rings gold; name finds only met.
- [ ] Filter `dex_show`: All `item_pocket_all`, Caught `dex_filter_caught`, Missing `dex_filter_missing`.
- [ ] Pager: `dex_earlier`, range ("#001 – #030 · Kanto" or `dex_nothing_here`), `dex_later`.
- [ ] Grid: 6 x 5 = 30 always; unmet (number only, `dex_entry_unmet`), seen silhouette (`dex_entry_seen`), caught (`dex_entry_caught`); still sprites facing DownLeft; `#NNN` or form label; every square a button; base forms only, a caught form counts for its base.
- [ ] Press: more than one form opens `SpeciesFormsDialog`, else `DexEntryDialog`.
- [ ] Forms dialog: narrow, terse, `dex_forms_of({number})`, `dex_forms_description`, grid sized to the forms (`dex_forms_label`), `dex_forms_found`, Close; a press opens that form's entry.
- [ ] Dex entry: broad, sheet layout, quiet, `dex_entry_title` (screen readers). Bar: previous/next `StepButton` (`dex_previous`, `dex_next`, printed dex or the form set, stops at ends), `#NNN Name` or ???, category or `dex_unknown_category`, types, seen and caught badges, `CloseButton`. `BattleData`; `dex_no_species`.
  - [ ] Left: `SpeciesCoat` 144px turning (silhouette if not owned; shiny only if owned), coat toggle `dex_coat` (`dex_coat_regular`, `catch_shiny`), sex toggle `dex_sex` (when a female sheet exists); height, weight, candy (`battle_candy_earned`, ? when unreadable), `dex_hatch_steps`; evolution line `dex_line` with hint (`dex_line_help` `_hover`, `_press`, `_unmet`), indented stages, arrows, small sprites, ??? when unmet, other stages open their entry, method tooltip, scrolls in its box.
  - [ ] Right (unmet: `dex_meet_first`): base stats `dex_base_stats` + hint, six bars (`STAT_BARS`, `STAT_CEILING`), `dex_total`; abilities `catch_abilities` + hint (plain, hidden tide, signature gold, tooltips); habitat `dex_habitat` + hint (lairs `dex_lair` + biomes, biomes `dex_all_biomes` + hours, towns `dex_towns` + hours, `dex_extinct({fossils})`, `dex_habitat_none`); moves `catch_moves` + hint, tabs Level `dex_tab_level`, Machines `item_pocket_machines`, Egg `ui_egg`, rows (level, sigil, category, name, `dex_move_power_pp` / `catch_pp_amount`, tooltip), empties `dex_moves_none_level`, `_machines`, `_egg`. Not paged.

### Bag (`items/*`)

- [ ] `BagHint` (`item_bag_help`, `_use`, `_medicine`, `_held`, `_machines`, `_training`, `_fossils`, `_candies`).
- [ ] `getInventory` and `getCandies` under Suspense (`item_bag_loading`).
- [ ] Vertical `TabGroup` (192px side list from md, scrolling bar on phone): All `item_pocket_all` + count; one per type in `ITEM_TYPE_ORDER` (`POCKET_NAMES`: Medicine, Poke Balls, Berries, Held items, Machines, Key items, Evolution, Valuables, Training, Fossils) + count; divider; Candies `item_pocket_candies` + count. Remembered per device (`settings().bagPocket`), emptied pocket falls back to All.
- [ ] Panes: `ItemGrid` (empty `item_bag_empty` or read error); per type filtered; Candies `CandyGrid`.
- [ ] Press: relic opens a mythical raid lobby (`item_relic_no_place`, `item_relic_nothing`) and switches to Raids; Escape Rope (`item_rope_refused`, `item_rope_used`); usable item opens Use it on (`item_use_on`, `catch_use`, `item_use_on_empty`; only pokemon it helps, not in battle); non-usable does nothing; repeatable items keep the picker open.
- [ ] After a pick: machine -> teach form; PP Up / Max -> `IncreasePPDialog`; Bottle Cap -> `BottleCapDialog`; Ability Patch -> `AbilityPatchDialog`; else spent at once, `spentToast` and cue; a levelling candy queues the teach form; `catch_taught`.
- [ ] Square labels `item_cell_carried`, `relicVerb` (`item_open_raid_with`, `item_climb_out_with`, `item_cell_verb`).
- [ ] `ItemGrid`: 6 x 5 = 30, `max-w-lg`, tide frame; search (`ITEM_VOCABULARY`, `item_search_placeholder`) unless `bare`; `item_nothing_matches`; square (sprite, count pill, gold note pill, selected leaf, blocked grey, cardOnly, disabled); tooltip (`detailItem`, `item_amount_in_bag`); hover card only with more than one action; empty squares; pager below (`pager_previous`, `pager_page`, `pager_next`).
- [ ] `CandyGrid`: six columns, gold frame, no search or pager; `CandySprite` + count; tooltip `item_candy_name`, `item_candy_description`, `item_candy_label`; empty `item_candy_none`.
- [ ] `ItemCard`, `spent-toast` (plain, or coat + `item_spent_title` + "stat from -> to"; `playSpentCue`), `say-items` (`ui_item_times`, `FIND_TONES`).
- [ ] `InventoryPicker`: dialog or inline; `item_picker_title`, `item_picker_choose_one`/`_many`, trigger `item_picker_pick`; header slot; grid; empty; pending panel (sprite, name, stepper `item_picker_less` / input / `item_picker_more` / `item_picker_max`, sum, refuse, warn, Cancel and confirm inline); below slot; multi confirm (`catch_picker_sure`); dock (confirm, `catch_picker_none`, Close); modes single, multiple, keepOpen, confirm/warn, blocked, counts=false, cardOnly. Callers: pick-item form, Safari, BattleSection, catch sheet, catch-picker give, auction board.

### Not these screens

- `BuddyCard` (profile), `TeamStrip`, `TeamRow` (profile teams, team picks, lobby, history, preview), `TargetStrip` (catch sheet's use-item header) keep their look unless a shared piece changes under them.

### Shared pieces (a change here reaches other screens)

- `CatchBox`, `CatchGrid`, `CatchCard`, `CatchPicker`, `catch-summary.ts`, `ItemGrid`, `ItemCard`, `InventoryPicker`, the three item dialogs, `MovePicker`, `PokedexGrid`, `spentToast`, `StatusSquares`, `BoxForm`, `RailBox`.
