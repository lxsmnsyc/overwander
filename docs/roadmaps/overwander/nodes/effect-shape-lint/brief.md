---
id: effect-shape-lint
title: Lint the Solid 2.0 effect shape
status: todo
priority: later
type: chore
outline: true
milestone: later
size: S
spike: false
gate: false
owns: []
shared: []
provides: []
depends_on:
  - on: solid-2
    kind: hard
    why: The rules check 2.0 code
---

# Lint the Solid 2.0 effect shape

## Goal

Catch two Solid 2.0 mistakes before they run: an expression-body arrow as `createEffect`'s second argument (a returned non-function stops reactivity app-wide) and `onCleanup` inside `onSettled` (it throws). oxlint has no built-in rule for either, so this is a custom oxlint plugin or a grep test under `test/`. A grep test can also pair a default-less `createContext` with a null check after `useContext`.

## Context

- Source: `solid-2-conventions` outcome, follow-ups.

Outline: broken into a full brief when `plan.py refine` lists it.
