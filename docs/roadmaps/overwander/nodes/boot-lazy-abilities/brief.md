---
id: boot-lazy-abilities
title: Set abilities up on demand
status: todo
priority: could
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
  - on: boot-measure
    kind: hard
    why: Needs the baseline to report against
---

# Set abilities up on demand

## Goal

An ability's listeners attach when a unit on the field first gains it, with listener ranks reserved up front so a late setup still answers in list order.

## Context

- Source: docs/todo.md: Platform, Deferring data and runtime at boot

Outline: broken into a full brief when `plan.py refine` lists it.
