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

## How a move resolves

| Stage           | What happens                   | How long                                      |
| --------------- | ------------------------------ | --------------------------------------------- |
| **Wind-up**     | The pokemon gathers itself     | About 1.7 seconds                             |
| **Travel**      | The move is on its way         | A quarter second, or the flight time it names |
| **Landing**     | It hits, and the effect lands  | Instant                                       |
| **Carrying on** | Multi-step moves continue      | Another wind-up per step                      |
| **Cooldown**    | That move cannot be used again | Set by the move's PP                          |

**A move is in the air for a moment.** Most take a quarter of a second between
going off and landing — the time a swing takes — while anything thrown names its
own flight time, twice that, and is drawn crossing the field. It is a real gap: a
pokemon that faints or interrupts the attacker during it does so before the hit
arrives.

**Priority shortens the wind-up.** Each point of a move's priority takes time off
it, so Quick Attack visibly comes out faster than a slower move that started
earlier.

**PP is a rate, not a pool.** Nothing runs out during a fight. Instead a move may
be used its full PP's worth of times every three minutes: a 35 PP Tackle returns
about every five seconds, a 5 PP Hyper Beam about every thirty-six. Strong moves
are rationed by the clock.

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
repeatedly, Teleport disappears before it leaves. Each further step takes about as
long as the original wind-up.

### Move selection

A pokemon will not spend a wind-up on a move that resolves to nothing: an immune
target, a status the target already has, Dream Eater against something awake,
Counter with no hit to return, and so on. A wind-up costs time, a cooldown and an
opening, and a failed move spends all three.

In a **raid**, a party favours buffing itself early, because against a health
pool that size the first few moves are better spent making the rest count. The
raid boss does not do this: it attacks.

**Nothing stands still.** Every pokemon fights knowing one move more than it was
brought in with: a plain **Attack**, ten power, back about once a second, and
thrown as whatever the pokemon is — a Charmander's swing is Fire, a Geodude's is
Rock. Nothing teaches it and it is in no learn set; it is simply what a pokemon
does with its hands. It is far too weak to be worth choosing, which is the point:
it is what fills the gaps while the real moves cool, and it never displaces one
of them.

A pokemon shut out of its move set entirely — everything disabled, the swing
included — **Struggles** instead, and pays a quarter of its health for it.
Waiting on a cooldown and having nothing at all are different states, and they
get different answers.

### Animation

A pokemon **winding up** gathers itself: one gesture, repeated, for however long
the wind-up lasts. What it is about to throw makes no difference to it — the
throw is the next part.

A pokemon **throwing** plays the closest thing to that move its sheet actually
has, fitted to the moment the move is in the air so the gesture ends as the hit
lands. Sprite sheets differ — a Machop has a punch, a Magikarp does not — so a
Fire Punch punches on one pokemon and swings on another.

The visible result is that speed can be seen: a slow move is a long gathering,
and Quick Attack is a short one.

None of this affects the fight itself.

## Damage

```text
damage = base damage × critical × 0.85–1.00 × type matchup × same-type bonus
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

There are twenty-two statuses. Six of them — poison, bad poison, sleep,
paralysis, burn and freeze — **follow a pokemon out of the battle**. The rest,
including confusion, flinching, seeding, trapping, hiding and floating, end with
the fight. A pokemon can leave a raid both poisoned and asleep.

Statuses that chip away do so on a clock, since there are no turns. Every
**two seconds**, which is roughly one move and what a turn used to be worth:

| What is chipping | How much of the maximum it takes  |
| ---------------- | --------------------------------- |
| **Poison**       | An eighth                         |
| **Bad poison**   | A sixteenth, growing with each bite |
| **Sand, hail**   | A sixteenth, to whoever is not built for it |

A status that runs out on its own runs out on that clock too:

| Status                      | How long it lasts                         |
| --------------------------- | ----------------------------------------- |
| Flinching                   | 2 seconds                                 |
| Recharging after a beam     | 2 seconds                                 |
| Sleep                       | 4 seconds                                 |
| Confusion                   | 4 to 10 seconds                           |
| Freeze                      | 10 seconds, or until a Fire move thaws it |
| Being trapped               | 8 seconds, biting every 2                 |
| Reflect, Light Screen, Mist | 10 seconds                                |
| Weather                     | 10 seconds                                |
| A disabled move             | 8 seconds                                 |

Poison, bad poison, burn and paralysis have no clock at all: they last until
something cures them. A full-paralysis stumble costs the pokemon 2 seconds
before it may try again.

A held berry cures a status the moment it lands, before the first move is cast.

A fight met on the road is fought **under the sky that was over it**: a trainer
or a grunt standing in the rain fights in the rain, and the sky is kept with the
battle so a replay runs under the same one. Raids, duels and gym seats are fought
under a clear sky whatever the world is doing.

There are nine kinds of weather, from plain sun and rain up to the extreme forms.
In a **raid**, a pokemon that changes the weather changes it only for its own
party — unless the boss changed it, in which case it applies to everybody.
Otherwise one player could impose rain on a lobby of strangers.

## How a fight ends

A fight ends as soon as it can go nowhere: nothing is mid-move, and no surviving
pokemon can act against an enemy. That covers the awkward cases, such as a side
that is alive but permanently unable to do anything.

| Situation                           | Result                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------- |
| One side still standing             | That side wins                                                          |
| Nobody standing, in a raid          | The party wins — a boss taken down with the last of the party is beaten |
| Nobody standing, anywhere else      | A draw                                                                  |
| Both sides standing, nobody can act | A draw                                                                  |

The result appears in a dialog the moment the fight settles, naming the outcome
and what it was worth. Closing it leaves the player standing on the finished
field. Nothing depends on pressing the button: rewards are already granted, and
the result remains on the page.

## Raids

A raid is a party of players against a single **boss**. It is staged by a
**lair**, which is a place rather than a pokemon: the lair decides who lives in
it, and the raid is named after the place, so two Articuno raids in one chunk
carry different names.

A lobby stands for the whole three-hour raid window and anyone may join it; the
host starts it. Each player brings up to **six** pokemon, and a lobby holds
**twenty players**. Somebody fielding two parties still fills one place, and
anybody may stand there and watch without a party at all.

The boss may be defeated **once per window**, not fought once: clearing it closes
the lair until the next window. A raid that is lost, or left unfinished for ten
minutes, restages in place with a new host.

A **mythical raid** is not staged by the world at all. It is called out by
spending a relic, and the world never produces a mythical on its own.

A **shadow raid** usually stages one of the biome's rare species, but one time in
eight it reaches past them and stages a legendary instead.

### The raid boss

A boss is a **maxed legendary with perfect individual stats**, and every player
in the lobby fights exactly the same one. Its raid form gives it:

- A raid-sized health pool: 5,000 plus ten times what the species would have had.
- Double every other stat.
- Wind-ups that take twice as long, and that nothing short of fainting can
  interrupt.
- Single-target moves that strike every enemy at once.
- Immunity to attempts to lower its stats.

A boss opens the fight **dormant**: for the first ten seconds it stands there and
cannot act, which is the party's window to arrive, buff up and land the opening
hits. Sent out again later in the same fight, it skips the warm-up.

It shrugs off everything that would take the fight away rather than make it
harder — sleep, freeze, flinch, trapping and infatuation — unless it did it to
itself, so a boss that uses Rest really does sleep. Infatuation is excluded twice
over: a large lobby always contains somebody the boss would fall for, and a
landed Attract would turn the raid into a queue.

**Only direct hits take health off a boss.** Poison, burns, seeds, weather and
crash damage from a missed Jump Kick do nothing to it, and neither does damage
based on a share of its health. Two things still work: a cost the boss pays
itself, so one that uses Explosion still dies by it, and healing, so draining
moves work normally.

Four moves are removed from a boss before it is staged. **Transform** is banned
because a boss that copies a player stops being a boss, throwing away the health
pool the fight is built around, and **Metronome**, **Mirror Move** and **Mimic**
follow it because each is a route back to Transform. **Ditto** is never staged as
a boss at all.

## Team Rocket grunts

A grunt stands at a Team Rocket cell for three hours at a time; see
[People you meet](npcs.md).

The grunt fields three pokemon — one common, one uncommon and one rare from that
biome — all shadowed, each rolling its own level between **45 and 55**. It is an
ordinary trainer battle: neither side is a boss, so a simultaneous knockout is a
draw. Giovanni, on the rare window that stages him, fields six at **70-80**.

Every player fights the grunt separately. Winning closes nothing for anybody else,
and losing costs nothing but the attempt — the grunt is still there and may be
fought again until the window turns over.

## Trainers and the league

Every other fight a walk can find is fought the same way, and what changes is who
is standing there and how hard they hit. Each pokemon rolls its own level inside
its side's band, so a party has a spread rather than a rank. Which type expert is
standing at a trainer cell depends on the country; see
[People you meet](npcs.md).

| Who                   | What they field                      | Levels |
| --------------------- | ------------------------------------ | ------ |
| **Team Rocket grunt** | Three shadows of the biome's own     | 45-55  |
| **Type expert**       | Three to five of their own type      | 40-60  |
| **Ace Trainer**       | Five fully-grown pokemon of any type | 60-80  |
| **Gym leader**        | Six fully-grown of their gym's type  | 45-65  |
| **Giovanni**          | Six shadows, one of them a legendary | 70-80  |
| **Elite Four**        | Six fully-grown of their own kind    | 65-85  |
| **Champion**          | Their own signature six              | 85-100 |

## Gym seats

A **gym seat** is a cell somebody else's party is standing on. It is the one
place in the world where a walk runs into another player rather than into
something the world rolled, and unlike everything else staged in a chunk it
belongs to whoever last took it rather than to a window: a seat is held until
somebody takes it off them.

**Sitting down** leaves a frozen copy of the party behind, up to six pokemon.
The originals stay the holder's to raise, fight and trade; what a challenger
fights is the copy, exactly as it stood when its owner sat down.

**Challenging** stakes gold on the outcome:

- The loser pays the winner **a tenth of their purse**, capped at 60,000 a
  fight, and never more than they hold.
- A challenger may strip at most **three good wins' worth** off one seat in a
  rolling day. A holder's takings are not capped: they did not choose the fight.
- A settled challenge bars that challenger from the same seat for **half an
  hour**.

**Winning empties the cell rather than handing it over.** The challenger takes
the purse and the seat opens; they then sit down on it like anybody else, with
whatever their party has left after the fight. The trainer they beat is barred
from their own seat for **an hour**, or until somebody else sits down, whichever
comes first.

A seat that turns a challenger away counts the stand: a holder's **defences** are
what the cell brags about, and they reset when the seat changes hands.

Only the **challenger** carries a gym fight out with them: their party keeps the
health it has left and the statuses it picked up. The holder settles nothing,
since what fought was a copy and they were not there.

## Duels

Two players may also fight because they both chose to. A **battle lobby** is
opened by a player, filled by invitation, and private to the people in it. Both
fighters bring up to six pokemon and both have to be ready before the host may
start; everyone else in the lobby watches.

A duel is a plain trainer battle. It **costs nothing and pays nothing**: no
gold, no pokemon, and no wear carried out afterwards. See
[Battle lobbies](duels.md).

Raid lobbies take onlookers too. Anybody may walk up to a lair and watch, and a
player who owns no pokemon can do nothing else.

## Costs and rewards

A battle leaves a party as it found it. Lost health, eaten berries and carried
statuses all persist into the next fight, which is what makes a party something to
look after rather than a row of levels.

| Fight                 | Gold                         | What else                                |
| --------------------- | ---------------------------- | ---------------------------------------- |
| **Mythical raid**     | 3,000                        | The mythical, at level 30                |
| **Legendary raid**    | 2,000                        | The legendary, at level 50               |
| **Shadow raid**       | 1,000                        | A shadow, at level 25                    |
| **Team Rocket grunt** | 1,000 to 10,000              | A shadowed common pokemon, at level 10   |
| **Giovanni**          | 10,000 to 50,000             | The same                                 |
| **Duelling trainer**  | 1,000 to 10,000              | Nothing: they keep their party           |
| **Gym leader**        | 1,000 to 10,000              | Their badge, and a machine of their type |
| **Elite Four**        | 1,000 to 10,000              | Their mark                               |
| **Champion**          | 10,000 to 50,000             | The region's title                       |
| **Gym seat**          | A tenth of the loser's purse | The cell, if you want to sit on it       |
| **Duel**              | Nothing                      | Nothing                                  |

A raid pays everyone the same: the boss decides the purse, not who landed the
last hit. Everything else **rolls its own purse per winner** inside the range
above, so no two wins are quite alike and the same trainer is worth a different
amount to the next player. A **Luck Incense** on the buddy doubles a purse and an
**Amulet Coin** trebles it, wherever the gold comes from.

Rewards wait to be claimed, so leaving early costs nothing. An award is earned
once and kept for good, though the shelf counts every later win.

While a fight is live, every pokemon in it is **locked**: it cannot be levelled,
evolved, given an item, traded, auctioned or entered into a second raid. The lock
lifts when the fight ends, and in any case ten minutes after it started, so a
closed tab never holds a party indefinitely.

## See also

- [Raising a pokemon](raising.md)
- [Items and gold](items.md)
- [Battle lobbies](duels.md)
- [The battle engine](../engine.md): how the engine works internally
