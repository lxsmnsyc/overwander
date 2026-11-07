# Log: ui-redesign-battle

## 2026-11-07

- Branch `feat/ui-redesign-battle` from `origin/main` (46b615da4), brief committed.
- `BattleTopBar` is also drawn by three demos (`RaidDemoBoard`, `MoveDemo`, the teaser's `battle-scene`). Its props stay as they are; the raid kind and the phone lift are new optional props.
- `BattleField` hands a press to `onPick` with the unit only. The canvas draws no ring on a picked unit and is not touched here, so the inspector is the only sign of a pick.
- Live captures need a duel, a replay, a spectator and every raid kind, which the dev database cannot stage on demand. A dev-only `/demo/battle` board composes the same parts (top bar, field, inspector, countdown, results) over battles staged in the browser, the way `/demo/raid` does.

- Split commit: `LeaveDialog.tsx`, `Countdown.tsx` and `unit-reading.ts` (`readUnit`) out of the view and the card, no behaviour change.
- The base layer styles every `[role='status']` as a panel. The old countdown put the role on a full-field wrapper, which drew a white box across the field; the role is on the ring now, and the raid callout undoes the panel look with utilities.
- The boss banner reads the boss unit alone, not its side. An Alpha's copies and a Totem's ally join the boss's side when called, and the old wide meter jumped back up each time.
- The raid callout fires once per tick crossed while watching. The first reading only marks ticks already passed, so a replay or a late spectator is not shown callouts for the past.
- The gold trail is two widths with CSS transitions: the fill over `--motion-quick`, the ghost over `--motion-scene` after a 300ms delay. Every change restarts the delay, so the ghost waits for the hits to stop. Under reduce motion the delay goes (`in-[.reduce-motion]:delay-0`) and both take 120ms (`motion-crossfade`).
- Measured in the browser: the dock enters from `translate: calc(100% + 1rem)` on the spring and rests at `none`; under reduce motion it starts at `0px` and only fades. The countdown ring's `grow-in` takes 360ms, 120ms under reduce motion.
- Decided ja and es wording for the new strings: kinds follow the existing raid names (ja ぬし, オヤブン, キング, ダーク, テラ; es Dominante, Alfa, Señorial, Oscura, Dinamax).

## Inventory

From `battle-view/index.tsx`, `BattleTopBar.tsx`, `BattleField.tsx`, `UnitCard.tsx`, `battle-view/VerdictDialog.tsx`, `battle-view/summary.ts` and `WatchBattle.tsx`. Each line: from -> to.

The view (`battle-view/index.tsx`):

- [x] "Building the battle…" note while the engine is built -> kept, centred.
- [x] Field, the whole page -> kept.
- [x] Press on a pokemon opens its catch sheet (only one with a record) -> the press docks the inspector; its Open sheet button opens the sheet. No Open sheet on a unit with no record.
- [x] Catch sheet read-only for anybody else's pokemon -> kept, through Open sheet.
- [x] Countdown (seconds left, `role="status"`) -> a ring in the centre, each number springing in.
- [x] Status line (a failed write) -> kept, bottom centre.
- [x] Leave confirmation: title, description (screen reader), what leaving means (concedes or locked), Leave anyway, Keep fighting -> kept as it is.
- [x] Leave without asking for a replay, a spectator or a finished field -> kept.
- [x] Escape leaves while nothing has the keyboard -> kept.
- [x] Candy toasts for a fight paid after it was left, sounds on start and settle -> kept, not drawn here.

Top bar (`BattleTopBar.tsx`):

- [x] Title (stop: the opponent's name or Team Rocket; duel: Battle or Gym Seat; raid: Raid Battle, Raid Battle: name, a Max Raid's name alone) -> the centre nameplate; in a raid, the line above the boss's name in the banner.
- [x] Replay in place of the title -> the nameplate (or the banner's line) says Replay.
- [x] Awards nothing badge (replay) -> a chip inside the nameplate.
- [x] Speeds 1x, 2x, 3x (replay only, pressed state, group named Replay speed) -> a glass group under the nameplate. Phone: one button cycling the three.
- [x] Leave (two copies for phone and desktop) -> one button, bottom right.
- [x] Your side's meter: You, health bar, its percent for a screen reader, standing over total -> a glass plate top left, ball pips for the count (grey when out), the count kept for a screen reader.
- [x] The foe's meter: Foe -> the plate mirrored top right.
- [x] Spectator: Side 1, Side 2 -> the same two plates under those names.
- [x] Boss's wide meter, name or "name's Frenzy" for a Noble -> the raid banner top centre with the boss's face and its share left.
- [x] Your side in a raid -> a plate bottom left with "n of m standing".
- [x] Health drops (all meters) -> the gold damage trail.

Field and hover card (`BattleField.tsx`, `UnitCard.tsx`):

- [x] Hover card over the pokemon under the pointer, above it or below it near the top, `role="tooltip"` -> kept, restyled.
- [x] Level and name -> kept, on the card and the inspector.
- [x] Health bar and the rounded health number -> kept; the inspector shows health over its maximum.
- [x] Cast or channel bar under it (gold or arcane, named in its title) -> kept on both.
- [x] "Casting X" or "Channelling X" -> kept on both.
- [x] Moves, each a box filled by its cooldown, muted while disabled, with the move tooltip -> kept on the card; the inspector draws a row each with "ready", the seconds left, or "off".
- [x] Abilities as pills by kind, with tooltip; "No ability" -> kept on both.
- [x] Items as gold pills, with tooltip; "No item" -> kept on both.
- [x] Statuses as coloured squares, named in a tooltip and to a screen reader -> kept on the card; the inspector names each beside its square.
- [x] A fainted pokemon greyed -> kept on both.

Verdict (`battle-view/VerdictDialog.tsx`):

- [x] Dialog over the field -> a results screen over the field (still a modal dialog with its title and line).
- [x] Result word (Victory, Defeat, A draw) -> large word.
- [x] The line under it (each fight's own) -> under the word.
- [x] Rewards heading -> kept for a screen reader; the pills say what they are.
- [x] Seat open or seat held badge -> a chip with the rewards.
- [x] Gold won or lost -> a gold pill (an ember one for a loss).
- [x] Award with its art -> a pill with the art.
- [x] Items with amounts -> pills with their art.
- [x] Candy piles -> pills with their art.
- [x] Waiting in the overworld, with its sprite -> a line under the pills.
- [x] Both sides: name and face, Won or Lost, damage and share with its bar, each pokemon (sprite, name, level, health or Fainted, damage) -> two team cards.
- [x] "vs" between the sides -> the podium stands between them.
- [x] A raid's teams through `TeamsPreview`, under "Damage dealt" -> kept in a card, `TeamsPreview` unchanged.
- [x] Best: species, side, damage -> the podium.
- [x] Leave battle (Exit replay in a replay) and Stay and look; Escape and a press outside stay -> two buttons under the teams, Stay and look on the left; Escape stays.
- [x] Profiles of the players in it, read once -> kept.

Spectator's route (`WatchBattle.tsx`):

- [x] Loading note, "no battle" note and Back -> kept.
- [x] Always a replay, raid passed on -> kept.

States to check: live duel, replay, spectator, a raid of each kind (Legendary, Shadow, Mythical, Totem, Max, Alpha, Noble, Tera), awards nothing, a unit with no catch, somebody else's unit, seat held or open.
