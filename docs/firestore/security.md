# Security

## Privileged writes

Anything that creates or moves value is written by the server, not the browser.
[`src/server/*`](../../src/server) runs under the Firebase **Admin** SDK, whose
writes bypass the rules; the client reaches it through `'use server'` functions
that take the caller's Firebase ID token and resolve it with `requireUid`
([`src/server/firebase.ts`](../../src/server/firebase.ts)). A uid passed alongside
a call is never trusted — only what the token proves.

| Written on the server                                    | What the rules could not enforce                                                                                                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `recordCatch`                                            | The record is built from `encounters/{spawnId}:{uid}`, so the pokemon written down is the one that was staged, not one the caller describes                                                       |
| `grantItem` / `consumeItem`                              | Item stacks are currency; a client that could write them could mint Master Balls                                                                                                                  |
| `grantGold` / `spendGold`                                | The same, for the balance                                                                                                                                                                         |
| `grantCandy` / `useCandy`                                | A candy buys a level, so minting candy mints levels                                                                                                                                               |
| `giveItem` / `takeItem`                                  | The bag and the catch have to move together, in one transaction                                                                                                                                   |
| `releaseCatch`                                           | The record is deleted, its held items go back to the bag and the profile's buddy is cleared if it named the released catch, all at once                                                           |
| `evolveCatch`                                            | The criteria — level, held item, carried item — are cross-document                                                                                                                                |
| `claimItemCache` / `claimBerryPatch` / `claimPhenomenon` | The reward derives from the chunk seed and the **stored** window; a claim against a cell that holds nothing, or a window that has passed, pays nothing                                            |
| `startEncounter` / `meetSpawn`                           | The spawn is read from the shared store and has to belong to the chunk's live window                                                                                                              |
| `markFled`                                               | The key is recomputed from the stored encounter                                                                                                                                                   |
| `peekRaid`                                               | Reads only, but reads what the world staged: what a lair holds — and whether this player may host, join or only watch — is not a client's to decide                                               |
| `joinRaid`                                               | Catch ids are readable by every player, so ownership is checked where a client cannot skip it                                                                                                     |
| `startRaid`                                              | Only the host may start; teams are frozen from the stored catches                                                                                                                                 |
| `finishBattle`                                           | Only a player who fielded a team may stamp an outcome, and only the first report counts                                                                                                           |
| `hostMythicalRaid`                                       | The relic is checked and spent server-side before the lobby exists, so one raid item opens one raid whatever becomes of it                                                                        |
| `enterRocketStop` / `startRocketBattle`                  | The grunt's party is the chunk's own roll for the window, and the fight freezes the player's party the way a raid does                                                                            |
| `claimRocketReward`                                      | Gold and a pokemon change hands on a win the server checks, and the `defeated` flag pays exactly once                                                                                             |
| `recordAftermath`                                        | What a unit spent, and what health it has left, are checked against the frozen snapshot and the record; each player settles once per battle                                                       |
| `clearRaid`                                              | A landmark shuts only for a battle actually recorded as won                                                                                                                                       |
| `claimRaidReward`                                        | Participation, the win, and the one-claim marker are all cross-document                                                                                                                           |
| `claimNest`                                              | A nest hands over one egg per player per half day, and what is inside it is decided as the server writes it                                                                                       |
| `teachMove`                                              | Which move a machine teaches, whether the species can learn it and whether the machine is carried are all decided again from the stored record, and the machine leaves the bag in the same write  |
| `learnLevelUpMove`                                       | The move has to be one the species learns at exactly the level the stored record sits at, so nothing older can be had for free — that is the Move Reminder's trade, and it costs a Heart Scale    |
| `remindMove`                                             | The Move Reminder is re-derived from the window, what he can give back is derived again from the stored species, level and move list, and the Heart Scale leaves the bag in the same write        |
| `buyFossil`                                              | Which two fossils the maniac carries is re-derived from his window, the visit is claimed before the trade, and the gold and the rock move in one transaction                                      |
| `reviveFossil`                                           | What comes out of a fossil belongs to the fossil and arrives at a fixed level, and the rock leaves the bag before the record is written — and goes back if it never is                            |
| `walk`                                                   | Steps are credited against the server clock, so a report buys no more than the time since the last one — and what a Pickup buddy found is the server's own roll, landing in the same transaction  |
| `hatchEgg`                                               | An egg opens only where the record says it has been carried far enough, and the candy is paid there too                                                                                           |
| `breedCatches`                                           | Who is standing at the cell, whether the pair can breed and what the egg inherits are all decided server-side; the once-a-window visit is claimed before the fee is taken                         |
| `boostEgg`                                               | The daycare lady is re-derived from the window, the half a walk she adds is measured against the stored egg, and she serves a player once per window                                              |
| `useBottleCap`                                           | Which values a cap raises is the server's roll, and the cap leaves the bag in the same transaction the stats are written in                                                                       |
| `useHealingItem`                                         | The item leaves the bag and the health it restores lands on the catch in one transaction, and only an item that would do something is spent                                                       |
| `openAuction`                                            | The lot leaves the seller's hands as the listing is written, and the seller document is what holds them to one auction at a time                                                                  |
| `placeBid`                                               | Gold moves as the bid lands: the outbid one is refunded and the new one taken in the same transaction, so a standing bid is money already paid                                                    |
| `claimAuction`                                           | Who won, whether bidding has closed, and the one-claim `settled` flag are all read where a client cannot skip them — and the seller is paid from the same claim                                   |
| `reclaimAuction`                                         | Only the seller, only once bidding has closed with nobody having bid, and only through the same `settled` flag a collection uses, so a lot cannot be pulled off the block or handed back twice    |
| `usePurifyingGem`                                        | The shadow field, the ability and the values move together with the gem leaving the bag, so a rare item is never spent on a pokemon that did not change                                           |
| `visitNurse`                                             | Who is standing at the cell is re-derived, and the once-a-window marker is taken only once she has actually done something                                                                        |
| `usePortal`                                              | The cell has to really be a portal in a live window, the far end is re-derived rather than accepted, and the key is taken only once the crossing is known to be real                              |
| `savePosition`                                           | A client that could write this document could write anybody else's; the coordinates are clamped to somewhere that exists, and nothing about the walk is checked because nothing trusts a position |

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
      // The buddy lives here too: it is the player's to set, and it
      // is read on nearly every action they take
      allow update: if isOwner(uid)
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['nickname', 'avatar', 'buddy']);
      allow delete: if false;
    }

    // Everything a player carries, items and candies together. Read
    // by the owner, written only by the server: both maps are
    // currency, since one mints Master Balls and the other mints
    // levels
    match /bags/{uid} {
      // `get` rather than `read`: the condition names the document's
      // own id, which a query has none of — see the note on `bids`.
      // A bag is fetched by id and never listed, so a list is refused
      // outright rather than failing on a null wildcard
      allow get: if isOwner(uid);
      allow write: if false;
    }
    // Where a player is standing. Theirs to read, and the server's to
    // write — not because a position is trusted (nothing checks one)
    // but because a client that could write this could write anybody's
    match /positions/{uid} {
      allow get: if isOwner(uid);
      allow write: if false;
    }
    // Fled encounters are recomputed from the stored encounter
    match /fled/{uid} {
      allow get: if isOwner(uid);
      allow write: if false;
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
    // The window and the spawns it rolled are one document, so
    // publishing them is one write anybody in the zone may make
    match /snapshots/{windowId} {
      allow read: if signedIn();
      allow write: if signedIn()
        && request.resource.data.seed == windowId.split(':')[0]
        && request.resource.data.offset is int
        && request.resource.data.timestamp is int
        && request.resource.data.spawns is list;
    }

    // Per-player derivations and claim markers, keyed by
    // "{parentId}:{uid}". The player reads their own; only the server
    // writes them, since each one is a reward changing hands
    match /encounters/{encounterId} {
      allow get: if signedIn() && encounterId.split(':')[1] == request.auth.uid;
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
    // The auction board: every signed-in player can see what is on it,
    // and nobody writes it. A lot leaves its owner's hands as the
    // listing is written, a bid moves gold, and collecting one hands
    // over a pokemon — none of that is a client's to assert
    match /auctions/{auctionId} {
      allow read: if signedIn();
      allow write: if false;
    }
    // What a seller has running, which is what holds them to one
    // auction at a time. Theirs to read, nobody's to write
    match /auctionSellers/{uid} {
      allow get: if isOwner(uid);
      allow write: if false;
    }
    // A player's own bidding history, id "{uid}:{auctionId}". The lot
    // keeps only the standing bid, so this is what says they took part
    // at all — and what they paid is nobody else's business.
    //
    // Split, because the two halves of a read cannot ask the same
    // question. Naming a document is a `get`, and the id is what says
    // whose it is; asking for the collection is a `list`, where the
    // id wildcard is **null** — the rule is evaluated per document
    // the query would return, before any of them has a name. Asking
    // `bidId` there is a "Null value error", and a bidding history
    // that cannot be read at all
    match /bids/{bidId} {
      allow get: if signedIn() && bidId.split(':')[0] == request.auth.uid;
      // The field the query filters on. A query that does not filter
      // by player would return somebody else's document, fail this
      // for it, and be refused whole — which is the check
      allow list: if signedIn() && resource.data.player == request.auth.uid;
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
    // What a battle left the party with — items spent, health lost,
    // status carried: written by the server, since it writes to
    // catch records
    match /battleAftermaths/{markerId} {
      allow read: if signedIn();
      allow write: if false;
    }
    match /phenomenonClaims/{claimId} {
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
    // One visit per wandering NPC, cell, window and player. For Nurse
    // Joy it is the whole of the limit, since she charges nothing; for
    // the three who charge it is what the fee alone could not do. The
    // vendor writes no marker: a shop is not a once-a-day thing
    match /npcClaims/{claimId} {
      allow read: if signedIn();
      allow write: if false;
    }
  }
}
```

Firestore has no `where` clause on `match` paths, so any grouped block above has
to be expanded into one `match` statement per collection when the rules are
actually deployed.

A read is two operations, and a rule that names the document's own id can only
answer one of them. `get` names a document; `list` is evaluated **per document a
query would return**, before any of them has a name, so every wildcard in the
match path is `null` there — asking for one is a _"Null value error for 'list'"_
rather than a refusal, and the tab that ran the query shows nothing at all. Where
a collection is both fetched by id and queried, the two halves get separate
rules: `bids` reads its id for a `get` and the `player` field the query filters on
for a `list`. Where a collection is only ever fetched by id, the rule says `get`
and a query is refused outright rather than erroring.

That file now exists: [`firestore.rules`](../../firestore.rules) is the block
above, and [`firestore.indexes.json`](../../firestore.indexes.json) the table
below. The **emulators enforce both**, so a client write these refuse fails on a
developer's machine rather than in front of a player — see the emulator section
of the [README](../../README.md).

The one collection no client touches at all is `giftClaims`: a mystery gift is
decided, written and marked in the same server call, so the marker is neither
read nor written from a browser — and a client that could delete its own marker
could ask for the same gift twice.

### Testing them

The rules language has no interpreter outside the emulator, so
[`test/firestore/rules.test.ts`](../../test/firestore/rules.test.ts) asks the
engine itself: for each collection, whether the owner may read it, whether
anybody else may, whether a query is refused where only a `get` was granted, and
whether the client is kept out of the writes. Run them with
`pnpm test:rules`, which starts a Firestore emulator around the run and stops it
after.

They are kept out of `pnpm test` because they are the only tests that need
something running — an emulator, and so a JDK. The run **empties the store
between cases**, which is why it wants an emulator of its own: point it at one
that is already up and it takes that data with it. `FIRESTORE_EMULATOR_PORT`
moves it to a spare port when there is a development emulator to leave alone.

Two things worth knowing that the tests are what settled:

- A profile write that names `gold` **at the value it already holds** is
  allowed. `affectedKeys()` is a diff, so a field rewritten with what was there
  is in no key set at all. Nothing changes hands, and refusing it would refuse a
  client that sends the whole document back.
- Under `allow get` alone, a query is refused rather than returning the caller's
  own document — including for the player who owns it. That is the intent, and
  it is why the collections that are genuinely queried, like `bids`, carry a
  separate `list` rule filtered on a field.

## Required indexes

A player's bag needs none: `bags/{uid}` is read by id, and its two maps are
**exempted from indexing** — a key per item id would be an index entry per item
id, and nothing asks the store which players hold a Master Ball.

| Collection    | Fields                         | Reason                                            |
| ------------- | ------------------------------ | ------------------------------------------------- |
| `caught`      | `owner` ASC                    | `listCaught`; automatic single-field index        |
| `caught`      | `owner` ASC, `species` ASC     | `hasCaughtSpecies`, the Repeat Ball's check       |
| `caught`      | `owner` ASC, `shiny` ASC       | `listCaughtMarked`; one per mark asked for        |
| `caught`      | `owner` ASC, `auctionable` ASC | The auction sell picker, the same way             |
| `teams`       | `player` ASC                   | `listTeams`; automatic single-field index         |
| `teams`       | `player` ASC, `catches` ARRAY  | `isAnyCatchQueued` filters on both                |
| `raids`       | `timestamp` ASC, `offset` ASC  | `listLiveRaids` filters on both                   |
| `battles`     | `players` ARRAY                | `listBattleHistory`; automatic array index        |
| `raidRewards` | `player` ASC                   | `listClaimedRaids`; automatic single-field        |
| `auctions`    | `settled` ASC                  | `watchOpenAuctions`; automatic single-field index |
| `auctions`    | `seller` ASC                   | `listAuctionsBy`; automatic single-field index    |
| `bids`        | `player` ASC                   | `listBidHistory`; automatic single-field index    |
