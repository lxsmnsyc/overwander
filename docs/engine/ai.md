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

## The fog

The AI only knows what a foe has shown
([`src/battle/ai/fog.ts`](../../src/battle/ai/fog.ts)). This applies to both
sides, since the AI drives every unit.

- An ability is known once it cues (`UnitTriggerAbility`). Boss is always known.
- A held item is known once it cues (`UnitTriggerItem`).
- A move is known once it is cast. Attack and Struggle are always known, since
  every unit carries them.
- Types, health, statuses and stages are always known.
- The caster's own side hides nothing.

While the AI weighs a move, every hidden ability and item on another side reads
as absent. The fog opens on the same `Prepare`/`Cleanup` bracket as Mold
Breaker, so the damage estimate, the immunity checks, the stage checks and the
ratings all see only what has been shown. A Levitate that has not cued is not
something the AI plans around; once a Ground move fails against it, it is.

Hidden is not the same as absent. A rule that reads a foe's item or ability list
directly assumes the move works until it knows otherwise: Knock Off, Bug Bite,
Pluck and Embargo are not marked down against a foe whose items are unknown, and
Role Play, Gastro Acid and Skill Swap assume the foe holds an ability. Damp
refuses an Explosion only once the caster knows about the Damp.

## Scoring a hit

- Taking a unit off the field is worth `KILL_BONUS` (20). That sits above every
  role's base, so finishing a foe beats any setup, and above every chip and heal.
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

## A raid boss does not set up

A raid boss never scores a self boost. It does not have to survive a long fight,
and its casts are already doubled. A boss cast spent winding up a Withdraw is an
opening handed to the lobby.

## Move roles

[`src/battle/ai/roles.ts`](../../src/battle/ai/roles.ts) gives every move one
or more roles. `getMoveRoles(move)` reads them from the move data and the
registries in `src/battle/moves`. A move may hold several roles: Fly is damage,
a wind-up and a shield all at once.

`ROLE_BASE` says what each role is worth at the start of a fight, before
relevance and the fight's phase scale it. The order is:

1. Shield: moves that keep the damage off, such as Protect, Substitute and Fly.
2. Team setup and hazards.
3. Field effects: weather, terrain and rooms.
4. Status: afflicting a foe.
5. Self boosts.
6. Disruption.
7. Foe drops and support for a teammate.
8. Damage, which is scored by the hit itself.

A test fails when a registered move has no role, so a new move cannot go
unscored without anyone noticing.

[`src/battle/ai/role-score.ts`](../../src/battle/ai/role-score.ts) scores a
status move by its roles: each role adds its base times a relevance from 0 to 1.
A damaging move counts only its Shield role, since its side effects are chances
and the hit is scored on its own.

| Role       | Relevant when                                                                              |
| ---------- | ------------------------------------------------------------------------------------------ |
| Shield     | A foe is winding up a hit that reaches the unit; Substitute above half health              |
| TeamSetup  | A foe has shown a move the veil stops; fades with team health                              |
| Hazard     | Always; fades with team health                                                             |
| Field      | The weather or terrain favours the caster's side; Trick Room for the slower side           |
| Status     | Scaled by the target's remaining health                                                    |
| SelfBoost  | The stat is one the unit uses, with room left to rise; scaled by its health                |
| FoeDrop    | The stat has room left to fall; fades with team health                                     |
| Disruption | Taunt against a foe that has shown a status move; Roar and Whirlwind against raised stages |
| Support    | Helping Hand for a teammate with a damaging move                                           |

Every other role adds nothing yet, and is weighed by the move's own rules.

A damaging move's side effect adds the role it stands for, times the odds it
lands: a status chance is weighed as Status, a stat drop as FoeDrop, and a rise
on the user as SelfBoost. The odds come from the engine's own effect checks, so
Serene Grace doubles them and Sheer Force gives them up. Only a foe the hit can
touch counts, and flinching is left out, since in real time it only matters if
the hit lands mid-cast.

No role adds more than one point under `KILL_BONUS`, so finishing a foe always
wins.

## Moves that call another

A caller is worth what it would call. `weighCall` in the chooser scores the
called move exactly as the AI would score casting it, and each caller asks it
from its own module:

- Nature Power, Copycat and Mirror Move score as the one move they would call.
- Me First scores as the move it would take, at its extra power.
- Sleep Talk and Assist score as the average of the moves they could draw.
- Metronome could call anything, so it only beats doing nothing.

The focus-fire bonus and a Palace nature's aim skip callers, since the called
move's score already carries them.

## What the caster's own side brings

The AI reads its own side in full, so its kit shapes the score:

- A screen or a weather is worth more when the caster's gear makes it last
  longer. The AI asks the engine's own duration checks, so Light Clay and the
  weather rocks count without being named.
- A stage change is weighed as the unit would really take it:
  `resolveStageChange` answers doubled for a Simple and turned round for a
  Contrary. A Contrary holder does not cast Swords Dance.
- Recoil and crash cost nothing when the engine says the user would not be
  hurt: Rock Head refuses the recoil, and Magic Guard the damage.
- A weather move is worth more when a teammate's ability thrives under that
  sky (Swift Swim, Chlorophyll, Sand Rush and the rest). Each such ability
  registers the skies it wants with `registerWeatherWant`, from its own
  module, so the AI never names one. A sky only the foe gains from, including
  a foe's weather ability once it has shown itself, counts against the move.
- A drain is worth more under a Big Root.
- A hit whose Life Orb recoil would finish its holder is marked down.
- Light Screen is guessed at, for half its worth, when a foe is built to hit
  harder specially than physically, before it has shown a special move.

## The decision context

Each decision runs inside one `AIContext`
([`src/battle/ai/context.ts`](../../src/battle/ai/context.ts)). A scoring
listener asks for it with `getAIContext(battle, source)` rather than working the
field out again for every move and target:

- the living friends and foes;
- each unit's rating and threat band, computed once per decision;
- a team's health share, with fainted units counting as no health;
- `foesKnow(test)`, which asks whether a foe has shown a matching move.

A question asked outside a decision, as a test does, gets a fresh context.

## Teammates casting over each other

Teammates decide one at a time but cast over each other, and a cast takes about
1.7 seconds to wind up. [`src/battle/ai/coordination.ts`](../../src/battle/ai/coordination.ts)
reads what each friend is already casting, and refuses a move the friend's cast
already covers:

- the same veil, tailwind or team guard over the same team;
- the same weather, terrain or room over the field;
- the same hazard on the same side, except Spikes and Toxic Spikes, which stack;
- an affliction at a foe a friend is already afflicting.

A cast is on show, so reading it is no peek. Only casts still winding up are
read; a move already in flight for its last quarter of a second is not.

## Measuring a change

Two tools show what a scoring change does, so tuning is measured rather than
guessed.

- **`pnpm ai:sim`** plays AI-against-AI battles headless and prints what was
  cast: each role's share of all casts, its share on the winning and the losing
  side, and the most cast moves. The parties are random, built the way an
  expert's are. `SIM_BATTLES`, `SIM_SIZE` and `SIM_LEVEL` override the defaults
  of 40 battles, three a side, at level 50. It runs on its own config
  (`vitest.sim.ts`), since a run takes minutes.
- **`test/battle/ai-openings.test.ts`** pins how a few fixed fights open, as a
  snapshot. A scoring change that moves an opening fails it, and a deliberate
  one updates it with `vitest -u`.

The "lean" column in the report is the winners' share of a role over the
losers'. Above 1, the winning side cast that role more. It is a correlation over
random parties, not proof that the role wins fights.

## See also

- [The battle engine](../engine.md): the index for these pages
- [Time and phases](time-and-phases.md): the clock, the gates and the cooldowns
  the AI is scoring against
- [How a fight ends](ending.md): the check that runs after every tick
- [Drawing a fight](canvas.md): the demo raid the AI bugs were found in
- [Battles](../mechanics/battles.md): the same rules as a player meets them
