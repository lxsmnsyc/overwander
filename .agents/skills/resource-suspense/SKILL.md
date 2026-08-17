---
name: resource-suspense
description: >
  A component that calls `createResource` owns a `Suspense` boundary
  around what it returns. Without one the nearest boundary is the app
  root, and a single suspending read blanks the page. Applies whenever
  adding a resource to a component or writing a new component that
  reads one.
---

Reading a resource that is still loading **throws**. Solid catches the throw at the nearest `Suspense` and hides everything inside it until the read lands. In this app the only boundary above most components is the one around the whole page in [`app.tsx`](../../../src/app.tsx), so a read that suspends takes down the world, the menu and whatever dialog was open.

## Rule

Every component that calls `createResource` wraps its own returned JSX in a `Suspense` with a fallback.

```tsx
// Right: the boundary belongs to the component that can suspend
export default function GiftsTab(): JSX.Element {
  const [owed] = createResource(listMysteryGifts);

  return (
    <Suspense fallback={<Note class="text-center">Looking…</Note>}>
      <div class="flex flex-col gap-4">…</div>
    </Suspense>
  );
}

// Wrong: nothing local catches it, so the page does
export default function GiftsTab(): JSX.Element {
  const [owed] = createResource(listMysteryGifts);

  return <div class="flex flex-col gap-4">…</div>;
}
```

The fallback is what stands in the component's own space while the first read is in the air — a `Note`, a row of placeholders, whatever is the right size. It is not the page's fallback and should not look like one.

## What it costs when it is missing

The failure is not a slow screen, it is a screen that vanishes and comes back. `TabPane` exists for exactly this: a panel that fetched something used to tear the whole page down and rebuild it, tab bar included, so a player mid-click had the element they pressed taken out from under them and the browser never raised the click. Every other press appeared to do nothing.

## Re-reads still want `latest`

A boundary makes the **first** read safe. A refetch puts the resource back into loading, so a plain read suspends again and the fallback replaces content the player was looking at.

- Read `resource.latest` where the component re-reads after writing — a list refetched after a claim, a buddy re-read after it is set. It never throws and keeps the last answer on screen.
- Keep the boundary anyway. It costs nothing when nothing suspends, and it is what contains a child, or a later edit, that does.

## Around it

- [`TabPane`](../../../src/components/styled/tabs.tsx) already carries a boundary, so a panel inside one is covered and does not need a second.
- A dialog is **not** a boundary. Portalled markup keeps its owner, so a suspending read inside a dialog still reaches the app root and closes the dialog on the way.
