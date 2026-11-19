# Outcome: solid-2-conventions

## Built

Files changed and what each now says:

- `.claude/skills/async-reads/SKILL.md` and `.agents/skills/async-reads/SKILL.md` (renamed from `resource-suspense`): an async memo is declared in one body and read in a child under `Loading`; key memo first; `Promise<T> | null` for an empty key; `refresh`, `isPending`, `latest`; `Errored` and `catchFailure` for failures; `createLoad` for a read that must not wait; `watchLive` and seeded `from` for feeds; reads from timers mount after the data lands.
- `effect-props` (both copies): the memo rule with two-part examples, the shape of the split, braces on the apply, `onSettled` for setup with teardown, `onCleanup` limits, writes (derive, move, `ownedWrite` last), a write is visible after a microtask (`flush()` does not pull a store through `createStoreSignal`), getters for helpers, `untrack` around library refs, `<For keyed>`.
- `dialog-transitions` (both): `Loading` replaces `Suspense` around the panel, a refresh is read plainly, `TransitionChild` sets `inert` itself.
- `action-forms` (both): a form's record is read in a child under `Loading` with a fallback.
- `app-logic` (both): `createStoreSignal` is a memo over `from`, store changes land at the next flush, module start in `onSettled`, `createSubmission` for forms.
- `device-settings` (`.claude` only): `onSettled(loadSettings)` and the two-part class effect.
- `deferred-jsx-props` (both): imports `JSX` from `@solidjs/web`, dropped the 1.x warning quote.
- `src/components/CLAUDE.md`: a short list of the 2.0 rules that break things (async memo, effect shape, microtask writes, `spellAria` and enumerated attributes, default-less contexts, `@solidjs/web` types).
- `CLAUDE.md`: stack line says Solid 2.0; the server-function import note now names `@solidjs/compiler`'s directive pass (checked with `transformDirectives`: the client output drops imports only the function used); the test posture (`test.projects`, `flush()`, `*.ssr.test.tsx`, fuzz and sim configs).
- `README.md`: stack table says Solid 2.0 and the Vite plugin start mode with Nitro.
- `AGENTS.md`: `server-reads` and `server-function-order` summaries match what `solid-2-server-calls` wrote; added `async-reads` and `effect-props`.
- `.opencode/AGENTS.md`, `.github/**`: no hits, unchanged.

All examples compile: pasted into a scratch file under `src`, `pnpm typecheck` exit 0, file deleted.

## Decisions

- Renamed `resource-suspense` to `async-reads`: neither resources nor `Suspense` exist. References updated (`component-layout` in both trees).
- `AnimatedSprite.tsx` `ticking(...)`: converted. The two component-body `ticking` calls with `onCleanup` are now `onSettled` returning the stop (the sparkle keeps a `stop` variable its step calls when the sparkle ends). Chose conversion because the skills now say setup with teardown is `onSettled`, and it also keeps the rAF off the server render.
- `device-settings` stays `.claude` only.
- The effect-apply rule (a concise arrow returning a non-function halts reactivity) is stated in `effect-props` and `src/components/CLAUDE.md`.

## Deviations

- Outside the owned list: `src/components/sprites/AnimatedSprite.tsx` (above); `.claude` and `.agents` `component-layout` (renamed skill reference) and `batched-queries` (named `settled`, whose module is deleted); `CONTRIBUTING.md` (the `createResource` sentence); `docs/database/security.md` (SolidStart named for the `server-only` marker); `docs/engine/canvas.md` (`onMount` to `onSettled`).
- Other skills grepped for removed APIs: no more hits. `deferred-jsx-props` and `dialog-transitions` em-dashes removed since I rewrote them; em-dashes in untouched skills stay.
- The plain-writing checker reports only warnings (long sentences, semicolons, "rather"), many in lines that predate this node.

## Follow-ups (not added as nodes)

- Lint rule: forbid a concise arrow (or any expression body) as `createEffect`'s second argument, and `onCleanup` inside `onSettled`. oxlint has no built-in for either; a custom JS plugin or a grep test over `src` could do it.
- Possible grep test: `createContext<...>()` paired with a null check after `useContext`.

## Verification

- `pnpm typecheck` exit 0; `rtk proxy pnpm exec oxlint src test` exit 0.
- The brief's grep prints nothing for the owned paths plus `CONTRIBUTING.md` and `docs/`.
