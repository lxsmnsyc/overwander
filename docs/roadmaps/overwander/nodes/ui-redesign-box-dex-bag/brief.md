---
id: ui-redesign-box-dex-bag
title: Redesign the box, the Pokedex and the bag
status: done
priority: must
type: feature
outline: false
milestone: now
size: L
added: 2026-11-05
owns:
  - src/components/catches/**
  - src/components/dex/**
  - src/components/items/**
shared:
  - src/components/styled/**
  - src/routes/index.tsx
provides: []
depends_on:
  - on: ui-design-system
    kind: hard
    why: Built on its tokens and primitives
  - on: ui-redesign-catches
    kind: hard
    why: Shares the catches folder and reuses the sheet's move card and stat hexagon
---

# Redesign the box, the Pokedex and the bag

## Goal

Rebuild Boxes, the Bag, the Pokedex and the dex entry on the Field Kit system, following the four boards the maintainer approved on 2026-11-07, proposals included. The catch picker and the three item dialogs take the same look without boards of their own.

## Context

- Spec: `docs/design/field-kit/Box.dc.html`, `Bag.dc.html`, `Pokedex.dc.html`, `DexEntry.dc.html`, and their notes `inv-box`, `inv-picker`, `inv-bag`, `inv-dex`, `inv-entry` in `docs/design/field-kit/canvas.json`. System: `docs/design/field-kit.md`. Motion: `Motion.dc.html`.
- The inventory is already written: `log.md` in this folder, read from every component on 2026-11-07, as a checklist. Tick each item as it gets a place.
- Read the outcomes of `ui-design-system`, `ui-redesign-overworld`, `ui-redesign-catches` and `ui-redesign-battle` first: `Dialog`'s `origin` and widths, the presets (`GROW`, `MORPH`, `RISE`), `@container` caps in `cqw`, `text-gold-dark` (a test enforces it), the HUD's glass, the catch sheet's hero and move card, the battle inspector's dock and `ItemTray`.
- The screens are dialogs mounted in `src/routes/index.tsx` (shared path: only their `width` and wrappers change there).
- Renderer: none changes. DOM only; sprites stay as they are drawn today.

## The moves (from the boards)

Boxes (`catches/catches-list/*`, `CatchGrid`, `CatchBox`, `CatchCard`):
- The dialog grows to the sheet width (76rem), the catch sheet's.
- Top line: the summary, New box and Select; Done replaces both while selecting.
- Left rail: Find a box, box rows (grip, swatch, name, count; Default first), Let go today, the hint line and "n of 32 boxes used". The phone keeps its chip row.
- One heading line over the box: swatch, name, fill line, Add pokemon when it applies, the ⋯ menu and its inline questions.
- One search row: search, This box / All boxes as a segmented control, sort, order. Range line and slot-order note share the line under it.
- Selection bar under the title, green, with everything `CatchActions` has today, Release still two presses with its candy price.
- Squares and the hover card restyled as on the board; every mark, bar, gap, Put here, drag, drop and long-press kept.
- Proposals, approved: a fill meter under each made box in the rail (count over the box's size); a Picked tray under the box while selecting, showing picks held across boxes.

Bag (`items/InventoryList`, `ItemGrid`, `CandyGrid`):
- The dialog grows to 59rem; pockets become a left rail with a colour and count each, the remembered pocket kept. Candies are a gold tray.
- The pocket's name and stack count head the tray; search, the 6x5 tray and the pager under it.
- About the bag is a ? at the sheet's top right.
- Proposal, approved: pressing an item docks a detail panel on the right (art, count, pocket, sell price, description, the pokemon it would help) with its verb (Use it on…, Open a raid with…, Climb out with…). The sheet widens to 76rem while a panel is open. The panel's verb does what the press does today; a non-usable item shows the panel without a verb.

Pokedex (`dex/PokedexTab`, `PokedexGrid`, `SpeciesFormsDialog`):
- The dialog grows to 59rem with a rail: seen and caught as number tiles, "of n", then one row per region with its seen count and caught bar.
- Find and All / Caught / Missing on one row; the pager between it and the grid; larger squares; a key under the grid (caught, seen, not met).
- Proposals, approved: a mark on squares whose species has more than one form; a gold star on a region with everything caught.
- The forms dialog keeps its grid, count and Close, restyled.

Dex entry (`dex/dex-entry-dialog/*`):
- A hero header like the catch sheet's: previous and next either side of "#NNN Name", category, types, seen and caught, close.
- Left: the portrait stage with coat and sex toggles, four tiles (height, weight, candy, hatch steps), the evolution line card.
- Centre: base stats, abilities, habitat cards. Right: moves with Level / Machines / Egg tabs, scrolling in its card.
- Unmet: ???, the silhouette, and "Meet this pokemon to fill in its entry." across the centre and right.

Catch picker and item dialogs:
- The picker uses the restyled grid, search row, squares and hover card in its 44rem dialog; nothing else moves.
- Bottle Cap, Ability Patch and Increase PP keep their layout; their radio rows become option cards; `MovePicker` rows take the catch sheet's move card look.

## Phone

Decided here, at 390x844: every screen is one column. Boxes keeps its chip row of boxes over the box. The Bag's pockets and the Pokedex's regions become a scrolling chip row over the tray or grid. The Bag's detail panel is a sheet across the foot. The dex entry stacks hero, portrait and tiles, evolution, stats, abilities, habitat, moves. Capture it; the maintainer sees it at the gate.

## Steps

- [x] Split any file past reading in one sitting first (`component-layout` skill), behaviour unchanged, as its own commit. `catches-list/index.tsx`, `CatchBox.tsx`, `catch-picker/box.tsx`, `InventoryPicker.tsx`, `InventoryList.tsx` and `dex-entry-dialog/body.tsx` are the candidates.
- [x] Build Boxes to its board, with the two proposals.
- [x] Build the Bag, with the detail panel.
- [x] Build the Pokedex and the forms dialog, with the two proposals.
- [x] Build the dex entry.
- [x] Restyle the picker and the three item dialogs.
- [x] Build the phone layouts above.
- [x] Capture desktop (1280x720) and phone (390x844), light and dark, against `pnpm dev` and the dev database: Boxes browsing, selecting with the release question, all-boxes search, an empty made box, the let-go list; the Bag in All, a type pocket, Candies, with the detail panel; the Pokedex with a found number and the forms dialog; a met and an unmet dex entry; the picker from Use it on; each item dialog. Compare each desktop shot with its board and fix differences.

## Acceptance

- [x] Every item in `log.md` is ticked: none is lost.
- [x] Desktop matches the four boards in light and dark; reduce motion fades.
- [x] Screens that share the pieces (gifts, auctions, trades, team picks, NPC forms, buddy) still work and look right with the restyled grid, card and picker: capture each once.
- [x] Changeset `minor`. Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test` (2 workers).

## Sizing

L: four screens, two proposals that change a press (Bag panel) or add a piece (Picked tray), many shared components with outside callers, and a long capture list. If it runs long, split the Pokedex and dex entry into a follow-up commit series on the same branch rather than cutting the inventory.

## Notes for the worker

- Every string through the message functions, with ja and es present. Decide the wording yourself.
- Do not change what the screens save or how (filing, sorting, releasing, using items, teaching): layout, look, and the approved proposals only.
- The Bag panel's "pokemon it would help" reads the same filter Use it on already uses; do not add a server read for it.
- Lists that can grow without bound are paged (`paged-lists` skill); the let-go list and the dex entry's move tabs are not paged today: page them at `LIST_PAGE` if they can grow past it.
- Hand off anything the social node can reuse (rail, segmented control, detail panel) in `outcome.md`.
