# Firestore

Every store the game writes to today, the document shape it holds, the id
scheme that addresses it, and the access each one needs. All access currently
goes through the Firebase **client** SDK from `src/auth/*` — there is no
privileged server-side admin path, so every rule below has to hold against a
signed-in player writing directly.

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

Read by anyone (other players see nicknames and avatars), written only by the
owning uid.

The balance moves through `grantGold` and `spendGold`, each of which reads and
writes inside a transaction so concurrent rewards cannot clobber each other.
`saveProfile` takes only `ProfileDetails` (`nickname` and `avatar`) and merges,
so the profile editor has no path to the balance.

### `inventories/{uid}:{item}`

Set by [`src/auth/inventory.ts`](../src/auth/inventory.ts). One document per
user and item pair, so a grant or a spend touches a single small document and
the same item can never split across two records. Both mutations run inside a
transaction.

| Field    | Type     | Notes                                         |
| -------- | -------- | --------------------------------------------- |
| `user`   | `string` | Owning uid, matching the first half of the id |
| `item`   | `Items`  | Numeric item id from the `Items` enum         |
| `amount` | `number` | How many are carried; never goes below zero   |

Private: only the owning uid may read or write. `getInventory` queries
`where('user', '==', uid)` and filters out stacks that have been spent to zero —
those documents stay behind rather than being deleted.

### `candies/{uid}:{family}`

Set by [`src/auth/candy.ts`](../src/auth/candy.ts). Keyed by evolution family
rather than species, because a candy feeds any catch in its family.

| Field    | Type       | Notes                                         |
| -------- | ---------- | --------------------------------------------- |
| `user`   | `string`   | Owning uid, matching the first half of the id |
| `family` | `Families` | Numeric family id from the `Families` enum    |
| `count`  | `number`   | How many are held; never goes below zero      |

`useCandy(uid, catchId)` spends `getCandyCost(caught)` candies to raise a catch
by a level — one for an ordinary catch, two for a shadow. It reads
the catch and the stack, then writes both **inside one transaction**, so a candy
can never be spent without the level landing. It resolves the new level, or null
when the catch is not the user's, its species' family does not match a stack the
user holds, the stack is empty, or the catch already sits at `MAX_LEVEL`
(`src/data/constants/levels.ts`).

Because the transaction writes `caught/{catchId}`, the security rules for that
collection have to keep allowing the owner to update it — see below.

Private: only the owning uid may read or write the stacks.

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

Set by [`src/auth/safari.ts`](../src/auth/safari.ts).

| Field  | Type       | Notes                                                             |
| ------ | ---------- | ----------------------------------------------------------------- |
| `keys` | `string[]` | Encounter keys the user has scared off, appended via `arrayUnion` |

An encounter key is `` `${x},${y}@${timestamp}:${individualValue}` `` (see
`encounterKey` in [`src/overworld/safari.ts`](../src/overworld/safari.ts)).
Private to the owning uid. Entries are only ever appended.

## Catch records

Written atomically as one batch by `recordCatch` in
[`src/auth/caught.ts`](../src/auth/caught.ts). The catch document gets a
Firestore auto-id, and the three side stores are keyed by that same id.

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
| `ball`                 | `Balls`                 | Ball the catch was made with                              |
| `caughtAt`             | `number`                | Server-clock milliseconds (see below)                     |
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

### `caughtAbilities/{catchId}`, `caughtItems/{catchId}`, `caughtOwners/{catchId}`

| Collection        | Field       | Type                | Notes                                                |
| ----------------- | ----------- | ------------------- | ---------------------------------------------------- |
| `caughtAbilities` | `abilities` | `Abilities[]`       | The rolled ability, plus Shadow for a shadow catch   |
| `caughtItems`     | `items`     | `Items[]`           | Held items; starts empty, up to `HELD_ITEM_LIMIT`    |
| `caughtOwners`    | `history`   | `OwnershipRecord[]` | `{ owner, acquiredAt }`, oldest first; trades append |

Catch records are world-readable (other players inspect a pokemon before a
trade) and writable only by the current owner named in `caught/{catchId}.owner`.
Because the side stores do not carry an owner field of their own, their rules
have to `get()` the parent catch document.

Held items move through `giveItem` and `takeItem` in
[`src/auth/caught.ts`](../src/auth/caught.ts): each reads the catch, its held
list and the inventory stack, then writes the stack and the list **in one
transaction**, so an item is never in the bag and on a pokemon at once, nor lost
between them. Only items flagged `Holdable` can be handed over, and a catch
holds at most `HELD_ITEM_LIMIT` (1) — matching the battle's per-unit item limit.
This is the path the Shiny Charm needs: a buddy holding it lifts the shiny odds
of every encounter its owner starts.

## Shared overworld stores

These are the synchronization surface: every player observing a chunk must
derive the same spawns, so the rolls are published once and read by everyone.

### `snapshots/{chunkSeed}`

Written by `resolveSnapshotWindow` in
[`src/auth/snapshots.ts`](../src/auth/snapshots.ts), inside a transaction.

| Field       | Type     | Notes                                               |
| ----------- | -------- | --------------------------------------------------- |
| `seed`      | `string` | The chunk seed, matching the document id            |
| `timestamp` | `number` | The 5-minute window, floored to `SNAPSHOT_INTERVAL` |

Whoever finds the record missing or expired writes the new window and is told
they refreshed it; everyone else adopts the stored timestamp. The `now` used to
judge expiry comes from the server clock (see below), never the device.

### `spawns/{chunkSeed}@{timestamp}#{index}`

Written by `publishSpawns`, deleted by `clearStaleSpawns` when a window rolls
over.

| Field             | Type      | Notes           |
| ----------------- | --------- | --------------- |
| `chunk`           | `string`  | Chunk seed      |
| `timestamp`       | `number`  | Snapshot window |
| `species`         | `Species` |                 |
| `individualValue` | `number`  |                 |
| `traitValue`      | `number`  |                 |

The id is deterministic, so concurrent publishers write identical documents
rather than duplicates. `listSpawns` queries
`where('chunk', '==', seed)` and `where('timestamp', '==', window)` together,
which **requires a composite index** on `(chunk, timestamp)`.
`clearStaleSpawns` queries on `chunk` alone, covered by the automatic
single-field index.

### `encounters/{spawnId}:{uid}`

Written by `startEncounter`: the per-player view of a shared spawn (shininess,
gender, ability, nature, moves, …) derived once and reused afterwards.

Holds every field of `Encounter` plus `spawn` (the spawn document id) and
`player` (the uid). Only the named player may read or write it.

Two fields are worth calling out. `shiny` is a resonance between the trainer id
and the **trait** value, so shininess is independent of the IVs a pokemon
rolled and the same spawn can sparkle for one player and not another. The odds
are multiplied by the species day (×8 for the featured family) and by the Shiny
Charm (×8) when the player's buddy is holding it — `startEncounter` checks
`buddies/{uid}` and that catch's held items before deriving. `shadow`
marks a shadow raid's reward: `recordCatch` then writes `Abilities.Shadow` into
`caughtAbilities` alongside the rolled one, so the catch keeps it for good.

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
| `timestamp`  | `number`         | The raid hour, for listing the live lobbies                 |
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

`listLiveRaids(raidTimestamp)` queries `where('timestamp', '==', …)` and keeps
the lobbies that are neither started nor cleared — that is the Raids tab.

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
| `catches` | `string[]` | Up to `TEAM_SIZE` (6) `caught/{catchId}` ids |

A team holds ids, so it follows whatever those catches become — until a battle
freezes them.

### `teamSnapshots/{snapshotId}`

| Field      | Type              | Notes                                        |
| ---------- | ----------------- | -------------------------------------------- |
| `player`   | `string`          | Owning uid; empty for the raid boss          |
| `alliance` | `number`          | Teams sharing a number fight side by side    |
| `catches`  | `CatchSnapshot[]` | The party frozen as it stood at battle start |

A **catch snapshot** ([`src/auth/catch-snapshot.ts`](../src/auth/catch-snapshot.ts))
copies `caught` (the source id), `species`, `level`, `ivs`, `effortValues`,
`nature`, `gender`, `shiny`, `moves`, `abilities` and `items`. It is never
rewritten: levelling, evolving or handing an item over mid-raid must not change
units already fighting.

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

### `raidRewards/{raidId}:{uid}`

| Field    | Type     | Notes                   |
| -------- | -------- | ----------------------- |
| `player` | `string` | Claiming uid            |
| `raid`   | `string` | The raid collected from |

`claimRaidReward(user, raidId)` hands over the legendary a cleared raid owes.
It refuses unless the battle was **won** and the uid appears in
`battles/{battleId}.players`, and the marker above guards it so each fighter
collects once. The reward waits rather than expiring: a player who ran from the
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

## Derived, never stored

Landmarks, item-cache rewards, berry patches, grotto rewards and cell placement
are **not** in Firestore. They re-derive from the chunk seed plus the snapshot window
(`src/overworld/chunk.ts`, `src/overworld/chunk-snapshot.ts`), so two players in
the same window compute identical results from the two fields that
`snapshots/{chunkSeed}` does store.

## Clock

Anything time-bound reads the server clock through
[`src/auth/clock.ts`](../src/auth/clock.ts) rather than `Date.now()`: a
`'use server'` function returns the server's time, the client measures the
offset once and derives locally for the next minute. This covers snapshot
window expiry, safari session seeds and `caughtAt` stamps, so a skewed device
cannot shift the window it sees or the timestamps it writes.

## Required security rules

The client SDK holds every write path, so these rules are the only thing
enforcing ownership. Two weak spots follow from that:

- Any signed-in player can write a snapshot window or a spawn document, and the
  rules can only check shape, not that the roll was honest.
- Gold, item stacks and candy stacks are client-written, so the rules can only
  confirm a player is editing their own, not that they earned them.
  `profiles.gold`, `inventories.amount` and `candies.count` are therefore
  player-settable in practice — and since a candy buys a level and an
  evolution rewrites a species, so are `caught.level` and `caught.species`.
  The evolution criteria are enforced in application code inside the
  transaction, which a hand-rolled write bypasses.

Moving currency, inventory and spawn publication behind server functions with
the Admin SDK is the real fix; until then the rules below are the floor.

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

    // Public to read, owner writes only
    match /profiles/{uid} {
      allow read: if signedIn();
      allow write: if isOwner(uid);
    }

    // Private to the owner. The stack id is "{uid}:{item}", so the
    // owner check reads the uid straight off the document id
    match /inventories/{stackId} {
      allow read: if signedIn() && stackId.split(':')[0] == request.auth.uid;
      allow write: if signedIn()
        && stackId.split(':')[0] == request.auth.uid
        && request.resource.data.user == request.auth.uid
        && request.resource.data.amount >= 0;
    }
    // Candy stacks, id "{uid}:{family}". The level a candy buys is
    // written to caught/{catchId} by the same transaction, which the
    // caught rules already permit for the owner
    match /candies/{stackId} {
      allow read: if signedIn() && stackId.split(':')[0] == request.auth.uid;
      allow write: if signedIn()
        && stackId.split(':')[0] == request.auth.uid
        && request.resource.data.user == request.auth.uid
        && request.resource.data.count >= 0;
    }
    match /fled/{uid} {
      allow read, write: if isOwner(uid);
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

    // Catch records: readable by all, mutable by the current owner
    match /caught/{catchId} {
      allow read: if signedIn();
      allow create: if isOwner(request.resource.data.owner);
      allow update, delete: if isOwner(resource.data.owner);
    }
    match /{store}/{catchId} where store in ['caughtAbilities', 'caughtItems', 'caughtOwners'] {
      allow read: if signedIn();
      allow write: if signedIn()
        && request.auth.uid == get(/databases/$(database)/documents/caught/$(catchId)).data.owner;
    }

    // Shared overworld state: everyone reads, signed-in players publish
    match /snapshots/{chunkSeed} {
      allow read: if signedIn();
      allow write: if signedIn()
        && request.resource.data.seed == chunkSeed
        && request.resource.data.timestamp is int;
    }
    match /spawns/{spawnId} {
      allow read: if signedIn();
      allow write: if signedIn();
    }

    // Per-player derivations, keyed by "{parentId}:{uid}"
    match /encounters/{encounterId} {
      allow read, write: if signedIn()
        && encounterId.split(':')[1] == request.auth.uid
        && request.resource.data.player == request.auth.uid;
    }
    match /cacheClaims/{claimId} {
      allow read: if signedIn();
      allow create: if signedIn()
        && claimId.split(':')[1] == request.auth.uid
        && request.resource.data.player == request.auth.uid;
      allow update, delete: if false;
    }
    // Raid lobbies and the records a fight freezes. Everything here
    // is readable by the lobby, and the rules can only check the
    // shape — the host check on starting lives in application code
    match /raids/{raidId} {
      allow read: if signedIn();
      allow create: if signedIn() && request.resource.data.host == request.auth.uid;
      allow update: if signedIn();
      allow delete: if false;
    }
    match /raidRewards/{claimId} {
      allow read: if signedIn();
      allow create: if signedIn()
        && claimId.split(':')[1] == request.auth.uid
        && request.resource.data.player == request.auth.uid;
      allow update, delete: if false;
    }
    match /teams/{teamId} {
      allow read: if signedIn();
      allow create: if signedIn()
        && request.resource.data.player == request.auth.uid
        && request.resource.data.catches.size() <= 6;
      allow update, delete: if signedIn() && resource.data.player == request.auth.uid;
    }
    match /teamSnapshots/{snapshotId} {
      allow read: if signedIn();
      allow create: if signedIn();
      // A snapshot is frozen: rewriting it would change units that
      // are already fighting
      allow update, delete: if false;
    }
    match /battles/{battleId} {
      allow read: if signedIn();
      allow create: if signedIn() && request.auth.uid in request.resource.data.players;
      // Only the outcome ever moves, and only for a participant
      allow update: if signedIn()
        && request.auth.uid in resource.data.players
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['outcome']);
      allow delete: if false;
    }
    match /grottoClaims/{claimId} {
      allow read: if signedIn();
      allow create: if signedIn()
        && claimId.split(':')[1] == request.auth.uid
        && request.resource.data.player == request.auth.uid;
      allow update, delete: if false;
    }
    match /berryClaims/{claimId} {
      allow read: if signedIn();
      allow create: if signedIn()
        && claimId.split(':')[1] == request.auth.uid
        && request.resource.data.player == request.auth.uid;
      allow update, delete: if false;
    }
  }
}
```

Firestore has no `where` clause on `match` paths, so the grouped
`caughtAbilities` / `caughtItems` / `caughtOwners` block above has to be
expanded into three identical `match` statements when the rules are actually
deployed.

## Required indexes

| Collection    | Fields                       | Reason                                        |
| ------------- | ---------------------------- | --------------------------------------------- |
| `spawns`      | `chunk` ASC, `timestamp` ASC | `listSpawns` filters on both                  |
| `caught`      | `owner` ASC                  | `listCaught`; automatic single-field index    |
| `spawns`      | `chunk` ASC                  | `clearStaleSpawns`; automatic                 |
| `caught`      | `owner` ASC, `species` ASC   | `hasCaughtSpecies`, the Repeat Ball's check   |
| `inventories` | `user` ASC                   | `getInventory`; automatic single-field index  |
| `candies`     | `user` ASC                   | `getCandies`; automatic single-field index    |
| `teams`       | `player` ASC                 | `listTeams`; automatic single-field index     |
| `raids`       | `timestamp` ASC              | `listLiveRaids`; automatic single-field index |
| `battles`     | `players` ARRAY              | `listBattleHistory`; automatic array index    |
| `raidRewards` | `player` ASC                 | `listClaimedRaids`; automatic single-field    |
