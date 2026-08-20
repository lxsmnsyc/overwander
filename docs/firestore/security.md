# Security

## Privileged writes

Anything that creates or moves value is written by the server rather than the
browser. [`src/server/*`](../../src/server) runs under the Firebase **Admin**
SDK, whose writes bypass the rules. The client reaches it through `'use server'`
functions that take the caller's Firebase ID token and resolve it with
`requireUid` ([`src/server/firebase.ts`](../../src/server/firebase.ts)). A uid
passed alongside a call is never trusted; only what the token proves is.

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
application default credentials — see `.env.example`. Without either, every
privileged write refuses rather than falling back to an unauthenticated one.

Three things stay client-side by design, and the rules carry them:

- **Shared-world publishing** — the snapshot window and the spawns it rolled.
  Any signed-in player may write that document and the rules can only check its
  shape, but the rolls are deterministic from the chunk seed and the window. An
  honest client recomputes the same set, and a dishonest one only lies to itself:
  the server re-derives every reward from the seed regardless.
- **Profile details** — nickname and avatar are the player's to set. The balance
  in the same document is not, and neither is the `role` field or the `banned`
  flag: the rules pin all of them on update, require `gold` to open at zero, and
  refuse a create that names a role or arrives already banned. A role is granted
  out of band — on a development build, by the server handing every new account
  `admin` as it is created.
- **Buddies** — setting one is a preference, and the rule `get()`s the catch to
  confirm the player owns it.

## The rules themselves

[`firestore.rules`](../../firestore.rules) at the repository root is the deployed
ruleset, and it is the authority; this page describes it rather than repeating
it. What follows is what a signed-in client may still do.

| Collection                                                                             | Client read                                                | Client write                              |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| `profiles/{uid}`                                                                       | Anyone signed in                                           | Owner: `nickname`, `avatar`, `buddy` only |
| `snapshots/{windowId}`                                                                 | Anyone signed in                                           | Anyone signed in, shape-checked           |
| `caught`, `raids`, `raidRewards`, `auctions`, `rocketStops`                            | Anyone signed in                                           | None                                      |
| `teams`, `teamSnapshots`, `battles`, `battleAftermaths`                                | Anyone signed in                                           | None                                      |
| `cacheClaims`, `berryClaims`, `phenomenonClaims`, `nestClaims`, `npcClaims`            | Anyone signed in                                           | None                                      |
| `bags/{uid}`, `pokedex/{uid}`, `positions/{uid}`, `fled/{uid}`, `auctionSellers/{uid}` | Owner, by id (`get`)                                       | None                                      |
| `encounters/{spawnId}:{uid}`                                                           | The named player, by id                                    | None                                      |
| `bids/{uid}:{auctionId}`                                                               | The named player: `get` by id, `list` filtered on `player` | None                                      |
| `gifts`, `giftClaims`                                                                  | None                                                       | None                                      |
| `friends/{owner}:{friend}`                                                             | The owner: `get` by id, `list` filtered on `owner`         | None                                      |
| `friendRequests/{from}:{to}`                                                           | Either end: `list` filtered on `to` or on `from`           | None                                      |
| `blocks/{blocker}:{blocked}`                                                           | The blocker, the same way                                  | None                                      |

`gifts` and `giftClaims` are the collections no client touches at all. A mystery
gift is offered, listed and claimed through the server, so neither the offer nor
the claim is read or written from a browser — and a client that could write its
own claim could take an open gift as many times as it liked.

The three friend collections are read by the player they are about and written by
nobody. The filter is the check, the way it is for `bids`, and it is what lets the
lists follow the store live. Writing is the server's: a client that could write a
friendship could put itself on somebody else's list, and one that could delete a
block could lift somebody else's. A block is readable by the blocker alone —
nothing tells the blocked player. See [`friends.md`](./friends.md).

`positions/{uid}` is readable by its owner and nobody else, which is the right
rule for a document a client could otherwise sweep the whole collection of — and
the wrong answer for the profile a raid lobby opens. Where a trainer is standing
is shown through a server call instead, which reads one document for one uid.

### Roles, and what each may do

Four roles, and they are a ladder rather than a set of flags
([`src/auth/staff.ts`](../../src/auth/staff.ts)). Every rung may do what the rung
below it may:

| Role        | May                                                                 |
| ----------- | ------------------------------------------------------------------- |
| _(player)_  | Play                                                                |
| `moderator` | Open the dashboard, read the accounts and the world, ban players    |
| `admin`     | Also run the game: mystery gifts, raids, auctions. Makes moderators |
| `owner`     | Also makes admins                                                   |

What separates them is who they may act **on**: strictly below themselves.
An admin cannot ban or demote another admin, a moderator cannot touch a
moderator, nobody touches the owner, and nobody may take their own authority off
— an account that could would be one nobody can give it back to. The owner's own
role is granted where the project is deployed rather than from any screen.

The checks live on the server: `requireStaff` for anything the dashboard reads,
`requireAdmin` for anything that runs the game, and `setRole`/`setBan` compare
the caller's stored role against the target's before writing. The dashboard hides
what a role cannot use, which is a courtesy rather than a defence.

### A ban is one line

`banned` on the profile, written by the server alone. `requireUid` refuses a
banned account before it reads anything, and **every** privileged call passes
through it — so one check shuts all of them rather than each remembering to ask.
A banned player can still sign in and read: the game tells them they are banned
and why, since a ban that looked like a broken game would be worse than one that
says so.

### `get` and `list` are different questions

A read is two operations, and a rule that names the document's own id can only
answer one of them. `get` names a document. `list` is evaluated **per document a
query would return**, before any of them has a name, so every wildcard in the
match path is `null` there. Asking for one produces a _"Null value error for
'list'"_ rather than a refusal, and the tab that ran the query shows nothing at
all.

Where a collection is both fetched by id and queried, the two halves get separate
rules: `bids` reads its id for a `get`, and the `player` field the query filters
on for a `list`. Where a collection is only ever fetched by id, the rule says
`get`, and a query is refused outright rather than erroring.

Firestore also has no `where` clause on `match` paths, so collections that share
a rule still need one `match` statement each.

The **emulators enforce the rules**, so a client write they refuse fails on a
developer's machine rather than in front of a player. See the emulator section of
the [README](../../README.md).

### Testing them

The rules language has no interpreter outside the emulator, so
[`test/firestore/rules.test.ts`](../../test/firestore/rules.test.ts) asks the
engine itself. For each collection it checks whether the owner may read it,
whether anybody else may, whether a query is refused where only a `get` was
granted, and whether the client is kept out of the writes.

Run them with `pnpm test:rules`, which starts a Firestore emulator around the run
and stops it afterwards. They are kept out of `pnpm test` because they are the
only tests that need something running — an emulator, and therefore a JDK. The
run **empties the store between cases**, which is why it wants an emulator of its
own: pointed at one that is already up, it takes that data with it.
`FIRESTORE_EMULATOR_PORT` moves it to a spare port when there is a development
emulator to leave alone.

Two things worth knowing that the tests settled:

- A profile write that names `gold` **at the value it already holds** is allowed.
  `affectedKeys()` is a diff, so a field rewritten with what was there is in no
  key set at all. Nothing changes hands, and refusing it would refuse a client
  that sends the whole document back.
- Under `allow get` alone, a query is refused rather than returning the caller's
  own document, including for the player who owns it. That is the intent, and it
  is why collections that are genuinely queried, like `bids`, carry a separate
  `list` rule filtered on a field.

## Required indexes

A player's bag needs none. `bags/{uid}` is read by id, and its two maps are
**exempted from indexing**: a key per item id would be an index entry per item
id, and nothing asks the store which players hold a Master Ball.

[`firestore.indexes.json`](../../firestore.indexes.json) declares five composite
indexes; the rest of the queries below run on Firestore's automatic single-field
indexes.

| Collection       | Fields                         | Declared | Reason                                      |
| ---------------- | ------------------------------ | -------- | ------------------------------------------- |
| `caught`         | `owner` ASC                    | No       | `listCaught`; automatic single-field index  |
| `caught`         | `owner` ASC, `species` ASC     | Yes      | `hasCaughtSpecies`, the Repeat Ball's check |
| `caught`         | `owner` ASC, `shiny` ASC       | Yes      | `listCaughtMarked`, one per mark asked for  |
| `caught`         | `owner` ASC, `auctionable` ASC | Yes      | The auction sell picker, the same way       |
| `teams`          | `player` ASC                   | No       | `listTeams`; automatic single-field index   |
| `teams`          | `player` ASC, `catches` ARRAY  | Yes      | `isAnyCatchQueued` filters on both          |
| `raids`          | `timestamp` ASC, `offset` ASC  | Yes      | `listLiveRaids` filters on both             |
| `battles`        | `players` ARRAY                | No       | `listBattleHistory`; automatic array index  |
| `raidRewards`    | `player` ASC                   | No       | `listClaimedRaids`; automatic single-field  |
| `auctions`       | `settled` ASC                  | No       | `watchOpenAuctions`; automatic              |
| `auctions`       | `seller` ASC                   | No       | `listAuctionsBy`; automatic                 |
| `bids`           | `player` ASC                   | No       | `listBidHistory`; automatic                 |
| `friends`        | `owner` ASC                    | No       | `watchFriends`; automatic single-field      |
| `friendRequests` | `to` ASC / `from` ASC          | No       | `watchFriendRequests`, one query each way   |
| `blocks`         | `blocker` ASC                  | No       | `watchBlocked`; automatic single-field      |
