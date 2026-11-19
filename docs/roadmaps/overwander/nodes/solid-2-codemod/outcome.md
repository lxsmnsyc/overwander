# Outcome: solid-2-codemod

## Built

- Branch `refactor/solid-2-codemod`, cut from `feat/solid-2` (dd1272465). 309 files changed under `src`, `test` and `vite.config.ts`; nothing under `e2e` imported Solid.
- Renames, counted by the script (import specifiers and JSX sites):
  - `type JSX` from `solid-js` to `@solidjs/web`: 296 imports. `type ComponentProps` the same way: 7 (2.0's `solid-js` version takes only components, so `ComponentProps<'svg'>` broke every icon).
  - `solid-js/web` to `@solidjs/web`: 27 imports and 3 `vi.mock` calls in tests. `solid-js/store`: none in the app.
  - `terracotta` to `terracotta/<entry>`: 93 specifiers in 27 files. Entries used: button, checkbox, color-scheme, combobox, dialog, disclosure, listbox, menu, popover, radio-group, states (`AutocompleteStateChild`, `DisclosureStateChild`), tabs, toggle, transition.
  - `@solidjs/start`: `clientOnly` to `@solidjs/web` (16 route files, same call shape); `<HttpStatusCode code={404} />` to `httpStatus(404)` in `src/routes/[...404].tsx`.
  - `Suspense` to `Loading`: 56 imports, 63 elements, 23 comments.
  - `<Index>` to `<For keyed={false}>`: 15 imports, 23 elements. Callback shape unchanged (item accessor, numeric index).
  - `Context.Provider` to `<Context value>`: 10 elements in 9 files.
  - `onMount` to `onSettled`: 20 imports, 23 calls. A trailing `onCleanup(fn)` inside became `return fn`, because 2.0 throws `CLEANUP_IN_FORBIDDEN_SCOPE` for `onCleanup` inside `onSettled`; `onCleanup` imports left unused were dropped (14 files).
  - Router `<A>` to `<a>`: 7 imports, 10 elements. `AdminShell`'s `activeClass`/`inactiveClass`/`end` became `data-active:` classes, and `aria-[current=page]:` for the overview link that had `end`.
  - `mergeProps`, `splitProps`, `unwrap`, `ErrorBoundary`, `classList` (JSX), `solid-js/store`: no uses in the app.
- `vite.config.ts`: the `solid-js/web` and `solid-js/store` aliases, the `terracottaRoot()` plugin and the `Plugin` type import are gone.
- `src/auth/auth-client.ts`: `createAuthClient` now comes from `better-auth/client` instead of `better-auth/solid` (see Deviations).
- Typecheck: 1249 errors in 313 files before, 474 in 143 files after. None is TS2305, TS2307 or TS2724 for a renamed name. What is left of those codes is the removed APIs: `createResource` 68, `Resource` 58, `on` 13, `batch` 2, `useSubmission` 2.
  - After, by code: TS2554 100 (one-argument `createEffect`), TS2724 72 and TS2305 71 (the removed APIs above), TS7006 49 and TS7031 25 (implicit any where a resource type is missing), TS2349 46 (calling a resource), TS2322 32, TS2339 26.
  - By area: social 154, catches 114, overworld+battle 98, shell+routes 77, styled 30, tests 1.
- terracotta 2 and 2.0 JSX prop errors now visible (TS2322):
  - terracotta components: `Button` with a boolean `aria-pressed` (`styled/list.tsx`), `Checkbox` with a boolean `aria-checked` (`styled/checkbox.tsx`), `ComboboxInput` boolean `aria-*` (`styled/combobox.tsx`), `MenuItem as="button"` with a boolean `aria-disabled` (`styled/menu.tsx`), `DisclosureButton` with `aria-invalid={true}` (`styled/select.tsx`), a `Disclosure` heading with `tabIndex` (`battle/battle-view/results/index.tsx`).
  - Plain elements, same cause: 24 errors where an `aria-*` gets a boolean (2.0 types want `"true"`/`"false"` or removal), 2 `tabIndex` and 2 `maxLength` (2.0 wants lowercase built-in attributes). No terracotta prop was renamed or removed outright.

## Deviations

- `src/auth/auth-client.ts` switched to the plain Better Auth client. With the aliases gone, `vite build` failed on `better-auth/solid`'s `solid-store.mjs`, which imports `solid-js/store` and uses the 1.x path setter. The app only reads `$store.atoms.session` and calls methods, which the plain client has. After the switch, `vite build` fails only on `createResource`.
- `ComponentProps` moved to `@solidjs/web` with `JSX`. It is not in the spike's list, but it is the same kind of import move.
- `src/components/CLAUDE.md` still names `Suspense` (and `createResource`), so the acceptance grep prints that one line. It belongs to `solid-2-conventions`, which rewrites the sentence as a whole.
- Where a file had Solid imports split around other imports, the merged Solid imports now sit at the first one's place (for example `src/auth/context.tsx`). Only the order moved.
- The acceptance criterion "`oxlint` exits 0" cannot pass yet: the lint is type-aware, and the base already had 1525 errors (`no-unsafe-*` on the unresolved types). The branch has 1132, and no new kind except `no-deprecated` on `<Dynamic>` (12 sites), which now resolves to 2.0's deprecated export.

## Stubs left

- `src/components/overworld/WorldMapCanvas.tsx`: its `onSettled` body still calls `createEffect` twice and `onCleanup` inside one of them. 2.0 forbids child computations inside `onSettled`. The effects must move to the component body (with the effect split): `solid-2-overworld-battle`.

## Gotchas

Leftovers by area, for the area children (counts are files unless said otherwise):

- styled (`solid-2-styled`): `createEffect` 12; boolean `aria-*` 15 files; `<Dynamic>` in `styled/menu.tsx`; `tabIndex` in `hover-card`; `Loading` replacing `Suspense` in `dialog.tsx` and `tabs.tsx` keeps content on refetch.
- overworld and battle (`solid-2-overworld-battle`): `createResource` 11, `createEffect` 9; `WorldMapCanvas` above; `BattleParty.tsx` calls `batch` inside its `onSettled` handler; `<Dynamic>` in `WeatherIcon.tsx`; `createStoreSignal` still 1.x.
- catches (`solid-2-catches`): `createResource` 16, `createEffect` 14; `batch` in `catch-dialog/sheet.tsx`; boolean `aria-*` 6 files; `maxLength` in `catch-dialog/sheet.tsx`.
- social (`solid-2-social`): `createResource` 26, `createEffect` 10; `<Dynamic>` in news (`markdown.tsx`, `NewsTab.tsx`), quests (`describe.tsx`), settings; `raids/raid-lobby/rows.tsx` reads `.get` off an untyped `{}`; `maxLength` in `profile/TeamsCard.tsx`.
- shell and routes (`solid-2-shell-routes`): `createResource` 15, `createEffect` 17; `useSubmission` and router `action` (deprecated, now `formAction`) in `src/auth/sprites.ts` and the sprite processor; `<Dynamic>` in `GameMenu.tsx`; `src/auth/context.tsx`'s `onSettled` subscribes and writes signals from the subscriber (fine), and its `useContext` null check is flagged as always false under 2.0 types (also on the base, with four other contexts).
- tests (`solid-2-tests`): `test/components/resource-reads.test.ts` imports `Resource`; `news.test.tsx` uses `<Dynamic>`.
- Every converted `onSettled` returns its cleanup. Do not add `onCleanup` inside one: it throws in dev.
- `data-active` marks a link whose path is a prefix of the location; `aria-current="page"` also compares the query. The admin overview link now loses its open look on `/admin?x=...`.

## Proposed learnings

- Inside `onSettled`, return the cleanup; never call `onCleanup` | 2.0 throws `CLEANUP_IN_FORBIDDEN_SCOPE` and forbids child computations there | `src` | yes (a lint or grep test over `onSettled` bodies)
- Take `ComponentProps` and `JSX` from `@solidjs/web` | `solid-js`'s `ComponentProps` takes components only | `src` | yes (oxlint `no-restricted-imports`)

## Verification

- `pnpm typecheck`: fail as expected, 1249 errors before, 474 after; no TS2305/TS2307/TS2724 for a renamed name.
- Acceptance grep: prints only `src/components/CLAUDE.md:3` (see Deviations).
- `oxlint src test`: exit 1 on base (1525 errors) and branch (1132 errors).
- `pnpm exec oxfmt --check src test e2e vite.config.ts`: clean.
- `pnpm exec vitest run test/auth/live-bag.test.ts test/components/news.test.tsx test/i18n/server.test.ts test/model/raid-watch.test.ts` (the changed tests): 4 files, 19 tests passed.
- `pnpm exec vite build`: fails only with `"createResource" is not exported` (5 reported). No `solid-js/store` or terracotta resolve error.
- Not run: `pnpm test` (the spike measured the suite under the stopgap test setup; `solid-2-tests` owns it), `pnpm test:db`, `pnpm test:e2e`, `pnpm dev`.

## Size

- Estimated M, actual M.
