---
id: items-room-service
title: Room Service
status: todo
priority: could
type: feature
outline: false
milestone: next
size: S
spike: false
gate: false
owns:
  - src/battle/items/room-service.ts
  - test/battle/items/room-service.test.ts
shared: []
provides: []
depends_on: []
---

# Room Service

## Goal

Room Service: drops its holder's Speed when Trick Room starts. The engine has Trick Room now, which is what blocked it.

## Context

- Source: docs/todo.md: Remaining items

## Acceptance

- [ ] A battle test: Trick Room starts and the holder drops one Speed stage and spends the item.

## Sizing

One held item on an existing event.
