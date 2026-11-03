# Outcome: i18n-progress

## Built

- `src/data/text/{ja,es}/` files for `regions` (11), `title-forms` (4), `dex-chain` (3), `quest-rotations` (4), `quests` (46), `awards` (146), `achievements` (5 tiers, 14 lines with name and deed), `titles` (7), `dex-rungs` (4), `egg-groups` (15) and `item-types` (10): every key and `{param}` English has. No code changed: the readers from `i18n-people-places` pick them up.
- `docs/strategy/translations.md` deleted (the plan is finished); the links in `docs/strategy/translations-terms.md` and `docs/strategy/pixel-effects.md` fixed; a "Quests, awards, titles and name tables" section in the term list.
- `test/data/locale-people-places.test.ts`: every entry of the eleven files written, a stop where English has one, parameters kept, no kanji, official names pinned, distinct names, titles and dex chains read in the locale.
- Changeset `.changeset/i18n-progress.md`, `patch`.

## Names

Official (WikiDex): the 46 gym badges of Kanto to Kalos in both locales (ja is the badge's own name: `ピンクバッジ` for Soul, `ゴールドバッジ` for Marsh, `ショックバッジ` for Storm, `ライジングバッジ`; es Spain's `Medalla Roca`, `Medalla Dragón` for Rising), the region names (Unova is `イッシュ` and `Teselia`), the 15 egg groups (`かいじゅう` / `Monstruo`, `タマゴみはっけん` / `Desconocido`), the Battle Frontier symbols (`ブレイブシンボル`, `Símbolo de la Valentía de plata`), and the bag shelves for medicine, balls, berries, held items, machines and key items. Champion, Professor, Gym leader names reuse the term list.

Coined: every quest, chain and daily; the achievement lines, tiers' companions and deeds; the ladder titles; the dex rungs; the title forms; the print names (the games' Estampas for es). Full tables in the term list.

Renames from the first reading: es `Gran {name}` to `{name} de platino` (a prefix breaks on `Gemelas` and `Hinchas`), ja `リライブし` to `リライバー`, es `Bien aprovisionado` to `Provisiones de sobra`.

## Assembled samples

| Template | ja | es |
| --- | --- | --- |
| professor | カントーはかせ, イッシュはかせ | Prof. de Kanto, Prof. de Teselia |
| master | マスターコレクター, マスターエリートトレーナー | Coleccionista de platino, Entrenador guay de platino |
| type | ほのおタイプの たつじん, でんきタイプの マスター | Especialista de tipo Fuego, Maestría de tipo Eléctrico |
| dex chain | カントーずかん, カントーずかん かんせい | Pokédex de Kanto, Pokédex de Kanto completa |
| rotations | ちゅうもく: クリムガン, ヤンチャムハント | Destacado: Druddigon, La caza de Pancham |
| trainer region | エリートトレーナー（ホウエン） | Entrenador guay (Hoenn) |

## Not derived

- None: every key English has is written.

## Deviations

- Spanish titles are written to hold for any player: nouns that do not change with gender, `Prof.` for Profesor and `de platino` for Master. The brief names Profesor and Master as the games' words; the games' forms are gendered.

## Stubs left

- None. With this node the translation plan is closed.

## Gotchas

- Japanese text files must hold no kanji (a test holds it), comments included.
- A title's `master` form is built for every trainer class, so the es template must work after any class name, singular or plural, either gender.

## To confirm

- ja Silver / Gold Print names (`ぎんの タワープリント` and the rest) and es Gold as `Estampa de color` (WikiDex gives "de plata" and "de color" for the Sinnoh prints; the engine's Hall / Tower / Arcade prints are mapped by hand). The Battle Frontier symbol silver and gold: ja `ぎんの / きんの ...シンボル` and es `... de plata / de oro` come from WikiDex's captions.
- ja item kinds that the games do not name: `しんかの どうぐ` (Evolution), `きたえる どうぐ` (Training), `たからもの` (Valuables); es `Objetos evolutivos`, `Objetos de entrenamiento` (WikiDex prints `Tesoros` for Valuables and `Objetos equipables` is the term list's).
- ja `ふめい` and es `Desconocida` for the Unknown region.
- ja `ポータルわたり`, `さがしや`, `なこうど`, `リライバー`, `たんけんか`, `でんせつやぶり`, `してんのう せいふくしゃ` and es `Cazaalijos`, `Rematante`, `Purificante`, `Trotamundos`, `Rompeleyendas`, `Conquista del Alto Mando`: coined, reread for a second meaning, not checked by a native speaker.
- es `Coach` (no epicene noun reads naturally for the levels-gained line).
- ja badge names are from WikiDex's infoboxes; the Japanese wikis return 403, so none was cross-checked there.

## Verification

- See the caller's checks below; the node's own results are in the final report.

## Size

- Estimated M, actual M.
