# Time and phases

The clock a battle runs on, the seed behind every roll, and the four phases a
move passes through.

## The clock

The battle's clock is `battle.tick(duration)`. In the browser a
`requestAnimationFrame` loop feeds it fixed 1/60-second steps and keeps the
remainder for the next frame. A slow frame produces several ticks rather than
one long one, so the fight advances at the same rate on every machine. Tests and
replays call `tick` themselves and run a fight in microseconds.

## Determinism

Every roll comes from one seeded generator, and the seed is the **battle
document's id**. Nothing about a fight is sent between players. Each participant
and each spectator runs the same computation over the same frozen teams, and
gets the same result. A replay is that computation run again, which is why it
settles nothing and pays nothing.

## The four phases

| Phase        | What it is                               | How long                       |
| ------------ | ---------------------------------------- | ------------------------------ |
| **Cast**     | Winding up the chosen move               | `(104 − 16 × priority)` frames |
| **Trigger**  | The move landing, once per step          | Immediate                      |
| **Channel**  | The remaining steps of a multi-step move | The cast time again, per step  |
| **Cooldown** | That one move being unusable again       | `180 / PP` seconds, less Speed |

A base cast is 104 frames, about 1.73 seconds. Each point of move priority takes
16 frames off it, so priority is the mainline number doing real-time work.

## Cooldown and Speed

Cooldown is derived from **PP**, which has no other job here.
`PP_COOLDOWN_BASIS` is 180, so a move is usable its full PP's worth of times in
three minutes. PP is a rate rather than a pool, so nothing runs out mid-raid and
a strong move is still rationed.

Speed is spent on that wait, because a real-time fight has no turn order to win.
Every `SPEED_COOLDOWN_HALVING` (512) points of Speed halves what is left of the
cooldown above the floor. The curve approaches `MAX_SPEED_COOLDOWN_CUT` (95%
off) asymptotically and never reaches it, so no point of Speed is wasted.
`SPEED_COOLDOWN_CEILING` (4096) is where it has effectively arrived: eight
halvings in, and within half a point of the floor. That is past everything the
roster reaches short of stacking every multiplier it owns.

`CheckUnitMoveCooldown` carries the curve. The mechanic answers the PP wait at
`Exact` and the Speed cut at `Post`, reading `resolveStat` so stages count. That
is what makes Agility, Swift Swim, Speed Boost, Choice Scarf and the paralysis
halving do anything at all.

A linear cut was tried first and dropped. At 5% per 32 points it reached its cap
at 576 Speed, which 540 of 559 species clear at +6 stages, so most of the roster
sat on the cap.

## Interrupting a cast

A cast is **interruptible**. Flinching stops it, and so does its target
fainting. A move that has already triggered cannot be taken back.

## Switching

A switch is a walk across the field, not a disappearance. The pair change places
in front of everybody over `SWITCHING_SPAN` (1000ms). The one crossing keeps
casting what it had started, and anything aimed at it follows the swap onto
whoever took the spot: a cast, a channel, and a move already in the air.

**Teleport** is the exception. It takes its user out of the world. It still
interrupts, still stops the pair acting, and is still untouchable while it runs.
`UnitSwitch` and `UnitFinishSwitch` carry the cause that started them, which is
what tells the two kinds apart.

## The three gates

Three gates stand in front of a move. Each is asked by the call it guards rather
than checked afterwards.

| Gate                         | Asked before                                  |
| ---------------------------- | --------------------------------------------- |
| `CheckUnitTriggerMove`       | The move fires                                |
| `CheckUnitTriggerMoveTarget` | It goes ahead against each one it reached     |
| `CheckUnitTriggerMoveEffect` | It resolves on them                           |

A refusal means the event never runs at all, the same way a refused cast is
never emitted. An effect therefore turns a move aside rather than being
disabled. Dream Eater answers the last of the three.

All three sit on the `AttackPriority` scale, so anything that has to bracket a
move has the `Prepare` and `Cleanup` rungs to do it with.

## Channelling

A move with `steps` triggers once as its cast ends, then **channels** the rest,
one trigger per step. Each step runs as long as the wind-up that opened it,
which is this engine's stand-in for a turn. Moves that want longer say so on top
of it: Bide doubles its step.

A channel is not a second cast, so it is not gated on the move's cooldown. That
cooldown started when the cast finished, and the channel is the rest of that
same use.

Both halves are covered by tests that step a battle one frame at a time rather
than over the phase boundary. They exist because of one bug. The channel asked
`CheckUnitCanCast` instead of `CheckUnitCanChannel`, which refused it on the
cooldown its own cast had just started, and the tick that advances a channel was
guarded on `casting`. No multi-step move ran past its first step. The first step
of Dig, Fly and Teleport is the one that hides the user, so a pokemon that
teleported was invulnerable for the rest of the fight.

## See also

- [The battle engine](../engine.md): the index for these pages
- [The AI](ai.md): how an idle unit picks the move it casts
- [Animation](animation.md): how a clip is stretched over a cast or a step
- [Drawing a fight](canvas.md): the two field layouts, and the demo pages
- [How a fight ends](ending.md): the check that runs after every tick
- [Battles](../mechanics/battles.md): the same rules as a player meets them
