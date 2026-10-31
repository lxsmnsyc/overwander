---
id: i18n-ui-social
title: Translate auctions, trades, raids, quests and profile
status: todo
priority: should
type: feature
outline: false
milestone: next
size: L
spike: false
gate: false
owns:
  - src/components/auctions/**
  - src/components/trades/**
  - src/components/raids/**
  - src/components/quests/**
  - src/components/profile/**
  - src/i18n/messages/**
  - docs/strategy/translations-terms.md
  - .changeset/i18n-ui-social.md
shared:
  - src/i18n/**
  - test/i18n/**
provides: []
depends_on:
  - on: i18n-ui-catches
    kind: hard
    why: Same message files; the catch cards it translates appear in trades and auctions
---

# Translate auctions, trades, raids, quests and profile

## Goal

Translations batch 7, part 3 of 3, and the last interface batch: auctions, trades, the raids tab, quests and the profile read in English, Japanese and Spanish. After this, the only English left under ja and es is registry descriptions (batch 8), names of people and places (batch 9), and the staff tools.

## Context

- Source: ../../../../strategy/translations.md (The order, batch 7; "What every batch does" steps 2 to 8). Read the outcomes of `i18n-ui-shell` and `i18n-ui-catches` for shared keys to reuse.
- In scope: `src/components/{auctions,trades,raids,quests,profile}/**`. Quest goals (`quests-tab/describe.tsx`, such as "Earn {n} gold") are built in code and become messages here. Quest names are batch 9.
- Award names, titles and raid titles stay on their lookups (batch 9).

## Acceptance

- [ ] The extraction lands as its own commit with English reading exactly as before, then the ja and es translations.
- [ ] `test/i18n/messages.test.ts` passes over the new keys.
- [ ] A fresh review agent checks the ja and es text; its findings are fixed before the PR.
- [ ] Screenshots in ja and es at 1280x720 show no clipping, for: the auction board and a listing, a trade offer, the raids tab, the quests tab and the profile.
- [ ] Changeset `patch`.
- [ ] Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test`.

## Sizing

About 230 strings over about 25 files.
