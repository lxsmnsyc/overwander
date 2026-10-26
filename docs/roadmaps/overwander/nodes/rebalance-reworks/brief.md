---
id: rebalance-reworks
title: Rework the outliers
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
  - on: rebalance-bounds
    kind: hard
    why: Needs the bands
  - on: rebalance-move-audit
    kind: hard
    why: Needs the audit list
---

# Rework the outliers

## Goal

The signatures outside the band and the ones the move audit found, worst first, 4 at a time; each batch reworked, re-measured and checked against the band. Split into one node per batch when refined.

## Context

- Source: ../../../../strategy/rebalance.md (The order, batch 5 onward)

Outline: broken into a full brief when `plan.py refine` lists it.
