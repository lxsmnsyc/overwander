---
id: ts-style-sweep
title: Bring the existing code in line with ts-style
status: todo
priority: could
type: chore
outline: false
milestone: later
size: L
spike: false
verify: pnpm typecheck && rtk proxy pnpm exec oxlint src test && pnpm test
gate: false
added: 2026-10-31
owns:
  - src/**
  - scripts/**
shared: []
provides: []
depends_on: []
---

# Bring the existing code in line with ts-style

## Goal

Apply the `ts-style` skill to the code written before it was followed here, with no change in behaviour.

## Context

- Source: the user, 2026-10-31, after the i18n and boot-size code was found not to follow ts-style. New code follows it from that point.
- Counted on `f95c26f53` (generated code in `src/i18n/paraglide` left out):
  - Callback Array methods (`map`, `filter`, `forEach`, `reduce`, `some`, `every`, `find`, `findIndex`, `flatMap`): about 30 in `src`, most in `src/battle`, and about 118 in `scripts`, most in `scripts/art` and `scripts/sprites`.
  - Functions named `<noun>Of`: 249, most in `src/canvas` (73), `src/components` (38), `src/battle` (26), `scripts/art` (26) and `src/data` (24).
  - `const name = (...) =>` at the top level of a module: 53.

## Acceptance

- [ ] No callback Array method outside tests, sort comparators and Solid's list idioms (`<For>`, `<Index>`).
- [ ] No function named `<noun>Of`. Each takes an action name (`getX`, `readX`, `findX`, `createX`).
- [ ] Named functions are `function` declarations, apart from the arrows the skill keeps.
- [ ] In every function a PR touches, the doc block sits only on exported functions, and the steps inside are commented.
- [ ] The full check passes after each PR.

## Sizing

Mechanical but wide. One PR per top-level folder (`src/battle`, `src/canvas`, `src/components`, `src/data`, the rest of `src`, `scripts`), so each one can be reviewed in one sitting.

## Notes for the worker

- Behaviour must not change. A rename touches every caller in the same PR, and nothing else changes with it.
- In Solid code, keep a loop inside the memo or accessor it came from, or it stops being tracked (the skill's Reactivity trap).
- An `Of` name is sometimes part of a module's public surface (`stampOf`, `ballOf`). Rename it all the same, in the same PR as its callers.
- Every file is in scope, so this collides with any node in flight. Run it when nothing else is open, one folder at a time, and rebase before each PR.
- Doc blocks on internal functions are many and not counted. Fix them in the functions a PR already touches rather than sweeping every file for them.
