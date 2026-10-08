---
applyTo: 'src/canvas/battle/moves/**'
---

How a move looks in battle.

- Every legendary or mythical signature move has a shape of its own, painted in `effect/<region>.ts` and `lit/<region>.ts`. Two signatures of one pokemon are two shapes, and a themed group gets one shape each.
- Every other move reuses an earlier shape where the picture is the same, named in `effect/named.ts`.
- A new shape is registered in `EffectShape` and `SPANS`, added to `SHAPES` in `test/canvas/battle-visual.test.ts`, and looked at in `/demo/move` before it is done.

Full convention: `.agents/skills/move-visuals/SKILL.md`.
