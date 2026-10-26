---
id: zenith-johto-galar
title: Zeniths for Johto through Galar
status: active
priority: must
type: feature
outline: false
milestone: now
size: L
spike: false
gate: false
owns:
  - src/data/species/zeniths/**
  - src/data/text/en/zeniths.yaml
  - src/data/items/records/zenith-shards.yaml
  - public/sprites/ui/items/zenith/**
shared: []
provides: []
depends_on: []
---

# Zeniths for Johto through Galar

## Goal

Merge the Zenith stack: batches 0 to 7 (scaffolding, then Johto, Hoenn, Sinnoh, Unova, Kalos, Alola and Galar), already built and open as PRs #229 to #238 in stack #231.

## Context

- Source: ../../../../strategy/zeniths.md (The order, batches 0 to 7)

## Acceptance

- [ ] Every PR in stack #231 is merged into main.
- [ ] Fast check passes: `pnpm exec vitest run test/data/zeniths.test.ts test/battle/gimmicks/zeniths.test.ts`

## Sizing

Already built; what is left is review and merging the stack bottom up.

## Notes for the worker

- Sync by merging main down the stack, never by rebasing.
- Link any new PR into the stack with `gh stack link`, or a deleted base closes it.
