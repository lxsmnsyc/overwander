---
id: ui-redesign-overworld-dialogs
title: Redesign the overworld dialogs
status: todo
priority: must
type: feature
outline: true
milestone: now
size: L
added: 2026-11-04
owns:
  - src/components/overworld/*Dialog.tsx
  - src/components/overworld/WorldMapCanvas.tsx
  - src/components/overworld/visit-npc.tsx
  - src/components/overworld/NpcSprite.tsx
shared:
  - src/components/styled/**
provides: []
depends_on:
  - on: ui-design-system
    kind: hard
    why: Built on its tokens and primitives
  - on: ui-redesign-overworld
    kind: hard
    why: Shares the overworld folder and takes the HUD's handoffs
---

# Redesign the overworld dialogs

## Goal

Part of the whole-game UI redesign: the stop, portal, gym seat, Safari, nest, honey tree and world map dialogs and the NPC visit, redesigned on the Field Kit system. None has a board yet, so the node starts with an inventory and a mockup per dialog on the canvas, approved by the maintainer before anything is built.

## Context

- Split out of `ui-redesign-overworld` on 2026-11-04: the HUD had an approved board, these dialogs did not.
- Read `ui-redesign-overworld`'s outcome first for anything the HUD hands over.

Outline: broken into a full brief when `plan.py refine` lists it.
