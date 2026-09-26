# The AI

How an idle unit picks a move, which candidates are dropped before they are
scored, and what a hit is worth.

Units are driven by the AI in [`src/battle/ai/`](../../src/battle/ai/). Every
tick, each **idle** unit picks its best move and casts it. Idle means alive, not
casting, not channelling, with no triggered move pending, and no status locking
it out.

The idle set is maintained by the lifecycle events rather than rescanned. The
outcome check never asks the AI what it _would_ do, because consuming a random
would pull every replay off its seed.

## Keeping the idle set accurate

A set that stands in for a check is only worth keeping while it cannot go stale.
Two rules hold it up.

- **Bookkeeping opens before the thing it tracks, and closes before anything
  that could veto the close.** Both halves run at `Pre`. A move with no delay
  ends inside the event that started it, so a listener marking the trigger
  pending afterwards would run once the end had gone by, and leave its unit
  pending for the rest of the fight.
- **Pending triggers are counted rather than flagged.** One move can put several
  in the air at once, because Mirror Move casts its copy from inside the trigger
  it is finishing. A flag cleared by the first to land would free the unit while
  the rest were still coming.

The tick loop walks a copy of the set and re-asks the check before letting
anything act, so a stale entry costs a wasted comparison rather than a move.

## A move the AI picks is a move that works

Before a candidate is scored it is asked whether it would **do** anything. One
that would not is dropped rather than ranked last. A cast costs time, a cooldown
and an opening, and a move that resolves to "but it failed!" spends all three
for nothing.

The first question is whether there is anybody to aim at. A move that reaches
only the far side has nothing to do once the far side is down. A move with no
candidate target is left **out of the running** rather than offered with nothing
named, which is how a unit ends up winding up move after move at an empty field
forever. What reaches its own side always has the user to reach, so a survivor
can still buff itself.

Every effect that can refuse a move on trigger answers the same question
speculatively. The speculative answer sits next to the refusal itself, so the
two cannot drift apart. The cases are:

- Immunity of any of the three kinds.
- A status the target already carries, or cannot take.
- Dream Eater against somebody awake.
- Counter with no hit to return.
- Mirror Move or Mimic with nothing to copy.
- Disable with nothing to lock.
- Substitute the user cannot afford.
- Rest used by something that cannot sleep.
- A switch-out with an empty bench.
- Anything a raid boss is immune to.

A unit whose every move is refused casts nothing that tick and asks again on the
next one. The field, not the unit, is what has to change.

## Abilities and the speculative pass

Both AI questions, whether a move is usable and what it is worth, run on the
**`AttackPriority`** scale, the one with a `Prepare`/`Cleanup` bracket that
always closes. That is what lets an ability scope the AI's guess the same way it
scopes the real thing. **Mold Breaker** opens its suppression window around the
two speculative events exactly as it does around `UnitTriggerMoveTarget` and
`UnitAttack`, so its holder weighs a Bone Club against a Levitating target as
the hit it will actually be. Without that, the holder refuses the one move its
ability exists to allow, and the AI would need a second copy of what Mold
Breaker ignores.

Most abilities need no such wiring, because the speculative pass already asks
what they answer: every immunity query, and the whole damage pipeline behind the
score. Two thirds of the roster reaches the AI that way, including Levitate, the
absorbs, Thick Fat, Filter, Multiscale, Guts, Technician and the weather ones.

What does not is anything that only acts when a move **actually resolves**. Five
of those change what a good pick is, and each says so itself, next to the
effect:

| Ability                              | What the AI is told                                |
| ------------------------------------ | -------------------------------------------------- |
| **Damp**                             | The move cannot be cast at all, refused            |
| **Magic Guard**                      | A poison that will take no health, refused         |
| **Liquid Ooze**                      | A drain that comes back the other way, discouraged |
| **Synchronize**                      | A status that lands on the user too, discouraged   |
| **Static** and the contact punishers | Touching costs something, discouraged              |

The last three are discouraged rather than refused. The move still does its job,
so it loses to an equally good one that is free, and still beats doing nothing.

Damp is the exception, because its veto lives on the cast check and the AI
**cannot ask that**. Infatuation answers the same question with a coin toss, and
a speculative flip would pull every replay off its seed.

## Scoring a hit

- Taking a unit off the field is worth `KILL_BONUS` (8). That sits above the
  widest chip and above a heal, far enough above both that no wind-up a killing
  move has to pay makes chipping look better than finishing.
- Getting there first is worth `PRIORITY_KILL_BONUS` (2) more.
- A hit that leaves the target standing is scored on the share of the remaining
  health it takes, out of `DAMAGE_SCALE` (5). Such a hit falls short of a kill
  by definition, so the band tops out one below it, at 4. Scoring against a top
  the hit can actually reach is what makes a near miss count for more.

The AI also drops a cast that would change nothing: a screen or a veil its side
already holds, weather under a sky nobody answers to, and a stat drop the far
side is holding off, whether by a raid boss or by Mist, Clear Body, Hyper Cutter
or Big Pecks.

## A simulated check leaves no cue

Every `Check*` event carries `simulated`, which is true while the AI is weighing
a move it has not cast. A listener may still answer the question, and must do
nothing else: **no cue, no stage of its own, nothing a watcher could see.** An
ability that blocks a stat drop shows its cue when the drop is really aimed at
it, not each time the AI weighs a move.

## Stage boosts in a raid

In a raid the AI adds a bonus to friendly stage boosts, big enough to outbid any
non-lethal damage. A party facing a health pool that size wants its first casts
spent making the rest of them count.

**The boss is exempt.** It does not have to survive a long fight, and its casts
are already doubled. A boss cast spent winding up a Withdraw is an opening
handed to the lobby.

## See also

- [The battle engine](../engine.md): the index for these pages
- [Time and phases](time-and-phases.md): the clock, the gates and the cooldowns
  the AI is scoring against
- [How a fight ends](ending.md): the check that runs after every tick
- [Drawing a fight](canvas.md): the demo raid the AI bugs were found in
- [Battles](../mechanics/battles.md): the same rules as a player meets them
