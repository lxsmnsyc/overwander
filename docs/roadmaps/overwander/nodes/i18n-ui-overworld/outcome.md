# Outcome: i18n-ui-overworld

## Built

- 211 Paraglide messages for the overworld in `src/i18n/messages/{en,ja,es}.json`, read by the HUD and board (`overworld-tab/board.tsx`, `overworld-tab/index.tsx`, `chunk-canvas.tsx`), the world map (`WorldMapDialog.tsx`, `WorldMapCanvas.tsx`), the Honey Tree, Nest, Portal, Stop, Gym Seat and Safari dialogs, `WeatherIcon.tsx`, and in `src/game/overworld/` by `interact.ts` (every remark and announcement), `challengers.ts` (greetings, prizes, Frontier house rules, the locked lines) and `walk.ts` (field move failures). Keys are grouped by prefix: `ow_` for shared words, then `honey_tree_`, `nest_`, `portal_`, `stop_`, `gym_seat_`, `safari_`, `world_map_`, `weather_`, `board_`, `walk_`, `interact_`, `challenger_`.
- The field move names on the menu bar read the move registry (`describeMove`), and the Honey and Portal Key lines read the item registry, so they follow the locale.
- `eliteGate`, `championGate` and `frontierGate` in `challengers.ts` now take `who` and return the whole locked sentence, since a clause spliced into another sentence cannot be reordered for Japanese.
- `portal_keys` is a plural message (`count`), the first one in the project.
- A Language choice at the top of Settings, Display (`LanguageSetting` in `src/components/settings/SettingsTab.tsx`), labelled English, 日本語, Español, each with a note in its own language that untranslated screens stay English. It calls `chooseLocale`, which writes the cookie and reloads.
- `SHOWN_LOCALES` in `src/i18n/locale.ts` is now every locale, so the server serves ja and es.
- `docs/strategy/translations-terms.md`: the official terms and the engine's own terms this batch translates, ja and es side by side.
- `test/i18n/messages.test.ts`: every key in every locale, matching parameters (variant inputs included), no empty message, the locale option switches the text, plural forms pick by count.
- Changeset `.changeset/i18n-ui-overworld.md`, minor.

## Deviations

- `src/i18n/locale.ts` (shared path): `SHOWN_LOCALES` widened to all locales; without it the picker would set a cookie the server ignores.
- `test/i18n/server.test.ts` (not owned): it expected English for ja and es requests, and it passed only because it destructured `getLocale` before `server.ts` replaced it, so it never read the request. It now reads `runtime.getLocale()` and expects ja and es.
- The picker sits in Settings, which is otherwise batch 7. Only the Language label is a message; the rest of the pane stays English.
- The term list says 日本語 in kanji for the language's own name, the one kanji in the Japanese text.

## Stubs left

- `refusal_*` and `gift_reason_*` are still English in ja and es (batch 4 left them; the key test allows them missing). They show in the overworld as toasts, so batch 7 (`i18n-ui-rest`) or a small follow-up should translate them.
- Text the overworld shows from outside the owned paths stays English: `describeWhere` in `src/overworld/bearing.ts` (town distance in the Portal list), `describeFlight` in `src/overworld/safari.ts` (the Forewarn badge), `CounterTerms` row labels in `src/components/forms/terms.tsx` (Cost, You have, How often), the menu bar (`GameMenu.tsx`), `sayItems`, and toasts' close labels. Batch 7.
- Names of people, places, landmarks, weather, biomes, awards, syndicates and NPC quotes stay English (batch 9). Lines with those names in Spanish leave out an article where the name's gender is unknown ("{name} te corta el paso").
- 'Giovanni' in `board.tsx` is a name and stays as written.

## Gotchas

- A message function is locale-bound at call time. Values built once at module load (a `Record` of strings) would freeze English; this batch keeps them as `Record<K, () => string>` and calls them when shown.
- `pnpm exec oxfmt src test` reformats files outside the batch (zenith YAML, an encounter test). Format only the paths you touched.
- The e2e helpers find the board by `name: /^Chunk map\./` and dialogs by English names; under ja or es they no longer match. The e2e suite runs in English, so this only bites a spec that sets the locale cookie.
- The e2e helpers derive the world from `VITE_WORLD_SEED` and `VITE_WORLD_GENERATION`; run against `pnpm dev`, they need the same values the dev server reads, or `standBeside` writes a position in another world.
- Paraglide's inputs are typed `NonNullable<unknown>`, so tsc does not catch a missing parameter's type, only a missing key. The key test covers parameter names.

## Proposed learnings

- Player-facing text in `src/components` and `src/game` goes through `m.<key>()`, never a literal | each batch moves an area and new literals undo it | src/components, src/game | partly: a test could flag string literals in JSX text of translated folders
- A message that needs a name is a whole sentence with a `{name}` parameter, never a fragment joined to another | word order differs in ja | src/i18n/messages | no

## Verification

- English unchanged by the extraction commit: the game, i18n and component tests passed on it, with the same sentences (multi-line literals collapse to the same rendered text).
- Review: one fresh agent read ja and es against the English and the term list. It found one wrong meaning in ja (`world_map_sky_hint`), the official Spanish word for a grunt (recluta), mixed words for prize money, a fixed article before Frontier facility names, ひき for a literal 3, and stiff lines. All were fixed in 6793d9fad.
- Screenshots at 1280x720 (Playwright Desktop Chrome, against `pnpm dev`) in ja and es: HUD, World Map, Settings (picker), Honey Tree, Nest, Portal, Gym Seat. No clipping or overflow; long Japanese lines wrap. The Safari dialog was captured in ja on a first pass (no clipping); the Stop dialog was not reached, since a new account has no pokemon and the trainer answers with a remark.
- `pnpm typecheck` passes. `rtk proxy pnpm exec oxlint src test` exits 0.
- `pnpm test`: 275 files, 5750 of 5751 tests passed; `tera-sites.test.ts` timed out under the full load and passes alone (6 of 6), as GOAL.md expects.

## Size

- Estimated L, actual L.
