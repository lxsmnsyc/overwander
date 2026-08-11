# Player-owned stores

## `profiles/{uid}`

Set by [`src/auth/profile.ts`](../../src/auth/profile.ts). Created on first sign-in
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
[`src/server/profile.ts`](../../src/server/profile.ts), each reading and writing
inside a transaction so concurrent rewards cannot clobber each other. The rules
pin `gold` on update and require a new profile to open at zero.

## `inventories/{uid}:{item}`

Read through [`src/auth/inventory.ts`](../../src/auth/inventory.ts) and written by
[`src/server/inventory.ts`](../../src/server/inventory.ts). One document per user
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

## `candies/{uid}:{family}`

Read through [`src/auth/candy.ts`](../../src/auth/candy.ts), written by
[`src/server/candy.ts`](../../src/server/candy.ts). Keyed by evolution family
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

### What a catch pays

Every catch pays `CANDY_PER_CATCH` of its own family, four times over on the
family's own day. On top of that, `recordCatch` asks the overworld engine
`checkCatchCandy` what the player was **carrying** at the time — two held items
answer it, each paying one candy half the time:

- **Exp. Share** pays the _buddy's_ family, so everything caught feeds the one
  pokemon being raised.
- **Lucky Egg** pays the _caught_ pokemon's family, so it fills out a dex faster.

Neither is touched by the species day: it already pays four times over on the
catch itself, and a bonus that multiplied with it would make one day worth a
week of ordinary ones. They are paid through `grantCandy` (flat) rather than
`grantCatchCandy` (boosted), and each is one candy however many families are
owed. A catch holds one item at a time, so the two are a choice, not a stack.
The effects live in
[`src/overworld/items/candy-items.ts`](../../src/overworld/items/candy-items.ts)
and register themselves the way every other buddy effect does.

## `buddies/{uid}`

Set by [`src/auth/buddy.ts`](../../src/auth/buddy.ts). One buddy per player, so the
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
document rather than blanking the field, and `releaseCatch` deletes it in the
same transaction when the released pokemon was the one being followed — a buddy
record naming a document that is gone would otherwise outlive it.

An **egg** may be the buddy, and has to be: steps only count for what walks
beside the player. `resolveBuddy` reports no field effects for one, though — it
is carried, not accompanied. See [Eggs](catches.md#eggs).

Private to the owning uid.

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

It exists for one reason: a player who walked forty chunks, or spent a Portal
Key crossing the world, should not be put back at their starting point by a page
reload. A player with **no document yet** is dropped somewhere random in the
starting region by `pickStartPosition`
([`src/overworld/start.ts`](../../src/overworld/start.ts)) — the draw is a random
seed rather than their uid, so two players who arrive together arrive in
different places — and that position is **written immediately**, so the dice are
rolled once and returning is returning.

Steps and position settle **together**. The paces an egg has walked are reported
in batches while a walk is in progress, and flushed — batch or not — at the
moment the position is written, so a player never comes back further along the
map than their egg is along its walk. A portal crossing settles the same way: the
walk *to* the portal counts, the crossing itself is not a walk and adds no steps.
The server bounds a step report by the time since the last one either way
(`creditableSteps`), so nothing about moving a position can be turned into
progress on an egg.

It is **the client's word**, and deliberately so. The server clamps the
coordinates to somewhere that exists and stamps the time; it does not check the
walk, because positions are written every `SAVE_DELAY` (1.5s) rather than every
step and there is no path in them to check. Nothing in the game trusts a
position: reaching a landmark is checked against the landmark and its window, a
spawn against the store, a portal against the chunk seed. A player who lies
about where they are stands somewhere they are not and finds exactly what is
there — see [Reaching, not treading](overworld.md#reaching-not-treading).

Private to the owning uid, and read-only to them.

## `fled/{uid}`

Written by `markFled` in [`src/server/overworld.ts`](../../src/server/overworld.ts),
read through [`src/auth/safari.ts`](../../src/auth/safari.ts). The key is
recomputed from the stored encounter, so a player cannot retire a meeting they
never had.

| Field  | Type       | Notes                                                      |
| ------ | ---------- | ---------------------------------------------------------- |
| `keys` | `string[]` | Encounter keys the user has scared off; only ever appended |

An encounter key is `` `${x},${y}@${timestamp}:${individualValue}` `` (see
`encounterKey` in [`src/overworld/safari.ts`](../../src/overworld/safari.ts)).
Private to the owning uid, and read-only to them.
