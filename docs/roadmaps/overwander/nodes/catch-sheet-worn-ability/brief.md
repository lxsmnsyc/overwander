---
id: catch-sheet-worn-ability
title: Show a form's worn ability on the catch sheet
status: todo
priority: should
type: feature
outline: true
milestone: now
size: S
added: 2026-11-05
owns:
  - src/components/catches/catch-dialog/**
shared: []
provides: []
depends_on:
  - on: ui-redesign-catches
    kind: hard
    why: Changes the redesigned sheet's Abilities card
---

# Show a form's worn ability on the catch sheet

## Goal

A form that wears an ability in battle (Ogerpon's masks, the Origin Formes, Sky Shaymin) shows only its stored pool on the catch sheet, so Wellspring Mask Ogerpon lists Grass Pelt and Inner Focus and never Water Absorb. Show the ability the form wears beside the pool, marked as worn in battle, on every screen that lists a catch's abilities.

## Context

- Found at the catch sheet's gate on 2026-11-05 (PR #286). Main had the same gap before the redesign.
- An all-form species has no base ability: every form's ability is worn, and its pool is all fillers.

Outline: broken into a full brief when `plan.py refine` lists it.
