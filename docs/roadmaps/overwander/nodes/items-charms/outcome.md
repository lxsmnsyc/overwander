# Outcome: items-charms

## Built

- `setupExpCharm`, `setupOvalCharm`, `EXP_CHARM_BONUS` and `OVAL_CHARM_FACTOR` in `src/overworld/items/key-items.ts`.
- Records, en/es/ja names and descriptions, pool weights (8 each, special band) and the ids edit: `MarkCharm` removed, TODO over the charm ids replaced by a doc comment. Name files regenerated with `pnpm id-names`.
- `test/overworld/charms.test.ts`: the Exp Charm pays one candy of the caught family on every catch and nothing to the buddy's; the Oval Charm halves an egg's steps; with a Flame Body buddy they are halved once.

## Deviations

- Files touched beyond the owned list: `test/data/items.test.ts` (it lists the special band in order), `src/data/ids/names.ts` and `src/data/schema/names.json` (generated).
- The icons are the existing `key/exp-charm` and `key/oval-charm`; no reuse was needed.
- es and ja names were written by hand, not from `official-names`.

## Checks

- `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm exec oxfmt src test`.
- `pnpm exec vitest run test/overworld test/data`: 1062 passed.

## Left

- Nothing.
