# Eggs

An egg is an ordinary catch record with the `egg` flag still on. Everything about
the pokemon inside it is decided the moment the egg is granted, so hatching
**reveals rather than rolls**: asking again cannot produce a better pokemon than
the nest or the pair gave.

Every egg starts at level 1, holds nothing, and is refused everywhere a pokemon
is expected — it cannot be given an item, levelled, evolved, fielded in a raid or
groomed. What is inside one has not met anybody yet.

The catch dialog hides everything read off the species until the flag comes off,
and the lists say only "Egg". That is presentation rather than secrecy: catch
documents are readable, so a determined player can read the species out of
Firestore directly, and nothing is staked on them not doing so.

## Where an egg comes from

### A nest

A **Nest** landmark holds one egg per `NEST_INTERVAL` — **twelve local hours**,
so it refills at midnight and at noon where the player is standing, and each
player may take one per half day.

What is lying in it is drawn from the biome's **egg pool** for that window's time
of day: the base, uncommon and rare bands **reduced to the first stage of each
line** and merged, since a nest holds what hatches rather than what it grows
into. A biome where four stages of one line spawn is a biome where that egg is
four times as likely — which is what the three bands already came to, worked out
once per biome instead of at every roll.

Two bands are left out, for different reasons. The **special** tier is not in the
pool at all, so no nest ever holds a legendary. The **prized** tier is left out
because a baby is _already_ in the list: it is the first stage of its line, so
every ordinary entry of that line walks back to it, and adding the band would
count it twice. What that leaves out is an unown, which has no line to be walked
back along — it is met rather than hatched, which is the right answer for it.

The hatchling is guaranteed **one move off its line's egg list**, which is the
reason to walk the egg at all. The inherited move goes first in the move list so
that it survives the four-move limit.

### A breeder

A **Breeder** takes two of the player's pokemon and `BREEDING_FEE` (5,000) gold.
Neither parent is consumed, held or locked; they are handed back the moment the
egg exists.

What a pair may produce is decided from the **stored** records:

| Rule                              | Why                                        |
| --------------------------------- | ------------------------------------------ |
| A shared egg group                | The mainline rule                          |
| Opposite genders, or one Ditto    | Two Dittos produce nothing                 |
| Neither in the undiscovered group | Where legendaries and the unbreedable live |
| Neither is an egg                 | An egg is not a parent                     |

The egg is the first stage of the **mother's** line — the non-Ditto parent's when
a Ditto stands in, since a Ditto passes on nothing of its own.

## What a bred egg inherits

Three of the six individual values (`INHERITED_IVS`) are copied straight off one
parent or the other and the rest are rolled fresh. Which three, and which parent
each comes from, are both drawn from the stream, so the same pair left with the
breeder twice is two different pokemon.

Whatever the line can **only** inherit and one of the parents actually knows is
passed on. That is what makes breeding a way to *teach* a move rather than a way
to roll one, and inherited moves are placed first so the four-move limit cannot
eat them.

Its level, nature, ability and gender are its own.

A **shadow parent may pass the shadow on**, but only half the time
(`SHADOW_INHERITANCE_CHANCE`), so breeding two of them is no more certain than
breeding one. An egg that inherits it hatches with the Shadow ability for good,
costs double candy to raise, and takes `SHADOW_HATCH_FACTOR` (2×) the usual steps
to open: what is in there should not be, and it takes longer to come out.

Because a bred egg's values are an inheritance, its packed `ivs` no longer agree
with its `individualValue` — the roll it would have been sliced from. Everything
that matters reads the stored values; the roll stays beside them because the two
disagreeing is exactly the useful fact.

## Walking one open

Only the **buddy** walks, and an egg may be the buddy — has to be, for its steps
to count. The client counts cells crossed and reports them in batches of eight.

| Rule                | Value                                       |
| ------------------- | ------------------------------------------- |
| `EGG_HATCH_STEPS`   | 2,560 steps (double for a shadow egg)       |
| `MIN_STEP_INTERVAL` | 250 ms — the fastest a step can be credited |
| `MAX_STEP_REPORT`   | 64 steps in one report                      |

**Flame Body halves the walk.** An egg picked up while a Flame Body pokemon was
walking beside the player needs half the steps, and the halving is written into
`hatchSteps` there and then — the same field a shadow egg has already doubled.

It has to be settled at the pick-up rather than while the egg is walked, because
walking an egg means carrying *the egg* as the buddy: from that moment there is
nothing beside the player to keep it warm. So the choice is a real one — walk to
the nest with the Ponyta, and swap for the egg once it is in hand — and picking
up a Ponyta afterwards does nothing for an egg already being carried.

The server credits steps **against its own clock**: a report buys no more than
`(now − steppedAt) / MIN_STEP_INTERVAL` steps whatever it claims. The stamp moves
on every report, credited or not, so a refused one banks no time for the next.
That is why the stamp lives on the catch document, which only the server writes,
rather than on the buddy record, which the client does.

Steps and position settle **together**: whatever is pending is flushed at the
moment a position is written, so a player never comes back further along the map
than their egg is along its walk. A portal crossing is not a walk and adds no
steps.

Hatching takes the flag off and pays the family's candy, exactly as meeting the
pokemon any other way would have. It comes out at `HATCHED_FRIENDSHIP` (120)
rather than the 70 a caught pokemon starts at, since the carrying has already
happened.

## The daycare lady

A **Daycare Lady** takes an egg and `DAYCARE_FEE` (2,500) gold and adds
`hatchSteps / 2` to wherever it already stood. It is a share of the requirement
rather than a place on it, so an egg a quarter of the way along comes out three
quarters of the way, one past the halfway mark is finished by a single boost, and
any egg at all is finished by two. The fee is what paces it.

Only an egg already ready to hatch is refused. The step stamp moves with the
jump, since those steps were not walked and the time they would have taken must
not be banked for the next report.

Like every wandering NPC but the vendor she serves a player **once per six-hour
window** per cell, so a second egg means walking to another wandering cell — and
finding whoever happens to be standing on that one. See
[Wandering NPCs](../firestore/overworld.md#wandering-npcs).
