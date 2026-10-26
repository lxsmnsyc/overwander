---
id: spawn-roaming
title: Roaming wild pokemon
status: todo
priority: should
type: feature
outline: true
milestone: next
size: L
added: 2026-10-26
owns:
  - src/overworld/spawn-life/roam.ts
  - src/canvas/overworld/chunk-view/spawn-walk.ts
shared:
  - src/game/overworld/board-view.ts
  - src/overworld/chunk-snapshot.ts
provides: []
depends_on:
  - on: spawn-life-design
    kind: contract
    via: spawn-life
  - on: spawn-lifetimes
    kind: hard
    why: A spawn can only move once its identity no longer names its cell, which spawn-lifetimes changes
---

# Roaming wild pokemon

## Goal

Idle wild pokemon walk a deterministic path within a leash of their home cell, on the surfaces their kind allows, drawn walking on the board. Every client places a pokemon in the same cell at the same moment, and the server checks a meeting against that cell.

## Context

- Source: user request, 2026-10-26. wAthena's idle walk is `randomWalk` and `nextWalk` in `server/zone/monster.go`.

Outline: broken into a full brief when `plan.py refine` lists it.
