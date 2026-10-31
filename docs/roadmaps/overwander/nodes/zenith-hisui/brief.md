---
id: zenith-hisui
title: Zeniths for Hisui and the Hisuian finals
status: done
priority: must
type: feature
outline: false
milestone: now
size: M
spike: false
verify: pnpm exec vitest run test/data/zeniths.test.ts
gate: true
owns:
  - src/data/species/zeniths/hisui.yaml
shared:
  - src/data/ids/species.ts
  - src/data/ids/items.ts
  - src/data/text/en/zeniths.yaml
  - src/data/text/en/items/zenith-shards.yaml
  - src/data/items/records/zenith-shards.yaml
  - scripts/art/item-icons.ts
  - test/data/zeniths.test.ts
  - docs/strategy/zeniths.md
provides: []
depends_on:
  - on: zenith-johto-galar
    kind: hard
    why: Stacked on zenith-galar: it appends to the same id enums, shard records and region list in the test
---

# Zeniths for Hisui and the Hisuian finals

## Goal

Batch 8 of the Zenith plan: a Zenith for each of the 6 eligible Hisui pokemon, then the Hisuian regional finals, proposed 4 at a time and approved by the user before any data is written.

## Context

- Source: ../../../../strategy/zeniths.md (The order, batch 8; What every batch does)

## Steps

- [ ] Propose each pokemon to the user: types, base stats, BST before and after, born abilities, role, and options that state spread, types and theme.
- [ ] Write the YAML, ids, text, shard records and tints, then regenerate the shard sheet (`pnpm item-icons`, `compact-sprites`, `sprite-stamps`) and `pnpm id-names`.
- [ ] Add `Regions.Hisui` to the finished set in the gap test.
- [ ] Release page under `docs/update/`, a minor changeset, and the strategy table.

## Acceptance

- [ ] Gap test lists no Hisui pokemon or Hisuian final without a Zenith.
- [ ] Fast check passes: `pnpm exec vitest run test/data test/battle/gimmicks/zeniths.test.ts`

## Sizing

Same pattern as the seven batches before it; small region.

## Notes for the worker

- Branch `zenith-hisui` on `zenith-galar`, PR linked into stack #231.
- No two Zeniths of one region wear the same ability, and no option copies a born ability.
- HP never moves; the total is exactly 100 above the base form.
