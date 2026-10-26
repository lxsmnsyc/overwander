---
id: boot-derive-shiny
title: Read shininess without deriving the encounter
status: todo
priority: should
type: refactor
outline: false
milestone: next
size: S
spike: false
gate: false
owns:
  - src/overworld/encounter.ts
  - src/game/overworld/board-view.ts
  - test/overworld/encounter*.test.ts
shared: []
provides: []
depends_on: []
---

# Read shininess without deriving the encounter

## Goal

The board calls `deriveEncounter` for every visible spawn only to read `.shiny`, which rolls moves, abilities, held items and level. Split out a `deriveShiny`, so the overworld no longer needs learn sets, ability pools or held-item tables.

## Context

- Source: docs/todo.md: Platform, Deferring data and runtime at boot (Stop the board deriving whole encounters)

## Acceptance

- [ ] `deriveShiny` answers the same as `deriveEncounter(...).shiny` across many seeds, in a test.
- [ ] `src/game/overworld/board-view.ts` no longer imports `deriveEncounter`.
- [ ] Fast check passes: `pnpm typecheck && pnpm exec vitest run test/overworld`

## Sizing

Two files and a test; the shiny roll must keep its draw order.

## Notes for the worker

- The call is at `src/game/overworld/board-view.ts:444`.
- The shiny roll must read the same draws, or every player sees different shinies.
