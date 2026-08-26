# Player-owned tables

## `profiles`

One row per account, keyed by the auth uid. Set by
[`src/auth/profile.ts`](../../src/auth/profile.ts). A bare row is written by a
trigger the moment the account is created, so a foreign key never waits on the
app having run.

| Column       | Type      | Notes                                 |
| ------------ | --------- | ------------------------------------- |
| `id`         | `uuid`    | The account, `references auth.users`  |
| `nickname`   | `text`    | Display name; defaults to `"Trainer"` |
| `avatar`     | `text`    | Avatar URL, null when unset           |
| `gold`       | `bigint`  | Currency balance; opens at zero       |
| `role`       | `text`    | Staff standing; empty for a player    |
| `banned`     | `boolean` | Whether the account is shut out       |
| `ban_reason` | `text`    | What the player is told on the way in |
| `buddy_id`   | `text`    | The `caught` row walking beside them  |

Anyone signed in may read it, since other players see nicknames and avatars. The
owner writes their own `nickname`, `avatar` and `buddy_id`, and nothing else:
that limit is a **column grant** rather than a policy, because a policy can only
choose rows.

`role`, `banned` and `ban_reason` are the server's alone, see
[Roles](security.md), and the insert policy refuses a row that arrives with a
role, a balance or a ban already on it.

The balance is not the player's to write. `grantGold` and `spendGold` live in
[`src/server/profile.ts`](../../src/server/profile.ts) and read the row `for
update` inside a transaction, so two rewards landing together cannot clobber each
other.

### Looking at somebody else

The row is public, so a trainer met in the middle of something, a party in a raid
lobby or a lot on the auction board, can be opened as the profile they already
have. [`ProfileDialog`](../../src/components/profile/ProfileDialog.tsx) holds the
uid being visited (`game.visiting()`), names the panel by their nickname, and
renders the ordinary [`ProfileTab`](../../src/components/profile/ProfileTab.tsx)
with `viewOnly` set. That flag travels down to the buddy card and the battle
history and removes everything that writes: the sign-out, the buddy swap, and the
button that collects what a won raid still owes.

None of it is a permission. The policies refuse every one of those writes for
anybody but the owner, and the server refuses them again. The flag only stops a
reader being offered a button that could not work.

A visitor is left with who the player is, who walks with them, and what they have
fought. There is no tab bar over it, since a bar holding one tab decides nothing.
**Bids** stay private: a `bids` row is readable by the player who placed it.
The **bag** is not on the profile at all and is private the same way. Their
**catches** are readable, since `caught` is public and that is what makes a lot on
the block worth bidding on, but the visited profile does not show them. The box
behind the menu is only ever the reader's own.

## `bag_items` and `bag_candies`

Everything a player is carrying: one row per kind, keyed by the player and the id
of the thing.

| Column   | Type      | Notes                                        |
| -------- | --------- | -------------------------------------------- |
| `player` | `uuid`    | Owner, part of the primary key               |
| `item`   | `integer` | Item id (`bag_candies` names a `family`)     |
| `count`  | `integer` | How many are carried, constrained above zero |

Read through [`src/auth/inventory.ts`](../../src/auth/inventory.ts) and
[`src/auth/candy.ts`](../../src/auth/candy.ts), written only by
[`src/server/stacks.ts`](../../src/server/stacks.ts). Both tables are currency:
one mints Master Balls and the other mints levels.

**A stack spent to its last is deleted**, never left sitting at zero, and the
`count > 0` check is what holds it. The bag holds what is carried and nothing
else, so a picker never has to filter empties out.

### How a stack is read and written

[`src/auth/stacks.ts`](../../src/auth/stacks.ts) says which table a kind lives in
(`ITEM_STACKS`, `CANDY_STACKS`) and reads one out: `getStack` for a count,
`listStacks` for the id-count pairs every picker wants.

[`src/server/stacks.ts`](../../src/server/stacks.ts) has two layers, because most
callers change a stack **and something else** in one breath: an item leaves the
bag as a move is learned, a candy leaves the pile as a level lands. Those take
`readStackIn` / `writeStackIn` / `spendStackIn` and pass their own transaction.
The rest take `grantStack` / `spendStack` / `grantStacks`, which are single
atomic statements.

A row a transaction means to write is read `for update`, which locks it. Postgres
does not retry a transaction the way the old optimistic store did, so the lock is
what keeps two writes to the same stack from interleaving.

`useCandy(catchId)` spends `getCandyCost(caught)` candies to raise a catch by a
level: one for an ordinary catch, two for a shadow. It reads the catch and the
stack, then writes both **inside one transaction**, so a candy can never be spent
without the level landing. It resolves the new level, or null when the catch is
not the user's, its species' family does not match a stack the user holds, the
stack is empty, or the catch already sits at `MAX_LEVEL`
(`src/data/constants/levels.ts`).

Private: only the owning uid may read the stacks, and only the server may write
them or the catch the level lands on.

### What a catch pays

Every catch pays `getCatchCandy` of its own family: the species' spawn rarity
band counted from one, so one for a base stage and five for a legendary, and
four times that on the family's own day. On top of that, `recordCatch` asks the overworld engine
`checkCatchCandy` what the player was **carrying** at the time. Two held items
answer it, each paying one candy half the time:

- **Exp. Share** pays the _buddy's_ family, so everything caught feeds the one
  pokemon being raised.
- **Lucky Egg** pays the _caught_ pokemon's family, so it fills out a dex faster.

Neither is touched by the species day. It already pays four times over on the
catch itself, and a bonus that multiplied with it would make one day worth a week
of ordinary ones. Both are paid through `grantCandy` (flat) rather than
`grantCatchCandy` (boosted), and each is one candy however many families are
owed. A catch holds one item at a time, so the two are a choice rather than a
stack. The effects live in
[`src/overworld/items/candy-items.ts`](../../src/overworld/items/candy-items.ts)
and register themselves the way every other buddy effect does.

## The buddy, on the profile

Set by [`src/auth/buddy.ts`](../../src/auth/buddy.ts) through the profile's
`buddy_id`: the `caught` row walking at the player's side, or null when they walk
alone.

It is a column rather than a table of its own because it is read on nearly
**every** overworld action: every encounter derivation asks what the buddy
changes, every catch asks what it is carrying, every step report asks what is
being walked. A table would be a second read for one id, on the hottest path in
the game.

Two triggers hold it honest. `buddy_owner` refuses a buddy that is not the
setter's own catch, on insert and on update. `buddy_follows_owner` clears it when
the catch changes hands, so an auctioned or traded buddy stops walking beside its
old owner without anybody remembering to look. The foreign key adds the third
case: a released catch nulls the column by cascade.

An **egg** may be the buddy, and has to be: steps only count for what walks
beside the player. `resolveBuddy` reports no field effects for one, though, since
it is carried rather than accompanied. See [Eggs](catches.md#eggs).

## `positions`

Read through [`src/auth/positions.ts`](../../src/auth/positions.ts), written by
[`src/server/positions.ts`](../../src/server/positions.ts). One row per player,
and **the only mutable record of anybody's place in the world**: everything else
the overworld holds derives from a seed and a window.

| Column     | Type       | Notes                                         |
| ---------- | ---------- | --------------------------------------------- |
| `player`   | `uuid`     | Owner, and the primary key                    |
| `chunk_x`  | `integer`  | Chunk coordinate, clamped to the world        |
| `chunk_y`  | `integer`  | The same                                      |
| `cell_x`   | `smallint` | Cell column within the chunk, 0 to 15         |
| `cell_y`   | `smallint` | Cell row within the chunk, 0 to 15            |
| `moved_at` | `bigint`   | When it was last written, on the server clock |

It exists for one reason: a player who walked forty chunks, or spent a Portal Key
crossing the world, should not be put back at their starting point by a page
reload.

A player with **no row yet** is dropped somewhere random in the starting region
by `pickStartPosition` ([`src/overworld/start.ts`](../../src/overworld/start.ts)).
The draw uses a random seed rather than their uid, so two players who arrive
together arrive in different places, and that position is **written immediately**,
so the dice are rolled once and returning is returning.

Steps and position settle **together**. The paces an egg has walked are reported
in batches while a walk is in progress, and flushed, batch or not, the moment the
position is written, so a player never comes back further along the map than
their egg is along its walk. A portal crossing settles the same way: the walk to
the portal counts, and the crossing itself adds no steps. Either way the server
bounds a step report by the time since the last one (`creditableSteps`), so
nothing about moving a position can be turned into progress on an egg.

It is **the client's word**, deliberately. The server clamps the coordinates to
somewhere that exists and stamps the time; it does not check the walk, because
positions are written every `SAVE_DELAY` (1.5s) rather than every step and there
is no path in them to check. Nothing in the game trusts a position: reaching a
landmark is checked against the landmark and its window, a spawn against the
stored row, a portal against the chunk seed. A player who lies about where they
are stands somewhere they are not and finds exactly what is there. See
[Reaching, not treading](overworld.md#reaching-not-treading).

Private to the owning uid, and read-only to them.

## `pokedex_entries`

What a player has met and what they have kept: one row per species they have any
count for. Read through
[`src/auth/pokedex.ts`](../../src/auth/pokedex.ts) and written only by the
server, because a dex is the game's record of what actually happened and a client
that could write one could claim to have faced a Mewtwo it never met.

| Column         | Type      | Notes                             |
| -------------- | --------- | --------------------------------- |
| `player`       | `uuid`    | Owner, part of the primary key    |
| `species`      | `integer` | The species counted               |
| `seen`         | `integer` | How many were ever met            |
| `seen_shiny`   | `integer` | The sparkling ones, counted apart |
| `caught`       | `integer` | How many were ever owned          |
| `caught_shiny` | `integer` | The sparkling ones, counted apart |

The counts are **historical**: releasing a Pidgey or losing one to an auction
leaves the dex exactly as it was. The `dex_monotonic` trigger makes that a rule
rather than a convention, refusing any update that takes a count down. A shiny is
counted only in its own column, so a species' total is the two added together.

Private to the owning uid, and read-only to them.

### What the screen makes of it

The dex sits behind the menu, beside the catches: a box is what somebody has, and
a dex is what there is. [`PokedexTab`](../../src/components/dex/PokedexTab.tsx)
reads the rows once and draws **every base form in the registry**, one entry per
pokemon rather than one per costume, which is the rule `getBaseForms` already
counts a dex by. They are a grid of squares in dex order, thirty at a time, in
the same six-by-five box the collection is kept in.

Each square is in one of three states, and the gaps are the point: a number alone
for a species never met, its own silhouette for one met and never kept, and the
pokemon itself for one that has been owned.

Opening a square opens [`DexEntryDialog`](../../src/components/dex/dex-entry-dialog/index.tsx):
both coats (each a silhouette until it has been owned), the category, the height
and weight, the family's candy the reader is holding, the abilities, the base stats,
**where it lives**, and everything it can learn.

"Where it lives" is the spawn pools read backwards. Every other reader asks a
biome what lives in it; `listSpeciesHabitats` in
[`src/data/biome/__create.ts`](../../src/data/biome/__create.ts) sweeps every pool
of every biome at every hour once, keeps the index, and answers the opposite question:
which biome, at which hour, out of which rarity band. The index is
thrown away whenever a pool is registered, so it cannot go stale.

Something met around the clock at the same odds says **Anytime** rather than the
same badge four times. A species with a **lair**, the four legendaries and Mew,
is named by the place first: since a player who came to that entry came for
[Cerulean Cave](../../src/data/overworld/lair.ts), not for the odds of walking
into one.

## `fled_encounters`

Written by `markFled` in
[`src/server/overworld.ts`](../../src/server/overworld.ts), read through
[`src/auth/safari.ts`](../../src/auth/safari.ts). The key is recomputed from the
stored encounter, so a player cannot retire a meeting they never had.

| Column      | Type     | Notes                                    |
| ----------- | -------- | ---------------------------------------- |
| `player`    | `uuid`   | Owner, part of the primary key           |
| `key`       | `text`   | The encounter key scared off             |
| `window_at` | `bigint` | The window that staged it, for the sweep |

An encounter key is `` `${x},${y}@${timestamp}:${individualValue}` `` (see
`encounterKey` in [`src/overworld/safari.ts`](../../src/overworld/safari.ts)).

A key carries the window that staged the spawn, and a spawn is gone when its
window turns over, so anything older than `FLED_MEMORY` (1 hour) can never match
again. **A pg_cron job sweeps those rows hourly**, and readers filter by the same
hour themselves, so the sweep is hygiene rather than correctness. It is an hour
rather than one 5-minute window because the windows are **local**: a player who
crosses a zone reads a clock offset from the one their last key was written
against.

Private to the owning uid, and read-only to them.
