# Log: boot-learnsets-loader

- Base measure: `pnpm build && pnpm measure-boot` on batch/overwander at 2e8cebe27: startup 140 files, 6202.1 KiB raw, 1554.0 KiB gzip, 1234.2 KiB brotli. The `species` chunk is 1770.3 KiB raw, 322.2 KiB gzip and holds the learnset YAML (1.4 MB source). Learn sets are in the startup set, reproduced.
- Design: SpeciesData.learnSet becomes a getter reading `species/learnset-store.ts`, so extendRecord copies (Mega, Zenith, true shadow) keep reading their base's set and every reader stays unchanged. Accessors stay in `__create.ts` (best-moves.ts and best-build.ts import them from there).
- After: `pnpm build && pnpm measure-boot` on the branch (working tree on 2e8cebe27 plus this node): startup 140 files, 5326.4 KiB raw, 1400.7 KiB gzip, 1124.8 KiB brotli. `learnsets` chunk loads later: 876.8 KiB raw, 154.4 KiB gzip.
- registerItems registers a TM per teachable move of every species, so `ensureBattleData` now awaits `ensureLearnSets` (one edit in battle-data.ts). Every BattleData gate therefore covers the learn set readers that also read the move registry (dex, sheet, search, reminder lists).
- Client readers before any gate: `canUseFieldMove` in game/overworld/walk.ts (every refresh), NPC scripts (visit-npc.tsx). Fixed with a ready check plus a refresh after load, and an await before loading a script.
- Tests: 36 files call `registerSpecies()` and now also `registerLearnSets()`; two pass readSpecies the learnsets glob no more; the fuzz loader for learn sets moved to its own entry.
- LearnSetData.tsx gate written, then removed: no reader needed it beyond BattleData.
