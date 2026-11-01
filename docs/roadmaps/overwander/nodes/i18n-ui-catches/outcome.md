# Outcome: i18n-ui-catches

## Built

- 580 Paraglide messages for the catch box, catch sheet and its sections, the pickers, Ability Patch, Bottle Cap, PP Up, the buddy, the bag and candy, the item cards, the move lists and the Pokédex, in `src/i18n/messages/{en,ja,es}.json`. Prefixes: `catch_`, `item_`, `dex_`, `move_`, `type_`.
- Read by every text-bearing file under `src/components/{catches,items,dex,moves,sprites}` and by `src/game/items/use-item.ts`. `src/game/catches/candy-feed.ts` writes no sentences and is unchanged.
- English tables that live in `src/model` and `src/data` got a component-side table of messages, so search keeps its English vocabulary: `GENDER_LABELS` and `ACQUISITION_LABELS` (catch-summary.ts), `BOX_COLOUR_NAMES` (box-form.tsx), `POCKET_NAMES` (InventoryList.tsx, in place of `ITEM_TYPE_NAMES`), `MOVE_CATEGORY_LABELS` (MoveCategorySprite.tsx), `REGION_LABELS` (PokedexTab.tsx), `sayFriendship` over `describeFriendship`'s bands, and `m.catch_box_default()` on screen in place of `DEFAULT_BOX_NAME`.
- `articled()` in `catch-dialog/describe.tsx` and `use-item.ts` adds an English article only for `en` (`withArticle` is English-only).
- Lists joined in sentences keep their joiners as messages (`catch_and`, `catch_or`, `dex_fossil_and`).
- Spanish counts that can be one are plural messages (candy, steps, gaps, the bulk toasts, seen and caught, skipped, held back, picked).
- `docs/strategy/translations-terms.md`: catch sheet terms, bag pockets, regions, move categories, and the engine's own (signature ability, Default box, slot, cooldown, relic, Dojo Master).
- Layout: the stats header keeps ごうけい on one line, and the bag's pocket list is `md:w-48` so "Objetos equipables" fits beside its count.
- Changeset `.changeset/i18n-ui-catches.md`, patch.

### Shared keys reused

`ui_close`, `ui_back`, `ui_never_mind`, `ui_egg`, `ui_level_name`, `ui_item_times`, `ui_gold`, `ui_remove_action`, `battle_cancel`, `battle_kind_pokemon`, `battle_candy_earned`, `pick_team_fainted`, `pick_catch_prompt`, `pick_catch_title`, `pick_catch_loading`, `teach_this_pokemon`, `teach_power`, `teach_pp`, `tooltip_kind_item`, `tooltip_kind_type`, `tooltip_kind_candy`, `panel_boxes`, `pager_previous`, `pager_next`, `pager_page`.

## Deviations

- None outside the owned paths.

## Stubs left

- Stat and stage names stay English. The brief says they follow the locale, but `STAT_NAMES` and `STAGE_NAMES` are a plain `stringTable` over `text/en/stats.yaml`. Item descriptions are built from them when the registry loads, and the staff command bar parses them, so a locale table needs those callers settled first. Fits batch 8 (registry text).
- Left on their lookups, for batch 8 or 9: biome, time-of-day and spawn-rarity names, encounter type names ("Wild" on the sheet's footer), lair titles, feat descriptions, family names (candy reads "Charmanderの アメ"), species categories where the registry has none, signature ability names, item and ability descriptions.
- The bag search placeholder keeps its English search vocabulary (`type:berry is:usable`), as search parses English.

## Gotchas

- `localeStringTable` reads the locale on each access, so anything that builds a string from a translated table at module load freezes whichever locale was active then. Watch for this when stat names move over.
- The catch sheet has no tabs: it is one scrolling sheet in two columns, each scrolling on its own.
- The sigil on a catch card is braille glyphs (⠅⠋), not a missing translation.
- The screenshot script's clicks on the sheet's History and Actions buttons timed out; those two sub-dialogs were not captured.

## Proposed learnings

- A side list with a fixed width is checked in es: Spanish labels run longest and push trailing counts into the border | Spanish pockets and tabs | src/components | no

## Verification

- Extraction commit (e57a620f9): English unchanged; typecheck, lint (exit 0), `test/game` and `test/components` pass. The key test failed only for the missing ja and es keys.
- Translation commit (56355d91d): `test/i18n` passes (37 tests).
- Review: one fresh agent read ja and es against the English and the term list. Placeholders and kanji clean. Applied in 1963cfa89: the ja lair term (すあな, per the term list), the ja "not seen" filter chip, Spanish agreement for counts of one (twelve messages, three now plural), and five es wording fixes. Kept: the ja type-matchup labels in mixed forms (style only).
- Screenshots at 1280x720 (Playwright against the e2e dev server and the dev database) in ja and es: the catch box with a hover card, the catch sheet top and both columns scrolled through, box select mode, the bag with an item card, the candy grid, the dex grid and a dex entry. Two layout fixes (6acfa67b9): ja ごうけい wrapped in the stats header, and the es "Objetos equipables" count pressed against the pocket list's border.
- `pnpm typecheck` passes. `rtk proxy pnpm exec oxlint src test` exits 0.
- `pnpm test`: 277 files, 5758 tests pass. The first full run had one failure that did not repeat on the rerun.

## Size

- Estimated L, actual L. 580 strings over 53 files.
