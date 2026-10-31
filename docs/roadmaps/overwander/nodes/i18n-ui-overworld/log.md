# Log: i18n-ui-overworld

- Started on the branch with the brief commit only; no extraction existed yet.
- Read the 22 files under the owned paths. `windows.ts`, `journey.ts`, `board-view.ts` and `board-metrics.ts` hold no player text. Names of people, places, weather, biomes and landmarks stay on their lookups (batch 9).
- `SHOWN_LOCALES` in `src/i18n/locale.ts` (shared path) has to list ja and es, or the server keeps serving English whatever the cookie says.
- Extraction: 211 `en.json` messages across 15 files. Field move names now read `describeMove`, and the item named in honey and portal lines reads the item registry; both give the same English. The gate tails in `challengers.ts` became whole sentences (`eliteGate(member, who)` and kin), since a tail spliced into another sentence cannot be reordered in ja. Portal Keys use a plural variant. typecheck, oxlint (exit 0) and the game, i18n and component tests pass.
- Translation commit landed; term list written to `docs/strategy/translations-terms.md`; one reviewer agent spawned on the ja and es text.
- Picker: a Language radio group at the top of Settings, Display, labels in each language's own name. `SHOWN_LOCALES` is now every locale.
- `test/i18n/server.test.ts` (outside owned paths) asserted English for ja requests, and passed only because it destructured `getLocale` before `server.ts` swapped it, so it never read the request at all. Fixed to read through the module, and to expect ja and es.
- `test/i18n/messages.test.ts`: keys, parameters (variant inputs included), no empty messages, locale switch, plural forms. `refusal_*` and `gift_reason_*` are allowed missing in ja and es.
- Reviewer: no wrong-meaning errors in es, one in ja (map sky hint). Applied its term fix (es grunt is recluta), the purse-won consistency, the Frontier greeting article, びき counters, ポータルキー in full, and the naturalness and nit lines.
- Screenshots in ja and es through a scratch Playwright spec against `pnpm dev` (needs `VITE_WORLD_SEED` and `VITE_WORLD_GENERATION` from the dev server's env, or the staged positions land in another world). No clipping. Dev server stopped.
- Full check: typecheck ok, oxlint exit 0 after fixing two errors in the new key test, `pnpm test` 5750/5751 with tera-sites timing out under load and passing alone.
