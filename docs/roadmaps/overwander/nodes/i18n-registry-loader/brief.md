---
id: i18n-registry-loader
title: Registry text by locale
status: done
priority: should
type: feature
outline: false
milestone: next
size: M
spike: false
gate: false
owns:
  - src/data/yaml.ts
  - src/data/abilities/yaml.ts
  - src/data/biome/yaml.ts
  - src/data/items/yaml.ts
  - src/data/moves/yaml.ts
  - src/data/species/yaml.ts
  - test/data/locale-text.test.ts
shared: []
provides:
  - registry-text
depends_on:
  - on: i18n-plumbing
    kind: contract
    via: locale
---

# Registry text by locale

## Goal

Translations batch 1: each registry `yaml.ts` reads `text/<locale>/` over `text/en/` and checks both have the same keys. Text lookups go through `getSpeciesName(id)` and friends, reading the active locale.

## Context

- Source: ../../../../strategy/translations.md (The order, batch 1)

## Acceptance

- [ ] A `text/xx/` folder with one entry overrides English for that entry in a test.
- [ ] A key present in one locale and missing in another fails the load.
- [ ] Fast check passes: `pnpm typecheck && pnpm exec vitest run test/data`

## Sizing

Touches every registry loader, but each change is the same few lines.
