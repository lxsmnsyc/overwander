# Outcome: i18n-plumbing

## Built

- Paraglide JS 2.29 with one locale, `en`, and an empty `src/i18n/messages/en.json`. `project.inlang/settings.json` loads the message-format plugin from `node_modules`, so compiling never reaches the network.
- `src/i18n/compile-options.ts` holds the compiler options, shared by the vite plugin and `scripts/i18n/compile.ts`. `pnpm typecheck` runs the script first, because tsc starts no plugin. The output in `src/i18n/paraglide` is generated, ignored by git, oxlint and oxfmt.
- The locale (`src/i18n/locale.ts`): a cookie, `overwander-locale`, then `Accept-Language`, then English. The server works it out once per request (`src/i18n/server.ts`, imported by `entry-server.tsx`) and writes it on `<html lang>`. The browser reads it back from `<html lang>`, so the hydrated page always matches the one the server sent. `chooseLocale` writes the cookie and reloads.
- `src/i18n/format.ts`: `formatNumber`, `formatDate`, `formatMoment` and `formatRelative` over cached `Intl` formatters in the active locale. English formats as `en-GB`, matching the game's British spelling and the old "12 Aug 2026" dates.
- Every `toLocaleString` and `toLocaleDateString` outside `src/i18n` is replaced (16 files), and `src/core/dates.ts` uses `Intl` instead of date-fns, which is removed. `test/i18n/no-machine-formatting.test.ts` keeps them out.

## Deviations

- The locale is kept in a cookie, not in `GameSettings` and `localStorage` as the `device-settings` skill says. The server has to know it to render the page, and a request carries only cookies.
- No language picker in the settings panel yet: with only English it would offer one choice. It lands with the first batch that ships ja and es.
- `src/app.tsx`, `vite.config.ts`, `oxlint.config.ts`, `oxfmt.config.ts`, `scripts/i18n/` and the 16 call sites were edited outside the owned paths.
- Dates that followed the device's format (friends, trades, passkeys, player place, admin) now read "12 Aug 2026", hence a patch changeset.

## Stubs left

- None.

## Gotchas

- Adding a locale: put it in `project.inlang/settings.json` and give it a tag in `INTL_TAGS` in `src/i18n/locale.ts`, which is typed by `Locale`, so tsc points at the gap.
- The ISO stamps in the admin raid and clock views and the search syntax in `src/model/search/catch/dates.ts` are left as they are: they are machine formats, not prose.

## Verification

- `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test` (270 files, 5715 tests).
- Dev server: `<html lang="en">` for `Accept-Language: ja` and for an `es` cookie, and a ja-JP browser hydrates the page with no errors.
