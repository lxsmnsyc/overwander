---
id: shiny-dex
title: Shiny dex
status: todo
priority: should
type: feature
outline: true
milestone: next
size: M
added: 2026-11-03
owns:
  - src/components/dex/**
  - src/auth/pokedex.ts
  - src/server/pokedex.ts
shared: []
provides: []
depends_on: []
---

# Shiny dex

## Goal

A shiny dex beside the regular one: the dex grid read by shiny coats seen and caught, with its own counts per region, so collecting shinies has a place to show progress.

## Context

- Source: user request, 2026-11-03.
- The dex already records shinies: `pokedex_entries` keeps `seen_shiny` beside `seen` (`src/server/pokedex.ts`), and a caught entry says whether a shiny was caught (`hasCaughtShiny`, `src/auth/pokedex.ts`).
- Open for refinement: whether completing a region's shiny dex earns an award or a title, how it shows in the dex panel (a toggle or its own tab), and whether forms count separately.
- The dex screen is also in `ui-redesign-catches`; whichever runs second builds on the other.

Outline: broken into a full brief when `plan.py refine` lists it.
