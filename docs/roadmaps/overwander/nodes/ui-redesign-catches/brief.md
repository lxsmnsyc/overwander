---
id: ui-redesign-catches
title: Redesign catches, the dex and the bag
status: todo
priority: should
type: feature
outline: true
milestone: next
size: L
added: 2026-11-03
owns:
  - src/components/catches/**
shared:
  - src/components/styled/**
provides: []
depends_on:
  - on: ui-design-system
    kind: hard
    why: Built on its tokens and primitives
---

# Redesign catches, the dex and the bag

## Goal

Part of the whole-game UI redesign: The box, the catch sheet, the Pokédex and the bag. redesigned on the design system, one mockup per screen first, then built and compared with the mockups.

## Context

- Source: user request, 2026-11-03.
- The UI is Solid with terracotta primitives (`src/components/CLAUDE.md`); the shared look lives in `src/components/styled/`.
- How these redesigns are done (the maintainer's standing rules): I decide the design and show a mockup per screen rather than asking how it should feel; each mockup starts from the screen's current component and keeps what it has (its tabs, teams, terms); every built screen is captured and compared with its artboard before it is called done; and the renderer and art style are settled before any visual brief is written.

Outline: broken into a full brief when `plan.py refine` lists it.
