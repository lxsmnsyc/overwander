---
id: ui-redesign-battle
title: Redesign the battle view
status: active
priority: must
type: feature
outline: false
milestone: now
size: L
added: 2026-11-03
owns:
  - src/components/battle/BattleField.tsx
  - src/components/battle/BattleTopBar.tsx
  - src/components/battle/UnitCard.tsx
  - src/components/battle/WatchBattle.tsx
  - src/components/battle/battle-view/**
shared:
  - src/components/styled/**
  - src/components/battle/TeamsPreview.tsx
provides: []
depends_on:
  - on: ui-design-system
    kind: hard
    why: Built on its tokens and primitives
---

# Redesign the battle view

## Goal

Rebuild the battle view on the Field Kit system, following the approved "Battle" and "Raid" boards. That covers the side meters and the title in the top bar, the unit card, a new inspector, the countdown, the status line, the leave confirmation and the verdict as a results screen. The field itself (`battle-canvas.tsx`, the lit scene, move visuals) is not touched.

## Context

- Spec: `docs/design/field-kit/Battle.dc.html` and `Raid.dc.html` (approved 2026-11-03), with their inventory notes in `docs/design/field-kit/canvas.json` ("BATTLE: ..." and "RAID: ..."). System: `docs/design/field-kit.md`. Motion: `docs/design/field-kit/Motion.dc.html`.
- Read the outcomes of `ui-design-system`, `ui-redesign-overworld` and `ui-redesign-catches` first. They cover `Dialog`'s `origin`, the presets (`GROW`, `MORPH`, `RISE`), `@container` caps in `cqw`, `text-gold-dark`, the HUD's `GLASS` plate, and the catch sheet's move card.
- Today's view: `battle-view/index.tsx` (the view, countdown, status, leave dialog, opening the catch sheet), `BattleTopBar.tsx` (side meters, title, replay, awards nothing, speeds, leave), `BattleField.tsx` and `UnitCard.tsx` (hover card), `battle-view/VerdictDialog.tsx` and `summary.ts` (verdict), and `WatchBattle.tsx` (a spectator's route, `/battle/[id]`).
- Not this node: the duel and raid lobbies and their dialogs (`LobbyParty`, `LobbyInviteDialog`, `DuelRulesDialog`, `SpectatorList`, `BattleParty`) are `ui-redesign-social`. `BattleHistory` is on the profile, so it is `ui-redesign-shell`. `TeamsPreview` is shared: the verdict uses it and so do the lobbies. Restyle it only through props or a variant, so the lobbies look the same until social changes them.
- Renderer: none changes. This is DOM chrome over the existing canvas.

## The moves (from the boards' inventories)

Battle:

- Side meters -> your side as a glass plate at top left, the foe mirrored at top right. The standing count becomes ball pips (one per pokemon, grey when out).
- Health meters get the gold damage trail: a gold ghost holds the old width and drains to the new one after the fill drops (proposal approved with the board).
- Title, Replay, Awards nothing and the speeds -> a centre nameplate, with the speed buttons under it.
- Leave -> bottom right, still confirmed by the leave dialog.
- Unit card -> stays on hover. Pressing a pokemon now docks an inspector on the right (level, name, close; what it is casting or channelling and its health; moves as rows with their cooldown; abilities and items; statuses) with an Open sheet button. Today a press opens the catch sheet straight away; that is now the button's job (proposal approved with the board). A unit with no catch behind it has no Open sheet button.
- Countdown -> a large ring in the centre, each number springing in.
- Verdict dialog -> a results screen over the field: the result word, the line, the rewards (gold, candy, items popping in), both teams with damage and share, Best as a podium, and Stay and look, Leave battle. Replay's Exit replay and the seat held, seat open and waiting lines keep their place in it.
- Kept: the status line, the leave confirmation, every keyboard binding.

Raid (same components):

- The boss's wide meter -> a banner at top centre with the boss's face, name ("Frenzy" for a Noble) and its share left. The raid's title sits above the name.
- Your side's meter -> a plate at bottom left with its standing count.
- Leave -> bottom right.
- Kept: the Noble's burst ring, red marks and stagger stars, and an Alpha's copies.
- The board's proposals, decided here and built: a kind badge on the banner (Legendary, Max Raid, Tera with its type, Noble, Alpha), ticks at 3/4, 1/2 and 1/4 of the boss meter, and a short callout when one is passed. The maintainer sees them at the gate.
- Not drawn: a party list or a timer, which the game does not have.

## Phone

The phone boards still show today's layout. Decided here, at 390x844 and 844x390:

- Portrait: the two side plates shrink to one row each across the top (yours, then the foe), pips beside the name. The nameplate is a single line under them, speeds folded into one button that cycles 1x, 2x, 3x. The inspector is a sheet across the foot instead of a right dock. Leave sits bottom right over the sheet's edge. The results screen is one scrolling column: word, line, rewards, your team, theirs, Best, the two buttons.
- Sideways: the desktop layout inside the 16:9 frame, plates capped in `cqw`, inspector docked right at 260px.
- Raid on a phone: the banner across the top, your plate at bottom left, Leave bottom right.

## Steps

- [ ] Write the inventory from every owned file (each control, section and piece of state, including the conditional ones: replay, spectating, a raid of each kind, awards nothing, a unit with no catch, someone else's unit, seat held or open) into `log.md` as a checklist, ticking each as it gets a place.
- [ ] Split `battle-view/index.tsx` or `VerdictDialog.tsx` first if it helps (`component-layout` skill), behaviour unchanged, as its own commit.
- [ ] Build the top bar plates, the damage trail and the nameplate.
- [ ] Build the inspector and move the sheet opening behind Open sheet.
- [ ] Build the countdown and the results screen, with their motion.
- [ ] Build the raid banner, its plate and the three proposals.
- [ ] Build the phone layouts above.
- [ ] Capture desktop (1280x720) and phone (390x844 and 844x390), light and dark: a live duel with the inspector open, a replay, a spectator's view, the countdown, a won and a lost verdict, and one raid of each kind (Legendary, Max, Tera, Noble mid-stagger, Alpha). Compare each desktop shot with its board and fix the differences.

## Acceptance

- [ ] Every element of the inventory has a place; none is lost.
- [ ] Desktop matches the Battle and Raid boards in light and dark; reduce motion turns every spring, the trail and the countdown into fades.
- [ ] The lobbies look the same as before (the shared `TeamsPreview` is unchanged for them).
- [ ] Changeset `minor`. Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test` (2 workers).

## Sizing

L: five screens' worth of chrome (top bar, inspector, countdown, results, raid banner), a new interaction step, two phone orientations and many captured states.

## Notes for the worker

- Every string through the message functions, with ja and es present; separators too (see `menu_period_clock`).
- Do not change what the battle sends or reads: `createBattleWatch`, rewards, leaving and replay stay as they are. Layout, look and the press-to-inspect step only.
- Health widths change many times a second. The trail must be CSS on a width, not a timer per unit.
- Hand off the plate, pips and results pieces that `ui-redesign-social` can reuse for its lobbies in `outcome.md`.
