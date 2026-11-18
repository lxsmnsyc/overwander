---
name: async-reads
description: >
  A component that declares an async memo must not read it. The
  declaration lives in one component body and every read lives in a
  child, under `Loading`. A read that must not wait is a `createLoad`,
  a subscription is a `from` inside a memo, and a failure is caught by
  `Errored` or `catchFailure`. Applies whenever adding an async read to
  a component, writing a component that reads one, or writing an effect
  that loads.
---

An async memo is `createMemo` over a function that returns a promise. Reading one that has no value yet **holds**: the nearest `Loading` **above the reading body** shows its fallback until the value lands. A component that both declares the memo and reads it is caught by whatever wraps the component itself, which in this app is the boundary around the whole page in [`app.tsx`](../../../src/app.tsx). A `Loading` written inside that same body is below the read and never sees it.

So the declaring body is kept clean of reads, and the reading body is a child that the declaring body wraps in `Loading`. The child can hold as long as it likes: the boundary is above it, its parent stays put, and the memo survives.

```tsx
function Watchers(props: { names: Accessor<Map<string, Profile>> }): JSX.Element {
  return <For each={[...props.names().keys()]}>{(uid) => <Row uid={uid} />}</For>;
}

export default function Outer(props: { watching: string[] }): JSX.Element {
  // Keyed on who is watching, so a list rebuilt with the same people
  // in it does not ask again
  const asked = createMemo(() => [...new Set(props.watching)].sort().join(','));
  const names = createMemo(async (): Promise<Map<string, Profile>> => {
    return getProfiles(asked().split(','));
  });

  return (
    <Loading fallback={<Note>Reading the room</Note>}>
      <Watchers names={names} />
    </Loading>
  );
}
```

The memo is handed down as the accessor itself, not as a value: passing `names()` would be a read in the outer body.

## Illegal: all of these read the memo in the declaring body

```tsx
const data = createMemo(async () => load(props.id));

const foo = createMemo(() => data()); // illegal

createEffect(
  () => data(), // illegal
  (value) => {
    report(value);
  },
);

const bar = () => data();
createEffect(
  () => bar(), // also illegal: bar reads it
  (value) => {
    report(value);
  },
);

return <h1>{data()}</h1>; // illegal
```

A helper does not launder it. Anything the declaring body calls that reaches `data()` is a read in the declaring body.

## The key goes through a memo first

A 1.x resource compared its source and asked again only when it changed. An async memo asks again whenever **anything it read** changes. Put the key in a memo of its own and read that: a string or a number compares by value, so a caller that rebuilds an equal key asks nothing. The `asked` memo above is the shape. For an object key give the memo an `equals`.

A key that can be empty is a **non-async** compute that returns `Promise<T> | null`, because an async compute is pending even for its null case:

```tsx
const record = createMemo((): Promise<Thing> | null => {
  const id = props.id;

  return id == null ? null : getThing(id);
});
```

oxlint's `promise-function-async` flags a compute that returns a promise without being `async`. Annotate the union return as above; do not add `async` to quiet it.

## Where the load is the browser's alone

An async memo runs during the server render. Gate the key on [`createClientSignal`](../../../src/components/app/client-signal.ts) where the load is the browser's alone: a fetch of the player's own data, anything reading storage or measuring the window. A key that answers null does not call the fetcher, so the server pass and the hydrating pass go straight through.

```tsx
const client = createClientSignal();
const mine = createMemo((): Promise<Thing[]> | null => (client() ? listMine(props.player) : null));
```

## Refreshing, pending and keeping the screen

- **`refresh(memo)`** asks the same question again, in a handler or a promise callback. It returns a promise, so `refresh(memo).catch(() => undefined)` where nothing else listens. Called from a component body or a memo it throws `REACTIVE_WRITE_IN_OWNED_SCOPE`.
- **`Loading` keeps what it shows.** Once its content has shown, a refresh or a new key leaves the content on screen and the fallback does not return. The 1.x `settled` and `.latest` workarounds are gone: read the memo plainly.
- **`isPending(() => memo())`** says a change is in flight, for a "saving" look beside content that stays. `latest(memo)` peeks at the in-flight value. Neither is a read that never waits: with no value yet they hold or throw like any other read.
- **A refresh quietly reveals the new value.** Declare what a write will change with `affects(memo)` before `refresh` where the screen should read as pending.

## Failures

A rejected read throws at the reader, and the nearest `Errored` above it catches it. Where the screen says the failure as a note and still draws the body, the fallback renders the same body:

```tsx
<Loading fallback={<Note>Counting</Note>}>
  <Errored fallback={(error) => <Body jars={() => 0} failed={describeFailure(error())} />}>
    <Body jars={jars} failed={null} />
  </Errored>
</Loading>
```

Where a body that also declares an effect reads the answer, an `Errored` around it would replace the whole body, and an effect's throw has no boundary at all. Resolve the read to data with [`catchFailure`](../../../src/components/app/create-load.ts) instead: it gives `{ value, failure }`, never throws, and the reader says `failure` as a note.

```tsx
const bag = createMemo(() => catchFailure(getBag(props.player)));
```

## A read that must not wait: `createLoad`

2.0 has no read that never waits. `latest` on a memo with no value yet throws, an initial value does not stop an async memo from holding, and catching the throw logs `CAUGHT_REACTIVE_READ` and stops working. Where the reader draws an empty state, reads in the declaring body, or reads in a handler or a timer, use [`createLoad`](../../../src/components/app/create-load.ts): it asks in an effect, keeps the answer in signals, and never holds a `Loading`.

```tsx
const load = createLoad(
  () => props.player,
  (player) => listAuctionsBy(player),
);
// Safe in the declaring body: undefined until the first answer, the
// previous answer while a new one is asked
const lots = (): Lot[] => load.latest() ?? [];
```

- The key goes through a memo inside, and a null, undefined or false key asks nothing and keeps the last answer.
- `failed()` is what the failure says, `errored()` whether there was one, `refresh()` asks again.
- It runs only in the browser, so no `createClientSignal` gate is needed in front of it.
- A `Loading` with the empty look as its fallback, nested around the one part that reads, is the other shape where the reader may hold for a moment.

Code that reads a memo from a timer, a handler or a `src/game` module handed an accessor must mount only once the data has landed. An untracked read of a pending memo throws `NotReadyError`. Mount it under `<Show when={[a(), b()]}>` inside the `Loading`, as the overworld tab does for its board.

## Live feeds

A subscription is `from` inside a memo, and it opens during the server render, where there is no socket. Go through [`watchLive`](../../../src/components/app/watch.ts) for a feed that follows a key: it opens nothing on the server or for a null key, is null until the first answer, and reopens when the key changes.

```tsx
const profile = watchLive(
  () => props.uid,
  (uid, set) => followProfile(uid, set),
);
```

Where "not answered yet" and "answered with no row" must differ, wrap the answer before it reaches `watchLive`: `{ record }`.

A bare `createMemo(() => from(...))` is for a screen that already waits. Where the reader draws an empty state, seed it, or it holds the nearest `Loading` until the first value:

```tsx
const rows = createMemo(() =>
  from<Row[] | undefined>((set) => {
    set(undefined);
    return followRows(props.player, set);
  }),
);
```

## An effect that only loads is a `createLoad`

A `createSignal` and a `createEffect` whose whole purpose is to fetch something and put it in the signal is `createLoad` written out longhand, with the stale-answer guard kept by hand. Keep the longhand where the effect does more than load: where it also writes something else, where the value is seeded by a load and then written again as the player acts, or where one signal is set by both a load and a press (a sprite sheet that draws an empty box while it loads is the example, in `AnimatedSprite`).

## Around it

- [`TabPane`](../../../src/components/styled/tabs.tsx) carries a boundary, so a panel it renders is already a child of one.
- The house [`Dialog`](../../../src/components/styled/dialog.tsx) carries a `Loading` around its panel, with no fallback, so a read inside a panel holds the panel rather than the page. A headless dialog carries none: portalled markup keeps its owner, so a read inside one reaches whatever boundary is above the component and closes the dialog on the way out.
- A `Loading` with no fallback around something that appears later still holds the whole transition. Where the reader can draw without the data, use `createLoad`.

## Which side of the boundary a computation goes

**Derived signals go outside.** A memo or an accessor over props, plain signals or anything else that cannot hold belongs in the declaring body, above the boundary, and is handed down. Kept inside, it is recomputed under a subtree that stops while the data is in the air, and the parent cannot read it at all.

**Effects that read go inside.** A `createEffect` whose compute reads the memo, or anything that reaches it, belongs in the child, under the boundary. In the declaring body it holds the page. An effect that writes a signal the outer body owns still lives inside; it is handed the setter.

```tsx
function Inner(props: { data: Accessor<Thing[]>; wanted: Accessor<string> }): JSX.Element {
  // Under the boundary: it may hold, and it runs when there is
  // something to run on
  createEffect(
    () => ({ count: props.data().length, wanted: props.wanted() }),
    ({ count, wanted }) => {
      report(count, wanted);
    },
  );

  return <For each={props.data()}>{(thing) => <Row thing={thing} />}</For>;
}
```
