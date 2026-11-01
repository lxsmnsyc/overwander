---
id: i18n-desc-items
title: Translate item descriptions
status: todo
priority: should
type: feature
outline: false
milestone: next
size: M
spike: false
gate: false
owns:
  - src/data/text/ja/items/**
  - src/data/text/es/items/**
  - .changeset/i18n-desc-items.md
shared:
  - docs/strategy/translations-terms.md
provides: []
depends_on:
  - on: i18n-descriptions
    kind: hard
    why: Hand-written descriptions only survive the official-names generator once it keeps them
---

# Translate item descriptions

## Goal

Translations batch 8, part 2 of 7: every item's written description and every family's `templates:` in ja and es, so the bag, the shop and the auction board describe items in the player's language.

## Context

- Source: ../../../../strategy/translations.md (The order, batch 8; "What every batch does" steps 3 to 8). Contract: ../../contracts/registry-text.md (v3 after i18n-descriptions). Read the outcome of `i18n-descriptions`.
- A locale file sits at the same path under `text/ja/` or `text/es/` as the English file and is keyed the same way. Where the generated file already exists (official names), add `description:` beside the generated `name:`; the generator keeps it.
- The English line describes this engine's behaviour, not the mainline's (the `registry-descriptions` skill). Translate the English line as written, never the official game's flavour text. Official terms (moves, abilities, items, statuses, stats) come from the term list and the registry's own ja and es names.
- Japanese is kana with spaces between phrases, like the Gen 1 to 5 games, and ends a description with 。. Spanish uses the official Spanish games' terms.
- Templates already follow the locale (i18n-templates outcome); this node writes them. The Zenith shard template's `article` is English grammar and may be left out.

## Acceptance

- [ ] Every entry in scope has a ja and an es `description`. A test fails if one is missing or ends without a full stop (。 in Japanese).
- [ ] A fresh review agent checks the ja and es text against the English and the term list; its findings are fixed before the PR.
- [ ] Screenshots in ja and es at 1280x720 of two screens that show these descriptions show no clipping.
- [ ] Changeset `patch`. Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test`.

## Sizing

M: 277 written descriptions (about 4,000 English words) and the template families, over 49 files.
