---
id: ui-redesign-overworld
title: Redesign the overworld HUD
status: active
priority: must
type: feature
outline: false
milestone: now
size: L
gate: true
added: 2026-11-03
owns:
  - src/components/overworld/overworld-tab/**
  - src/components/overworld/WeatherIcon.tsx
  - src/components/overworld/cell-notes.tsx
  - src/components/app/GameMenu.tsx
  - src/components/app/FullscreenToggle.tsx
  - .changeset/ui-redesign-overworld.md
shared:
  - src/components/styled/**
provides: []
depends_on:
  - on: ui-design-system
    kind: hard
    why: Built on its tokens and primitives
---

# Redesign the overworld HUD

## Goal

Rebuild the chrome around the overworld board on the Field Kit system, following the approved "Overworld HUD" board: the trainer corner, the place and weather capsule, the field-move buttons and the keypad that grows out of the corner. The board itself (canvas drawing) does not change. The overworld dialogs are `ui-redesign-overworld-dialogs`.

## Context

- Spec: `docs/design/field-kit/Overworld.dc.html` (approved 2026-11-03) and its inventory note in `docs/design/field-kit/canvas.json` (`inv-overworld`). System rules, tokens and presets: `docs/design/field-kit.md`. Motion: `docs/design/field-kit/Motion.dc.html`.
- The live canvas, if a board needs adding: https://claude.ai/artifact/1sg3qZ2ZoP1ar6V2K46cnD.
- Read `docs/roadmaps/overwander/nodes/ui-design-system/outcome.md` first: the `Dialog` `origin` prop, `GROW`, `DROP`, `RISE`, `text-gold-dark`, `size-target`, `size-square`, `motion-crossfade`.
- Today's HUD lives in `src/components/overworld/overworld-tab/board.tsx` (the render near the end: egg badge, gold, place and weather popover, field-move chips) and `src/components/app/GameMenu.tsx` (menu button, waiting count, keypad tiles, settings and theme). `FullscreenToggle.tsx` is the fullscreen button.

## The moves (from the board's inventory)

- Menu button and waiting count -> the trainer corner, bottom left. The keypad grows out of it (`GROW` from the corner).
- Egg badge (top right) -> a progress ring round the trainer corner, its steps under the name.
- Gold (bar) -> under the name in the trainer corner.
- Place and weather button and popover -> a capsule at bottom centre that opens into a card in place; the weather windows become a grid of six.
- Field-move chips -> round 56px buttons bottom right.
- Fullscreen -> top-right corner.
- Keypad tiles -> three labelled columns of rows (You, Play, Inbox), counts on the right; Settings and theme in its footer.
- Proposal, approved with the board: the trainer's name in the corner.
- Dropped: nothing.

## Phone

No phone board yet; the maintainer approved the desktop boards only. Decided here: the same corners at 390 wide. Trainer corner bottom left, the capsule bottom centre showing the weather icon and temperature only until opened, field moves stacked bottom right, the keypad opening as a full-width bottom sheet with the three columns as tabs. Capture it; the maintainer sees it at the gate.

## Steps

- [ ] Write the inventory from `board.tsx`, `GameMenu.tsx`, `FullscreenToggle.tsx`, `WeatherIcon.tsx` and `cell-notes.tsx` (every control, section and piece of state) into `log.md` as a checklist, and tick each element off as it gets its place.
- [ ] Build the desktop HUD to the board, with its motion. Keep every prop, store call and behaviour; this is layout and look only.
- [ ] Build the phone layout above.
- [ ] Restyle cell notes on the tokens.
- [ ] Capture desktop (1280x720) and phone (390x844), light and dark, keypad closed and open, capsule closed and open, with an egg carried and without, and compare each with the board. Fix differences before calling it done.

## Acceptance

- [ ] Every element of the inventory has a place; none is lost.
- [ ] The desktop HUD matches the board in light and dark; reduce motion fades.
- [ ] Changeset `minor`. Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test` (2 workers).

## Sizing

L: two big files (`board.tsx` 1480 lines, `GameMenu.tsx` 693), a new layout at two widths, captures.

## Notes for the worker

- `src/components/app/GameMenu.tsx` and `FullscreenToggle.tsx` sit in the shell's folder but belong to this node; `ui-redesign-shell` leaves them alone.
- If `board.tsx` needs splitting to stay readable, follow the `component-layout` skill inside `overworld-tab/`.
- Do not change the board's canvas drawing, the camera or input handling (`board-modes` skill).
- Hand off what the dialogs node needs (for example a shared card for the capsule) in `outcome.md`.
