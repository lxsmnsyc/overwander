---
name: spawn-life
version: 1
status: frozen
defined_by: spawn-life-design
---

# Contract: spawn-life

## Purpose

How a wild pokemon's life on the board is derived: when it appears, where it stands at a given moment, when it leaves, how many a chunk holds, and how the server checks a meeting. `spawn-lifetimes`, `spawn-radius` and `spawn-roaming` build on it.

Player-facing rules are in `docs/mechanics/spawning.md`. This file holds the constants and interfaces.

## Model in one paragraph

Each chunk has `SLOT_TOTAL` slots. A slot runs a repeating cycle on its own clock: a pokemon is present for a while, then the slot rests, then it rolls again. What stands in a slot, and where it starts, is a pure function of the chunk, the zone, the slot and the cycle number. Nothing about a slot is stored. The cap is the slot count of the chunk, so existence never depends on where players stand. A caught or fled pokemon is hidden from that player only, until its cycle ends.

## Constants

All live in `src/overworld/spawn-life/index.ts`. Times are local milliseconds (the zone's clock, as `ChunkSnapshot.timestamp` is).

| Constant | Value | Minecraft | wAthena |
| --- | --- | --- | --- |
| `SLOT_COUNT` (ordinary slots per chunk) | 8 (equal to today's `SPAWN_COUNT`) | Monster cap 70 per player, scaled by the loaded chunk count (about 0.24 a chunk) | `count` of a spawn line, per map |
| `LURE_SLOTS` (extra slots only a lure shows) | 3 (same as `LURE_SPAWN_BONUS` today) | No equivalent | No equivalent |
| `RARE_SLOT` (index of the rare channel, outside K) | 11 | No equivalent | No equivalent |
| `SLOT_TOTAL` | `SLOT_COUNT + LURE_SLOTS + 1` = 12 | | |
| `SLOT_PERIOD` (cycle length, present plus rest) | 330 000 (5.5 min) | Spawn attempt every tick, no cycle | `respawnDelay` after a death, no fixed period |
| `PRESENT_MIN`, `PRESENT_MAX` | 210 000, 270 000 (3.5 to 4.5 min, mean 4) | A mob lives until it despawns: random 1/800 a tick once 32+ blocks from every player and 30 s old; at once past 128 blocks | A monster lives until killed |
| Rest (derived: `SLOT_PERIOD - present`) | 60 000 to 120 000 (1 to 2 min, mean 90 s) | None | `RespawnMs` plus `rand(RespawnVarianceMs)`, at least 1000 ms |
| `MIN_STAY` (shortest cycle worth showing) | 30 000 | | |
| `HOUR` (cycles never cross a local hour) | 3 600 000 | | |
| `MEET_DRIFT_MS` (server allowance at the edges of a cycle and for position) | 1 000 | | |
| `MEET_DRIFT_CELLS` | 1 | | |
| `WAYPOINT_MS` (roaming) | 5 000 | Idle stroll check about 1 in 120 ticks (about 6 s) | `minRandomWalk` 4000 plus `rand(1000)` plus path time |
| `LEASH_CELLS` | 4 (path distance from the start cell) | Stroll range 10 blocks | `randomWalkRange` 7 |
| `TOWN_LEASH_CELLS` | 2 | | |
| `STEP_MS` | 500 (a player's step is 250, `STEP_PACE`) | About 0.2 to 0.25 blocks a tick for a walking mob | Per-species walk speed |
| `WALK_DELAY_MAX` | 1 000 (a per-waypoint pause before walking) | | the `rand(1000)` term |
| `DRAW_RADIUS` (draw side, cells) | `BOARD_RADIUS` (10.5, unchanged) | Spawn ring 24 to 128 blocks | Visible range of the client |
| `FADE_IN_MS`, `FADE_IN_NEAR_MS`, `FADE_OUT_MS` | 600, 2 400, 600 | Mobs pop in | Mobs pop in |
| `NEAR_RING_CELLS` | 4 | The 24-block minimum distance | `Avoid` cells of a spawn |
| `RARE_ODDS_SCALE` | 8 (see Rare channel) | | |

The mean live fraction of a slot is 240 / 330 = 0.727. K = 8 is decided (maintainer). Cost shows the density it gives on the board.

## Slot clocks

A slot is addressed by `(chunkKey, slot)`, where `chunkKey` is `ChunkSnapshot.key` (`${chunk.seed}${toZoneKey(offset)}`). Seeds are `AleaRNG` strings, not `world.draws`: spawns turn over with the clock and the server re-derives them, which is the exception the `world-generation` skill names. No `world.draws` call is added or reordered by this work.

| What | Seed string | Draws, in order |
| --- | --- | --- |
| Phase of a slot | `${chunkKey}slotphase${slot}` | `random()` times `SLOT_PERIOD`, floored |
| A cycle | `${chunkKey}slot${slot}cycle${cycle}` | present length; start cell; the species draws; individual value; trait value |
| Territories of an hour | `${chunkKey}ground${hour}` | one Fisher-Yates shuffle of the street cells, then of the country cells |

`cycle` is an integer: `floor((time - phase) / SLOT_PERIOD)`. `hour` is `floor(time / HOUR)` on the local clock. The draw order inside a cycle may not change after release, as with the first generation's rolls.

Cycle `c` of a slot:

```
start   = phase + c * SLOT_PERIOD
present = PRESENT_MIN + floor(random() * (PRESENT_MAX - PRESENT_MIN))
end     = min(start + present, (floor(start / HOUR) + 1) * HOUR)
```

- A cycle with `end - start < MIN_STAY` is empty (the slot rests until the next one).
- The cut at the hour is what lets one occupied-cell set (landmarks, rock, lava, the hour's phenomena) and one weather window cover a whole cycle. About 7 percent of cycles are shortened by it.
- Cycles of one slot never overlap: `PRESENT_MAX < SLOT_PERIOD`.
- Slots stagger through their phases only. The rest between two cycles is `SLOT_PERIOD - present`, so it varies with the present length.
- The rest does not shorten when a player catches the pokemon: the slot is shared, the catch is not.

## The roll of a cycle

`rollSlot(chunk, offset, slot, cycle)` gives the pokemon of one cycle, or `null` when the slot is empty that cycle.

1. **Ground of the hour.** `getSpawnGround` builds, once per (chunk key, hour), the cells a pokemon may start on: every cell of `PLACEMENT_AREA` that is not in the chunk's decorations, landmarks, rock, face cells, lava or the hour's phenomena (the set `getSpawns` builds today). Town cells (`isTownCell`) and country cells are kept in two lists.
2. **Street slots.** Slot `i` of the first `SLOT_COUNT + LURE_SLOTS` (0 to 10) is a street slot when `floor((i + 1) * share) > floor(i * share)`, with `share = streets / (streets + country)`, which is today's rule, so a lure's prefix keeps the street share. A chunk with no street has none. `RARE_SLOT` is never a street slot.
3. **Territories.** Each list is shuffled with the `ground` seed and dealt round-robin to the slots that use it. A slot's territory is its own cells, so two slots never start on the same cell, and no slot needs to know another's state. A street slot with an empty territory falls back to the country list.
4. **Start cell.** `territory[floor(random() * territory.length)]`.
5. **Pool.** A street slot rolls the town pool (`getStreetPool`); other slots roll `getCellPool(cell)`, which cuts by the cell's surface (`spawn-surfaces`). Both are read from `new ChunkSnapshot(chunk, start, offset)`, whose timestamp is `start` floored to 5 minutes (the roll window). Time of day, weather, species day and season come from that window, so the board and the server read the same ones.
6. **Species and values.** `pickSpawn` as today, then the shore form, wing pattern and seasonal coat, then `individual = int32()`, `trait = int32()`, then `getRareShape`. The build factors this out of `getSpawns` into one function both paths call.
7. **Empty.** `pickSpawn` returning `null` (nothing lives on that surface) leaves the slot empty for that cycle, as the window is one lighter today.

Ordinary slots (`0 .. SLOT_COUNT-1`), lure slots (`SLOT_COUNT .. SLOT_COUNT+LURE_SLOTS-1`) and street slots use `pickSpawn` with the mythical, special and prized bands removed (`commonSpawn`, a new function in `src/data/biome/__create.ts` that drops the fixed bands from the groups it is given).

### Lures

The lure slots exist for everyone, as today's three extra rolls do. The overworld engine still decides how many are shown: the visible set is the slots with index below `overworld.checkSpawnCount(SLOT_COUNT)` among slots `0 .. SLOT_COUNT+LURE_SLOTS-1`. Incense and Stench cut the ordinary prefix by the same amounts as now (Pure Incense and Cleanse Tag by 3, Stench by 2, a lure adds `LURE_SLOTS`). A pokemon that has been shown stays shown for the rest of its cycle (the `everShown` rule, keyed by spawn id). No lure changes which pokemon exists or when.

### Rare channel

Today `pickSpawn` reaches the mythical, special and prized bands inside every roll, at 1/4096, 1/4096 and 1/512, and about 96 rolls an hour fall to a chunk. Slot cycles are about 11 an hour a slot, so leaving the bands in the roll would cut the rare rate by a third and tie it to K.

Instead `RARE_SLOT` has its own cycle and its own territory (country cells) and rolls only the fixed bands, at `RARE_ODDS_SCALE` times today's odds per cycle (1/512, 1/512 and 1/64), so a chunk meets one about every 4.2 hours against 4.3 now. A cycle that misses every band is empty. The rare slot is shown to every player and ignores incense, Stench and lures. Legendary lairs, Max Raids and the other landmarks are not spawns and do not change.

## Identity, memory and the server check

### Ids and keys

| What | Form | Notes |
| --- | --- | --- |
| Spawn id | `${chunkKey}@${start}#${slot}` | The existing `spawnId(key, timestamp, index)` in `src/model/snapshot-record.ts`, with `start` the cycle start in place of the window and `slot` in place of the roll index. Names an encounter row (`spawn_id`). |
| Spawn key | `spawnKey(x, y, timestamp, individualValue)` | Unchanged. `x, y` are chunk coordinates, `timestamp` is the roll window (`start` floored to `SNAPSHOT_INTERVAL`, which is `encounter.timestamp` as `deriveEncounter` writes it), `individualValue` the roll. |

The key never held the cell, so movement does not break it. Two cycles of one slot start exactly `SLOT_PERIOD` (330 s) apart, more than a roll window, so they fall in different roll windows. Two slots in one window collide only when their 32-bit individual values match, which costs one player a hidden pokemon. Keeping `spawnKey` unchanged leaves raids, stops, gifts and the fled table untouched.

### Remembering fled and met pokemon

- A fled or caught pokemon is written to `fled_encounters` as now (`retireSpawn`, `retireEncounter`, `retireIn`), keyed by `spawnKey`. The board hides it for that player. It is gone for them until its cycle ends, and the slot's next cycle has a new roll and a new key.
- A met pokemon that the player walked away from keeps its `encounters` row, so walking back in returns the same meeting (`startEncounter`'s early return). After the cycle ends, the meeting cannot be started again, since the server only stages a present pokemon.
- `FLED_MEMORY` (1 hour) stays. The longest a key can matter is `SLOT_PERIOD` plus one roll window, far below it. The hourly sweep is unchanged.

### The server check

`meetSpawn(uid, x, y, spawnId, now, offset, depth, cell, individualValue)` replaces the stored-window lookup. The two new arguments are checked with `check` (`server-function-validation`). The signature change follows the `server-function-order` skill and its build guard.

1. Parse `spawnId` into `(key, start, slot)`; require `key` to equal the chunk's key for this zone and `slot < SLOT_TOTAL`.
2. `local = toLocalTime(now, offset)` from the server's clock. Find the cycle whose start is `start`; refuse when none begins there or it is empty.
3. Present: `start - MEET_DRIFT_MS <= local < end + MEET_DRIFT_MS`.
4. Roll it with `rollSlot`. Refuse when its individual value differs from the one the client sent (a tab on another build derived another roll).
5. Position: with `positionAt(area, live, t)` the cell must be within `MEET_DRIFT_CELLS` (Chebyshev) of the position at `local` or at `local - MEET_DRIFT_MS`. Before `spawn-roaming` lands, `positionAt` returns the start cell (leash 0), so the check is the same code.
6. `startEncounter(uid, snapshotOf(start), spawnId, spawn)` where `snapshotOf(start)` is `new ChunkSnapshot(chunk, start, offset)`.

The meeting no longer needs `snapshot_spawns` for its roll. The table keeps being written until the build has proved this check (see the stored window below). The drift covers latency and the client's synced clock. The client reads the server clock offset it already keeps: `serverNow` and `localNow(zone)` in `src/auth/clock.ts`, refreshed by `syncServerClock`. The board and the fades read time only through `localNow`. It lets a pokemon be met up to a second after the server's clock says it left, and no earlier than a second before it appears.

## Functions

Pure, in `src/overworld/spawn-life/`. They import no Solid, no server module and no canvas module.

```ts
// index.ts: constants above, plus
export type SlotKind = 'country' | 'street' | 'lure' | 'rare';
export interface SlotCycle {
  slot: number;
  cycle: number;
  start: number; // local ms
  end: number; // local ms, already cut at the hour
}
export interface LiveSpawn {
  id: string; // spawn id
  slot: number;
  kind: SlotKind;
  cycle: SlotCycle;
  home: number; // start cell, chunk-local 0..255
  spawn: Spawn; // [species, individualValue, traitValue]
}

// lifetimes.ts (owned by spawn-lifetimes)
export function slotPhase(chunkKey: string, slot: number): number;
export function cycleOf(chunkKey: string, slot: number, cycle: number): SlotCycle | null; // null: shorter than MIN_STAY
export function cycleAt(chunkKey: string, slot: number, time: number): SlotCycle | null; // null in the rest
export function getSpawnGround(chunk: Chunk, offset: number, time: number): SpawnGround; // memo per chunk key and hour
export function rollSlot(chunk: Chunk, offset: number, slot: number, cycle: SlotCycle): LiveSpawn | null; // memo per id
export function liveSpawns(chunk: Chunk, offset: number, time: number): LiveSpawn[]; // every slot present at time
export function parseSpawnId(id: string): { key: string; start: number; slot: number } | null;
export function checkMeeting(
  chunk: Chunk, offset: number, id: string, individualValue: number, cell: number, localNow: number,
): LiveSpawn | null; // the server check above

// roam.ts (owned by spawn-roaming)
export function getRoamArea(chunk: Chunk, offset: number, live: LiveSpawn): RoamArea; // memo per chunk key, hour, home, habitat
export function positionAt(area: RoamArea, live: LiveSpawn, time: number): { cell: number; dx: number; dy: number };
```

```ts
// src/game/overworld/spawn-radius.ts (owned by spawn-radius), no Solid
export function spawnAlpha(live: LiveSpawn, now: number, distance: number): number; // 0..1 from the fades below
export function isDrawn(distance: number): boolean; // distance <= DRAW_RADIUS
```

Callers that change: `board-view.ts` (`getSpawns`, `getSpawnCells`, `everShown`, `PUBLISHED_SPAWNS`), `src/auth/snapshots.ts` (stops rolling spawns into the stored window), `src/server/overworld/spawns.ts` (`meetSpawn`), `src/overworld/safari/index.ts` (no change to `spawnKey`; `encounterWindow` reads the roll window as now), `src/components/demo/teaser/world-scene.tsx` (static call to `liveSpawns`). `ChunkSnapshot.getSpawns`, `getSpawnAt` and `getSpawnCells` go once nothing reads them.

## Roaming

Designed here, built by `spawn-roaming` after the slots. A position is a pure function of the cycle and the time, not a simulation.

- **Home.** The start cell of the cycle. The pokemon belongs to its home chunk and never leaves it: the area is clipped to the chunk, so no neighbouring chunk is derived to place it.
- **Area.** `getRoamArea` flood-fills from `home` with 8-neighbour steps (no corner cutting: both orthogonal cells must be open), at most `LEASH_CELLS` steps (`TOWN_LEASH_CELLS` for a street slot). The result is a small set (at most 81 cells) with a stable order, so a draw indexes into it.
- **Surfaces by kind.** A cell is open for the species when `fitsSurface(species, surface)` holds (`spawn-surfaces`: ground stands on land and ice, water on water, flying on both, an amphibious water species on all three). A step between terrace levels is open only where `canStep` allows it for a walker (`terraces`); water and flying species move on the surface they fit.
- **Landmarks never entered.** A cell in the chunk's landmarks, decorations, rock, face cells, lava or the hour's phenomena is closed. The ground is the same set the start cell is drawn from, so a roamer cannot cross a stash, a dust cloud or a building.
- **Towns.** A street slot stays on town cells within `TOWN_LEASH_CELLS`. A country slot treats town cells as closed and never enters a town.
- **Waypoints.** Epoch `e = floor((t - start) / WAYPOINT_MS)`. Its target `T_e` is `area[floor(random() * area.length)]` from `${chunkKey}slot${slot}cycle${cycle}walk${e}`, and `T_-1 = home`. A target never depends on the one before, so there is no chain to replay. The walk from `T_{e-1}` to `T_e` is the shortest path inside the area, ties broken by a fixed neighbour order.
- **Time inside an epoch.** `u = t - epochStart - delay`, with `delay = floor(random() * WALK_DELAY_MAX)` from the same draw. The pokemon is at step `min(path.length, floor(u / STEP_MS))` of the path, and `u % STEP_MS` gives the fraction for drawing. Any two cells of the area are at most `2 * LEASH_CELLS` = 8 steps apart through home, so a walk takes at most 4 s and the delay at most 1 s: the walk always ends inside the 5 s epoch.
- **Overlap.** Two roamers may stand on one cell. Pressing picks the one drawn on top (lower slot first); the server accepts either, since each is checked on its own.
- **Meeting.** Starting a meeting freezes nothing server side. On the client the pokemon is hidden while its meeting is open.

## Draw side and what is per-client

The loaded chunks and the draw circle do not change: `boardChunks` and `BOARD_RADIUS` (10.5 cells). `VIEW_RADIUS` (20) is how far country is drawn, not where pokemon stand. No distance to a player changes what exists.

- **Fade in.** A pokemon fades in over `FADE_IN_MS` from its `start`. When it starts inside `NEAR_RING_CELLS` of the player it fades in over `FADE_IN_NEAR_MS`, so nothing pops up beside a walker. A pokemon already standing when its chunk comes into the circle is drawn at once.
- **Fade out.** The last `FADE_OUT_MS` of a cycle fade the sprite. A press during a fade still counts, within the server's drift.
- **Per-client only:** the fade alpha, the walk interpolation and sprite frame, the shown-lure memory, the hide of fled and caught keys, and the player's shiny sparkle (derived from the roll as now). Everything else, including every cell and time, is shared.

## What changes for existing players

- The first load of the build replaces every chunk's pokemon at once. There is no migration of spawns: the old set was derived and published, never owned.
- Fled keys written before the build match nothing (they name the old windows) and are swept within the hour. A pokemon a player fled in the last five minutes may be met again as a different pokemon. Acceptable.
- Encounters already staged keep their `spawn_id`, key and record. `retireEncounter` reads the key from the stored record, so catches and flees of a pre-build meeting still retire it.
- Rates change: a chunk holds 8 ordinary slots of which 73 percent stand on average (5.8), against 8 always standing. Rare pokemon keep their hourly rate through the rare slot. 
- The stored window (`snapshots`) stays for landmark claims. Spawns keep being written to `snapshot_spawns` until the build has proved the derived server check. Removing the table is a follow-up the build node notes, not part of the build.

### Docs the build node updates

- `docs/mechanics/world-time.md`: the 5 minute row of the refresh table.
- `docs/mechanics/encounters.md`: the opening sections (the fresh set every five minutes, how many appear).

### The world fingerprint test

`test/overworld/generation-fingerprint.test.ts` digests, for three 8 by 8 stretches of chunks (near the origin and two far out) on the first and second generation, surface and cave: each chunk's biome, each cell's role, biome, terrace level and climate (humidity, temperature, elevation), the landmark cells, the decoration cells, the cave mouth, the towns of the surrounding regions with their lots and roads, and the start position of a player. It pins terrain, scenery, landmarks, towns and starts. It does not read a `ChunkSnapshot`, so it pins no spawn, no phenomenon and no clock-driven content.

The slot design does not move it, provided it adds no `world.draws` call and reorders none. It uses only `AleaRNG` strings and read-only getters of the chunk (`getDecorationCells`, `getLandmarkCells`, `getRockCells`, `getFaceCells`, `getLavaCells`, `getCellSurface`, `isTownCell`). The roam area reads walkability the same way. The build adds its own test for the slot clocks (below), which is the pin for spawns.

### Tests the build adds

- `cycleAt` and `cycleOf` agree; cycles of a slot never overlap; no cycle crosses an hour; present lengths stay in range; the mean live fraction over a day is within 2 percent of 0.727.
- Territories of an hour are disjoint and cover no closed cell; two slots never share a start cell.
- The same inputs give the same rolls in two processes; a pinned list of (species, cell, start) for one chunk and day, so a change to the draw order is a decision.
- `checkMeeting` accepts inside the drift and refuses outside it, with a wrong individual value, a wrong slot and a wrong cell.
- Roaming: every position is inside the area, every step is one cell, a walk ends inside its epoch, and a landmark cell is never occupied.

## Cost

Measured with a throwaway vitest bench on this machine (not kept): 40 chunks of the surface world, warm code.

| Path | Time |
| --- | --- |
| Cold chunk with its fixtures (`getChunk` plus decorations, landmarks, rock, face, lava) | 1.8 ms |
| `ChunkSnapshot.getSpawns(11)` on a warm chunk (today's roll for a window) | 0.2 ms, so about 0.02 ms a spawn |
| `getSpawns` plus `getSpawnCells` | 0.13 to 0.25 ms |
| `new AleaRNG(string)` plus 3 draws | 1.6 microseconds |

Estimates from those (not measured):

- **Derive.** Ground of an hour: one scan of 256 cells plus two shuffles, about the cost of the first half of `getSpawns`, 0.1 ms a chunk a local hour. A roll is one RNG, one pool pick and the coat helpers, about 0.02 ms. A chunk's twelve slots roll about 131 cycles an hour, so 2.6 ms a chunk an hour if every cycle were rolled; only cycles that stand while a chunk is in range are, and each is rolled once (memo per id). On a walk through 5.6 loaded chunks that is about 0.17 rolls a second, under 0.01 ms a second.
- **Board build** (per step, not per frame). Replaces one `getSpawns(11)` plus `getSpawnCells` per chunk with `liveSpawns` over cached cycles: slot arithmetic of twelve slots a chunk, nanoseconds each after the first call. The shared-window wait goes away.
- **Draw per frame.** Sprites drawn are the pokemon inside the 10.5 cell circle: about 8 ordinary at K = 8 plus 3 with a lure, against 11 today (14 with a lure). The walk adds one position lookup a sprite (an array index and a multiply). Fades add one alpha. Expect no more than today's cost; this is not measured, because the board draw needs a browser and the machine runs no dev server for this node.
- **Roaming.** A flood fill of at most 81 cells (about 20 microseconds, memoised per chunk key, hour, home and habitat) and a path search of at most 81 cells once per pokemon per 5 s epoch. About 2 searches a second on the board. Negligible.
- **Server.** A meeting is one cycle lookup, one roll and one position, about 0.05 ms, and drops the `snapshot_spawns` select and the `resolveSnapshot` select.

### Density on the board

The circle of 10.5 cells has 346 cells, 1.35 chunk areas. Expected pokemon standing in it:

| K | Ordinary | With a lure (+3 slots) |
| --- | --- | --- |
| Today (8 always standing) | 10.8 | 14.9 |
| 8 (decided) | 7.9 | 10.8 |
| 6 (earlier start) | 5.9 | 8.8 |
| 11 | 10.8 | 13.7 |

The brief's 54 against 72 counts the 9 loaded chunks at full strength. What a player sees is the circle, and the live fraction of 0.727 makes K = 8 about 27 percent thinner than today (7.9 against 10.8) with a board that turns over. The hourly rare rate does not depend on K.

## Decided rules from the open questions

Settled by the maintainer on 2026-11-03.

1. **K.** 8 ordinary slots per chunk. Slot indices: ordinary 0 to 7, lure 8 to 10, rare 11. `checkSpawnCount(SLOT_COUNT)` then returns the same counts as today (8, 11, 5, 6).
2. **Rare channel.** The dedicated rare slot stays, at `RARE_ODDS_SCALE` 8, which keeps today's hourly rate.
3. **Stored window.** `snapshot_spawns` keeps being written until the derived server check is proved. Dropping the table is a follow-up the build node notes.
4. **Server function shape.** `meetSpawn` follows `server-function-order` and its build guard. `spawn-lifetimes` ships the check with a start-cell position, `spawn-roaming` changes only `positionAt`.
5. **Clock.** The 1 s allowance stands. The client uses the offset `src/auth/clock.ts` already keeps. If a path is found that does not go through `localNow`, the build adds the offset there.
6. **Pool timing.** A cycle rolls its pool once, at its start, from the time of day and weather at that moment, and keeps it until it ends, even across a change of period.
7. **Caves.** Caves use the same slots with the cave pool (`getSpawnPool` already takes the depth).
8. **Roaming.** Roamers may share a cell and may use terrace ramps a player can walk (`canStep`). The chunk clip stays.
9. **Teaser and tests.** `world-scene.tsx` moves to `liveSpawns` at a fixed time, and tests that build spawn ids from window indices move to cycle starts. Both are tasks of `spawn-lifetimes`.

## Changes

- v1: interface and constants written by `spawn-life-design`. K set to 8 and the open questions closed by the maintainer.
