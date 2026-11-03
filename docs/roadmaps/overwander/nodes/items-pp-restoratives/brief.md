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

The four PP restoratives as held items for a game with no spendable PP, mapped onto cooldowns the way the Leppa Berry already is.

## Context

- Source: docs/todo.md: Remaining items. Decided with the maintainer on 2026-11-03.
- This engine has no spendable PP: a move's cost is its cooldown, and the points a caught pokemon carries (`movePoints`) are what PP Ups bought, never spent. Bag items cannot be used in a battle, so these work only when held.
- The Leppa Berry (`src/battle/items/berries.ts`, `setupLeppaBerry`) clears the first cooldown that starts, on `BattleEvents.UnitStartCooldown`. Moving a cooldown standing in for spent PP, and every move cooling down at once standing in for running out, gives the mapping below.
- The ids exist in `src/data/ids/items.ts` (Ether 320 to Max Elixir 323) under a TODO; check where the held battle items and their YAML records live before adding a file (the `data-yaml` and `registry-descriptions` skills).

| Item | Mainline | Here (held, used up, once a battle) |
| --- | --- | --- |
| Ether | 10 PP to one move | The first time a move starts its cooldown, that cooldown is halved |
| Max Ether | full PP to one move | The first time a move starts its cooldown, it is cleared (the Leppa's effect, but not a berry: Unnerve, Bug Bite, Harvest and the like do not touch it) |
| Elixir | 10 PP to every move | The moment every move of the holder is cooling down at once, each of those cooldowns is halved |
| Max Elixir | full PP to every move | The moment every move of the holder is cooling down at once, every cooldown is cleared |

## Acceptance

- [ ] Each item is registered with a description that states its effect here, is sold or buried, and works as the table says, each in a battle test (including that a berry-only effect such as Unnerve does not stop Max Ether, and that an Elixir waits until every move is cooling down).
- [ ] The TODO in `src/data/ids/items.ts` is gone.
- [ ] Fast check passes: `pnpm exec vitest run test/items test/data/items.test.ts`, plus the battle tests the node adds.

## Sizing

S: the Leppa's hook four times, with one new condition (every move cooling down).
