# Player-owned stores

## `profiles/{uid}`

Set by [`src/auth/profile.ts`](../../src/auth/profile.ts), and created on first
sign-in from whatever the auth provider knows.

| Field       | Type             | Notes                                      |
| ----------- | ---------------- | ------------------------------------------ |
| `nickname`  | `string`         | Display name; falls back to `"Trainer"`    |
| `avatar`    | `string \| null` | Avatar URL, `null` when unset              |
| `gold`      | `number`         | Currency balance; starts at zero           |
| `role`      | `string`         | Staff standing; empty for a player         |
| `banned`    | `boolean`        | Whether the account is shut out            |
| `banReason` | `string`         | What the player is told on the way in      |
| `buddy`     | `string`         | The `caught/{catchId}` walking beside them |

Anyone may read it, since other players see nicknames and avatars. The owner
writes their own `nickname`, `avatar` and `buddy`, and `saveProfile` takes only
the first two and merges.

`role`, `banned` and `banReason` are the server's alone — see
[Roles](security.md) — and a create that names a role, or arrives already banned,
is refused outright.

The balance is not theirs to write. `grantGold` and `spendGold` live in
[`src/server/profile.ts`](../../src/server/profile.ts), and each reads and writes
inside a transaction so concurrent rewards cannot clobber each other. The rules
pin `gold` on update and require a new profile to open at zero.

### Looking at somebody else

The document is public, so a trainer met in the middle of something — a party in
a raid lobby, a lot on the auction board — can be opened as the profile they
already have. [`ProfileDialog`](../../src/components/profile/ProfileDialog.tsx) holds the
uid being visited (`game.visiting()`), names the panel by their nickname, and
renders the ordinary [`ProfileTab`](../../src/components/profile/ProfileTab.tsx) with
`viewOnly` set. That flag travels down to the buddy card and the battle history
and removes everything that writes: the sign-out, the buddy swap, and the button
that collects what a won raid still owes.

None of it is a permission. The rules refuse every one of those writes for
anybody but the owner, and the server refuses them again. The flag only stops a
reader being offered a button that could not work.

A visitor is left with who the player is, who walks with them, and what they have
fought. There is no tab bar over it, since a bar holding one tab decides nothing.
**Bids** stay private: `bids/{bidId}` may only be listed by the player who placed
them. The **bag** is not on the profile at all, and `bags/{uid}` is a `get` by
the owner alone. Their **catches** are readable — `caught/{catchId}` is public,
which is what makes a lot on the block worth bidding on — but the visited profile
does not show them. The box behind the menu is only ever the reader's own.

## `bags/{uid}`

Everything a player is carrying, in **one document**: a map per kind, keyed by
the id of the thing and valued by how many.

```text
bags/{uid} = { items: { "114": 3, "10007": 1 }, candies: { "0": 12 } }
```

| Field     | Type                     | Notes                          |
| --------- | ------------------------ | ------------------------------ |
| `items`   | `Record<string, number>` | Item id → how many are carried |
| `candies` | `Record<string, number>` | Family id → how many are held  |

It is read through [`src/auth/inventory.ts`](../../src/auth/inventory.ts) and
[`src/auth/candy.ts`](../../src/auth/candy.ts), which are two views of one
document, and written only by
[`src/server/stacks.ts`](../../src/server/stacks.ts). Both maps are currency: one
mints Master Balls and the other mints levels.

### Why one document

Every picker in the game opens by reading the whole bag. A row per kind carried
would bill a read per kind, growing with a player's collection forever; one
document is one read however much they own, arrives complete, and can be watched
live for the cost of a single listener.

The price is that a player's writes queue behind each other. That is
self-contention — nobody else writes your bag — and it is why anything handing
over several kinds does it in **one** write: `grantStacks` for a dug-up stash and
the Pickup finds, and one transaction for a whole vendor basket.

Both maps are **exempted from indexing**: a key per item id would be an index
entry per item id, and nothing asks the store which players hold a Master Ball.

### How a stack is read and written

[`src/auth/stacks.ts`](../../src/auth/stacks.ts) says which map a kind lives in
(`ITEM_STACKS`, `CANDY_STACKS`) and reads one out: `getStack` for a count,
`listStacks` for the id-count pairs every picker wants. Nothing is ever listed at
zero — a stack spent to its last is **deleted** from the map rather than left
sitting at nothing, which is what the old rows did.

[`src/server/stacks.ts`](../../src/server/stacks.ts) has two layers, because most
callers change a stack **and something else** in one breath: an item leaves the
bag as a move is learned, a candy leaves the pile as a level lands. Those take
`readStackIn` / `writeStackIn` / `spendStackIn` and pass their own transaction.
The rest take `grantStack` / `spendStack` / `grantStacks`, which open one of
their own.

Every write is a **merge at one field path**, never a whole document. Two kinds
changed in one transaction are two mutations, against `items.114` and `items.117`,
so the second cannot overwrite the first. Reads still come before writes — two
kinds read in one transaction are two reads of the same document — which is
Firestore's own rule and the reason the multi-kind callers gather before they
write.

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

Every catch pays `getCatchCandy` of its own family — the species' spawn rarity
band counted from one, so one for a base stage and five for a legendary — four
times over on the family's own day. On top of that, `recordCatch` asks the overworld engine
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
`buddy` field: the `caught/{catchId}` walking at the player's side, or an empty
string when they walk alone.

It is a field rather than a document of its own because it is read on nearly
**every** overworld action: every encounter derivation asks what the buddy
changes, every catch asks what it is carrying, every step report asks what is
being walked. A document would be a second read for one string, on the hottest
path in the game.

`setBuddy` reads the catch first and refuses to write when the player does not
own it. Ownership can still lapse afterwards — a trade leaves the field pointing
at someone else's pokemon — so `resolveBuddy` re-checks `owner` on read and
resolves null when it no longer matches. `clearBuddy` writes an empty string, and
`releaseCatch` clears it in the same transaction when the released pokemon was
the one being followed.

An **egg** may be the buddy, and has to be: steps only count for what walks
beside the player. `resolveBuddy` reports no field effects for one, though — it
is carried, not accompanied. See [Eggs](catches.md#eggs).

The rules restrict the field to the owning uid, the way the nickname beside it is
restricted. `gold` stays server-only, so the profile's rule has to name which
keys a player may touch rather than allowing the whole document.

## `positions/{uid}`

Read through [`src/auth/positions.ts`](../../src/auth/positions.ts), written by
[`src/server/positions.ts`](../../src/server/positions.ts). One document per
player, and **the only mutable record of anybody's place in the world** —
everything else the overworld holds derives from a seed and a window.

| Field     | Type     | Notes                                         |
| --------- | -------- | --------------------------------------------- |
| `player`  | `string` | Owning uid, matching the document id          |
| `chunkX`  | `number` | Chunk coordinate, clamped to the world        |
| `chunkY`  | `number` | The same                                      |
| `cellX`   | `number` | Cell column within the chunk, 0 to 15         |
| `cellY`   | `number` | Cell row within the chunk, 0 to 15            |
| `movedAt` | `number` | When it was last written, on the server clock |

It exists for one reason: a player who walked forty chunks, or spent a Portal Key
crossing the world, should not be put back at their starting point by a page
reload.

A player with **no document yet** is dropped somewhere random in the starting
region by `pickStartPosition`
([`src/overworld/start.ts`](../../src/overworld/start.ts)). The draw uses a random
seed rather than their uid, so two players who arrive together arrive in different
places, and that position is **written immediately**, so the dice are rolled once
and returning is returning.

Steps and position settle **together**. The paces an egg has walked are reported
in batches while a walk is in progress, and flushed — batch or not — the moment
the position is written, so a player never comes back further along the map than
their egg is along its walk. A portal crossing settles the same way: the walk _to_
the portal counts, and the crossing itself adds no steps. Either way the server
bounds a step report by the time since the last one (`creditableSteps`), so
nothing about moving a position can be turned into progress on an egg.

It is **the client's word**, deliberately. The server clamps the coordinates to
somewhere that exists and stamps the time; it does not check the walk, because
positions are written every `SAVE_DELAY` (1.5s) rather than every step and there
is no path in them to check. Nothing in the game trusts a position: reaching a
landmark is checked against the landmark and its window, a spawn against the
store, a portal against the chunk seed. A player who lies about where they are
stands somewhere they are not and finds exactly what is there — see
[Reaching, not treading](overworld.md#reaching-not-treading).

Private to the owning uid, and read-only to them.

## `pokedex/{uid}`

What a player has met and what they have kept, in **one document** — the bag's
shape, for the bag's reason. Read through
[`src/auth/pokedex.ts`](../../src/auth/pokedex.ts) and written only by the
server: a dex is the game's record of what actually happened, so a client that
could write one could claim to have faced a Mewtwo it never met.

```text
pokedex/{uid} = {
  seen: { "25": 14 }, seenShiny: { "25": 1 },
  caught: { "25": 2 }, caughtShiny: { "25": 1 },
}
```

| Field         | Type                     | Notes                                 |
| ------------- | ------------------------ | ------------------------------------- |
| `seen`        | `Record<string, number>` | Species id → how many were ever met   |
| `seenShiny`   | `Record<string, number>` | The sparkling ones, counted apart     |
| `caught`      | `Record<string, number>` | Species id → how many were ever owned |
| `caughtShiny` | `Record<string, number>` | The sparkling ones, counted apart     |

The counts are **historical**: releasing a Pidgey or losing one to an auction
leaves the dex exactly as it was. A shiny is counted only in its own map, so a
species' total is the two added together.

Private to the owning uid, and read-only to them.

### What the screen makes of it

The dex sits behind the menu, beside the catches: a box is what somebody has, and
a dex is what there is. [`PokedexTab`](../../src/components/dex/PokedexTab.tsx) reads
the document once and draws **every base form in the registry** — one entry per
pokemon rather than one per costume, which is the rule `getBaseForms` already
counts a dex by — as a grid of squares in dex order, thirty at a time in the same
six-by-five box the collection is kept in.

Each square is in one of three states, and the gaps are the point: a number alone
for a species never met, its own silhouette for one met and never kept, and the
pokemon itself for one that has been owned.

Opening a square opens [`DexEntryDialog`](../../src/components/dex/DexEntryDialog.tsx):
both coats (each a silhouette until it has been owned), the category, the height
and weight, the family's candy the reader is holding, the abilities, the base
stats, **where it lives**, and everything it can learn.

"Where it lives" is the spawn pools read backwards. Every other reader asks a
biome what lives in it; `listSpeciesHabitats` in
[`src/data/biome/__create.ts`](../../src/data/biome/__create.ts) sweeps every pool
of every biome at every hour once, keeps the index, and answers the opposite
question — which biome, at which hour, out of which rarity band. The index is
thrown away whenever a pool is registered, so it cannot go stale.

Something met around the clock at the same odds says **Anytime** rather than the
same badge four times. A species with a **lair** — the four legendaries and Mew —
is named by the place first: a player who came to that entry came for
[Cerulean Cave](../../src/data/overworld/lair.ts), not for the odds of walking
into one.

## `fled/{uid}`

Written by `markFled` in
[`src/server/overworld.ts`](../../src/server/overworld.ts), read through
[`src/auth/safari.ts`](../../src/auth/safari.ts). The key is recomputed from the
stored encounter, so a player cannot retire a meeting they never had.

| Field  | Type       | Notes                                          |
| ------ | ---------- | ---------------------------------------------- |
| `keys` | `string[]` | Encounter keys the user has scared off, pruned |

An encounter key is `` `${x},${y}@${timestamp}:${individualValue}` `` (see
`encounterKey` in [`src/overworld/safari.ts`](../../src/overworld/safari.ts)).

**The list is pruned as it is written.** The key carries the window that staged
the spawn, and a spawn is gone when its window turns over, so a key older than
`FLED_MEMORY` (1 hour) can never match anything again and is dropped by the same
write that adds a new one. It is an hour rather than one 5-minute window because
the windows are **local**: a player who crosses a zone reads a clock offset from
the one their last key was written against.

Without the pruning the list only grew — one key per encounter a player ever
walked away from, in a single document, until it met Firestore's megabyte.

Private to the owning uid, and read-only to them.
