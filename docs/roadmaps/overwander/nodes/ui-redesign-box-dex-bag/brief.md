---
id: ui-redesign-box-dex-bag
title: Redesign the box, the Pokedex and the bag
status: todo
priority: must
type: feature
outline: true
milestone: now
size: L
added: 2026-11-05
owns:
  - src/components/catches/**
  - src/components/dex/**
  - src/components/items/**
shared:
  - src/components/styled/**
provides: []
depends_on:
  - on: ui-design-system
    kind: hard
    why: Built on its tokens and primitives
  - on: ui-redesign-catches
    kind: hard
    why: Shares the catches folder and reuses the sheet's move card and stat hexagon
---

# Redesign the box, the Pokedex and the bag

## Goal

Part of the whole-game UI redesign: the box and catch picker, the Pokedex and dex entries, and the bag and item pickers, on the Field Kit system. None has a board yet, so the node starts with an inventory and a mockup per screen on the canvas, approved by the maintainer before anything is built.

## Context

- Split out of `ui-redesign-catches` on 2026-11-05: the catch sheet had an approved board, these screens did not.

Outline: broken into a full brief when `plan.py refine` lists it.
