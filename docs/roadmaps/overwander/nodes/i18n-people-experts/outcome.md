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

## Verified on WikiDex

Crasher Wake マキシマムかめん (infobox マキシマム仮面), Cintia and Dianta as the Spain forms, Vito y Leti, Máximo, A. Z., N, the es ranks Líder, Comandante and Ejecutivo, every Frontier Brain name and facility, and the Fen Badge (ja フェンバッジ, es Medalla Ciénaga). Battle Hall in ja is バトルステージ: the WikiDex infobox prints バトルファクトリー, a copy error, and the Korean and French names and a Japanese wiki call it the Stage.

## To confirm

- es Equipo Magma and Equipo Aqua versus Team Magma and Team Aqua in the Spain games: WikiDex only sources the anime's Team.
- es Equipo Galaxia: from a disambiguation page.
- ja かんぶ (Plasma and Flare executives) and かがくしゃ (Flare scientist).
- The ja title order without の (`{team} {title} {name}`).
- The character voices come from memory of the games.

## Verification

- `pnpm typecheck` exit 0; `rtk proxy pnpm exec oxlint src test` exit 0 (warnings only, none new from this node).
- `pnpm exec vitest run --maxWorkers=2 test/data test/i18n`: 40 files, 605 tests pass (after the review fixes).
- A fresh review's fixes are applied (log, "Review").
- No kanji in the new ja files (`test/data/official-names.test.ts` is in the run).
- The full suite, `pnpm official-names` and the fresh review are left for the caller. No screenshots (not asked for this node).

## Size

- Estimated L, actual L.
