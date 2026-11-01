---
id: i18n-ui-shell
title: Translate the game's shell
status: done
priority: should
type: feature
outline: false
milestone: next
size: L
spike: false
gate: false
owns:
  - src/components/app/**
  - src/components/styled/**
  - src/components/forms/**
  - src/components/settings/**
  - src/components/notifications/**
  - src/components/news/**
  - src/components/gifts/**
  - src/components/friends/**
  - src/auth/refusal.ts
  - src/routes/index.tsx
  - src/routes/reset-password.tsx
  - src/routes/[...404].tsx
  - src/data/constants/duel-rules.ts
  - src/i18n/messages/**
  - docs/strategy/translations-terms.md
  - .changeset/i18n-ui-shell.md
shared:
  - src/i18n/**
  - test/i18n/**
provides: []
depends_on:
  - on: i18n-ui-battle
    kind: hard
    why: Builds on its messages, term list and key test
---

# Translate the game's shell

## Goal

Translations batch 7, part 1 of 3: everything a player sees around every screen reads in English, Japanese and Spanish. That means the menu bar and game menu, sign-in and password reset, the shared dialog furniture, the pickers and forms, settings, notifications, news, gifts and friends, and every refusal.

## Context

- Source: ../../../../strategy/translations.md (The order, batch 7; "What every batch does" is the procedure, steps 2 to 8). Batch 7 is split in three: this shell, then `i18n-ui-catches` and `i18n-ui-social`.
- Read the outcomes of `i18n-ui-overworld` and `i18n-ui-battle` for the pattern: Paraglide messages in `src/i18n/messages/{en,ja,es}.json`, `test/i18n/messages.test.ts`, the term list, message tables held as functions and called when shown, plurals with a `*` catch-all.
- In scope:
  - `src/components/app/**`: the GameMenu, panel titles, the command bar, the login form and announcements.
  - `src/components/styled/**`: shared furniture such as Close, pager, filter and search labels, toasts and hints.
  - `src/components/forms/**`: the team, catch, item and move pickers, the shop, `terms.tsx` (CounterTerms, "You carry…", "{n} gold") and the conversation frame. NPC lines are not in scope.
  - Settings, notifications, news, gifts and friends.
  - Refusals: translate every `refusal_*` and `gift_reason_*` message to ja and es (the key test exempts them today; remove that exemption). Sign-in refusals in `src/auth/refusal.ts` move to messages. Duel refusals (`duelRefusal` in `src/data/constants/duel-rules.ts`) return a reason the lobby says.
  - Routes: the landing page, password reset and 404.
- Out of scope: the admin panel, `/demo` and the sprite processor stay English, because they are staff and developer tools. Catches, items and dex go to `i18n-ui-catches`. Auctions, trades, raids, quests and profile go to `i18n-ui-social`. Registry descriptions are batch 8. Names of people and places are batch 9.
- Shared text that the other two parts will reuse (for example "gold", "Close", "Back", counts) is written here, under neutral keys, so they do not duplicate it.

## Acceptance

- [ ] The extraction lands as its own commit with English reading exactly as before, then the ja and es translations.
- [ ] No refusal or gift reason shows English under ja or es.
- [ ] `test/i18n/messages.test.ts` covers every key in all locales, with no refusal exemption.
- [ ] A fresh review agent checks the ja and es text against the English and the term list; its findings are fixed before the PR.
- [ ] Screenshots in ja and es at 1280x720 show no clipping, for: the menu bar and game menu, sign-in, settings, a picker form, a shop, notifications, gifts and friends.
- [ ] Changeset `patch`.
- [ ] Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test`.

## Sizing

About 300 strings over about 100 files, many of them one-word labels in `styled`. At the top of L. If extraction alone runs past one sitting, land the furniture (`styled`, `forms`) first and note the rest in the outcome.
