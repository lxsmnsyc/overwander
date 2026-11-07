# Log: ui-redesign-battle

## 2026-11-07

- Branch `feat/ui-redesign-battle` from `origin/main` (46b615da4), brief committed.
- `BattleTopBar` is also drawn by three demos (`RaidDemoBoard`, `MoveDemo`, the teaser's `battle-scene`). Its props stay as they are; the raid kind and the phone lift are new optional props.
- `BattleField` hands a press to `onPick` with the unit only. The canvas draws no ring on a picked unit and is not touched here, so the inspector is the only sign of a pick.
- Live captures need a duel, a replay, a spectator and every raid kind, which the dev database cannot stage on demand. A dev-only `/demo/battle` board composes the same parts (top bar, field, inspector, countdown, results) over battles staged in the browser, the way `/demo/raid` does.

## Inventory

From `battle-view/index.tsx`, `BattleTopBar.tsx`, `BattleField.tsx`, `UnitCard.tsx`, `battle-view/VerdictDialog.tsx`, `battle-view/summary.ts` and `WatchBattle.tsx`. Each line: from -> to.

The view (`battle-view/index.tsx`):

- [ ] "Building the battle…" note while the engine is built -> kept, centred.
- [ ] Field, the whole page -> kept.
- [ ] Press on a pokemon opens its catch sheet (only one with a record) -> the press docks the inspector; its Open sheet button opens the sheet. No Open sheet on a unit with no record.
- [ ] Catch sheet read-only for anybody else's pokemon -> kept, through Open sheet.
- [ ] Countdown (seconds left, `role="status"`) -> a ring in the centre, each number springing in.
- [ ] Status line (a failed write) -> kept, bottom centre.
- [ ] Leave confirmation: title, description (screen reader), what leaving means (concedes or locked), Leave anyway, Keep fighting -> kept as it is.
- [ ] Leave without asking for a replay, a spectator or a finished field -> kept.
- [ ] Escape leaves while nothing has the keyboard -> kept.
- [ ] Candy toasts for a fight paid after it was left, sounds on start and settle -> kept, not drawn here.

Top bar (`BattleTopBar.tsx`):

- [ ] Title (stop: the opponent's name or Team Rocket; duel: Battle or Gym Seat; raid: Raid Battle, Raid Battle: name, a Max Raid's name alone) -> the centre nameplate; in a raid, the line above the boss's name in the banner.
- [ ] Replay in place of the title -> the nameplate (or the banner's line) says Replay.
- [ ] Awards nothing badge (replay) -> a chip inside the nameplate.
- [ ] Speeds 1x, 2x, 3x (replay only, pressed state, group named Replay speed) -> a glass group under the nameplate. Phone: one button cycling the three.
- [ ] Leave (two copies for phone and desktop) -> one button, bottom right.
- [ ] Your side's meter: You, health bar, its percent for a screen reader, standing over total -> a glass plate top left, ball pips for the count (grey when out), the count kept for a screen reader.
- [ ] The foe's meter: Foe -> the plate mirrored top right.
- [ ] Spectator: Side 1, Side 2 -> the same two plates under those names.
- [ ] Boss's wide meter, name or "name's Frenzy" for a Noble -> the raid banner top centre with the boss's face and its share left.
- [ ] Your side in a raid -> a plate bottom left with "n of m standing".
- [ ] Health drops (all meters) -> the gold damage trail.

Field and hover card (`BattleField.tsx`, `UnitCard.tsx`):

- [ ] Hover card over the pokemon under the pointer, above it or below it near the top, `role="tooltip"` -> kept, restyled.
- [ ] Level and name -> kept, on the card and the inspector.
- [ ] Health bar and the rounded health number -> kept; the inspector shows health over its maximum.
- [ ] Cast or channel bar under it (gold or arcane, named in its title) -> kept on both.
- [ ] "Casting X" or "Channelling X" -> kept on both.
- [ ] Moves, each a box filled by its cooldown, muted while disabled, with the move tooltip -> kept on the card; the inspector draws a row each with "ready", the seconds left, or "off".
- [ ] Abilities as pills by kind, with tooltip; "No ability" -> kept on both.
- [ ] Items as gold pills, with tooltip; "No item" -> kept on both.
- [ ] Statuses as coloured squares, named in a tooltip and to a screen reader -> kept on the card; the inspector names each beside its square.
- [ ] A fainted pokemon greyed -> kept on both.

Verdict (`battle-view/VerdictDialog.tsx`):

- [ ] Dialog over the field -> a results screen over the field (still a modal dialog with its title and line).
- [ ] Result word (Victory, Defeat, A draw) -> large word.
- [ ] The line under it (each fight's own) -> under the word.
- [ ] Rewards heading -> kept for a screen reader; the pills say what they are.
- [ ] Seat open or seat held badge -> a chip with the rewards.
- [ ] Gold won or lost -> a gold pill (an ember one for a loss).
- [ ] Award with its art -> a pill with the art.
- [ ] Items with amounts -> pills with their art.
- [ ] Candy piles -> pills with their art.
- [ ] Waiting in the overworld, with its sprite -> a line under the pills.
- [ ] Both sides: name and face, Won or Lost, damage and share with its bar, each pokemon (sprite, name, level, health or Fainted, damage) -> two team cards.
- [ ] "vs" between the sides -> the podium stands between them.
- [ ] A raid's teams through `TeamsPreview`, under "Damage dealt" -> kept in a card, `TeamsPreview` unchanged.
- [ ] Best: species, side, damage -> the podium.
- [ ] Leave battle (Exit replay in a replay) and Stay and look; Escape and a press outside stay -> two buttons under the teams, Stay and look on the left; Escape stays.
- [ ] Profiles of the players in it, read once -> kept.

Spectator's route (`WatchBattle.tsx`):

- [ ] Loading note, "no battle" note and Back -> kept.
- [ ] Always a replay, raid passed on -> kept.

States to check: live duel, replay, spectator, a raid of each kind (Legendary, Shadow, Mythical, Totem, Max, Alpha, Noble, Tera), awards nothing, a unit with no catch, somebody else's unit, seat held or open.
