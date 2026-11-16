---
id: ui-redesign-shell
title: Redesign settings, profile, quests and the shell
status: todo
priority: must
type: feature
story: ui-redesign-finish
outline: true
milestone: now
size: L
added: 2026-11-03
owns:
  - src/components/app/LoginForm.tsx
  - src/components/app/Announcements.tsx
  - src/components/app/command-bar/**
  - src/components/settings/**
  - src/components/profile/**
  - src/components/quests/**
  - src/components/news/**
shared:
  - src/components/styled/**
provides: []
depends_on:
  - on: ui-redesign-finish-boards
    kind: hard
    why: Built to the boards approved at its gate
  - on: ui-redesign-overworld-dialogs
    kind: hard
    why: One node at a time on this device; shares src/components/styled and builds on the last one's pieces
  - on: ui-design-system
    kind: hard
    why: Built on its tokens and primitives
---

# Redesign settings, profile, quests and the shell

## Goal

Part of the whole-game UI redesign: The app shell and menus, settings, the profile, quests and news. redesigned on the design system, one mockup per screen first, then built and compared with the mockups.

## Context

- Source: user request, 2026-11-03.
- The UI is Solid with terracotta primitives (`src/components/CLAUDE.md`); the shared look lives in `src/components/styled/`.
- How these redesigns are done (the maintainer's standing rules): I decide the design and show a mockup per screen rather than asking how it should feel; each mockup starts from the screen's current component and keeps what it has (its tabs, teams, terms); every built screen is captured and compared with its artboard before it is called done; and the renderer and art style are settled before any visual brief is written.

`src/components/app/GameMenu.tsx` and `FullscreenToggle.tsx` belong to `ui-redesign-overworld` (the HUD), not this node.

Outline: broken into a full brief when `plan.py refine` lists it.
