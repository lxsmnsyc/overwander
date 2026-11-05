# Log: fuzz-world

## Findings, in the order they surfaced

- The weather map already reads the sky through `weatherWindowOf` and `World.getWeather`, the same as the snapshot. The cave layer's sky equals the surface's at every chunk sampled (6,728 of them), so the board drawing a cave and the snapshot reading the live surface agree.
- A meeting records `snapshot.chunk.biome`, the chunk's middle, not the country of the cell it was met on. `55f99f410` moved the pools, stashes, nests and stops to the cell and left the encounter row behind. Nine callers stand at a cell and name no biome. Too wide for this node: `meetings-cell-biome`.
- `STAFF_GIFT` took packed slots as any count, and `caught_slots_check` stops at 511, so a hand-written gift with more passed the server function and failed its insert.
- The species learnsets read a level key with `Number`, so a key like `1s` filed its moves under `NaN` and the species never learned them.
- A part written under a species name that `world/` does not have (a misspelt `family-teachable`, a misspelt species) was dropped without an error, taking the family's shared machine moves with it.
- A chunk's own rolls reach a legendary too rarely to find the top of its band: with the `MAX_LEVEL` clamp taken out of `checkEncounterLevels`, 100 random chunks never failed. A property over every species' band at once fails at the first fierce buddy.
- Renaming a required key always throws, strict schema or not. Only writing the misspelling beside the key catches a schema that is not strict.
- Chunks are cheap: 500 runs of the world properties take 24 s.

## Decisions

- The server's pure meeting derivation moved out of `startEncounter` into `src/overworld/encounter/stage.ts` unchanged, so the bounds properties test what the encounters table is handed instead of a copy of it.
- The weather map's reads moved to `src/components/demo/weather-map-sky.ts`, which the component and the oracle both use.
- `vitest.fuzz.ts` maps `server-only` to the empty marker `vitest.db.ts` uses, so the fuzz suite can read `src/server/raids/spoils.ts`, `src/server/gifts.ts` (`makeGiftOffer`, pure) and `src/server/validate.ts` without a database.
- The cell-biome property ships as `it.fails`, so it fails the suite once `meetings-cell-biome` fixes the bug and has to be turned back into `it`.
- No YAML round trip: no loader writes YAML, and the one writer (`scripts/i18n/keep-written.ts`) stringifies plain JSON values, which the yaml library reads back unchanged by construction. No hand break of a loader made it fail.
- A misspelling that lands on a sibling key or on any name an id table knows (Pawmot as Pawmo) is a swap the files cannot tell apart, so the property skips it. English item templates are names a file defines, read by name when the item's words are written, so they are not schema keys.
- Family ids with no species yet (16, from regions not written) are allowed: `getRegisteredFamilies` skips them for the species day. Manaphy lays Phione's egg, so it is not a first stage.
