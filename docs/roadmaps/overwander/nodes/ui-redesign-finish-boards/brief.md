---
id: ui-redesign-finish-boards
title: Boards for the overworld dialogs, the shell and the social screens
status: done
priority: must
type: docs
story: ui-redesign-finish
outline: false
milestone: now
size: M
gate: true
spent: 391404
added: 2026-11-16
owns:
  - docs/design/field-kit/*.dc.html
  - docs/design/field-kit/canvas.json
  - docs/roadmaps/overwander/nodes/ui-redesign-overworld-dialogs/**
  - docs/roadmaps/overwander/nodes/ui-redesign-shell/**
  - docs/roadmaps/overwander/nodes/ui-redesign-social/**
shared: []
provides: []
depends_on: []
---

# Boards for the overworld dialogs, the shell and the social screens

## Goal

Draw every remaining screen on the Field Kit canvas in one pass, so the maintainer approves all of them at one gate instead of three.

## Steps

- Read each screen's component first and write its inventory as a checklist in the building node's `log.md`: every element keeps a place, moves are written "from -> to, why", new things are proposals.
- One board per screen on the canvas (https://claude.ai/artifact/1sg3qZ2ZoP1ar6V2K46cnD), with its inventory note in `canvas.json`, built from the system board and the finished screens' pieces (rail, segmented control, detail panel, hero, move card, option cards). Decide the design; do not ask how it should feel.
  - Overworld dialogs: stop, portal, gym seat, Safari, nest, honey tree, world map, the NPC visit and the NPC forms (`src/components/forms`).
  - Shell: login, announcements, command bar, settings, profile (tab and dialog), quests, news.
  - Social: trades, auctions, raids (tab, lobby, dialog), duels, friends, gifts, notifications.
- Renderer: none changes. DOM only; the world map canvas and sprites keep how they are drawn.
- Refine the three building briefs from the boards (moves, phone layout, steps, acceptance), in the shape of `ui-redesign-box-dex-bag`'s brief.

## Acceptance

- Every screen above has a board and an inventory; the maintainer approves them at the gate.
- The three building briefs are full briefs (`outline: false`) and `plan.py check` passes.
