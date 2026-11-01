---
id: i18n-desc-signature-late
title: Translate signature abilities, Unova to Paldea
status: todo
priority: should
type: feature
outline: false
milestone: next
size: L
spike: false
gate: false
owns:
  - src/data/text/ja/abilities/signature/unova.yaml
  - src/data/text/ja/abilities/signature/kalos.yaml
  - src/data/text/ja/abilities/signature/alola.yaml
  - src/data/text/ja/abilities/signature/galar.yaml
  - src/data/text/ja/abilities/signature/hisui.yaml
  - src/data/text/ja/abilities/signature/paldea.yaml
  - src/data/text/es/abilities/signature/unova.yaml
  - src/data/text/es/abilities/signature/kalos.yaml
  - src/data/text/es/abilities/signature/alola.yaml
  - src/data/text/es/abilities/signature/galar.yaml
  - src/data/text/es/abilities/signature/hisui.yaml
  - src/data/text/es/abilities/signature/paldea.yaml
  - .changeset/i18n-desc-signature-late.md
shared:
  - docs/strategy/translations-terms.md
provides: []
depends_on:
  - on: i18n-descriptions
    kind: hard
    why: Hand-written descriptions only survive the official-names generator once it keeps them
---

# Translate signature abilities, Unova to Paldea

## Goal

Translations batch 8, part 7 of 7: the names and descriptions of the signature abilities filed under Unova, Kalos, Alola, Galar, Hisui and Paldea in ja and es.

## Context

- Source: ../../../../strategy/translations.md (The order, batch 8; "What every batch does" steps 3 to 8). Contract: ../../contracts/registry-text.md (v3 after i18n-descriptions). Read the outcome of `i18n-descriptions`.
- A locale file sits at the same path under `text/ja/` or `text/es/` as the English file and is keyed the same way. Where the generated file already exists (official names), add `description:` beside the generated `name:`; the generator keeps it.
- The English line describes this engine's behaviour, not the mainline's (the `registry-descriptions` skill). Translate the English line as written, never the official game's flavour text. Official terms (moves, abilities, items, statuses, stats) come from the term list and the registry's own ja and es names.
- Japanese is kana with spaces between phrases, like the Gen 1 to 5 games, and ends a description with 。. Spanish uses the official Spanish games' terms.
- Signature abilities are this engine's own, so their **names** are translated too (`signature-abilities` skill: themes shared across a group stay shared). Reuse the names `i18n-desc-signature-early` recorded in the term list.

## Acceptance

- [ ] Every entry in scope has a ja and an es `description`. A test fails if one is missing or ends without a full stop (。 in Japanese).
- [ ] A fresh review agent checks the ja and es text against the English and the term list; its findings are fixed before the PR.
- [ ] Screenshots in ja and es at 1280x720 of two screens that show these descriptions show no clipping.
- [ ] Changeset `patch`. Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test`.

## Sizing

L: 287 names and descriptions (about 4,600 English words); coined names as in the early part.
