---
id: fuzz-server-model
title: Model-based tests for the server's player state
status: todo
priority: could
type: chore
outline: true
milestone: later
size: L
spike: false
gate: false
added: 2026-11-04
owns: []
shared: []
provides: []
depends_on:
  - on: fuzz-battle
    kind: hard
    why: Adds fast-check and the fuzz config
---

# Model-based tests for the server's player state

## Goal

A small in-memory model of one player's party locks, bag, claims, steps and owed meetings, driven by `fc.commands` against the real server functions on the dev database. After every command the stored rows match the model, and a failure shrinks to the shortest sequence of actions.

## Context

- Source: a review of the fix history on 2026-11-04 (https://claude.ai/artifact/GUmpNqVEeEbxh8PKjHnNTk).
- Fixes it would have caught: `52512ece9` (a party stayed locked after its fight), `70912c6d7` (a claim marked when its payment failed), `eca6f3910` (steps counted on a walk that never committed), `5b0d2841d` (items lost after a raid), `946abdd6d` (owed meetings lost, cleaned up by migration 0004).
- Runs under `pnpm test:db` rules: the dev database only, never beside the e2e suite.

Outline: broken into a full brief when `plan.py refine` lists it.
