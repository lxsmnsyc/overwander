# Outcome: boot-learnsets-loader

## Built

- `src/data/species/learnset-store.ts`: the map of learn sets, `getLearnSet(species)`, `registerLearnSets(map)` and `isLearnSetsLoaded()`. A read before the load throws an error naming `ensureLearnSets`.
- `src/data/species/learnsets.ts`: default export `registerLearnSets()` reads the learnset YAML (eager glob, in a module the browser only imports dynamically) with `readLearnSets` and fills the store.
- `src/data/species/yaml.ts`: `readSpecies` no longer takes `learnsets`. `SpeciesData.learnSet` is now a getter reading the store, so `extendRecord` copies (Mega, Zenith, true shadow) read their base's set and every reader and the `LearnSetData` type are unchanged. New `readLearnSets(files)` keeps the family teachables and validation, and checks each species is registered and under the same family as in `world/`.
- `src/data/learnset-data.ts`: `ensureLearnSets()` (memoized, retried after a failure) and `isLearnSetsReady()`.
- `src/data/index.ts`: `registerGameData` also registers learn sets, so the server and tests keep one call. `species/index.ts` re-exports `getLearnSet` and `isLearnSetsLoaded`.
- `src/app.tsx` starts the fetch after first paint. `src/data/battle-data.ts` waits on it (see Gotchas).
- `src/components/overworld/visit-npc.tsx` awaits `ensureLearnSets()` before loading any NPC script. `src/game/overworld/walk.ts` offers no field move until the sets are ready, then refreshes.
- `test/data/learnsets-loader.test.ts`: world registers without them, a board is built and shininess read with none loaded, a read before the load throws, and after the load the sets equal the files' (a base, an evolution, a regional form, a legendary, a Mega sharing its base's object).
- `docs/engine/boot.md`: the row in "Changes since the baseline".

## Proof

- base: `2e8cebe27` (batch/overwander), `pnpm build && pnpm measure-boot`: startup 140 files, 6202.1 KiB raw, 1554.0 KiB gzip, 1234.2 KiB brotli. The `species` chunk is 1770.3 KiB raw, 322.2 KiB gzip and holds the learnset YAML.
- branch: the same command: startup 140 files, 5326.4 KiB raw, 1400.7 KiB gzip, 1124.8 KiB brotli (-153.3 KiB gzip, -9.9%). `species` is 894.1 KiB raw, 168.7 KiB gzip. The new `learnsets` chunk (876.8 KiB raw, 154.4 KiB gzip) is listed under "Loaded later".

## Deviations

- Accessors (`getLearnableMoves` and the rest) stay in `species/__create.ts`, not moved to the store: `overworld/builds/best-moves.ts` and `best-build.ts` import them from there. Only the map moved.
- `learnsets.ts` uses an eager glob with a sync `registerLearnSets()`, not a lazy glob, so `registerGameData` can stay synchronous. The client reaches the module only through a dynamic import, so its chunk is separate (measured).
- No `LearnSetData.tsx` gate: every reader in a component also reads the move registry and sits under `BattleData`, which now waits for the learn sets. A written gate had no user and was deleted.
- Edits outside the owned and shared paths: `src/data/battle-data.ts`, `src/components/overworld/visit-npc.tsx`, `src/game/overworld/walk.ts`; tests `test/data/locale-text.test.ts` and `test/fuzz/data/yaml.test.ts` (no `learnsets` argument to `readSpecies`; the fuzz file gains a "learn sets" loader entry); and 35 test files plus `test/battle/harness.ts` gain one `registerLearnSets()` call after `registerSpecies()` (needed because `registerItems` reads every species' teachable list).

## Stubs left

- None.

## Gotchas

- A test or script that calls `registerSpecies()` and then reads a learn set, or `registerItems()` (TMs are registered off the teachable lists), must also call `registerLearnSets()` from `src/data/species/learnsets` or `registerGameData()`.
- `ensureBattleData` waits on the learn sets, so the battle data and the learn sets arrive together. Anything that reads a move and a learn set needs only `BattleData`.
- Client readers that ran before any gate: `canUseFieldMove` (walk loop; now false until ready) and NPC scripts (trader offers, tutor and reminder lists). Both are handled. `deriveEncounter` reads moves through `deriveMoves`: it runs on the client only in the trader NPC (covered) and the teaser demo (awaits battle data).
- `boot-lazy-registries` and `boot-true-shadows-yaml` edit `species/index.ts` and `yaml.ts`: `registerSpecies` no longer has a `learnsets` glob, and a worn shape's `learnSet` is the getter bound to its base's species id.
- Not run: full `pnpm test`, `test:db`, `test:e2e`, and no manual `pnpm dev` pass (dex, sheet, tutor, TMs, breeding, search). The brief's manual pass remains for the reviewer.

## Proposed learnings

- A registry that is read at registration time by another registry (items read species learn sets) must be listed with it in the loader's await | the machines made `ensureBattleData` depend on learn sets | src/data | no

## Verification

- `pnpm typecheck`: passes.
- `pnpm exec oxlint src test` (through `rtk proxy`): exit 0, warnings only.
- `pnpm exec vitest run test/data test/overworld/world/chunk-snapshot.test.ts test/model/level-moves.test.ts`: 37 files, 638 tests pass.
- `pnpm exec vitest run test/fuzz/data test/overworld test/model test/game test/items test/components/dex test/battle/abilities/gen-1.test.ts test/battle/abilities/gen-9.test.ts`: pass.
- `pnpm build && pnpm measure-boot`: numbers above.

## Size

- Estimated L, actual L. The items dependency and the 36 test edits were the extra work.
