---
id: dungeon-runs
title: Dungeon runs
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
  - dungeon-run
depends_on:
  - on: dungeon-questions
    kind: hard
    why: Its shape follows the answers
---

# Dungeon runs

## Goal

The `dungeon_runs` table and migration, server functions that open, advance, fail and clear a run, the party lock, and the window sweep.

## Context

- Source: ../../../../strategy/dungeons.md (The order, batch 1)

Outline: broken into a full brief when `plan.py refine` lists it.
