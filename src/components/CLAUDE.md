# UI

Solid with [terracotta](https://github.com/lxsmnsyc/terracotta) headless primitives; build controls on those rather than hand-rolled elements. Canvas is for the overworld and battle scenes only, and interface sprites are drawn as CSS background-images in the DOM. A component that calls `createResource` must not read it: the read belongs in a child under `Suspense`. Several skills cover dialogs, paging, resources and component layout in detail.

The look is the Field Kit system: [docs/design/field-kit.md](../../docs/design/field-kit.md) holds its tokens, presets and rules. Three of them break things when missed: words in gold use `text-gold-dark` (plain `gold` is for fills and icons); a transition preset never leaves a scale or a translate on its resting state (either makes the element the containing block for `fixed` children); and a fade of a component's own carries `motion-crossfade` so reduce motion reaches it.
