---
id: i18n-places
title: Translate biomes, weather and towns
status: active
priority: should
type: feature
outline: false
milestone: next
size: L
spike: false
gate: false
owns:
  - src/data/text/ja/lair-titles.yaml
  - src/data/text/es/lair-titles.yaml
  - src/data/text/ja/biomes.yaml
  - src/data/text/es/biomes.yaml
  - src/data/text/ja/weather.yaml
  - src/data/text/es/weather.yaml
  - src/data/text/ja/times-of-day.yaml
  - src/data/text/es/times-of-day.yaml
  - src/data/text/ja/landmarks.yaml
  - src/data/text/es/landmarks.yaml
  - src/data/text/ja/lairs.yaml
  - src/data/text/es/lairs.yaml
  - src/data/text/ja/phenomena.yaml
  - src/data/text/es/phenomena.yaml
  - src/data/text/ja/spawn-rarities.yaml
  - src/data/text/es/spawn-rarities.yaml
  - src/data/text/ja/town-names.yaml
  - src/data/text/es/town-names.yaml
  - src/data/overworld/town-names.ts
  - .changeset/i18n-places.md
shared:
  - docs/strategy/translations-terms.md
provides: []
depends_on:
  - on: i18n-people-places
    kind: hard
    why: Its readers take the ja and es overlays this node writes
---

# Translate biomes, weather and towns

## Goal

Translations batch 9, part 5 of 6: the places of the world, in ja and es: biomes, weather and its lines, times of day, landmarks, lairs, phenomena, spawn rarities, and town names as decided by the user.

## Context

- Source: ../../../../strategy/translations.md (The order, batch 9; "What every batch does" steps 3 to 8). Read the outcome of `i18n-people-places` for how each file is read in a locale.
- A locale file sits at the same path under `text/ja/` or `text/es/` as the English file and is keyed the same way.
- Japanese is kana with spaces between phrases, like the Gen 1 to 5 games; a sentence ends with 。. Spanish is the games' Spanish as Spain uses it.
- Terms the games already name use the official term in that locale. Everything this engine invented is translated once and recorded in `docs/strategy/translations-terms.md`; reuse what is there.
- Every coined name is checked against the official ability, move, item and species names of its locale and against the coined names in the term list, then reread on its own pass for a second reading or a second meaning (the lesson of the signature ability nodes).
- Weather and phenomena the games name use the official term (にほんばれ is a move; the weather itself is ひざしが つよい). Biomes and landmarks are this engine's own.
- Town names: the user chose localized word lists. Each locale's lists keep the same length and order as English, so a town is the same town in every language (`world-generation` skill: a word moved or added renames every town already known). Write ja words in kana and es words as Spanish place-name parts, using the joining rules `i18n-people-places` built.
- `i18n-people-places` moved the names this batch built in code into phrase templates: translate `text/en/lair-titles.yaml` too, keeping every `{param}` (read that node's outcome).
- How a town name reads in each locale: Japanese towns in the games are a katakana or kana name plus タウン or シティ (マサラタウン, トキワシティ), and Spanish ones put the title first (Pueblo Paleta, Ciudad Verde). The ja and es joiners in `TOWN_JOINERS` are first drafts from `i18n-people-places`; adjust them in the same commit as the word lists, and put a sample of at least 40 generated names per locale in the outcome so the maintainer can read them.

## Acceptance

- [ ] Every entry has a ja and an es name, and a line where English has one; a test fails if one is missing.
- [ ] A fresh review agent checks the ja and es text against the English and the term list; its findings are fixed before the PR.
- [ ] Changeset `patch`. Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test` (2 workers on this machine).

## Sizing

L: about 950 English words, plus about 560 words of town word lists, which are coined names and get the name checks.
