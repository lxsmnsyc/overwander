# Battles

Battles in Overwander are fought in **real time** rather than in turns. Each
pokemon winds up a move, the move lands, and that move then has to cool down
before it can be used again. Two pokemon with quick moves trade several times
while a third is still charging a Solar Beam.

Players do not choose moves during a fight. Each pokemon picks for itself, and
will not choose a move that would do nothing.

Fights come from five places: **raids** at a lair, the **trainers** a walk runs
into, **Team Rocket** stops, a **gym seat** another player is holding, and a
**duel** two players opened between themselves.

This page covers how a fight itself runs. The rest is on its own page:

| Page                                   | What it covers                                      |
| -------------------------------------- | --------------------------------------------------- |
| [Raids](raids.md)                      | Lairs, lobbies, the boss, mythical and shadow raids |
| [Who you fight](battle-opponents.md)   | Trainers, the league, Team Rocket, gym seats, duels |
| [Costs and rewards](battle-rewards.md) | What a fight costs, what it pays, what it locks     |

## How a move resolves

| Stage           | What happens                   | How long                                      |
| --------------- | ------------------------------ | --------------------------------------------- |
| **Wind-up**     | The pokemon gathers itself     | About 1.7 seconds                             |
| **Travel**      | The move is on its way         | A quarter second, or the flight time it names |
| **Landing**     | It hits, and the effect lands  | Instant                                       |
| **Carrying on** | Multi-step moves continue      | Another wind-up per step                      |
| **Cooldown**    | That move cannot be used again | Set by the move's PP, less what Speed buys off |

**A move is in the air for a moment.** Most take a quarter of a second between
going off and landing, which is the time a swing takes. Anything thrown names
its own flight time, twice that, and is drawn crossing the field. It is a real
gap: a pokemon that faints or interrupts the attacker during it does so before
the hit arrives.

**Priority shortens the wind-up.** Each point of a move's priority takes time
off it, so Quick Attack visibly comes out faster than a slower move that started
earlier.

**PP is a rate, not a pool.** Nothing runs out during a fight. Instead a move
may be used its full PP's worth of times every three minutes: a 35 PP Tackle
returns about every five seconds, a 5 PP Hyper Beam about every thirty-six.
Strong moves are rationed by the clock.

**Speed shortens every cooldown.** There is no turn order to win in a real-time
fight, so what Speed buys is throwing the same move oftener: every 512 points of
Speed halves what is left of the wait, closing on 95% off without ever quite
getting there. A pokemon at 170 waits a fifth less than the move asks, one at
500 waits half as long, and one at 1,500 is down to a sixth. Nothing is ever
wasted on a stat that has run out of room. It is the stat as it stands at that
moment, so an Agility, a Choice Scarf, Swift Swim under rain and paralysis all
show up in how often a pokemon acts.

**A wind-up can be interrupted.** Flinching stops it, and so does the target
fainting. A move that has already landed cannot be taken back.

**Switching is a walk across the field**, not a disappearance. The pair change
places in front of everybody, the one crossing keeps winding up whatever it had
started, and anything aimed at it, a wind-up, a channel or a move already in the
air, follows the swap onto whoever took the spot. Switching out of a hit is
therefore switching somebody else into it. Only **Teleport** takes its user out
of the world: that one interrupts, stops both ends acting, and cannot be touched
while it goes.

**Some moves take several steps.** Dig spends time underground, Thrash swings
repeatedly, Teleport disappears before it leaves. Each further step takes about
as long as the original wind-up.

### Move selection

A pokemon will not spend a wind-up on a move that resolves to nothing: an immune
target, a status the target already has, Dream Eater against something awake,
Counter with no hit to return, and so on. A wind-up costs time, a cooldown and
an opening, and a failed move spends all three.

**Nothing stands still.** Every pokemon fights knowing one move more than it was
brought in with: a plain **Attack**, ten power, back about once a second, and
thrown as whatever the pokemon is. A Charmander's swing is Fire, a Geodude's is
Rock. Nothing teaches it and it is in no learn set; it is simply what a pokemon
does with its hands. It is far too weak to be worth choosing, which is the
point: it is what fills the gaps while the real moves cool, and it never
displaces one of them.

A pokemon shut out of its move set entirely, the swing included, **Struggles**
instead, and pays a quarter of its health for it. Waiting on a cooldown and
having nothing at all are different states, and they get different answers.

### Animation

A pokemon **winding up** gathers itself: one gesture, repeated, for however long
the wind-up lasts. What it is about to throw makes no difference to it, since
the throw is the next part.

A pokemon **throwing** plays the closest thing to that move its sheet actually
has, fitted to the moment the move is in the air so the gesture ends as the hit
lands. Sprite sheets differ, since a Machop has a punch and a Magikarp does not,
so a Fire Punch punches on one pokemon and swings on another.

The visible result is that speed can be seen: a slow move is a long gathering,
and Quick Attack is a short one.

**A move looks like what it is.** A contact move lands as a jab, a hit, a slam
or a fist, picked by its type and its power. A guard closes in, a boost runs
upward, a drain pulls health back, sound carries across the gap, powder drifts,
and a psychic move already has hold of its target on the way over. A stat change
is drawn as chevrons on whoever moved, rising for a raise and falling for a
drop, coloured by which stat it was. Reflect, Light Screen and Safeguard put up
a pane of coloured glass over the middle of the team.

**A blow is drawn in the type that dealt it.** The mark is lit for a weakness,
drained toward grey for a resistance, and the type's own colour in between. A
move that strikes five times lands five marks, and only a move that never landed
leaves a colourless one.

Weather arrives over the field rather than over whoever called for it. In a raid
it is drawn over the side that called it, since that is the side it is doing
anything for.

None of this affects the fight itself.

## Damage

```text
damage = base damage × critical × roll (0.85 up to 1.00) × type matchup × same-type bonus
```

| Part                | Effect                                                    |
| ------------------- | --------------------------------------------------------- |
| Critical hit chance | 1 in 16, raised by moves and items that sharpen it        |
| Critical hit damage | ×2, ignoring defence buffs that would have blunted it     |
| Same-type bonus     | ×1.5 when the move matches one of the user's types        |
| Type matchup        | The full type chart, applied once per type the target has |
| Random roll         | Between 0.85 and 1.00                                     |

A critical hit ignores the attacker's _lowered_ attack buffs and the defender's
_raised_ defence buffs, and nothing else, so a sweeper that has been snarled at
still lands its criticals properly.

Three things block a move outright before any of this: the type chart's own
immunities, **powder** moves against Grass types, and **Ground** moves against
anything airborne. A Flying or floating pokemon can be dragged back to earth, at
which point Ground moves reach it.

Physical moves use Attack against Defence and special moves use Special Attack
against Special Defence. A few fixed-damage moves ignore the formula entirely.

## Statuses and weather

There are twenty-two statuses. Six of them **follow a pokemon out of the
battle**: poison, bad poison, sleep, paralysis, burn and freeze. The rest,
including confusion, flinching, seeding, trapping, hiding and floating, end with
the fight. A pokemon can leave a raid both poisoned and asleep.

Statuses that chip away do so on a clock, since there are no turns. Every **two
seconds**, which is roughly one move and what a turn used to be worth:

| What is chipping | How much of the maximum it takes            |
| ---------------- | ------------------------------------------- |
| **Poison**       | An eighth                                   |
| **Bad poison**   | A sixteenth, growing with each bite         |
| **Sand, hail**   | A sixteenth, to whoever is not built for it |

A status that runs out on its own runs out on that clock too:

| Status                      | How long it lasts                          |
| --------------------------- | ------------------------------------------ |
| Flinching                   | 2 seconds                                  |
| Recharging after a beam     | 2 seconds                                  |
| Sleep                       | 4 seconds                                  |
| Confusion                   | 4 to 10 seconds                            |
| Freeze                      | 10 seconds, or until a Fire move thaws it  |
| Being trapped               | 8 seconds, biting every 2                  |
| Reflect, Light Screen, Mist | 10 seconds                                 |
| Weather                     | 10 seconds                                 |
| A disabled move             | 8 seconds                                  |
| Perish Song                 | 8 seconds, and then whoever heard it falls |

Poison, bad poison, burn and paralysis have no clock at all: they last until
something cures them. A full-paralysis stumble costs the pokemon 2 seconds
before it may try again.

A held berry cures a status the moment it lands, before the first move is cast.

A fight met on the road is fought **under the sky that was over it**: a trainer
or a grunt standing in the rain fights in the rain, and the sky is kept with the
battle so a replay runs under the same one. Raids, duels and gym seats are
fought under a clear sky whatever the world is doing.

There are nine kinds of weather, from plain sun and rain up to the extreme
forms. A raid changes who a new sky covers: see [Raids](raids.md).

## How a fight ends

A fight ends as soon as it can go nowhere: nothing is mid-move, and no surviving
pokemon can act against an enemy. That covers the awkward cases, such as a side
that is alive but permanently unable to do anything.

| Situation                           | Result                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------- |
| One side still standing             | That side wins                                                         |
| Nobody standing, in a raid          | The party wins. A boss taken down with the last of the party is beaten |
| Nobody standing, anywhere else      | A draw                                                                 |
| Both sides standing, nobody can act | A draw                                                                 |

The result appears in a dialog the moment the fight settles, naming the outcome
and what it was worth. Closing it leaves the player standing on the finished
field. Nothing depends on pressing the button: rewards are already granted, and
the result remains on the page.

## See also

- [Raids](raids.md): lairs, lobbies and the raid boss
- [Who you fight](battle-opponents.md): trainers, Team Rocket, gym seats, duels
- [Costs and rewards](battle-rewards.md): purses, prizes and what a fight costs
- [Raising a pokemon](raising.md)
- [Items and gold](items.md)
- [Battle lobbies](duels.md)
- [The battle engine](../engine.md): how the engine works internally
