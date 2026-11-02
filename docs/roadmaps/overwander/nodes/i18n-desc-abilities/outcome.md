# Outcome: i18n-desc-abilities

## Built

- Japanese and Spanish `description` for all 318 abilities in `src/data/text/en/abilities/gen-1` to `gen-9`, `legends-za` and `special`, in `src/data/text/{ja,es}/abilities/`, beside the generated `name`.
- New files: `special.yaml` in ja and es (descriptions only, the seven special abilities have no official names). `legends-za.yaml` gains description-only entries for Aura Guard, Eelevate and Fire Mane.
- `test/data/locale-descriptions.test.ts`: a new abilities entry reads every ability from the English text (the `signature/` folder left out) with `minimum` 300. The English reader is now `listFiled(folder, skip)`, shared with the moves.
- Terms in `docs/strategy/translations-terms.md` (Ability descriptions): the buddy lead-in, power versus damage for a boost and a cut, catch chance, the level band, treats, steps, form names, Full Belly and Hangry, the primal weathers (Teraform Zero), Shadow pokemon, Boss, Totem, Alpha and Noble.
- Changeset `.changeset/i18n-desc-abilities.md`, `patch`.

## Deviations

- None outside the owned paths, except the terms file (shared), the English Gluttony and Aroma Veil lines (below), `test/data/locale-descriptions.test.ts` and `test/overworld/world/buddy-copy.test.ts` (pins Gluttony's figure).

## English changed

- Gluttony: "As a buddy, the cap on what treats add to a throw is 1.5x as high." The old line (treats lift a throw 1.5x as far) read as if each treat were worth more; the engine raises the ceiling on the total.
- Aroma Veil: "cannot be taunted, tormented, encored, infatuated or heal blocked." It said "charmed", which both translations read as the move Charm; the engine blocks infatuation (メロメロ / Atracción).

## Stubs left

- Forms have no registry text, so a form is named as the games name it: ダルマモード / Modo Daruma, パーフェクトフォルム / Forma Completa, マイティフォルム / Forma Heroica, テラスタルフォルム / Forma Teracristal, まんぷくもよう / Forma Saciada, はらぺこもよう / Forma Voraz. Ash-Greninja is サトシゲッコウガ / Greninja Ash, and Minior's two forms read as its meteorite (からに こもって) and its core (コアの すがた, núcleo).
- Orichalcum Pulse says the sun grows strong (ひざしを つよくして, intensifica la luz solar), while Desolate Land and Primordial Sea use the primal weather words.
- The seven special abilities (Boss, Shadow, Totem, Totem Ally, Alpha, Noble, Purified) and Aura Guard, Eelevate and Fire Mane have no ja or es name; the interface shows the English one until a name batch writes them.
- Spanish stats that end in `Esp.` never end a line (a doubled stop); the lines end on a following word.

## Gotchas

- A line that names a stat last gets reordered in Spanish (Competitive: Sube 2 niveles el Ataque Esp. cuando un rival le baja una estadística).
- `Psychic Terrain` is the move サイコフィールド, not the move サイコキネシス; the merge script skips "Psychic" before "Terrain".
- Spanish writes a stat boost as x1,5 de potencia and an incoming cut as la mitad de daño, as the move lines do.

## Verification

- `pnpm typecheck` exit 0, `rtk proxy pnpm exec oxlint src test` exit 0.
- `pnpm exec vitest run test/data test/i18n`: 37 files, 573 tests pass.
- `pnpm official-names` rerun: no diff afterwards (318 descriptions per locale kept).
- `pnpm test`: 278 files, 5777 tests; `tera-sites.test.ts` timed out under load and passes alone (6 of 6).
- A fresh review read all 318 lines per locale; its findings are applied.
- Screenshots in ja and es at 1280x720 of the catch sheet and the dex entry ability tooltips: no clipping.

## Size

- Estimated L, actual L.
