---
id: solid-2-conventions
title: Rewrite the conventions for Solid 2.0
status: active
priority: could
type: docs
story: solid-2
early: false
outline: false
milestone: later
size: M
spike: false
verify: 
gate: false
added: 2026-11-18
owns:
  - .claude/skills/resource-suspense/**
  - .agents/skills/resource-suspense/**
  - .claude/skills/effect-props/**
  - .agents/skills/effect-props/**
  - .claude/skills/dialog-transitions/**
  - .agents/skills/dialog-transitions/**
  - .claude/skills/action-forms/**
  - .agents/skills/action-forms/**
  - .claude/skills/app-logic/**
  - .agents/skills/app-logic/**
  - .claude/skills/device-settings/**
  - .claude/skills/deferred-jsx-props/**
  - .agents/skills/deferred-jsx-props/**
  - src/components/CLAUDE.md
  - CLAUDE.md
  - README.md
  - AGENTS.md
  - .opencode/AGENTS.md
  - .github/**
shared: []
provides: []
depends_on:
  - on: solid-2-tests
    kind: hard
    why: The skills describe the patterns the areas settled and the test posture the suite chose.
  - on: solid-2-server-calls
    kind: hard
    why: It changes the two server skills, and this node then syncs AGENTS.md's passage on them.
---

# Rewrite the conventions for Solid 2.0

## Goal

Rewrite every convention that names a removed 1.x API so it describes the 2.0 patterns the area children actually used, and keep every mirror in step.

## Context

- Spike outcome, "Skills and mirrors that name removed APIs", is the list. `AGENTS.md:32-38` summarises `server-reads` and `server-function-order`: sync it with what `solid-2-server-calls` wrote.
- The area outcomes list patterns they invented beyond the story's Decisions; fold them in.
- `resource-suspense` becomes the async-memo rule (declare in a parent, read in a child under `Loading`); `effect-props` keeps its memo rule with two-part examples; `app-logic` describes `createStoreSignal` on `from`; `CLAUDE.md` and `README.md` drop "SolidStart 2" and recheck the claim that the transform strips server-only imports (now @solidjs/compiler's directive pass).
- `AnimatedSprite.tsx` (lines near 237 and 372) starts `ticking(...)` in a component body with `onCleanup`, against the settled "setup with teardown is `onSettled`" pattern; decide whether the skills allow it or convert it.
- Gotchas to state: a store or signal write becomes visible after a microtask, and `flush()` does not pull a store change through `createStoreSignal`; an effect apply that returns a non-function stops reactivity app-wide, so applies are written with braces (propose a lint rule as a follow-up node if oxlint cannot express it).
- Test posture settled by `solid-2-tests` (state it in `CLAUDE.md`'s commands or a skill): `vite.config.ts` runs `test.projects`, `client` (test/components, browser build of Solid) and `server` (the rest, Node); a test that calls `renderToString` is named `*.ssr.test.tsx`; component tests call `flush()` after a write before reading; `vitest.fuzz.ts` and `vitest.sim.ts` drop `projects` before merging.
- Patterns the areas invented, to fold into the skills (see the area outcomes): `createLoad` (`src/components/app/create-load.ts`) for reads that must not wait, `catchFailure`; `watchLive` for live rows, wrapping as `{ record }` where "not answered" and "no row" differ; `createSubmission` in place of router `action` plus `useSubmission`; a handler that writes then tells a caller passes the value it computed, never the getter (the write is not visible yet); helpers that take props pass getters, not values read in the body; `spellAria` for boolean aria; `<For keyed={...}>` or `keyed={false}` where list identity is unstable; `untrack` around library ref reads.
- `device-settings` has no `.agents/skills/` copy today; leave it that way unless the others gained one.

## Acceptance

- [ ] `grep -rnE "createResource|\bSuspense\b|onMount|SolidStart|solid-js/web|place in its file|<Index" .claude/skills .agents/skills src/components/CLAUDE.md CLAUDE.md README.md AGENTS.md .opencode .github` prints nothing that describes current code.
- [ ] Each rewritten skill's example compiles as written (paste it into a scratch file under `src` and typecheck, then delete it).

## Sizing

M: about twenty prose files, written from finished code.

## Notes for the worker

- Read the `solid-2` story brief first, its Decisions section above all, and `solid-2-spike`'s outcome on the story branch (`git show origin/feat/solid-2:docs/roadmaps/overwander/nodes/solid-2-spike/outcome.md`): it links the migration guide, `node_modules/solid-js/CHEATSHEET.md` and the library READMEs.
- Work in the main checkout on your own branch cut from `feat/solid-2`; run `pnpm install` first, since `node_modules` may hold the 1.x tree.
- `pnpm typecheck` and `rtk proxy pnpm exec oxlint src test` are green on `feat/solid-2` now; keep them so.
- Load the ts-style skill before writing TypeScript. Prose avoids em-dashes.
- Never touch the `db` service on port 54322 or the root `.env`. Do not run `pnpm test:db` or `pnpm test:e2e`. Stop every `pnpm dev` you start (check with `ps` before you reply).
