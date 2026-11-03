---
id: i18n-people-places
title: Make people and places text translatable
status: active
priority: should
type: feature
outline: false
milestone: next
size: M
spike: false
gate: false
owns:
  - src/data/ids/text.ts
  - src/data/ids/titles.ts
  - src/data/ids/lairs.ts
  - src/data/ids/trainers.ts
  - src/data/biome/names.ts
  - src/data/overworld/**/*.ts
  - src/data/quests/*.ts
  - src/data/achievements.ts
  - src/data/awards.ts
  - src/data/species/megas.ts
  - src/overworld/npcs/create.ts
  - test/data/locale-text.test.ts
  - .changeset/i18n-people-places.md
shared:
  - src/data/yaml.ts
provides: []
depends_on:
  - on: i18n-desc-signature-late
    kind: hard
    why: Batch 9 follows batch 8 in the strategy's order
---

# Make people and places text translatable

## Goal

Translations batch 9, part 1 of 6, English only: every text file the batch translates is read in the player's locale, so the five translation nodes after it only write YAML. Nothing a player sees changes.

## Context

- Source: ../../../../strategy/translations.md (batch 9). The model is `i18n-descriptions`, which did the same for batch 8: read its outcome.
- Today these files are read in English only, through `stringTable` or a direct `text/en/...yaml` import: npcs, vendor-stalls, decorations, trainers/*, trainer-sheets, gym-leaders, elite, champions, frontier, frontier-rooms, legends, executives, syndicates, biomes, weather, times-of-day, landmarks, lairs, phenomena, spawn-rarities, town-names, quests, awards, achievements, titles, dex-rungs, families, megas, egg-groups, item-types. Find every reader with `rtk proxy grep -rlE "stringTable\(|text/en/" src`.
- Switch each to the locale readers already in `src/data/yaml.ts` (`localeStringTable`, `readOverlays` with `localize`), the way natures and the registries are read. A file with no `ja` or `es` overlay reads English, so this node ships no translations.
- Town names are built from word lists by position (`src/data/overworld/town-names.ts`). The user decided each locale gets its own word lists: a town keeps its position in every list, so it is the same town in every language, but its name is built from the locale's words. Make the builder take a locale's lists (heads, tails, marks, titles, counties) and its own way of joining them: Japanese and Spanish do not weld a tail onto a head the way English does, and a Spanish title comes before the name ("Pueblo ..."). The lists stay English-only in this node; a test fails when a locale's list differs in length from the English one.
- Families and Megas need no hand translation: a family is called what its first species is called, and a Mega is the official Mega form name. Derive both from the species names where the data allows, and say in the outcome which entries could not be derived.

## Acceptance

- [ ] Every file listed above is read through a locale reader; a test fails when a `ja` or `es` overlay has a key the English file lacks, or a message parameter the English lacks.
- [ ] No player-facing text changes in English (the existing tests and `pnpm official-names` leave no diff).
- [ ] Changeset `patch`. Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test` (2 workers on this machine).

## Sizing

M: about 30 readers switched to helpers that exist, plus one parity test.
