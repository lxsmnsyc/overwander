---
id: i18n-descriptions
title: Make registry descriptions translatable
status: todo
priority: should
type: feature
outline: false
milestone: next
size: M
spike: false
gate: false
owns:
  - scripts/i18n/official-names.ts
  - src/data/constants/stats.ts
  - src/data/text/en/stats.yaml
  - src/data/text/ja/stats.yaml
  - src/data/text/es/stats.yaml
  - src/data/text/en/stages.yaml
  - src/data/text/ja/stages.yaml
  - src/data/text/es/stages.yaml
  - src/data/text/en/zeniths.yaml
  - src/data/text/ja/zeniths.yaml
  - src/data/text/es/zeniths.yaml
  - test/data/official-names.test.ts
  - test/data/locale-text.test.ts
  - .changeset/i18n-descriptions.md
shared:
  - src/data/yaml.ts
  - src/data/items/**
  - docs/strategy/translations-terms.md
provides: []
depends_on:
  - on: i18n-registry-loader
    kind: contract
    via: registry-text
  - on: zenith-paldea
    kind: hard
    why: Every Zenith is written in English first, so translation starts from the finished set
---

# Make registry descriptions translatable

## Goal

Translations batch 8, part 1 of 7: everything the six description batches need before they can write text. Hand-written fields in a generated locale file survive regeneration, stat and stage names follow the locale, and Zenith names are built per locale.

## Context

- Source: ../../../../strategy/translations.md (The order, batch 8). Contract: ../../contracts/registry-text.md. Read the outcomes of `i18n-official-names`, `i18n-templates` and `i18n-ui-catches` (its stubs list the stat names).
- `scripts/i18n/official-names.ts` writes `text/<locale>/{moves,abilities,items,species}/**` from PokeAPI and overwrites each file whole. A `description` written into such a file would be lost on the next run.
- `STAT_NAMES` and `STAGE_NAMES` (`src/data/constants/stats.ts`) are a plain `stringTable` over `text/en/stats.yaml`. Item descriptions built from them (`berries.ts`, `mints.ts`, `power-items.ts`, `wings.ts`, `vitamins.ts`) go through `deriveLocalized`, so they follow a locale table once there is one. `src/components/app/command-bar/names.ts`, `src/data/species/yaml.ts` and `src/overworld/npcs/hyper-trainer/interact.ts` match or parse the English names and must keep doing so.
- Zenith names are built as `Zenith <holder>` in English only (i18n-templates outcome, Stubs left).

## Steps

- [ ] The generator keeps every field it does not write (a hand-written `description`, a hand-written `name` for an engine's own entry) when it rewrites a locale file. A test regenerates over a file holding such a field and finds it unchanged.
- [ ] Stat and stage names become `localeStringTable`s: `stats.yaml` and `stages.yaml` per locale (split the English file's two maps), with the official ja and es names. Callers that parse or match names read an English-only table.
- [ ] Zenith names are built per locale from a template (ja and es written), copied with `extendRecord`.
- [ ] Contract `registry-text` v3 written as a change request: hand-written fields beside generated ones, stats and stages wired.

## Acceptance

- [ ] Under ja and es, a catch sheet and a dex entry show stat names in that language, and a vitamin's description names its stat in that language.
- [ ] Re-running the official-names script leaves `git diff` empty apart from upstream changes, with a hand-written field present.
- [ ] The command bar still finds stats by their English names.
- [ ] Changeset `patch`. Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test`.

## Sizing

M: about 10 files; the generator change is the only part with uncertainty.

## Notes for the worker

- Do not translate any description here; the six nodes after this one do.
