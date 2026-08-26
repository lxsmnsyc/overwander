---
name: resource-suspense
description: >
  A component that calls `createResource` must not read it. The
  declaration lives in one component body and every read of the data
  signal lives in a child, wrapped in `Suspense`. Applies whenever
  adding a resource to a component or writing a new component that
  reads one.
---

Reading a resource that is still loading **throws**. The throw happens in the body that read it, and the boundary that catches it is the nearest `Suspense` **above** that body — so a component that both declares a resource and reads it is caught by whatever wraps the component itself, which in this app is the boundary around the whole page in [`app.tsx`](../../../src/app.tsx). A `Suspense` written inside that same body is below the throw and never sees it.

So the declaring body is kept clean of reads, and the reading body is a child that the declaring body wraps in `Suspense`. The child can suspend as much as it likes: the boundary is above it, its parent holds still, and the resource survives.

## Illegal — all of these read the signal in the declaring body

```tsx
const [data] = createResource(...);

const foo = createMemo(() => data());   // illegal

createEffect(() => {
  data();                               // illegal
});

const bar = () => data();

createEffect(() => {
  bar();                                // also illegal — bar reads it
});

return <h1>{data()}</h1>;               // illegal
```

A helper does not launder it. Anything the declaring body calls that reaches `data()` is a read in the declaring body.

## Legal — split into two components

```tsx
function Outer(): JSX.Element {
  const [data] = createResource(() => props.player, listThings);

  return (
    <Suspense fallback={<Note>Loading…</Note>}>
      <Inner data={data} />
    </Suspense>
  );
}

function Inner(props: { data: Resource<Thing[]> }): JSX.Element {
  const shown = createMemo(() => props.data().filter(...));

  return <For each={shown()}>{(thing) => <Row thing={thing} />}</For>;
}
```

The resource is handed down as the accessor itself, not as a value — passing `data()` would be a read in the outer body.

## Around it

- `refetch` belongs to the outer body, and is handed down like the accessor when the child is what acts.
- [`TabPane`](../../../src/components/styled/tabs.tsx) carries a boundary, so a panel it renders is already a child of one.
- A dialog is not a boundary. Portalled markup keeps its owner, so a read inside a dialog reaches whatever boundary is above the component, and closes the dialog on the way out.

## Which side of the boundary a computation goes

The split is not only about reads. Two kinds of computation have a side of their own.

**Derived signals go outside.** A memo or an accessor over props, plain signals or anything else that cannot suspend belongs in the declaring body, above the boundary, and is handed down. Kept inside, it is recomputed under a subtree that stops while the data is in the air, and the parent cannot read it at all.

```tsx
function Outer(props: { player: string }): JSX.Element {
  const [search, setSearch] = createSignal('');
  const [data] = createResource(() => props.player, listThings);
  // Derived from a signal, not from the resource: it stays here
  const wanted = createMemo(() => search().trim().toLowerCase());

  return (
    <>
      <SearchBox value={search()} onChange={setSearch} />
      <Suspense>
        <Inner data={data} wanted={wanted} />
      </Suspense>
    </>
  );
}
```

**Effects that read go inside.** A `createEffect` reading the resource — or reading anything that reaches it — belongs in the child, under the boundary. In the declaring body it throws past every boundary in the component and takes the page down with it, and it runs while the data is still coming.

```tsx
function Inner(props: { data: Resource<Thing[]>; wanted: () => string }): JSX.Element {
  // Under the boundary: it may suspend, and it runs when there is
  // something to run on
  createEffect(() => {
    report(props.data().length, props.wanted());
  });

  return <For each={props.data()}>{(thing) => <Row thing={thing} />}</For>;
}
```

An effect that writes a signal the outer body owns still lives inside; it is handed the setter.
