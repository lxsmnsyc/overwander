# Log: solid-2-styled

- 2026-11-18: branch `refactor/solid-2-styled` cut from `origin/feat/solid-2` (c5825f816). `pnpm install` was already up to date (solid-js 2.0.0 in `node_modules`). No earlier work on this node.
- Typecheck on the base: 474 errors, 30 of them in the owned paths (12 one-argument `createEffect`, 17 JSX attribute types, 1 `tabIndex`).
- Read the signals source for what the write guard allows: writes are refused while an owner is current (component body, memo, effect compute), and let through in an effect's apply, in `onSettled`, in a ref callback, during disposal and with no owner at all (handlers, timers, promises). `onCleanup` throws only inside `onSettled`, `createTrackedEffect` and ref callbacks.
- Split every effect in the owned paths, replaced the two mirror effects (`Dialog`'s `showing`, the pager's clamp) and hover-card's `present` effect with writable derived signals, fixed set-then-read in `toast.tsx`, `search/index.tsx` and `reorder.ts`, moved `onCleanup` calls out of handler scope (`key-bind.tsx`, hover-card's `settle`).
- Found three default-less contexts (`HostContext`, `Holding`, `ToastContext`). In 2.0 a default-less `useContext` throws without a provider, so every card or portal outside a dialog would have thrown. The first two now default to `null`.
- Boolean `aria-*` values: Solid 2 writes a boolean as a bare attribute. Added `spellAria` (`styled/aria.ts`).
- Dialog check: `/demo/kit` (and `/`) shows the shell's own `MISSING_EFFECT_FN` error, from unmigrated shell code. Checked the styled parts on a scratch harness module loaded into a page of the dev server instead (deleted after). Dialog fades in and out, unmounts after the leave, reopens; pager, menu, tooltip work.
- First harness run had the portal container outside the render root, and a trusted click on a menu item never reached its `onClick`: Solid 2 delegates per render root. In the app the body is the root and the container is inside it, so the app is fine; noted as a gotcha.
- Typecheck after: 444 errors, none in the owned paths. oxlint on the owned paths exit 0. `vitest run test/components`: 9 files, 64 tests passed.
