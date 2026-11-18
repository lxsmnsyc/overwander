# Log: spawn-roaming

- Branch feat/spawn-roaming from batch/overwander. Nothing existed yet.
- roam.ts written (area flood fill, routes, positionAt). Constants live in roam.ts, not index.ts.
- Roam area needs the species, and the cycle end needs the area: lifetimes.ts now rolls a cycle's start (rollStart, memo per id) before its end is known. Draw order unchanged (snapshot test passes).
- Found: getSpawnGround crashed (deal into no slots) on a chunk with a few town cells and no street slot. Guarded in deal.
- Tests in spawn-roam.test.ts pass; spawn-life.test.ts updated for the area rule and the roaming press.
