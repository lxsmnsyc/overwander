---
id: gamedata-schema
title: Game data in Postgres
status: todo
priority: could
type: feature
outline: true
milestone: later
size: L
spike: false
gate: false
owns: []
shared: []
provides:
  - game-data-schema
depends_on: []
---

# Game data in Postgres

## Goal

A `game_data` schema (species with base stats as columns, types, egg groups and biomes as `smallint[]` with a GIN index, `species_abilities`, `species_evolutions`, `learn_set`, `moves`, `abilities`, `items`, a `version` row), reloaded in one transaction at server start when the hash of the registries changes. No foreign keys from player tables into it. The TypeScript stays the source.

## Context

- Source: docs/todo.md: Platform, Game data in the database (Schema, Sync, No foreign keys)

Outline: broken into a full brief when `plan.py refine` lists it.
