# Outcome: solid-2-styled

## Built

- Branch `refactor/solid-2-styled`, cut from `feat/solid-2` (c5825f816). 25 files changed under `src/components/styled` and `src/components/sprites`, one of them new: `src/components/styled/aria.ts`. Nothing in `src/components/icons*` needed a change.
- Effects split into compute and apply (Decision 2), cleanups returned from the apply instead of `onCleanup`: `dismiss.ts`, `gone.ts`, `tooltip.tsx`, `combobox.tsx`, `hover-card/index.tsx` (2), `search/index.tsx` (2), `search/suggestions.tsx`, `sprites/AnimatedSprite.tsx` (3), `sprites/AtlasSprite.tsx`, `sprites/TrainerSprite.tsx`. The sprite loads stay longhand loads in an effect, not async memos: a sheet still loading draws an empty box and must not hold a `Loading` boundary. `AtlasSprite` and `TrainerSprite` now read `props.sheet` through a memo (`effect-props`).
- Writes from owned scope (Decision 3), all solved by derivation; no `{ ownedWrite: true }` anywhere in the owned paths:
  - `Dialog`'s `showing`: `createSignal(() => props.isOpen)` (writable derived signal) replaces the effect that copied the prop.
  - `createPager`'s page: `createSignal((at) => Math.min(at ?? 0, pages() - 1))` replaces the clamping effect.
  - hover-card's `present`: `createSignal((was) => open() || (was ?? false))` replaces the effect that set it on open; the end of the fade still writes it false.
- Contexts: `HostContext` (`portal-host.tsx`) and `Holding` (hover-card) were default-less, and 2.0's `useContext` throws `ContextNotFoundError` without a provider, so any portal or hover card outside a dialog would have thrown. Both are now `createContext<T | null>(null)`. `useToast` lost its dead null check (the default-less context throws on its own).
- Reads that lag a write (2.0 applies writes at the next flush):
  - `toast.tsx`: the handlers keep a plain `written` list beside the signal. `push` used to count the stack from `toasts()` straight after adding, which in 2.0 misses the new toast, so the stack grew one past `STACK`.
  - `search/index.tsx`: dropping a badge sent the query before the badge was gone. It now builds the query from the new list (`joinQuery`).
  - `reorder.ts`: `flush()` after a move, because the carried entry is measured in its new place in the same handler.
- `onCleanup` outside an owner: `key-bind.tsx` registered it inside a click handler and hover-card's `settle` inside another card's teardown; neither would ever run. Both now keep a `stop` function that the component's own `onCleanup` calls.
- `menu.tsx`: `<Dynamic>` (deprecated) became `const Icon = dynamic(() => props.icon)`.
- JSX attribute types: `tabIndex` became `tabindex` (hover-card). Boolean `aria-*` values go through `spellAria(on)` from `src/components/styled` (also `styled/aria.ts`), which gives `'true'`, `'false'` or `undefined`, the same output 1.x wrote: checkbox, combobox, list, menu, select, text-field, textarea, search and its suggestions; the sprites' `aria-hidden` became `'true'`.
- `tooltip.tsx`: the notch's `ref` read `notch()` in the binding, which 2.0 warns about; it now reads it untracked inside the ref callback.
- `hover-card/safe-area.ts`: the dev hook was already behind `!isServer`; it now also asks `typeof window !== 'undefined'`, since a test compiled for the browser runs on Node where `isServer` is false.
- `Loading` in `dialog.tsx` and `tabs.tsx` left as the codemod made it: once content shows, a refresh keeps it on screen, which is what `dialog-transitions` wanted from `.latest` in 1.x.

Dialog check (`dialog-transitions`): `/` and `/demo/kit` render only the shell's `MISSING_EFFECT_FN` error, from unmigrated shell code (`solid-2-shell-routes`). So the check ran on `pnpm dev` with a scratch harness module (deleted, never committed) that rendered the styled `Dialog`, `Menu`, `TooltipHost` and a pager into the body, with the `#portals` container inside the render root, driven by Playwright:

- Open: `data-open` set, overlay and panel `TransitionChild`s at `enter-to` (opacity 0.80 and 0.67 at 60 ms), all three `entered` at full opacity after.
- Escape: `data-open` gone at once, both children `leave-to` and `inert` while fading, the dialog unmounted after the fade; reopened and closed again by its own Close button the same way. The `Transition` wrapper itself stays at opacity 1 throughout.
- Pager turns a page; menu opens in the portal, `aria-disabled` reads `"false"`/`"true"`, a real click on an item runs `onSelect`; tooltip shows on hover and goes on leave.

## Deviations

- None outside the owned paths. The dialog check used a harness instead of the app, because the app shell does not render on the branch yet.

## Stubs left

- None.

## Gotchas

- **Default-less contexts throw.** `createContext<T>()` with no default throws `ContextNotFoundError` from `useContext` outside a provider, and so does a provider given `value={undefined}`. An optional context is `createContext<T | null>(null)`. The codemod's note that `useContext` null checks are "always false" in `src/auth/context.tsx` and four other contexts means those checks are dead and the call throws instead: each area must decide per context whether a missing provider is a bug (keep default-less, drop the check) or normal (default `null`).
- **Boolean `aria-*` is a bare attribute in 2.0.** `aria-pressed={true}` writes `aria-pressed=""`, which is neither true nor false to a screen reader or to Tailwind's `aria-*:` variants, and `false` removes it. The 24 boolean `aria-*` sites in other areas need `spellAria` (exported from `../styled`), not just a cast.
- **Delegated events are per render root.** A portal container outside the element passed to `render`/`hydrate` gets no delegated `onClick` from a trusted click. The app is fine (the body is the root and `#portals` is inside it), but a test that renders into a div and portals to the body will see clicks do nothing.
- **Read after write lags.** A handler that sets a signal and then reads it (or measures DOM the write changes) sees the old value. Compute from the value written, keep a plain mirror, or `flush()` when the DOM has to move first.
- **`onCleanup` needs an owner.** Inside an event handler or another teardown it warns `NO_OWNER_CLEANUP` and never runs; inside `onSettled` or a ref callback it throws. Keep the teardown in a variable and call it from the component's own cleanup.
- terracotta 2 (for the other areas): no prop was renamed in the components used here. Changes seen: `TransitionChild` sets `inert` on itself while leaving and while hidden under `unmount={false}` (so the dialog's own `pointer-events-none` is now belt and braces); the state children (`DisclosureStateChild` and the like) treat a function child as a render prop only when it declares exactly one parameter; `Button`, `MenuItem` and the panels attach their native listeners from split effects, and the disclosure state calls `onChange` from handlers, so a signal written in `onChange` is fine.
- solid-floating-ui 2: same API (`useFloating`, `refs.setReference`/`setFloating`/`setPositionReference`, `floatingStyles`, `isPositioned`, `middlewareData`). Its `setReference` reads a reactive value inside a ref callback and some of its effects read merged options in the apply, so dev logs `STRICT_READ_UNTRACKED` warnings from inside the library on every tooltip. Harmless; upstream.
- Unmigrated outside this node and seen in passing: the shell throws `MISSING_EFFECT_FN` on `/` (one-argument `createEffect`), so no page of the app renders on the branch yet.

## Patterns settled (for the next areas and `solid-2-conventions`)

- **Effect split shape.** `createEffect(source, (value) => { ...; return cleanup; })`. The compute is a signal or memo accessor where there is one (`createEffect(open, (isOpen) => ...)`), or returns `null`/`undefined` for "nothing to do" so the apply starts with one guard. Early returns in the apply are `return undefined;` when other paths return a cleanup (oxlint's consistent return). Several sources go in an object from the compute; it is not compared, so the apply runs whenever any source changes, the same as a 1.x effect.
- **Mirror effect to writable derived signal.** An effect that copies a prop into a local signal (`createEffect(() => setX(props.x))`) becomes `const [x, setX] = createSignal(() => props.x)`; one that adjusts the last value (a clamp, a latch) uses the previous value: `createSignal((was) => f(was))`. Local writes still land; a source change recomputes with the written value as `was`. This is Decision 3's "derive with a memo" for state that is also written.
- **Longhand loads stay effects where the reader must not wait.** A load whose empty state is drawn (a sprite sheet) stays an effect with a `live` flag returned as cleanup, not `createMemo(async)`, so it never holds a `Loading` boundary.
- **`spellAria(on)`** for every boolean `aria-*`.
- **Optional context defaults to `null`.**
- **Teardown made in a handler** is kept in a `stop` variable and called by the component's own `onCleanup`.
- **`flush()` in a handler** only where the same handler measures DOM the write moves (`reorder.ts`).
- `onCleanup` in a component body still works and was kept where the body only tears down state made by handlers (`toast.tsx`, `reorder.ts`, `long-press.ts`, `search/index.tsx`); setup-with-teardown is `onSettled` returning the cleanup, as the codemod left it.

## Proposed learnings

- A default-less context throws without a provider; optional contexts default to `null` | 2.0 `useContext` throws `ContextNotFoundError` | `src` | yes (a grep test for `createContext<...>()` paired with a `== null` check)
- Boolean `aria-*` goes through `spellAria` | 2.0 writes booleans as bare attributes | `src/components` | yes (typecheck already refuses a boolean)
- A handler never reads a signal it just wrote | 2.0 applies writes at the next flush | `src` | no
- A portal container sits inside the render root | 2.0 delegates events per root | `src/app.tsx`, tests | no

## Verification

- `pnpm typecheck 2>&1 | grep -E 'src/components/(styled|icons|sprites)'`: prints nothing. Whole branch: 474 errors before (30 in owned paths), 444 after.
- `pnpm exec oxlint src/components/styled src/components/sprites src/components/icons src/components/icons.tsx` (through `rtk proxy`): exit 0, warnings only (`unbound-method` on terracotta's `disclosure.isOpen`/`close` in `combobox.tsx`, `no-unassigned-vars` on the compiler-assigned `ref={indicator}`/`ref={canvas}` lets, one `no-useless-spread`), all present before. No new error kind.
- `pnpm exec oxfmt --check` on the owned paths: clean.
- `pnpm exec vitest run test/components` (holds the only tests that import owned paths, `pager.test.ts` and `arrange.test.ts`): 9 files, 64 tests passed.
- Dialog, pager, menu and tooltip check on `pnpm dev` with `pnpm db`, through a scratch harness and Playwright, as under Built. `pnpm db:stop` run; dev server killed; `ps` shows no vite or `pnpm dev` process.
- Not run: `pnpm test`, `pnpm test:db`, `pnpm test:e2e`.

## Size

- Estimated L, actual M. Most of the 53 files only needed the codemod's renames; the work was in 25.
