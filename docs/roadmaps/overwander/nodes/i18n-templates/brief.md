---
id: i18n-templates
title: Built descriptions as message templates
status: active
priority: should
type: feature
outline: false
milestone: next
size: M
spike: false
gate: false
owns:
  - src/data/items/**
  - test/data/locale-text.test.ts
shared:
  - src/data/yaml.ts
  - src/i18n/format.ts
  - src/data/species/true-shadow.ts
  - src/data/species/zeniths.ts
provides: []
depends_on:
  - on: i18n-plumbing
    kind: contract
    via: locale
---

# Built descriptions as message templates

## Goal

Translations batch 3: text the code builds out of other text (item descriptions out of their family's templates, machine names, true-shadow names) is written in the reader's locale when it is read, never once at registration, and lists and sentences are joined the way the locale joins them.

## Context

- Source: ../../../../strategy/translations.md (The order, batch 3).
- The item families already keep their sentences as templates with parameters under `templates:` in `text/<locale>/items/`. What was missing: a locale's templates were skipped, every built description was written once in English when the items registered, and a few lines were joined by hand (`' and '`, `', ' … ' or '`, `' '`).
- A line built at registration is written in whatever locale registered it: English on the server, the page's locale in the browser. Once a locale is served the two would disagree.

## Acceptance

- [ ] A locale's item templates are read, and `itemText` fills in the active locale's.
- [ ] Every description a family's code writes, and each machine's name and description, is written per locale when read.
- [ ] Lists use `Intl.ListFormat`; sentences are joined the locale's way.
- [ ] No English line changes.
- [ ] Fast check: `pnpm typecheck && pnpm exec vitest run test/data test/i18n`.

## Sizing

Three helpers and the callers of each; the describers themselves already use templates.
