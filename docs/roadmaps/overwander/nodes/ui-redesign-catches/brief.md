---
id: ui-redesign-catches
title: Redesign the catch sheet
status: done
spent: 439419
priority: must
type: feature
outline: false
milestone: now
size: L
added: 2026-11-03
gate: true
owns:
  - src/components/catches/catch-dialog/**
  - .changeset/ui-redesign-catches.md
shared:
  - src/components/styled/**
provides: []
depends_on:
  - on: ui-design-system
    kind: hard
    why: Built on its tokens and primitives
---

# Redesign the catch sheet

## Goal

Rebuild the catch sheet (the dialog that shows one caught pokemon) on the Field Kit system, following the approved "Catch sheet" board: a hero header, stats on the left, moves as cards in the centre, evolution on the right, origin at the foot. Box, picker, Pokedex and bag are `ui-redesign-box-dex-bag`.

## Context

- Spec: `docs/design/field-kit/Sheet.dc.html` (approved 2026-11-03) and its inventory note `inv-sheet` in `docs/design/field-kit/canvas.json`. System: `docs/design/field-kit.md`. Motion: `docs/design/field-kit/Motion.dc.html`.
- Read the outcomes of `ui-design-system` and `ui-redesign-overworld` first: `Dialog`'s `origin`, the presets (`GROW`, `MORPH`, `RISE`), `@container` caps in `cqw`, `text-gold-dark` (a test enforces it), the HUD's glass and card styles.
- Today's sheet: `src/components/catches/catch-dialog/sheet.tsx` (1837 lines), `index.tsx`, `describe.tsx` and `sections/` (Portrait, Stats, Battle for moves, abilities and held items, Evolution, History, BoxChip). It is opened from the box, the battle view and the admin dialogs; their call sites do not change.

## The moves (from the board's inventory)

- Nameplate (name, species, gender, shiny) -> a hero header with the name large and the level as a tag.
- Portrait, chips, stars, sigil, HP and statuses -> the hero, beside the portrait.
- Tera type, and candy with Level Up -> hero tiles on the right.
- Badges -> the hero. Box chip and Actions -> top right, with a close button.
- Stats -> left column, a hexagon of the totals over the table (IV, EV inputs, Remaining, Undo, Save kept).
- Moves -> centre, cards in a 3-wide grid showing type, category, power and PP; Abilities and Held items under them.
- Evolution -> right column as a vertical line with Evolve.
- Dock (ball, history line, History n, Close) -> an Origin card at the foot; Close -> the header.
- Shadow and In a raid badges appear when they apply.
- Proposals approved with the board: the hexagon, and the move cards' extra facts.
- Dropped: nothing.

## Phone

The phone board still shows today's layout. Decided here: one column at 390 wide, in this order: hero (portrait and name on one row, tiles under it), Moves (cards 2-wide), Abilities and Held items, Stats (hexagon above the table), Evolution, Origin. Box chip, Actions and close stay in the header. Capture it; the maintainer sees it at the gate.

## Steps

- [ ] Write the inventory from `sheet.tsx`, `index.tsx`, `describe.tsx` and every section (every control, section and piece of state, including the conditional ones: eggs, shadows, raids, locked slots, a sheet opened read-only from battle or someone else's catch) into `log.md` as a checklist, ticking each as it gets a place.
- [ ] Split `sheet.tsx` by section first if it helps (`component-layout` skill), behaviour unchanged, as its own commit.
- [ ] Build the desktop sheet to the board, with its motion. Keep every prop, store call and behaviour.
- [ ] Build the phone layout above.
- [ ] Capture desktop (1280x720) and phone (390x844), light and dark: an own catch with a full moveset, one with empty and locked slots, an egg, a shadow pokemon, a read-only sheet. Compare each desktop shot with the board and fix differences.

## Acceptance

- [ ] Every element of the inventory has a place; none is lost.
- [ ] The desktop sheet matches the board in light and dark; reduce motion fades.
- [ ] Changeset `minor`. Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test` (2 workers).

## Sizing

L: one very large component (`sheet.tsx`), a new three-column layout and a phone layout, many conditional states to capture.

## Notes for the worker

- Every string through the message functions, with ja and es present; separators too (see `menu_period_clock`).
- Do not change what the sheet saves or how (EV save, evolve, level up, moves reorder); layout and look only.
- Hand off anything the box, dex and bag node can reuse (move card, stat hexagon) in `outcome.md`.
