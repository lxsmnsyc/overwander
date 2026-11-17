---
id: catch-sheet-worn-ability
title: Show a form's worn ability on the catch sheet
status: done
priority: should
type: feature
outline: false
milestone: now
size: S
spike: false
gate: false
added: 2026-11-05
owns:
  - src/data/species/shape-abilities.ts
  - src/battle/items/forms.ts
  - src/game/details.ts
  - src/components/catches/catch-dialog/sections/BattleSection.tsx
  - src/components/catches/CatchCard.tsx
  - src/i18n/messages/en.json
  - src/i18n/messages/es.json
  - src/i18n/messages/ja.json
  - test/data/shape-abilities.test.ts
shared: []
provides: []
depends_on:
  - on: ui-redesign-catches
    kind: hard
    why: Changes the redesigned sheet's Abilities card
---

# Show a form's worn ability on the catch sheet

## Goal

A form that wears an ability in battle shows only its stored pool on the catch sheet, so Wellspring Mask Ogerpon lists Grass Pelt and Inner Focus and never Water Absorb. Show the ability the catch will wear in battle beside its pool, marked as worn, on every screen that lists a catch's abilities.

## Context

- Found at the catch sheet's gate on 2026-11-05 (PR #286). Main had the same gap before the redesign.
- The worn abilities are `SHAPE_ABILITIES` in `src/battle/items/forms.ts`, read through `shapeAbilityOf` (a true shadow reads its counterpart's). Ultra Necrozma's Neuroforce is worn the same way, by `ultraBurst` in the same file.
- A catch reaches a worn ability two ways:
  - Its species is a shape in the table. Ogerpon's masks are stored species (`Ogerpon` is the Teal Mask and wears Defiant), so a catch of one always wears its ability.
  - It holds a form item (`FORM_ITEMS` in `src/data/items/form-items.ts`) whose shape for its base species is in the table: Adamant, Lustrous and Griseous Orbs, Gracidea, Reveal Glass, Blue and Red Orbs. Ultranecrozium Z on a Dusk Mane or Dawn Wings Necrozma gives Neuroforce.
- Ogerpon's Terastal shapes (Embody Aspect) and Terapagos Terastal (Tera Shell) are taken only mid-fight, so the sheet does not show them.
- An all-form species has no base ability: the pool is all fillers and no filler is any form's ability (the `ability-pools` skill).
- Components may not import `src/battle`. The table moves to `src/data` so the sheet and the battle read one copy.
- Screens that list a catch's abilities: the sheet's Abilities card (`sections/BattleSection.tsx`) and `CatchCard.tsx` (box hover, team strip, lobby party, gifts, auction board). The battle view already lists worn abilities, because `wearAbility` adds them to `unit.abilities`.

## Steps

- [ ] Move `SHAPE_ABILITIES` and `shapeAbilityOf` to `src/data/species/shape-abilities.ts`, add the Necrozma burst row (from `ULTRA_BURST_FROM` and Ultranecrozium Z), and import them back in `forms.ts`. Battle behaviour does not change.
- [ ] Add `getWornAbilities(species, items)` there. It returns the species' own shape ability, then each held form item's shape ability for the species' base form, with no repeats and nothing already in the pool.
- [ ] In `src/game/details.ts`, add a `worn` ability kind with its own pill and slot colours. Its tooltip names the ability and says it is worn in battle, and for an item it names the item.
- [ ] Sheet: draw the worn abilities after the pool in the Abilities grid. They cannot be dragged, saved, undone or targeted by an Ability Patch, and they take no slot, so the empty and locked counts stay the same.
- [ ] `CatchCard`: draw the worn pills after the pool's. A catch with no pool but a worn ability shows that ability instead of "No ability".
- [ ] Message keys in en, es and ja (decide the wording yourself; follow the existing `catch_abilities_help*` keys).
- [ ] Test file: every Ogerpon mask, Giratina with and without the Griseous Orb, a true shadow Giratina, Landorus holding Reveal Glass, Dusk Mane Necrozma holding Ultranecrozium Z, a plain catch (nothing worn), and a worn ability that is already in the pool (not repeated).

## Acceptance

- [ ] Wellspring Mask Ogerpon's sheet and card show Water Absorb marked as worn beside Grass Pelt and Inner Focus. Teal shows Defiant.
- [ ] Giratina shows Levitate only while holding the Griseous Orb.
- [ ] The slot counts, drag order, save and the Ability Patch picker are unchanged for every catch.
- [ ] Battle tests pass unchanged.
- [ ] Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test`. A `patch` changeset (the sheet already lists abilities, this changes what it lists).
