---
id: boot-lazy-registries
title: Load moves, abilities and items on demand
status: todo
priority: should
type: refactor
outline: true
milestone: next
size: L
spike: false
gate: false
owns: []
shared: []
provides: []
depends_on:
  - on: i18n-registry-loader
    kind: hard
    why: Text leaves the registries before they are split for loading
  - on: boot-measure
    kind: hard
    why: Needs the baseline to report against
---

# Load moves, abilities and items on demand

## Goal

In the browser, behind a Suspense gate around the panels and the battle view. The server keeps registering everything eagerly. Species fields load when first wanted.

## Context

- Source: docs/todo.md: Platform, Deferring data and runtime at boot

Outline: broken into a full brief when `plan.py refine` lists it.
