# Log: spawn-lifetimes-core

- Branch feat/spawn-lifetimes-core from batch/overwander.
- Factored `getClosedCells` and `finishSpawn` out of `ChunkSnapshot.getSpawns`; made `getStreetPool` public. Old path unchanged (chunk-snapshot and fingerprint tests green).
- Added `commonSpawn` and `rareSpawn` to the biome registry.
- Wrote `spawn-life/index.ts` and `lifetimes.ts` and the test file.
- Found: mean live fraction is 0.703 with the hour cut, not 0.727 (change request written). Every slot rests at an hour boundary exactly, so tests read 20 minutes into an hour.
- Coordinator decision: contract v2 'Crossing the hour'. `cycleOf`/`cycleAt` take the chunk; `openCycle` draws the start cell and keeps a crossing cycle when `staysOpen`. `SpawnGround.closed` added. `parseSpawnId` now round-trips. Tests and snapshot updated; mean fraction within 2 percent of 0.727.
