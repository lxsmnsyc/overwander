# Catching

There is no wild battle. Meeting a pokemon opens a **safari session**
([`src/overworld/safari.ts`](../../src/overworld/safari.ts)): choose a ball, feed
it something, throw, and hope. Every action costs a turn, every failed throw
risks it bolting, and the session ends caught, fled or walked away from.

The session is built on the same event engine the battle uses, for the same
reason: each action only emits, and its effect rides the event at `Exact`. A
listener can veto any action by disabling its event before it lands, and the UI
watches settled events at `Post`. The random source is injected, so every session
replays.

## What a throw is worth

```text
catch chance = species catch rate × ball modifier × feeding bonus × species day
               ────────────────────────────────────────────────────────────────
                                          255
```

capped at 1. The species' catch rate is the mainline one, so a Caterpie comes
along and a Chansey does not.

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

## What a miss is worth

A throw that fails to catch rolls again to see whether the encounter runs:

```text
flee chance = species base Speed / 255, capped at 0.5
```

Faster species bolt more readily, and even the fastest stays catchable. Two
encounters never flee at all: a **raid prize** and the pokemon a **beaten Team
Rocket grunt** hands over. Those were fought for, and losing one to a bad roll
after the fight was already won would be a punishment for winning.

An encounter that flees is remembered by key in
[`fled/{uid}`](../firestore/player-stores.md#fleduid) and cannot be met again.
Walking away is different: `runAway` ends the session without marking anything,
so the same pokemon is still standing there until its window turns over.

## The last ball

A player who came in well stocked and threw their way down to a single ball does
not lose the encounter to one last bad roll. When the session opened with more
than `PITY_BALL_THRESHOLD` (100) balls of all kinds and exactly one is left, the
next throw is certain.

The threshold is what keeps that honest: arriving with two balls earns no pity.
The stock has to have been real, and the guarantee is for the player who
genuinely spent it.

## The session's own clock

`turn` counts resolved feedings and throws — an action vetoed before it lands
costs nothing. It is what the Quick Ball and the Timer Ball read, and what the
dialog shows so that a player choosing between them can see which way the clock
is running.

The bag is not part of the session. The number of balls the player is carrying is
refreshed from the inventory before each throw, since spending them happens
through the persistence layer, and that is what makes the last-ball pity visible
*before* the throw rather than after it.

Everything a session actually spends or produces — a ball leaving the bag, a
catch record being written, the fled key — is a server write. See
[Catch records](../firestore/catches.md).
