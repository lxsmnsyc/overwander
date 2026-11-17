# Outcome: ui-redesign-overworld-dialogs

## Built

Built to the approved boards `Counters`, `Safari`, `WorldMap` and `Talk`. Behaviour (what each counter charges, grants and refuses, a throw, a pan, a form's answer) is untouched. Every inventory item in `log.md` is ticked.

- **Hero band** (`src/components/styled/hero.tsx`, exported as `HeroBand` with `HeroBandProps` and `HeroTone`): props `tone` (`ember | gold | arcane | tide | leaf`, the wash from the top into white), `stage` (a sprite sized to fit), `size` (`counter` 76px, default, or `talk` 64px) and children (the bubble, drawn italic). Below `sm` the stage stacks above the bubble. It is handed to the new `Dialog` prop `hero`, which puts it across the sheet's top edge under the nameplate and takes the place of the line under the title (that line is still written and announced, as `sr-only`).
- **Counters** (`StopDialog`, `PortalDialog`, `GymSeatDialog`, `HoneyTreeDialog`, `NestDialog`): all `wide`, a hero (Rocket ember, Factory gold, Portal arcane, Seat tide, Honey gold, Nest leaf) with the person or landmark at 56px on the 76px stage, then the chip strip, then the body. Line-ups are `CatchBox tone="ember" | "tide" | "gold"` trays with "Lv. n" on each square. Portal towns are card rows with a biome-coloured square, search above and the pager under. The seat's holder is a row card (leaf wash when it is yours) with the Profile button. The honey invite is a gold-wash card. The dock note (proposal, approved at the gate) is `counter_note_party`, `counter_note_picked`, `counter_note_town`, `counter_note_decline`.
- **Safari** (`overworld/safari-dialog/`): `wide`, the nameplate "A wild <name> appeared!" (`safari_appeared`), and the field (250px, 200px on a phone) placed in `Dialog`'s `hero` slot so it reaches the sheet's top edge (it is not a `HeroBand`). A glass plate top left holds the name and its pills: level, shiny, shadow, held, flight, ability and a gold "Caught before". Run, Throw and Bag are `Button` tiles (84px, squash), Throw shows the ball in hand and its count. Bag opens the tray with Never mind under it. Caught shows Walk on and Have a look; fled and exited Walk on alone.
- **World map** (`WorldMapDialog.tsx`): `rail` width, `sheet` layout. A left rail: Ground / Sky `Segmented`, the "you are in" line (the game's place name, else the biome), then the key (you, town, biomes in view) on Ground or "Worth a walk" rows on Sky. The steering hint is a `?` at the sheet's top right. The canvas, pan pad (restyled keys) and coordinates plate (pill) stay on it. The dock note is `world_map_dock_note`. On a phone the rail is a scrolling chip row (Ground, Sky, then showpieces) and the key sits behind a Key chip.
- **Fixes after review of deviations**: the map fills its column (`WorldMapCanvas` `fill`, a square of `min(100cqw, 100cqh)` in a size container from `md`; drawing and resolution unchanged). `DialogActions` has an opt-in `stack` prop (phone: full-width buttons, action on top, way out last) passed from every dock in this node. The shop draws its purse as a gold chip beside Buy / Sell, with the dock note `shop_press_buy` on the Buy side only.
- **Conversation and forms**: `FormHost` draws a frame that has a portrait as a hero band (tide, 64px stage, the speaker's line as the bubble). A say step is 560px (new `DialogWidth` `medium`) with a centred line under the hero (`talk_say_waits`); a form is `wide` unless it asks for more, and a wait keeps the last step's width. `choiceForm` is `wide`: answers are option cards (press is the answer, refused ones greyed with their reason, cost as a pill) with the note `ask_press_note` in the dock, and the `list` variant keeps its rows, now card rows. `ShopForm` is `rail` with a Buy / Sell `Segmented` over the tray. `PickTeamForm` is `rail` with the party strip, then a Your pokemon / Teams `Segmented`, and "n of max picked" in the dock. `TeachMoveForm` uses move cards with a type stripe (`forms/move-card.tsx`: `MOVE_CARD`, `MoveStripe`), the new move in a tide card, the forgotten one in ember struck through, and "Forgetting X" in the dock. `PickMoveForm` and the move list of `PickCatchThenForm` take the same cards.
- **Shared furniture** (`forms/terms.tsx`): `CounterTerms` chips are 28px pills; a row takes an optional `tone` (`leaf | ember | gold | tide`, used for the seat's Win and Lose). `CostBadge` is a white pill for the button that pays it. `CounterStep` is the label face. `CounterSpent` has the card look. `PickedRow` is a card row. New `DockNote` for `DialogActions`'s `note`.
- **New strings** (en, ja, es): `safari_appeared`, `talk_say_waits`, `nest_bare_line`, `world_map_chunk_meta`, `shop_press_buy`, `counter_note_party`, `counter_note_picked`, `counter_note_town`, `counter_note_decline`, `world_map_show`, `world_map_ground`, `world_map_in_view`, `world_map_you_are_in`, `world_map_dock_note`, `ask_press_note`, `teach_dock_forgetting`.

## Deviations

- Outside the owned paths, kept minimal:
  - `src/components/styled/dialog.tsx` (shared): the `hero` prop and the opt-in `DialogActions` `stack` prop. `styled/hero.tsx` and the `index.ts` export are new.
  - `src/components/catches/CatchBox.tsx`: a `tone` prop (`TrayTone`) for the framed full-width tray with wide squares. Nothing else in the box changed.
  - `src/components/overworld/overworld-tab/board.tsx`: one import line, since `SafariDialog.tsx` became the folder `safari-dialog/` (the `component-layout` skill).
  - `src/i18n/messages/{en,ja,es}.json`: the strings above and `shop_press_buy`.
- The Factory keeps "their line-up" above the gold crate. The Counters board draws the crate alone, but the inventory lists the line-up for every stop, so it stays, in the same ember tray the board draws for the Stop. The coordinator accepted this.
- The map's nameplate carries an inline map glyph as `lead`; there is no map icon in `components/icons`.
- No captures were taken and no screen was opened in a browser (the story does that). The look is read against the boards from their markup only.

## Stubs left

- None.

## Handoffs

For `ui-redesign-shell` and `ui-redesign-social`:

- **Hero band**: `HeroBand` from `src/components/styled`, used through `Dialog`'s `hero` prop (the nameplate `title` stays; pass `description` as before, it becomes `sr-only`). A dialog that has a hero does not pass `lead` (the nameplate face). Stage content is a sprite about 56px high (48px on the `talk` size); give the stage a sized child, since it is a fixed box with `items-end`. Pass `quiet` and a hero together only if you want no nameplate (a hero is drawn from the sheet's top edge).
- **Counter furniture** (`src/components/forms/terms.tsx`): `CounterTerms` (`cost`, `have`, `rows` with optional `tone`, `often`), `CostBadge` (white pill inside a primary button), `CounterStep` (label over a block), `CounterSpent` (dashed card for a spent or bare state), `PickedRow`, `PickOne`, `DockNote` (wrap the string you give `DialogActions note`). `TERM_CHIP` is the chip class (28px pill).
- **Tray**: `CatchBox` takes `tone="tide" | "ember" | "gold"` for a framed, full-width line-up of wide squares; give the entries `level` to show "Lv. n".
- **Cards**: `forms/move-card.tsx` (`MOVE_CARD`, `MoveStripe`) is the move card with the type stripe. Option cards for a pressed answer are in `forms/choice.tsx`; `RadioGroup cards` stays the card for a chosen setting.
- Hero bands are tinted by meaning, not by decoration: ember (Rocket), gold (Factory, honey), arcane (portal), tide (seat, conversation), leaf (nest).

## Gotchas

- `Dialog`'s `description` is still required and is read out; with a `hero` it is drawn only as the bubble, so pass the same words to both (a `HeroBand` child is not read as the description).
- `bg-linear-to-b` and `size-[76px]` are used (Tailwind 4). Classes that must beat `Button`'s own (`rounded-2xl!`, `shadow-pop!`, `text-ember-dark!`) use the trailing `!`.
- `Segmented` `onChange` must not return a value (lint `strict-void-return`): wrap the setter in a block.
- The map's key popover on a phone is `fixed`, so it is placed against the dialog's translated box, not the window (the same gotcha as the Bag's sheet).
- A frame with a `lead` in `FormHost` gets the hero; an `openForm` with no `lead` keeps the plain line under the nameplate.

## Proposed learnings

- A dialog about one person or place carries a `HeroBand` through `hero`, not a face on the nameplate | the 28px nameplate face was too small to read | src/components | no
- A pressed answer is an option card, a chosen setting is a `RadioGroup cards` | the two look alike and are told apart only by what a press does | src/components/forms | no

## Verification

- `pnpm typecheck`: exit 0.
- `rtk proxy pnpm exec oxlint src test`: exit 0.
- `pnpm exec oxfmt src/components src/i18n`: run.
- `pnpm exec vitest run test/components test/i18n test/overworld/world-map.test.ts`: 17 files, 105 tests passed.
- No full suite, no e2e, no captures: they belong to the story.

## Size

- Estimated L, actual L.
