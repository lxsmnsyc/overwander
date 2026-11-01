# Outcome: i18n-desc-moves-early

## Built

- Japanese and Spanish `description` for all 464 moves filed under `src/data/text/en/moves/gen-1` to `gen-4`, in `src/data/text/{ja,es}/moves/gen-N/`, beside the generated `name`. No file was created; `Attack` has a description-only entry.
- `test/data/locale-descriptions.test.ts`: `REGISTRIES` gains "moves (generations 1 to 4)", which reads the move names from the English gen-1 to gen-4 files. Each entry has a `minimum` size. The later move node widens the list to every move.
- Terms in `docs/strategy/translations-terms.md` (Move descriptions): user and target, everything opposite, teammates and sides, stage changes, status chances, recoil, drain, binds, wind-up, recharge, weather words, hazards and the rest.

## Deviations

- None outside the owned paths, except the terms file (shared) and `test/data/locale-descriptions.test.ts`.

## Stubs left

- The weather words (sun, rain, sandstorm, hail, snow, fog) are provisional until the weather batch.
- `NaturalGift` ("typed as whatever the berry resists") translates a wording that is hard to read in English; check it against the engine.
- Items named in a line that the games name differently by language (Plate: プレート, Tabla) follow the official item names.

## Gotchas

- A Spanish stat name ending in `Esp.` doubles the full stop at a sentence end; the lines end on "del usuario" or "del objetivo" instead, and the merge script rejects `Esp..`.
- A line that names a move names it with its official ja or es move name, not the English key (Rizo Defensa, まるくなる).

## Review fixes

- English reworded for Dig, Fly, Twister, Trump Card and Swallow so the 2x covers the right moves, Trump Card names itself and Swallow heals; carried into ja and es.
- ja: タイプあいしょう (Roost), Magnitude power, のうりょくランク everywhere. es: Transform, Defog, Evasión, problema de estado, tiempo, swap-in hazards, Trick Room, multipliers in prose (el doble, N veces), Attack, Hidden Power (valores individuales). Terms recorded.
- After the fixes: `pnpm typecheck` exit 0, `rtk proxy pnpm exec oxlint src test` exit 0, `pnpm exec vitest run test/data test/i18n`: 37 files, 571 tests pass, `pnpm official-names` leaves no diff.

## Verification

- `pnpm typecheck` exit 0, `rtk proxy pnpm exec oxlint src test` exit 0 (warnings only).
- `pnpm exec vitest run test/data test/i18n`: 37 files, 571 tests pass.
- `pnpm test`: 278 files, 5775 tests; 5774 pass. `tera-sites` timed out under load and passes alone (6 of 6).
- `pnpm official-names` rerun: no diff afterwards.

## Size

- Estimated L, actual L.
