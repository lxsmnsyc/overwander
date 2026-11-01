# Outcome: i18n-desc-moves-late

## Built

- Japanese and Spanish `description` for all 477 moves filed under `src/data/text/en/moves/gen-5` to `gen-9` and `weather.yaml`, in `src/data/text/{ja,es}/moves/`, beside the generated `name`.
- New files: `gen-8/frenzy-moves.yaml` and `gen-8/g-max-moves.yaml` in ja and es (descriptions only; those moves have no official names to generate).
- `test/data/locale-descriptions.test.ts`: the moves entry now covers every move (all generations and weather), read from the English move text, with `minimum` 900.
- Terms in `docs/strategy/translations-terms.md` (Move descriptions): grounded, screens, guard, Z-Moves, Dynamax and Gigantamax, frenzy bursts, Hangry, Urshifu's styles, Pledge field effects, hits at N power, coins, critical ratio.

## Deviations

- None outside the owned paths, except the terms file (shared), the English move text (two fixes below) and `test/data/locale-descriptions.test.ts`.

## English changed

- Misty Explosion: "Hits everything opposite and the user's teammates, and costs the user 100 HP. 1.5x on Misty Terrain." (the engine charges the user the move's power, like Explosion).
- Electric and Ice Z-Move lines: "An Electric", "An Ice".

## Stubs left

- Hangry is ハラペコもよう / Forma Voraz until a registry text names Morpeko's forms.
- "Gigantamax Alcremie" and the other G-Max lines name species without a form; the Hisuian and Alolan forms read "ヒスイの ウインディ", "Arcanine de Hisui", as the forms have no ja or es name of their own.
- Spanish for the frenzy burst ("estallido") and the Pledge swamp ("pantano") are unreviewed wordings.

## Gotchas

- The Z-Move crystals are named by their item (ノーマルＺ, Normastal Z), with full-width Ｚ in ja.
- `Psychic Terrain` is the move name サイコフィールド in ja; the terrain in other lines uses the same word.
- zsh `grep` here is ugrep: `--include` fails on an unmatched glob.

## Verification

- `pnpm typecheck` exit 0, `rtk proxy pnpm exec oxlint src test` exit 0.
- `pnpm exec vitest run test/data test/i18n`: 37 files, 571 tests pass.
- `pnpm test`: see the final report.
- `pnpm official-names` rerun: no diff afterwards.

## Size

- Estimated L, actual L.
