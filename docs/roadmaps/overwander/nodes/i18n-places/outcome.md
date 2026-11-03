# Outcome: i18n-places

## Built

- `src/data/text/{ja,es}/` files for `biomes` (30), `weather` (26 skies, name and line), `times-of-day` (4), `landmarks` (25), `lairs` (97), `phenomena` (4), `spawn-rarities` (8), `lair-titles` (`ground`, `shadow`) and `town-names` (23 biomes x 8 heads, 40 tails, 12 titles, 12 marks, 64 counties): every key English has.
- `TOWN_JOINERS.ja` and `.es` rewritten in `src/data/overworld/town-names.ts` with a Spanish mark that agrees with its title. English joiner and every English name unchanged.
- `test/data/locale-people-places.test.ts`: every entry written, sky lines end in a stop, lair-title parameters, no kanji in ja names, distinct names, lower-case es rarities, six pinned ja and es town names, distinct town words, the new joiners.
- `docs/strategy/translations-terms.md`: the "Places, weather and towns" section.
- Changeset `.changeset/i18n-places.md`, `patch`.

## Names

Official terms (WikiDex): Centro Pokémon and ポケモンセンター, Incursión Dinamax and マックスレイド, teraincursión and テラレイド, Teracristal, the Spanish skies (Despejado, Nublado, Lluvia, Diluvio, Tormenta de arena, Granizo, Niebla, Nieve, Ventisca, Ceniza volcánica, Lluvia de meteoros), the lair names the log marks as read. Everything else is coined or from the term list; the full tables are in the term list.

Renames: ja Thunderstorm `かみなり` to `らいう` (Thunder move), ja Meteor Shower `りゅうせいぐん` to `ながれぼしの あめ` (Draco Meteor move), ja Frost head `しもばしら` to `はつしも` (read as `かみしも` after a mark), ja Mire head `どろぬま` to `どろうみ` (repeated ぬま before the tail ぬま).

Spawn rarities: ja nouns read before の, es lower-case masculine singular read after "que sea".

## Town joiners

- ja: `{county}ぐんの {mark}{head}{tail}{title}`; タウン and シティ weld on, any other title follows a space. The county is a kana word plus ぐん, set off by の like an address (`カシこうやぐんの かいがらやまタウン`).
- es: `{title} {mark} {head} {tail}, {county}`, the tail a phrase of its own and the mark agreeing with the title (`Ciudad Nueva Concha del Risco, Marca Ceniza`).

### Samples (44 towns, with and without marks)

| English | ja | es |
| --- | --- | --- |
| Surfcroft City, Gildenmarch | こがねざかいぐんの なみはたけシティ | Ciudad Rompiente de la Huerta, Marca Dorada |
| Tangleshade Rest, Harrowfen | くわぬまぐんの もつれかげ いこい | Descanso Maraña de la Sombra, Rastrojal |
| Miretarn Town, Saltenfen | しおぬまぐんの どろうみぬまタウン | Pueblo Fangal de la Charca, Salobral |
| Wildfiregate Mills, Oakenwold | カシこうやぐんの のびもん こなひき | Molinos Incendio de la Puerta, Quejigal |
| Dustshaw Landing, Amberfold | こはくかこいぐんの ちりこだち わたしば | Embarcadero Polvo de la Fronda, Redil Ámbar |
| Haymouth City, Calderfold | かまかこいぐんの ほしくさぐちシティ | Ciudad Heno de la Boca, Caldera |
| Birchmoor City, Glenmarch | たにざかいぐんの シラカバのはらシティ | Ciudad Abedul de la Landa, Marca del Cauce |
| Needlemere Rest, Heathenfen | ヒースぬまぐんの はりみずうみ いこい | Descanso Aguja de la Laguna, Páramo Pagano |
| Upper Frostfell Town, Amberfold | こはくかこいぐんの かみはつしもやまタウン | Pueblo Alto Helada del Risco, Redil Ámbar |
| Granitegorge Village, Brimshire | なみなみぐんの かこうがんはざま むら | Aldea Granito del Barranco, Colmado |
| Hoarcairn Quarter, Windermarch | ひろざかいぐんの はくそうつか がい | Barrio Escarcha del Mojón, Marca del Viento |
| Sweepwatch Rest, Grimmarch | ぶきみざかいぐんの ひとなぎみはり いこい | Descanso Barrido de la Atalaya, Marca Lúgubre |
| Magmafell Town, Harrowfen | くわぬまぐんの マグマやまタウン | Pueblo Magma del Risco, Rastrojal |
| Bonethorpe Hamlet, Harrowfen | くわぬまぐんの ほねはた さと | Caserío Hueso de la Alquería, Rastrojal |
| Beaconburn Waypoint, Oakenwold | カシこうやぐんの とうだいわきみず しゅくば | Parada Faro del Manantial, Quejigal |
| Fenwick Landing, Junipermoor | ネズはらぐんの ていたんちうら わたしば | Embarcadero Aguazal de la Ensenada, Enebral |
| Surfbrook Outpost, Calderfold | かまかこいぐんの なみせせらぎ とりで | Puesto Rompiente del Arroyo, Caldera |
| Tanglebarrow Mills, Saltenfen | しおぬまぐんの もつれづか こなひき | Molinos Maraña del Túmulo, Salobral |
| Great Sedgebarrow Town, Saltenfen | しおぬまぐんの おおスゲづかタウン | Pueblo Gran Juncia del Túmulo, Salobral |
| Wildfirewick Village, Amberfold | こはくかこいぐんの のびうら むら | Aldea Incendio de la Ensenada, Redil Ámbar |
| Dustcroft Outpost, Brimshire | なみなみぐんの ちりはたけ とりで | Puesto Polvo de la Huerta, Colmado |
| Haybury Town, Windermarch | ひろざかいぐんの ほしくさしろタウン | Pueblo Heno del Castillo, Marca del Viento |
| Birchcrest Town, Grimmarch | ぶきみざかいぐんの シラカバいただきタウン | Pueblo Abedul de la Cresta, Marca Lúgubre |
| Needlemarch Hamlet, Hollowshire | うつろぐんの はりさかい さと | Caserío Aguja de la Frontera, Oquedal |
| Cottonrise Landing, Harrowfen | くわぬまぐんの ワタスゲさか わたしば | Embarcadero Algodón de la Cuesta, Rastrojal |
| Granitewold City, Oakenwold | カシこうやぐんの かこうがんこうやシティ | Ciudad Granito de la Meseta, Quejigal |
| Hoarscar Rest, Junipermoor | ネズはらぐんの はくそうがけ いこい | Descanso Escarcha del Peñón, Enebral |
| Sweephaven Mills, Ravenmoor | カラスはらぐんの ひとなぎみなと こなひき | Molinos Barrido del Refugio, Páramo del Cuervo |
| Magmarise Waypoint, Harrowfen | くわぬまぐんの マグマさか しゅくば | Parada Magma de la Cuesta, Rastrojal |
| Bonebourne Village, Saltenfen | しおぬまぐんの ほねいずみ むら | Aldea Hueso de la Fuente, Salobral |
| Beacondale Quarter, Ivywold | ツタこうやぐんの とうだいたに がい | Barrio Faro del Valle, Hiedral |
| Fenridge Rest, Brimshire | なみなみぐんの ていたんちおね いこい | Descanso Aguazal de la Loma, Colmado |
| Old Foamdale Waypoint, Calderfold | かまかこいぐんの ふるあわたに しゅくば | Parada Vieja Espuma del Valle, Caldera |
| Tanglewick Hamlet, Glenmarch | たにざかいぐんの もつれうら さと | Caserío Maraña de la Ensenada, Marca del Cauce |
| Mireford Landing, Hollowshire | うつろぐんの どろうみあさせ わたしば | Embarcadero Fangal del Vado, Oquedal |
| Wildfiremoor City, Brimshire | なみなみぐんの のびのはらシティ | Ciudad Incendio de la Landa, Colmado |
| Dustwatch Borough, Oakenwold | カシこうやぐんの ちりみはり ちく | Municipio Polvo de la Atalaya, Quejigal |
| South Meadowtarn Village, Windermarch | ひろざかいぐんの みなみまきばぬま むら | Aldea Sur Prado de la Charca, Marca del Viento |
| Birchbrook Crossing, Gildenmarch | こがねざかいぐんの シラカバせせらぎ つじ | Cruce Abedul del Arroyo, Marca Dorada |
| Needlehollow Village, Harrowfen | くわぬまぐんの はりくぼ むら | Aldea Aguja de la Vaguada, Rastrojal |
| Cottonrun Outpost, Saltenfen | しおぬまぐんの ワタスゲひろば とりで | Puesto Algodón del Regato, Salobral |
| Granitespire Town, Ivywold | ツタこうやぐんの かこうがんとうタウン | Pueblo Granito de la Aguja, Hiedral |
| Hoarbarrow Hamlet, Ravenmoor | カラスはらぐんの はくそうづか さと | Caserío Escarcha del Túmulo, Páramo del Cuervo |
| Sweepmarch Crossing, Calderfold | かまかこいぐんの ひとなぎさかい つじ | Cruce Barrido de la Frontera, Caldera |

## Stubs left

- None.

## To confirm

- Lair names written from memory or translated literally, not read anywhere: ja はるかなしま (Faraway Island), だいちのどうくつ (Terra Cave), うみのしんでん (Sea Temple), the three Sinnoh ruins いわやまのいせき, ひょうざんのいせき, てつのいせき, ゆきなだれのさか, わかれみちのいせき, ふるいはかば, オコヤのもり, まどろみのもり, エネルギープラント, あくのとう and みずのとう, フォリナ, the Conquest-style places (ダイヤモンドのりょういき, ダハラのいせき, ネーベルこうげん, アゾトおうこく, テンセイざん, フラのもり), the Kitakami and Paldea places (あかいしつげん, the four ほこら, らくえんのあれち, ものおもいのはら, おにやま, おそろしいほらあな, エリアゼロさいしんぶ, ちゅうぎのひろば, とわのもり) and ゼロラボ.
- es lairs from memory or literal: Isla Lejana, Cueva Terrestre, Isla Luna Llena, Isla Luna Nueva, Templo Marino, Sala Origen, Ruinas Pico Roca, Ruinas Iceberg, Cámara Guía, Cámara Prueba, Campo Reflexión, Páramo de Icirrus, Torre Dragospiral, Cueva Gigante, Jardín Libertad, Ruinas Abisales, the Ultra Space names (Ultramar profundo, Ultraselva, Ultradesierto, Ultraplanta, Ultracráter, Ultrabosque, Ultrarruinas), the Galar, Crown Tundra, Kitakami and Paldea places.
- ja sky names (はれ, くもり, あめ, おおあめ, ゆき, ふぶき, かざんばい) are the games' words from memory.
- ja テラレイドの けっしょう for the Tera Crystal landmark (coined), and es "As de la Frontera" for Frontier Brain.
- es rarities in lower case make the dex badge read "Mañana · raro".
- Forina is left as フォリナ and Forina.
- Cañada, Vaguada, Quejigal and the other Spanish county words are plain Spanish place nouns, not checked for an existing real municipality.

## Verification

- `pnpm typecheck` exit 0; `rtk proxy pnpm exec oxlint src test` exit 0 (one `no-unnecessary-condition` error in the first draft of `agreeSpanish`, fixed).
- `pnpm exec vitest run --maxWorkers=2 test/data test/i18n test/overworld`: 86 files, 1079 tests pass.
- Files changed are formatted with `oxfmt`. `src/data/text/es/trainers/kalos.yaml` fails `oxfmt --check` on main already and was left alone.
- No screenshots (not asked for this node). A fresh review is left for the caller.

## Size

- Estimated L, actual L.
