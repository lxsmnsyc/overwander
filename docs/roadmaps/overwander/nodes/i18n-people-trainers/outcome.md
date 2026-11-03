# Outcome: i18n-people-trainers

## Built

- `src/data/text/{ja,es}/trainers/{kanto,johto,hoenn,sinnoh,kalos,unova}.yaml`: a name and a quote for all 207 classes (22, 22, 32, 42, 41, 48), the keys English has.
- `src/data/text/{ja,es}/trainer-sheets.yaml` (18 sheet names) and `trainer-names.yaml` (`region`: `{name}（{region}）` in ja, `{name} ({region})` in es).
- `test/data/locale-people-places.test.ts`: three checks (every class and sheet written in ja and es, every quote closes a sentence, one name per shared English name in each locale).
- `docs/strategy/translations-terms.md`: a "Trainer classes" table.
- Changeset `.changeset/i18n-people-trainers.md`, `patch`.
- No code changed: the readers of `i18n-people-places` take the files as they are.

## Class names

Most are the games' own (see the table in the term list, with its notes). Classes shared by several regions read as one name in each locale, so the region mark still appears. Where the games changed a name between generations, the name of the most regions was used (es Bella, Caballero, Escolar, Operario; reasons in the log).

Coined: es Suit Actor Actor de disfraz and ja Suit Actor スーツアクター (not an official class). Street Thug in es is Macarra (the Kalos official name). Sheet-only: ja Crush Girl バトルガール (WikiDex), es Crush Girl Chica fuerte.

The review corrected 25 ja class names to the WikiDex infobox names (see the log), so most of the earlier memory-only names are now official.

No coined name was renamed after the second-reading pass.

## Stubs left

- The region mark reads the English region name (Kanto, Johto...) inside the ja and es suffix until `i18n-places` writes `regions.yaml`.
- The es Channeler NPC is now Exorcista like the class (changed in the review, with the four es messages that said la Médium).

## To confirm

Verified on WikiDex (the Japanese name in each class's infobox): Tamer もうじゅうつかい, Poké Maniac かいじゅうマニア, Rocker でんきグループ, Engineer でんきやのオヤジ, Sage ぼうず, Firebreather ヒフキやろう, Medium イタコ, Kindler キャンプファイヤー, Rancher ぼくじょうおじさん, Poké Kid ポケモンごっこ, Janitor せいそういん, Furisode Girl ふりそで, Rising Star ホープトレーナー, Linebacker フットボーラー, Smasher テニスプレイヤー, Preschooler えんじ, Depot Agent てつどういん, Harlequin クラウン, Backers ファンクラブ, Roller Skater ローラースケート, Punk Guy バッドガイ, Punk Girl バッドガール, Gardener にわし, Fairy Tale Girl メルヘンしょうじょ, Street Thug こわいおじさん (female form こわいおねえさん, no entry in the data), Waiter ウエーター, Waitress ウエートレス, Crush Girl sheet バトルガール.

Still memory-only (the review could not fetch them): Juggler ジャグラー, Hoopster バスケせんしゅ, Infielder やきゅうせんしゅ, Nursery Aide ほいくし, Butler しつじ, Tourist かんこうきゃく, Suit Actor スーツアクター (coined), and the rest of the Japanese names not listed above, which are the games' names I am sure of. Spanish names are from WikiDex except Suit Actor (coined). Also unverified: the place and character names in the quotes (listed in the log); Ciudad Yantra for Shalour was corrected in the review.

## Verification

- `pnpm typecheck` exit 0; `rtk proxy pnpm exec oxlint src test` exit 0 (warnings only).
- `pnpm exec vitest run --maxWorkers=2 test/data test/i18n test/overworld`: 86 files, 1066 tests; 1065 pass, and `tera-sites.test.ts` timed out at 20 s under load and passes alone (6 tests, 19 s).
- Collision check: no coined name equals an official ability, move, item or species name of its locale; the official Burglar name どろぼう / Ladrón equals the move Thief.

## Screens to screenshot (ja and es, 1280x720)

- The duel prompt of a trainer on the road: name, class and quote. Watch the longest names and quotes: ja エリートトレーナー (Ace Trainer), ja ポケモンブリーダー, es Jovencita con kimono (Furisode Girl), es Entrenador promesa, es Mayordomo leal, es Señorita aroma, and the longest ja quotes (Hoenn Reporter, Kalos Rich Boy, Sinnoh Scientist).
- A class shared by several regions (Ace Trainer, Lass, Gentleman), to see the region suffix: `エリートトレーナー（Hoenn）` and `Entrenador guay (Hoenn)` until the regions are translated.
- The trainer sheet name where a sheet names itself apart from its class (Crush Girl, Picnicker, Cowgirl, Lady, Waitress, Idol, Socialite, Battle Girl, Cameraman, Monsieur, Madame, Schoolboy, Schoolgirl), where those sheets show.

## Size

- Estimated L, actual L.
