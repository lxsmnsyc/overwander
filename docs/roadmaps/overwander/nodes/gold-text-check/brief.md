---
id: gold-text-check
title: Keep words out of plain gold
status: done
spent: 62903
priority: should
type: chore
outline: false
milestone: now
size: S
added: 2026-11-04
verify: pnpm exec vitest run test/components/gold-text.test.ts
owns:
  - test/components/gold-text.test.ts
  - src/components/app/Announcements.tsx
shared: []
provides: []
depends_on:
  - on: ui-design-system
    kind: hard
    why: The rule comes from its gold tokens
---

# Keep words out of plain gold

## Goal

A test that fails when words are set in plain `text-gold`. The board's gold (`#F2B33D`) is a fill colour and reads at about 1.9:1 on white, so words use `text-gold-dark` and plain gold is for fills, bars, icons and glyphs (`docs/design/field-kit.md`, Colour).

## Context

- Source: proposed learning in `nodes/ui-design-system/outcome.md`.
- Today 9 plain `text-gold` uses remain in `src`: star glyphs and icons in `CatchCard.tsx`, `CatchBox.tsx` and `PortraitSection.tsx` (all decorative), and `hover:text-gold` on a button in `src/components/app/Announcements.tsx:89`.

## Acceptance

- [ ] `test/components/gold-text.test.ts` scans the `.tsx` and `.ts` files under `src` and fails on a plain `text-gold` class (with or without a variant such as `hover:`) unless the element is decorative (`aria-hidden="true"`). `text-gold-dark` and `text-gold-soft` pass.
- [ ] Each of today's uses passes or is fixed. `Announcements.tsx:89` changes only if it colours words.
- [ ] Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), the new test.

## Sizing

S: one test file and at most one class change.

## Notes for the worker

- Read the element around each match rather than the single line: class strings wrap across lines.
- The catch files belong to `ui-redesign-catches`; if one of them needs a change, record it under Deviations instead of editing it, unless that node is not active.
