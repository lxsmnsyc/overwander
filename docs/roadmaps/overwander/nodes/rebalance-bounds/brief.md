---
id: rebalance-bounds
title: Set the signature bands
status: todo
priority: could
type: spike
outline: true
milestone: later
size: S
spike: true
gate: true
owns: []
shared: []
provides: []
depends_on:
  - on: rebalance-first-run
    kind: hard
    why: Bands are read off the measured table
---

# Set the signature bands

## Goal

The user sets the band a signature should land in for each tier, from the table.

## Context

- Source: ../../../../strategy/rebalance.md (The order, batch 4)

Outline: broken into a full brief when `plan.py refine` lists it.
