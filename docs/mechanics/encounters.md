# Encounters

A pokemon standing in a chunk is two numbers and a species id. Everything else
about it — its level, its nature, which of its abilities it has, how big it is,
whether it sparkles for you — is derived from those numbers on demand, so a
window's worth of pokemon costs three numbers each to publish and nothing at all
to remember.

## What a window holds

Every 5-minute window, a chunk rolls `SPAWN_COUNT` (6) pokemon and places each on
its own free cell of the central 12×12, skipping the whole landmark area. Two
more (`LURE_SPAWN_BONUS`) are rolled on top for every chunk, whether or not
anybody can see them: a **lure** buddy decides who *may*, not whether they exist,
so all the visitors of a chunk still share one set of rolls. A player walking
without one neither sees the last two on the map nor may meet them.

Three abilities lure, and they are the ones the mainline games gave the job:
**Arena Trap**, **Illuminate** and **No Guard**.

### Which band, then which species

Each roll picks a rarity band first and a species inside it second, by weight:

| Band     | Odds     | What is in it                                         |
| -------- | -------- | ----------------------------------------------------- |
| Special  | 1/4096   | Legendaries and mythicals                             |
| Rare     | 1/64     | Fully-evolved species, babies, and single-stage lines |
| Uncommon | 1/8      | Middle evolutions                                     |
| Base     | The rest | Unevolved species that can still evolve               |

The bands are a property of the species rather than a list somebody maintains:
`getSpawnRarity` reads what a species evolves into and out of. A band the biome
leaves empty at that hour falls back to base rather than producing nothing.

Weights inside a band are the biome's own, which is where "Rattata everywhere,
Chansey almost never" comes from. The species day multiplies one family's weights
by four without moving it between bands.

## Deriving one pokemon

A spawn is the tuple `[species, individualValue, traitValue]` — the species and
two 32-bit rolls. `deriveEncounter`
([`src/overworld/encounter.ts`](../../src/overworld/encounter.ts)) turns it into a
concrete pokemon, and every derivation of the same tuple agrees.

**The individual value** is sliced into the six IVs, five bits each in stat
order, 0 to 31.

**The trait value** is sliced four ways, one byte each:

| Slice | Bits  | What it decides                                           |
| ----- | ----- | --------------------------------------------------------- |
| 0     | 0–7   | Level, spread evenly over 5–100                           |
| 1     | 8–15  | Gender, against the species' own ratio                    |
| 2     | 16–23 | Ability: the low eighth of the byte lands the hidden pool |
| 3     | 24–31 | Nature, one of 25                                         |

A species with no gender ratio is genderless, and a species with no hidden
ability gives the whole byte to its regular pool. Everything is a slice rather
than a sequence of draws so that a client and a server derive the same pokemon
without exchanging it or agreeing on a call order.

**Size** has no byte left, so it is mixed out of the trait value with a xorshift
and read as **two** bytes that are averaged. Averaging two rolls makes the
distribution triangular: most of a species comes out near its listed size and the
extremes are rare, which is what makes a giant worth showing off. The scale runs
from `MIN_SIZE_SCALE` (0.85) to `MAX_SIZE_SCALE` (1.15); height scales with it
directly and weight with its cube, the way volume does, so a tenth taller is a
third heavier.

Size is **derived rather than stored**, which is why evolving grows a pokemon:
the trait value keeps the individual's proportions and the species supplies the
size those proportions apply to.

**Moves** are the last four the species learns by level-up at that level.

## Shininess

Shininess is a **resonance between a trainer and a pokemon**, adapted from the
mainline formula. The user id hashes into a stable 32-bit trainer value, whose
16-bit halves are XORed against the trait value's halves; a result under
`SHINY_THRESHOLD` (16) sparkles, which is 16 in 65,536 — the modern 1/4096.

Two consequences are deliberate. The same wild pokemon is shiny for one trainer
and plain for another, since the trainer is half the sum. And it reads the
**trait** value rather than the individual one, so sparkling is independent of
the IVs a pokemon rolled: a shiny is not secretly a better pokemon.

Boosts widen the band that sparkles and multiply together:

| Boost       | Factor | Effective odds |
| ----------- | ------ | -------------- |
| None        | ×1     | 1/4096         |
| Species day | ×8     | 1/512          |
| Shiny Charm | ×8     | 1/512          |
| Both        | ×64    | 1/64           |

The Shiny Charm is a **held item on the buddy**, not something in the bag, so it
takes the player's one held-item slot on the pokemon walking beside them.

## What a buddy changes

The overworld asks its questions through an event engine of its own
([`src/overworld/core.ts`](../../src/overworld/core.ts)), built exactly like the
battle engine. Nothing that stages a spawn names an ability; each field effect is
written once and listens for the questions it has an opinion about.

| Effect                                       | Carried by | What it does                                        |
| -------------------------------------------- | ---------- | --------------------------------------------------- |
| **Synchronize**                              | Ability    | Half of all encounters share the buddy's nature     |
| **Cute Charm**                               | Ability    | Two draws in three come out the opposite gender     |
| **Arena Trap**, **Illuminate**, **No Guard** | Ability    | The two extra spawns become visible and meetable    |
| **Shiny Charm**                              | Held item  | Eight times the shiny odds                          |
| **Exp. Share**                               | Held item  | Half of catches pay a candy to the *buddy's* family |
| **Lucky Egg**                                | Held item  | Half of catches pay a candy to the *caught* family  |
| **Luck Incense**                             | Held item  | Doubles a reward purse                              |

Each rolls on a stream seeded by the spawn and the player, so the client shows
exactly what the server will stage, and two players standing on one cell get
their own answers. A genderless pokemon on either side of Cute Charm leaves the
gender alone.

What a chunk holds is the same for everybody standing in it. No field effect
changes which species turned up — only how many a player can see, and what the
ones they meet come out as.

An **egg** may be the buddy, and has to be for its steps to count, but it reports
no field effects at all: it is carried, not accompanied.

## The seven ways to meet one

`EncounterType` records how a pokemon was met, and the record keeps it forever:

| Kind               | Where it comes from                                            |
| ------------------ | -------------------------------------------------------------- |
| **Wild**           | A spawn standing in a chunk, or a hidden grotto's pokemon      |
| **Hatched**        | An egg walked open                                             |
| **Legendary Raid** | A cleared legendary raid, at level 50                          |
| **Shadow Raid**    | A cleared shadow raid, at level 25, keeping the Shadow ability |
| **Mythical Raid**  | A raid called out with a relic, at level 30                    |
| **Team Rocket**    | Taken off a beaten grunt: a shadowed commoner at level 10      |
| **Fateful**        | An event or gift                                               |

The three raid kinds are kept apart because they are not the same prize. A
legendary raid hands over a legendary half-grown; a shadow raid usually stages
one of the biome's rare species, hands it over lower, and its catch carries the
Shadow ability for good; a mythical arrives lowest of the three, because the
prize is the pokemon itself rather than what it comes ready to do.

A raid prize is derived against the **raid's own** chunk and window rather than
wherever the player is standing when they claim it, so a late claim meets exactly
what the raid staged. A mythical's origin is recorded as `Beyond`, since a relic
calls something out of a place the map does not contain.

Once a pokemon has been met, the derived encounter is stored per player — see
[`encounters/{spawnId}:{uid}`](../firestore/overworld.md#encountersspawniduid) —
so meeting it again shows the same pokemon rather than rolling a new one.
