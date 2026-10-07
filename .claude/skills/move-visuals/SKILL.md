---
name: move-visuals
description: >
  How a move is drawn in battle: a landing shape painted twice (canvas and
  lit scene), picked by the move's data or named in a table, with a wait
  before it. Every legendary or mythical signature move has a shape of its
  own. Applies whenever adding moves, adding a region's move visuals, or
  changing what a move looks like.
---

A move is drawn as two pictures: the **wait** while the engine holds it open ([`delay.ts`](../../../src/canvas/battle/moves/delay.ts)) and the **landing** when it resolves ([`effect/`](../../../src/canvas/battle/moves/effect/)). Most moves need nothing written: `effectShapeFor` picks a shape from the move's type, category and flags.

## Signature moves get their own picture

- **Every legendary or mythical signature move has a shape of its own**, in every region: Roar of Time, Spacial Rend, Judgment, Origin Pulse, Hyperspace Fury, Sunsteel Strike, Behemoth Blade and so on.
- **Two signatures of one pokemon are two pictures.** Behemoth Blade is a sword and Behemoth Bash a shield; Photon Geyser and Prismatic Laser are told apart the same way.
- **A themed group still gets one picture each.** The four forces of nature share a frame in their abilities, but their storms are drawn as four shapes.
- **Everything else reuses an earlier shape** where the picture is the same: Flip Turn is U-turn's, Life Dew is Recover's. Name it in `NAMED` with the shape it takes after.

## Adding a region

1. **New shapes go in `effect/<region>.ts` and `lit/<region>.ts`**, one painter each, sharing their timing and colour constants (export them from the `effect` file). Spread both into the `PAINTERS` and `LIT` tables.
2. **Register each shape** in the `EffectShape` union and `SPANS` in `effect/shapes.ts`, and give a heavy one a `JOLTS` entry in `lit/shapes.ts`.
3. **Map the moves** in `effect/named.ts`. A move that strikes on one step and does something else on the last (U-turn, Flip Turn) also goes in `WINDING_AS`.
4. **The wait:**
   - Charged and thrown moves are named in `delay.ts` the way their older kin are.
   - A shape that crosses the gap or comes down on the target by itself goes in `ARRIVES_ITSELF`, or a thrown ball is drawn ahead of it.
5. **Tests** in `test/canvas/battle-visual.test.ts`:
   - add each new shape to `SHAPES`, and a stepped move to `STEP_SHAPES`;
   - add a test naming the moves that reuse an earlier shape.
6. **Look at it.** The tests only check that something is drawn. Open `/demo/move?move=<Move Name>` with `pnpm dev` and `pnpm db`, press Cast, and check each new shape mid-flight and on landing, on a bright ground as well as a dark one.
