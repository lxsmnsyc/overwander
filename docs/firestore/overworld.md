# Shared overworld stores

These are the synchronization surface: every player observing a chunk must
derive the same spawns, so the rolls are published once and read by everyone.

## Windows

Nothing in a chunk turns over on one clock. A window is as long as what it holds
is worth: the pokemon a player walks past are the fastest thing in the world, the
ground they dig up is slower, and anything worth making a trip for outlives the
trip. Every interval is a whole number of `SNAPSHOT_INTERVAL`s, so a landmark
never rolls over halfway through the window a player is standing in.

| Window               | Length     | What it turns over                          |
| -------------------- | ---------- | ------------------------------------------- |
| `SNAPSHOT_INTERVAL`  | 5 minutes  | The shared window document and its spawns   |
| `LANDMARK_INTERVAL`  | 15 minutes | Item stashes, berry patches, hidden grottos |
| `RAID_INTERVAL`      | 3 hours    | Legendary and shadow raid lobbies           |
| `ROCKET_INTERVAL`    | 3 hours    | Team Rocket stops                           |
| `NPC_INTERVAL`       | 6 hours    | Who is standing at a wandering-NPC cell     |
| `NEST_INTERVAL`      | 12 hours   | The egg lying in a nest                     |

All six are derived from the one snapshot the player is standing in
([`src/overworld/chunk-snapshot.ts`](../../src/overworld/chunk-snapshot.ts)):
`timestamp` is floored to the spawn window, and `landmarkTimestamp`,
`raidTimestamp`, `rocketTimestamp`, `npcTimestamp` and `nestTimestamp` floor that
again to their own. Every claim marker and lobby id is stamped with the window
its landmark actually runs on, so a stash cannot be re-dug three times while the
hole is still empty.

## `snapshots/{chunkSeed}:{zone}`

Written by `resolveSnapshotWindow` in
[`src/auth/snapshots.ts`](../../src/auth/snapshots.ts), inside a transaction.

| Field       | Type     | Notes                                                         |
| ----------- | -------- | ------------------------------------------------------------- |
| `seed`      | `string` | The chunk seed, matching the first half of the id             |
| `offset`    | `number` | Minutes east of UTC the window was read in                    |
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
`player` (the uid). Its `flags` and packed `ivs` are the same shapes the catch
record stores — see [Packed fields](catches.md#packed-fields) — so recording a
catch copies them across rather than converting them. Only the named player may read or write it.

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

Two of the encounter's flags are worth calling out. **Shiny** is a resonance
between the trainer id and the **trait** value, so shininess is independent of
the IVs a pokemon rolled and the same spawn can sparkle for one player and not
another. The odds
are multiplied by the species day (×8 for the featured family) and by the Shiny
Charm (×8) when the player's buddy is holding it — `startEncounter` checks
`buddies/{uid}` and that catch's held items before deriving. **Shadow**
marks a shadow raid's reward: `recordCatch` then writes `Abilities.Shadow` into
the catch's `abilities` alongside the rolled one, so it keeps it for good.

A raid reward derived on its family's own day floors every IV at
`RAID_FAMILY_DAY_MIN_IV` (6); rolls above the floor are left alone. Its level is
fixed rather than rolled — `LEGENDARY_RAID_REWARD_LEVEL` (50) or
`SHADOW_RAID_REWARD_LEVEL` (25) — so clearing the same kind of raid is worth the
same to everyone, and the level-up moves follow that level.

## `cacheClaims/{chunkSeed}@{landmarkTimestamp}${cell}:{uid}`

Written by `claimItemCache` inside a transaction; its existence is the claim
marker that stops a player collecting the same cache twice in one window.

| Field    | Type          | Notes                                |
| -------- | ------------- | ------------------------------------ |
| `player` | `string`      | Claiming uid                         |
| `items`  | `ItemStack[]` | The whole stash: `{ item, amount }`  |

A cache holds a **stash**, not an item. `pickItems` reads the band roll as a
_ceiling_ rather than a choice: it is the best thing in the stash, and one kind
of it is guaranteed. How many kinds is a separate draw (up to `MAX_KINDS`, 3),
and every kind after the first rolls its own band on the same odds, clamped to
that ceiling — so a stash may hold two rares and a base, or three commons, or one
of each. Rarity and count are independent, which is what stops a good dig from
being the same three slots every time. Each kind carries up to `MAX_STACK` (3)
pieces, on a draw of its own; two kinds landing on the same item merge into one
stack that still never exceeds `MAX_STACK`.

A special is a ceiling like any other band, so a stash may well be a Master Ball
and two stones. Two things it may never be: **two specials** — only the opening
draw reaches that band, and every kind after it is clamped to rare at best — and
more than one piece of a special, since a Master Ball found three at a time
would stop being a Master Ball.

The whole stash is granted stack by stack and recorded on the marker, so what a
cache paid is readable afterwards rather than only that it paid.

Claims are never updated or deleted — an expired window simply produces a new
document id. Only the named player may create one.

## `berryClaims/{chunkSeed}@{landmarkTimestamp}$berry{cell}:{uid}`

Written by `claimBerryPatch`, the same one-claim-per-window marker as an item
cache. A berry patch fruits on the 15-minute landmark window: picked or not, the
next window grows something new.

| Field    | Type     | Notes                              |
| -------- | -------- | ---------------------------------- |
| `player` | `string` | Claiming uid                       |
| `item`   | `Items`  | The berry that was picked          |
| `amount` | `number` | How many came off the bush         |

What grows comes from the berry pool in
[`src/data/overworld/berry-pool.ts`](../../src/data/overworld/berry-pool.ts),
rolled on the same rarity bands as a spawn pool:

| Band     | What grows there                                                              |
| -------- | ----------------------------------------------------------------------------- |
| base     | The five single-status cures                                                  |
| uncommon | Leppa, Oran, Persim, and the five bitter berries that trade health for a risk |
| rare     | Lum, Sitrus, the five that answer a blow, and the eighteen type-resists       |
| special  | The pinch berries, held against the moment the holder is nearly out           |

The eighteen type-resist berries share the rare band the way the plates share
their slot in the item pool — one thin slot each, so digging up the one that
answers what a party is about to walk into stays luck rather than shopping.

A patch is a bush rather than a buried box, so it bears **one kind** and
`MIN_BERRY_PICK`-`MAX_BERRY_PICK` (3-5) pieces of it: the rarity is the
interesting draw and the count is only how good a season it had. That is the
difference from a cache, which rolls several kinds but rarely more than one or
two of each.

## `grottoClaims/{chunkSeed}@{landmarkTimestamp}$grotto{cell}:{uid}`

Written by `claimHiddenGrotto`, the same one-claim-per-window marker as an item
cache.

| Field    | Type      | Notes        |                                         |
| -------- | --------- | ------------ | --------------------------------------- |
| `player` | `string`  | Claiming uid |                                         |
| `kind`   | `'item' \ | 'pokemon'`   | Which branch of the grotto reward fired |

An item reward is a stash, landing in the inventory as part of the claim — the
same `pickItems` roll a cache uses, on the grotto's own bands, which shut the
base tier out, so nothing common is ever in one. A pokemon reward
comes back as a spawn tuple whose two rolls derive from
`{seed}{timestamp}grotto{cell}spawn`, so every observer of that grotto meets the
same individual; the caller passes it to `startEncounter` under the id
`{chunkSeed}@{landmarkTimestamp}$grotto{cell}`, which has no `spawns` document
behind it.

## `nestClaims/{chunkSeed}{zone}@{nestTimestamp}$nest{cell}:{uid}`

Written by `claimNest` in
[`src/server/overworld.ts`](../../src/server/overworld.ts), the same
one-claim-per-window marker as an item cache — except that a nest's window is
`NEST_INTERVAL`, **twelve local hours**. A nest refills at midnight and at noon
where the player is standing, so it gives each of them one egg per half day.

| Field     | Type      | Notes                                 |
| --------- | --------- | ------------------------------------- |
| `player`  | `string`  | Claiming uid                          |
| `species` | `Species` | What the nest was holding that window |

The player still has to be standing in the chunk's **live 5-minute window** to
reach it; the half-day window only decides what is lying there and how often.
The claim grants an egg by writing a `caught` document with `egg` set — see
[Eggs](catches.md#eggs) — rather than an inventory item or an encounter.

What a nest holds is drawn from the biome's base, uncommon and rare bands for
that window's time of day and then reduced to the first stage of its line: a nest
holds what hatches, not what it grows into. The special tier is left out
entirely, so no nest ever holds a legendary, and a mythical is still called with
a relic or not at all. The hatchling is guaranteed one move off its line's egg
list, which is the reason to walk the egg at all.

## Wandering NPCs

A `WanderingNpc` landmark has **no store of its own**. The cell is fixed by the
chunk seed like any landmark, but who is standing on it is drawn afresh every
`NPC_INTERVAL` (6 hours) from `getWanderingNpcs` — twice as long as the raid a
chunk stages, so a raid rolling over changes nothing about who is at the cell. A
player who needs a breeder and finds a daycare lady waits for the afternoon or
walks to another one.

None of them trusts the caller about who they are talking to:
`src/server/npcs.ts` re-derives the chunk, the zone and the window and checks
the NPC standing there **before** doing anything.

**Each of them serves a player once per window.** A marker at
`npcClaims/{npc}{cell}:{uid}`, stamped with the NPC window, records that this
player has been seen; a second ask before the passer-by changes is turned away
whatever they can pay. The marker is per cell, so walking to another wandering
cell finds somebody who has not seen you yet — that walk is what a second egg
costs.

It is taken as late as each call can manage, once the visit is known to be one
that will land: a pair that cannot breed, an egg already ready to hatch, or a
party that needed nothing is refused without spending it. The two that charge
claim the visit *before* taking the gold — a player already seen should not be
charged to be told so — and both the gold and the visit go back if the write
behind them fails.

- **Breeder** — takes two of the player's pokemon and `BREEDING_FEE` gold, and
  writes an egg. Neither parent is consumed, held or locked: they are handed
  back the moment the egg exists. What the pair may produce is decided by
  [`src/overworld/breeding.ts`](../../src/overworld/breeding.ts) from the
  **stored** records: shared egg group, opposite genders (or a Ditto standing in
  for one, but not for two), nothing from the undiscovered group, and no eggs.
  The egg is the first stage of the mother's line — the non-Ditto parent's when
  a Ditto stands in.
- **Daycare Lady** — takes an egg and `DAYCARE_FEE` gold and adds `hatchSteps /
  2` to wherever it already stood (`boostedSteps`), so an egg a quarter of the
  way along comes out three quarters of the way. It is a share of the
  requirement rather than a place on it, which means one past the half-way mark
  is finished by a single boost and any egg is finished by two — the fee is what
  paces it. Only an egg already ready to hatch is refused. `steppedAt` moves
  with the jump, since those steps were not walked and the time they would have
  taken must not be banked for the next report.

- **Nurse Joy** — takes up to `NURSE_CARE_LIMIT` (6) of the player's pokemon and
  charges **nothing**. Every one of them comes back at full health with its
  statuses cleared, and any shadow among them is
  [purified](catches.md#purifying-a-shadow) on the way. What paces her is the
  window alone, since there is no fee to pace her: a party that needed nothing is
  handed straight back without spending the visit.

- **Groomer** — takes one of the player's pokemon and `GROOMING_FEE` gold, and
  hands it back thinking half again as well of them: `groomedFriendship` adds
  half of whatever is *left* to give, the same bargain the daycare lady makes
  with an egg. It is worth a great deal to a pokemon fresh out of a ball and
  almost nothing to one that is already inseparable, and because it is always
  half of the remainder it can never buy the last of a friendship — that part
  is walked for. A pokemon that can gain nothing is refused before anything is
  charged, and an egg is refused outright: what is inside one has not met
  anybody yet.

What a bred egg inherits — and what it does not — is in
[Eggs](catches.md#eggs).

## Portals

A `Portal` landmark is a way through to another one. It does nothing on its own:
opening it takes a **Portal Key**, the rarest band's newest entry, and the key is
**spent in the crossing**.

The traveller names a **biome**, never a destination. Where they come out is the
nearest portal of that biome to the one they are standing in — derived in
[`src/overworld/portal.ts`](../../src/overworld/portal.ts) from the chunk seeds
alone, so the client lists every destination on offer without asking anything of
the server, and the server re-derives the same answer when the crossing is
asked for. There is nothing in the request to lie about except which way to go.

`findPortals` walks outward ring by ring and answers for **every biome at once**:
the first portal of a biome it meets is that biome's nearest, and a biome already
answered for is not looked at again — so a chunk is only rolled for its landmarks
where its biome is still wanted. It stops at `PORTAL_RANGE` (96 chunks) or once
every biome the world grows has been found, whichever comes first. Measured, that
is about 13ms cold from a standing start, and a fraction of that against a warm
biome cache; roughly 24 of the 24 biomes are reachable from a typical portal.

`usePortal` ([`src/server/portals.ts`](../../src/server/portals.ts)) checks that
the cell really is a portal in a live window, derives the far end, and takes the
key **last** — a player refused a destination keeps it. It cannot move anybody:
the game stores no position, so it answers with the chunk and cell and the client
walks through.

## Derived, never stored

Landmarks, item-cache rewards, berry patches, grotto rewards, the species a nest
is holding, the party a Team
Rocket grunt fields and cell placement are **not** in Firestore. They re-derive from the chunk seed, the zone and the
snapshot window (`src/overworld/chunk.ts`, `src/overworld/chunk-snapshot.ts`),
so two players in the same zone and window compute identical results from the
fields `snapshots/{chunkSeed}:{zone}` does store — and two players in different
zones compute different ones.

### Reaching, not treading

Nothing triggers by being walked over. A player steps within the 3x3 around a
pokemon or a landmark and **clicks** it; passing through a cell springs nothing.
That is a client rule. A player's position *is* stored now
([`positions/{uid}`](player-stores.md#positionsuid)), but it is their own report
of themselves, written every second and a half rather than every step — there is
no path in it, and nothing checks a claim against it. What the server does check
is that the cell really holds the thing, in a live window, which is what keeps a
claim honest:
reach decides what a player _bothers_ to walk to, not what they are allowed to
claim.

Placement leaves room to walk. A landmark keeps the ring of cells around it —
diagonals included — clear of everything: no two landmarks touch, and
`getSpawns` skips the whole `getLandmarkArea()` rather than only the landmark
cells, so a pokemon is never standing in the way of one. Placing a landmark
takes up to nine cells of the central 8x8's sixty-four, so the five a chunk may
roll always fit; the loop stops early if a chunk ever does run out, taking fewer
landmarks rather than crowding them.
