# Shared overworld tables

These tables are the synchronization surface. Every player observing a chunk
must derive the same spawns, so the rolls are published once and read by
everyone.

Three sibling pages carry the rest of the overworld:

- [Overworld claims](world-claims.md): `encounters`, `cache_claims`,
  `berry_claims`, `phenomenon_claims` and `nest_claims`.
- [Towns and wandering NPCs](town-npcs.md): the nine wanderers, portals, how a
  town is named, and the register of towns anybody has found.
- [Cave layers](cave-layers.md): the cave world, its mouths, and how a call
  says which layer it is about.

## Windows

Each part of a chunk turns over on its own clock. Spawns turn over fastest, dug
ground slower, and anything worth making a trip for outlasts the trip. Every
interval is a whole number of `SNAPSHOT_INTERVAL`s, so a landmark never rolls
over halfway through the window a player is standing in.

| Window                | Length     | What it turns over                                                      |
| --------------------- | ---------- | ----------------------------------------------------------------------- |
| `SNAPSHOT_INTERVAL`   | 5 minutes  | The shared window row and its spawns                                    |
| `LANDMARK_INTERVAL`   | 15 minutes | Item stashes and berry patches                                          |
| `PHENOMENON_INTERVAL` | 1 hour     | What is happening over a chunk's open ground, and where                 |
| `WEATHER_INTERVAL`    | 1 hour     | The sky over a chunk                                                    |
| `RAID_INTERVAL`       | 3 hours    | Legendary and shadow raid lobbies                                       |
| `NPC_INTERVAL`        | 3 hours    | Who is at a wandering-NPC cell, and the party a Team Rocket grunt fields |
| `NEST_INTERVAL`       | 12 hours   | The egg lying in a nest                                                 |

All of them derive from the one snapshot the player is standing in
([`src/overworld/chunk-snapshot.ts`](../../src/overworld/chunk-snapshot.ts)).
`timestamp` is floored to the spawn window, and `landmarkTimestamp`,
`phenomenonTimestamp`, `raidTimestamp`, `npcTimestamp` and `nestTimestamp` floor
that again to their own. A Team Rocket stop derives against `npcTimestamp`, like
everything else at a wandering cell.

Every claim marker and lobby id is stamped with the window its landmark actually
runs on. A stash therefore cannot be re-dug three times while the hole is still
empty.

## `snapshots`

Written by `resolveSnapshotWindow` in
[`src/auth/snapshots.ts`](../../src/auth/snapshots.ts), through the
`publish_snapshot` function rather than by a table write. Keyed by
`(chunk_seed, zone)`.

| Column       | Type       | Notes                                                        |
| ------------ | ---------- | ------------------------------------------------------------ |
| `chunk_seed` | `text`     | The chunk this window belongs to                             |
| `zone`       | `text`     | The timezone it was read in                                  |
| `utc_offset` | `smallint` | Minutes east of UTC the window was read in                   |
| `window_at`  | `bigint`   | The 5-minute **local** window, floored to `SNAPSHOT_INTERVAL` |

This is the one client write in the game besides the profile, and the function
is what makes it safe. It refuses a window older than the stored one, and swaps
the spawn rows in the same statement. Whoever finds the row missing or expired
writes the new window and is told they refreshed it. Everyone else **in the same
zone** adopts the stored timestamp. The instant used to judge expiry comes from
the [server clock](time.md#clock), never the device. Only the zone it is read in
is the player's.

The zone is part of the key because the window is local. A chunk is not one
world seen from several clocks, it is one window per zone. See
[Local time](time.md#local-time).

## `snapshot_spawns`

A spawn is rolled with its window, replaced with it, and never read without it.
So the rows hang off the snapshot by foreign key, cascade with it, and carry
their roll order in `idx`.

| Column               | Type       | Notes                       |
| -------------------- | ---------- | --------------------------- |
| `chunk_seed`, `zone` | `text`     | The snapshot they belong to |
| `idx`                | `smallint` | Roll order, from zero       |
| `species`            | `integer`  |                             |
| `individual_value`   | `integer`  |                             |
| `trait_value`        | `integer`  |                             |

Where a spawn stands is not stored. The cells are re-derived from the same seed
and window by `getSpawnCells`, so the nth roll is the nth placed cell on every
screen. Its **name** is derived too, `{chunkSeed}:{zone}@{timestamp}#{index}`
from `spawnId`, which is what an encounter row is keyed by. Nothing has to keep
a row alive just to give a spawn a name.

Publishing is therefore one call. A window that rolls over replaces its own
spawns inside it, so there is nothing stale to sweep up.

A window publishes `SPAWN_COUNT` (8) spawns plus `LURE_SPAWN_BONUS` (3) more.
The extras are rolled for every chunk so that all its visitors share one set of
rolls. A **lure** buddy (Arena Trap, Illuminate or No Guard) decides who can see
them rather than whether they exist. A player without one neither sees the last
three on the map nor may meet them: `meetSpawn` compares the index off the spawn
id against `checkSpawnCount(SPAWN_COUNT)` and refuses anything past it.

Two held items answer the same question the other way. A **Pure Incense** and a
**Cleanse Tag** each take 3 off what their holder can see, floored at nothing.

`meetSpawn` also checks the whole name against the live window before it reads
the roll. A spawn from a window that has turned over, or from another chunk, is
not standing there to be met.

## Derived, never stored

Landmarks, item-cache rewards, berry patches, phenomena, the species a nest is
holding, the party a Team Rocket grunt fields and cell placement are **not** in
the database. They re-derive from the chunk seed, the zone and the snapshot
window (`src/overworld/chunk.ts`, `src/overworld/chunk-snapshot.ts`). Two
players in the same zone and window compute identical results from the little
`snapshots` does store, and two players in different zones compute different
ones.

### Reaching, not treading

Nothing triggers by being walked over. A player steps within the 3x3 around a
pokemon or a landmark and **clicks** it. Passing through a cell springs nothing.

That is a client rule. A player's position _is_ stored
([`positions`](player-stores.md#positions)), but it is their own report of
themselves, written every second and a half rather than every step. There is no
path in it, and nothing checks a claim against it. What the server checks is
that the cell really holds the thing, in a live window, which is what keeps a
claim honest. Reach decides what a player _bothers_ to walk to, not what they
are allowed to claim.

Placement leaves room to walk. Every **fixture**, scenery and landmarks alike,
keeps the ring of cells around it clear, diagonals included, so no two of them
touch. Spawns are exempt: `getSpawns` skips the decoration and landmark
**cells** and nothing more, and keeps no ring of its own. The walk's `passable`
test blocks both fixtures and neither spawn, so a tree is walked round and a
pokemon is walked through.

They are placed in order, decorations then landmarks then spawns, into the
central 14x14, which leaves a clear cell all the way round the chunk. The first
two are fixed to the chunk seed forever and only the spawns roll again each
window, so the fixed cells are taken first and the spawns fit into what is left.
A chunk rolls **eight to twelve** decorations and as many landmarks, and each
placement costs up to nine cells, so a crowded roll can run out of room. Every
loop stops early when it does, taking fewer rather than crowding them.

## See also

- [Overworld claims](world-claims.md)
- [Towns and wandering NPCs](town-npcs.md)
- [Cave layers](cave-layers.md)
