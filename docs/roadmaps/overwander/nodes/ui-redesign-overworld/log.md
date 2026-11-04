# Log: ui-redesign-overworld

## 2026-11-04

- Branch `feat/ui-redesign-overworld` from `main` (bfbe13fc4). Nothing of this node existed yet.
- The HUD is mostly in `src/components/app/GameMenu.tsx`. `board.tsx` draws only the egg badge, the loading note and the "elsewhere" veil over the board.
- The egg lives in the board's walk (`walk.carried`), and the menu is a sibling of the board. It travels through the session like the place and the weather: a new `egg` store in `src/game/session/index.ts` and `egg`/`setEgg` in `game-context.tsx`.
- A field move offer carries only its name. The round buttons need a glyph per move, so the offer gains `move` (`src/game/session/types.ts`, set in `src/game/overworld/walk.ts`).
- Dev setup for captures: `pnpm db`, `pnpm db:migrate`, `pnpm seed`, sign in as the seed's alice. A starter was claimed in the game. Then, in the dev db only:
  - gold set to 12,500.
  - the starter turned into Mew, which can use Fly and Teleport.
  - a copy turned into an egg at 1,280 of 5,120 steps.
  - the capture script switches `buddy_id` between the two.
- The board files have no `support.js`. A small shim in the scratchpad renders `sc-if`, `sc-for` and `{{ }}` so the board can be captured.

## Inventory

From `GameMenu.tsx`, `board.tsx` (the HUD part), `FullscreenToggle.tsx`, `WeatherIcon.tsx` and `cell-notes.tsx`. Each line: from -> to.

GameMenu, the bar:

- [x] `nav` named Game -> kept, now the whole screen with each piece in its corner.
- [x] Menu button (icon, label "Menu" or "Menu, n waiting") -> the trainer corner button, bottom left, same label.
- [x] Waiting count on the menu button -> red count on the trainer button's corner. It hops when it changes.
- [x] Bound menu key puts focus on the menu button -> same, on the trainer button.
- [x] Place name (or "Somewhere") -> the capsule, bottom centre, in Fredoka.
- [x] Chevron on the place button -> dropped as a glyph. The capsule as a whole is the button (`aria-expanded` says it opens).
- [x] Weather icon, weather name (wide screens), period and clock -> capsule second line, the icon in a gold tile.
- [x] Gold (bar on wide screens, popover on a phone) -> under the name in the trainer corner, at every width.
- [x] Field move chips (wide screens): name, pressed, busy, `use()` -> round 56px buttons bottom right. Same states.
- [x] Phone field moves button and its popover of tiles -> the same round buttons, stacked bottom right.
- [x] Fullscreen switch (and the divider shown only when offered) -> its own 44px square, top right. No divider.
- [x] One panel open at a time (`only`) -> kept for the keypad and the place card.

GameMenu, the place popover:

- [x] Place line -> the card's title.
- [x] Gold on a phone -> moved to the trainer corner (above).
- [x] Weather icon and name, description, favoured types (`WeatherFavors`) -> the gold block in the card.
- [x] Period and clock row -> in the block's first line, "Clear · Night, 10:30 pm".
- [x] Six windows with their waits -> a grid of six tiles.
- [x] Windows note -> under the grid.
- [x] Way to close (outside press, Escape) -> kept, plus a close button in the card, since the card covers the capsule.

GameMenu, the keypad:

- [x] Three groups You, Play, Inbox with their labels -> three labelled columns, or three tabs on a phone.
- [x] Each key: icon, label, title, opens its dialog -> a row: icon, label, count on the right.
- [x] A key with no dialog is disabled with "not yet" in its title -> kept.
- [x] Counts on Notices, Gifts, Quests, Profile, with gifts and quests read when the keypad opens -> kept.
- [x] Settings -> keypad footer, left.
- [x] Theme switch -> keypad footer, right.
- [x] Clock re-read each minute and on a tab coming back; server clock sync -> kept.

board.tsx:

- [x] Egg badge (steps of hatch, green when ready), top right -> a progress ring round the trainer button and the same words under the name.
- [x] Loading note, "elsewhere" veil with Walk here -> unchanged.

FullscreenToggle.tsx:

- [x] Hidden where the browser cannot fill the screen -> kept.
- [x] Pressed while full, label and title fill or leave, expand or shrink icon, follows `fullscreenchange` -> kept.

WeatherIcon.tsx:

- [x] Icon per weather, `getWeatherIcon`, `WeatherFavors`, the tooltip `WeatherIcon` -> unchanged, used by the capsule and the card.

cell-notes.tsx:

- [x] Note over a cell, art and words, five tones, stacking per cell, follows the cell each frame, role status, lifetime 2s -> kept; restyled on the tokens.

New (proposal, approved with the board): the trainer's name and face in the corner.

## Build notes

- `GameMenu.tsx` rewritten as four corner pieces inside one full-screen `nav` that lets presses through. Every prop, store call and handler of the old bar is kept.
- New `MORPH` preset in `src/components/styled/transition.ts` for the capsule opening into its card (x from `--motion-drop`, y from `--motion-grow-origin`, origin at the bottom edge). Checked in the browser: 20ms in, the card measured scale `0.95 0.47`; the keypad, under `GROW`, `0.47` from 38px in and 50px below its bottom edge.
- The waiting count is keyed, so a new count remounts and plays `animate-hop`. The board's endless pulse needs a keyframe in `src/app.css`, which this node does not own. The hop is the Motion board's rule for a count.
- Cell notes: chip tones (arcane words now `arcane-dark`), `rounded-button`, `shadow-float`, and `rise-in` on the motion tokens (in on the spring, out reversed on the exit curve), marked `motion-crossfade`.
- Captures: `before/` and `after/` 16 each, `board/` 3. Compared each desktop capture with the board: corner, ring, plate, capsule, card, keypad, field moves and fullscreen all sit where the board puts them. Fixed after the first pass: the capsule truncated the place at 416px (now up to 34rem), the window tiles truncated "Caches and patches" (now wrap), the Fly glyph, the capsule width on a phone.
