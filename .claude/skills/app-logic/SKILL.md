---
name: app-logic
description: >
  The game's state and rules live in src/game as plain TypeScript stores,
  and its drawing lives in src/canvas as plain functions. Components read
  stores through createStoreSignal and forward input as calls. Applies
  whenever adding state, a rule or a draw loop to a screen, or touching
  src/game, src/canvas or a component that mounts one of them.
---

**A component draws and forwards. It does not decide.**

Lint refuses `solid-js` and any `components` import under `src/game` and `src/canvas`, so the line holds by itself once code is on the right side of it.

## State and rules: `src/game`

- **A store is the state.** `createStore(initial)` from `src/game/store.ts` gives `get`, `set`, `update` and `subscribe`. Setting an equal value tells nobody.
- **A module is a function that returns its stores and its actions:** `createBoardWalk(deps)`, `createBattleWatch(active, player, events)`, `createCandyFeed(deps)`. Anything with timers or subscriptions hands back a `dispose` or a stop function.
- **The interface is reached through callbacks, never imported.** A toast, a sound, a form or a conversation is a function in the module's deps or events (`failed`, `remark`, `settled`, `talk`). A result that deserves a sound says so as data, the way `Spent.cue` does.
- **What a component computes later is handed over with `attach`.** When the module needs something the component defines further down (the board's view, what a cell holds), the module is created first and the component calls `module.attach({...})` once those exist. Until then the module reads nothing.
- **Reactivity becomes a check or a subscription.** An effect that followed a prop becomes a store subscription inside the module, or a component effect that calls the module (`walk.refresh()`, `view.invalidate()`).
- **Tested without a DOM**, with `src/auth` mocked, under `test/game/`.

## Drawing: `src/canvas`

- A draw loop is a function that takes its elements and its options and returns a teardown: `createBattleField(canvas, floor, props)`, `createChunkView(elements, props, settings)`.
- The component passes its own props object, so the loop reads every prop as it draws. A redraw the loop cannot see coming is asked for with `invalidate()` from a component effect.
- Settings are passed in as a getter, since the settings signal is the interface's.

## In the component

- `createStoreSignal(store)` from `src/components/app/store-signal.ts` turns a store into a signal for as long as the component lives.
- Create the module in the component body, start it in `onMount`, and hand its stop to `onCleanup`.
- Keep the words, the dialogs, the toasts and the sounds here.

## What stays in a component

An action that is one server call and a toast, and view state (scroll windows, drag and drop, selection, drafts). Moving those adds a layer and separates nothing.
