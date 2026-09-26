# Drawing a fight

The two layouts the battle canvas draws a field in, the mark a landed hit
leaves, and the demo pages that stage a fight without one being paid for.

## Two ways to draw a field

A player watches a fight from behind their own party, so the canvas draws two
rows: the viewer's below, what it is up against above, and everybody else's team
left out. A full raid would otherwise be forty-eight pokemon, most of them
nobody's business.

A **spectator** of a raid has no party to stand behind and no reason to leave
anybody out, so they get the fight as it is laid out. The **boss sits in the
middle**, the parties on an ellipse around it, each party a small ring of its
own, and every pokemon turned to face the middle. It shows two things a pair of
rows cannot: who came with whom, and that the fight is one boss with a lobby
closed around it.

Facing is worked out per unit by
[`facingToward`](../../src/canvas/facing.ts), which rounds the angle to the boss
to one of the eight rows a sheet carries. It sits in its own module with its own
test because a canvas y axis grows **downward**, so `down` is the larger y.
Getting that backwards turns a lobby inside out, with everybody looking away
from the thing they came for, and nothing fails.

A slot too small to hold its own name no longer prints one, and its bars are
drawn no wider than it is. Forty-eight overlapping names say less than none, and
the readout underneath names every one of them anyway.

**The canvas and the readout bind to the battle they are mounted with.** Both
attach their listeners to it once and hold the roster they read off it, so a new
fight needs new ones. That is why the demo renders them under a **keyed**
`Show`. Rolling another seed without that ends the old battle and then goes on
drawing it, which looks exactly like a demo that has frozen.

## Damage marks

A move's picture says what the move **is**. What it did to this pokemon is a
separate mark, drawn where it landed, in the type that dealt it.
[`attack.ts`](../../src/canvas/battle/attack.ts) lights the colour for a
weakness, mixes it toward grey for a resistance, and leaves it colourless for a
blow that never landed. A move that strikes five times lands five marks.

It is drawn small on purpose. A raid is forty-eight pokemon trading blows, and a
mark the size of a pokemon turned the field into a wall of white rings.

## The demo pages

[`/demo/raid`](../../src/routes/demo/raid.tsx) stages a raid out of a seed: one
boss against `DEMO_TEAMS` (8) parties of `DEMO_TEAM_SIZE` (6), rolled by
[`createDemoRaidTeams`](../../src/overworld/demo-raid.ts) and fought by the same
`createRaidBattle` a real lobby uses, over the same `TeamSnapshotRecord` shape a
real lobby publishes. It writes nothing, settles no raid and pays nobody.

It exists because the engine and the sprite canvas are the two parts of the game
that need a **fight** before they can be looked at at all. Every fight the game
stages is one somebody walked to, filled a lobby for and paid for, so the part
of the game that most needs watching was the hardest to reach. The seed is in
the URL, so a fight is a link and two people watch the same frames.

Three pages sit beside it under the same rules:

- [`/demo/move`](../../src/routes/demo/move.tsx) stages one move in a live
  engine, with an **Always hits** switch on by default, so a Fissure can be
  watched without waiting out its accuracy.
- [`/demo/weather`](../../src/routes/demo/weather.tsx) draws any of the twenty
  six skies over any biome's ground, at any strength, running or stopped a frame
  at a time, through both of the board's painters.
- [`/demo/shadow`](../../src/routes/demo/shadow.tsx) throws a shadow at any
  hour, from any camera angle, anywhere between the middle of the world and its
  edge. It also draws a bar on the ground from the light alone, so a shadow that
  has stopped agreeing with the sun reads as a picture leaning one way and a bar
  pointing another.

All of them are `clientOnly`. A canvas and a frame timer do not exist until a
browser is here, so the server sends the title and a space for it.

They also carry no session. `/demo/*` is named in `AuthProvider` as sessionless:
the provider is still mounted so `useAuth` works anywhere, but it opens no
listener and never builds a Supabase client, which is imported **on demand**
inside `onMount` rather than at the top of the module. A demo battle that opened
an auth listener would be reading a real Supabase project. The side effect is
that the SDK, by a long way the heaviest thing the browser downloads, sits in a
chunk of its own, asked for only by the pages that have a player.

The parties are rolled between `DEMO_MIN_LEVEL` (70) and `DEMO_MAX_LEVEL` (80),
high enough that a field of them lasts long enough against a maxed boss to be
worth watching. They are rolled out of the **fully evolved** species only, 317
of the 559, since at level 70 a Caterpie would have evolved twice over long ago.
Eight full parties is a lobby the canvas can draw as eight points of a circle,
and a crowd besides: whatever the canvas does with a busy field, it does here
first.

### What the demo raid caught

Two bugs turned up within seconds of the page existing, and both had the same
shape. A fight that is being run but not watched looks exactly like a fight that
works.

- Nothing had ever called `unit.enter()` when a battle was built, so the AI's
  idle set started empty and **no unit in any raid ever acted**. `addUnit` now
  enters each unit once it is finished, after its health and statuses are set. A
  unit announced before its health is not alive yet, and would be left out of
  the idle set for the same reason.
- Every unit then acted **once** and stood still forever, because a move that
  resolves in the frame it triggers closed its pending trigger before the AI had
  opened it.

Both are now held down by a test that steps a battle and counts what happens,
rather than only checking that it was built.

## See also

- [The battle engine](../engine.md): the index for these pages
- [Animation](animation.md): which clip a sprite plays while it casts
- [The AI](ai.md): the idle set the demo raid exposed two bugs in
- [Time and phases](time-and-phases.md): the clock the canvas is drawing
- [Battles](../mechanics/battles.md): the same rules as a player meets them
