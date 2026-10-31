# Log: i18n-ui-overworld

- Started on the branch with the brief commit only; no extraction existed yet.
- Read the 22 files under the owned paths. `windows.ts`, `journey.ts`, `board-view.ts` and `board-metrics.ts` hold no player text. Names of people, places, weather, biomes and landmarks stay on their lookups (batch 9).
- `SHOWN_LOCALES` in `src/i18n/locale.ts` (shared path) has to list ja and es, or the server keeps serving English whatever the cookie says.
- Extraction: 211 `en.json` messages across 15 files. Field move names now read `describeMove`, and the item named in honey and portal lines reads the item registry; both give the same English. The gate tails in `challengers.ts` became whole sentences (`eliteGate(member, who)` and kin), since a tail spliced into another sentence cannot be reordered in ja. Portal Keys use a plural variant. typecheck, oxlint (exit 0) and the game, i18n and component tests pass.
