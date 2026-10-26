---
id: dungeon-floors
title: Floor generator
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
provides:
  - dungeon-floor
depends_on:
  - on: dungeon-questions
    kind: hard
    why: Its shape follows the answers
---

# Floor generator

## Goal

Rooms, doors, stairs and gimmicks from a seed, in `src/overworld/`, pure and tested.

## Context

- Source: ../../../../strategy/dungeons.md (The order, batch 2)

Outline: broken into a full brief when `plan.py refine` lists it.
