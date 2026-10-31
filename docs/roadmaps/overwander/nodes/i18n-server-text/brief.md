---
id: i18n-server-text
title: Server answers as codes
status: active
priority: should
type: feature
outline: false
milestone: next
size: M
spike: false
gate: false
owns:
  - src/model/refusal.ts
  - src/model/gift-reason.ts
  - src/i18n/refusals.ts
  - src/i18n/gift-reasons.ts
  - src/i18n/messages/**
  - test/i18n/refusals.test.ts
shared:
  - src/server/**
  - src/auth/**
  - src/components/**
  - src/game/**
provides: []
depends_on:
  - on: i18n-plumbing
    kind: contract
    via: locale
---

# Server answers as codes

## Goal

Translations batch 4: what the server tells a player is a code and its parameters, never a sentence, and the browser says it in the player's language through Paraglide messages.

## Context

- Source: ../../../../strategy/translations.md (The order, batch 4).
- Most server functions already answer with data or a typed result the browser describes. What was left: about 20 sentences thrown as `Error`s (signed out, banned, closed, paced, friends, teleport, the command bar, validation) and the reasons the game writes on the gifts it gives (starter, quest, daily, hunt), which are stored in the database.
- Every place the browser showed a failure read `error.message` directly.

## Acceptance

- [ ] No player-facing sentence is thrown by the server; each is a refusal code with parameters.
- [ ] Every place that shows a failure goes through `describeFailure`.
- [ ] The game's own gift reasons are stored as codes; staff reasons and old rows show as written.
- [ ] English reads exactly as before.
- [ ] Checks: `pnpm typecheck`, lint, `pnpm test`, `pnpm test:db`.

## Sizing

Two small shared modules, their messages, and many one-line call-site changes.
