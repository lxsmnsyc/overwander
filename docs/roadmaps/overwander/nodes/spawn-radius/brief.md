---
id: spawn-radius
title: Spawn radius around the player
status: todo
priority: should
type: feature
outline: true
milestone: next
size: M
added: 2026-10-26
owns:
  - src/game/overworld/spawn-radius.ts
shared:
  - src/game/overworld/board-view.ts
provides: []
depends_on:
  - on: spawn-life-design
    kind: contract
    via: spawn-life
  - on: spawn-lifetimes
    kind: behavior
    via: spawn-life
---

# Spawn radius around the player

## Goal

Only chunks within the contract's radius of the player are live, no pokemon appears closer than the minimum distance, and the player's view respects its cap, so the board fills around the player the way Minecraft fills a ring around each one.

## Context

- Source: user request, 2026-10-26.

Outline: broken into a full brief when `plan.py refine` lists it.
