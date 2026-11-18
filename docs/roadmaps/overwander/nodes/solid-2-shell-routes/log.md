# Log: solid-2-shell-routes

- 2026-11-18: branch `refactor/solid-2-shell-routes` cut from `origin/feat/solid-2` (9659e9a4b), `pnpm install` up to date.
- Typecheck before: 77 errors, 76 in the owned paths, 1 in `test/components/resource-reads.test.ts`.
- Migrated resources, effects, `useSubmission`, `Dynamic`, boolean `aria-*`, the contexts and the `from` guards (see outcome). Typecheck after: 0 in `src`.
- Runtime, first pass: `PENDING_ASYNC_UNTRACKED_READ` in `BattleData`'s `Loaded` (read in the body). Now a `Show` over a memo that resolves to `true`.
- `LoginForm` held the whole sign-in card for 500 ms (`SILENT_HOLD`) while the provider list loaded under a fallback-less `Loading`. Now a `createLoad`, so nothing waits.
- The team picker never picked: `catch-picker/box.tsx` set the draft and then told the caller `draft()`, which still held the value before the write. Fixed there (outside the owned paths, recorded as a deviation) so a duel could be started.
- `MoveDemo`: moving `params.giant` into the apply had dropped it from the sources; it is in the compute again, as 1.x tracked it.
- Demo pages that build a stage from the address read the search params once through `untrack` (`BattleViewDemo`, the teaser), and the teaser's battle scene takes its fight through a keyed `Show`.
- Duel run twice with alice and bob: started, finished (Victory and Defeat screens on the two sides), Leave back to the overworld.
- `pnpm exec vite build`: exit 0, 18.5 s.
- Dev server and dev database stopped. A Chrome process from `e2e/run.mjs --only website` (another project) was running on the machine; not touched.
