---
id: i18n-form-names
title: Name every form and category in ja and es
status: done
priority: should
type: fix
outline: false
milestone: next
size: M
spike: false
gate: false
added: 2026-11-01
verify: pnpm exec vitest run test/data/official-names.test.ts test/data/locale-text.test.ts
owns:
  - scripts/i18n/official-names.ts
  - scripts/i18n/keep-written.ts
  - scripts/i18n/overrides/**
  - src/data/text/ja/species/**
  - src/data/text/es/species/**
  - test/data/official-names.test.ts
  - .changeset/i18n-form-names.md
shared:
  - docs/strategy/translations-terms.md
provides: []
depends_on:
  - on: i18n-descriptions
    kind: hard
    why: Builds on the generator that keeps hand-written fields
---

# Name every form and category in ja and es

## Goal

Every species and form reads its name and category in Japanese and Spanish. Measured on `main` at `ed4c4557d` (2026-11-18): of 1258 English entries, 252 have no ja or es name and show their English one (Hisuian Decidueye, Oricorio's styles, Hisuian Zoroark, Noice Face Eiscue), and 258 (ja) and 362 (es) have no category, because PokeAPI has none for them (Sprigatito's is Pokémon Gato Planta). Without this the `next` milestone's acceptance (the whole game in ja or es) does not hold.

## Context

- Found while screenshotting `i18n-desc-moves-late`. Written on 2026-11-01 on a side branch and lost there; restored on 2026-11-18. Since then `boot-lazy-registries` changed how species text loads in the browser (English plus the page's locale; see its outcome), which this node does not need to touch. The generator (`scripts/i18n/official-names.ts`) fills `name` and `category` from PokeAPI's CSVs (cached under `node_modules/.cache/pokeapi/<commit>/`) and keeps hand-written fields (`keep-written.ts`), but it owns `name` and `category`: a value written by hand into those fields is dropped on the next run.
- `pokemon_form_names.csv` holds a form label per language (`Forma de Alola`, `アローラのすがた`, `はらぺこもよう`) and sometimes a full name; Spanish full names are mostly empty.
- Read the outcomes of `i18n-official-names` and `i18n-descriptions`, and the `species-forms` skill.

## Steps

- [x] Regional forms are named by rule: es `<name> de <Región>` (Zoroark de Hisui, Raichu de Alola, Tauros de Paldea; the maintainer's convention), ja `<name>（<region>のすがた）` (ゾロアーク（ヒスイのすがた）). Their category is the species' own unless PokeAPI or the English gives a different one.
- [x] Every other form takes PokeAPI's full name where there is one, or one built from its form label, and a hand-written name otherwise.
- [x] Gaps PokeAPI leaves (missing categories, forms it does not name) are filled from an overrides file under `scripts/i18n/overrides/` that the generator merges, with the official names. No value is written straight into a generated field.
- [x] A test fails if any species or form entry in English lacks a ja or es name or category.

## Acceptance

- [x] Under es, Sprigatito's dex entry reads Pokémon Gato Planta, and a Hisuian Zoroark reads Zoroark de Hisui; under ja, ゾロアーク（ヒスイのすがた）.
- [x] `pnpm official-names` reruns with no diff.
- [x] A fresh review agent checks the names and categories against the official games; findings fixed before the PR.
- [x] Changeset `patch`. Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test`.

## Sizing

M: one generator change and an overrides file of about 360 entries; the names need checking more than the code.
