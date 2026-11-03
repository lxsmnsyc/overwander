---
id: i18n-people-npcs
title: Translate the NPCs
status: done
priority: should
type: feature
outline: false
milestone: next
size: M
spike: false
gate: false
owns:
  - src/overworld/npcs/**
  - src/i18n/messages/**
  - src/data/text/ja/npcs.yaml
  - src/data/text/es/npcs.yaml
  - src/data/text/ja/vendor-stalls.yaml
  - src/data/text/es/vendor-stalls.yaml
  - src/data/text/ja/decorations.yaml
  - src/data/text/es/decorations.yaml
  - .changeset/i18n-people-npcs.md
shared:
  - docs/strategy/translations-terms.md
  - test/i18n/messages.test.ts
provides: []
depends_on:
  - on: i18n-people-places
    kind: hard
    why: Its readers take the ja and es overlays this node writes
---

# Translate the NPCs

## Goal

Translations batch 9, part 2 of 6: what the people in towns are called and say, in ja and es. That is their names, descriptions, opening and spent lines (`text/en/npcs.yaml`), the vendor stalls and decorations, and the lines still written inline in the NPC scripts under `src/overworld/npcs` (about 75 strings, 600 words).

## Context

- Source: the translation plan, `docs/strategy/translations.md`, removed when batch 9 closed (see git history) (The order, batch 9; "What every batch does" steps 3 to 8). Read the outcome of `i18n-people-places` for how each file is read in a locale.
- A locale file sits at the same path under `text/ja/` or `text/es/` as the English file and is keyed the same way.
- Japanese is kana with spaces between phrases, like the Gen 1 to 5 games; a sentence ends with 。. Spanish is the games' Spanish as Spain uses it.
- Terms the games already name use the official term in that locale. Everything this engine invented is translated once and recorded in `docs/strategy/translations-terms.md`; reuse what is there.
- Every coined name is checked against the official ability, move, item and species names of its locale and against the coined names in the term list, then reread on its own pass for a second reading or a second meaning (the lesson of the signature ability nodes).
- First commit: extract the inline script lines into English Paraglide messages under `src/i18n/messages/`, nothing else changed (strategy step 2). The `action-forms` skill describes how an NPC script talks.
- Nurse Joy and other mainline characters keep their official names in each locale.

## Acceptance

- [ ] No player-facing English is left inline under `src/overworld/npcs`; every message exists in en, ja and es with the same parameters (the messages test).
- [ ] A fresh review agent checks the ja and es text against the English and the term list; its findings are fixed before the PR.
- [ ] Screenshots in ja and es at 1280x720 of the screens that show this text show no clipping.
- [ ] Changeset `patch`. Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test` (2 workers on this machine).

## Sizing

M: about 1,400 English words.
