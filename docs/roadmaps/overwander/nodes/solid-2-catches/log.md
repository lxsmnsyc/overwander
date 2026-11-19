# Log: solid-2-catches

- 2026-11-18: branch `refactor/solid-2-catches` cut from `origin/feat/solid-2` (83df0b95a). Whole-branch typecheck 346 errors, 114 in the owned paths across 26 files.
- Plain async memos under `Loading` where the reader was a child that waited once (`settled`, plain reads): the dex tab, the forms dialog, the patch, cap and PP dialogs, the buddy card, the dex entry's candy and female sheet, the bag dialog and the item picker.
- The catch sheet, the pickers, the box chip, the boxes screen, the released list, the detail panel and the dex entry's own dex read through `.latest`, `answered` or plain reads in handlers. 2.0 has no read that never waits, so these became `createLoad` (new, `src/components/catches/reads.ts`): a key memo, an effect whose apply fetches with a `live` flag, and signals for the answer and the failure.
- `readable`/`failed` under a `Loading`: the read resolves to an `Outcome` through `catchFailure`, as Safari's bag did in overworld-battle.
- Mirror effects: `BattleSection`'s three lists, the patch dialogs' opening choice, the dex and item tray page clamps became writable derived signals. Reset-on-prop effects (`StatsSection`, the dex entry's coat) stay split effects with `defer`: a derived signal needs a read of the prop it ignores, which oxlint's `no-void` refuses.
- `draggable` is enumerated: `true` became `'true'` (CatchBox drag handlers, the boxes rail).
- Harness on `pnpm dev` + `pnpm db` (scratch `src/zz-harness.tsx`, deleted): createLoad first answer, keeps the last answer while asking, equal key asks nothing, refresh asks again, a failure clears `latest` and sets `errored`. ItemGrid pages 1 of 52 to 2 of 52, `aria-pressed="false"`. CatchBox draws 70 squares, a press reaches `onOpen`, `onView` reports `1-30/70`. Dev and db stopped.
- Typecheck whole branch 346 before, 232 after; owned paths 0.
- Orchestrator: moved `createLoad` and `catchFailure` to `src/components/app/create-load.ts` for social and the shell; added `test/components/create-load.test.ts` (browser build of `solid-js` through `vi.mock`, 4 cases).
- Review fixes: race and dispose cases in `create-load.test.ts` (both fail without the `live` guard), a doc line on where `refresh()` and key writes may run, and the release button waits for the `onlyOne` count again (live if it fails, note only when it says so).
