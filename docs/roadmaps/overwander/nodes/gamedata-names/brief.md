---
id: gamedata-names
title: Localized names table
status: todo
priority: could
type: feature
outline: true
milestone: later
size: M
spike: false
gate: false
owns: []
shared: []
provides: []
depends_on:
  - on: gamedata-schema
    kind: contract
    via: game-data-schema
  - on: i18n-official-names
    kind: hard
    why: Needs the ja and es names to exist
---

# Localized names table

## Goal

A `names (kind, id, locale, name)` table so search works in the player's language.

## Context

- Source: docs/todo.md: Platform, Game data in the database; ../../../../strategy/translations.md (Database)

Outline: broken into a full brief when `plan.py refine` lists it.
