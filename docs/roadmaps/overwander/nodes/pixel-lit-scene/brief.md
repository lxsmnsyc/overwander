---
id: pixel-lit-scene
title: Lit scene on the grid
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

# Lit scene on the grid

## Goal

The fragment shader snaps each fragment to the grid, cuts alpha to steps with the dither, and cuts colour to the ramp. All 12 shapes change at once.

## Context

- Source: ../../../../strategy/pixel-effects.md (The order, batch 1)

Outline: broken into a full brief when `plan.py refine` lists it.
