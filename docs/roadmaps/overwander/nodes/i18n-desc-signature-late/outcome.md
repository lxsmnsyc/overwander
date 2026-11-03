# Outcome: i18n-desc-signature-late

## Built

- Japanese and Spanish `name` and `description` for all 287 signature abilities filed under Unova (86), Kalos (37), Alola (55), Galar (44), Hisui (1) and Paldea (64), in `src/data/text/{ja,es}/abilities/signature/{unova,kalos,alola,galar,hisui,paldea}.yaml`.
- `test/data/locale-descriptions.test.ts`: `SIGNATURE_REGIONS` now lists all ten regions, so every signature ability needs a ja and an es name and description.
- Terms: `docs/strategy/translations-terms.md` gains the shared themes of the late regions and a table of every coined name per region (Unova to Paldea).
- Changeset `.changeset/i18n-desc-signature-late.md`, `patch`.

## Deviations

- Outside the owned paths: the terms file (shared) and `test/data/locale-descriptions.test.ts`, as the early part planned.
- The files carry the generator's two-line header, so `pnpm official-names` leaves no diff.

## English changed

- None.

## Stubs left

- None. Every signature ability of the ten regions reads in ja and es.

## Gotchas

- The collision check must fold katakana onto hiragana: らくらい collided with ラクライ and キバ with きば.
- A kana name is checked against the species list too, not only abilities and moves.
- Zenith and Nadir cannot be Cénit and Nadir in Spanish: Cenit- is the template of every Zenith form and Nadir is the English word, which the test rejects.
- A Spanish name that is the English word (Kata, Torque, Regalia, Nadir) fails the "differs from English" check; pick another word.

## Verification

- `pnpm typecheck` exit 0, `rtk proxy pnpm exec oxlint src test` exit 0, `pnpm exec oxfmt` on the changed TypeScript and markdown clean.
- `pnpm exec vitest run --maxWorkers=2 test/data test/i18n test/overworld/world/buddy-copy.test.ts`: 38 files, 580 tests pass.
- `pnpm official-names` rerun: no diff.
- The full `pnpm test` suite, the fresh review agent and the screenshots at 1280x720 in ja and es are left for the caller.

## Size

- Estimated L, actual L.
