---
id: pixel-battle-cues
title: Battle cues on the grid
status: todo
priority: could
type: feature
outline: true
milestone: later
size: M
spike: false
gate: false
owns: []
shared: []
provides: []
depends_on:
  - on: pixel-grid
    kind: contract
    via: pixel-grid
  - on: pixel-canvas-moves
    kind: hard
    why: Uses the same offscreen buffer
---

# Battle cues on the grid

## Goal

The cue shapes go through the same buffer; atlas marks draw on the grid.

## Context

- Source: ../../../../strategy/pixel-effects.md (The order, batch 3)

Outline: broken into a full brief when `plan.py refine` lists it.
