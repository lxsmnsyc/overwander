---
id: i18n-progress
title: Translate quests, awards and titles, and close batch 9
status: todo
priority: should
type: feature
outline: false
milestone: next
size: M
spike: false
gate: false
owns:
  - src/data/text/ja/quests.yaml
  - src/data/text/es/quests.yaml
  - src/data/text/ja/awards.yaml
  - src/data/text/es/awards.yaml
  - src/data/text/ja/achievements.yaml
  - src/data/text/es/achievements.yaml
  - src/data/text/ja/titles.yaml
  - src/data/text/es/titles.yaml
  - src/data/text/ja/dex-rungs.yaml
  - src/data/text/es/dex-rungs.yaml
  - src/data/text/ja/egg-groups.yaml
  - src/data/text/es/egg-groups.yaml
  - src/data/text/ja/item-types.yaml
  - src/data/text/es/item-types.yaml
  - docs/strategy/translations.md
  - .changeset/i18n-progress.md
shared:
  - docs/strategy/translations-terms.md
provides: []
depends_on:
  - on: i18n-people-places
    kind: hard
    why: Its readers take the ja and es overlays this node writes
---

# Translate quests, awards and titles, and close batch 9

## Goal

Translations batch 9, part 6 of 6, the last of the plan: quests, awards (badges included), achievements, titles and dex rungs, plus the small name tables nothing else covers (egg groups, item types), in ja and es.

## Context

- Source: ../../../../strategy/translations.md (The order, batch 9; "What every batch does" steps 3 to 8). Read the outcome of `i18n-people-places` for how each file is read in a locale.
- A locale file sits at the same path under `text/ja/` or `text/es/` as the English file and is keyed the same way.
- Japanese is kana with spaces between phrases, like the Gen 1 to 5 games; a sentence ends with 。. Spanish is the games' Spanish as Spain uses it.
- Terms the games already name use the official term in that locale. Everything this engine invented is translated once and recorded in `docs/strategy/translations-terms.md`; reuse what is there.
- Every coined name is checked against the official ability, move, item and species names of its locale and against the coined names in the term list, then reread on its own pass for a second reading or a second meaning (the lesson of the signature ability nodes).
- Badges and egg groups have official names (グレーバッジ / Medalla Roca, かいじゅう / Monstruo). Titles, quests and achievements are this engine's own.
- This node closes the translation plan: when it merges, `docs/strategy/translations.md` is deleted (GOAL.md: a strategy plan is deleted once its last node merges) and the term list stays.

## Acceptance

- [ ] Every entry has a ja and an es name, and a line where English has one; a test fails if one is missing.
- [ ] `docs/strategy/translations.md` is removed and nothing links to it.
- [ ] A fresh review agent checks the ja and es text against the English and the term list; its findings are fixed before the PR.
- [ ] Screenshots in ja and es at 1280x720 of the screens that show this text show no clipping.
- [ ] Changeset `patch`. Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test` (2 workers on this machine).

## Sizing

M: about 950 English words.
