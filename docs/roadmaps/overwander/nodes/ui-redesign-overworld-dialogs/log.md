# Log: ui-redesign-overworld-dialogs

## Inventory (2026-11-16, read from the components)

Paths are under `src/components/`. Each item is ticked when it has a place in the built screen. "Board" names a file in `docs/design/field-kit/`.

### Counters (Board `Counters.dc.html`: Stop, Factory, Portal, Gym seat, Honey tree, Nest)

Shared furniture (`forms/terms.tsx`, `forms/conversation.tsx`):
- [x] Nameplate title and portrait `lead` (`HeadingPortrait`, 28px) -> the nameplate keeps the title; the portrait moves to a 76px stage in a hero band under it, why: a 28px face is too small to read as a person.
- [x] `description` (the greeting or the landmark's line) -> a speech bubble beside the stage in the hero, washed in the place's colour (Rocket ember, Factory gold, Portal arcane, Seat tide, Honey gold, Nest leaf).
- [x] `CounterTerms` chips (cost, "you carry", rows, "often") -> a strip of chips under the hero, same tones (gold for money, ember when short).
- [x] `CounterStep` labels -> `label` style over each block.
- [x] `CounterSpent` (dashed spent panel) -> unchanged shape, restyled with the card look.
- [x] `CostBadge` on the primary button -> a white pill inside the button.
- [x] `DialogActions`: way out ("Walk on") left, actions right -> the dock, unchanged.
- [x] Width: default -> `wide` (44rem) for every counter, why: the hero and the 3-column line-up need it.

Stop (`overworld/StopDialog.tsx`):
- [x] Title is the challenger's name, or "Team Rocket" without one (`ow_team_rocket`); portrait is `NpcSprite` in the style they wandered in.
- [x] Terms: Levels (band), Bring (count), Wins (challenger only).
- [x] House rule `Meta` (Frontier) -> shown in full under the terms.
- [x] "Their line-up" `CatchBox` (3 columns, `cardOnly`, hover card on each square) -> a framed 3x2 tray in ember wash.
- [x] Unseen note (`stop_unseen`) in place of the tray when the house answers what you bring.
- [x] Rented crate (Factory): "Choose n to rent · taken" step, a pickable tray (`mark: picked`), Battle disabled until the count is met -> a gold-washed tray under the rule line; the dock note repeats "n of 3 picked".
- [x] Battle opens `PickTeamForm` unless the party is rented; Walk on closes; a refusal toasts `stop_waves_off` or `stop_grunt_refuses`; the dialog hides while the picker is open.

Portal (`overworld/PortalDialog.tsx`):
- [x] Atlas sprite lead -> hero stage (the standing stones).
- [x] Terms: cost Portal Key, you carry n keys (ember at 0), often "One key a crossing".
- [x] Failure note (`failed(keys)`); empty note `portal_no_towns`; loading note `portal_reading`.
- [x] "Choose a town" step, search field (`portal_town`, `portal_search`), no-match note.
- [x] Town list: two lines (name; distance and biome), pressed row selected, paged at `LIST_PAGE` -> rows as cards with a biome-coloured square, pager under them.
- [x] Cross (primary, `CostBadge` key) disabled without a town or key; Walk on.

Gym seat (`overworld/GymSeatDialog.tsx`):
- [x] Terms: Win (+stake), Lose (-stake), often "n of 5 left".
- [x] Empty seat note, barred note (minutes).
- [x] Holder card (`PlayerPlate`, standing: pokemon count and defenses held; leaf-washed when it is yours) with a Profile button for somebody else -> a row card under the terms.
- [x] "Their line-up" or "Your line-up" `CatchBox` -> tide-washed tray.
- [x] Carries note (`gym_seat_carries`) for a rival, defends note (`gym_seat_defends`) for yours.
- [x] Spent panel when the daily takes are used; cooling panel with minutes.
- [x] Buttons: Challenge (rival, hidden while spent or cooling), Take the seat or Change team (empty or yours), Stand down (yours), Walk on; each opens `PickTeamForm`, the dialog hides meanwhile.

Honey tree (`overworld/HoneyTreeDialog.tsx`):
- [x] Lead is the tree sprite; terms: cost n Honey, you carry n jars, often; failure note; loading note `honey_tree_counting`.
- [x] Invite note, or the sticky spent panel when already lathered.
- [x] Lather (primary, `CostBadge`) hidden once lathered; Walk on.

Nest (`overworld/NestDialog.tsx`):
- [x] Egg lead sprite, description by where the offer came from (`heading()`), terms: often (or "used this while").
- [x] Spent panel for taken, bare panel for a nest with nothing in it.
- [x] Commitment note and the buddy row (sprite, "Gligar stops walking with you", or the egg put down, or "walks with you").
- [x] Take it (primary, hidden unless asking, disabled while busy); Walk on.

### Safari (`overworld/SafariDialog.tsx`, Board `Safari.dc.html`)

- [x] Title is "A wild X appeared!": a new string `safari_appeared` on the nameplate (the old build had no nameplate, `quiet`, and the sentence did not exist); the description is read out only, `insistent` while a throw lands or when the caller says so.
- [x] Field: sky over grass, the pokemon on its base (shiny sparkle, shadow aura, idle animation), held at 240px so a throw never moves the controls.
- [x] Name box top left with optional badges: held items (`revealsHeld`), flight (`revealsFlight`, Forewarn), ability (`revealsAbility`, Trace); caught-before mark (`safari_caught_before`) -> the same glass plate, with the mark as a gold pill.
- [x] The ball stands in for the pokemon while it rocks (land and shake animations, counted shakes).
- [x] Textbox (`role="status"`): question, narration of each throw, treat, pocketed, shiny, shadow, first shake, end states.
- [x] Bag read failure `Status`.
- [x] Tiles while active: Run (leaves, "walk away"), Throw (ball in hand, count, disabled at 0 or while throwing, `aria-label` with the count), Bag (opens the tray).
- [x] Bag state: tray of balls and treats (`InventoryPicker` filtered by `getBall` or a treat when `canFeed()`), empty note, Never mind.
- [x] End states: caught shows Walk on and Have a look (opens the catch sheet); fled and exited show Walk on alone.
- [x] Moves: tiles stay the same three, restyled as the Button squash and shade; the 84px height keeps a thumb target. The tray reuses the 6-wide square tray.

### World map (`overworld/WorldMapDialog.tsx`, `WorldMapCanvas.tsx`, Board `WorldMap.dc.html`)

- [x] Title, description with span and centre (`world_map_description`), width `wide` -> `rail` (59rem) so a rail and the map sit side by side.
- [x] `bar` Hint: steering keys (drag, arrows, Shift strides, Home), rim note -> a `?` at the sheet's top right, same text.
- [x] Canvas (`WorldMapCanvas`): 64x64 chunks, biome colours, towns ringed, the player marked, weather washes, showpiece rings; drag, wheel and keys unchanged; nothing about its drawing changes.
- [x] Sky chip (toggle, `aria-pressed`, hint text) -> a Ground / Sky `Segmented` at the top of the rail, why: it chooses what the map shows, not an action on it.
- [x] Key popover (you, town, each biome in view) -> a list in the rail under the segmented control, why: it was one press away and is read while scanning.
- [x] Showpieces line ("Worth a walk", "quiet" note, one chip per sky, pressing looks at it) -> rows in the rail while Sky is on.
- [x] Coordinates plate (you at, view at) bottom left of the map; pan pad (four arrows and the crosshair) bottom right; stay on the canvas.
- [x] Close in the dock; the hour re-reads on its timer; Home recentres.

### NPC visit and forms (`overworld/visit-npc.tsx`, `NpcSprite.tsx`, `forms/*`, Board `Talk.dc.html`)

- [x] Conversation frame (`forms/conversation.tsx`): one dialog for the whole exchange, nameplate is the speaker, `lead` is their portrait, the line is an italic quote that changes per step, width follows the open form, `insistent` forms ignore Escape.
- [x] Say step: Next (primary) and Walk on; wait step: a quiet "..." with `aria-busy`.
- [x] Ask (`choiceForm`): buttons in the dock, or with `list` a `CounterTerms` have-line, a step label, selectable rows (label, detail or refusal), an action button with the picked choice's `CostBadge`; refused rows disabled.
- [x] Shop (`ShopForm`): Buy / Sell tabs over an `ItemTray`, Walk on.
- [x] Pick an item (`PickItemForm`), tray with search; Pick a pokemon (`PickCatchForm`, single uses `PickOne` and `PickedRow`, several use a live `CatchPicker` with a count on the button); `PickCatchThen` (a pokemon, then a choice or a move); `PickBoxForm` (a box of somebody else's, with a line about the pick); `PickMoveForm` (search above `SEARCH_FROM`, move cards, paged).
- [x] `PickTeamForm`: party strip of `max` slots (press a pick to take it out), Box / Saved tabs, saved team rows (name, shortfall badge, Load), `Join` in the dock; the battle `refuse` reasons stay.
- [x] `TeachMoveForm`: room or full line, terms (cost, knows n of room), the new move in a tide card with power and PP, known moves, choose one to forget (ember, struck through), the forget note, status line, Teach.
- [x] Moves: the portrait moves to the hero stage (64px here) and the quote fills the hero; forms keep their bodies under it. Width per form: say and ask `wide`, shop and team `rail`, teach `wide`.

## The moves, in one place

- Counters: hero band (stage and speech bubble) replaces the 28px nameplate face and the description line.
- Counters: `wide` width everywhere, trays framed in the place's colour.
- Map: Sky chip, key popover and showpiece line move into a left rail.
- Map: steering hint moves from the `bar` to a `?` at the top right.
- Safari: unchanged order, restyled.
- Forms: portrait to the hero stage.

## Proposals (marked on the boards or here, not yet agreed)

- Dock note on each counter, one line saying what happens next ("Pick a party next", "n of 3 picked"). The Factory already says the count.
- Safari: nothing new.
- Talk: the shop's gold chip beside Buy / Sell (the tray already shows prices).
- None change what a button does.

## Phone notes

- Counters: one column, hero stage above the bubble, tray 3 columns, dock buttons full width.
- Map: the rail becomes a row of chips over the map (Ground / Sky, then showpieces); the key moves behind a Key chip as today.

## Build notes

- Split first (8ce24adca): `SafariDialog.tsx` became `safari-dialog/` (`index`, `field`, `commands`, `met`, `metrics`), behaviour unchanged. `board.tsx` imports the new path.
- Counters and the conversation frame are built on `HeroBand` (`styled/hero.tsx`) through a new `Dialog` prop `hero`. Safari uses the same `hero` slot for its field, not a `HeroBand`. Every inventory item above has its place; where an item moved, the board's place is the one used.
- Factory: kept "their line-up" (ember tray) above the gold crate. The board draws the crate alone, but the inventory keeps the line-up, so both stand.
- Phone: hero stacks stage over bubble below `sm`; trays stay 3 wide; dock buttons stack full width through `DialogActions stack`; map rail is a scrolling chip row with the key behind a Key chip.
- Second pass: map fills its column, `DialogActions stack` added, shop gold chip and Buy-side dock note built.

- Review pass: Safari has the board's nameplate and a plate of name plus pills (level, shiny, shadow, held, flight, ability, caught before); the say step is 560px (`medium`) with the board's centred line; ask shows `have` and `step` over a 3-column card grid; the honey invite has a 56px tree face; one "Town" label in the portal; saved-team count is a pill in the Segmented; the map's rail has the chunk meta line; the bare nest has its own short bubble line.
