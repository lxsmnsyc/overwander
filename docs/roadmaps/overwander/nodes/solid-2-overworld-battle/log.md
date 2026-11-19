# Log: solid-2-overworld-battle

- Branch `refactor/solid-2-overworld-battle` from `origin/feat/solid-2` (7ed8b5133). `pnpm install`: already up to date. No earlier log; nothing of the node existed.
- Baseline `pnpm typecheck`: 444 errors on the branch, 98 in the owned paths.
- `createStoreSignal` first: `createMemo(() => from(subscribe))`, the current value handed over inside the subscribe so the first read never waits. Checked in Node (dev build): first value without a loading frame, updates land after a microtask, coalesced, unsubscribed on dispose, no owned-write diagnostic when a store is set from a body, a memo or `onSettled`.
- Experiments in Node before choosing the resource shapes:
  - `latest(fn)` on a memo with no value yet throws `NotReadyError`; so does an untracked read (a handler, a timer). Catching it in a memo logs `CAUGHT_REACTIVE_READ`. There is no "never wait" read in 2.0.
  - An async memo given an initial value still suspends.
  - A writable async signal (`createSignal(fn)` returning a promise) accepts an updater and recomputes on its source: the 1.x `mutate`.
  - An effect apply that returns a non-function (`(v) => log.push(v)`) halts the reactive system (`REACTIVITY_HALTED`). Applies are written with braces.
  - Writes in an effect apply are allowed and silent.
- Resources: each `createResource(source, fetcher)` became a key memo plus an async memo reading it, so a caller rebuilding an equal key does not refetch (1.x compared the source). `settled` reads became plain reads (Loading holds content on refresh). `readable`/`failed` became `<Errored>` with a fallback body (Honey tree, Portal) or a failure kept as an answer (Safari bag). `.latest` reads became nested `<Loading>` with the empty look as fallback (Gym seat) or a longhand load (Safari dex ownership, read in a handler).
- The overworld tab mounts the board under `<Show when={[buddy(), fled()]}>`: the walk and its windows read `view()` from timers, which would throw before the first answers.
- `WorldMapCanvas`: the two effects created inside `onSettled` moved to the body; the canvas pages are made lazily by the first apply; the rings read from a `Marks` object the second effect stores.
- `BattleTopBar` hung battle listeners in the body and read `props.battle` again in the cleanup (the bug `BattleParty` documents). Moved to `onSettled` with the battle held.
- oxlint on the owned paths: 16 `promise-function-async` from compute functions returning a promise or a plain value; fixed with `async` or an explicit union return type. Then exit 0.
- Runtime: `/` still renders only the shell's error (unmigrated `createResource` in the shell). Scratch harness (deleted) on `pnpm dev` + `pnpm db`, driven by Playwright: a `createStoreSignal` count follows `store.set`, `WorldMapCanvas` paints 200x200 and repaints on pan, no reactivity diagnostics from the owned code. Dev and db stopped.
