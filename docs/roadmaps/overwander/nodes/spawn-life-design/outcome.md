# Outcome: spawn-life-design

## Built

- `docs/roadmaps/overwander/contracts/spawn-life.md` (draft, v1): constants with Minecraft and wAthena values, slot clocks and seeds, the roll of a cycle, lures, the rare channel, ids and keys, the server check, function signatures and homes, roaming, the draw side, what changes for players, the fingerprint answer, cost, open questions.
- `docs/mechanics/spawning.md`: the rules in player terms.
- No game code changed.

## Contract in short

- 8 ordinary slots (0 to 7), 3 lure slots (8 to 10), 1 rare slot (11) per chunk, 12 in all. Cycle 330 s, present 210 to 270 s, rest 60 to 120 s, phase per slot, cycles cut at the local hour.
- Seeds are `AleaRNG` strings (no `world.draws`). Start cells come from per-hour, per-slot territories.
- Spawn key unchanged (`spawnKey`). Spawn id is `key@start#slot`. The server derives the roll, checks presence with a 1 s allowance and position within 1 cell, and compares the individual value the client saw.
- Roaming: 5 s waypoints, leash 4 (2 in town), 500 ms a step, clipped to the chunk, landmarks closed, surfaces by `fitsSurface`.

## Fingerprint

- `generation-fingerprint.test.ts` pins terrain, scenery, landmarks, towns and starts. Not spawns. The design leaves it unchanged.

## Cost

- Measured: cold chunk 1.8 ms, `getSpawns(11)` 0.2 ms, RNG 1.6 microseconds. Everything else is an estimate, and the contract says so.

## Decided by the maintainer (2026-11-03)

- K = 8: about 7.9 standing in the draw circle against 10.8 today (10.8 with a lure against 14.9). Rare odds do not depend on K, so the rare slot keeps today's hourly rate. Cycles per chunk-hour are about 131, so a full roll of a chunk-hour is about 2.6 ms, rolled only for cycles on screen.
- `snapshot_spawns` keeps being written until the derived check is proved. `meetSpawn` follows `server-function-order`. The 1 s allowance stands, with the offset from `src/auth/clock.ts`. A cycle rolls its pool once at its start. Caves use the same slots. Roamers may share cells and use walkable ramps. The teaser and window-based tests move in `spawn-lifetimes`.

## Deviations

- The brief says the key is "cell+window". It is chunk, window and individual value. The contract keeps it and puts the slot in the id.

## Docs the build nodes must update

- `docs/mechanics/world-time.md` (the 5 minute row) and `docs/mechanics/encounters.md` (the opening sections). Not edited here: outside this node's owned paths.

## Size

- Estimated M, actual M.
