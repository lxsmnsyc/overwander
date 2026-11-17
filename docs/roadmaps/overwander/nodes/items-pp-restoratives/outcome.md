# Outcome: items-pp-restoratives

## Built

- `src/battle/items/pp-restoratives.ts`: one listener on `UnitStartCooldown` for all four, driven by `PP_RESTORATIVES` (`src/data/items/medicine.ts`). Wired in `src/battle/items/index.ts`.
- Records in `records/medicine.yaml`, names and descriptions in en, es and ja (`src/data/text/*/items/medicine.yaml`), pool weights in `src/data/overworld/item-pool.yaml`.
- `test/items/pp-restoratives.test.ts`: Ether halves and is spent once, Max Ether clears and ignores Unnerve (a Leppa does not), Elixir and Max Elixir wait until every move is cooling down.
- The TODO over ids 320 to 323 is gone.

## Deviations

- Not on the Medicine vendor shelf: a test keeps held items off it, and gear and one-shots are found only too. "Sold" is read as the `Marketable` flag and a price, like the one-shots.
- Elixirs ignore the plain attack and Struggle when counting moves.
- Files touched beyond the owned list: `src/battle/items/index.ts`, `src/data/items/medicine.ts`, `src/data/text/{es,ja}/items/medicine.yaml`, `src/data/overworld/item-pool.yaml`, `src/data/ids/items.ts`.
- Names in es (Éter, Éter Máximo, Elixir, Elixir Máximo) and ja (ピーピーエイド, ピーピーリカバー, ピーピーエイダー, ピーピーマックス) were written from memory of the mainline; the `official-names` script was not run.

## Checks

- `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm exec oxfmt src test`.
- `pnpm exec vitest run test/items test/data/items.test.ts`: 69 passed.

## Left

- Nothing.
