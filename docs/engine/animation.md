# Animation

Which clip a sprite plays during a move, how a move names its preference, and
how one pass is stretched over a cast or a channel step.

| Phase     | The caster plays                                       |
| --------- | ------------------------------------------------------ |
| Cast      | The move's own `cast` list, **stretched over the cast** |
| Channel   | The same clip again, stretched over **each step**       |
| Otherwise | `Idle`, or `Hurt` once knocked out                      |

## A move names a preference, not a clip

A move carries a **`cast`** list of animation clip names, most wanted first. The
battle plays the first one the sprite in front of it actually has.

Sprite sheets are not uniform:

- Six clips are the **bare minimum**, which a sheet cannot be drawn at all
  without: `Idle`, `Attack`, `Walk`, `Sleep`, `Hurt`, `Hop`.
- Four more make up the ten a renderer may assume: `Charge`, `Double`, `Rotate`,
  `Swing`.
- Thirty-eight more are there or not, depending on what the pokemon was drawn
  doing. A Machop has a `Punch`. A Magikarp does not.

Naming one clip per move would mean either every move looking the same, or half
the roster playing nothing. A preference list avoids both:

| Move        | Asks for                        | On a sheet without `Punch` |
| ----------- | ------------------------------- | -------------------------- |
| Fire Punch  | `Punch` → `Uppercut` → `Attack` | Swings                     |
| Blizzard    | `Emit` → `Shoot` → `Charge`     | None                       |
| Thunderbolt | `Shock` → `Emit` → `Attack`     | None                       |

The last entry is always a common clip, so the walk cannot run off the end. [A
registry test](../../test/data/moves.test.ts) checks that for every registered
move, along with no repeats and no invented names. The sprite is asked directly,
with `SpeciesSpriteAnimation.has`, rather than keeping a table of which species
owns which clip: the sheet is the truth, and a second copy of it would go stale.

## Stretched, not looped

The clip fills the **whole cast** rather than repeating inside it. A cast is
`(104 − 16 × priority)` frames and a drawn clip is however long it was drawn.
Looping would run a short clip two and a half times and leave it part-way
through at the moment the move fires, which reads as a twitch rather than a
wind-up.

`play(name, { duration })` scales the playhead so one pass takes exactly that
long, with every frame held proportionally longer or shorter and nothing
dropped. The canvas passes the **whole** window rather than what is left of it.
A rate worked out afresh from the remainder on every frame is a rate that climbs
as the remainder shrinks, and a clip driven that way reaches its end about two
thirds of the way through.

Channelling is drawn the same way. `ChannelingData extends CastingData`, so the
rest of a multi-step move carries the same two things a cast does, which move
and how long this window runs. Neither needs its own case.

The clip gets one pass per **step**, so a Fury Swipes is five swipes rather than
one swipe and four seconds of standing still. A one-shot clip that has run out
while the unit is still working is `restart`ed for the next step rather than
held on its last frame.

Nothing about this reaches the mechanics. `cast` sits beside `delay` as a purely
presentational field: the fight is the same fight with the canvas closed.

## See also

- [The battle engine](../engine.md): the index for these pages
- [Time and phases](time-and-phases.md): where the cast and channel windows come
  from
- [Drawing a fight](canvas.md): the field layouts, damage marks and demo pages
- [The AI](ai.md): what picks the move being animated
