---
id: pixel-canvas-moves
title: Canvas 2D moves on the grid
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
---

# Canvas 2D moves on the grid

## Goal

Landings and waits draw into an offscreen canvas at grid size, then scale up with smoothing off. Lines thinner than one texel widen to one.

## Context

- Source: ../../../../strategy/pixel-effects.md (The order, batch 2)

Outline: broken into a full brief when `plan.py refine` lists it.
