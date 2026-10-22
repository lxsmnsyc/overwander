---
applyTo: 'src/canvas/battle/moves/**'
---

How a move looks in battle.

- Every signature move (one family learns it, legendary or not) has a shape of its own, painted in `effect/regions/<region>/` and `lit/regions/<region>/`. Two signatures of one pokemon are two shapes, and a themed group gets one shape each.
- Every other move reuses an earlier shape where the picture is the same, named as its `landing` in `src/data/moves/visual/`.
- A new shape is added to `EFFECT_SHAPES` in `src/data/moves/visual/shape-names.ts` and given a `span` in `shapes.yaml`, added to `SHAPES` in `test/canvas/battle-visual.test.ts`, and looked at in `/demo/move` before it is done.

Full convention: `.agents/skills/move-visuals/SKILL.md`.
