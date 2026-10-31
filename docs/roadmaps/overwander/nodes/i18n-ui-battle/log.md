# Log: i18n-ui-battle

- Nothing of the batch existed on the branch: no battle or duel keys in `en.json`.
- Extraction: 170 or so messages under `battle_`, `duel_rules_`, `duels_`, `lobby_`, `watch_`, `spectators_`, `verdict_`, `history_`, `canvas_`. Module-level tables of strings (`BAN_CHIPS`, `OUTCOME_LABELS`, `WAITING_KINDS`, the stat-cap options) now hold message functions or are built when shown.
- Status names: `STATUS_NAMES` became a private `localeStringTable` over `text/<locale>/statuses.yaml` (the pattern types and natures use), read through `getStatusName`. Callers in `components/catches` updated, as the brief asks.
- The loading label is `readLoadingLabel()` in both metrics files; `chunk-view/index.ts` calls it.
- `getDuelBlocker` in `src/model/duel-record.ts` writes the lobby's waiting line, so it now returns messages (outside owned paths, recorded as a deviation).
- `LOBBY_ROLE_NAMES` and `BATTLE_KIND_NAMES` (src/model) are left alone; the components read their own messages. `BATTLE_KIND_NAMES` has a test; `LOBBY_ROLE_NAMES` is now unused.
- `summary.ts` and `src/game/battle/watch.ts` build no sentences: nothing to extract there.
- Extraction commit: typecheck and lint pass; the key test fails until the translation commit adds ja and es.
