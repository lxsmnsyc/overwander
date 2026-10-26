---
id: boot-learnsets-loader
title: Learn sets on their own loader
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
  - on: boot-derive-shiny
    kind: hard
    why: The board stops needing learn sets only once it reads shininess on its own
---

# Learn sets on their own loader

## Goal

Learn sets are read by encounter and NPC team building, breeding, the dex, the reminder and tutor counters, TMs and catch search, but never by the battle engine, so they load on their own rather than with the fight data.

## Context

- Source: docs/todo.md: Platform, Deferring data and runtime at boot

Outline: broken into a full brief when `plan.py refine` lists it.
