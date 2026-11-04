# Outcome: ui-redesign-overworld

## Built

- **Overworld HUD** in `src/components/app/GameMenu.tsx`, on the approved "Overworld HUD" board (`docs/design/field-kit/Overworld.dc.html`). One full-screen `nav` named Game lets presses through to the map. Each piece takes its own presses:
  - **Trainer corner**, bottom left. A 76px button shows the player's face (`PlayerFace` with the profile's `sprite`). A ring round it fills green as the carried egg is walked. The red waiting count sits on its corner. The button keeps the old menu button's label ("Menu" or "Menu, n waiting") and the bound menu key still focuses it. Beside it a glass plate: nickname, gold (`text-gold-dark`), and the egg's steps (`board_egg_steps` or `board_egg_ready`).
  - **Keypad**, grown out of the trainer button with `GROW` (origin 38px in, 50px under its foot). Three labelled columns: You, Play, Inbox. Each key is a row with icon, label and its count on the right. Rows rise in with a 30ms stagger, six at most. Settings and the theme switch are in the footer. Disabled keys and the "not yet" title are kept.
  - **Place capsule**, bottom centre: a gold weather tile, the place in Fredoka, and "Weather · Period clock". It opens in place (`MORPH`) into a card. The card holds the place and a close button, the weather block (icon, name, period and clock, description, `WeatherFavors`), the six windows as tiles, and the windows note.
  - **Field moves**, bottom right: round 56px buttons (`size-square`) with a glyph per move and the name under it. A button is pressed while Surf or Fly is on, and disabled while busy.
  - **Fullscreen**, top right: a 44px glass square (`size-target`).
- **Phone (390 wide)**, decided in the brief and built: the same corners. The plate stands above the trainer button. The capsule shows the weather tile and the clock only. Field moves stack up the right edge. The keypad is a sheet across the foot of the screen with You, Play and Inbox as tabs. Its footer has a Close button, since the sheet covers the trainer button.
- **`MORPH`** preset in `src/components/styled/transition.ts`: a control opening into a card in its own place. It starts at `--motion-drop` wide and `--motion-grow-origin` high, springs in over `--motion-move`, and leaves on the exit curve. Reduce motion makes it a 120ms fade.
- **Egg in the session**: `egg` store in `src/game/session/index.ts`, `egg`/`setEgg` in `src/components/app/game-context.tsx`. `board.tsx` publishes `walk.carried` into it and clears it on cleanup, the way it publishes the place and the weather. The egg badge over the board's corner is gone.
- **`FieldMoveOffer.move`** (`src/game/session/types.ts`, set in `src/game/overworld/walk.ts`): which field move an offer is, for its glyph.
- **Cell notes** (`src/components/overworld/cell-notes.tsx`): board chip tones (arcane words in `arcane-dark`), `rounded-button`, `shadow-float`, Nunito 800. They rise off the cell on `rise-in` with the spring and sink back on the exit curve. Both use motion tokens and are marked `motion-crossfade`.
- **`FullscreenToggle`**: unchanged behaviour. The `fullscreenOffered` export is gone, since no divider needs it now.
- Inventory: `log.md` lists every control, section and piece of state of `GameMenu.tsx`, the HUD part of `board.tsx`, `FullscreenToggle.tsx`, `WeatherIcon.tsx` and `cell-notes.tsx`. Every item has a place. Nothing is lost.

## Deviations

- Files outside the owned paths:
  - `src/game/session/index.ts` and `src/components/app/game-context.tsx`: the `egg` store. The egg is the board's, and the trainer corner is in the menu, a sibling of the board. So the egg travels through the session like `place`, `weather` and `fieldMoves`.
  - `src/game/session/types.ts` and `src/game/overworld/walk.ts`: `move` on `FieldMoveOffer`, so a button can draw its move. Before, an offer carried only its translated name.
  - `src/components/styled/transition.ts` (shared path): the new `MORPH` preset.
- Removed from the HUD on purpose, each by the board:
  - The chevron on the place button. The capsule is the button, and `aria-expanded` says it opens.
  - The phone's field-move button and its popover of tiles. The moves are on screen as round buttons.
  - The divider before the fullscreen switch.
- The brief's phone capsule shows "the weather icon and temperature". The game has no temperature, so it shows the weather icon and the clock.
- The board pulses the waiting count every 2.4s forever. That needs a keyframe in `src/app.css`, which this node does not own. The count hops once (`animate-hop`) each time it changes, the Motion board's rule for a count.
- The card has a close button (`CloseButton`) where the old popover had none, since the card covers the capsule that opened it. Escape and a press outside still close it.

## Stubs left

- None.

## Handoffs

For `ui-redesign-overworld-dialogs`:

- **`MORPH`** in `src/components/styled/transition.ts` is the motion for anything that opens in its own place (a capsule into a card). The capsule card's look is local to `GameMenu.tsx`: `rounded-sheet border-2 border-line bg-paper p-3.5 shadow-sheet`, title in `font-display text-lg font-semibold`, a soft hue block `rounded-card bg-gold-soft p-2.5`, tiles `rounded-button bg-line-soft px-2 py-1.5`. If the dialogs want the same card, lift it into `src/components/styled` then.
- **Glass**: the HUD's plates over the world are `border-2 border-line bg-paper/95 shadow-float backdrop-blur-sm` (the `GLASS` constant in `GameMenu.tsx`). Anything else that stands on the board (a lair or safari banner) can match it.
- **Corners in use**:
  - bottom left: the trainer corner, and the keypad above it, up to 520px wide.
  - bottom centre: the capsule.
  - bottom right: field moves, up to four 56px buttons, stacked on a phone.
  - top right: fullscreen, 44px. Toasts drop in at top centre. A dialog that grows from a HUD control can pass that control to `Dialog`'s `origin`.
- The "elsewhere" veil and the loading note in `board.tsx` are unchanged and still on the old look.

## Gotchas

- `game.egg()` is null off the board and for a buddy that is not an egg. The ring then draws a bare track.
- The phone sheet is `fixed` inside the trainer corner's `Popover`. Nothing above it may get a transform at rest, or the sheet is placed against that element instead of the window.
- The capsule's `Popover` is centred with `-translate-x-1/2`, so a `fixed` element inside it would be placed against the capsule. Its card is `absolute` for that reason.
- `@keyframes cell-note-in` and `cell-note-out` in `src/app.css` are unused now. They are outside this node's paths and were left.
- The keypad, capsule and fullscreen are siblings of the overworld in `src/routes/index.tsx`, not children of the board. A capture that needs the egg needs a walk report first: the egg reaches the corner after the first steps.

## Proposed learnings

- Board state the menu shows goes through a session store and a `game-context.tsx` setter, set from `board.tsx` and cleared on cleanup | the menu is the board's sibling | src/components/overworld, src/components/app | no
- A count that changes is drawn under a keyed `Show` with `animate-hop` | a remount replays the hop once | src/components | no

## Verification

- `pnpm typecheck`: exit 0.
- `rtk proxy pnpm exec oxlint src test`: exit 0. The one warning in `GameMenu.tsx` (`no-unassigned-vars` on the `ref` variable `button`) is the same line as on `main`.
- `pnpm test --maxWorkers=2`: 281 files, 5826 tests passed.
- Captures: a Node and Playwright script against `pnpm dev` and the dev database from `pnpm db`, signed in as the seed's alice. Dev data set by hand:
  - a claimed starter turned into a Mew, which can use Fly and Teleport.
  - a copy of it turned into an egg at 1,280 of 5,120 steps.
  - a friend request from a third dev account, for the waiting count.
- The board was rendered the same way through a small `support.js` shim, and each desktop capture compared with it. Folder: `/private/tmp/claude-501/-Users-alexis-Documents-GitHub-poketerra/7eec9570-9610-4c90-911c-8b0807a9b113/scratchpad/shots-overworld/`:
  - `board/overworld-{closed,keypad,capsule}.png`: the approved board.
  - `before/` and `after/`: `{desktop,phone}-{light,dark}-egg-{closed,keypad,capsule}.png` (egg carried, one notice waiting in `after/`) and `{desktop,phone}-{light,dark}-moves-closed.png` (no egg, Fly and Teleport offered).
- Motion checked in the browser, 20ms after opening: the capsule card measured scale `0.95 0.47` (`MORPH`). The keypad measured `0.47` from origin `38px 316px` (`GROW`). Both rest at no scale.

## Size

- Estimated L, actual L.
