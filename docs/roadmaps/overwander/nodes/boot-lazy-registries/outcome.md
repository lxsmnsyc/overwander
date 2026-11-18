# Outcome: boot-lazy-registries

## Built

- Moves, abilities and items leave the startup set. Each registry's `index.ts` keeps only its getters and constants; `load.ts` holds the YAML globs, a `fillX(text)` function and the async loader `ensureBattleData` imports dynamically; `register.ts` is the synchronous all-locale registration for the server, tests and scripts (`registerGameData` imports those).
- The item describers (`describeX`) moved from `items/index.ts` into `items/load.ts`, so they load with the registry.
- `src/data/locale-text.ts`: in the browser a load reads English (bundled) and the page's locale only, one text file per request. Other locales are never fetched.
- `src/data/battle-data.ts` imports the three `load.ts` modules; the items fill after the moves and abilities.
- `test/data/lazy-registries.test.ts`: the world registers with the three registries empty, `ensureBattleData` fills them in the page locale (ja) with English under it, a second call shares the load, and `readActiveText` fetches the active locale's files and none in English.
- `docs/engine/boot.md`: the row in "Changes since the baseline" and a section with the per-chunk figures.

## Proof

- Base `a34ff6ddb`, `pnpm build && pnpm measure-boot`: startup 140 files, 5326.4 KiB raw, 1400.7 KiB gzip, 1124.7 KiB brotli. `moves` 99.6 KiB gzip, `abilities` 94.2, `items` 70.0, `trainers` 55.7, all in the startup set.
- Branch, same command: startup 144 files, 4174.3 KiB raw, 1150.3 KiB gzip, 936.1 KiB brotli (-250.4 KiB gzip, -17.9%), remeasured by the reviewer after the server fix. `moves` and `abilities` are out; `items` is down to 5.5 KiB (getters, fossils, form items). Loaded later: `moves/load.ts` 48.7 KiB gzip, `abilities/load.ts` 34.4, `items/load.ts` 31.7. The ja and es text is in none of them.

## Deviations

- Extra files: `load.ts` per registry and `src/data/locale-text.ts`. The brief had `register.ts` as the loader; here `register.ts` is the sync server and test entry and `load.ts` the browser one, so the browser chunk never holds the all-locale globs.
- Outside the owned and shared paths: 36 existing test files (37 changed with the new one) and `src/data/index.ts` import `registerMoves`, `registerAbilities` and `registerItems` from `<registry>/register` instead of the barrel (mechanical, by script). `registerMoves` is now a default export of `moves/register.ts`.
- `ITEM_FAMILIES` stays in `items/index.ts` (the fuzz test imports it).

## Stubs left

- None.

## Gotchas

- A test or script calling `registerMoves`, `registerAbilities` or `registerItems` imports it from `src/data/<registry>/register`, not the barrel.
- Registries were already empty until `ensureBattleData` ran before this change; only the bundling changed. No first-frame read was found or fixed, and the node did not change when anything registers.
- `trainers` (55.7 KiB gzip) is still in the startup set: it is imported directly by overworld code, not through the moves chunk.
- Species text stays eager (the world is registered synchronously and needs names). Next step: `boot-load-by-id`.
- Not done: the manual `pnpm dev` pass (walk, bag, catch sheet, battle with console open) and the full `pnpm test`.

## Verification

- `pnpm typecheck`: passes. `rtk proxy pnpm exec oxlint src test`: exit 0.
- `pnpm exec vitest run test/data test/i18n test/model`: 60 files, 896 tests pass. The edited test files (35 run, the harness is covered by them): 2537 tests pass.
- `pnpm build && pnpm measure-boot`: numbers above.

## Size

- Estimated L, actual M: the split was mechanical and the first-frame audit found nothing to fix.
