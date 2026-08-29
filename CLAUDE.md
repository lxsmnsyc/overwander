# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Overwander: a seed-generated Pokémon-style overworld with a real-time battle engine, on SolidStart 2 + Supabase. [README.md](README.md) covers setup, the stack and where things live; [docs/engine.md](docs/engine.md) covers the battle engine in depth. This file covers what those do not: the patterns that only show up after reading several files.

## Commands

`pnpm` only, never npm or yarn.

```bash
pnpm dev                                  # http://localhost:3000
pnpm test                                 # whole suite, once
pnpm exec vitest run test/data.test.ts    # one file
pnpm exec vitest run test/battle -t 'Tough Claws'   # one test by name
pnpm exec tsc --noEmit                    # type-check
pnpm exec oxlint src test                 # lint (never biome — this repo migrated off it)
pnpm exec oxfmt src test                  # format
```

`pnpm test:rules` and `pnpm test:e2e` both need `pnpm db` (the local Supabase stack) running. Run them one at a time: the RLS suite clears game rows between cases and will delete the accounts the e2e browsers are signed in as.

## Conventions live in skills

`.claude/skills/*/SKILL.md` and `.agents/skills/*/SKILL.md` hold this project's conventions, and the two sets are not identical. List both and read whichever covers the task before starting; they are not all surfaced in a session's skill listing. The same rules are mirrored for other agents in `.cursor/rules/`, `.clinerules/`, `.windsurf/` and `AGENTS.md`, so a convention that changes has to change in each.

Two that touch nearly every change: comments stay short and say the why rather than the what (`light-comments`), and prose anywhere — comments, docs, commit messages — avoids em-dashes in favour of commas, colons, parentheses or two sentences.

## Data registries

Everything in `src/data/` describes itself and registers itself; nothing is queryable until `registerGameData()` in [src/data/index.ts](src/data/index.ts) has run. A test that reads species, moves, abilities or items must call the registration functions first.

Each registry is a folder with `__create.ts` (the `Map`, the `registerX`/`getXData` pair, and any shared factories), a `gen-1.ts` of entries, and an `index.ts` that re-exports and registers. Ids are `const enum`s in `src/data/ids/`. Every entry carries a required one-line player-facing `description`; a test asserts each ends in a full stop.

Ability pools have their own rules about what a species may reach, which the `ability-pools` skill states.

## Battle engine

Real time, not turns. A mainline turn is 2 seconds, written `turns(n)` from `src/battle/turn.ts` rather than as milliseconds. Per-turn residuals have no clock to hang on: they are paid when a unit begins casting or channelling, via `onUnitActs`.

Everything is an event on one bus ([src/battle/events.ts](src/battle/events.ts)). `Check*` events are questions whose answer is a field the listeners mutate (`power`, `immune`, `priority`, `success`); `Unit*` events are things that happened. Listeners pick `EventPriority.Pre | Exact | Post` (or `AttackPriority`), where `Exact` is the mechanic's own answer and `Post` is everyone modifying it.

Effects register themselves and nothing else names them: no mechanic mentions an ability by id. An ability is `createAbility(id, setup)` from [src/battle/abilities/\_\_create.ts](src/battle/abilities/__create.ts), which starts its listeners only while some unit on the field holds it. Abilities that share one behaviour go through a `createXAbility` meta factory in that file rather than a local helper. A visual cue is `unit.triggerAbility(id)`, and the effect usually rides the resulting `UnitTriggerAbility` at `Exact`; a cue fires once per matching unit. Reuse a move rather than reimplementing its machinery where one exists (Drought casts Sunny Day; Cursed Body casts Disable).

[src/battle/setup.ts](src/battle/setup.ts) wires a battle: mechanics first, then moves, statuses, abilities, items, then the AI. Tests build one through `test/battle/harness.ts` (`createBattle`, `createUnit`, `pinRandom`) and drive time with `battle.tick(ms)`.

## Overworld

The map is never stored. A chunk's terrain, landmarks, spawns, stashes and raids are derived from the world seed plus the coordinates plus the clock, so two clients compute the same world without exchanging it. Anything that changes generation changes what every existing player sees.

## Reads, writes and the server boundary

- `src/auth/` runs in the browser: Supabase reads under row-level security, plus thin wrappers around the writes.
- `src/server/` is privileged. Every module starts with `import 'server-only'` and writes over the table-owner connection ([src/server/db.ts](src/server/db.ts)), which RLS does not bind. That is why the policies in `supabase/` only ever describe browsers.

The wrapper shape is fixed: an exported client function calls an inner function whose body opens with `'use server'`, passing an id token, and that inner function calls `requireUid(token)` before anything in `src/server/`. SolidStart's transform strips module-level imports that only the server function uses, so import server modules statically at the top of the file rather than dynamically inside it.

## UI

Solid with [terracotta](https://github.com/lxsmnsyc/terracotta) headless primitives; build controls on those rather than hand-rolled elements. Canvas is for the overworld and battle scenes only, and interface sprites are drawn as CSS background-images in the DOM. A component that calls `createResource` must not read it: the read belongs in a child under `Suspense`. Several skills cover dialogs, paging, resources and component layout in detail.
