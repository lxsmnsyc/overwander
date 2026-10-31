---
id: i18n-official-names
title: Official Japanese and Spanish names
status: done
priority: should
type: feature
outline: false
milestone: next
size: L
spike: false
gate: false
owns:
  - scripts/i18n/official-names.ts
  - src/data/text/ja/**
  - src/data/text/es/**
  - test/data/official-names.test.ts
shared:
  - project.inlang/settings.json
  - src/i18n/locale.ts
  - src/i18n/server.ts
  - src/data/yaml.ts
  - src/data/constants/types.ts
  - src/data/ids/text.ts
  - package.json
provides: []
depends_on:
  - on: i18n-registry-loader
    kind: contract
    via: registry-text
---

# Official Japanese and Spanish names

## Goal

Translations batch 2: a script writes the official ja and es names from PokeAPI into `text/ja/` and `text/es/` for every species, move, ability, item, type and nature, and the registries read them.

## Context

- Source: ../../../../strategy/translations.md (The order, batch 2; Decided: kana Japanese, Spain's Spanish, official names never translated by hand).
- PokeAPI's CSV tables on GitHub, pinned to one commit. Language ids: `1` (ja-Hrkt, kana), `11` (ja), `7` (es), `9` (en).
- Entries are matched by English name. Entries the games do not name (signature abilities, Zeniths, this game's own items) stay English.

## Acceptance

- [ ] `pnpm official-names` writes `text/ja/` and `text/es/` and reports what it left in English.
- [ ] ja and es are locales the registries accept, but no request is served one before batch 5.
- [ ] Types and natures read the active locale through `stringTable`'s locale form.
- [ ] Japanese holds no kanji.
- [ ] Fast check: `pnpm typecheck && pnpm exec vitest run test/data test/i18n`.

## Sizing

One script and its generated files, the two locales switched on behind a gate, and two `stringTable` callers.
