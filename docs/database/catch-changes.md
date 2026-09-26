# Changing a catch

Every write that rewrites a stored field on a catch: evolution, held items,
bottle caps, purifying a shadow, releasing, and the escrow a lot sits in.

## The mutable fields, and evolution

`species`, `level`, `ivs`, `health` and `statuses` are the mutable fields.
`useCandy` raises the level, `evolveCatch` in
[`src/auth/evolution.ts`](../../src/auth/evolution.ts) swaps the species, and a
bottle cap polishes the values (see [Bottle caps](#bottle-caps)). An evolution
that uses an item takes the stack out of `bag_items` in the same transaction, so
the stone and the new species land together or not at all. Criteria are
re-checked against the stored rows inside that transaction, never trusted from
the caller.

Which evolutions are offered comes from
[`src/data/species/evolution.ts`](../../src/data/species/evolution.ts). Seven
methods can be verified against what is stored, and `SUPPORTED_METHODS` is the
list: `Level`, `UsedItem`, `HeldItem`, `Trade`, `Friendship`, `TimeOfDay` and
`StatComparison`. An evolution carrying any other flag, such as the weather or
who else is in the party, is never offered rather than waved through. A used
item is spent. A held item is asked for without being taken, unless a handover
has already covered it.

`Trade` reads the record's own `can_evolve` field rather than watching a
handover happen. The mainline evolves a pokemon _during_ the trade, which is a
moment this game has nowhere to put, so the swap settles the question and the
record carries the answer until something spends it. Winning a lot at auction is
the one handover there is so far.

The swap settles **both halves at once**. An Onix handed over in a Metal Coat
arrives a coat lighter and ready to change, so the evolution never asks for the
item a second time. `traded` is separate and stays: it says the pokemon has
changed hands, which is what the box search reads, and it is true of a Machop
that no trade evolution was ever open to.

An **Everstone** refuses every evolution while it is held, and it answers here
rather than at the moment of evolving, so the catch sheet stops offering what
the stone would refuse.

## Held items

Held items move through `giveItem` and `takeItem` in
[`src/server/caught.ts`](../../src/server/caught.ts). Each reads the catch and
the inventory stack, then writes the stack and the catch's `items` **in one
transaction**, so an item is never in the bag and on a pokemon at once, nor lost
between them. Only items flagged `Holdable` can be handed over, and a catch
holds at most `HELD_ITEM_LIMIT` (1), matching the battle's per-unit item limit.
This is the path the Shiny Charm needs: a buddy holding it lifts the shiny odds
of every encounter its owner starts.

## Bottle caps

Individual values are rolled once, when the encounter is staged, and nothing
else in the game moves them afterwards. That is what makes a bad roll on a
pokemon somebody already raised worth an item of its own.

`useBottleCap` ([`src/server/bottle-caps.ts`](../../src/server/bottle-caps.ts))
spends one and writes `ivs` in the same transaction, so a cap is never spent on
a pokemon that did not change and a pokemon never changes without one being
spent. Which stats it raises is the **server's** roll, seeded by the catch, the
item and the instant: a client that chose would simply choose the stat it
wanted, and the cap would stop being a cap.

| Item                  | Band    | What it does                                    |
| --------------------- | ------- | ----------------------------------------------- |
| **Golden Bottle Cap** | Special | Raises every value to `MAX_IV` (31)             |
| **Bottle Cap**        | Prized  | Raises one value, drawn from the imperfect ones |

Both are found in the overworld item pool and nowhere else: neither is stocked,
neither is holdable, and each is consumed by the use. The rules both sides read
live in [`src/data/items/bottle-caps.ts`](../../src/data/items/bottle-caps.ts).

Only stats below `MAX_IV` are drawn from, so a plain cap never lands on a stat
that needed nothing. The item is spent either way, and a pick that could waste
it would make the cap worse the closer a pokemon came to perfect. A pokemon that
is **already perfect** is refused outright on both sides: the dialog hides the
buttons and the server returns null without touching the bag.

The use is refused for the same reasons every other catch write is: the catch is
not the player's, it is locked into a live battle, or it is still an egg. What
is inside an egg was decided when it was found and stays that way until it
hatches.

`individualValue` is not rewritten. It is the roll the encounter was staged
from, and the stored per-stat values are what every reader uses, which is the
same reason a bred egg's `ivs` can disagree with it.

## Purifying a shadow

A shadow catch comes out of a shadow raid carrying the `Shadow` ability for good
and paying twice the candy at every level. The **Purifying Gem**, a rare find in
the overworld item pool that is never stocked, undoes that trade, and the rules
for it live in
[`src/data/items/purifying-gem.ts`](../../src/data/items/purifying-gem.ts).

Three fields move, in one transaction with the gem leaving the bag
([`src/server/purify.ts`](../../src/server/purify.ts)):

| Field       | Before             | After                                  |
| ----------- | ------------------ | -------------------------------------- |
| `abilities` | `[rolled, Shadow]` | `[rolled, Purified]`                   |
| `shadow`    | `true`             | `false`, and the candy cost reverts    |
| `ivs`       | as rolled          | every value `+PURIFY_IV_BOOST`, capped |

`Purified` is **entirely cosmetic**: no listener reads it, and nothing in a
battle changes. It is the mark left where the `Shadow` ability was, so a pokemon
that came out of a shadow raid still says so afterwards. Purifying changes what
it costs, not what it was.

The doubled levelling cost is read off the `Shadow` **flag** rather than the
ability (`getCandyCost` in
[`src/auth/candy-rules.ts`](../../src/auth/candy-rules.ts)), so clearing that
bit is what reverts it. Nothing else about it is touched: a shiny shadow is
still shiny.

Health is rescaled with the change, since two more HP points is a bigger pool
and the share of it the pokemon was carrying is what it keeps. A pokemon that is
not a shadow is refused outright, since a gem spent on nothing would be a rare
item wasted, as is one that is not the player's, is locked into a battle, or is
still an egg.

The gem is not the only way. **Nurse Joy** purifies for free, along with the
healing, once per NPC window. See [Wandering NPCs](town-npcs.md#wandering-npcs).

## Releasing

`releaseCatch` ([`src/server/caught.ts`](../../src/server/caught.ts))
**deletes** the row rather than flagging it: a released pokemon is gone, and
nothing in the game reads a catch its owner no longer has. Three things move
with it, in the same transaction, so nothing is left pointing at a record that
has vanished:

- whatever it was holding goes back to the bag, since the item was the player's
  rather than the pokemon's;
- the profile's `buddy` is cleared when it named the released catch;
- a catch that is **locked** into a live battle is refused outright, since the
  fight is running on a snapshot of a record that has to still be there when it
  ends.

Releasing pays the family `getReleaseCandy` of the released record, one candy
per 25 levels rounded up, so a level 76 to 100 pokemon pays 4 candies and a
fresh catch pays 1 candy. It is written inside the same transaction as the
deletion, so a record cannot vanish without the candy landing. Rarity has no say
on the way out, and neither does the family-day bonus: that one belongs to
meeting the pokemon.

The dialog asks twice before calling it, and by default there is no undo.

### A day's grace, where the server keeps one

With the server's `RELEASE_GRACE` variable on, a release is held for a day
before it is final, the way rAthena waits `char_del_delay` before a deleted
character is gone. The row is not deleted. Its `owner` is cleared, which hides
it from every policy and refuses it to every server call exactly as
[escrow](#escrow) does, and three columns say who let it go (`released_by`),
when (`released_at`) and what candy it paid (`released_candy`). An escrowed lot
never has a `released_by`, which is what tells the two apart.

What a delete would have cascaded is done by hand in the same transaction: the
buddy slot, raid and duel lobby parties and team presets let it go, and its held
items, already back in the bag, come off it. The candy is paid at the press as
before.

Inside the day the box lists it under **Let go today** and `takeBack` returns
it, **spending the candy it paid again**, so releasing and taking back is never
a way to make candy, and a player who has already spent it cannot. It comes back
empty-handed, since what it held is in the bag, and the release comes off the
quest counter it went on. Past the day an hourly pg_cron sweep deletes the row,
and the delete cascades as an immediate release always did. The sweep runs
whether the variable is on or not, so a release made while it was on still ends.

## Escrow

A pokemon put up for auction is not deleted and not held anywhere else. It stays
its own row with `owner` set to **null**, which is nobody. The foreign key stays
honest that way, where the old empty-string sentinel could not.

Every write that touches a catch asks whether the caller is its `owner`, and a
uid is never null, so an escrowed pokemon is refused to the seller, the bidders
and everyone else by the checks that were already there, while staying
**readable**, which is what lets a bidder see what they are bidding on.

Collecting the lot writes the winner's uid into `owner`, appends the sale to
`history`, with what it went for in `paid`, and resets `friendship` to
`BASE_FRIENDSHIP`: the pokemon has just met its new trainer, and what it thought
of the last one was theirs. A lot nobody bid on goes back to the seller instead,
which restores `owner` and leaves both `history` and `friendship` alone, since
it never changed hands. See [Auctions](auctions.md).

## See also

- [Catch records](catches.md): the `caught` row, its children, and the box
  search
- [Health, status and the battle lock](catch-state.md): the rescaling these
  writes do, and the lock that refuses them
- [Training and friendship](catch-training.md): effort, friendship, and the
  `auctionable` mark these writes rewrite
- [Owners and origin](catch-history.md): the entry a collected lot appends
- [Auctions](auctions.md): the lot an escrowed catch belongs to
