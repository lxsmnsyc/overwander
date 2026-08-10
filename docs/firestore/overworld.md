# Shared overworld stores

These are the synchronization surface: every player observing a chunk must
derive the same spawns, so the rolls are published once and read by everyone.

## `snapshots/{chunkSeed}:{zone}`

Written by `resolveSnapshotWindow` in
[`src/auth/snapshots.ts`](../../src/auth/snapshots.ts), inside a transaction.

| Field       | Type     | Notes                                                     |
| ----------- | -------- | --------------------------------------------------------- |
| `seed`      | `string` | The chunk seed, matching the first half of the id         |
| `offset`    | `number` | Minutes east of UTC the window was read in                |
| `timestamp` | `number` | The 5-minute **local** window, floored to `SNAPSHOT_INTERVAL` |

Whoever finds the record missing or expired writes the new window and is told
they refreshed it; everyone else **in the same zone** adopts the stored
timestamp. The instant used to judge expiry comes from the
[server clock](time.md#clock), never the device — only the zone it is read in
is the player's.

The zone is part of the key because the window is local: a chunk is not one
world seen from several clocks but one per zone. See
[Local time](time.md#local-time).

## `spawns/{chunkSeed}{zone}@{timestamp}#{index}`

Written by `publishSpawns`, deleted by `clearStaleSpawns` when a window rolls
over.

| Field             | Type      | Notes                        |
| ----------------- | --------- | ---------------------------- |
| `chunk`           | `string`  | Chunk seed                   |
| `offset`          | `number`  | Minutes east of UTC          |
| `timestamp`       | `number`  | Local snapshot window        |
| `species`         | `Species` |                              |
| `individualValue` | `number`  |                              |
| `traitValue`      | `number`  |                              |

A window publishes `SPAWN_COUNT` (6) spawns plus `LURE_SPAWN_BONUS` (2) more:
the extras are rolled for every chunk so that all its visitors share one set of
rolls, and a **lure** buddy — Arena Trap, Illuminate or No Guard — decides who
can see them rather than whether they exist. A player without one neither sees
the last two on the map nor may meet them: `meetSpawn` reads the index off the
spawn id and refuses anything past `visibleSpawnCount`.

The id is deterministic, so concurrent publishers write identical documents
rather than duplicates. `listSpawns` queries `chunk`, `offset` and `timestamp`
together, which **requires a composite index** on `(chunk, offset, timestamp)`.
`clearStaleSpawns` queries `chunk` and `offset` — it clears its own zone's
stale windows and leaves every other zone's alone, since those turn over on
their own clocks.

## `encounters/{spawnId}:{uid}`

Written by `startEncounter`: the per-player view of a shared spawn (shininess,
gender, ability, nature, moves, …) derived once and reused afterwards.

Holds every field of `Encounter` plus `spawn` (the spawn document id) and
`player` (the uid). Only the named player may read or write it.

The buddy at the player's side shapes this document, the way a party leader
shapes a wild encounter in the mainline. The overworld asks for each of these
through an event engine of its own
([`src/overworld/core.ts`](../../src/overworld/core.ts)), built the same way the
battle engine is: every field ability and held-item effect is written once, in
[`src/overworld/abilities/gen-1.ts`](../../src/overworld/abilities/gen-1.ts) or
[`src/overworld/items/key-items.ts`](../../src/overworld/items/key-items.ts), and
registers itself against the questions it has an opinion about. Nothing that
stages a spawn or an encounter names an ability. **Synchronize** passes its own
nature on half the time, and **Cute Charm** brings out the opposite gender two
draws in three; a buddy holding the **Shiny Charm** lifts the odds eightfold.
Each rolls on a stream seeded by the spawn id and the uid, so the client shows
the player exactly what the server will stage, and two players on one cell get
their own.

What a chunk holds is the same for everyone standing in it: no field effect
changes which species turned up, only how many of them a player can see.

Two fields are worth calling out. `shiny` is a resonance between the trainer id
and the **trait** value, so shininess is independent of the IVs a pokemon
rolled and the same spawn can sparkle for one player and not another. The odds
are multiplied by the species day (×8 for the featured family) and by the Shiny
Charm (×8) when the player's buddy is holding it — `startEncounter` checks
`buddies/{uid}` and that catch's held items before deriving. `shadow`
marks a shadow raid's reward: `recordCatch` then writes `Abilities.Shadow` into
the catch's `abilities` alongside the rolled one, so it keeps it for good.

A raid reward derived on its family's own day floors every IV at
`RAID_FAMILY_DAY_MIN_IV` (6); rolls above the floor are left alone. Its level is
fixed rather than rolled — `LEGENDARY_RAID_REWARD_LEVEL` (50) or
`SHADOW_RAID_REWARD_LEVEL` (25) — so clearing the same kind of raid is worth the
same to everyone, and the level-up moves follow that level.

## `cacheClaims/{chunkSeed}@{timestamp}${cell}:{uid}`

Written by `claimItemCache` inside a transaction; its existence is the claim
marker that stops a player collecting the same cache twice in one window.

| Field    | Type     | Notes                     |
| -------- | -------- | ------------------------- |
| `player` | `string` | Claiming uid              |
| `item`   | `Items`  | The item that was granted |

Claims are never updated or deleted — an expired window simply produces a new
document id. Only the named player may create one.

## `berryClaims/{chunkSeed}@{timestamp}$berry{cell}:{uid}`

Written by `claimBerryPatch`, the same one-claim-per-window marker as an item
cache. A berry patch fruits on the 5-minute snapshot window: picked or not, the
next window grows something new.

| Field    | Type     | Notes                     |
| -------- | -------- | ------------------------- |
| `player` | `string` | Claiming uid              |
| `item`   | `Items`  | The berry that was picked |

What grows comes from the berry pool in
[`src/data/overworld/berry-pool.ts`](../../src/data/overworld/berry-pool.ts),
rolled on the same rarity bands as a spawn pool — the single-status cures are
everyday finds, the restoring berries scarcer, Lum rare and Sitrus one-per-world
class.

## `grottoClaims/{chunkSeed}@{timestamp}$grotto{cell}:{uid}`

Written by `claimHiddenGrotto`, the same one-claim-per-window marker as an item
cache.

| Field    | Type      | Notes        |                                         |
| -------- | --------- | ------------ | --------------------------------------- |
| `player` | `string`  | Claiming uid |                                         |
| `kind`   | `'item' \ | 'pokemon'`   | Which branch of the grotto reward fired |

An item reward lands in the inventory as part of the claim. A pokemon reward
comes back as a spawn tuple whose two rolls derive from
`{seed}{timestamp}grotto{cell}spawn`, so every observer of that grotto meets the
same individual; the caller passes it to `startEncounter` under the id
`{chunkSeed}@{timestamp}$grotto{cell}`, which has no `spawns` document behind it.

## `nestClaims/{chunkSeed}{zone}@{nestTimestamp}$nest{cell}:{uid}`

Written by `claimNest` in
[`src/server/overworld.ts`](../../src/server/overworld.ts), the same
one-claim-per-window marker as an item cache — except that a nest's window is
`NEST_INTERVAL`, a full **local day**. A nest refills at midnight where the
player is standing, so it gives each of them one egg between midnights.

| Field     | Type      | Notes                              |
| --------- | --------- | ---------------------------------- |
| `player`  | `string`  | Claiming uid                       |
| `species` | `Species` | What the nest was holding that day |

The player still has to be standing in the chunk's **live 5-minute window** to
reach it; the day-long window only decides what is lying there and how often.
The claim grants an egg by writing a `caught` document with `egg` set — see
[Eggs](catches.md#eggs) — rather than an inventory item or an encounter.

What a nest holds is drawn from the biome's base, uncommon and rare bands for
that day's time of day and then reduced to the first stage of its line: a nest
holds what hatches, not what it grows into. The special tier is left out
entirely, so no nest ever holds a legendary, and a mythical is still called with
a relic or not at all. The hatchling is guaranteed one move off its line's egg
list, which is the reason to walk the egg at all.

## Derived, never stored

Landmarks, item-cache rewards, berry patches, grotto rewards, the species a nest
is holding, the party a Team
Rocket grunt fields and cell placement are **not** in Firestore. They re-derive from the chunk seed, the zone and the
snapshot window (`src/overworld/chunk.ts`, `src/overworld/chunk-snapshot.ts`),
so two players in the same zone and window compute identical results from the
fields `snapshots/{chunkSeed}:{zone}` does store — and two players in different
zones compute different ones.
