# Security

## Privileged writes

Anything that creates or moves value is written by the server, not the browser.
[`src/server/*`](../../src/server) runs under the Firebase **Admin** SDK, whose
writes bypass the rules; the client reaches it through `'use server'` functions
that take the caller's Firebase ID token and resolve it with `requireUid`
([`src/server/firebase.ts`](../../src/server/firebase.ts)). A uid passed alongside
a call is never trusted — only what the token proves.

| Written on the server                                      | What the rules could not enforce                                                                                                                               |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `recordCatch`                                              | The record is built from `encounters/{spawnId}:{uid}`, so the pokemon written down is the one that was staged, not one the caller describes                    |
| `grantItem` / `consumeItem`                                | Item stacks are currency; a client that could write them could mint Master Balls                                                                               |
| `grantGold` / `spendGold`                                  | The same, for the balance                                                                                                                                      |
| `grantCandy` / `useCandy`                                  | A candy buys a level, so minting candy mints levels                                                                                                            |
| `giveItem` / `takeItem`                                    | The bag and the catch have to move together, in one transaction                                                                                                |
| `releaseCatch`                                             | The record is deleted, its held items go back to the bag and a buddy record naming it goes with it, all at once                                                |
| `evolveCatch`                                              | The criteria — level, held item, carried item — are cross-document                                                                                             |
| `claimItemCache` / `claimBerryPatch` / `claimHiddenGrotto` | The reward derives from the chunk seed and the **stored** window; a claim against a cell that holds nothing, or a window that has passed, pays nothing         |
| `startEncounter` / `meetSpawn`                             | The spawn is read from the shared store and has to belong to the chunk's live window                                                                           |
| `markFled`                                                 | The key is recomputed from the stored encounter                                                                                                                |
| `joinRaid`                                                 | Catch ids are readable by every player, so ownership is checked where a client cannot skip it                                                                  |
| `startRaid`                                                | Only the host may start; teams are frozen from the stored catches                                                                                              |
| `finishBattle`                                             | Only a player who fielded a team may stamp an outcome, and only the first report counts                                                                        |
| `hostMythicalRaid`                                         | The relic is checked and spent server-side before the lobby exists, so one raid item opens one raid whatever becomes of it                                     |
| `enterRocketStop` / `startRocketBattle`                    | The grunt's party is the chunk's own roll for the hour, and the fight freezes the player's party the way a raid does                                            |
| `claimRocketReward`                                        | Gold and a pokemon change hands on a win the server checks, and the `defeated` flag pays exactly once                                                           |
| `consumeHeldItems`                                         | What a unit spent is checked against the frozen team snapshot, only the reporter's own catches are touched, and each player is billed once per battle          |
| `clearRaid`                                                | A landmark shuts only for a battle actually recorded as won                                                                                                    |
| `claimRaidReward`                                          | Participation, the win, and the one-claim marker are all cross-document                                                                                        |
| `claimNest`                                                | A nest hands over one egg per player per local day, and what is inside it is decided as the server writes it                                                   |
| `walk`                                                     | Steps are credited against the server clock, so a report buys no more than the time since the last one                                                         |
| `hatchEgg`                                                 | An egg opens only where the record says it has been carried far enough, and the candy is paid there too                                                        |
| `breedCatches`                                             | Who is standing at the cell, whether the pair can breed and what the egg inherits are all decided server-side, and the fee is taken first                      |
| `boostEgg`                                                 | The daycare lady is re-derived from the hour, and the half a walk she adds is measured against the stored egg                                                  |
| `useBottleCap`                                             | Which values a cap raises is the server's roll, and the cap leaves the bag in the same transaction the stats are written in                                    |

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
    // A nest claim is what an egg was written against, so it is the
    // server's alone — the same as every other landmark marker
    match /nestClaims/{claimId} {
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
