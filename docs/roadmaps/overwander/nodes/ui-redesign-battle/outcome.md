# Outcome: ui-redesign-battle

## Built

- **Battle view** on the approved "Battle" and "Raid" boards (`docs/design/field-kit/Battle.dc.html`, `Raid.dc.html`). The field (`battle-canvas.tsx`, the lit scene, move visuals) is untouched. What the battle sends and reads (`createBattleWatch`, rewards, leaving, replay) is unchanged.
- **Frame**: every piece of chrome sits in a frame capped at 16:9 of the screen's height (`max-w-[calc(100dvh*16/9)]`, `@container`), the same rule as the overworld HUD. Width caps are in `cqw` of that frame.
- **Top bar** (`BattleTopBar.tsx`), for two sides:
  - Your side on a glass plate at the top left, the other side mirrored at the top right: the name in Fredoka, ball pips for the count (grey when out; words past 8 pokemon), and the health track. A spectator sees "Side 1" and "Side 2". The count and the percent stay for a screen reader.
  - A tide nameplate at the top centre with the title, or Replay with its Awards nothing chip. A replay's speeds are a glass group of three under it.
  - Leave at the bottom right, still confirmed by the leave dialog.
- **Damage trail** on every health track (`HealthTrack` in `battle-view/plates.tsx`): a gold ghost holds the old width and drains to the new one 300ms after the hits stop. Two CSS width transitions, no timers.
- **Raid** (same component):
  - A banner at the top centre: the boss's face (its idle sprite), the raid's title above its name ("Frenzy" for a Noble), its share left, and the meter.
  - Proposals, decided and built: a kind badge (Legendary, Shadow, Mythical, Totem, Max Raid, Alpha, Noble, and Tera with its type in the type's colour); ticks at 3/4, 1/2 and 1/4 (dark until passed, then white); a callout when the boss passes one (Noble "Staggered!", Alpha "Its kind returns!", Totem at half "It calls an ally!", otherwise "Three quarters left", "Half way!", "One quarter left!"), shown for 1.8s.
  - Your side on a plate at the bottom left with "n of m standing". Leave at the bottom right.
  - The Noble's burst ring, red marks and stagger stars and an Alpha's copies are the canvas's and are unchanged.
- **Inspector** (`battle-view/Inspector.tsx`): a press on a pokemon docks it at the right edge (290px, 260px on a short screen): level, name, close; health over its cast or channel bar, "Casting X" and health over maximum; moves as rows filled by their cooldown with "ready", the seconds left or "off", each with its move tooltip; abilities and items as pills with their tooltips; statuses as a square and a name; Open sheet at the foot. The catch sheet opens only from Open sheet now, read-only for anybody else's pokemon as before. A unit with no record (a raid boss, a demo's dummy) has no Open sheet. It slides in from the right on the spring.
- **Hover card** (`UnitCard.tsx`): kept on hover, restyled (card radius, Fredoka name, the trail on its health, pills, the cast line in gold or arcane).
- **Countdown** (`battle-view/Countdown.tsx`): a 150px tide ring at 44% of the field's height, each number springing in (`grow-in`).
- **Results screen** (`battle-view/results/`), replacing `VerdictDialog.tsx`: a headless terracotta dialog over the field with a dark veil.
  - The result word in Fredoka 64 and the fight's line.
  - Rewards as pills popping in one after another (`Rewards.tsx`): seat open or held, gold (ember when lost), award, items, candy; what waits in the overworld on a line under them.
  - Both teams as cards (`TeamCard.tsx`), the reader's first: face and name, Won or Lost, damage and share with its bar, each pokemon with sprite, level, name, health or Fainted, and damage.
  - Best on a gold podium between the teams (`Podium.tsx`); its screen reader text is the old `verdict_best` sentence.
  - A raid keeps `TeamsPreview` (unchanged) in a card under "Damage dealt", the podium beside it.
  - Stay and look on the left, Leave battle (Exit replay in a replay) on the right. Escape and a press on the empty ground stay.
- **Phone**:
  - Portrait (390x844): the two plates as one row each across the top (name, pips, track), the nameplate a single line under them with one button cycling 1x, 2x, 3x. The inspector is a sheet across the foot (46dvh); Leave (and a raid's plate) rise to its edge while it is open. The results screen is one scrolling column: word, line, rewards, your team, theirs, Best, the two buttons.
  - Sideways (844x390): the desktop layout in the 693px frame, plates capped at 30cqw, the inspector docked right at 260px under the plates.
  - Raid: the banner across the top, your plate bottom left, Leave bottom right.
- **Motion**: banner, countdown, callout, result word and pills spring in through `grow-in`; team cards, podium and buttons rise in (`rise-in`) with delays. All are `motion-crossfade`, so reduce motion leaves a 120ms fade with no delay. The dock's distance is zero under reduce motion (`in-[.reduce-motion]:translate-x-0`). The trail loses its delay and takes 120ms.
- Inventory: `log.md` lists every control, section and piece of state of the owned files. Every item has a place; nothing is lost.
- New strings in en, ja and es: `battle_standing`, `battle_boss_left`, `battle_kind_*` (9), `battle_callout_*` (6), `battle_move_ready`, `battle_move_seconds`, `battle_move_off`, `battle_health_of`, `battle_open_sheet`, `battle_inspect_moves`, `battle_inspect_traits`, `battle_speed_cycle`, `verdict_podium`, `verdict_podium_line`.

## Deviations

- Files outside the owned paths:
  - `src/components/demo/BattleViewDemo.tsx` and `src/routes/demo/battle.tsx`: a dev-only `/demo/battle` board for the captures (the `/demo` layout answers 404 in a build). The address picks the state: `scene=raid&kind=…`, `replay=1`, `spectate=1`, `count=3`, `inspect=own|foe`, `verdict=won|lost`, `boss=0.6`, `seat=held|freed`.
  - `src/i18n/messages/{en,ja,es}.json`: the new strings above.
- The canvas draws no ring round a picked unit (the board's white outline). The canvas is out of scope, so the inspector is the only sign of a pick.
- The boss banner reads the boss unit alone. The old wide meter summed the boss's side, so it rose each time an Alpha's copy or a Totem's ally joined.
- The countdown's `role="status"` moved from a full-field wrapper to the ring. The base layer draws every `[role='status']` as a panel, and the old countdown drew a white box across the field.
- Escape closes a docked inspector first, then asks to leave as before.
- The board's speeds and Leave are plain white buttons; Leave keeps the kit's ghost `Button` (it was the green primary before).

## Review fixes

A fresh review of the branch found these, all fixed in one commit:

- The results' team cards and podium remounted 4 times a second, because the watch ticks `revision` every 250ms after the fight settles and `readSides` built new rows each tick. `sides` and `contributions` are now memos read once the battle settles. The demo board reads them once and has no poll, so the captures did not show it.
- Reduce motion did not stop the inspector's desktop slide: `sm:translate-x-[...]` outranked `in-[.reduce-motion]:translate-x-0`. Both strings now carry `sm:in-[.reduce-motion]:translate-x-0`.
- The countdown and the raid callout held `role="status"` on elements remounted per message. Each now has one `sr-only` region that stays mounted, and the drawn ring and callout are `aria-hidden`.
- Callouts fired on `health < tick`; the engine acts on `<=`, so they now do too.
- A Tera badge on a light type colour gets dark words, by the fill's luminance.
- es `battle_move_ready` is "listo" (a move is masculine).
- Kept: the results title stays `tabIndex={0}`. Terracotta's first focus skips `tabindex="-1"`, so `-1` would undo the phone scroll fix.

## Stubs left

- None.

## Handoffs

For `ui-redesign-social` (lobbies):

- `battle-view/plates.tsx`: `GLASS` (the plate surface), `LABEL` (small capitals), `HealthTrack` (a track with the gold trail, optional `mirrored` and `ticks`), `BallPips` and `StandingCount` (pips, or words past `MOST_PIPS`).
- `battle-view/results/TeamCard.tsx` (one side with its pokemon, damage and share), `Podium.tsx` (a unit on the gold block), `Rewards.tsx` (popping pills, `hasRewards`), `UnitArt.tsx` (a sprite fitted to a square, greyed when fainted).
- `TeamsPreview` is unchanged; the results screen wraps it in its own card.

## Gotchas

- The base layer styles every `[role='status']` as a bordered panel. Anything live that should not look like one (the raid callout) undoes it with utilities.
- The base layer makes every `ul` a column; a row needs `flex-row`.
- The results screen uses `justify-center-safe`: with plain `justify-center` a column taller than a phone was cut off at the top.
- `BattleTopBar` is also drawn by `RaidDemoBoard`, `MoveDemo` and the teaser. Its old props are unchanged; `kind` and `raised` are optional.

## Proposed learnings

- A live region that is not a panel undoes the base `[role='status']` look, or puts the role on the element that already has a surface | the base layer paints any status as a panel | src/components | no

## Verification

- `pnpm typecheck`: exit 0.
- `rtk proxy pnpm exec oxlint src test`: exit 0.
- `pnpm test --maxWorkers=2`: exit 0, 287 files, 5855 tests passed.
- Captures: a Node and Playwright script against `pnpm dev` (dev database from `pnpm db`), on the `/demo/battle` board, since a live duel, a replay, a spectator and every raid kind cannot be staged on demand in the dev database. Folder `/private/tmp/claude-501/-Users-alexis-Documents-GitHub-poketerra/ace141b8-b1f0-4d53-a0be-72de5b09d760/scratchpad/shots-battle/`:
  - `board/`: the approved boards rendered through a `support.js` stand-in (`src/support.js` there): `battle-{inspect,replay,countdown,verdict}.png`, `raid-{legendary,max,tera,noble,alpha}.png` with the proposals on.
  - `after/`: `{desktop,phone}-{light,dark}-*.png` and `sideways-light-*.png` (1280x720, 390x844, 844x390) for `duel-inspect` (the foe, no Open sheet), `duel-inspect-own` (Open sheet), `replay`, `spectate`, `countdown`, `won` (seat open), `lost` (seat held), `raid-{legendary,max,tera,noble,alpha}` (boss set to a share so a tick is passed and its callout shows; the Noble is mid-stagger), `raid-inspect` and `raid-replay`.
  - `before/`: the same states from the previous components (`{desktop,phone}-{light,dark}`), staged by the same board with the old top bar, card and verdict dialog. There is no inspector before, so no inspect shots.
  - Each desktop shot was compared with its board. Kept differences: no ring on the picked unit (canvas); the field is the real one rather than the board's flat sky; the board's raid kind picker and "Show results" buttons are board furniture.
  - The callout stays up 1.8s; the capture script stretched that one timeout so the slow WebGL screenshot catches it.
- Motion measured in the browser: the dock enters from `translate: calc(100% + 1rem)` on the spring and rests at `none`; under reduce motion it starts at `0px` and fades over 120ms. Countdown ring `grow-in` 360ms, 120ms under reduce motion. Trail: 560ms after 300ms; 120ms and no delay under reduce motion.

## Size

- Estimated L, actual L.
