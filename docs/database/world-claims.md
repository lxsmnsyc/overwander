# Overworld claims

The per-player rows a chunk produces: the encounter staged from a shared spawn,
and the four markers that record a landmark already taken this window.

## `encounters`

Written by `startEncounter`. It holds the per-player view of a shared spawn
(shininess, gender, ability, nature, moves, and the rest), derived once and
reused afterwards. Keyed by `(spawn_id, player)`, with `encounter_moves`,
`encounter_items` and `encounter_abilities` hanging off that pair.

`fed` is the berry the pokemon was given, and null for the ones nobody fed. A
Pinap pays its extra candy at the catch, which is a later call than the one that
fed it, and the catch is recorded from the staged row. The row is therefore
where the berry has to live.

`safari` is what the meeting has built up between throws: the feeding bonus, how
many balls have been thrown, the safari clock and whether it is still chewing.
Throws and treats are decided on the server (`throwAt` and `feedAt` in
[`src/server/throws.ts`](../../src/server/throws.ts)), which reads this, rolls,
and writes it back in the same transaction that spends the ball or the treat. A
throw that catches or flees also retires the meeting in `fled_encounters` in
that transaction, so a meeting is caught at most once. Null is a meeting nobody
has thrown at or fed yet.

Its `shiny` and `shadow` columns and its packed `ivs` are the same shapes the
catch row stores, see [Packed fields](catch-training.md#packed-fields), so
recording a catch copies them across rather than converting them. Only the named
player may read it, and only the server writes it.

The player's buddy changes what this row holds, the same way a party leader
changes a wild encounter in the mainline. The overworld asks for each of these
through an event engine of its own
([`src/overworld/core.ts`](../../src/overworld/core.ts)), built the same way the
battle engine is. Every field ability and held-item effect is written once, in
[`src/overworld/abilities/gen-1.ts`](../../src/overworld/abilities/gen-1.ts) or
[`src/overworld/items/key-items.ts`](../../src/overworld/items/key-items.ts),
and registers itself against the questions it answers. Nothing that stages a
spawn or an encounter names an ability.

- **Synchronize** passes its own nature on half the time.
- **Cute Charm** brings out the opposite gender two draws in three.
- A buddy holding the **Shiny Charm** lifts the odds eightfold.

Each rolls on a stream seeded by the spawn id and the uid, so the client shows
the player exactly what the server will stage, and two players on one cell get
their own answers.

What a chunk holds is the same for everyone standing in it. No field effect
changes which species turned up, only how many of them a player can see.

Two of the encounter's own fields are worth calling out:

- **Shiny** is a match between the trainer id and the **trait** value, so
  shininess is independent of the IVs a pokemon rolled, and the same spawn can
  sparkle for one player and not another. The odds are multiplied by the species
  day (×8 for the featured family) and by the Shiny Charm (×8) when the player's
  buddy is holding it. `startEncounter` checks the profile's `buddy_id` and that
  catch's held items before deriving.
- **Shadow** marks a shadow raid's reward. `recordCatch` then writes
  `Abilities.Shadow` into the catch's `abilities` alongside the rolled one, so
  it keeps the ability for good.

A raid reward derived on its family's own day floors every IV at
`RAID_FAMILY_DAY_MIN_IV` (10), leaving rolls above the floor alone. Its level is
fixed rather than rolled, `LEGENDARY_RAID_REWARD_LEVEL` (50) or
`SHADOW_RAID_REWARD_LEVEL` (25), so clearing the same kind of raid is worth the
same to everyone, and the level-up moves follow that level.

## `cache_claims`

Written by `claimItemCache` inside a transaction. The row existing is the whole
record: it marks that this player has collected this cache in this window, and
stops them collecting it again. The server inserts `on conflict do nothing`, and
the row count is what says whether this press was the one that landed.

| Column       | Type     | Notes                                                 |
| ------------ | -------- | ----------------------------------------------------- |
| `marker`     | `text`   | `{chunkSeed}@{landmarkTimestamp}${cell}`              |
| `player`     | `uuid`   | Claiming player; the two together are the primary key |
| `claimed_at` | `bigint` | When it was taken                                     |

What the stash held rides in `cache_claim_items`, one `(item, amount)` row each.

A cache holds a **stash**, not an item. `pickItems` reads the band roll as a
_ceiling_ rather than a choice: it is the best thing in the stash, and one kind
of it is guaranteed. How many kinds is a separate draw (up to `MAX_KINDS`, 3),
and every kind after the first rolls its own band on the same odds, clamped to
that ceiling. So a stash may hold two rares and a base, or three commons, or one
of each. Rarity and count are independent, which is what stops a good dig from
being the same three slots every time.

Each kind carries up to `MAX_STACK` (3) pieces, on a draw of its own. Two kinds
landing on the same item merge into one stack that still never exceeds
`MAX_STACK`.

A special is a ceiling like any other band, so a stash may well be a Master Ball
and two stones. Two things it may never be:

- **Two specials.** Only the opening draw reaches that band, and every kind
  after it is clamped to rare at best.
- **More than one piece of a special.** A Master Ball found three at a time
  would stop being a Master Ball.

The whole stash is granted stack by stack and recorded on the marker, so what a
cache paid is readable afterwards rather than only that it paid.

Claims are never updated or deleted. An expired window simply produces a new
marker string. A `write_once` trigger makes that a rule rather than a habit, and
the rows are readable by the player named on them alone.

## `berry_claims`

Written by `claimBerryPatch`, the same one-claim-per-window marker as an item
cache, on `{chunkSeed}@{landmarkTimestamp}$berry{cell}`. A berry patch fruits on
the 15-minute landmark window: picked or not, the next window grows something
new.

| Column   | Type      | Notes                      |
| -------- | --------- | -------------------------- |
| `marker` | `text`    | The patch and its window   |
| `player` | `uuid`    | Claiming player            |
| `item`   | `integer` | The berry that was picked  |
| `amount` | `integer` | How many came off the bush |

What grows comes from the berry pool in
[`src/data/overworld/berry-pool.ts`](../../src/data/overworld/berry-pool.ts),
rolled on the same rarity bands as a spawn pool:

| Band     | What grows there                                                              |
| -------- | ----------------------------------------------------------------------------- |
| base     | The five single-status cures                                                  |
| uncommon | Leppa, Oran, Persim, and the five bitter berries that trade health for a risk |
| rare     | Lum, Sitrus, the five that answer a blow, and the eighteen type-resists       |
| special  | The pinch berries, held against the moment the holder is nearly out           |

The eighteen type-resist berries share the rare band the way the plates share
their slot in the item pool, one thin slot each. Digging up the one that answers
what a party is about to walk into therefore stays luck rather than shopping.

A berry pool keeps its **prized** band empty. That band is for the things that
change a pokemon for good, like a Bottle Cap or a Purifying Gem, and a berry is
eaten. Its slice of the roll falls through to the rare band below, the way any
empty band does.

A patch is a bush rather than a buried box, so it bears **one kind** and
`MIN_BERRY_PICK` to `MAX_BERRY_PICK` (3 to 5) pieces of it. The rarity is the
interesting draw and the count is only how good a season it had. That is the
difference from a cache, which rolls several kinds but rarely more than one or
two of each.

## `phenomenon_claims`

Written by `claimPhenomenon`, the same one-claim-per-window marker as an item
cache, on the phenomenon's own **one-hour** window.

| Column   | Type       | Notes                                               |
| -------- | ---------- | --------------------------------------------------- |
| `marker` | `text`     | `{chunkSeed}@{phenomenonTimestamp}$happening{cell}` |
| `player` | `uuid`     | Claiming player                                     |
| `kind`   | `smallint` | Item, pokemon or egg: which fired                   |

A **phenomenon is not a landmark**. Everything else a player walks up to is a
place the chunk seed fixed forever. Something happening is not, so
`getPhenomena()` rolls up to `MAX_PHENOMENA` of them across the chunk's open
ground each hour, and they fall elsewhere the next one. Cells already carrying
scenery, a landmark or a rock are excluded, and dry ground is taken first where
a chunk has any, so a marsh still hides grottos while the open sea, which has
none, only ripples. What each one is comes from `BIOME_PHENOMENA[biome]`
([`src/data/overworld/phenomenon.ts`](../../src/data/overworld/phenomenon.ts)),
so water only ripples where there is water and dust only rises where there is
dust.

The roll rides an `AleaRNG` of its own seeded on `(chunk key, phenomenon hour)`,
**not** the snapshot's generator. That one is the sequential stream the spawn
roll draws from, and taking draws out of it here would shift every pokemon in
the chunk.

The clock is the hour rather than the five-minute spawn window, and that is
load-bearing. The claim marker and the startled pokemon's rolls are both named
for `(chunk, hour, cell)`, so a cell that moved inside the hour would let the
same player claim the same event again. `getPhenomenonReward(cell)` resolves
what one turns out to be, seeded the same way, so every visitor of that cell
this hour finds the same thing. `listClaimedPhenomena` tells a board which of
them this player has already taken, so a spent one stops being drawn for them
alone.

| Phenomenon         | Half the time                     | The other half                         |
| ------------------ | --------------------------------- | -------------------------------------- |
| **Hidden Grotto**  | No item side at all               | A pokemon, or 1/64 an egg of the biome |
| **Dust Cloud**     | One gem, stone, plate or valuable | A pokemon                              |
| **Rippling Water** | One valuable                      | A pokemon                              |
| **Flying Shadow**  | One wing                          | A pokemon                              |

The pokemon is the biome's **uncommon** band, or its **rare** band one draw in
eight (`PHENOMENON_RARE_CHANCE`), with either standing in for the other when it
is empty. The base band is not in it, since what a player can meet by walking is
not worth stopping for. Neither is the special one, so no phenomenon ever stages
a legendary.

An item reward lands in the inventory as part of the claim, as a stash of one to
three kinds of one to three pieces each, the way a cache pays. A pokemon
reward comes back as a spawn tuple whose two rolls derive from
`{seed}{phenomenonTimestamp}happening{cell}spawn`, passed to `startEncounter`
under the id `{chunkSeed}@{phenomenonTimestamp}$happening{cell}`, which has no
`snapshot_spawns` row behind it. A grotto's egg is written by `grantNestEgg`,
exactly as a nest's is.

## `nest_claims`

Written by `claimNest` in
[`src/server/overworld/index.ts`](../../src/server/overworld/index.ts), the same
one-claim-per-window marker as an item cache, on
`{chunkSeed}{zone}@{nestTimestamp}$nest{cell}`, except that a nest's window is
`NEST_INTERVAL`, **twelve local hours**. A nest refills at midnight and at noon
where the player is standing, so it gives each of them one egg per half day.

| Column    | Type      | Notes                                 |
| --------- | --------- | ------------------------------------- |
| `marker`  | `text`    | The nest and its window               |
| `player`  | `uuid`    | Claiming player                       |
| `species` | `integer` | What the nest was holding that window |

The player still has to be standing in the chunk's **live 5-minute window** to
reach it. The half-day window only decides what is lying there and how often.
The claim grants an egg by writing a `caught` row with `egg` set, see
[Eggs](eggs.md#what-an-egg-is), rather than an inventory item or an encounter.

What a nest holds is one draw on the biome's **egg pool** for that window's time
of day (`getEggPool`): the base, uncommon and rare bands walked back to the
first stage of each line and merged by species, since a nest holds what hatches
rather than what it grows into. Merging is what makes it one list and one draw,
so `resolveNest` no longer flattens three bands at every roll. The distribution
is unchanged, because everything that reduces to the same egg has its weight
added to that egg. The pool is built once per registered biome and kept against
it.

Two bands are left out, for different reasons:

- The **special** tier is not in it at all, so no nest ever holds a legendary,
  and a mythical is still called with a relic or not at all.
- The **prized** tier is left out because a baby is _already_ in the list. It is
  the first stage of its line, so every ordinary entry of that line walks back
  to it, and adding the band would count it twice. That leaves out the unown,
  which has no line to be walked back along: it is met rather than hatched.

The hatchling is guaranteed one move off its line's egg list, which is the
reason to walk the egg at all.

## See also

- [Shared overworld tables](overworld.md)
- [Towns and wandering NPCs](town-npcs.md)
- [Cave layers](cave-layers.md)
