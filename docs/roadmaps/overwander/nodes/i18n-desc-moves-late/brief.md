---
id: i18n-desc-moves-late
title: Translate move descriptions, Gens 5 to 9
status: todo
priority: should
type: feature
outline: false
milestone: next
size: L
spike: false
gate: false
owns:
  - src/data/text/ja/moves/gen-5/**
  - src/data/text/ja/moves/gen-6/**
  - src/data/text/ja/moves/gen-7/**
  - src/data/text/ja/moves/gen-8/**
  - src/data/text/ja/moves/gen-9/**
  - src/data/text/ja/moves/weather.yaml
  - src/data/text/es/moves/gen-5/**
  - src/data/text/es/moves/gen-6/**
  - src/data/text/es/moves/gen-7/**
  - src/data/text/es/moves/gen-8/**
  - src/data/text/es/moves/gen-9/**
  - src/data/text/es/moves/weather.yaml
  - .changeset/i18n-desc-moves-late.md
shared:
  - docs/strategy/translations-terms.md
provides: []
depends_on:
  - on: i18n-descriptions
    kind: hard
    why: Hand-written descriptions only survive the official-names generator once it keeps them
---

# Translate move descriptions, Gens 5 to 9

## Goal

Translations batch 8, part 4 of 7: the descriptions of the moves filed under `text/en/moves/gen-5` to `gen-9` and `weather.yaml` in ja and es.

## Context

- Source: ../../../../strategy/translations.md (The order, batch 8; "What every batch does" steps 3 to 8). Contract: ../../contracts/registry-text.md (v3 after i18n-descriptions). Read the outcome of `i18n-descriptions`.
- A locale file sits at the same path under `text/ja/` or `text/es/` as the English file and is keyed the same way. Where the generated file already exists (official names), add `description:` beside the generated `name:`; the generator keeps it.
- The English line describes this engine's behaviour, not the mainline's (the `registry-descriptions` skill). Translate the English line as written, never the official game's flavour text. Official terms (moves, abilities, items, statuses, stats) come from the term list and the registry's own ja and es names.
- Japanese is kana with spaces between phrases, like the Gen 1 to 5 games, and ends a description with 。. Spanish uses the official Spanish games' terms.

## Acceptance

- [ ] Every entry in scope has a ja and an es `description`. A test fails if one is missing or ends without a full stop (。 in Japanese).
- [ ] A fresh review agent checks the ja and es text against the English and the term list; its findings are fixed before the PR.
- [ ] Screenshots in ja and es at 1280x720 of two screens that show these descriptions show no clipping.
- [ ] Changeset `patch`. Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test`.

## Sizing

L: 477 descriptions (about 6,500 English words) into two languages.
