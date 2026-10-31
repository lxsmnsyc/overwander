---
id: i18n-ui-battle
title: Translate the battle interface
status: done
priority: should
type: feature
outline: false
milestone: next
size: L
spike: false
gate: false
owns:
  - src/components/battle/**
  - src/components/duels/**
  - src/game/battle/**
  - src/canvas/battle/field/**
  - src/i18n/messages/**
  - docs/strategy/translations-terms.md
  - .changeset/i18n-ui-battle.md
shared:
  - src/i18n/**
  - src/model/health.ts
  - src/canvas/overworld/metrics.ts
  - test/i18n/**
provides: []
depends_on:
  - on: i18n-templates
    kind: hard
    why: The log uses the templates
  - on: i18n-ui-overworld
    kind: hard
    why: Builds on its term list, key test and the picker that makes a locale visible
---

# Translate the battle interface

## Goal

Translations batch 6: the battle view, the duel lobby and rules, the past-battle history and the verdict read in English, Japanese and Spanish.

## Context

- Source: ../../../../strategy/translations.md (The order, batch 6; "What every batch does" is the procedure, steps 2 to 8).
- Batch 5 (`i18n-ui-overworld`, read its outcome) set the pattern: Paraglide messages in `src/i18n/messages/{en,ja,es}.json`, `test/i18n/messages.test.ts` checks keys and parameters across locales, `docs/strategy/translations-terms.md` holds the terms, and Settings has the language picker. Reuse its terms; add new ones to the list.
- In scope:
  - `src/components/battle/**`: battle view and top bar, unit cards, party, teams preview, spectators, watch, lobby invite, duel rules, verdict, history (the most strings).
  - `src/components/duels/**`: duel lobby and tab.
  - `STATUS_NAMES` in `src/model/health.ts`: the status conditions use the games' official ja and es names. Read them through a function so they follow the locale; update the callers it has outside battle too.
  - Canvas text: the loading label (`LOADING_LABEL` in `src/canvas/battle/field/metrics.ts` and its twin in `src/canvas/overworld/metrics.ts`). The move-name plate already draws registry names.
  - Anything the battle log or summary builds as a sentence in `src/game/battle/**` or `battle-view/summary.ts`.
- Move, ability, item and species names already follow the locale (registry text); their descriptions are batch 8. Trainer, gym leader and place names are batch 9: keep calling the existing lookups. Refusals and the menu bar are batch 7.
- Battle cues are drawn shapes, not text; leave them.
- Lines that pick his/her/their from a person keep that choice as a message variant or parameter. A plural takes a `*` catch-all variant so Spanish `many` never shows the key.

## Acceptance

- [ ] The extraction lands as its own commit with English reading exactly as before, then the ja and es translations in a second commit.
- [ ] Status condition names use the official ja and es terms, recorded in the term list.
- [ ] `test/i18n/messages.test.ts` still passes over the new keys.
- [ ] A fresh review agent checks the ja and es text against the English and the term list; its findings are fixed before the PR.
- [ ] Battle view (a wild fight and a duel), duel lobby, duel rules, verdict and history screenshotted in ja and es at 1280x720, no clipping.
- [ ] Changeset `patch`.
- [ ] Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test`.

## Sizing

About 120 strings across 17 files, plus the status names. Same shape as batch 5.
