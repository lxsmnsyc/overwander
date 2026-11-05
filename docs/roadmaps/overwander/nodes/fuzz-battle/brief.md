---
id: fuzz-battle
title: Property tests over random battles
status: done
priority: should
type: chore
outline: false
milestone: next
size: M
spike: false
verify: pnpm fuzz
gate: false
added: 2026-11-04
owns:
  - test/fuzz/battle/**
  - test/fuzz/arbitraries.ts
  - vitest.fuzz.ts
shared:
  - package.json
  - pnpm-lock.yaml
  - test/sim/ai-sim.ts
provides: []
depends_on: []
---

# Property tests over random battles

## Goal

Add `fast-check` and a fuzz suite that plays random AI-against-AI battles and checks invariants on every tick, so a new ability, item or move that breaks a rule fails on a shrunk, replayable seed instead of reaching players.

## Context

- Source: a review of the fix history on 2026-11-04 (https://claude.ai/artifact/GUmpNqVEeEbxh8PKjHnNTk). Fixes each invariant would have caught: `10163984a` (the AI's estimate changed the real fight), `660702be7` (12 moves dealt no damage for 32 days), `5b0d2841d` (items taken in battle lost for good), `2f47b097e` and `ccb26611b` (boss caps), `681dee5c4` (a drawn duel not stamped).
- `test/sim/ai-sim.ts` already rolls parties from a seed (`rollTeams`, `buildTeams`) and plays them headless (`runBattle`). It records casts and asserts nothing.
- The AI marks its guesses with `battle.estimating` (`src/battle/battle.ts`).
- Whole battles take minutes, which is why `pnpm ai:sim` has its own config (`vitest.sim.ts`). The fuzz suite does the same.

## Steps

- [ ] `pnpm add -D fast-check`.
- [ ] `vitest.fuzz.ts` and `"fuzz": "vitest run --config vitest.fuzz.ts"`, including `test/fuzz/**/*.fuzz.ts`. `FUZZ_RUNS` sets `numRuns` (default small enough to finish in a few minutes on this machine); `FUZZ_SEED` replays a failure.
- [ ] An arbitrary for a battle: a seed string, party size 1 to 3, level 1 to 100, abilities and items on or off, fed to `rollTeams`. Give `runBattle` (or a sibling in `ai-sim.ts`) a per-tick hook rather than copying its loop.
- [ ] Invariants, one `it` each:
  - HP stays within 0 and max; no stat, stage or HP is `NaN`.
  - Every battle settles before `TIME_LIMIT`, with a winner or a stamped draw.
  - Purity of thought: snapshot the battle, run the AI's move choice for a unit, snapshot again; the two are equal (HP, stages, statuses, held items, ability state, field).
  - A held item leaves its holder only through a listed removal, and after the battle every item comes back unless it was used up (the rule in `5b0d2841d`).
  - A boss's share-of-HP effects stay within the boss cap (a raid-mode arbitrary).
  - The same seed played twice gives the same cast log.
- [ ] One exhaustive property in `pnpm test` (cheap, no AI): every move that is not a status move and not fixed-damage lowers a neutral target's HP when it lands, across random levels.

## Acceptance

- [ ] `pnpm fuzz` passes at the default run count, and at `FUZZ_RUNS=500` once, run alone.
- [ ] Reverting `10163984a`'s guard in one listener makes the purity property fail with a shrunk seed (checked by hand, recorded in the outcome, not committed).
- [ ] Any real bug a property finds: a fix in this node if it is S, otherwise a new node, with the replay seed in the outcome.
- [ ] Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm fuzz`.

## Sizing

M: one dependency, one config, one arbitrary, six invariants and one registry-wide property. Fixes for what it finds may add nodes.

## Notes for the worker

- Never run `pnpm fuzz` beside `pnpm test` or the database suite: one suite at a time on this device.
- A snapshot for the purity check should be a plain object built from public unit state, not a structured clone of the battle (listeners and closures).
