---
id: items-pp-restoratives
title: Ether, Max Ether, Elixir and Max Elixir
status: todo
priority: should
type: feature
outline: false
milestone: next
size: S
spike: false
gate: false
owns:
  - src/data/items/records/medicine.yaml
  - src/data/text/en/items/medicine.yaml
  - test/items/pp-restoratives.test.ts
shared: []
provides: []
depends_on: []
---

# Ether, Max Ether, Elixir and Max Elixir

## Goal

The four PP restoratives, mapped onto clearing cooldowns the way the Leppa Berry already does.

## Context

- Source: docs/todo.md: Remaining items

## Acceptance

- [ ] Each item is registered, sold or buried, and clears cooldowns as its description says, in a test.
- [ ] Fast check passes: `pnpm exec vitest run test/items test/data/items.test.ts`

## Sizing

Same pattern as the Leppa Berry.

## Notes for the worker

- The ids already exist in `src/data/ids/items.ts`; check where the medicine records live before adding a file.
