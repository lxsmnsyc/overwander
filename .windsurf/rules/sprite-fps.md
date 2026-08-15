---
trigger: always_on
---

All sprite sheets in this game animate at **24fps** - pokemon, effects and particles, overworld characters alike.

- One tick is `SPRITE_TICK` (`1000 / SPRITE_FPS` in `src/canvas/sprite-sheet.ts`). Never write a frame time as a literal, in source or in tests.
- Do not confuse it with the battle clock: the engine ticks at 60fps, and cast windows, cooldowns and move delays are unrelated.
- Clips play at the speed they were drawn at. Stretch only where something must line up - a caster's throw ends as its hit lands.
- Effects are never stretched; a beat's span says when the next beat starts, not how fast the clip runs.
- Looping clips repeat rather than stretch.

Full convention with examples: `.agents/skills/sprite-fps/SKILL.md`.
