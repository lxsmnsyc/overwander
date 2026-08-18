---
name: dialog-transitions
description: >
  The `Transition` around a dialog decides when it is mounted and
  nothing else — the fade belongs to the `TransitionChild` overlay and
  panel inside it. Applies whenever adding or changing a transition in
  `src/components/styled`, or giving a dialog an animation of its own.
---

A dialog is wrapped in one `Transition` and holds two `TransitionChild` elements. The wrapper is the **coordinator**: it says when the dialog exists. The children are what animate.

## Rule

Never give the parent `Transition` enter/leave classes — no `{...FADE}`, no `enter`/`leave` of its own. Put the animation on the overlay and the panel.

```tsx
// Right: the wrapper only mounts and unmounts
<Transition appear show={props.isOpen}>
  <HeadlessDialog isOpen unmount={false} onClose={props.onClose}>
    <DialogOverlay as={TransitionChild} {...FADE} class="fixed inset-0 …" />
    <DialogPanel as={TransitionChild} {...FADE} class={PANEL}>…</DialogPanel>
  </HeadlessDialog>
</Transition>

// Wrong: the wrapper animates too
<Transition appear show={props.isOpen} {...FADE}>…</Transition>
```

## Why

- **Opacity multiplies.** A panel at 0.5 inside a wrapper at 0.5 is drawn at 0.25, so an animated wrapper makes every child fade faster than it was told to and on a curve nobody wrote.
- **The wrapper is the clock.** Terracotta unmounts on the wrapper's own `transitionend`. Give the wrapper a transition and it can finish first, cutting a child's longer one off mid-fade; children that want different timings — an overlay slower than the panel — stop being possible.
- **It is a screen-wide layer.** The wrapper is a bare `div` around fixed-position children. Opacity on it makes one stacking context over the whole page and flattens the dialog into a single painted layer, which loses the panel's shadow over the overlay.

## Around it

- The fades live in [`transition.ts`](../../../src/components/styled/transition.ts), spread into each child. `FADE` fades **and grows**, and is for a **dialog's panel** and nothing else. Everything else takes `SHEER`, the same fade with no scale: the overlay, anything placed against the window (hover cards, tooltips), and anything dropped from the control that opened it — a popover, a listbox, a combobox. Two reasons to keep the scale off those: a list dropped from a button grows from the button rather than from itself, and a scale is a transform, which makes the element the containing block for anything `fixed` inside it — that put a hover card a whole viewport down the page.
- `holdFade` goes on whatever a transition wraps, so a button finishing its own hover does not end the dialog's fade — `transitionend` bubbles and terracotta ends on the first one it hears.
- A dialog on its way out keeps `inert` and `pointer-events-none` while it fades; nothing else marks it, and `data-open` is how anything outside tells an open dialog from a leaving one.
