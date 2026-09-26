# Security

## The server is the only door

The browser never reaches the database. [`src/server/*`](../../src/server) reads
and writes over one Postgres connection as the **table owner**
([`src/server/db.ts`](../../src/server/db.ts)), and there are no row policies
behind it. Every rule about who may see or change a row is in a server function.

The client reaches the server through `'use server'` functions that take the
caller's token: the short-lived JWT Better Auth signs
([`src/server/better-auth.ts`](../../src/server/better-auth.ts)). A write
resolves it with `requireUid`, and a read with `requireReader`
([`src/server/auth.ts`](../../src/server/auth.ts)). The signature is checked
against Better Auth's own keys, so no round trip is needed. A uid passed
alongside a call is never trusted; only what the token proves is.

| Written on the server                                    | What a client could not be trusted with                                                                                                                                                             |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `recordCatch`                                            | The record is built from the caller's own `encounters` row, so the pokemon written down is the one that was staged, not one the caller describes                                                    |
| `grantItem` / `consumeItem`                              | Item stacks are currency; a client that could write them could mint Master Balls                                                                                                                    |
| `grantGold` / `spendGold`                                | The same, for the balance                                                                                                                                                                           |
| `grantCandy` / `useCandy`                                | A candy buys a level, so minting candy mints levels                                                                                                                                                 |
| `giveItem` / `takeItem`                                  | The bag and the catch have to move together, in one transaction                                                                                                                                     |
| `releaseCatch`                                           | The record is deleted, its held items go back to the bag and the profile's buddy is cleared if it named the released catch, all at once                                                             |
| `evolveCatch`                                            | The criteria (level, held item, carried item) span several tables                                                                                                                                   |
| `claimItemCache` / `claimBerryPatch` / `claimPhenomenon` | The reward derives from the chunk seed and the **stored** window; a claim against a cell that holds nothing, or a window that has passed, pays nothing                                              |
| `startEncounter` / `meetSpawn`                           | The spawn is read from the shared table and has to belong to the chunk's live window                                                                                                                |
| `markFled`                                               | The key is recomputed from the stored encounter                                                                                                                                                     |
| `peekRaid`                                               | Reads only, but reads what the world staged: what a lair holds, and whether this player may host, join or only watch, is not a client's to decide                                                   |
| `joinRaid`                                               | Catch ids are readable by every player, so ownership is checked where a client cannot skip it                                                                                                       |
| `startRaid`                                              | Only the host may start; teams are frozen from the stored catches                                                                                                                                   |
| `finishBattle`                                           | Only a player who fielded a team may stamp an outcome, and only the first report counts                                                                                                             |
| `hostMythicalRaid`                                       | The relic is checked and spent server-side before the lobby exists, so one raid item opens one raid whatever becomes of it                                                                          |
| `enterRocketStop` / `startRocketBattle`                  | The grunt's party is the chunk's own roll for the window, and the fight freezes the player's party the way a raid does                                                                              |
| `claimRocketReward`                                      | Gold and a pokemon change hands on a win the server checks, and the `defeated` flag pays exactly once                                                                                               |
| `recordAftermath`                                        | What a unit spent, and what health it has left, are checked against the frozen snapshot and the record; each player settles once per battle                                                         |
| `clearRaid`                                              | A landmark shuts only for a battle actually recorded as won                                                                                                                                         |
| `claimRaidReward`                                        | Participation, the win, and the one-claim marker are all in different tables                                                                                                                        |
| `claimNest`                                              | A nest hands over one egg per player per half day, and what is inside it is decided as the server writes it                                                                                         |
| `teachMove`                                              | Which move a machine teaches, whether the species can learn it and whether the machine is carried are all decided again from the stored record, and the machine leaves the bag in the same write    |
| `learnLevelUpMove`                                       | The move has to be one the species learns at exactly the level the stored record sits at, so nothing older can be had for free. That is the Move Reminder's trade, and it costs a Heart Scale       |
| `remindMove`                                             | The Move Reminder is re-derived from the window, what he can give back is derived again from the stored species, level and move list, and the Heart Scale leaves the bag in the same write          |
| `buyFossil`                                              | Which two fossils the maniac carries is re-derived from his window, the visit is claimed before the trade, and the gold and the rock move in one transaction                                        |
| `reviveFossil`                                           | What comes out of a fossil belongs to the fossil and arrives at a fixed level, and the rock leaves the bag before the record is written, and goes back if it never is                               |
| `walk`                                                   | Steps are credited against the server clock, so a report buys no more than the time since the last one, and what a Pickup buddy found is the server's own roll, landing in the same transaction     |
| `hatchEgg`                                               | An egg opens only where the record says it has been carried far enough, and the candy is paid there too                                                                                             |
| `breedCatches`                                           | Who is standing at the cell, whether the pair can breed and what the egg inherits are all decided server-side; the once-a-window visit is claimed before the fee is taken                           |
| `boostEgg`                                               | The daycare lady is re-derived from the window, the half a walk she adds is measured against the stored egg, and she serves a player once per window                                                |
| `useBottleCap`                                           | Which values a cap raises is the server's roll, and the cap leaves the bag in the same transaction the stats are written in                                                                         |
| `useHealingItem`                                         | The item leaves the bag and the health it restores lands on the catch in one transaction, and only an item that would do something is spent                                                         |
| `openAuction`                                            | The lot leaves the seller's hands as the listing is written, and the `auction_sellers` row is what holds them to one auction at a time                                                              |
| `placeBid`                                               | Gold moves as the bid lands: the outbid one is refunded and the new one taken in the same transaction, so a standing bid is money already paid                                                      |
| `claimAuction`                                           | Who won, whether bidding has closed, and the one-claim `settled` flag are all read where a client cannot skip them, and the seller is paid from the same claim                                      |
| `reclaimAuction`                                         | Only the seller, only once bidding has closed with nobody having bid, and only through the same `settled` flag a collection pass uses, so a lot cannot be pulled off the block or handed back twice |
| `usePurifyingGem`                                        | The shadow field, the ability and the values move together with the gem leaving the bag, so a rare item is never spent on a pokemon that did not change                                             |
| `visitNurse`                                             | Who is standing at the cell is re-derived, and the once-a-window marker is taken only once she has actually done something                                                                          |
| `usePortal`                                              | The cell has to really be a portal in a live window, the far end is re-derived rather than accepted, and the key is taken only once the crossing is known to be real                                |
| `savePosition`                                           | A client that could write this row could write anybody else's; the coordinates are clamped to somewhere that exists, and nothing about the walk is checked because nothing trusts a position        |

Every module under `src/server` opens with `import 'server-only'`. SolidStart
resolves that marker itself: an empty module on the server, and a **build
failure** in the client bundle naming the file that reached across. The boundary
is enforced by the build rather than by remembering where an import came from.

Two things a player sets for themselves still go through the server, like
everything else:

- **Profile details.** Nickname and buddy are the player's to set. The purse in
  the same row is not, and neither is `role`, `banned`, `title` or `sprite`. The
  functions that write the two write nothing else.
- **Buddies.** A trigger checks that the catch named belongs to the player
  setting it.

The shared spawn window is published by whichever client finds it stale. The
rolls are deterministic from the chunk seed and the window, so an honest client
writes the same set and a dishonest one only lies to itself: the server
re-derives every reward from the seed regardless.

## Who may read what

The server functions that read apply three tiers. The live feed applies the same
ones to what it sends ([`src/server/live/rules.ts`](../../src/server/live/rules.ts)).

| Tier                  | Tables                                                                                                                                                                                                                                                                                    | Who reads                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **Public to players** | `caught` and its children, `snapshots`, `snapshot_spawns`, `auctions`, `raids`, `teams`, `team_catches`, `team_snapshots`, `battles`, `battle_teams`, `rocket_stops`, `rocket_party`, `gym_seats`, `raid_watchers`, `awards`, `towns`, `profiles`                                         | Any signed-in player        |
| **Own rows only**     | `bag_items`, `bag_candies`, `pokedex_entries`, `positions`, `fled_encounters`, `encounters` and its children, `bids`, `auction_sellers`, `friends`, `friend_requests`, `blocks`, `friend_codes`, `trades`, `raid_invites`, `gym_challenges`, the four duel tables, and every claim marker | The player named on the row |
| **Server only**       | `gifts`, `gift_claims`, the quest and rotation tables, and the account tables (`users`, `sessions`, `identities`, `verifications`, `jwks`)                                                                                                                                                | Nobody but the server       |

A few consequences worth having in hand:

- **A catch is public.** Any signed-in player can read any pokemon record, which
  is what lets an auction lot, a raid party and a trainer's profile show real
  pokemon.
- **A block is readable by the blocker alone.** Nothing tells the blocked player.
  See [`friends.md`](./friends.md).
- **A duel is visible to its host, its members and whoever was called into it.**
  Anybody else following the tables gets only the lobby's id. See
  [Battle lobbies](duels.md).
- **Where a trainer stands** is shown through a server read of one row for one
  uid, since a player's own position is otherwise theirs alone.

### What the database refuses outright

Some rules are not server code but constraints, so a bug on the
server cannot break them either:

| Guard                                 | What it holds                                                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `write_once` triggers                 | Claim markers, raid rewards, aftermath markers and team snapshots never change                                                  |
| `append_only` on `caught_history`     | History is insert-only, with one lawful update: the cascade that nulls a deleted account                                        |
| `settle_once` on `battles`            | An outcome stamps once, from Unfinished, and nothing else on the row moves                                                      |
| `dex_monotonic`                       | Pokedex counts only rise                                                                                                        |
| `trades_open_pair`                    | One open trade offer per direction of a pair                                                                                    |
| `buddy_owner` / `buddy_follows_owner` | A buddy must be an owned catch, and stops following when the catch changes hands                                                |
| `gift_claims` backfill guard          | A claim may be updated exactly once, to record the catch it became, and again to lose that pointer when the pokemon is released |
| Column checks                         | Gold never negative, levels 1 to 100, friendship 0 to 255, a bid above zero                                                     |
| Foreign keys                          | A team names a real catch; deleting an account takes its rows with it                                                           |

### The live feed

The browser follows live tables over the server's own socket
([`src/server/live`](../../src/server/live)). A trigger on each followed table
sends its changes to the server, which passes each one on as its reader may see
it: whole for a public row or the reader's own, and only its keys otherwise.

The feed carries changes only, never current state, so the watch helpers in
[`src/auth/watch.ts`](../../src/auth/watch.ts) do the first read themselves and
read again on every reconnect. A dropped socket therefore cannot leave a stale
screen.

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

What separates them is who they may act **on**: strictly below themselves. An
admin cannot ban or demote another admin, a moderator cannot touch a moderator,
nobody touches the owner, and nobody may take their own authority off, since an
account that could would be one nobody can give it back to. The owner's own role
is granted where the project is deployed rather than from any screen.

The checks live on the server: `requireStaff` for anything the dashboard reads,
`requireAdmin` for anything that runs the game, and `setRole`/`setBan` compare
the caller's stored role against the target's before writing. The dashboard hides
what a role cannot use, which is a courtesy rather than a defence.

### What staff did is kept, if the server wants it

With the server's `STAFF_LOG` variable on, every role set, ban, gift and
teleport is written to `staff_actions` once it has landed: who acted, on whom,
the particulars, and when. It is rAthena's `atcommandlog`. A line that cannot be
written is dropped rather than undoing the action, and only the server reads or
writes the table. With the variable off it stays empty.

### A ban is one line

`banned` on the profile, written by the server alone. `requireUid` refuses a
banned account before it reads anything, and **every** privileged call passes
through it, so one check shuts all of them rather than each remembering to ask.
A banned player can still sign in and read: the game tells them they are banned
and why, since a ban that looked like a broken game would be worse than one that
says so.

### Switches close a part of the game

`switches` has one row per part of the game (`auctions`, `trades`, `stops`,
`raids`, `duels`, `gym-seats`, `gifts`, `townsfolk`, `catching`, `claims`) and
one for `everything`. Ticking `closed` on a row in the dashboard closes that
part at once, without a deploy, which is the answer to an exploit found before
its fix can ship. `message` is what players are told; an empty one uses the
game's own line.

The server reads the switches in the same statement as the ban check and the
paces, so they cost no round trip. A server function that **starts** something
names its part through `requireUidFor(token, Feature.Auctions)`; one that
leaves, cancels, reads, collects what is owed or settles a fight already under
way calls `requireUid` and is never refused, so closing a part strands nobody
halfway through it. `everything` is maintenance: every call from a player
without a role is refused, and staff still get in to check the game before it
opens again. The feature list lives in
[`src/server/switches.ts`](../../src/server/switches.ts).

A server call refused by a closed part says so, and only staff change a switch.

### Testing it

[`test/db/`](../../test/db) runs the server modules against a real Postgres:
the writes above, the switches, the paces and the sweeps. `pnpm test:db` starts
the tests' own instance and migrates it, and refuses any database whose name does
not end in `_test`, so it never reaches development or production data. It
**clears the game rows between cases**, so it runs one file at a time and apart
from the e2e suite, which shares that instance.

## Indexes

Every table's primary key is an index already, and most reads are a key lookup:
a bag row is `(player, item)`, an encounter is `(spawn_id, player)`, a claim
marker is `(marker, player)`. What follows is what the schema adds on top.

| Table             | Index                                                        | Answers                                                     |
| ----------------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| `caught`          | `(owner)`, `(owner, caught_at_local)`                        | A trainer's collection, newest first                        |
| `caught`          | `(owner, species)`                                           | The Repeat Ball's check                                     |
| `caught`          | `(owner, level)`, `(owner, friendship)`, `(owner, iv_total)` | Box searches that sort or filter on one field               |
| `caught`          | Trigram on `nickname` and `origin_place`                     | Substring search, which no ordinary index answers           |
| `caught_moves`    | `(move)`, and the same for abilities, items and types        | A search running from the move to the pokemon that knows it |
| `caught_history`  | `(owner_name)`                                               | Finding what a story trainer once owned                     |
| `profiles`        | `(buddy_id)`                                                 | Clearing a buddy that changed hands                         |
| `snapshots`       | Primary key `(chunk_seed, zone)`                             | The chunk a player is standing in                           |
| `fled_encounters` | `(window_at)`                                                | The hourly sweep                                            |
| `raids`           | `(window_at, utc_offset)`                                    | The live raid board                                         |
| `teams`           | `(player)`, `(raid_id)`                                      | A player's lobbies, and a lobby's parties                   |
| `team_catches`    | `(caught_id)`                                                | Whether a pokemon is queued in any lobby                    |
| `battle_teams`    | `(player)`                                                   | A player's battle history                                   |
| `auctions`        | `(ends_at) where not settled`, `(seller)`                    | The live board, and a seller's own lots                     |
| `friend_requests` | `(recipient)`                                                | Requests waiting on a player                                |
| `gifts`           | `(player)`, `gift_claims (player)`                           | A player's shelf, and what they have taken                  |

Postgres combines single-column indexes with each other, which is why one index
per field is enough here where the document store needed one per combination of
fields. The box search leans on that: it pushes whatever narrows into the query
and filters the rest in memory.

Three shapes are not queryable as stored, and the search migration answers each:
bits inside a packed integer become **generated columns** (the six individual
values, the six carried statuses, the steps an egg has left), a difference
between two columns becomes one as well, and a substring of a name gets a
**trigram index**.
