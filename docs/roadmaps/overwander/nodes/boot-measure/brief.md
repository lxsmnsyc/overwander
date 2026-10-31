---
id: boot-measure
title: Measure the startup bundle
status: active
priority: should
type: feature
outline: false
milestone: next
size: S
spike: false
gate: false
owns:
  - scripts/measure-boot.ts
  - docs/engine/boot.md
shared: []
provides: []
depends_on: []
---

# Measure the startup bundle

## Goal

Walk the Vite manifest's static graph for the main route and record today's startup total and the size of each chunk, so each later boot change reports a before and after.

## Context

- Source: docs/todo.md: Platform, Deferring data and runtime at boot (Measure first)

## Acceptance

- [ ] `pnpm measure-boot` (or the script directly) prints the startup total and per-chunk sizes after a build.
- [ ] The baseline is written down in the doc.

## Sizing

One script reading a build manifest.
