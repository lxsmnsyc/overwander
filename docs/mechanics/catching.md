# Catching

There is no wild battle. Meeting a pokemon opens a **safari session**
([`src/overworld/safari.ts`](../../src/overworld/safari.ts)): throw what is in
hand, go through the bag for something else, or walk away. Every action costs a
turn, every failed throw risks it bolting, and the session ends caught, fled or
walked away from.

The dialog is the pokemon and three buttons. The **top** says only the species,
the level and the gender — nothing for a genderless one, since an empty column is
not information. The **middle** is the sprite, standing there. The **bottom** is
**Items**, **Throw** and **Run away**, in that order.

**Throw** sends whatever is in hand — a ball, which is a catch attempt, or a
treat, which is fed — and says which it is and how many are left. **Items**
opens the bag filtered to balls and treats, in the space the sprite was standing
in, so opening it does not move the buttons under the cursor: picking a ball sets
the preference the session throws from then on, picking a treat puts it in hand
for the next throw alone. A session opens on the first ball in the bag rather
than on a Poke Ball the player may not carry.

**Nothing else is shown.** The catch chance, the flee chance, the feeding bonus
and the turn are all live on the session and none of them is drawn: a player
deciding whether this one is worth the balls should be looking at the pokemon
rather than reading a table off it. What the encounter is really worth — its
values, its nature, its ability — is a thing to be found out by catching it.

The session is built on the same event engine the battle uses, for the same
reason: each action only emits, and its effect rides the event at `Exact`. A
listener can veto any action by disabling its event before it lands, and the UI
watches settled events at `Post`. The random source is injected, so every session
replays.

## What a throw is worth

```text
catch chance = species catch rate × ball modifier × feeding bonus × species day × level
               ─────────────────────────────────────────────────────────────────────────
                                             255
```

capped at 1. The species' catch rate is the mainline one, so a Caterpie comes
along and a Chansey does not.

### The level term

The mainline formula reads how hurt the pokemon is. An encounter here is not a
battle — nothing is fought before it is caught — so there is no health bar to
read, and **level** is what the game knows instead about how much of a pokemon
is standing there:

```text
level term = 1 − (1 − 0.45) × (level − 1) / 99
```

All of the throw at level 1, falling evenly to 0.45 of it at the cap. It is
even rather than curved so a player can feel the rule without being told it,
and it multiplies rather than replacing anything: the species that was easier
to catch is still the easier of the two at any level. A Lv. 38 Gyarados takes
`45 × 0.79 / 255` — about 14% a throw with a Poke Ball, against 17.6% before
its age was counted.

### Ball modifiers

Nine of the fourteen balls are conditional, and the condition is read at the
moment of the throw rather than when the ball was chosen:

| Ball                               | Modifier | Condition                                  |
| ---------------------------------- | -------- | ------------------------------------------ |
| **Master Ball**                    | ∞        | Always; the chance saturates to certainty  |
| **Quick Ball**                     | ×5       | The opening turn only, then ×1             |
| **Net Ball**                       | ×3.5     | Bug and Water types                        |
| **Dive Ball**                      | ×3.5     | Water biomes                               |
| **Repeat Ball**                    | ×3.5     | A species the player already owns          |
| **Timer Ball**                     | up to ×4 | Grows by 1229/4096 a turn, capped near ten |
| **Nest Ball**                      | up to ×4 | `(41 − level) / 10`, never worse than ×1   |
| **Dusk Ball**                      | ×3       | Evening and night                          |
| **Ultra Ball**                     | ×2       | Always                                     |
| **Great Ball**                     | ×1.5     | Always                                     |
| **Poke / Premier / Heal / Luxury** | ×1       | Always                                     |

The Premier, Heal and Luxury Balls catch exactly like a Poke Ball. Two of the
three are worth throwing for what happens *after* the catch rather than for the
throw itself:

- A **Heal Ball** mends whatever is walking beside the player — full health,
  statuses cleared, for nothing. The mainline ball heals what is caught in it,
  and that is already true of every catch here (an encounter is not a battle, so
  a catch always arrives whole), so the ball's field goes where there is
  something to mend. A buddy already whole, an egg, or one locked into a live
  battle is left alone.
- A **Luxury Ball** makes the pokemon caught in it warm to its trainer **twice as
  fast**, for the rest of its life. See [Friendship](raising.md#friendship).

The Premier Ball is a commemorative ball and nothing else, which is the whole of
what it is in the mainline too.

### Feeding

Ten berries can be fed, each worth ×1.25 to the catch chance. They **stack
multiplicatively**, up to a total of ×4 — so four berries is most of what feeding
can do, and a fifth is nearly wasted. The berries are the five single-status
cures plus Leppa, Oran, Persim, Lum and Sitrus: the everyday ones, so that
feeding is a real decision against carrying them for a fight.

Feeding costs a turn, which is what stops it being free: every turn is another
chance for the encounter to bolt, and it advances the Timer Ball's clock while
spending the Quick Ball's.

**One treat at a time.** An encounter that has been fed takes nothing else until
a thrown ball **misses**, so the bag cannot be poured out all at once to walk the
bonus up to its cap before the first throw. The rhythm is feed, throw, feed,
throw — and a catch ends the session, so the flag is only ever cleared by a ball
the encounter shook off. `canFeed()` is asked on the server side of the feeding
too, before the item leaves the bag, so a refusal costs nothing.

## What a miss is worth

A throw that fails to catch rolls again to see whether the encounter runs:

```text
flee chance = its own Speed stat / 255, capped at 0.5
```

Its **own** stat — level, individual value and nature in it — rather than the
number printed against its species. The base said every Rattata in the world
runs alike: a level 5 one met in the first field bolted exactly as readily as a
level 40 one, and a fast individual with a fast nature was no harder to hold
onto than its slow cousin. Both were already known about the pokemon standing
there and neither was being asked.

Reading the real stat makes the flee roll grow with the level the way the catch
chance shrinks with it: a young pokemon is easy to catch and easy to keep hold
of, a full-grown one is neither. Effort values are not counted — nothing wild
has trained. Even the fastest stays catchable, at the 0.5 cap. Two
encounters never flee at all: a **raid prize** and the pokemon a **beaten Team
Rocket grunt** hands over. Those were fought for, and losing one to a bad roll
after the fight was already won would be a punishment for winning.

An encounter that flees is remembered by key in
[`fled/{uid}`](../firestore/player-stores.md#fleduid) and cannot be met again.
Walking away is different: `runAway` ends the session without marking anything,
so the same pokemon is still standing there until its window turns over.

## Wearing it down

Every ball already thrown at an encounter makes the next one worth a little
more:

```text
throw term = 1.01 ^ throws
```

Compound, and counted per **throw** rather than per turn — a feeding is already
paid for by its own bonus. It is nothing for a while and then it matters: ten
balls in, a throw is worth a tenth more than the first; seventy balls in, twice
as much.

This replaced a free catch on the last ball, which was handed to anyone who had
opened the session carrying more than a hundred of them. That rule did nothing
at all for ninety-nine throws and then decided the encounter by itself, and it
made a meeting between two pokemon depend on how full a bag was. Nothing about
the bag reaches the throw now. Patience is still rewarded, a percent at a time,
and nothing rare falls to it — a Mewtwo would take hundreds of balls before the
drift caught up.

## The session's own clock

`turn` counts resolved feedings and throws — an action vetoed before it lands
costs nothing. It is what the Quick Ball and the Timer Ball read. It is not
shown: a player who wants the Quick Ball's opener throws it first, and a player
who wants the Timer Ball's patience is the one who has been throwing.

`throws` counts only the balls, and it is what the drift above reads.

The bag is not part of the session. The number of balls the player is carrying is
refreshed from the inventory before each throw, since spending them happens
through the persistence layer — but nothing about how many there are changes what
a throw is worth.

Everything a session actually spends or produces — a ball leaving the bag, a
catch record being written, the fled key — is a server write. See
[Catch records](../firestore/catches.md).
