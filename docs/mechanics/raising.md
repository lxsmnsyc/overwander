# Raising a pokemon

There is no experience. A pokemon grows because a player spends candy on it,
trains where its levels are worth spending, and walks with it — all of which are
decisions rather than a by-product of grinding the right opponents.

## What a pokemon's numbers are

The mainline formula, and it lives in
[`src/data/constants/stats.ts`](../../src/data/constants/stats.ts) rather than in
the battle, because the overworld asks the same question: what a catch's health
is when it is *not* fighting has to be the figure the fight would give it.

```text
shared = floor((2 × base + IV + floor(effort / 4)) × level / 100)
health = shared + level + 10
stat   = floor((shared + 5) × nature)
```

Four points of effort buy one point of the stat, which is why 252 is the cap
worth having — the four above it would buy nothing.

**Maximum health is derived, never stored.** Only the current figure is a field,
so a level, an evolution, a polished value or a point of training moves the
maximum on its own. When the maximum moves, the **share moves with it**: a
pokemon at 50 of 100 comes out of an evolution at 60 of 120. Two edges are
deliberate — a fainted pokemon stays fainted, since an evolution is not a
revival, and a standing one never rounds down to zero.

## Levels and candy

Candy is kept **per family**, not per species, so anything of a line feeds
anything else of it.

| Rule                    | Value                    |
| ----------------------- | ------------------------ |
| Candy a catch pays      | 1, of its own family     |
| On the family's own day | ×4                       |
| Candy one level costs   | 1, or **2** for a shadow |
| Ceiling                 | `MAX_LEVEL` (100)        |

Two held items pay extra candy, each half the time: an **Exp. Share** pays the
buddy's family, so everything caught feeds the one pokemon being raised, and a
**Lucky Egg** pays the caught pokemon's family, so it fills out a dex faster.
Neither is multiplied by the species day, which already pays four times over.

A level is also a heal: the pokemon comes back at full health with a clean slate,
and thinks a little better of the player for it. Releasing pays no candy —
catching already did, and paying again would make catch-and-release a way of
farming the same spawn.

## Evolution

Which evolutions are offered comes from the species data, but only the conditions
the game can **verify against what is stored** are honoured:

| Method                            | Supported | Notes                                   |
| --------------------------------- | --------- | --------------------------------------- |
| **Level**                         | Yes       | Checked against the stored level        |
| **Used item**                     | Yes       | Spent in the same transaction           |
| **Held item**                     | Yes       | Required, but not consumed              |
| Trade, friendship, weather, party | No        | Never offered rather than waved through |

An evolution that uses an item decrements the stack and writes the new species
together, so the stone and the evolution land or neither does. Criteria are
re-checked against the stored documents inside that transaction, never trusted
from the caller.

Evolving keeps the individual's proportions: `deriveSize` reads the trait value
against the *new* species, so a pokemon grows into its evolution's size band
while staying the same relative size within it.

## Effort

The mainline earns effort from whatever a pokemon happened to have fought, a
species at a time. Here it comes with the levels and the player decides where it
goes — the same five hundred points over a hundred levels, spent deliberately
rather than accumulated by fighting the right opponents.

| Quantity     | How it is worked out                         |
| ------------ | -------------------------------------------- |
| **budget**   | `level × EFFORT_PER_LEVEL (5) + effortBonus` |
| **spent**    | The six values added up                      |
| **unused**   | `budget − spent`, never below zero           |
| **per stat** | Never more than `MAX_EFFORT_PER_STAT` (252)  |

A freshly caught level 20 pokemon therefore arrives with 100 points nobody has
assigned. Three things move them:

- **Assigning** puts unused points into a stat, or takes them back out. Nothing
  is consumed — the points came with the levels — so retraining is free.
- **A wing** grants 3 points in its own stat *and* raises `effortBonus` by the
  same, so a wing adds to the budget rather than spending it. That is what makes
  one worth the same at level 5 as at 100, and it is the only effort a pokemon
  ever gets that its levels did not pay for.
- **A bitter berry** takes 10 points off one stat. They go back to the unspent
  pool rather than being lost, since the levels that paid for them have not been
  un-taken, and the pokemon thinks better of the player for eating something
  unpleasant.

Every one of the three rescales health, the way everything that moves a maximum
does.

## Friendship

One number per catch, 0 to 255, moved by the things the mainline has moved it by
since Gen 4. Every gain **shrinks as the number grows**: the first hundred points
come quickly and the last fifty are a long walk.

| What happened             | 0–99 | 100–199 | 200–255 |
| ------------------------- | ---- | ------- | ------- |
| A level taken             | +5   | +3      | +2      |
| 256 steps walked as buddy | +2   | +2      | +1      |
| A bitter berry eaten      | +10  | +5      | +2      |
| Knocked out               | −1   | −1      | −1      |

A catch starts at `BASE_FRIENDSHIP` (70); something hatched starts at
`HATCHED_FRIENDSHIP` (120), because the carrying has already happened.

A **groomer** — one of the wandering NPCs — adds half of whatever is *left* to
give for `GROOMING_FEE` (2,500) gold. It is worth a great deal to a pokemon fresh
out of a ball and almost nothing to one that is already inseparable, and because
it is always half of the remainder it can never buy the last of a friendship.
That part is walked for.

Friendship is a record of how a pokemon has been kept. What reads it can grow;
what moves it is settled.

## Bottle caps

Individual values are rolled once, when the encounter is staged, and nothing else
in the game moves them — which is what makes a bad roll on a pokemon somebody
already raised worth an item of its own.

| Item                  | Band    | What it does                                    |
| --------------------- | ------- | ----------------------------------------------- |
| **Golden Bottle Cap** | Special | Raises every value to `MAX_IV` (31)             |
| **Bottle Cap**        | Rare    | Raises one value, drawn from the imperfect ones |

Which stat a plain cap lands on is the **server's** roll, seeded by the catch,
the item and the instant. A client that chose would simply choose the stat it
wanted, and the cap would stop being a cap. Only imperfect stats are drawn from,
so a cap is never spent on a stat that needed nothing, and a pokemon that is
already perfect is refused outright on both sides.

Both caps are found in the overworld and nowhere else: neither is stocked, and
each is consumed by the use.

## Purifying a shadow

A shadow comes out of a shadow raid or off a Team Rocket grunt carrying the
`Shadow` ability for good, and pays double candy at every level. Two things undo
that trade — the **Purifying Gem**, a rare find, and **Nurse Joy**, who does it
for free along with the healing:

| Field       | Before             | After                                      |
| ----------- | ------------------ | ------------------------------------------ |
| `abilities` | `[rolled, Shadow]` | `[rolled, Purified]`                       |
| `flags`     | Shadow set         | Shadow clear — the candy cost reverts      |
| `ivs`       | As rolled          | Every value `+PURIFY_IV_BOOST` (2), capped |

`Purified` is **entirely cosmetic**: nothing reads it, and no battle changes. It
is the mark left where the ability was, so a pokemon that came out of a shadow
raid still says so. Purifying changes what it costs, not what it was.

## Putting a pokemon right

Three things heal, and all of them run through one call so that what an item is
worth to a given pokemon is decided in one place:

- **A berry.** What each restores or cures is the berry's own table, shared with
  the battle, so an Oran Berry is worth ten points on either side of a fight. The
  battle's use-at-a-threshold rule is a battle rule only; out of one, the player
  decides when it is worth it.
- **Medicine.** A potion gives health back (20 / 60 / 120 / the whole pool), a
  cure takes one status off, a Full Heal takes the lot, a Full Restore does both,
  and a revive brings a fainted pokemon round on half a pool — a Max Revive on a
  whole one. None of it is holdable: a potion cannot be drunk mid-raid, which is
  what keeps a berry worth carrying into one.
- **A level**, the slow way.

Two rules cut across all of it. **A revive is the only thing that reaches a
fainted pokemon**, and the only thing that does nothing to one still standing.
And **an item that would change nothing is refused rather than spent**: the wrong
cure, or a pokemon already whole.

A fainted pokemon cannot fight — a raid refuses a party holding one, and a party
of fainted pokemon cannot start a battle at all.

## Held items

A catch holds `HELD_ITEM_LIMIT` (1) item, matching the battle's per-unit limit,
and only items flagged holdable can be handed over. The item and the bag stack
move in one transaction, so an item is never on a pokemon and in the bag at once,
nor lost between them.

One item slot means the overworld held items are a genuine choice: a Shiny Charm,
an Exp. Share, a Lucky Egg and a Luck Incense all want the same slot on the same
buddy, and a berry wants it during a raid.

The stored side of all of this is in [Catch records](../firestore/catches.md).
