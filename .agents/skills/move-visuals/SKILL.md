---
name: move-visuals
description: >
  How a move is drawn in battle: a landing shape painted twice (canvas and
  lit scene), picked by the move's data or named in its YAML, with a wait
  before it. Every signature move has a shape of its own. Applies whenever adding moves, adding a region's move visuals, or
  changing what a move looks like.
---

A move is drawn as two pictures: the **wait** while the engine holds it open ([`delay.ts`](../../../src/canvas/battle/moves/delay.ts)) and the **landing** when it resolves ([`effect/`](../../../src/canvas/battle/moves/effect/)). Most moves need nothing written: `effectShapeFor` picks a shape from the move's type, category and flags.

What the rules get wrong is data, in [`src/data/moves/visual/`](../../../src/data/moves/visual/) (the `data-yaml` skill):

- **`shapes.yaml`**, keyed by shape: its `span` in ms, `jolt`, `arrives`, the `wait` its landing implies, a `color` of its own, `staged`, and the `types` that fall back on it.
- **A file per stretch of moves**, filed the way `cast/` is, keyed by move: its `landing`, its `wait` as `{ winding, striking }`, its `winding` step (`none`, or a shape) and a `color` (a hex, or a stage name to take that stat's colour).
- The names are checked against `EFFECT_SHAPES` and `DELAY_SHAPES` in `shape-names.ts`, which the `EffectShape` and `DelayShape` unions are read off.

## Signature moves get their own picture

- **Every signature move has a shape of its own**, in every region. A signature is a move only one family learns (counting its forms), legendary or not: Roar of Time, Behemoth Blade, Dragon Darts, Gigaton Hammer, Make It Rain and so on.
- **Check who learns it before reusing a shape.** PokeAPI's `move/<name>` lists `learned_by_pokemon`; one family there means a signature.
- **Two signatures of one pokemon are two pictures.** Behemoth Blade is a sword and Behemoth Bash a shield; Photon Geyser and Prismatic Laser are told apart the same way.
- **A themed group still gets one picture each.** The four forces of nature share a frame in their abilities, but their storms are drawn as four shapes.
- **Everything else reuses an earlier shape** where the picture is the same: Flip Turn is U-turn's, Life Dew is Recover's. Give it the `landing` it takes after.

## Adding a region

1. **New shapes go in `effect/regions/<region>/` and the same path under `lit/`**, one painter each, sharing their timing and colour constants (export them from the `effect` file): `legends.ts` for the region's legendary and mythical moves, `signatures.ts` for its families' own moves. Moves drawn by kind rather than by region live in `themes/`, and the Z-Moves and Max Moves in `z/` and `max/`. Spread both into the `PAINTERS` and `LIT` tables.
2. **Register each shape**: add its name to `EFFECT_SHAPES` in `src/data/moves/visual/shape-names.ts` and run `pnpm id-names` (the editor schemas list the shapes), then give it a line in `shapes.yaml` with its `span`, and a `jolt` if it is heavy. A span worked out from the engine's own timing stays in `SPANS` in `effect/shapes.ts` instead.
3. **Map the moves**: a `landing` on each move in its `visual/` file. A move that strikes on one step and does something else on the last (U-turn, Flip Turn) also takes a `winding` shape; one whose first step hits nobody takes `winding: none`.
4. **The wait:**
   - Charged and thrown moves get a `wait` the way their older kin have one.
   - A shape that crosses the gap or comes down on the target by itself is `arrives: true` in `shapes.yaml`, or a thrown ball is drawn ahead of it.
5. **Tests** in `test/canvas/battle-visual.test.ts`:
   - add each new shape to `SHAPES`, and a stepped move to `STEP_SHAPES`;
   - add a test naming the moves that reuse an earlier shape.
6. **Look at it.** The tests only check that something is drawn. Open `/demo/move?move=<Move Name>` with `pnpm dev` and `pnpm db`, press Cast, and check each new shape mid-flight and on landing, on a bright ground as well as a dark one.
