# Outcome: spawn-life-design

## Built

- `docs/roadmaps/overwander/contracts/spawn-life.md` (draft, v1): constants with Minecraft and wAthena values, slot clocks and seeds, the roll of a cycle, lures, the rare channel, ids and keys, the server check, function signatures and homes, roaming, the draw side, what changes for players, the fingerprint answer, cost, open questions.
- `docs/mechanics/spawning.md`: the rules in player terms.
- No game code changed.

## Contract in short

- 6 ordinary slots, 3 lure slots, 1 rare slot per chunk. Cycle 330 s, present 210 to 270 s, rest 60 to 120 s, phase per slot, cycles cut at the local hour.
- Seeds are `AleaRNG` strings (no `world.draws`). Start cells come from per-hour, per-slot territories.
- Spawn key unchanged (`spawnKey`). Spawn id is `key@start#slot`. The server derives the roll, checks presence with a 1 s allowance and position within 1 cell, and compares the individual value the client saw.
- Roaming: 5 s waypoints, leash 4 (2 in town), 500 ms a step, clipped to the chunk, landmarks closed, surfaces by `fitsSurface`.

## Fingerprint

- `generation-fingerprint.test.ts` pins terrain, scenery, landmarks, towns and starts. Not spawns. The design leaves it unchanged.

## Cost

- Measured: cold chunk 1.8 ms, `getSpawns(11)` 0.2 ms, RNG 1.6 microseconds. Everything else is an estimate, and the contract says so.

## To confirm

- K = 6 gives 45 percent fewer pokemon on the board than today (5.9 against 10.8 inside the draw circle). The maintainer chooses 6, 8 or 11.
- The scaled rare slot against leaving the bands in each roll.
- Dropping `snapshot_spawns`.
- The clock-skew allowance of 1 s.

## Deviations

- The brief says the key is "cell+window". It is chunk, window and individual value. The contract keeps it and puts the slot in the id.

## Docs the build nodes must update

- `docs/mechanics/world-time.md` (the 5 minute row) and `docs/mechanics/encounters.md` (the opening sections). Not edited here: outside this node's owned paths.

## Size

- Estimated M, actual M.
