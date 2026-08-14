# Meeting pokemon

Wild pokemon stand on the cells of a chunk and are met by walking up to one and
clicking it. Every five minutes a chunk produces a fresh set of them, and every
player who passes through the chunk during those five minutes sees the same set.

Everything about a wild pokemon — its level, nature, gender, ability, individual
stats, size and moves — is decided before the player arrives and never changes.
Whether it is **shiny**, however, depends on the player looking at it.

## How many appear

An ordinary walker sees **eight** pokemon in a chunk. Three more are always
present but visible only to a player whose buddy attracts them, and a buddy that
repels pokemon hides three.

| Buddy                                              | Pokemon visible |
| -------------------------------------------------- | --------------- |
| Holding a Pure Incense                             | 5               |
| Ordinary                                           | 8               |
| With Arena Trap, Illuminate or No Guard (a "lure") | 11              |

The extra pokemon are rolled for every chunk whether or not anybody can see them,
so a lure changes who may meet them rather than whether they exist. A player
without one can neither see nor reach the last three.

## Rarity

Each pokemon that appears rolls first for a rarity band, then for a species
within that band.

| Band     | Odds     | What is in it                           |
| -------- | -------- | --------------------------------------- |
| Special  | 1/4096   | Legendaries and mythicals               |
| Prized   | 1/512    | Babies and unowns                       |
| Rare     | 1/64     | Fully-evolved and single-stage species  |
| Uncommon | 1/8      | Middle evolutions                       |
| Base     | The rest | Unevolved species that can still evolve |

Which species appear inside a band, and how often each does, depends on the
biome and the time of day. That is why one field is full of Rattata while a
Chansey is a story worth telling.

If a biome holds nothing in the band a roll landed on, the roll falls to the next
band down, so nothing is lost — the player meets a commoner instead.

A prized pokemon is not unique. Unlike a legendary, a second one may be met.

## What a pokemon comes with

### Level

Level depends on the rarity band, so a first field does not hand out a level 90
Rattata and a legendary is never trivial:

| Band     | Level range |
| -------- | ----------- |
| Base     | 5–15        |
| Prized   | 5–15        |
| Uncommon | 15–30       |
| Rare     | 30–45       |
| Special  | 1–100       |

Legendaries deliberately cover the whole range: there is one of each in the
world, nobody meets one twice, and a legendary that could only ever be met at one
strength would be a legendary with a known answer.

### Ability, nature and gender

A wild pokemon carries one of its species' ordinary abilities about seven times
in eight; the remaining eighth is its hidden ability. Nature is one of the usual
25, and gender follows the species' own ratio — a species with no ratio is
genderless.

### Moves

A wild pokemon knows the last four moves its species learns by levelling up at or
below its level.

### Size

Size is usually close to normal for the species and rarely far from it, running
between roughly 0.85× and 1.15×. Height follows the scale directly and weight
follows its cube, so a pokemon a tenth taller is about a third heavier. Extremes
are rare, which is what makes a giant worth showing off.

Size belongs to the individual rather than to the number on the record, so
evolving grows a pokemon into its new species while keeping its place within it:
a big Bulbasaur becomes a big Ivysaur.

## Shininess

A shiny pokemon is a match between a **trainer and that pokemon**. The same wild
pokemon may be shiny for one player and perfectly ordinary for the player
standing beside them.

The base chance is **1 in 4,096**, and two bonuses multiply it:

| Bonuses held        | Effective odds |
| ------------------- | -------------- |
| None                | 1/4096         |
| Species day         | 1/512          |
| Shiny Charm         | 1/512          |
| Species day + charm | 1/64           |

The Shiny Charm is carried by the buddy rather than in the bag, so it occupies
the buddy's single held-item slot.

Shininess is independent of a pokemon's individual stats. A shiny is not
secretly a stronger pokemon.

## What a buddy changes

The pokemon walking beside a player changes what they find. Some effects come
from the buddy's ability, others from what it is holding.

| Effect                                       | Source    | What it does                                              |
| -------------------------------------------- | --------- | --------------------------------------------------------- |
| **Synchronize**                              | Ability   | Half of the pokemon met share the buddy's nature          |
| **Cute Charm**                               | Ability   | Two in three come out the opposite gender to the buddy    |
| **Arena Trap**, **Illuminate**, **No Guard** | Ability   | Three extra pokemon become visible and meetable           |
| **Flame Body**                               | Ability   | An egg picked up beside it hatches in half the walk       |
| **Pickup**                                   | Ability   | Finds an item every 512 steps walked                      |
| **Shiny Charm**                              | Held item | Eight times the shiny odds                                |
| **Exp. Share**                               | Held item | Half of catches also pay candy to the *buddy's* family    |
| **Lucky Egg**                                | Held item | Half of catches pay extra candy to the *caught* family    |
| **Luck Incense**                             | Held item | Doubles the gold a raid or a beaten grunt pays            |
| **Pure Incense**                             | Held item | Three fewer pokemon appear, for crossing a chunk in peace |

Cute Charm does nothing when either pokemon is genderless.

None of these change *which* species are standing in the chunk — everybody sees
the same ones — only how many a player can reach, and what the ones they meet
turn out to be.

An **egg** may be the buddy, and must be for its steps to count, but an egg
provides no effects at all: it is carried rather than accompanied.

## How a pokemon was obtained

Every pokemon a player owns permanently records how it was obtained:

| Kind               | Source                                                           |
| ------------------ | ---------------------------------------------------------------- |
| **Wild**           | One standing in a chunk, or one produced by a phenomenon         |
| **Hatched**        | An egg walked open                                               |
| **Legendary Raid** | A cleared legendary raid, at level 50                            |
| **Shadow Raid**    | A cleared shadow raid, at level 25, keeping the Shadow ability   |
| **Mythical Raid**  | A raid called with a relic, at level 30                          |
| **Team Rocket**    | Taken from a beaten grunt: a shadowed common pokemon at level 10 |
| **Revived**        | A fossil opened by the Fossil Scientist, at level 20             |
| **Fateful**        | An event or a gift                                               |

The three raid prizes arrive at different levels because they are different
prizes. A legendary arrives half-grown; a shadow arrives lower and keeps its
Shadow ability for life; a mythical arrives lowest of all, because the pokemon
itself is the prize.

A raid prize may be claimed long after the raid ended and is still exactly what
the raid staged, wherever the player happens to be standing.

Once a pokemon has been met it stays as it was. Walking away and returning within
its five-minute window finds the same pokemon rather than a new roll.

## See also

- [Catching](catching.md)
- [The world](world.md)
- [Raising a pokemon](raising.md)
