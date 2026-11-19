# Outcome: solid-2-catches

## Built

- Branch `refactor/solid-2-catches`, cut from `feat/solid-2` (83df0b95a). 26 files changed under `src/components/catches`, `src/components/dex` and `src/components/items`, and two new files outside them: `src/components/app/create-load.ts` and `test/components/create-load.test.ts` (see Deviations).
- `src/components/app/create-load.ts` holds two shapes for reads a screen draws around instead of waiting on (2.0 has no read that never waits):
  - `createLoad(key, fetch)` returns `{ latest, failed, errored, refresh }`. The key goes through a memo, an effect's apply runs the fetch with a `live` flag, and the answer and failure live in signals. A null, undefined or false key asks nothing and keeps the last answer, as a 1.x resource did. `latest()` is undefined until the first answer and while the last read failed (the old `answered`/`readable`), the previous answer while a new one is asked (the old `.latest`). It never holds a `Loading`, is safe in the declaring body, handlers and timers, and runs only in the browser (server effects never apply), so the `createClientSignal` gates in front of these reads are gone.
  - `catchFailure(promise)` resolves to an `Outcome` `{ value, failure }` for an async memo whose failure the screen says as a note (the old `readable` plus `failed`).
- Resources (Decision 1), every `createResource` call in the owned paths:
  - Async memos under `Loading`, read in a child, where the child waited once: `PokedexTab`, `SpeciesFormsDialog`, `AbilityPatchDialog`, `BottleCapDialog`, `IncreasePPDialog`, `BuddyCard`, the dex entry's candy (`Outcome`) and female sheet, the bag dialog's items and candies (`Outcome`), `InventoryPicker`'s bag (`Outcome`, behind a key memo with `equals` on player and revision). `refetch()` became `refresh(memo)`; `BuddyCard`'s revision counter went with it.
  - `createLoad` where 1.x read without waiting: the catch sheet's ten reads (`detail`, `dex`, `onlyOne`, `selling`, `bag`, `buddy`, `owners`, `evolutions`, `fighting`, `candies`) and its release grace, the catch picker's registries, records, boxes and context, `BoxChip`, the boxes screen's boxes, the released list, the bag's detail panel, and the dex entry's dex entry and whole dex.
- Effects split (Decision 2): `CatchBox` (the deferred `on(rewound)` and the `onView` report), catch picker box (5), sheet (2), boxes screen, `PokedexTab`'s turn to the asked number, `InventoryPicker`, the bag dialog and body (2). Handlers called from an apply (`onView`, `onOptions`, `onShown`, `onAsk`, `onChoose`) are read in the compute and handed to the apply, so the apply reads no props.
- Owned-scope writes (Decision 3), all by derivation or moved to an apply; no `{ ownedWrite: true }` anywhere in the owned paths:
  - Writable derived signals: `BattleSection`'s moves, abilities and items (`createSignal(() => [...props.caught.moves])`), `BottleCapDialog`'s and `IncreasePPDialog`'s opening choice (from the previous choice and the record), the page clamps in `PokedexTab` and `ItemGrid`.
  - Reset-on-prop effects (`StatsSection`'s pending points, the dex entry's coat toggles) are split effects with `{ defer: true }` that write in the apply.
- `createMemo(fn, [], { equals })` in the catch picker lost its middle argument. `batch` in the sheet's release: dropped, the two writes land in one flush.
- JSX attributes: `aria-pressed`, `aria-expanded` and `aria-checked` through `spellAria` (`CatchBox`, `ItemGrid`, `box-form`); `maxLength` to `maxlength` (sheet); `draggable` spelled `'true'`/`'false'` (`CatchBox`, `catches-list/rail.tsx`).
- No file in the owned paths imports `src/components/app/resource-reads.ts` now.

## Deviations

- Decision 1 says async memos under `Loading`. The 21 reads listed under `createLoad` are not: their readers drew an empty state, read in the declaring body, or read in handlers, and 2.0 throws or holds a boundary for each. This is styled's "longhand loads stay effects where the reader must not wait", made into one helper instead of 21 hand-written effects. Social and the shell need the same, so the helper lives in `src/components/app/`.
- The catch sheet's first record no longer waits at the fallback-less `Loading` around it: the sheet holds its `Dialog` shut until the record for this id is in (it already did for later catches), so what the player sees is the same. `selling` was a plain read that held the sheet; it now answers "not yet known" (auction allowed) for the moment before it lands, and the server still refuses a second listing. The release button waits for the `onlyOne` count as in 1.x; if the count fails, the button stays live (the server refuses a last pokemon) and the "only one" note is not shown.
- The dex entry's own dex entry never waits now: the header and the portrait draw the silhouette until it lands, where 1.x held the body for it. Candy and the female sheet still hold the body once.
- Outside the owned paths, agreed by the orchestrator: `createLoad` and `catchFailure` live in `src/components/app/create-load.ts` (first written as `src/components/catches/reads.ts`), so social and the shell can use them, and `test/components/create-load.test.ts` covers `createLoad`. `resource-reads.ts` is left for `solid-2-shell-routes` to delete.

## Stubs left

- None.

## Gotchas

- **`draggable` is enumerated, not boolean.** 2.0 writes `draggable={true}` as `draggable=""`, which browsers read as `auto`. Spell it `'true'`/`'false'`. The typecheck catches it.
- **No read that never waits.** `.latest`, `answered` and plain reads in handlers have no 2.0 equivalent; `createLoad` is the answer here. Every other area with `resource-reads` imports (social: profile sheet, raid lobby) meets the same thing.
- **A reset that depends only on a prop changing** has no clean writable-derived form: the compute must read the prop and ignore it, and oxlint's `no-void` refuses `void props.x`. A split effect with `{ defer: true }` is the shape used.
- Seen in passing, outside this node: `styled/search` logs `STRICT_READ_UNTRACKED` for `terms` and `typed` read in an effect apply, `styled/search/guide.tsx:90` and `TooltipHost` read reactive values in ref callbacks (styled noted the floating-ui ones as upstream). The app shell still fails on `createResource` and a one-argument effect, so no page renders yet.

## Patterns settled (for `solid-2-conventions`)

- **`createLoad` for a read that must not wait**, `catchFailure` for a failure the screen says. An async memo under `Loading` stays the default for a child that may wait.
- **Handlers called from an apply are read in the compute**: `createEffect(() => ({ report: props.onView, view: ... }), ({ report, view }) => { report?.(view); })`.
- **An effect that computed a value to write becomes compute-returns-the-value, apply-writes-it**, with `null` meaning "nothing to write" (the picker's draft, the bag's spent stack).
- **Opening-choice signals are writable derived from the previous value** (`createSignal((was) => ...)`), declared after the accessors they read, since the compute runs at creation.

## Proposed learnings

- `refresh()` and writes to a load's key signals belong in handlers or promise callbacks | they throw `REACTIVE_WRITE_IN_OWNED_SCOPE` from a body or memo | `src/components` | no
- A read that must not wait is a `createLoad`, never a caught or `latest` read | 2.0 has no non-suspending read | `src/components` | partly (grep for `latest(` on async memos)
- `draggable` and other enumerated attributes are spelled as strings | 2.0 writes booleans as bare attributes | `src/components` | yes (typecheck refuses a boolean)
- Props read inside an effect apply are read in its compute instead | apply reads are untracked and warn | `src/components` | no

## Verification

- `pnpm typecheck 2>&1 | grep -E 'src/components/(catches|dex|items)'`: prints nothing. Whole branch: 346 errors before (114 in the owned paths), 232 after.
- `pnpm exec oxlint src/components/catches src/components/dex src/components/items` (through `rtk proxy`): exit 0, one warning (`no-unassigned-vars` on the compiler-assigned `ref={shelves}`, present before).
- `pnpm exec oxfmt --check` on the owned paths: clean.
- `pnpm exec vitest run test/items test/model/pokedex.test.ts test/components` (the tests that import owned paths, plus the component tests): 12 files, 89 tests passed. `create-load.test.ts` mocks `solid-js` with its browser build, since the suite runs on the server build where effects never apply; it checks the first answer, the answer kept while a new key loads, no fetch for an equal or empty key, `refresh`, a failure, an answer to a replaced key landing late, and an answer landing after disposal. The last two fail with the `live` guard removed.
- Runtime, on `pnpm dev` with `pnpm db`, through a scratch harness module (deleted, never committed) injected into the dev page and driven by Playwright: `createLoad` gave its first answer, kept it while a new key was asked, asked nothing for an equal key, asked again on `refresh`, and cleared `latest` with `errored` true on a failure. `ItemGrid` over 1535 items drew 30 squares and paged from "Page 1 of 52" to "Page 2 of 52", with `aria-pressed="false"`. `CatchBox` drew 70 squares, a press reached `onOpen`, `onView` reported `1-30/70`. No diagnostics from the owned code. `pnpm db:stop` run, dev server killed, `ps` shows no vite or `pnpm dev` of this repo.
- Not run: `pnpm test`, `pnpm test:db`, `pnpm test:e2e`.
- Still owed once the shell renders: open a catch sheet (favourite, candy, release), the boxes screen, the dex and a dex entry, the bag and the item picker in the app.

## Size

- Estimated L, actual L.
