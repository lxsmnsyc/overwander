---
id: i18n-ui-overworld
title: Translate the overworld interface
status: active
priority: should
type: feature
outline: false
milestone: next
size: L
spike: false
gate: false
owns:
  - src/components/overworld/**
  - src/game/overworld/**
  - src/components/settings/SettingsTab.tsx
  - src/i18n/messages/**
  - docs/strategy/translations-terms.md
  - test/i18n/messages.test.ts
  - .changeset/i18n-ui-overworld.md
shared:
  - src/i18n/**
provides: []
depends_on:
  - on: i18n-templates
    kind: hard
    why: Its strings use the templates
  - on: i18n-server-text
    kind: hard
    why: Its refusals come from the server as codes
---

# Translate the overworld interface

## Goal

Translations batch 5, the first batch players see: the overworld HUD, the world map and the overworld dialogs read in English, Japanese and Spanish, and a player can pick the language in Settings.

## Context

- Source: ../../../../strategy/translations.md (The order, batch 5; "What every batch does" is the procedure, steps 2 to 8).
- Batches 0 to 4 are done. Paraglide messages live in `src/i18n/messages/{en,ja,es}.json`; `refusal_*` from batch 4 is the only set so far, and `ja`/`es` fall back to English per message. `src/i18n/locale.ts` has `chooseLocale`, which nothing calls yet. Registry names (species, moves, items) already follow the locale since batch 2.
- In scope: every player-facing string in `src/components/overworld/**` (HoneyTree, Nest, Portal, Safari, Stop, GymSeat, WorldMap dialogs, the board HUD in `overworld-tab/board.tsx`, cell notes, weather icon labels) and in `src/game/overworld/**` (the lines `interact.ts` returns or announces, `challengers.ts` rule and prize text, `windows.ts`). `src/game` may import Paraglide messages: they are plain functions, not Solid.
- Out of scope: NPC dialogue, trainer and gym leader names, town, quest, award, weather and biome names (batch 9, `i18n-people-places`; keep calling the existing name lookups), battle (batch 6), every other screen (batch 7).
- Lines that pick his/her/their from a person keep that choice as a message variant or parameter, never by gluing pronouns.

## Acceptance

- [ ] The extraction lands as its own commit with English reading exactly as before, then the ja and es translations in a second commit.
- [ ] `docs/strategy/translations-terms.md` exists and lists every term this engine invented that the batch translates (ja and es side by side); official terms use the games' names.
- [ ] Settings has a language picker that calls `chooseLocale`, its labels written in each language's own name.
- [ ] `test/i18n/messages.test.ts`: every key exists in every locale and every message's parameters match the English.
- [ ] A fresh review agent checks the ja and es text against the English and the term list; its findings are fixed before the PR.
- [ ] Each touched dialog and the HUD screenshotted in ja and es at the default window size, no clipping.
- [ ] Changeset `minor` (first batch to show a locale).
- [ ] Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test`.

## Sizing

About 130 strings across 15 files, plus the picker, the term list and the key test. Mechanical, but the translation and the screen check carry the time.
