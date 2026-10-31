# Outcome: i18n-ui-shell

## Built

- 420 Paraglide messages for the shell in `src/i18n/messages/{en,ja,es}.json`, read by every text-bearing file under `src/components/{app,styled,forms,settings,notifications,news,gifts,friends}`, `src/routes/index.tsx`, `src/routes/reset-password.tsx` and `src/routes/[...404].tsx`. The command bar is the one exception (see Deviations).
- The 23 `refusal_*` and `gift_reason_*` messages are translated. `test/i18n/messages.test.ts` no longer exempts them, and a new case fails if any `refusal_*`, `gift_reason_*`, `auth_refusal_*` or `duel_refusal_*` message reads the same as English in ja or es.
- Sign-in refusals: `src/auth/refusal.ts` maps Better Auth codes to message functions (`auth_refusal_*`). `authRefusal(error, fallback)` takes the fallback as a message function, read when the refusal is made.
- Duel refusals: `duelRefusal` in `src/data/constants/duel-rules.ts` returns a `DuelRefusal` reason (`mythical`, `legendary`, `form-item`, `stat-total` with `total`). `describeDuelRefusal` in `src/i18n/duel-refusals.ts` says it, and the duel lobby calls it.
- Module tables now hold message functions or are built when shown: `KIND_CHIPS` (tooltip), `GROUPS` and `WINDOWS` (GameMenu), `TITLES` and `DESCRIPTIONS` (routes/index), `ACTION_NAMES` (app/keys), `CONTROL_NOTES`, `PANE_LABELS`, `readClocks`, `readBoardEdges`, `readBoxWidths` (SettingsTab), the notice tables (NotificationsTab), the friend tie labels (friends/tie.ts).
- `FriendEntry`'s `when` prop is now `(date: string) => string`, so the date sits where each language puts it ("{date}から フレンド").
- `createPager` lost its unused `unit` parameter; the pager reads `pager_page` and `pager_range`.
- `docs/strategy/translations-terms.md`: shell terms (panels, sign-in, passkey, staff, shelf, claim, trade, lot, bid), official ones (ずかん, わざマシン, Recordador de Movimientos, Regalo Misterioso, Poké Ball), and a section on money and counts.
- Changeset `.changeset/i18n-ui-shell.md`, patch.

### Shared keys for `i18n-ui-catches` and `i18n-ui-social`

Reuse these rather than adding new ones:

| Key | English |
| --- | --- |
| `ui_close`, `ui_back`, `ui_never_mind`, `ui_next`, `ui_change`, `ui_dismiss` | Close, Back, Never mind, Next, Change, Dismiss |
| `ui_remove_action`, `ui_remove` | Remove, Remove {name} |
| `ui_loading`, `ui_looking` | Loading…, Looking… |
| `ui_search`, `ui_search_placeholder`, `ui_nothing_matches`, `ui_choose`, `ui_nothing_to_choose` | search furniture |
| `ui_help` | Help (a HoverCard `kind`) |
| `ui_gold` | {amount} gold (pass `formatNumber`) |
| `ui_level_name` | Lv. {level} {name} |
| `ui_item_times` | {item} ×{amount} |
| `ui_egg` | Egg |
| `ui_quoted` | “{text}” (「」 in ja, «» in es) |
| `ui_sign_out` | Sign out |
| `panel_*`, `panel_*_description` | the twelve panel names and their screen-reader lines |
| `tooltip_kind_*` | Item, Candy, Type, Weather, Ability, Status, Move chips |
| `pick_catch_title` | Your pokemon |
| `pick_team_fainted`, `pick_team_locked`, `pick_team_in_raid`, `pick_team_not_hatched` | why a pokemon is held back |
| `teach_power`, `teach_pp` | Power, PP |
| `friends_tie_*` and `friendActionLabel` from `src/components/friends/tie.ts` | Add friend, Remove friend, Cancel request, Accept request, Unblock |
| `friends_trade`, `notices_label_*` | Trade, and the notice kind chips |
| `auctions_board`, `auctions_add` | the auction panel's Board and Add buttons |
| `battle_cancel` (from i18n-ui-battle) | Cancel |
| `ow_walk_on` (from i18n-ui-overworld) | Walk on |

## Deviations

- Command bar (`src/components/app/command-bar/**`) stays English. It is the bar staff type at (`runsTheGame`), the same class as the admin panel the brief leaves English. About 60 strings (command hints and refusals). The orchestrator decides whether a later node translates it.
- `src/model/learn-refusal.ts` (not owned): `describeLearnRefusal` moved into `src/components/forms/teach-move.tsx` as messages; the model keeps only the `LearnRefusal` reason.
- `src/model/friend-record.ts` and `src/auth/friends.ts` (not owned): `friendActionLabel` moved to `src/components/friends/tie.ts`. `src/components/profile/ProfileTab.tsx` (not owned) imports it from there.
- `src/auth/actions.ts` (not owned): passes `m.auth_refusal_passkey`, `m.auth_refusal_set_password` and `m.auth_refusal_sign_out` as `authRefusal` fallbacks.
- `src/components/duels/DuelLobby.tsx` (not owned): says the duel refusal through `describeDuelRefusal`, as the brief asks.
- `test/data/duel-rules.test.ts` and `test/auth/refusal.test.ts` (not owned): expect the `DuelRefusal` objects and the message-function fallback.
- `src/routes/index.tsx` also holds the auction panel's Board and Add buttons and the ban screen; they are translated here because the file is owned.

- `src/auth/security.ts` (not owned): the Security pane's refusals go through `authRefusal` with `security_refusal_*` messages. A Better Auth code it knows is said in the player's language; anything else reads as what the call could not do, where it used to show Better Auth's English message.
- The staff-only command bar (`src/components/app/command-bar/**`) stays English, as the admin panel does: only `runsTheGame` accounts can open it.

## Stubs left

- `src/overworld/npcs/lessons.ts` passes `cost: 'The Heart Scale'` into the teach form, and the shop NPC (`src/overworld/npcs/shop.tsx`) passes English verbs, empties and price notes into the shop form. NPC lines are out of scope (batch 9 or a follow-up).
- News release pages (`src/components/news/releases.ts`, markdown) stay English: they are release notes, not interface text.
- Credits data (sources, terms, library descriptions) stays English: it is generated data.
- Time-of-day and weather names on the menu bar (`TIME_OF_DAY_NAMES`, `WEATHER_NAMES`, `WEATHER_DESCRIPTIONS`) are registry text for batch 8 or 9.
- Toast gold amounts (`toast_seat_freed_gold`, `toast_purse_won`) pass the raw number, as English did; a later pass can group them with `formatNumber`.
- The Language picker's note ("untranslated screens stay English") stays until batch 9.

## Gotchas

- ja minutes read ふん for every count (`menu_wait_minutes`, `menu_wait_mixed`): the right reading (いっぷん, さんぷん) needs kanji or per-number forms. Accepted by the review.
- A Paraglide plural cannot match 0 with `zero` in English (Intl gives `other`); `gifts_ledger_not_taken` is a separate message for 0.
- `pnpm test:e2e` failed to sign in against the dev database because its `jwks` row had been encrypted under another `BETTER_AUTH_SECRET`; clearing it on the dev database (port 54324) fixed it.
- The e2e helpers find the menu by `name: 'Game'` and `'Menu'`, which are now messages; the suite runs in English so they still match.
- `claimStarter` (e2e/game.ts) did not find the starter balls in this run (`/^Claim \d+ × /`), and the e2e helpers' `getByRole('button', { name })` found no names on the menu keys; not investigated, the e2e suite is stale as a whole (`e2e-specs`).
- The vite error overlay (`read ECONNRESET`) can cover the page during a long e2e run and swallow clicks.
- In ja, the menu key プロフィール wraps onto two lines in its tile (no clipping). Dates in ja come out of `Intl` with kanji (2026年10月31日), as before this batch.
- Shop and NPC callers pass English units and verbs into the forms (`have.unit` is 'gold' from `goldHeld`); the furniture around them is translated.

## Proposed learnings

- A component prop that pairs a label with a value the component formats (a date, a count) takes a function `(value: string) => string`, not a prefix string | word order differs in ja | src/components | no

## Verification

- Extraction commit (cc388512e): English unchanged; typecheck, lint (exit 0), and the component, game and model tests (33 files, 342 tests) pass. The key test failed only for the missing ja and es keys.
- Review: one fresh agent read ja and es against the English and the term list. No must-fix findings (meanings, placeholders, kanji, official terms all clean). Ten wording nits applied in 0f21e41d8; two kept (ja ふん for every minute count, the です/ます legal paragraph).
- Screenshots at 1280x720 (Playwright against the e2e dev server and the dev database) in ja and es: sign-in (both tabs), menu bar, game menu, gifts (pokemon and items tabs), notices, settings (display, controls, world, play, security, about), profile friends and requests, add a friend (ja), the Form a team picker, and the shop. One clipping found and fixed: the ja About tab label overflowed the settings side list, now じょうほう. The es add-friend shot shows the profile menu instead of the dialog (the menu item is profile text, English). Saved under the session scratchpad `shots/shell/`.
- `pnpm typecheck` passes. `rtk proxy pnpm exec oxlint src test` exits 0.
- `pnpm test`: 276 files; 268 passed and 8 timed out under full load (experts, yaml-mapper, generation-fingerprint, raid demo, noble-sites, placement-invariants, tera-sites, world-windows). Rerun alone, seven pass; `tera-sites.test.ts` passes on its own (6 of 6).

## Size

- Estimated L, actual L. About 420 strings over 60 files, plus the refusal and model moves.

