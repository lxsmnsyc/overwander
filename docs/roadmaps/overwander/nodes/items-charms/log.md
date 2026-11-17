# Log: items-charms

- Exp Charm answers `CheckCatchCandy` at Exact and adds `EXP_CHARM_BONUS` (1) to the caught family, on every catch.
- Oval Charm answers `CheckEggSteps` at Post with `min(steps, base * OVAL_CHARM_FACTOR)`. `OVAL_CHARM_FACTOR` is `FLAME_BODY_FACTOR`, imported from `abilities/gen-1`. Post means it runs after Flame Body whichever registered first, so the two give one halving.
- Both icons (`key/exp-charm`, `key/oval-charm`) already exist in the key sheet.
- Pool weights 8 and 8 in the special band, beside the Catching Charm (12), so the order of that band changed and `test/data/items.test.ts` lists it.
- Dropped `MarkCharm` from the ids and ran `pnpm id-names`, which rewrote `names.ts` and `schema/names.json`.
- es names are Amuleto Exp and Amuleto Oval, ja are けいけんちおまもり and まるいおまもり, written by hand without running `official-names`.
