---
id: fuzz-world
title: Property and oracle tests for the world and the data
status: todo
priority: should
type: chore
outline: false
milestone: next
size: M
spike: false
verify: pnpm exec vitest run test/fuzz
gate: false
added: 2026-11-04
owns:
  - test/fuzz/world/**
  - test/fuzz/data/**
shared: []
provides: []
depends_on:
  - on: fuzz-battle
    kind: hard
    why: Adds fast-check and the fuzz config this node's properties run under
---

# Property and oracle tests for the world and the data

## Goal

Every reader of the world answers the same as the world for any seed, cell and clock, and every value generated for a player passes the database's own checks. Data registries hold their structural rules for every entry.

## Context

- Source: a review of the fix history on 2026-11-04 (https://claude.ai/artifact/GUmpNqVEeEbxh8PKjHnNTk).
- Fixes these would have caught: `7dc348490`, `f004bdbc7`, `3d2298355` (the weather map disagreed with the sky, three times in two days); `55f99f410` (encounters read the chunk's middle, not the player's cell); `2cf05e9bf` (a legendary rolled level 103, which the caught table refuses); `33fd8466f`, `a95ae120b` (diagonal walk timing); `1ca566ee3` (Rotom's evolution line repeated); `ff2572159` (a duplicate family id, repaired with a script against production); the four Zenith shard id fixes on 2026-10-01; `2760fb294` (YAML loaders dropped misspelt keys).
- `test/overworld/world/placement-invariants.test.ts` already loops fixed cells; this node adds random seeds, cells and clocks, and shrinking.
- The live world's generation is frozen and fingerprinted. These tests read it, never change it.

## Steps

- [ ] Arbitraries: world seed, cell (both depths), clock, buddy.
- [ ] Oracles: the weather map (`src/components/demo/WeatherMap.tsx`, its pure part) equals `World`'s weather for the same cell and clock; the encounter read for a cell equals the snapshot's spawns on that cell.
- [ ] Database bounds: every spawn, gift and raid prize rolled at a random cell and clock meets the `CHECK` constraints of the table it is written to (level, IVs, slots). Read the bounds from the migrations once and name them in the test.
- [ ] Walking: path time equals Euclidean length times the step time, and rotating a path by 90 degrees leaves its time unchanged.
- [ ] Data: family ids dense and unique with one root each; item, species, form and signature id bands disjoint; Zenith shard ids round-trip; every species' evolution line has no repeats and reaches a last stage; each YAML loader parses what it would write, and refuses a record with a misspelt key.

## Acceptance

- [ ] `pnpm exec vitest run test/fuzz/world test/fuzz/data` passes, and each property is checked to fail by breaking its subject by hand once (recorded in the outcome).
- [ ] Data properties run in `pnpm test`; world properties with more than a few hundred cells run under `pnpm fuzz`.
- [ ] Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0).

## Sizing

M: arbitraries, two oracles, one bounds property, two walking properties, five data properties.

## Notes for the worker

- If the weather map's logic lives inside the component, move the pure part to a plain module first (component code may not be imported by tests that run without Solid). Keep that move behaviour-preserving.
