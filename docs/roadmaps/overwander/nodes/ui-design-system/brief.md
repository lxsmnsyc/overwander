---
id: ui-design-system
title: Design system for the UI redesign
status: todo
priority: should
type: feature
outline: true
milestone: next
size: L
added: 2026-11-03
owns:
  - src/components/styled/**
  - docs/design/**
shared: []
provides: []
depends_on:
  - on: e2e-specs
    kind: hard
    why: Each screen is captured and compared with its artboard, which needs the e2e helpers that place the player and sign in
---

# Design system for the UI redesign

## Goal

The first step of the whole-game UI redesign: settle the visual direction (type, color, spacing, depth, motion, iconography), write it down as tokens and rules, and rebuild the styled primitives on it, so every screen redesign after it builds on one system.

## Context

- Source: user request, 2026-11-03.
- The UI is Solid with terracotta primitives (`src/components/CLAUDE.md`); the shared look lives in `src/components/styled/`.
- How these redesigns are done (the maintainer's standing rules): I decide the design and show a mockup per screen rather than asking how it should feel; each mockup starts from the screen's current component and keeps what it has (its tabs, teams, terms); every built screen is captured and compared with its artboard before it is called done; and the renderer and art style are settled before any visual brief is written.

Outline: broken into a full brief when `plan.py refine` lists it.
