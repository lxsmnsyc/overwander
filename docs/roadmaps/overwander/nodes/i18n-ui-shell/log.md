# Log: i18n-ui-shell

- Started on branch `i18n-ui-shell` (brief commit on top of origin/main). No earlier work for this node: no shell keys in the messages, only the Language label in Settings.
- Extraction: about 420 English messages across styled, forms, app, settings, notifications, news, gifts, friends, the three routes, `src/auth/refusal.ts` and the duel refusal. Shared words got `ui_` keys (`ui_close`, `ui_back`, `ui_gold`, `ui_level_name`, `ui_quoted`, `ui_looking`, ...); panel names `panel_*` serve both the menu keys and the dialog titles.
- Model text moved out: `describeLearnRefusal` (src/model/learn-refusal.ts) now lives in forms/teach-move.tsx; `friendActionLabel` (src/model/friend-record.ts) now lives in friends/tie.ts; `duelRefusal` returns a `DuelRefusal` reason said by `src/i18n/duel-refusals.ts`.
- Command bar left English: it is a staff tool (the bar staff type at), like the admin panel. Flag for the orchestrator.
- Release pages in News are markdown content, left English.
- Typecheck, lint (exit 0), component/game/model tests pass; key test fails only for the missing ja and es keys.
- Translation: ja and es for every new key plus the 23 `refusal_*` and `gift_reason_*` keys. Key test exemption removed, and a new case checks every refusal and gift reason differs from English. Term list extended (shell terms, money and counts).
- `reset_done_link` added so the password page's link reads as an imperative in Spanish.
