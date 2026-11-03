---
id: i18n-people-experts
title: Translate the gym leaders, Elite Four and other experts
status: active
priority: should
type: feature
outline: false
milestone: next
size: L
spike: false
gate: false
owns:
  - src/data/text/ja/syndicate-titles.yaml
  - src/data/text/es/syndicate-titles.yaml
  - src/data/text/ja/gym-leaders.yaml
  - src/data/text/es/gym-leaders.yaml
  - src/data/text/ja/elite.yaml
  - src/data/text/es/elite.yaml
  - src/data/text/ja/champions.yaml
  - src/data/text/es/champions.yaml
  - src/data/text/ja/frontier.yaml
  - src/data/text/es/frontier.yaml
  - src/data/text/ja/frontier-rooms.yaml
  - src/data/text/es/frontier-rooms.yaml
  - src/data/text/ja/legends.yaml
  - src/data/text/es/legends.yaml
  - src/data/text/ja/executives.yaml
  - src/data/text/es/executives.yaml
  - src/data/text/ja/syndicates.yaml
  - src/data/text/es/syndicates.yaml
  - .changeset/i18n-people-experts.md
shared:
  - docs/strategy/translations-terms.md
provides: []
depends_on:
  - on: i18n-people-places
    kind: hard
    why: Its readers take the ja and es overlays this node writes
---

# Translate the gym leaders, Elite Four and other experts

## Goal

Translations batch 9, part 4 of 6: the named people the player challenges, in ja and es: gym leaders, the Elite Four, champions, the Battle Frontier and its rooms, the legends, the syndicate executives and the syndicates.

## Context

- Source: ../../../../strategy/translations.md (The order, batch 9; "What every batch does" steps 3 to 8). Read the outcome of `i18n-people-places` for how each file is read in a locale.
- A locale file sits at the same path under `text/ja/` or `text/es/` as the English file and is keyed the same way.
- Japanese is kana with spaces between phrases, like the Gen 1 to 5 games; a sentence ends with 。. Spanish is the games' Spanish as Spain uses it.
- Terms the games already name use the official term in that locale. Everything this engine invented is translated once and recorded in `docs/strategy/translations-terms.md`; reuse what is there.
- Every coined name is checked against the official ability, move, item and species names of its locale and against the coined names in the term list, then reread on its own pass for a second reading or a second meaning (the lesson of the signature ability nodes).
- These are mainline characters: each keeps its official name in the locale (タケシ / Brock, カスミ / Misty), and each team keeps its official name (ロケットだん / Team Rocket). Only the quotes are translated, and each speaks in the voice the games give them.
- `i18n-people-places` moved the names this batch built in code into phrase templates: translate `text/en/syndicate-titles.yaml` too, keeping every `{param}` (read that node's outcome).

## Acceptance

- [ ] Every entry has a ja and an es name and quote; a test fails if one is missing.
- [ ] A fresh review agent checks the ja and es text against the English and the term list; its findings are fixed before the PR.
- [ ] Changeset `patch`. Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test` (2 workers on this machine).

## Sizing

L: about 2,400 English words, with every name checked against the official one.
