---
trigger: model_decision
description: Server functions are addressed by their place in a file, so add at the end and never remove, reorder or change parameters
---

A production build names every `'use server'` function `<file hash>-<index>`, so a tab loaded before a deploy calls positions, not names. A moved function sends that tab's old arguments to whatever sits in its slot now.

- Add a new server function after the last one in the file.
- Never remove one: an unused one keeps its slot, exported so the type-check does not flag it, and answers its old arguments (see the claim lists in `src/auth/snapshots.ts`).
- Never reorder them, and never change a function's parameters; a new argument list is a new function at the end.
- Renaming is fine.
- The build guard (`src/utils/stale-build.ts`, `src/middleware/index.ts`) refuses calls from another build and reloads the tab, but it lets through tabs that name no build, so the rules still apply.

Full convention: `.agents/skills/server-function-order/SKILL.md`.
