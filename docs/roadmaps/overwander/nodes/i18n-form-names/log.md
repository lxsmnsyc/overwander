# Log: i18n-form-names

## Proof on batch/overwander (9b93612e7)

- Added the test "every species and form entry has a ja and es name and category" in `test/data/official-names.test.ts`.
- `pnpm exec vitest run test/data/official-names.test.ts -t 'every species'` on `batch/overwander` (9b93612e7, test file only added): fails. Missing: 252 ja names, 252 es names, 258 ja categories, 362 es categories. Matches the brief.

## Work

- Generator: `official-names.ts` now reads `scripts/i18n/overrides/species.yaml` (valibot-checked, keyed by the English entry's key, `ja`/`es` with `name` and `category`). Per family it fills gaps after PokeAPI: overrides win, then the regional rule, then base name plus PokeAPI's form label, and a missing category is the base species' (longest key that starts the form's key).
- The forms index now carries PokeAPI's `form_name` as a label; a form matched by its English `pokemon_name` but with no ja or es full name gets `<base>（<label>）` or `<base> (<label>)`.
- Sources for the overrides: the official Japanese zukan API (zukan.pokemon.co.jp/zukan-api/api/detail/<dex>[-<sub>]) for ja categories and form names; WikiDex wikitext (Spain wording, second argument of NombreHaEs) for es categories and form names. PokeAPI has no es genus for Gen 9 even at master.
- 21 forms whose English category differs from their base's (Hisuian and Galarian forms, Riders, Unbound Hoopa, White-Striped Basculin) have their own ja and es category in the overrides.
- Rerun of `pnpm official-names`: no diff (diff hash identical before and after).
- Result on branch: the new test passes. Missing before: 252 ja names, 252 es names, 258 ja categories, 362 es categories. After: 0.
- Gap fill counts, names: ja 252 = 48 override + 53 rule + 151 label; es 252 = 59 override + 53 rule + 140 label. Categories: ja 258 = 27 override + 231 from the base; es 362 = 129 override + 233 from the base (the override counts include the 21 forms).
