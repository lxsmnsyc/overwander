---
id: items-charms
title: Exp, Oval and Mark Charms
status: todo
priority: should
type: feature
outline: false
milestone: next
size: S
spike: false
gate: false
owns:
  - src/data/items/records/key-items.yaml
  - src/data/text/en/items/key-items.yaml
  - test/items/charms.test.ts
shared: []
provides: []
depends_on: []
---

# Exp, Oval and Mark Charms

## Goal

The three charms left, on the pattern the Shiny and Catching Charms use.

## Context

- Source: docs/todo.md: Remaining items

## Acceptance

- [ ] Each charm is registered and its effect is covered by a test.
- [ ] Fast check passes: `pnpm exec vitest run test/items test/data/items.test.ts`

## Sizing

Same pattern as the Shiny Charm.

## Notes for the worker

- The Mark Charm needs marks; check what the game tracks before inventing one.
