---
id: spawn-life-design
title: Design spawn radius, caps and roaming
status: todo
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

## Acceptance

- [ ] `contracts/spawn-life.md` holds the interface and constants, reviewed by the user (gate).
- [ ] `docs/mechanics/spawning.md` explains the rules in player terms.

## Sizing

Uncertainty high (new to this repo, shared-world constraint), so it is a spike ahead of the build nodes.

## Notes for the worker

- Read the `spawn-surfaces` and `world-generation` skills first.
- Propose the numbers to the user with the Minecraft and wAthena values beside them; the user decides.
