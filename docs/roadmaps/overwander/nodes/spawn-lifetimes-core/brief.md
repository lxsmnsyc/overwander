---
id: spawn-lifetimes-core
title: Spawn slot clocks and the server check, pure
status: active
priority: should
type: feature
outline: false
milestone: next
size: M
spike: false
verify: pnpm exec vitest run test/overworld/spawn-life.test.ts test/overworld/generation-fingerprint.test.ts test/overworld/world/chunk-snapshot.test.ts
gate: false
added: 2026-11-18
owns:
  - src/overworld/spawn-life/index.ts
  - src/overworld/spawn-life/lifetimes.ts
  - test/overworld/spawn-life.test.ts
shared:
  - src/overworld/chunk-snapshot.ts
  - src/data/biome/__create.ts
  - src/data/biome/index.ts
reserves: []
provides: []
depends_on:
  - on: spawn-life-design
    kind: contract
    via: spawn-life
---

# Spawn slot clocks and the server check, pure

## Goal

Build the pure half of the `spawn-life` contract: the constants, the slot clocks, the roll of a cycle, `liveSpawns` and `checkMeeting`, with tests. Nothing calls them yet. The board, the server, the teaser and the docs move over in `spawn-lifetimes`.

## Context

- Read `contracts/spawn-life.md` (frozen) first: "Constants", "Slot clocks", "The roll of a cycle", "Identity, memory and the server check", "Functions", "Tests the build adds". This brief only adds what the contract leaves to the build. Also `docs/mechanics/spawning.md` and the skills `world-generation` (no `world.draws` call here, `AleaRNG` strings only), `spawn-surfaces`.
- Split from the outline `spawn-lifetimes` (size L, too much for one session): this node is everything that can be tested without the board or the server.
- The rolls to factor out live in `ChunkSnapshot.getSpawns` (`src/overworld/chunk-snapshot.ts:556`). Its occupied set, street and country split, `pickSpawn` on `getCellPool(cell)` (`:480`) or the town pool (`getStreetPool`, `:510`, private today), then `getShoreForm`, `getWingPattern`, `getSeasonalCoat`, `getRareShape` and the two `int32` draws are what a cycle's roll reuses. Pull the "species and values" step into one function that both `getSpawns` and `rollSlot` call, so the old path stays unchanged until `spawn-lifetimes` removes it.
- `commonSpawn` (contract step "Ordinary slots") goes in `src/data/biome/__create.ts` next to `pickSpawn` (`:1013`), exported through `src/data/biome/index.ts`.
- `positionAt` belongs to `spawn-roaming`. Until it lands, `checkMeeting` compares the cell with `live.home` through a local helper in `lifetimes.ts`; `spawn-roaming` swaps the helper for `positionAt`.

## Steps

- [ ] `index.ts`: constants (table in the contract), types `SlotKind`, `SlotCycle`, `LiveSpawn`. No imports of Solid, server or canvas modules.
- [ ] `commonSpawn` and the rare-channel pick (`RARE_SLOT`, `RARE_ODDS_SCALE`) in the biome registry.
- [ ] `lifetimes.ts`: `slotPhase`, `cycleOf`, `cycleAt`, `getSpawnGround` (memo per chunk key and hour), `rollSlot` (memo per id), `liveSpawns`, `parseSpawnId`, `checkMeeting`.
- [ ] The tests listed under "Tests the build adds" in the contract, except the roaming ones: cycles, hour cut, mean live fraction, territories disjoint, same rolls in two processes with a pinned list for one chunk and day, `checkMeeting` accepting and refusing.

## Acceptance

- [ ] `test/overworld/spawn-life.test.ts` covers every item above and passes.
- [ ] `test/overworld/generation-fingerprint.test.ts` passes unchanged (no `world.draws` call added or reordered).
- [ ] `ChunkSnapshot.getSpawns` returns exactly what it did before (`chunk-snapshot.test.ts` unchanged and green).
- [ ] Fast check passes: `pnpm typecheck && pnpm exec oxlint src test` (read the exit code), then the verify command above.

## Sizing

M: uncertainty low (the contract specifies the algorithm), blast radius medium (one refactor in `chunk-snapshot.ts` and one new function in the biome registry), context medium (the contract is about 9k tokens), verifiability low (pure and testable).

## Notes for the worker

- The draw order inside a cycle is frozen after release: present length, start cell, species draws, individual value, trait value. The pinned test is how a later change becomes a decision.
- The contract says a cycle's `ChunkSnapshot` is built at `start`, with the timestamp floored to 5 minutes. That snapshot builds the pools; do not call `getSpawns` on it.
- Caves: `getSpawnPool` takes the depth, and the snapshot carries it. The same code serves both layers.
- Do not edit the contract. If something in it cannot be built, write `contracts/spawn-life.change-request.md` and adapt locally.
