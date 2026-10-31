# Translation terms

The words a batch translates once and every later batch reuses. See [translations.md](translations.md) for the procedure. Japanese is written in kana, Spanish as Spain uses it.

## Official terms

Taken from the games, never translated fresh. Names of species, moves, items, abilities and types come from the registries, so these are only the words the interface writes itself.

| English | ja | es |
| --- | --- | --- |
| Lv. | Lv. | Nv. |
| Team Rocket | ロケットだん | Team Rocket |
| grunt | したっぱ | recluta |
| Elite Four | してんのう | Alto Mando |
| badge | バッジ | medalla |
| Trainer | トレーナー | Entrenador |
| Egg | タマゴ | Huevo |
| shiny | いろちがい | variocolor |
| Shadow (pokemon) | ダーク | Oscuro |
| Bag | バッグ | Mochila |
| Run | にげる | Huir |
| Throw | なげる | Lanzar |
| Ball | ボール | Ball |
| rental (Battle Factory) | レンタル | alquilar |
| Hidden Grotto (grotto) | かくしあな | Claro Oculto (claro) |
| Den (lair) | すあな | guarida |
| raid | レイド | incursión |
| prize money (a purse won) | しょうきん | premio en dinero (su premio en dinero for theirs) |
| Victory, Defeat, draw | しょうり, はいぼく, ひきわけ | Victoria, Derrota, Empate |
| fainted | ひんし | Debilitado |
| candy | アメ | caramelo |
| Legendary, Mythical | でんせつ, まぼろし | legendario, singular |
| Max Raid, Tera Raid | マックスレイド, テラレイド | incursión Dinamax, teraincursión |
| Totem, Alpha, Noble | ぬし, オヤブン, キング | dominante, alfa, señorial |
| frenzy (a Noble's) | あらぶり | frenesí |
| Friend code | フレンドコード | Código de amigo |

## Terms this engine invented

| English | ja | es | What it is |
| --- | --- | --- | --- |
| window | じかんわく | franja | The stretch of time a chunk's spawns and landmarks last |
| chunk | チャンク | sector | One square of the generated world |
| buddy | あいぼう | compañero | The pokemon walking with the player |
| purse (money held) | おかね | dinero | A player's money, as a stake |
| mark (for an award) | しるし | distintivo | What a win records toward an award |
| line-up | メンバー | alineación | The party a challenger or a seat fields |
| Honey Tree | ミツの き | Árbol de Miel | The landmark that takes Honey |
| lather | ぬる | untar | Spreading Honey on the tree |
| Nest | す | nido | The landmark that holds an egg twice a day |
| Portal | ポータル | Portal | The ring of standing stones |
| Portal Key | ポータルキー | Llave del Portal | The key a crossing spends (the item registry's name follows this in batch 8) |
| Gym Seat | ジムシート | Puesto de Gimnasio | A team a player leaves for others to fight |
| take (a seat's daily allowance) | かい | conquista | One win a seat gives a player in a day |
| stand down | シートを はなれる | dejar el puesto | Giving up a held seat |
| challenger | ちょうせんしゃ | aspirante | Whoever walks up to fight |
| treat | おやつ | golosina | Something fed to a wild pokemon before a throw |
| World Map | せかいちず | Mapa del mundo | The map dialog |
| Sky (map layer) | そら | Cielo | The weather wash on the map |
| the house (Frontier facility) | (left implicit) | la casa | The facility setting its rule |
| Walk on | たちさる | Seguir | The way out of an overworld dialog |
| you (the reader) | きみ | tú | How a line names the player reading it |
| party (the pokemon a player fights with) | てもち | equipo | The team a player brings to a fight |
| side | がわ, サイド | bando | One alliance in a fight |
| foe | あいて | Rival | The other side, on the top bar |
| overworld | フィールド | el mundo | Where a prize waits after a fight |
| gold (money won or lost) | おかね | dinero | A fight's money line on the verdict |
| duel | たいせん | combate | A fight two players arrange |
| lobby | ロビー | sala | Where a duel is arranged |
| seat (in a duel lobby) | せき | plaza | One of a duel's two fighting places |
| fighter, spectator | たいせんしゃ, かんせんしゃ | combatiente, espectador | What a lobby invite calls someone in as |
| host | ホスト | anfitrión | Whoever opened the lobby |
| Ready | じゅんびOK | Listo | A seat's agreement to start |
| replay | リプレイ | repetición | A settled fight played again from its record |
| raid boss | レイドボス, ボス | jefe de la incursión, jefe | The pokemon a raid fights |
| base stat total | しゅぞくちの ごうけい | total de estadísticas base | The duel rule's cap |

## Status conditions

The names a status shows on a card or a catch, in `src/data/text/<locale>/statuses.yaml`. A condition the games name (poison, sleep, confusion, flinching) uses the games' word. A status a move leaves (Taunted, Encored, Rooted) uses that move's official name, as the move registry writes it. A status this engine invented is translated once:

| English | ja | es |
| --- | --- | --- |
| Poisoned, Badly poisoned | どく, もうどく | Envenenado, Gravemente envenenado |
| Asleep, Paralyzed, Burned, Frozen | ねむり, まひ, やけど, こおり | Dormido, Paralizado, Quemado, Congelado |
| Confused, Infatuated, Flinched | こんらん, メロメロ, ひるみ | Confuso, Enamorado, Amedrentado |
| Drowsy (Yawn) | ねむけ | Somnoliento |
| Comatose | ぜったいねむり | Letargo Perenne |
| Invulnerable, Recharging, Trapped | むてき, はんどう, バインド | Invulnerable, Recargando, Atrapado |
| Floating, Cornered | ふゆう, にげられない | Flotando, Sin escapatoria |
| Dormant (a boss warming up) | きゅうみん | Latente |
| Switching | こうたい | Cambiando |
| Staggered (a Noble knocked down) | よろめき | Aturdido |

## Language names

The picker names each language in itself: English, 日本語, Español. 日本語 is written in kanji, as every language list writes it, though the rest of the Japanese text is kana.
