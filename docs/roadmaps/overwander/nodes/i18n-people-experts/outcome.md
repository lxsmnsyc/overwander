# Outcome: i18n-people-experts

## Built

- `src/data/text/{ja,es}/` files for `gym-leaders` (54), `elite` (24), `champions` (6), `frontier` (13), `frontier-rooms` (5 curtains, 7 panels), `legends` (5), `executives` (18), `syndicates` (6) and `syndicate-titles` (`grunt`, `person`): every key English has, name and quote or greeting.
- `test/data/locale-people-places.test.ts`: four checks (all fields written in ja and es, curtains, panels and phrases written, every quote closes a sentence, phrase parameters match English).
- `docs/strategy/translations-terms.md`: the people table and the team and facility table.
- Changeset `.changeset/i18n-people-experts.md`, `patch`.
- No code changed: the readers of `i18n-people-places` take the files as they are.

## Names

Every person, team and facility keeps the name its locale's games give it, read on WikiDex (the infobox prints the Japanese name). The full table is in the term list. Spain forms are used where WikiDex shows both (Valeria, Corelia, Amaro, Lysson, Xero, Melia). No name was coined and none renamed.

Teams: ja ロケットだん, マグマだん, アクアだん, ギンガだん, プラズマだん, フレアだん; es Team Rocket, Equipo Magma, Equipo Aqua, Equipo Galaxia, Equipo Plasma, Team Flare.

Written by this engine (not the games): the Pike curtain and Arcade panel phrases, the syndicate phrase templates, the Flare "Scientist" title in both locales, and the Spanish rank slash forms Ejecutivo/a and Científico/a (one title per team cannot follow the person's gender).

## Stubs left

- None.

## To confirm

- ja Battle Hall バトルホール: from memory. The WikiDex page of Sala Batalla prints バトルファクトリー, which looks wrong.
- ja Crasher Wake マキシマムかめん: the kana of the infobox's マキシマム仮面; the name under the mask is マキシ.
- es Equipo Magma and Equipo Aqua versus Team Magma and Team Aqua in Spain: WikiDex gives Equipo for the games and Team for the anime.
- es Cintia and Dianta as the Spain forms (the page headers read "Cynthia/Cintia" and "Diantha/Dianta").
- Tate is Vito and Liza is Leti (WikiDex gives "Vito y Leti" for the pair).
- Ranks: ja かんぶ for Plasma and Flare executives, けんじん (Plasma sage) and かがくしゃ (Flare scientist); es Líder for most bosses (WikiDex), Jefe for Flare, Sabio for Plasma, Comandante and Ejecutivo/a.
- ja N and AZ stay in Latin letters (the games write them so); es N and A. Z. (WikiDex).
- ja badge names and the Fen Badge: the Wake quote says "the badge" instead.
- es Máximo for Steven: WikiDex gives Máximo Peñas in Spain; the short first name was used.
- The English quotes' voices were matched from memory of the games; the review should check the longest ja quotes for natural phrase breaks.

## Verification

- `pnpm typecheck` exit 0; `rtk proxy pnpm exec oxlint src test` exit 0 (warnings only, none new from this node).
- `pnpm exec vitest run --maxWorkers=2 test/data test/i18n`: 40 files, 605 tests pass.
- No kanji in the new ja files (`test/data/official-names.test.ts` is in the run).
- The full suite, `pnpm official-names` and the fresh review are left for the caller. No screenshots (not asked for this node).

## Size

- Estimated L, actual L.
