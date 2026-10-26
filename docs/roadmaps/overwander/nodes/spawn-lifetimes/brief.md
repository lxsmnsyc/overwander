---
id: spawn-lifetimes
title: Staggered spawn lifetimes and caps
status: todo
priority: should
type: feature
outline: true
milestone: next
size: L
added: 2026-10-26
owns:
  - src/overworld/spawn-life/index.ts
  - src/overworld/spawn-life/lifetimes.ts
shared:
  - src/overworld/chunk-snapshot.ts
  - src/overworld/safari/index.ts
  - src/server/overworld/spawns.ts
  - src/server/overworld/claims.ts
provides: []
depends_on:
  - on: spawn-life-design
    kind: contract
    via: spawn-life
---

# Staggered spawn lifetimes and caps

## Goal

Each wild pokemon appears and leaves on its own clock under the chunk's cap, and a caught or fled pokemon's place fills again after a respawn delay, replacing the whole set turning over every 5 minutes. Spawn identity moves to the contract's key, and the server stages and checks meetings with it.

## Context

- Source: user request, 2026-10-26 ("spawn radius, caps and roaming like in Minecraft or, more relatively, in wAthena").

Outline: broken into a full brief when `plan.py refine` lists it.
