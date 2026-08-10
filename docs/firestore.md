# Firestore

Every store the game writes to today, the document shape it holds, the id
scheme that addresses it, and the access each one needs. Reads go through the
Firebase **client** SDK from `src/auth/*`; everything that creates or moves
value is written by the **Admin** SDK from `src/server/*`, behind a verified
caller. The rules below have to hold against a signed-in player writing
directly, which is why most collections are read-only to clients.

There is no `firestore.rules` file in the repository yet; the rules at the end
of this document are the ones the code assumes and should be deployed as-is
before the game is exposed to real players.

## Player-owned stores

### `profiles/{uid}`

Set by [`src/auth/profile.ts`](../src/auth/profile.ts). Created on first sign-in
from whatever the auth provider knows.

| Field      | Type             | Notes                                   |
| ---------- | ---------------- | --------------------------------------- |
| `nickname` | `string`         | Display name; falls back to `"Trainer"` |
| `avatar`   | `string \| null` | Avatar URL, `null` when unset           |
| `gold`     | `number`         | Currency balance; starts at zero        |

Read by anyone (other players see nicknames and avatars). The owner writes
their own `nickname` and `avatar`; `saveProfile` takes only those two and
merges.

The balance is not theirs to write: `grantGold` and `spendGold` live in
[`src/server/profile.ts`](../src/server/profile.ts), each reading and writing
inside a transaction so concurrent rewards cannot clobber each other. The rules
pin `gold` on update and require a new profile to open at zero.

### `inventories/{uid}:{item}`

Read through [`src/auth/inventory.ts`](../src/auth/inventory.ts) and written by
[`src/server/inventory.ts`](../src/server/inventory.ts). One document per user
and item pair, so a grant or a spend touches a single small document and the
same item can never split across two records. Both mutations run inside a
transaction.

| Field    | Type     | Notes                                         |
| -------- | -------- | --------------------------------------------- |
| `user`   | `string` | Owning uid, matching the first half of the id |
| `item`   | `Items`  | Numeric item id from the `Items` enum         |
| `amount` | `number` | How many are carried; never goes below zero   |

Private: only the owning uid may read, and only the server may write.
`getInventory` queries `where('user', '==', uid)` and filters out stacks that
have been spent to zero — those documents stay behind rather than being
deleted.

### `candies/{uid}:{family}`

Read through [`src/auth/candy.ts`](../src/auth/candy.ts), written by
[`src/server/candy.ts`](../src/server/candy.ts). Keyed by evolution family
rather than species, because a candy feeds any catch in its family.

| Field    | Type       | Notes                                         |
| -------- | ---------- | --------------------------------------------- |
| `user`   | `string`   | Owning uid, matching the first half of the id |
| `family` | `Families` | Numeric family id from the `Families` enum    |
| `count`  | `number`   | How many are held; never goes below zero      |

`useCandy(catchId)` spends `getCandyCost(caught)` candies to raise a catch
by a level — one for an ordinary catch, two for a shadow. It reads
the catch and the stack, then writes both **inside one transaction**, so a candy
can never be spent without the level landing. It resolves the new level, or null
when the catch is not the user's, its species' family does not match a stack the
user holds, the stack is empty, or the catch already sits at `MAX_LEVEL`
(`src/data/constants/levels.ts`).

Private: only the owning uid may read the stacks, and only the server may
write them or the catch the level lands on.

### `buddies/{uid}`

Set by [`src/auth/buddy.ts`](../src/auth/buddy.ts). One buddy per player, so the
document id is the uid itself and setting a new buddy replaces the old one.
Overworld item effects and abilities read it to decide what the player's
companion changes; the planned walking feature follows the same record.

| Field    | Type     | Notes                                       |
| -------- | -------- | ------------------------------------------- |
| `player` | `string` | Owning uid, matching the document id        |
| `caught` | `string` | Id of the `caught/{catchId}` being followed |

`setBuddy` reads the catch first and refuses to write when the player does not
own it. Ownership can still lapse afterwards — a trade leaves the buddy record
pointing at someone else's pokemon — so `resolveBuddy` re-checks `owner` on
read and resolves null when it no longer matches. `clearBuddy` deletes the
document rather than blanking the field.

Private to the owning uid.

### `fled/{uid}`

Written by `markFled` in [`src/server/overworld.ts`](../src/server/overworld.ts),
read through [`src/auth/safari.ts`](../src/auth/safari.ts). The key is
recomputed from the stored encounter, so a player cannot retire a meeting they
never had.

| Field  | Type       | Notes                                                      |
| ------ | ---------- | ---------------------------------------------------------- |
| `keys` | `string[]` | Encounter keys the user has scared off; only ever appended |

An encounter key is `` `${x},${y}@${timestamp}:${individualValue}` `` (see
`encounterKey` in [`src/overworld/safari.ts`](../src/overworld/safari.ts)).
Private to the owning uid, and read-only to them.

## Catch records

Written by `recordCatch` in [`src/server/caught.ts`](../src/server/caught.ts). A
catch is **one document** with a Firestore auto-id, so recording one is a single
write. Its abilities, held items and ownership history were once three side
stores keyed by that same id (`caughtAbilities`, `caughtItems`, `caughtOwners`);
they are fields now, which turned showing a pokemon from four reads into one and
removed the three rule blocks that had to `get()` the parent to find an owner.

### `caught/{catchId}`

| Field                  | Type                    | Notes                                                     |
| ---------------------- | ----------------------- | --------------------------------------------------------- |
| `owner`                | `string`                | Current owner's uid; changes on trade                     |
| `type`                 | `EncounterType`         | How it was originally met                                 |
| `species`              | `Species`               |                                                           |
| `level`                | `number`                |                                                           |
| `individualValue`      | `number`                | 32-bit roll the IVs slice from                            |
| `traitValue`           | `number`                | 32-bit roll driving level, gender, ability, nature        |
| `ivs`                  | `Record<Stats, number>` | 0-31 per stat, stored explicitly so records are queryable |
| `gender`               | `Genders`               |                                                           |
| `nature`               | `Natures`               |                                                           |
| `shiny`                | `boolean`               | Frozen at catch time; trades cannot change it             |
| `shadow`               | `boolean`               | From a shadow raid; keeps Shadow, costs double candy      |
| `moves`                | `Moves[]`               |                                                           |
| `abilities`            | `Abilities[]`           | The rolled ability, plus Shadow for a shadow catch        |
| `items`                | `Items[]`               | Held items; starts empty, up to `HELD_ITEM_LIMIT`         |
| `history`              | `OwnershipRecord[]`     | `{ owner, acquiredAt }`, oldest first; trades append      |
| `lock`                 | `boolean`               | Whether it is fielded in a battle right now               |
| `lockedAt`             | `number`                | `startedAt` of the battle holding it; 0 when free         |
| `ball`                 | `Balls`                 | Ball the catch was made with                              |
| `caughtAt`             | `string`                | Local ISO 8601 with offset, e.g. `…+08:00` (see below)    |
| `locale`               | `string`                | The catcher's locale tag, e.g. `en-PH`                    |
| `effortValues`         | `Record<Stats, number>` | Starts at zero across the board                           |
| `origin.timestamp`     | `number`                | Snapshot window the spawn belonged to                     |
| `origin.x`, `origin.y` | `number`                | Chunk coordinates                                         |
| `origin.biome`         | `Biome`                 |                                                           |

Queried by `listCaught` with `where('owner', '==', uid)`, which needs a
single-field index on `owner` — Firestore provides that automatically.

`species` and `level` are the two mutable fields: `useCandy` raises the level,
and `evolveCatch` in [`src/auth/evolution.ts`](../src/auth/evolution.ts) swaps
the species. An evolution that uses an item decrements
`inventories/{uid}:{item}` in the same transaction, so the stone and the new
species land together or not at all. Criteria are re-checked against the stored
documents inside that transaction, never trusted from the caller.

Which evolutions are offered comes from
[`src/data/species/evolution.ts`](../src/data/species/evolution.ts): only the
`Level`, `UsedItem` and `HeldItem` methods can be verified against what is
stored today, so an evolution carrying any other flag — trade, friendship,
weather — is never offered rather than waved through. A held item is required
but not consumed; only a used item is spent.

Catch records are readable by any signed-in player (other players inspect a
pokemon before a trade) and writable only by the owner the document itself
names.

Held items move through `giveItem` and `takeItem` in
[`src/server/caught.ts`](../src/server/caught.ts): each reads the catch and the
inventory stack, then writes the stack and the catch's `items` **in one
transaction**, so an item is never in the bag and on a pokemon at once, nor lost
between them. Only items flagged `Holdable` can be handed over, and a catch
holds at most `HELD_ITEM_LIMIT` (1) — matching the battle's per-unit item limit.
This is the path the Shiny Charm needs: a buddy holding it lifts the shiny odds
of every encounter its owner starts.

### Catches are locked while they fight

A battle runs on a **frozen** snapshot of the party, so a record that moved
underneath it would leave the two describing different pokemon — and the worst
case is not cosmetic: a player who pulls a berry back into the bag mid-raid
would have it eaten in the battle and still be holding it afterwards.

So `startRaid` sets `lock` as it freezes each team, in the **same transaction**
as the snapshot, and every write that edits a catch — `giveItem`, `takeItem`,
`useCandy`, `evolveCatch`, and `joinRaid`, which will not field a pokemon
already fighting elsewhere — refuses while the lock holds. Trading will ask the
same question: a locked pokemon is not up for trade.

`isCatchLocked` ([`src/server/locks.ts`](../src/server/locks.ts)) answers from
the two fields alone, against the server's own clock — no document is fetched.
Two things end a lock:

- **The fight.** `finishBattle` stamps the outcome and then calls
  `releaseBattleLocks`, which frees every catch its team snapshots name.
- **The clock.** A lock is ignored once `BATTLE_TIMEOUT` (10 minutes) has passed
  since `lockedAt`, so a battle nobody ever reports — a closed tab, a party that
  walked out — does not hold pokemon forever. It is the same window that decides
  an abandoned raid may be restaged.

`lockedAt` is the battle's own `startedAt`, which is what keeps the release
honest: it frees only catches whose lock still carries **that** stamp, so a late
report cannot unlock a pokemon that has since been taken by a newer fight.

Because freezing a team locks it, `startRaid` **claims the raid first** and
freezes afterwards — a start that loses the race to another host holds nothing.
A claim whose teams then field nothing leaves the raid pointing at a battle
document that was never written, which reads as lost and restages.

The client asks the same question through `isLockLive`
([`src/auth/battle-lock.ts`](../src/auth/battle-lock.ts)) so the catch dialog
can grey its buttons out and say why; the refusal itself is the server's.

## Shared overworld stores

These are the synchronization surface: every player observing a chunk must
derive the same spawns, so the rolls are published once and read by everyone.

### `snapshots/{chunkSeed}:{zone}`

Written by `resolveSnapshotWindow` in
[`src/auth/snapshots.ts`](../src/auth/snapshots.ts), inside a transaction.

| Field       | Type     | Notes                                                     |
| ----------- | -------- | --------------------------------------------------------- |
| `seed`      | `string` | The chunk seed, matching the first half of the id         |
| `offset`    | `number` | Minutes east of UTC the window was read in                |
| `timestamp` | `number` | The 5-minute **local** window, floored to `SNAPSHOT_INTERVAL` |

Whoever finds the record missing or expired writes the new window and is told
they refreshed it; everyone else **in the same zone** adopts the stored
timestamp. The instant used to judge expiry comes from the server clock (see
below), never the device — only the zone it is read in is the player's.

The zone is part of the key because the window is local: a chunk is not one
world seen from several clocks but one per zone. See
[Local time](#local-time).

### `spawns/{chunkSeed}{zone}@{timestamp}#{index}`

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

### `encounters/{spawnId}:{uid}`

Written by `startEncounter`: the per-player view of a shared spawn (shininess,
gender, ability, nature, moves, …) derived once and reused afterwards.

Holds every field of `Encounter` plus `spawn` (the spawn document id) and
`player` (the uid). Only the named player may read or write it.

The buddy at the player's side shapes this document, the way a party leader
shapes a wild encounter in the mainline. The overworld asks for each of these
through an event engine of its own
([`src/overworld/core.ts`](../src/overworld/core.ts)), built the same way the
battle engine is: every field ability and held-item effect is written once, in
[`src/overworld/abilities/gen-1.ts`](../src/overworld/abilities/gen-1.ts) or
[`src/overworld/items/key-items.ts`](../src/overworld/items/key-items.ts), and
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

### `cacheClaims/{chunkSeed}@{timestamp}${cell}:{uid}`

Written by `claimItemCache` inside a transaction; its existence is the claim
marker that stops a player collecting the same cache twice in one window.

| Field    | Type     | Notes                     |
| -------- | -------- | ------------------------- |
| `player` | `string` | Claiming uid              |
| `item`   | `Items`  | The item that was granted |

Claims are never updated or deleted — an expired window simply produces a new
document id. Only the named player may create one.

### `berryClaims/{chunkSeed}@{timestamp}$berry{cell}:{uid}`

Written by `claimBerryPatch`, the same one-claim-per-window marker as an item
cache. A berry patch fruits on the 5-minute snapshot window: picked or not, the
next window grows something new.

| Field    | Type     | Notes                     |
| -------- | -------- | ------------------------- |
| `player` | `string` | Claiming uid              |
| `item`   | `Items`  | The berry that was picked |

What grows comes from the berry pool in
[`src/data/overworld/berry-pool.ts`](../src/data/overworld/berry-pool.ts),
rolled on the same rarity bands as a spawn pool — the single-status cures are
everyday finds, the restoring berries scarcer, Lum rare and Sitrus one-per-world
class.

### `grottoClaims/{chunkSeed}@{timestamp}$grotto{cell}:{uid}`

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

## Raids and battles

Raids run on their own hour-long clock (`RAID_INTERVAL` in
[`src/overworld/chunk-snapshot.ts`](../src/overworld/chunk-snapshot.ts)) rather
than the 5-minute spawn window, so a lobby stands long enough to gather a party.
There are two landmark kinds:

- **Legendary raids** draw from the chunk biome's special tier for the raid
  hour's time of day, filtered to legendaries — mythicals are never staged.
- **Shadow raids** draw from the biome's rare band, except one draw in eight
  (`SHADOW_RAID_LEGENDARY_CHANCE`) which reaches the legendary pool instead.
  Their boss carries the `Shadow` ability alongside `Boss`.

A third landmark runs on the same hour without being a raid at all: the **Team
Rocket Stop**, a solo trainer fight described under
[`rocketStops`](#rocketstopsstopiduid).

### `raids/{chunkSeed}@{raidTimestamp}${kind}{cell}`

Written by `enterRaid` in [`src/auth/raids.ts`](../src/auth/raids.ts). The id is
derived, so every player who walks onto the landmark in the same hour joins the
lobby that is already standing; the first to arrive hosts it. The kind tag is
`raid` for a legendary raid and `shadow` for a shadow one, so the two landmark
types never collide on a cell. The read and the create share a transaction, so
one landmark stages exactly one raid per hour even when two players walk in
together — a player either opens the lobby or joins the one already there.

| Field        | Type             | Notes                                                       |
| ------------ | ---------------- | ----------------------------------------------------------- |
| `kind`       | `RaidKind`       | Legendary (0) or Shadow (1)                                 |
| `species`    | `Species`        | What is being staged                                        |
| `traitValue` | `number`         | 32-bit roll the boss' nature and ability derive from        |
| `host`       | `string`         | Only this uid may start the raid                            |
| `teams`      | `string[]`       | `teams/{teamId}` ids, appended via `arrayUnion`             |
| `battle`     | `string \| null` | The battle the host started, null while gathering           |
| `timestamp`  | `number`         | The **local** raid hour, for listing the live lobbies        |
| `offset`     | `number`         | Minutes east of UTC the hour was read in                    |
| `chunk`      | `{ seed, x, y }` | Where the lobby stands, for a listing with no chunk in hand |
| `cell`       | `number`         | The landmark cell                                           |
| `cleared`    | `boolean`        | Set when the boss goes down                                 |

`joinRaid` writes the party as its own team document and appends only the id, so
two players joining at once cannot overwrite each other. `startRaid` writes
`battle` inside a transaction, so a second start finds it taken.

A raid is fought with pokemon of one's own, so `canJoinRaids(uid)` —
`hasAnyCaught` in [`src/auth/caught.ts`](../src/auth/caught.ts), a single
`limit(1)` read — gates taking part. A player who owns nothing neither opens a
lobby nor restages a failed one (`enterRaid` resolves the standing lobby, or
null when there is none) and `joinRaid` refuses their team. They may still watch:
walking in on a running raid opens it as a replay, which settles nothing and
pays nothing. Hosting counts as taking part — an empty lobby nobody can start is
worse than no lobby.

`listLiveRaids(raidTimestamp, offset)` queries `timestamp` and `offset` together
— **a composite index** — and keeps the lobbies that are neither started nor
cleared; that is the Raids tab. Both are needed: the hour is local, so two zones
can floor to the same one, and what they stage at a landmark is not the same
boss. The lobby id carries the zone for the same reason.

The hour gives the boss one defeat, not one fight:

- **Cleared.** `clearRaid` sets `cleared` when the boss goes down, and the
  landmark shuts: `enterRaid` resolves null for the rest of the hour, and the
  next hour rolls a new raid at the same cell.
- **Lost.** `enterRaid` reads the lobby's battle in the same transaction. A
  battle recorded as `Lost`, one whose document is gone, or one still
  `Unfinished` more than `RAID_BATTLE_TIMEOUT` (10 minutes) after its
  `startedAt` counts as failed — an abandoned party is not a beaten boss. The
  arrival restages the lobby in place: same id, same `species` and `traitValue`,
  a new host, no teams and no battle. It reappears in the live listing on its
  own, since the watcher keeps whatever has `battle == null`.
- **Under way.** A battle that is neither won nor timed out is what the arrival
  walks into, and walking in on a running raid is spectating it.

Restaging keeps the id, so `raidRewards/{raidId}:{uid}` still pays each player
once: a claim is checked against the raid's _current_ battle, which only a
winning party appears in.

### `teams/{teamId}`

| Field     | Type       | Notes                                        |
| --------- | ---------- | -------------------------------------------- |
| `player`  | `string`   | Owning uid                                   |
| `raid`    | `string`   | The `raids/{raidId}` it was brought to       |
| `catches` | `string[]` | Up to `TEAM_SIZE` (6) `caught/{catchId}` ids |

A team holds ids, so it follows whatever those catches become — until a battle
freezes them.

Catch ids are readable by any signed-in player, so a submitted party cannot be
trusted on its word. `joinRaid` in
[`src/server/raids.ts`](../src/server/raids.ts) rejects one that repeats a catch
or names a catch the player does not own — and the rules make `teams`
server-only, so there is no way around that check. Ownership is still
re-checked where it matters: freezing a team leaves out any catch
whose `owner` no longer matches `team.player` — which also covers a catch traded
away between joining the lobby and the host starting the raid — and resolves
null when nothing survives, so `startRaid` drops that team rather than fielding
an empty side, and its player is not listed among the battle's `players`.

**One pokemon, one fight.** A catch cannot be brought to a raid while it is
already committed elsewhere, and that is checked in three places:

- `joinRaid` refuses a party holding a **locked** catch — one in a live battle.
- `joinRaid` also refuses one already **queued**: `isAnyCatchQueued` reads the
  player's own teams (`player ==` uid, `catches array-contains-any` the party)
  and blocks when any of them is still listed by a raid that has not started.
  This is why a team names its `raid` — without it, answering would mean reading
  every lobby in the world. Teams of raids that started, were cleared, or were
  left behind do not count.
- Freezing drops a catch that is locked by the time the host starts, so a player
  sitting in two lobbies with the same party has it fielded by whichever raid
  started first and simply left out of the other.

The team picker greys out anything it can see is fighting (`isLockLive`, from
the two lock fields it already has), so the refusal is usually visible before
the join is attempted.

### `teamSnapshots/{snapshotId}`

| Field      | Type              | Notes                                        |
| ---------- | ----------------- | -------------------------------------------- |
| `player`   | `string`          | Owning uid; empty for the raid boss          |
| `alliance` | `number`          | Teams sharing a number fight side by side    |
| `catches`  | `CatchSnapshot[]` | The party frozen as it stood at battle start |

A **catch snapshot** ([`src/auth/catch-snapshot.ts`](../src/auth/catch-snapshot.ts))
copies `caught` (the source id), `species`, `level`, `ivs`, `effortValues`,
`nature`, `gender`, `height`, `weight`, `shiny`, `moves`, `abilities` and
`items`. It is never rewritten: levelling, evolving or handing an item over
mid-raid must not change units already fighting.

`height` and `weight` are the individual's own, not the species' listed ones.
They are **not** stored on `caught/{catchId}`: `deriveSize(species, traitValue)`
in [`src/overworld/encounter.ts`](../src/overworld/encounter.ts) reads them off
the trait value against the species as it stands, so evolving grows the pokemon
while keeping its place in the band. The snapshot freezes the result at battle
start, and the battle unit carries it through `setHeight` / `setWeight`.

The raid boss gets a snapshot of its own — perfect (31) IVs, zero effort values,
no held items, level `RAID_BOSS_LEVEL`, with nature and ability derived from the
raid's `traitValue` and an empty `caught` id. Its abilities are `Boss` plus the
rolled one, and a shadow boss carries `Shadow` between them. It fights alone
under `BOSS_ALLIANCE`; every player team shares `PLAYER_ALLIANCE`.

### `battles/{battleId}`

| Field       | Type            | Notes                                        |
| ----------- | --------------- | -------------------------------------------- |
| `teams`     | `string[]`      | `teamSnapshots/{snapshotId}` ids, boss first |
| `players`   | `string[]`      | Every uid that fielded a team                |
| `raid`      | `string`        | The raid it was fought for; empty for PvP    |
| `species`   | `Species`       | What was fought, so a listing can name it    |
| `outcome`   | `BattleOutcome` | Unfinished (0), Won (1), Lost (2)            |
| `startedAt` | `number`        | Server-clock milliseconds                    |

The document id doubles as the battle's RNG seed, so every participant and
spectator replays the same rolls from the same frozen teams.

`finishBattle` stamps the outcome once the fight settles; every participant
computes the same one, since the fight is deterministic. The profile's battle
history queries `where('players', 'array-contains', uid)` and drops anything
still `Unfinished` — an abandoned fight is not a result. Replaying a history
entry rebuilds the battle from that seed and those snapshots, so it plays out
identically and awards nothing.

### `battleConsumptions/{battleId}:{uid}`

| Field    | Type     | Notes                  |
| -------- | -------- | ---------------------- |
| `player` | `string` | The uid billed         |
| `battle` | `string` | The battle it paid for |

An item a unit spends in battle is spent for good: a berry eaten in a raid comes
off the catch record when the fight ends, the way it does in the mainline games.
Every removal during the battle is remembered on the unit (`Unit.consumed`), and
`consumeHeldItems(battleId, consumed)` reports what the player's **own** party
lost — the outcome is stamped once by whoever sees the fight settle, but the
items come off per player, since nobody else's catches are theirs to empty.

The server checks the report against the team snapshots it froze itself: an item
that was not fielded by that catch cannot be stripped, and a catch that has
changed hands since is left alone. The marker above bills each player once per
battle, so a repeated report takes nothing further. It applies whichever way the
fight went — a berry eaten against a boss that survived is still eaten — and a
replay reports nothing at all.

The bill is settled **before** the outcome is stamped: the catches are locked
while the battle is live (see above), and stamping the outcome is what frees
them, so reporting afterwards would leave a window in which a berry could be
pulled back into the bag and kept.

### `rocketStops/{stopId}:{uid}`

A **Team Rocket Stop** is a landmark that stands a grunt on a cell for the raid
hour. Unlike a raid it is not a lobby: the grunt fights each passer-by on their
own, so the state is **per player** and one player's victory closes nothing for
anybody else.

The stop id is `{chunkSeed}{zone}@{raidTimestamp}$rocket{cell}` and the document
appends the uid.

| Field       | Type              | Notes                                                     |
| ----------- | ----------------- | --------------------------------------------------------- |
| `player`    | `string`          | The uid this state belongs to                             |
| `party`     | `RocketPokemon[]` | `{ species, individualValue, traitValue }`, weakest first |
| `battle`    | `string \| null`  | The fight under way, or the last one fought               |
| `timestamp` | `number`          | The local raid hour                                       |
| `offset`    | `number`          | Minutes east of UTC                                       |
| `chunk`     | `{ seed, x, y }`  | Where the stop stands                                     |
| `cell`      | `number`          | The landmark cell                                         |
| `defeated`  | `boolean`         | Set when the grunt goes down                              |

`enterRocketStop` rolls the party from the chunk itself — one from the biome's
**base**, **uncommon** and **rare** bands for the hour, each with its own
individual and trait values, and a band the hour leaves empty borrows from the
commonest one that is not. The record is written on first approach.

`startRocketBattle` freezes the player's party exactly as `startRaid` does —
same snapshot, same lock, same refusal of a pokemon already fighting or waiting
in a lobby — freezes the grunt's three beside it at `ROCKET_PARTY_LEVEL` (50),
all shadowed, and writes a battle whose `raid` is empty. It is an ordinary
trainer battle: `BattleModes.PvP`, and **no side is flagged as a boss**, so a
mutual knockout is a draw rather than a win.

The party is stored rather than re-derived because Firestore holds no array of
arrays, and because a party frozen at the fight should stay what it was.

The prize is recorded as **`EncounterType.Rocket`**: a grunt is fought alone,
pays a fixed low-level commoner and hands over a shadow, so a catch record that
called it a raid prize would be saying the wrong thing about where it came from.
See [Encounter kinds](#encounter-kinds).

Losing changes nothing: the grunt is still standing, and the stop can be fought
again until the hour turns over. Winning is what closes it —
`claimRocketReward` pays `ROCKET_STOP_GOLD` (500) and stages one of the grunt's
two **commoner** species as an encounter (the rare one is never handed over),
shadowed, at a fixed `ROCKET_REWARD_LEVEL` (10) — so the same grunt is worth the
same to everyone who put them down, and what is handed over is a commoner taken
off a thief rather than anything like the level-50 party it came from. The `defeated` flag is
both the record of the win and the marker guarding it: it is set inside a
transaction, and only the call that sets it pays.

### `raidRewards/{raidId}:{uid}`

| Field    | Type     | Notes                   |
| -------- | -------- | ----------------------- |
| `player` | `string` | Claiming uid            |
| `raid`   | `string` | The raid collected from |
| `gold`   | `number` | The purse it paid       |

`claimRaidReward(raidId)` hands over what a cleared raid owes: the legendary,
and a purse of gold — `LEGENDARY_RAID_GOLD` (2000), or `SHADOW_RAID_GOLD`
(1000) for the commoner of the two. Every fighter is paid the same; the boss
decides the amount, not who landed the last hit. It refuses unless the battle
was **won** and the uid appears in `battles/{battleId}.players`, and the marker
above guards both halves, so neither the gold nor the pokemon is collected
twice. The reward waits rather than expiring: a player who ran from the
encounter or left the battle early claims it later from their battle history.

The encounter itself is not stored as a reward — `deriveRaidReward` rolls a
spawn tuple from the raid id and the player's uid, and the encounter is derived
against the **raid's own** chunk and window (not wherever the player is
standing), so a late claim meets exactly what the raid staged. It lands through
the usual `encounters/{spawnId}:{uid}` path with `EncounterType.Raid`.

A raid already under way cannot be joined: `joinRaid` refuses once `battle` is
set, and a player who walks onto the landmark then is sent into the battle as a
**replay** — they watch the same deterministic fight, settle nothing, and are
owed nothing.

## Encounter kinds

`EncounterType` ([`src/overworld/encounter.ts`](../src/overworld/encounter.ts))
is stored on both the encounter and the catch it becomes, and every way of
meeting a pokemon is its own kind — a record should say where it actually came
from:

| Kind             | Id  | Shown as         | Where it comes from                       |
| ---------------- | --- | ---------------- | ----------------------------------------- |
| `Wild`           | 0   | Wild             | A chunk snapshot's spawns                 |
| `Hatched`        | 1   | Hatched          | An egg                                    |
| `LegendaryRaid`  | 2   | Legendary Raid   | A cleared legendary raid                  |
| `Fateful`        | 3   | Event            | An event or mystery gift                  |
| `Rocket`         | 4   | Team Rocket      | A beaten Team Rocket grunt                |
| `ShadowRaid`     | 5   | Shadow Raid      | A cleared shadow raid                     |

The two raids are kept apart because they are not the same prize: a legendary
raid stages a legendary and hands it over at level 50, while a shadow raid
usually stages one of the biome's **rare** species, hands it over at 25, and its
catch keeps the `Shadow` ability for good. Where the two are alike —
the species-day IV floor (`RAID_FAMILY_DAY_MIN_IV`), and a prize that never
bolts from a safari throw — `isRaidEncounter` covers both, so nothing has to
list them separately to treat them the same.

`ENCOUNTER_TYPE_NAMES` is what the catch dialog's **Met** row shows.

> Records written before the split carry `type: 2`, which now reads as
> *Legendary Raid*. A catch that actually came from a shadow raid can be told by
> its `shadow: true`, so a backfill is possible if the distinction matters
> retroactively.

## Derived, never stored

Landmarks, item-cache rewards, berry patches, grotto rewards, the party a Team
Rocket grunt fields and cell placement are **not** in Firestore. They re-derive from the chunk seed, the zone and the
snapshot window (`src/overworld/chunk.ts`, `src/overworld/chunk-snapshot.ts`),
so two players in the same zone and window compute identical results from the
fields `snapshots/{chunkSeed}:{zone}` does store — and two players in different
zones compute different ones.

## Clock

Anything time-bound reads the server clock through
[`src/auth/clock.ts`](../src/auth/clock.ts) rather than `Date.now()`: a
`'use server'` function returns the server's time, the client measures the
offset once and derives locally for the next minute.

Timestamps are epoch milliseconds and carry no timezone. The server pins its
process to **UTC** ([`src/server/timezone.ts`](../src/server/timezone.ts)), so
two deploys on differently-configured machines agree about what instant it is.
A skewed device cannot shift the instants it is given, only how they are read.

## Local time

Which *day and hour* an instant falls in is the player's own, and
[`src/auth/local-time.ts`](../src/auth/local-time.ts) is where that is decided.
The offset is minutes east of UTC (`+480` for UTC+8), reported by the client
from its own zone and normalized with `asOffset` to something a zone can
actually be.

Two things ride on it:

- **The window is local**, so a player walking at night meets what the night
  pool holds wherever they are. The instant behind it is still the server's;
  only the reading is theirs.
- **The zone is in the seed** (`ChunkSnapshot.key` is `chunkSeed` + zone), so a
  chunk is one world per zone rather than one world on several clocks. What a
  player in UTC+8 finds there says nothing about what a player in UTC-5 will
  find, however the two line up their hours — spawns, item caches, berry
  patches, grottos and raid rolls all move with it.

A client can misreport its zone. Everything derived from the offset is
therefore **scoped by** it — the window document, the spawn ids, the claim
markers, the raid lobby ids — so inventing a zone yields that zone's world, not
a second helping of one's own. The ceiling on that is the ~27 offsets a day
holds: a determined client can re-claim a landmark once per zone it invents, at
the cost of walking a different world each time. Locking the offset to the
profile is the fix if that ever matters.

Dates a player reads are stored the way they read them: `caughtAt` and each
`history[].acquiredAt` are ISO 8601 strings **with the offset**
(`2026-08-10T22:14:03.123+08:00`), written by `toLocalISO` from the server's
instant and the catcher's zone. The local date is the first ten characters, and
`Date.parse` gives the instant back. The species-day candy bonus is judged on
the same local reading, so the featured family turns over at midnight where the
player is standing rather than at midnight UTC.

## Privileged writes

Anything that creates or moves value is written by the server, not the browser.
[`src/server/*`](../src/server) runs under the Firebase **Admin** SDK, whose
writes bypass the rules; the client reaches it through `'use server'` functions
that take the caller's Firebase ID token and resolve it with `requireUid`
([`src/server/firebase.ts`](../src/server/firebase.ts)). A uid passed alongside
a call is never trusted — only what the token proves.

| Written on the server                                      | What the rules could not enforce                                                                                                                               |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `recordCatch`                                              | The record is built from `encounters/{spawnId}:{uid}`, so the pokemon written down is the one that was staged, not one the caller describes                    |
| `grantItem` / `consumeItem`                                | Item stacks are currency; a client that could write them could mint Master Balls                                                                               |
| `grantGold` / `spendGold`                                  | The same, for the balance                                                                                                                                      |
| `grantCandy` / `useCandy`                                  | A candy buys a level, so minting candy mints levels                                                                                                            |
| `giveItem` / `takeItem`                                    | The bag and the catch have to move together, in one transaction                                                                                                |
| `evolveCatch`                                              | The criteria — level, held item, carried item — are cross-document                                                                                             |
| `claimItemCache` / `claimBerryPatch` / `claimHiddenGrotto` | The reward derives from the chunk seed and the **stored** window; a claim against a cell the player is nowhere near, or a window that has passed, pays nothing |
| `startEncounter` / `meetSpawn`                             | The spawn is read from the shared store and has to belong to the chunk's live window                                                                           |
| `markFled`                                                 | The key is recomputed from the stored encounter                                                                                                                |
| `joinRaid`                                                 | Catch ids are readable by every player, so ownership is checked where a client cannot skip it                                                                  |
| `startRaid`                                                | Only the host may start; teams are frozen from the stored catches                                                                                              |
| `finishBattle`                                             | Only a player who fielded a team may stamp an outcome, and only the first report counts                                                                        |
| `enterRocketStop` / `startRocketBattle`                    | The grunt's party is the chunk's own roll for the hour, and the fight freezes the player's party the way a raid does                                            |
| `claimRocketReward`                                        | Gold and a pokemon change hands on a win the server checks, and the `defeated` flag pays exactly once                                                           |
| `consumeHeldItems`                                         | What a unit spent is checked against the frozen team snapshot, only the reporter's own catches are touched, and each player is billed once per battle          |
| `clearRaid`                                                | A landmark shuts only for a battle actually recorded as won                                                                                                    |
| `claimRaidReward`                                          | Participation, the win, and the one-claim marker are all cross-document                                                                                        |

Every module under `src/server` opens with `import 'server-only'`. SolidStart
resolves that marker itself: an empty module on the server, and a **build
failure** in the client bundle naming the file that reached across. The boundary
is enforced by the build rather than by remembering where an import came from.

Deploying needs `FIREBASE_SERVICE_ACCOUNT` (the service-account JSON) or
application default credentials — see `.env.example`. Without it every
privileged write refuses rather than falling back to an unauthenticated one.

Two things stay client-side by design, and the rules carry them:

- **Shared-world publishing** — the snapshot window and the spawn documents.
  Any signed-in player may write them and the rules can only check shape, but
  the rolls are deterministic from the chunk seed and the window, so an honest
  client recomputes the same set and a dishonest one only lies to itself: the
  server re-derives every reward from the seed regardless.
- **Profile details** — nickname and avatar are the player's to set. The
  balance in the same document is not: the rules pin `gold` on update and
  require it to open at zero on create.
- **Buddies** — setting one is a preference, and the rule `get()`s the catch to
  confirm the player owns it.

## Required security rules

With the writes above moved, the rules below are what the client is still
allowed to do.

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }
    function isOwner(uid) {
      return signedIn() && request.auth.uid == uid;
    }

    // Public to read. A player sets their own details; the balance
    // moves only on the server, so it may not change from a client
    match /profiles/{uid} {
      allow read: if signedIn();
      // A profile opens empty-handed; gold only ever moves on the
      // server, so a first write cannot name its own balance
      allow create: if isOwner(uid) && request.resource.data.gold == 0;
      allow update: if isOwner(uid)
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['nickname', 'avatar']);
      allow delete: if false;
    }

    // Item stacks, id "{uid}:{item}". Read by the owner, written only
    // by the server: these are currency
    match /inventories/{stackId} {
      allow read: if signedIn() && stackId.split(':')[0] == request.auth.uid;
      allow write: if false;
    }
    // Candy stacks, id "{uid}:{family}" — the same, since a candy
    // buys a level
    match /candies/{stackId} {
      allow read: if signedIn() && stackId.split(':')[0] == request.auth.uid;
      allow write: if false;
    }
    // Fled encounters are recomputed from the stored encounter
    match /fled/{uid} {
      allow read: if isOwner(uid);
      allow write: if false;
    }
    match /buddies/{uid} {
      allow read: if isOwner(uid);
      allow delete: if isOwner(uid);
      allow create, update: if isOwner(uid)
        && request.resource.data.player == uid
        && request.auth.uid == get(
          /databases/$(database)/documents/caught/$(request.resource.data.caught)
        ).data.owner;
    }

    // Catch records: readable by every signed-in player (a trade
    // starts with looking), written only by the server. Catching,
    // levelling, evolving and handing an item over all go through
    // src/server/*
    match /caught/{catchId} {
      allow read: if signedIn();
      allow write: if false;
    }

    // Shared overworld state: everyone reads, signed-in players publish
    match /snapshots/{windowId} {
      allow read: if signedIn();
      allow write: if signedIn()
        && request.resource.data.seed == windowId.split(':')[0]
        && request.resource.data.offset is int
        && request.resource.data.timestamp is int;
    }
    match /spawns/{spawnId} {
      allow read: if signedIn();
      allow write: if signedIn();
    }

    // Per-player derivations and claim markers, keyed by
    // "{parentId}:{uid}". The player reads their own; only the server
    // writes them, since each one is a reward changing hands
    match /encounters/{encounterId} {
      allow read: if signedIn() && encounterId.split(':')[1] == request.auth.uid;
      allow write: if false;
    }
    match /cacheClaims/{claimId} {
      allow read: if signedIn();
      allow write: if false;
    }
    // Raid lobbies: opening one, joining, leaving, starting and
    // clearing are all the server's. What a landmark stages, and
    // whether a failed raid may be restaged, depend on world state
    // and a battle's outcome — neither is a client's to assert
    match /raids/{raidId} {
      allow read: if signedIn();
      allow write: if false;
    }
    match /raidRewards/{claimId} {
      allow read: if signedIn();
      allow write: if false;
    }
    // A grunt's party, and whether they have been put down: what one
    // pays out is the server's to decide
    match /rocketStops/{stopId} {
      allow read: if signedIn();
      allow write: if false;
    }
    // Teams, the snapshots a fight freezes, and the battles
    // themselves are all written by the server: a party names catch
    // ids, and an outcome decides who is owed a legendary
    match /teams/{teamId} {
      allow read: if signedIn();
      allow write: if false;
    }
    match /teamSnapshots/{snapshotId} {
      allow read: if signedIn();
      allow write: if false;
    }
    match /battles/{battleId} {
      allow read: if signedIn();
      allow write: if false;
    }
    // A battle's bill for spent items: written by the server, since
    // it takes items off catch records
    match /battleConsumptions/{markerId} {
      allow read: if signedIn();
      allow write: if false;
    }
    match /grottoClaims/{claimId} {
      allow read: if signedIn();
      allow write: if false;
    }
    match /berryClaims/{claimId} {
      allow read: if signedIn();
      allow write: if false;
    }
  }
}
```

Firestore has no `where` clause on `match` paths, so any grouped block above has
to be expanded into one `match` statement per collection when the rules are
actually deployed.

## Required indexes

| Collection    | Fields                                     | Reason                                       |
| ------------- | ------------------------------------------ | -------------------------------------------- |
| `spawns`      | `chunk` ASC, `offset` ASC, `timestamp` ASC | `listSpawns` filters on all three            |
| `caught`      | `owner` ASC                                | `listCaught`; automatic single-field index   |
| `spawns`      | `chunk` ASC, `offset` ASC                  | `clearStaleSpawns` clears its own zone       |
| `caught`      | `owner` ASC, `species` ASC                 | `hasCaughtSpecies`, the Repeat Ball's check  |
| `inventories` | `user` ASC                                 | `getInventory`; automatic single-field index |
| `candies`     | `user` ASC                                 | `getCandies`; automatic single-field index   |
| `teams`       | `player` ASC                               | `listTeams`; automatic single-field index    |
| `teams`       | `player` ASC, `catches` ARRAY              | `isAnyCatchQueued` filters on both           |
| `raids`       | `timestamp` ASC, `offset` ASC              | `listLiveRaids` filters on both              |
| `battles`     | `players` ARRAY                            | `listBattleHistory`; automatic array index   |
| `raidRewards` | `player` ASC                               | `listClaimedRaids`; automatic single-field   |
