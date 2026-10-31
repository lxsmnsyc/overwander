---
id: zenith-paldea
title: Zeniths for Paldea and the Paldean finals
status: done
priority: must
type: feature
outline: false
milestone: now
size: L
spike: false
verify: pnpm exec vitest run test/data/zeniths.test.ts
gate: true
owns:
  - src/data/species/zeniths/paldea.yaml
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
  - on: zenith-hisui
    kind: hard
    why: Stacked on zenith-hisui: same id enums, records and gap test
---

# Zeniths for Paldea and the Paldean finals

## Goal

Batch 9 of the Zenith plan: 59 Paldea Zeniths (Ogerpon with a shape per mask), then the Paldean Tauros breeds. Bramblin, Toedscool, Rellor and Flittle wait for their final stages.

## Context

- Source: ../../../../strategy/zeniths.md (The order, batch 9)

## Steps

- [x] Proposals 4 at a time, as in zenith-hisui.
- [x] Data, shards, tints, generated sheet, ids.
- [x] Add `Regions.Paldea` to the finished set; regional finals are now all covered.
- [x] Release page, minor changeset, strategy table. The plan is finished: delete `docs/strategy/zeniths.md` and move anything left waiting to the inbox.

## Acceptance

- [x] Gap test lists nothing missing for any region.
- [x] Fast check passes: `pnpm exec vitest run test/data test/battle/gimmicks/zeniths.test.ts`

## Sizing

Size medium (about 60 entries, many proposal rounds), uncertainty medium (Ogerpon masks).
