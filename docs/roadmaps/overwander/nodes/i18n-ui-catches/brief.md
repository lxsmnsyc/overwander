---
id: i18n-ui-catches
title: Translate catches, items and the dex
status: done
priority: should
type: feature
outline: false
milestone: next
size: L
spike: false
gate: false
owns:
  - src/components/catches/**
  - src/components/items/**
  - src/components/dex/**
  - src/components/moves/**
  - src/components/sprites/**
  - src/game/catches/**
  - src/game/items/**
  - src/i18n/messages/**
  - docs/strategy/translations-terms.md
  - .changeset/i18n-ui-catches.md
shared:
  - src/i18n/**
  - test/i18n/**
provides: []
depends_on:
  - on: i18n-ui-shell
    kind: hard
    why: Reuses its shared furniture messages and pickers
---

# Translate catches, items and the dex

## Goal

Translations batch 7, part 2 of 3: the catch box and catch sheet, the bag and candy, the item cards and the Pokédex read in English, Japanese and Spanish.

## Context

- Source: ../../../../strategy/translations.md (The order, batch 7; "What every batch does" steps 2 to 8). Read the outcomes of `i18n-ui-battle` and `i18n-ui-shell` for the pattern and the shared keys to reuse.
- In scope:
  - `src/components/catches/**`: the catch dialog and its sections, the lists, picker and cards, Ability Patch, Bottle Cap, PP Up, and the buddy. This is the most text, including `' · fainted'` in `catch-summary.ts`.
  - `src/components/items/**`, `src/components/dex/**`, `src/components/moves/**` and `src/components/sprites/**`.
  - The lines `src/game/items/**` and `src/game/catches/**` say.
- Stat names, type names and natures already follow the locale through registry text. Item, move and ability descriptions are batch 8. Leave them on their lookups.

## Acceptance

- [ ] The extraction lands as its own commit with English reading exactly as before, then the ja and es translations.
- [ ] `test/i18n/messages.test.ts` passes over the new keys.
- [ ] A fresh review agent checks the ja and es text; its findings are fixed before the PR.
- [ ] Screenshots in ja and es at 1280x720 show no clipping, for: the catch box, a catch sheet on each tab, the bag, the candy grid, an item card, the dex grid and a dex entry.
- [ ] Changeset `patch`.
- [ ] Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test`.

## Sizing

About 350 strings over about 50 files.
