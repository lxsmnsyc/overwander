---
id: spawn-life-design
title: Design spawn radius, caps and roaming
status: done
priority: should
type: spike
outline: false
milestone: next
size: M
spike: true
gate: true
added: 2026-10-26
owns:
  - docs/mechanics/spawning.md
shared: []
provides:
  - spawn-life
depends_on: []
---

# Design spawn radius, caps and roaming

## Goal

Decide how wild pokemon come and go on the board, the way mobs do in Minecraft or monsters do in wAthena, instead of 8 pokemon standing still on fixed cells and all turning over together every 5 minutes. Write the answer as the `spawn-life` contract and a mechanics page. No game code changes.

## Context

- Today: each chunk rolls `SPAWN_COUNT` (8) spawns per 5-minute window onto free cells (`src/overworld/chunk-snapshot.ts`, around line 546), plus a lure bonus. They never move, and the whole set is replaced when the window turns.
- A met pokemon is keyed by cell and window (`spawnKey`, `src/overworld/safari/index.ts:492`). The server stages a meeting from the snapshot (`src/server/overworld/spawns.ts`, `claims.ts`). Fled pokemon are remembered by that key until the window ends.
- Minecraft: mobs spawn in a ring around each player (not closer than 24 blocks, despawn past 128), under a cap per mob category, and wander when idle.
- wAthena (`~/Documents/GitHub/wathena`): each map has spawn lines with a count and a respawn delay plus variance, a monster returns that long after it dies, and an idle monster takes random walks (`server/zone/monster.go`: `respawnDelay`, `randomWalk`, `nextWalk`). Decision 0042 keeps aggressive monsters away from arrivals.
- The overworld is never stored: it is derived from the seed, the coordinates and the clock, so every client computes the same board. Movement has to be derived the same way, not simulated.

## Steps

- [ ] Spawn radius: which chunks around a player are live, and the closest a pokemon may appear to the player, chunk-anchored so every client agrees.
- [ ] Caps: per chunk, per player view, and whether rare and lured pokemon count against them.
- [ ] Lifetimes: each spawn appears and leaves on its own staggered clock, and a caught or fled pokemon's slot returns after a delay, as in wAthena, rather than the whole window turning over.
- [ ] Roaming: a deterministic path from seed and time, a leash radius from its home cell, which surfaces it may cross (by its kind: ground, water, flying), how fast, and what it does near towns, stops and other landmarks.
- [ ] Identity: a key that survives movement, how fled and met pokemon are remembered, and how the server checks a meeting at a moving cell.
- [ ] What it costs: board draw per frame, chunk derive time, and whether the world fingerprint test moves.

## Decided with the maintainer (2026-11-03)

The maintainer approved this model; the contract writes it down with exact constants and interfaces, and the mechanics page explains it.

- **Slots, not one batch.** Each chunk has K slots, each on its own cycle with a phase from the seed: a pokemon is present for a while, then the slot rests for a respawn gap with variance, then rolls again. What appears and where comes from (chunk, slot, cycle). Starting numbers: K = 6 per chunk (about 54 in view against 72 today), present about 4 minutes, gap 1 to 2 minutes.
- **The cap stays per chunk.** A per-player or global cap would make existence depend on where other players stand, which the derived world cannot carry. Lures add slots; legendaries and rare spawns keep their own channel outside K.
- **Caught and fled.** Gone for that player until its cycle ends; the slot returns on its own clock.
- **Identity.** The key is (chunk, slot, cycle) plus the roll, not the cell. The server works out where the pokemon is at the moment of a meeting and allows a cell of drift for latency.
- **Roaming is a separate later build** (`spawn-roaming`), designed here but shipped after the slots: a waypoint every 5 seconds from the seed, a leash of 4 cells around the start cell, 1 cell a step, only on surfaces the species' kind may stand on, never on landmarks; towns get their own rule.
- **No closest-distance rule tied to players.** A pokemon fades in when its slot starts; a small ring around the player only changes what is drawn.
- Measure the cost (board draw per frame, chunk derive time) and say whether the world fingerprint test pins spawns.

## Acceptance

- [ ] `contracts/spawn-life.md` holds the interface and constants, reviewed by the user (gate).
- [ ] `docs/mechanics/spawning.md` explains the rules in player terms.

## Sizing

Uncertainty high (new to this repo, shared-world constraint), so it is a spike ahead of the build nodes.

## Notes for the worker

- Read the `spawn-surfaces` and `world-generation` skills first.
- Propose the numbers to the user with the Minecraft and wAthena values beside them; the user decides.
