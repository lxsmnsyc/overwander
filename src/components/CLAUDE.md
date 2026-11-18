# UI

Solid with [terracotta](https://github.com/lxsmnsyc/terracotta) headless primitives; build controls on those rather than hand-rolled elements. Canvas is for the overworld and battle scenes only, and interface sprites are drawn as CSS background-images in the DOM. Several skills cover dialogs, paging, async reads, effects and component layout in detail; read `async-reads` and `effect-props` before writing a component that loads or has an effect.

Solid 2.0 rules that break things when missed:

- A component that declares an async memo must not read it: the read belongs in a child under `Loading`. A read that must not wait is a `createLoad`.
- An effect is two functions, a compute that reads and an apply that does not, and the apply is written with braces: a returned non-function halts reactivity app-wide. Setup with teardown is `onSettled` returning the cleanup.
- A write is visible only after a microtask. A handler that writes then tells a caller passes the value it computed, never a read of the signal.
- A boolean `aria-*` goes through `spellAria` (from `src/components/styled`), never a cast, and enumerated attributes such as `draggable` are the strings `'true'` and `'false'`. Built-in attributes are lowercase (`tabindex`, `maxlength`).
- A context with no default throws without a provider, so there is no null check after `useContext`; an optional context is `createContext<T | null>(null)`.
- `JSX` and `ComponentProps` come from `@solidjs/web`, not `solid-js`.

The look is the Field Kit system: [docs/design/field-kit.md](../../docs/design/field-kit.md) holds its tokens, presets and rules. Three of them break things when missed: words in gold use `text-gold-dark` (plain `gold` is for fills and icons); a transition preset never leaves a scale or a translate on its resting state (either makes the element the containing block for `fixed` children); and a fade of a component's own carries `motion-crossfade` so reduce motion reaches it.
