---
id: e2e-specs
title: Bring the e2e specs up to date with the game
status: todo
priority: should
type: chore
outline: false
milestone: next
size: L
spike: false
verify: pnpm test:e2e
gate: false
added: 2026-10-27
owns:
  - e2e/**
shared: []
provides: []
depends_on:
  - on: deps-update
    kind: hard
    why: The specs only load with the hook deps-update adds (e2e/vite-hooks.ts)
---

# Bring the e2e specs up to date with the game

## Goal

Make `pnpm test:e2e` pass again by updating each spec to the game as it plays now.

## Context

- Source: found while running deps-update, 2026-10-27. See its outcome.
- No spec loaded from about 2026-09-25 until deps-update, and CI does not run e2e, so the specs fell behind the game unseen.
- In the run that was stopped after 46 of 59 tests, 43 failed, most by timing out. A new player starts on a Portal, and its dialog covers the world, so a spec that presses keys or opens a dialog right after `signIn` waits out its timeout.

## Acceptance

- [ ] `pnpm test:e2e` passes, run alone (never beside `pnpm test:db`).
- [ ] A spec whose feature no longer exists is removed, and the outcome names it.

## Sizing

Each failing spec is checked against the screen it drives. `signIn` handling the start (the Portal) may fix many at once.

## Notes for the worker

- Start with `e2e/game.ts`: a fix to `signIn` reaches every spec.
- Stop the dev server on port 4321 when done.
