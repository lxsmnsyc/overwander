---
id: i18n-people-trainers
title: Translate the trainer classes
status: active
priority: should
type: feature
outline: false
milestone: next
size: L
spike: false
gate: false
owns:
  - src/data/text/ja/trainer-names.yaml
  - src/data/text/es/trainer-names.yaml
  - src/data/text/ja/trainers/**
  - src/data/text/es/trainers/**
  - src/data/text/ja/trainer-sheets.yaml
  - src/data/text/es/trainer-sheets.yaml
  - .changeset/i18n-people-trainers.md
shared:
  - docs/strategy/translations-terms.md
provides: []
depends_on:
  - on: i18n-people-places
    kind: hard
    why: Its readers take the ja and es overlays this node writes
---

# Translate the trainer classes

## Goal

Translations batch 9, part 3 of 6: the trainer classes of every region (`text/en/trainers/*.yaml`: each class's name and what it says as a duel is put) and the trainer sheets, in ja and es.

## Context

- Source: ../../../../strategy/translations.md (The order, batch 9; "What every batch does" steps 3 to 8). Read the outcome of `i18n-people-places` for how each file is read in a locale.
- A locale file sits at the same path under `text/ja/` or `text/es/` as the English file and is keyed the same way.
- Japanese is kana with spaces between phrases, like the Gen 1 to 5 games; a sentence ends with 。. Spanish is the games' Spanish as Spain uses it.
- Terms the games already name use the official term in that locale. Everything this engine invented is translated once and recorded in `docs/strategy/translations-terms.md`; reuse what is there.
- Every coined name is checked against the official ability, move, item and species names of its locale and against the coined names in the term list, then reread on its own pass for a second reading or a second meaning (the lesson of the signature ability nodes).
- Trainer classes are named in the mainline games (たんパンこぞう / Joven, ミニスカート / Chica). Use the official class name of the locale where the class exists; a class this engine invented gets a coined name in the same style.
- Two regions' worth of one trade share a name and the screen adds the region; keep that sharing in each locale.
- `i18n-people-places` moved the names this batch built in code into phrase templates: translate `text/en/trainer-names.yaml` too, keeping every `{param}` (read that node's outcome).

## Acceptance

- [ ] Every entry has a ja and an es name and quote; a test fails if one is missing.
- [ ] A fresh review agent checks the ja and es text against the English and the term list; its findings are fixed before the PR.
- [ ] Screenshots in ja and es at 1280x720 of the screens that show this text show no clipping.
- [ ] Changeset `patch`. Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test` (2 workers on this machine).

## Sizing

L: about 3,600 English words over six region files.
