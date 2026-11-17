# Log: catch-sheet-worn-ability

- Moved `SHAPE_ABILITIES` and `shapeAbilityOf` to `src/data/species/shape-abilities.ts`; `forms.ts` imports them back. The Necrozma burst is not a row in the table (that would make `wearShapeAbility` act on `NecrozmaUltra` in battle); `ULTRA_BURST_FROM`, `ULTRA_BURST_ITEM` and `ULTRA_BURST_ABILITY` live there and `ultraBurst` reads them. Battle behaviour unchanged.
- `getWornAbilities(species, items, carried)` returns `{ ability, item }` so the tooltip can name the item. A third argument, the catch's own abilities, is what "already in the pool" is checked against: a form species' registered abilities include its worn one (Wellspring lists Water Absorb), so checking against the species pool would hide it.
- Terastal shapes are skipped (taken mid-fight only).
- True shadows: shadow Kyogre with the Blue Orb reads the counterpart's Primordial Sea. The repo has no true shadow Giratina; the shadow case is tested with Kyogre.
- Sheet and card draw worn entries after the pool; the card's "No ability" shows only when nothing is carried or worn.
