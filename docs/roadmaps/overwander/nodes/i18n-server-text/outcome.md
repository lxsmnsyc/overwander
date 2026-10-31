# Outcome: i18n-server-text

## Built

- `src/model/refusal.ts`: `refuse(code, params)` makes the error the server throws, with the code and string parameters written into its message as JSON behind a marker, and `readRefusal` reads it back. An unknown code reads as no refusal, so an older or newer server does not break a tab.
- `src/i18n/refusals.ts`: `describeFailure(thrown)` says a refusal in the player's language through Paraglide messages (`refusal_*` in `src/i18n/messages/en.json`), and any other failure in its own words. A closed switch's staff message is shown as written.
- 18 refusal codes replace the sentences thrown in `src/server` (auth, roles, friends, teleport, validation, claim lists, catch search), `better-auth.ts`, `src/auth` (commands, session, stale build) and the safari session.
- Every place that showed `error.message` (about 50 sites in 45 files, `src/game` included) calls `describeFailure`.
- `src/model/gift-reason.ts` and `src/i18n/gift-reasons.ts`: the gifts the game gives (starter, starter balls, quest, daily, hunt) store a coded reason, said in the player's language. A quest reason stores the quest's number, so its name follows the locale. Staff reasons and rows written before this change are shown as written. Gift search matches the shown reason.
- The first Paraglide messages; `ja` and `es` fall back to English for each until translated.
- `test/i18n/refusals.test.ts`.

## Deviations

- Sign-in refusals (`src/auth/refusal.ts`) already map Better Auth's codes to sentences in the browser. They are interface text and move to messages with the interface batches.

## Stubs left

- Daily and hunt reasons store the quest's name as built in English (`Featured: <family>`, `The <family> Hunt`), since those names are built in code. They follow the locale once batch 9 (`i18n-people-places`) builds them from templates.
- The economy ledger's `reason` column is staff-facing and left as is.

## Gotchas

- A new refusal is a code in `REFUSAL_CODES`, a message in `en.json`, and a line in `REFUSAL_MESSAGES` (typed, so tsc points at a missing one).
- `validate.ts` passes valibot's English issue text as the `invalid` refusal's detail.

## Verification

- `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test` (274 files, 5742 tests), `pnpm test:db` (32 files, 170 tests).
- The e2e specs that read these sentences (`starter-gift`, `command-bar`) still see the same English. The e2e suite is stale as a whole (`e2e-specs`) and was not run.
