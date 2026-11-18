---
name: effect-props
description: >
  An effect wakes on its sources changing, not on its answer changing.
  A component whose effects do stateful work (loading a sheet, starting
  a playhead, opening a subscription) reads those props through memos,
  so a caller that rebuilds its list does not restart everything in it.
  The same page holds how an effect is split, how it writes, and what a
  write looks like to the next read. Applies whenever writing or
  reviewing a component with a `createEffect`, `onSettled` or a signal
  written from a handler.
---

`createEffect` takes two functions. The **compute** reads and tracks. The **apply** receives what the compute returned, runs untracked, and may return a cleanup. Effects never compare: the apply and the previous cleanup run every time the compute re-runs, even when it returned an equal value.

So an effect wakes whenever a signal its compute read updates, whatever the new value is. Reading `props.species` in the compute subscribes the effect to whatever that prop is derived from, so an unchanged species still wakes it if the accessor behind it changed.

That happens constantly in lists. A box of thirty squares rebuilds every entry when one of them is picked or a page turns, and every square's props are new objects saying exactly what they said before. An effect that reloads a sheet, calls `play()` on a playhead or opens a subscription then does all of it again, thirty times, for nothing. What the player sees is the whole box flinch.

## The rule

Props that an effect reads go through a memo first, and the compute reads the memo.

```tsx
// Wakes whenever the caller rebuilds its entries
createEffect(
  () => ({ species: props.species, shiny: props.shiny === true }),
  ({ species, shiny }) => {
    load(species, shiny).then(setSheet);
  },
);

// Wakes when the species or the coat actually changes
const drawing = createMemo(() => props.species);
const sparkling = createMemo(() => props.shiny === true);

createEffect(
  () => ({ species: drawing(), shiny: sparkling() }),
  ({ species, shiny }) => {
    load(species, shiny).then(setSheet);
  },
);
```

A memo propagates on `===`, so one over a primitive stops the churn dead. Keep one memo per value rather than one over an object: an object memo is a new object every time and propagates as freely as the prop did. The object the compute returns is not compared either, which is fine: it is only handed to the apply.

## Shape of the split

- **The compute is a signal, a memo, or a small object of them.** `createEffect(open, (isOpen) => { ... })` when there is one source. Returning `null` or `undefined` for "nothing to do" lets the apply open with one guard.
- **The apply reads nothing reactive.** A prop read in the apply is untracked and dev warns. A handler the apply calls (`props.onView`) is read in the compute and handed over: `createEffect(() => ({ report: props.onView, view: view() }), ({ report, view }) => { report?.(view); })`. A value the apply needs but must not wake for is read with `untrack(...)`.
- **Write the apply with braces.** An apply that returns something that is not a function **halts reactivity app-wide** (`REACTIVITY_HALTED: effect callback returned an invalid cleanup value`). `(value) => setX(value)` and `(value) => list.push(value)` return a value. Write `(value) => { setX(value); }`. Where some paths return a cleanup, the others `return undefined;`.
- **Setup with teardown is `onSettled` returning the cleanup.** It runs once in the browser, after the first settle, and never on the server. Do not call `onCleanup` inside it: 2.0 throws `CLEANUP_IN_FORBIDDEN_SCOPE`, and child computations are forbidden there too.

```tsx
onSettled(() => {
  const id = setInterval(tick, 1000);

  return () => {
    clearInterval(id);
  };
});
```

- **`onCleanup` in a component body** still works where the body only tears down state its handlers made. Inside a handler or another teardown it has no owner, warns, and never runs. Keep the teardown in a `stop` variable and call it from the component's own cleanup.
- **`{ defer: true }`** skips the first run. A reset that only follows a prop changing is a split effect with `defer`, writing in the apply.

## When it does not matter

Reading props straight is right in JSX and in memos, which recompute cheaply and settle by value. The memo rule is about effects, and among effects only the ones whose re-run costs something or throws away state: a fetch, a playhead, a canvas, a timer, a subscription. An effect that only writes a signal from a value can read props as it likes.

## Writes

A write from owned scope (a component body, a memo, an effect compute) throws `REACTIVE_WRITE_IN_OWNED_SCOPE`. Take them in this order:

1. **Derive it.** An effect that copies a prop into a local signal is a writable derived signal: `const [x, setX] = createSignal(() => props.x)`. One that adjusts the last value (a clamp, a latch) reads the previous one: `createSignal((was) => Math.min(was ?? 0, pages() - 1))`. Local writes still land, and a source change recomputes with the written value as `was`. Declare it after the accessors it reads, since the compute runs at creation.
2. **Move it to an apply, a handler or `onSettled`.** Writes there are allowed.
3. `{ ownedWrite: true }` only as a last resort, with a comment saying why. None exists in `src` today.

A context value that changes is passed as an accessor: a provider reads `value` once.

## A write is not visible yet

`setX(v); x()` returns the **old** value until the next microtask, and a store from `src/game` read through `createStoreSignal` lags the same way. Three consequences:

- **A handler that writes then tells a caller passes the value it computed**, never a read of the signal: `setDraft(next); props.onPick(next);`.
- **A handler that counts or measures from what it just wrote** builds the new list first, or keeps a plain mirror beside the signal, or calls `flush()` when it must measure DOM the write moves (`reorder.ts`). `flush()` drains signal writes; it does not pull a store change through `createStoreSignal`, so a test that sets a store and reads the signal still sees the old value until the microtask.
- **Do not read through `await` what a write has not reached.** Component tests call `flush()` after a write and before a read.

## Lists and helpers

- Helpers that take props take **getters**, not values read in the body: `createLotActions({ player: () => props.player })`. A value read in the body is read once, untracked, and dev warns.
- A library ref callback that reads a reactive value (`floating.refs.setReference`) goes inside `untrack(...)`.
- `<For each={list}>` hands the row as a value and the index as an accessor. `<For each={list} keyed={false}>` hands the row as an accessor and the index as a number, which is the old `<Index>`: read the accessor in JSX, a memo or an effect compute, never at the top of the callback. Where row identity is unstable (rows rebuilt each time), give `keyed={(row) => row.label}`, or dev reports `UNSTABLE_LIST_IDENTITY`. A `keyed` function hands the row as an accessor too, so the same reading rule applies.
