# Translation strategy

How the game gets Japanese and Spanish beside English. This plan comes after the Zeniths, which are all in, so each region's Zenith names are in English already when it starts.

## Where things stand

- **Nothing is translatable yet.** There is no i18n library, and every player-facing string is English.
- **Registry text already lives apart from the entries**, under `src/data/text/en/`: species, moves, abilities, items, trainers, NPCs, towns, quests and the rest. That is about 4,600 entries, 2,100 of them with a description. Translating a registry means writing a `text/ja/` and a `text/es/` beside it.
- **Still written inline:**
  - the copy in about 200 components;
  - toasts, NPC lines and form prompts under `src/overworld/npcs`;
  - server refusals;
  - descriptions built by string concatenation (`describeBerry`, the gems, valuables);
  - 20 `toLocaleString` calls.

## Decided

- **Locales:** `en`, `ja` and `es`. English stays the source and the fallback for any missing key.
- **Library: Paraglide JS.** Its messages are typed functions, each locale is one reviewable file, and each locale is split into its own chunk so a player downloads only theirs.
- **Japanese is written in kana**, as the games show it by default: official names from PokeAPI's `ja-Hrkt`, and everything I translate in the same script. A kanji mode can come later as a setting.
- **Spanish is the games' Spanish**, as Spain uses it: official names from PokeAPI's `es`, and everything I translate in the same usage.
- **Official names come from PokeAPI:** species, moves, abilities, items, types and natures, in each language the mainline games ship. They are never translated by hand.
- **Everything else I translate.** That covers the engine's own descriptions, the interface, the NPCs, the signature abilities and the Zeniths.
- **The player docs stay English.** `docs/mechanics/` is not translated, but the in-game help is, with the screens it sits on.
- **Another agent reviews each batch for accuracy** before it merges, one batch at a time, against the English and the official names. It reports what it would change, and I make the fixes.

## The order

| # | Batch | Content |
| --- | --- | --- |
| 0 | Plumbing | Paraglide, a locale setting beside the theme that defaults from `Accept-Language` on the server render and sets `<html lang>`, and `Intl` in place of every `toLocaleString('en-US')` and hand-built date |
| 1 | Registry loader | Each registry's `yaml.ts` reads `text/<locale>/` over `text/en/` and checks that both have the same keys. Text lookups go through `getSpeciesName(id)` and friends, reading the active locale |
| 2 | Official names | A script that writes ja and es names from PokeAPI into `text/ja/` and `text/es/` for every species, move, ability, item, type and nature |
| 3 | Templates | Built descriptions become message templates with parameters instead of string concatenation |
| 4 | Server text | Server functions answer with a code and parameters, never a sentence, and the browser renders the message |
| 5 | Interface: overworld | The HUD, the map, the overworld dialogs |
| 6 | Interface: battle | The battle view, its log and its cues |
| 7 | Interface: the rest | Bag, catch sheet, dex, trades, auctions, raids, settings, profile, then the remaining dialogs |
| 8 | Registry descriptions | Moves, abilities and items, signature abilities and Zeniths included |
| 9 | People and places | NPC lines, trainers, gym leaders, towns, quests, awards, titles, weather and biomes |

Batches 0 to 4 land in English only and change nothing a player sees. Batches 5 to 9 each ship ja and es together.

## What every batch does

1. **Branch** `i18n-<slug>`, stacked on the previous batch, linked with `gh stack link`.
2. **Extract** the area's strings into English messages first, in their own commit, with nothing else changed.
3. **Translate** into ja and es.
   - Terms the games already name (Mega Evolution, Terastallization, a move or an item) use the official term, never a fresh translation.
   - A term this engine invented (Zenith, a signature ability, a landmark) is translated once and then reused. The term list lives in `docs/strategy/translations-terms.md` until it is long enough to need a file of its own in `src/`.
4. **Review:** another agent checks the batch against the English and the term list, and its findings are fixed before the PR goes up.
5. **Tests:** every key exists in every locale, every message's parameters match the English, and every description still ends in a full stop (`。` in Japanese).
6. **Look at it** in each locale on the screens the batch touched, for clipping and wrapping. Japanese has no spaces to break on, and Spanish runs about a third longer than English.
7. **Changeset**, `minor` for the batch that first shows a locale and `patch` after that.
8. **Checks:** `pnpm test`, `pnpm typecheck`, and `rtk proxy pnpm exec oxlint src test`, read by its exit code.

## Database

The `game_data` plan in [the roadmap](../roadmaps/overwander/nodes/gamedata-names/brief.md) gains a `names (kind, id, locale, name)` table once batch 2 lands, so box and auction search work in the player's language.

## Pace

- **One batch per PR, stacked.**
- **A locale is visible to players from batch 5**, behind the setting, with English filling any screen not translated yet.
