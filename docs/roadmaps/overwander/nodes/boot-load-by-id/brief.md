---
id: boot-load-by-id
title: Load registry entries by id
status: todo
priority: later
type: refactor
outline: true
milestone: later
size: L
spike: false
gate: false
owns: []
shared: []
provides: []
depends_on:
  - on: boot-lazy-registries
    kind: hard
    why: Builds on the on-demand loaders
---

# Load registry entries by id

## Goal

A loader map per registry from id to its family file, an `await load(ids)` at each entry point (chunk derive, panel open, battle start, NPC team build), and getters that stay synchronous. Metronome and other moves that call moves preload their pool.

## Context

- Source: docs/todo.md: Platform, Deferring data and runtime at boot

Outline: broken into a full brief when `plan.py refine` lists it.
