# Security

## Privileged writes

Anything that creates or moves value is written by the server rather than the
browser. [`src/server/*`](../../src/server) talks to Postgres over a direct
connection as the **table owner** ([`src/server/db.ts`](../../src/server/db.ts)),
and an owner is not bound by row-level security. That is the Supabase shape of
the old admin bypass, and it is why every policy in the schema describes a
browser and nothing else.

The client reaches those writes through `'use server'` functions that take the
caller's Supabase access token and resolve it with `requireUid`
([`src/server/auth.ts`](../../src/server/auth.ts)). The token's signature is
checked locally, against `SUPABASE_JWT_SECRET` for an HS256 token and against
the project's published JWKS otherwise, so no round trip is needed. A uid passed
alongside a call is never trusted; only what the token proves is.

| Written on the server                                    | What a policy could not enforce                                                                                                                                                                     |
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

The writes need `SUPABASE_DB_URL`. `SUPABASE_SERVICE_ROLE_KEY` is needed only
for the auth admin API: looking a player up by the email they signed up with,
and the staff dashboard's account list. Without it those two refuse and
everything else runs. See `.env.example`.

Three things stay client-side by design:

- **Shared-world publishing**, the snapshot window and the spawns it rolled,
  goes through the `publish_snapshot` function rather than a table write. The
  function checks the shape, refuses to move a window backwards, and swaps the
  spawn rows atomically. The rolls are deterministic from the chunk seed and the
  window, so an honest client recomputes the same set and a dishonest one only
  lies to itself: the server re-derives every reward from the seed regardless.
- **Profile details.** Nickname, avatar and buddy are the player's to set. The
  purse in the same row is not, and neither is `role` or `banned`. This is
  enforced by **column grants** rather than by a policy, because a policy can
  only say which rows may be written, not which columns:
  `grant update (nickname, avatar, buddy_id) on profiles to authenticated`.
- **Buddies.** Setting one is a preference, and a trigger checks that the catch
  named belongs to the player setting it.

## Row-level security

[`supabase/migrations/20260820000900_rls.sql`](../../supabase/migrations/20260820000900_rls.sql)
holds the whole security surface in one file, the way the old ruleset did, and it
is the authority; this page describes it. Every table has RLS enabled, and there
are **no insert, update or delete policies** anywhere except on `profiles`. A
browser reads; the server writes.

Three tiers:

| Tier                  | Tables                                                                                                                                                                                                                                                                                    | Who reads                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **Public to players** | `caught` and its children, `snapshots`, `snapshot_spawns`, `auctions`, `raids`, `teams`, `team_catches`, `team_snapshots`, `battles`, `battle_teams`, `rocket_stops`, `rocket_party`, `gym_seats`, `raid_watchers`, `awards`                                                              | Any signed-in player        |
| **Own rows only**     | `bag_items`, `bag_candies`, `pokedex_entries`, `positions`, `fled_encounters`, `encounters` and its children, `bids`, `auction_sellers`, `friends`, `friend_requests`, `blocks`, `friend_codes`, `trades`, `raid_invites`, `gym_challenges`, the four duel tables, and every claim marker | The player named on the row |
| **Closed**            | `gifts`, `gift_claims`, `quest_progress`, `quest_claims`, `rotation_baselines`, `rotation_claims`                                                                                                                                                                                         | Nobody                      |

`profiles` sits outside the three: everyone signed in reads every profile,
because a trade or a raid lobby starts with looking somebody up, and a player may
insert their own with an empty purse and no role, then update only the three
columns granted above.

A few consequences worth having in hand:

- **A catch is public.** Any signed-in player can read any pokemon record, which
  is what lets an auction lot, a raid party and a trainer's profile show real
  pokemon without a server call for each.
- **Claim markers are private.** Each is scoped to the player named on it. The
  old ruleset let any signed-in player list them, which was a leak rather than a
  feature.
- **A block is readable by the blocker alone.** Nothing tells the blocked player.
  See [`friends.md`](./friends.md).
- **Gifts are invisible.** RLS is on with no policy at all, so a browser reading
  the table gets nothing back. Offers and claims travel through the server, and a
  client that could write its own claim could take an open gift as often as it
  liked.
- **`positions` is private to its owner**, which is right for a table a client
  could otherwise sweep, and wrong for the profile a raid lobby opens. Where a
  trainer is standing is shown through a server call that reads one row for one
  uid.

A duel's four tables are the one place a policy cannot say the condition
directly: a policy on `duel_members` that reads `duel_members` is recursion,
which Postgres refuses. `in_duel(duel, player)` is a `security definer` function
standing in for it. See [Battle lobbies](duels.md).

### Grants back the policies

Supabase hands the client roles nothing by default, so the grants are explicit:
`select` on every table for `authenticated`, everything for `service_role`, and
on `profiles` the three-column `insert` and `update` above.

The blanket `grant ... on all tables` in the RLS migration only reached the
tables that existed then, so **every table added since names its own grants**.
A new table without them is readable by nobody, whatever its policy says. A policy decides
which **rows**; a grant decides which **columns** and which verbs. Both are
needed, and the column grant is the half that keeps a player from writing their
own balance.

### What the database refuses outright

Some rules are neither policy nor server code but constraints, so a bug on the
server cannot break them either:

| Guard                                 | What it holds                                                                            |
| ------------------------------------- | ---------------------------------------------------------------------------------------- |
| `write_once` triggers                 | Claim markers, raid rewards, aftermath markers and team snapshots never change           |
| `append_only` on `caught_history`     | History is insert-only, with one lawful update: the cascade that nulls a deleted account |
| `settle_once` on `battles`            | An outcome stamps once, from Unfinished, and nothing else on the row moves               |
| `dex_monotonic`                       | Pokedex counts only rise                                                                 |
| `trades_open_pair`                    | One open trade offer per direction of a pair                                             |
| `buddy_owner` / `buddy_follows_owner` | A buddy must be an owned catch, and stops following when the catch changes hands         |
| `gift_claims` backfill guard          | A claim may be updated exactly once, to record the catch it became                       |
| Column checks                         | Gold never negative, levels 1 to 100, friendship 0 to 255, a bid above zero              |
| Foreign keys                          | A team names a real catch; deleting an account takes its rows with it                    |

### Realtime is RLS

The browser follows live tables over `postgres_changes`, which checks the same
policies per socket: a stream only carries rows the reader may already select.
The published set is listed in the realtime migration and in the migrations that
added tables since: `battles`, `auctions`, `raids`, `teams`, `battle_teams`,
`snapshots`, `snapshot_spawns`, `friends`, `friend_requests`, `blocks`,
`profiles`, `trades`, `raid_invites`, `raid_watchers`, `gym_seats`, and the four
duel tables.

The stream carries changes only, never current state, so the watch helpers in
[`src/auth/supabase.ts`](../../src/auth/supabase.ts) do the first read
themselves and re-read on every resubscribe. A dropped socket therefore cannot
leave a stale screen.

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

### A ban is one line

`banned` on the profile, written by the server alone. `requireUid` refuses a
banned account before it reads anything, and **every** privileged call passes
through it, so one check shuts all of them rather than each remembering to ask.
A banned player can still sign in and read: the game tells them they are banned
and why, since a ban that looked like a broken game would be worse than one that
says so.

### Testing the policies

[`test/rls/rls.test.ts`](../../test/rls/rls.test.ts) asks Postgres itself. It
signs two real accounts in against the local stack, then for each table checks
whether the owner may read it, whether a stranger may, whether a guest may, and
whether the client is kept out of every write.

Run them with `pnpm test:rules`, which needs a local stack up (`pnpm db`). They
are kept out of `pnpm test` because they are the only tests that need something
running, and because the run **clears the game rows between cases**: pointed at a
stack the e2e suite is using, it would delete the accounts those browsers are
signed in as. One file at a time, for the same reason.

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
