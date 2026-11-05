---
id: meetings-cell-biome
title: Record a meeting under the country of its cell
status: todo
priority: should
type: fix
outline: false
milestone: next
size: M
spike: false
verify: pnpm fuzz
gate: false
added: 2026-11-05
owns:
  - src/overworld/encounter/**
  - src/server/overworld/**
  - src/server/raids/reward.ts
  - src/server/stops.ts
  - src/server/eggs.ts
  - src/server/npcs/fossils.ts
  - src/overworld/trader.ts
  - src/overworld/nest-egg.ts
  - test/fuzz/world/meetings.fuzz.ts
shared: []
provides: []
depends_on:
  - on: fuzz-world
    kind: hard
    why: Adds `stageEncounter` and the property that finds this, expected to fail until it is fixed
---

# Record a meeting under the country of its cell

## Goal

Every meeting a player has at a cell records the country of that cell, the way `55f99f410` made the spawn pools, stashes, nests and stops read it. Today the encounter row, and the catch's `origin_biome` after it, say the chunk's middle.

## Context

- Found by fuzz-world: `are met in the country of the cell they stand on` in `test/fuzz/world/meetings.fuzz.ts`, shrunk to the live world, chunk (7, -572), window 1577836800000, zone 0: the chunk's middle is biome 14 and a spawn's cell is 21.
- `deriveEncounter` falls back to `snapshot.chunk.biome` when the caller names no biome (`src/overworld/encounter/index.ts`). The callers that stand at a cell and name none: wild spawns (`meetSpawn`, which knows the spawn's index and can read its cell off `getSpawnCells`, a prefix-stable roll), honey trees, phenomena, Rocket stop rewards, raid prizes (the lair's cell), eggs (`src/server/eggs.ts` also writes `snapshot.chunk.biome` straight into `caught`), fossils, the trader and nest eggs.
- Stored rows keep what they say. This changes new meetings only, so no migration.

## Steps

- [ ] Give every caller at a cell the cell's country (`snapshot.biomeAt(cell)`), or give `deriveEncounter` the cell and let it read the country itself. Pick the one that leaves no caller able to forget.
- [ ] Turn the `(not yet)` check in `meetings.fuzz.ts` into `fc.assert` over the same property, and add a sibling property for each other meeting that has a cell.

## Acceptance

- [ ] `pnpm fuzz` passes with the property under `fc.assert`.
- [ ] Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test`.
