# Outcome: catch-sheet-worn-ability

## Built

- `src/data/species/shape-abilities.ts`: `SHAPE_ABILITIES`, `shapeAbilityOf`, the Necrozma burst constants (`ULTRA_BURST_FROM`, `ULTRA_BURST_ITEM`, `ULTRA_BURST_ABILITY`) and `getWornAbilities(species, items, carried)`. `src/battle/items/forms.ts` imports them back.
- `src/game/details.ts`: a `worn` ability kind with its pill, and `detailWornAbility` (tooltip says it is worn in battle, naming the item where one brings it).
- Sheet (`BattleSection.tsx`): worn abilities after the pool and the empty slots, dashed leaf-coloured, no grip, no slot. A help line in the Abilities hint.
- `CatchCard.tsx`: worn pills after the pool's; "No ability" only when nothing is carried or worn.
- Messages in en, es, ja: `catch_ability_worn`, `catch_ability_worn_item`, `catch_abilities_help_worn`.
- `test/data/shape-abilities.test.ts` (8 tests), patch changeset `.changeset/worn-ability-on-sheet.md`.

## Deviations

- The Necrozma burst is not a `SHAPE_ABILITIES` row: Ultra Necrozma is a battle shape and a row would make `wearShapeAbility` act on it. The constants are exported instead.
- `getWornAbilities` takes an optional third argument, the catch's own abilities, and returns `{ ability, item }`. It does not check the species' registered pool, because a form species lists its worn ability there (Wellspring lists Water Absorb) and the check would hide it.
- There is no true shadow Giratina in the repo; the shadow case is tested with shadow Kyogre holding the Blue Orb.
- Owned paths: `CatchCard.tsx` and `BattleSection.tsx` only, no other component touched.

## Checks

- `pnpm typecheck`: exit 0.
- `rtk proxy pnpm exec oxlint src test`: exit 0.
- `pnpm test --maxWorkers=2`: 289 files, 5867 tests passed, 0 failed.
- No screenshots, e2e or db suite run.

## Left

- Nothing.
