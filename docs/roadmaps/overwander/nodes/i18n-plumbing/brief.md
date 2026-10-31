---
id: i18n-plumbing
title: Locale plumbing
status: active
priority: should
type: feature
outline: false
milestone: next
size: M
spike: false
gate: false
owns:
  - src/i18n/**
  - project.inlang/**
shared:
  - src/components/app/settings.ts
  - src/entry-server.tsx
  - package.json
  - pnpm-lock.yaml
provides:
  - locale
depends_on: []
---

# Locale plumbing

## Goal

Translations batch 0: Paraglide, a locale setting beside the theme that defaults from `Accept-Language` on the server render and sets `<html lang>`, and `Intl` in place of every `toLocaleString('en-US')` and hand-built date. English only; nothing a player sees changes.

## Context

- Source: ../../../../strategy/translations.md (The order, batch 0)

## Acceptance

- [ ] The locale setting exists, defaults from `Accept-Language`, and sets `<html lang>`.
- [ ] No `toLocaleString` call is left outside `src/i18n/`.
- [ ] Fast check passes: `pnpm typecheck && pnpm exec vitest run test/i18n`

## Sizing

Known pattern new to this repo; adds a dependency, so it merges alone.

## Notes for the worker

- A device setting follows the `device-settings` skill.
- Adds Paraglide to the lockfile: nothing else adding a dependency should merge beside it.
