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

`useCandy(uid, catchId)` spends one candy to raise a catch by a level. It reads
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
| `caughtAbilities` | `abilities` | `Abilities[]`       | Starts as the spawn's rolled ability                 |
| `caughtItems`     | `items`     | `Items[]`           | Held items; starts empty                             |
| `caughtOwners`    | `history`   | `OwnershipRecord[]` | `{ owner, acquiredAt }`, oldest first; trades append |

Catch records are world-readable (other players inspect a pokemon before a
trade) and writable only by the current owner named in `caught/{catchId}.owner`.
Because the side stores do not carry an owner field of their own, their rules
have to `get()` the parent catch document.

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

### `cacheClaims/{chunkSeed}@{timestamp}${cell}:{uid}`

Written by `claimItemCache` inside a transaction; its existence is the claim
marker that stops a player collecting the same cache twice in one window.

| Field    | Type     | Notes                     |
| -------- | -------- | ------------------------- |
| `player` | `string` | Claiming uid              |
| `item`   | `Items`  | The item that was granted |

Claims are never updated or deleted — an expired window simply produces a new
document id. Only the named player may create one.

### `grottoClaims/{chunkSeed}@{timestamp}$grotto{cell}:{uid}`

Written by `claimHiddenGrotto`, the same one-claim-per-window marker as an item
cache.

| Field    | Type                  | Notes                                   |
| -------- | --------------------- | --------------------------------------- |
| `player` | `string`              | Claiming uid                            |
| `kind`   | `'item' \| 'pokemon'` | Which branch of the grotto reward fired |

An item reward lands in the inventory as part of the claim. A pokemon reward
comes back as a spawn tuple whose two rolls derive from
`{seed}{timestamp}grotto{cell}spawn`, so every observer of that grotto meets the
same individual; the caller passes it to `startEncounter` under the id
`{chunkSeed}@{timestamp}$grotto{cell}`, which has no `spawns` document behind it.

## Derived, never stored

Landmarks, item-cache rewards, grotto rewards and cell placement are **not** in
Firestore. They re-derive from the chunk seed plus the snapshot window
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
    match /grottoClaims/{claimId} {
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

| Collection    | Fields                       | Reason                                       |
| ------------- | ---------------------------- | -------------------------------------------- |
| `spawns`      | `chunk` ASC, `timestamp` ASC | `listSpawns` filters on both                 |
| `caught`      | `owner` ASC                  | `listCaught`; automatic single-field index   |
| `spawns`      | `chunk` ASC                  | `clearStaleSpawns`; automatic                |
| `inventories` | `user` ASC                   | `getInventory`; automatic single-field index |
| `candies`     | `user` ASC                   | `getCandies`; automatic single-field index   |
