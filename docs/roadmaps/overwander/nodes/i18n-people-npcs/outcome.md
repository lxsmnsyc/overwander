# Outcome: i18n-people-npcs

## Built

- 122 Paraglide messages `npc_*` in `src/i18n/messages/{en,ja,es}.json`, extracted from `src/overworld/npcs/` (`shop.tsx`, `shared.ts`, `lessons.ts` and the `interact` script of the breeder, channeler, daycare lady, dojo master, fossil maniac, fossil scientist, groomer, Hyper Trainer, Kurt, Move Reminder, Move Tutor, Nurse Joy and trader). No player-facing English is left inline under that folder.
- `src/data/text/{ja,es}/npcs.yaml` (18 people: name, description, quote, and `spent` for the 7 who serve once a window), `vendor-stalls.yaml` (6) and `decorations.yaml` (14).
- `Lesson.counted` in `lessons.ts` is a function of the count, so the count can sit anywhere in a sentence.
- `test/data/locale-people-places.test.ts`: every person, stall and scenery line written in ja and es, descriptions ending on 。 or ., no two people sharing a name in a locale.
- `docs/strategy/translations-terms.md`: a table of the people, stalls and scenery names.
- Changeset `.changeset/i18n-people-npcs.md`, `patch`.

## Deviations

- Shared paths touched: the terms file, and `test/data/locale-people-places.test.ts` instead of a new test file.
- English changed in two ways: prices, fees and egg steps in the conversations now group thousands (`formatNumber`), so 12500 reads 12,500 (12.500 in Spanish), in its own commit; and the apricorn count on Kurt's chip is a plural, so "1 apricorns" reads "1 apricorn". Amounts under a thousand read as before.
- `src/overworld/npcs/groomer/interact.ts` imports `sayFriendship` from `src/components/catches/catch-summary` for the mood word, instead of `describeFriendship` (English words, no locale).

## Coined names

| English | ja | es |
| --- | --- | --- |
| Groomer | トリマー | Peluquero |
| Vendor | あきんど | Vendedor |
| Geologist | ちしつがくしゃ | Geólogo |
| Trader | こうかんや | Comerciante |
| Hyper Trainer | すごいとっくんの コーチ | Entrenador Extremo |
| Medicine Stall, Vitamin Stall, Incense Stall | くすりの やたい, ビタミンの やたい, おこうの やたい | Puesto de Medicinas, Vitaminas, Inciensos |
| Battle Item Stall, Ball Stall, Machine Stall | バトルアイテムの やたい, ボールの やたい, わざマシンの やたい | Puesto de Objetos de Combate, Poké Balls, Máquinas |

Renames after the second-reading pass: ja トレーダー to こうかんや (one kana from トレーナー); ja まつ to マツ (also "to wait"); ja はな to はなばな (also the nose); es Cañas to Juncos (beers in Spain). User decisions after the review: Hyper Trainer is named for the official feature (ja ハイパートレーナー to すごいとっくんの コーチ, es Superentrenador to Entrenador Extremo); es Trader is Comerciante (the Intercambiador rename was undone); ja Tree scenery is じゅもく instead of き; es Groomer stays Peluquero. The other names are the games' own (see the terms file).

## Stubs left

- The trader's line fills in `{band}` from `SPAWN_RARITY_NAMES`, which has no ja or es file until `i18n-places`; that word reads in English inside the ja and es sentence until then. The files are not added here.
- The Fossil Scientist is masculine in Spanish (Científico de Fósiles), as the English lines say "he"; the item-bag help line that said la Científica now says el Científico.
- Where the English NPC name is the same word as a trainer class (Breeder, Chef, Trainer), ja and es use the class's official word; `i18n-people-trainers` should read the same word in the class list.

## Gotchas

- `ow_used_this_while` is じかんわく / franja; NPC lines that say "this while" use the same words so the screen and the person agree.
- A message with bold markup around the total is split into the lead and the total (`npc_sum_gold`, `npc_kurt_sum`), because the markup cannot sit inside a message.
- The `{from}` and `{to}` parameters work in Paraglide even though `from` reads like a keyword; typecheck and the messages test pass.
- `pnpm exec oxfmt` on `docs/strategy/translations-terms.md` realigns ten unrelated rows of older tables; the new table is unformatted on purpose to leave them alone.

## Verification

- `pnpm typecheck` exit 0; `rtk proxy pnpm exec oxlint src test` exit 0.
- `pnpm exec vitest run --maxWorkers=2 test/i18n test/data test/overworld`: 86 files, 1063 tests pass.
- Collision check of every coined name against the official ability, move, item and species names of ja and es: no exact match.
- Left for the caller: the full suite, the fresh review agent (ja and es against English and the term list), and the screenshots.

## Screens to screenshot (ja and es, 1280x720)

Walk up to each person; the name, quote and spent line show on the conversation, the rest in the form that opens.

- Nurse Joy (heal form, empty state, refused and done lines), Daycare Lady (needs an egg; Steps line, spent line), Breeder (pair form, fee chip, incompatible pair), Groomer (Friendship line, done line).
- Vendor, Chef and Geologist (the buy and sell counter: Costs, He pays, sum line, trade toast, the stall names on the board from across the chunk).
- Move Reminder and Move Tutor (the pokemon and move screen: heading, count notes, "Needs max friendship", the cost "The Heart Scale" in the teach step).
- Fossil Maniac, Fossil Scientist (needs fossils; a Galar half shows the half and pair steps), Kurt (needs apricorns: Becomes label, sum line), Channeler (Abilities line), Dojo Master (Move slots line), Trader (six-pokemon box, then the give form with the trader's line), Hyper Trainer (value list with prices).
- The Team Rocket Grunt and the Trainer only show name and quote (on the stop challenge).
- Scenery names in the tile tooltip or inspect line.
- Long lines to watch: Japanese Channeler quote, Spanish Daycare Lady name (Cuidadora de la Guardería), Spanish Dojo Master and Move Tutor descriptions.

## Size

- Estimated M, actual M.

## Caller's checks

- `pnpm test` (2 workers): 281 files, 5802 tests pass. `pnpm typecheck` and `rtk proxy pnpm exec oxlint src test` exit 0.
- A fresh review read every ja and es line and name; its fixes and the user's name decisions (Hyper Trainer after the official feature, es Trader Comerciante, ja Tree じゅもく) are applied.
- Screenshots skipped at the maintainer's call: a test could not hold the player beside the Pokémon Center or market (the position written next to the landmark did not take), so no NPC screen was captured.
