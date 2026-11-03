# Outcome: i18n-places

## Built

- `src/data/text/{ja,es}/` files for `biomes` (30), `weather` (26 skies, name and line), `times-of-day` (4), `landmarks` (25), `lairs` (97), `phenomena` (4), `spawn-rarities` (8), `lair-titles` (`ground`, `shadow`) and `town-names` (23 biomes x 8 heads, 40 tails, 12 titles, 12 marks, 64 counties): every key English has.
- `TOWN_JOINERS.ja` and `.es` rewritten in `src/data/overworld/town-names.ts` with a Spanish mark that agrees with its title. English joiner and every English name unchanged.
- `test/data/locale-people-places.test.ts`: every entry written, sky lines end in a stop, lair-title parameters, no kanji in ja names, distinct names, lower-case es rarities, six pinned ja and es town names, katakana-only ja town words, distinct town words, the new joiners.
- `docs/strategy/translations-terms.md`: the "Places, weather and towns" section.
- Changeset `.changeset/i18n-places.md`, `patch`.

## Names

Official terms (WikiDex): Centro Pokémon and ポケモンセンター, Incursión Dinamax and マックスレイド, teraincursión and テラレイド, Teracristal, the Spanish skies (Despejado, Nublado, Lluvia, Diluvio, Tormenta de arena, Granizo, Niebla, Nieve, Ventisca, Ceniza volcánica, Lluvia de meteoros), the lair names the log marks as read. Everything else is coined or from the term list; the full tables are in the term list.

Town decisions (second pass, at the maintainer's call): ja towns are katakana with the county in brackets; es head words that read as bare nouns became place-style adjectives (Incendio to Ardiente, Rompiente to Bravío, Espejismo to Espejeante, Vendaval to Ventoso and so on, about 70 of 184).

Renames: ja Thunderstorm `かみなり` to `らいう` (Thunder move), ja Meteor Shower `りゅうせいぐん` to `ながれぼしの あめ` (Draco Meteor move), ja Frost head `しもばしら` to `はつしも` (read as `かみしも` after a mark), ja Mire head `どろぬま` to `どろうみ` (repeated ぬま before the tail ぬま).

Spawn rarities: ja nouns read before の, es lower-case masculine singular read after "que sea".

## Town joiners

- ja: `{mark}{head}{tail}{title}（{county}）`, like the games' towns: one katakana word, the title welded on (タウン, シティ and the rest, all katakana, native words kept as katakana: ムラ, サト, チク, トリデ, ワタシバ, ジュウジロ, コナヒキ, イコイ, ガイ, シュクバ), and the county after it in full-width brackets. Marks are loanwords (ニュー, オールド, アッパー, ロワー, ノース, サウス, イースト, ウエスト, グレート, リトル, ポート, フォート); native ones made words by accident (コ + ナミ is Konami). Every word of the file is katakana (a test holds it).
- es: `{title} {mark} {head} {tail}, {county}`, the tail a phrase of its own. Marks and the head words that are adjectives take the title's gender and number (`agreeSpanish`): `Ciudad Nueva Concha del Risco`, `Molinos Ardientes del Chapitel`.

### Samples (60 towns per locale, with and without marks, across 19 biomes and all 12 titles)

| English | ja | es |
| --- | --- | --- |
| Pebblehaven Town, Larkenfen | コイシミナトタウン（ヒバリヌマ） | Pueblo Guijarro del Refugio, Alondral |
| Propwold City, Amberfold | ササエコウヤシティ（コハクカコイ） | Ciudad Apuntalada de la Meseta, Redil Ámbar |
| Croakmoor Village, Gildenmarch | ガマノハラムラ（コガネザカイ） | Aldea Ranera de la Landa, Marca Dorada |
| Old Orchidmarch Hamlet, Harrowfen | オールドランザカイサト（クワヌマ） | Caserío Viejo Orquídea de la Frontera, Rastrojal |
| Ochrebourne Borough, Junipermoor | オーカーイズミチク（ネズハラ） | Municipio Ocre de la Fuente, Enebral |
| Cactushollow Outpost, Heathenfen | サボテンクボトリデ（ヒースヌマ） | Puesto Cactus de la Vaguada, Páramo Pagano |
| Bramblecairn Landing, Northfen | イバラケルンワタシバ（キタヌマ） | Embarcadero Zarza del Mojón, Ciénaga del Norte |
| East Barleyglen Crossing, Saltenfen | イーストオオムギタニアイジュウジロ（シオヌマ） | Cruce Este Cebada de la Hoz, Salobral |
| Acornford Mills, Mirefold | ドングリアサセコナヒキ（ドロカコイ） | Molinos Bellota del Vado, Redil del Fango |
| Needlespire Rest, Ravenmoor | ハリトウイコイ（カラスハラ） | Descanso Aguja del Chapitel, Páramo del Cuervo |
| Snowburn Quarter, Brimshire | ユキゲシキワキミズガイ（ナミナミ） | Barrio Nevado del Manantial, Colmado |
| West Summitdale Waypoint, Ferrowshire | ウエストチョウジョウタニシュクバ（クロガネ） | Parada Oeste Cumbre del Valle, Ferrería |
| Calvingburn Town, Junipermoor | ブンリワキミズタウン（ネズハラ） | Pueblo Desprendido del Manantial, Enebral |
| Hollyshade City, Grimmarch | ヒイラギヒカゲシティ（ブキミザカイ） | Ciudad Acebo de la Sombra, Marca Lúgubre |
| Horsecombe Village, Northfen | ウマヤトムラ（キタヌマ） | Aldea Caballar de la Cañada, Ciénaga del Norte |
| Fort Cindermarch Hamlet, Sablewold | フォートモエガラザカイサト（クロコウヤ） | Caserío Fuerte Escoria de la Frontera, Meseta Cebellina |
| Washmarch Borough, Mirefold | カレガワザカイチク（ドロカコイ） | Municipio Rambla de la Frontera, Redil del Fango |
| Kittiwakerun Outpost, Nettlemoor | ミツユビカモメヒロバトリデ（イラクサハラ） | Puesto Gaviota del Regato, Ortigal |
| Tussockhaven Landing, Brimshire | カブミナトワタシバ（ナミナミ） | Embarcadero Macolla del Refugio, Colmado |
| Little Surfglen Crossing, Windermarch | リトルナミタニアイジュウジロ（ヒロザカイ） | Cruce Pequeño Bravío de la Hoz, Marca del Viento |
| Herondale Mills, Tarnhollow | サギタニコナヒキ（ヌマクボ） | Molinos Garza del Valle, Hoya |
| Reedmere Rest, Reedfold | アシミズウミイコイ（アシカコイ） | Descanso Carrizo de la Laguna, Cañaveral |
| Emeraldcrest Quarter, Mirefold | エメラルドテッペンガイ（ドロカコイ） | Barrio Esmeralda de la Cresta, Redil del Fango |
| West Ochrecroft Waypoint, Junipermoor | ウエストオーカーハタケシュクバ（ネズハラ） | Parada Oeste Ocre de la Huerta, Enebral |
| Quartzmere Town, Gildenmarch | セキエイミズウミタウン（コガネザカイ） | Pueblo Cuarzo de la Laguna, Marca Dorada |
| Scrubbourne City, Nettlemoor | カンボクイズミシティ（イラクサハラ） | Ciudad Maleza de la Fuente, Ortigal |
| Larkwatch Village, Harrowfen | ヒバリミハリムラ（クワヌマ） | Aldea Alondra de la Atalaya, Rastrojal |
| Fort Beechmarch Hamlet, Saltenfen | フォートブナザカイサト（シオヌマ） | Caserío Fuerte Haya de la Frontera, Salobral |
| Spruceford Borough, Northfen | トウヒアサセチク（キタヌマ） | Municipio Abeto del Vado, Ciénaga del Norte |
| Cottonspire Outpost, Quarryhold | ワタスゲトウトリデ（イシキリトリデ） | Puesto Algodón del Chapitel, Cantera |
| Summitmere Landing, Mirefold | チョウジョウミズウミワタシバ（ドロカコイ） | Embarcadero Cumbre de la Laguna, Redil del Fango |
| West Glassglen Crossing, Coldharrow | ウエストガラスタニアイジュウジロ（サムグワ） | Cruce Oeste Cristal de la Hoz, Gleba Fría |
| Thicketbrook Mills, Amberfold | ヤブセセラギコナヒキ（コハクカコイ） | Molinos Espesos del Arroyo, Redil Ámbar |
| Feathercombe Rest, Thistlewold | ハネヤトイコイ（アザミコウヤ） | Descanso Emplumado de la Cañada, Cardal |
| Ashfallmarch Quarter, Tarnhollow | ハイフリザカイガイ（ヌマクボ） | Barrio Ceniciento de la Frontera, Hoya |
| Lower Redrockdale Waypoint, Harrowfen | ロワーアカイワタニシュクバ（クワヌマ） | Parada Baja Rocarroja del Valle, Rastrojal |
| Ternmarch Town, Northfen | アジサシザカイタウン（キタヌマ） | Pueblo Charrán de la Frontera, Ciénaga del Norte |
| Blackwatermoor City, Sablewold | クロミズノハラシティ（クロコウヤ） | Ciudad Aguanegra de la Landa, Meseta Cebellina |
| Shellrun Village, Elderfen | カイガラヒロバムラ（ニワトコヌマ） | Aldea Concha del Regato, Saucal |
| Upper Tanglemarch Hamlet, Pelloway | アッパーモツレザカイサト（ペロウェイ） | Caserío Alto Enmarañado de la Frontera, Camino Pello |
| Sedgewold Borough, Harrowfen | スゲコウヤチク（クワヌマ） | Municipio Juncia de la Meseta, Rastrojal |
| Deepcombe Outpost, Glenmarch | フカミヤトトリデ（タニザカイ） | Puesto Hondo de la Cañada, Marca del Cauce |
| Ochremere Landing, Tarnhollow | オーカーミズウミワタシバ（ヌマクボ） | Embarcadero Ocre de la Laguna, Hoya |
| Little Quartzglen Crossing, Elderfen | リトルセキエイタニアイジュウジロ（ニワトコヌマ） | Cruce Pequeño Cuarzo de la Hoz, Saucal |
| Gorsewatch Mills, Northfen | ハリエニシダミハリコナヒキ（キタヌマ） | Molinos Aulaga de la Atalaya, Ciénaga del Norte |
| Clovermoor Rest, Sablewold | クローバーノハライコイ（クロコウヤ） | Descanso Trébol de la Landa, Meseta Cebellina |
| Maplecairn Quarter, Mirefold | カエデケルンガイ（ドロカコイ） | Barrio Arce del Mojón, Redil del Fango |
| West Needlecroft Waypoint, Marrowfen | ウエストハリハタケシュクバ（ホネヌマ） | Parada Oeste Aguja de la Huerta, Tuétano |
| Frostthorpe Town, Harrowfen | ハツシモハタタウン（クワヌマ） | Pueblo Helado de la Alquería, Rastrojal |
| Slateford City, Glenmarch | スレートアサセシティ（タニザカイ） | Ciudad Pizarra del Vado, Marca del Cauce |
| Stillmere Village, Fallowshire | シズケサミズウミムラ（ヤスミチ） | Aldea Quieta de la Laguna, Barbecho |
| South Glademarch Hamlet, Sedgemoor | サウスヒロバザカイサト（スゲハラ） | Caserío Sur Claro de la Frontera, Juncal |
| Saigabrook Borough, Peatmarch | サイガセセラギチク（デイタンザカイ） | Municipio Saiga del Arroyo, Turbal |
| Fumebrook Outpost, Sablewold | ケムリセセラギトリデ（クロコウヤ） | Puesto Humeante del Arroyo, Meseta Cebellina |
| Hoodoocairn Landing, Amberfold | フードゥーケルンワタシバ（コハクカコイ） | Embarcadero Chimenea del Mojón, Redil Ámbar |
| Port Sprayglen Crossing, Oakenwold | ポートシブキタニアイジュウジロ（カシコウヤ） | Cruce Puerto Rociado de la Hoz, Quejigal |
| Sinkbarrow Mills, Tarnhollow | オチコミコフンコナヒキ（ヌマクボ） | Molinos Hundidos del Túmulo, Hoya |
| Foammouth Rest, Glenmarch | アワグチイコイ（タニザカイ） | Descanso Espuma de la Boca, Marca del Cauce |
| Siltwold Quarter, Fallowshire | ドロコウヤガイ（ヤスミチ） | Barrio Cenagoso de la Meseta, Barbecho |
| Great Peatcroft Waypoint, Ivywold | グレートデイタンハタケシュクバ（ツタコウヤ） | Parada Gran Turba de la Huerta, Hiedral |

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
