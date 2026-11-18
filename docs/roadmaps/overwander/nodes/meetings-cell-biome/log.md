# Log: meetings-cell-biome

- Proof on `batch/overwander` at 35bd5135f: the `(not yet)` check turned into `fc.assert` (cell passed to `stageEncounter` as an option, which the batch ignores). Command: `pnpm fuzz test/fuzz/world/meetings.fuzz.ts -t country`. Result: fails, `expected 15 to be 16` (recorded biome vs `snapshot.biomeAt(cell)`).
- Design: `EncounterOptions.cell` (deriveEncounter reads the country off it); `stageEncounter` and `startEncounter` require it (number or null) so no staged meeting can leave it out.
