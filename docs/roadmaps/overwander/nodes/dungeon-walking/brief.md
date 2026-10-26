---
id: dungeon-walking
title: Walking a floor
status: todo
priority: could
type: feature
outline: true
milestone: later
size: L
spike: false
gate: false
owns: []
shared: []
provides: []
depends_on:
  - on: dungeon-runs
    kind: contract
    via: dungeon-run
  - on: dungeon-floors
    kind: contract
    via: dungeon-floor
---

# Walking a floor

## Goal

The floor layer on the board: entering, stairs, line-of-sight trainers, hordes, and leaving.

## Context

- Source: ../../../../strategy/dungeons.md (The order, batch 3)

Outline: broken into a full brief when `plan.py refine` lists it.
