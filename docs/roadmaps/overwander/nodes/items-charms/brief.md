---
id: items-charms
title: Exp and Oval Charms
status: todo
priority: should
type: feature
outline: false
milestone: next
size: S
spike: false
gate: false
owns:
  - src/overworld/items/key-items.ts
  - src/data/items/records/key-items.yaml
  - src/data/text/en/items/key-items.yaml
  - src/data/text/es/items/key-items.yaml
  - src/data/text/ja/items/key-items.yaml
  - src/data/overworld/item-pool.yaml
  - src/data/ids/items.ts
  - test/overworld/charms.test.ts
shared: []
provides: []
depends_on: []
---

# Exp and Oval Charms

## Goal

The Exp and Oval Charms as key items the buddy holds, on the pattern of the Shiny and Catching Charms (`src/overworld/items/key-items.ts`). The Mark Charm is dropped.

## Decisions (2026-11-17)

The mainline effects have nothing to act on here: there is no experience (a level costs candy), no Day Care (eggs come from nests), and no wild marks. Each charm takes the hook this game already has for the same idea.

- **Exp Charm:** every catch pays one extra candy of the caught pokemon's family. This answers `CheckCatchCandy`, which the Exp. Share and Lucky Egg already answer at half the catches (`src/overworld/items/candy-items.ts`). The charm pays every catch, because it is a rare key item and a catch holds one item at a time, so carrying it means giving up the other two. The species day does not multiply it, the same as those two.
- **Oval Charm:** an egg picked up while the buddy holds it needs half the steps. This answers `CheckEggSteps` with `FLAME_BODY_FACTOR` (`src/overworld/abilities/gen-1.ts`), and does not stack with a Flame Body buddy: the step count takes the smaller of the two, never both (the Explorer Kit rule). It lets any buddy warm an egg, not only a Flame Body one.
- **Mark Charm:** dropped. Remove `MarkCharm` from `src/data/ids/items.ts`. It was never registered or put in a pool, so no player holds it. Regenerate the generated name files after merging rather than editing them by hand.

## Steps

- [ ] `setupExpCharm` and `setupOvalCharm` in `key-items.ts`, each with its number as an exported constant and a comment on why.
- [ ] Records in `key-items.yaml` (`KeyItem`, `Holdable`, an icon in the existing `key/` set; reuse the nearest one if no art exists and say so in the outcome).
- [ ] Names and one-line descriptions in en, es and ja, each ending in a full stop and saying "while your buddy carries it" the way the other charms do.
- [ ] Pool weights in `item-pool.yaml` beside the Shiny (10) and Catching (12) Charms.
- [ ] Drop `MarkCharm` and the TODO comment above the charm ids.

## Acceptance

- [ ] Tests: the Exp Charm pays one candy of the caught family on every catch and nothing to the buddy's; the Oval Charm halves an egg's steps; an Oval Charm on a Flame Body buddy halves them once, not twice.
- [ ] Checks: `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm exec vitest run test/overworld test/data/items.test.ts`. A `minor` changeset (two new items).
