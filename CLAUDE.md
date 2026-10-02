# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Overwander: a seed-generated Pokémon-style overworld with a real-time battle engine, on SolidStart 2 and Postgres, self-hosted in Docker. [README.md](README.md) covers setup, the stack and where things live; [docs/engine.md](docs/engine.md) covers the battle engine in depth. This file covers what those do not: the patterns that only show up after reading several files.

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

The `db` service in `compose.yaml` (port 54322, `overwander`) is production, and on a machine that self-hosts the game it is the live player data: never reset, seed or experiment against it. The root `.env` is production's configuration and is not edited. The script's name says which settings it reads: `pnpm dev`, `pnpm db:*` and `pnpm seed` read the committed `.env.development`, which overrides every data, account and sign-in value; `pnpm start` and `pnpm migrate` read `.env`.

`pnpm db` starts the throwaway database development and the tests share (`compose.dev.yaml`, port 54324, `overwander_dev`), which keeps its data in memory. `pnpm test:db` and `pnpm test:e2e` start and migrate it themselves, reach it only through `TEST_DATABASE_URL`, and refuse a database not named `*_dev` ([test/test-database.ts](test/test-database.ts)); `pnpm seed` refuses the same. Run the two suites one at a time: the database suite clears game rows between cases and will delete the accounts the e2e browsers are signed in as. Every suite reads `test/env/.env.test` rather than the root `.env`.

## Conventions live in skills

`.claude/skills/*/SKILL.md` and `.agents/skills/*/SKILL.md` hold this project's conventions, and the two sets are not identical. List both and read whichever covers the task before starting; they are not all surfaced in a session's skill listing. The same rules are mirrored for other agents in `AGENTS.md`, `.opencode/AGENTS.md` and `.github/`, so a convention that changes has to change in each.

Three that touch nearly every change: comments stay short and say the why rather than the what (`light-comments`), iteration is a `for...of` loop rather than a callback Array method (`prefer-for-of`), and prose anywhere — comments, docs, commit messages — avoids em-dashes in favour of commas, colons, parentheses or two sentences.

## Data registries

Everything in `src/data/` describes itself and registers itself; nothing is queryable until `registerGameData()` in [src/data/index.ts](src/data/index.ts) has run. A test that reads species, moves, abilities or items must call the registration functions first.

Each registry is a folder with `__create.ts` (the `Map`, the `registerX`/`getXData` pair, and any shared factories) and an `index.ts` that re-exports and registers. Species, moves, abilities and items are written as YAML, a folder per part of the record with the player-facing words under `src/data/text/en/`, read and checked by each registry's `yaml.ts` (the `data-yaml` skill). Behaviour, and any line that follows a table, stays in TypeScript beside `__create.ts`. Ids are `const enum`s in `src/data/ids/`. Every entry carries a required one-line player-facing `description`; a test asserts each ends in a full stop.

Ability pools have their own rules about what a species may reach, which the `ability-pools` skill states.

## Battle engine

Real time, not turns. A mainline turn is 2 seconds, written `turns(n)` from `src/battle/turn.ts` rather than as milliseconds. Per-turn residuals have no clock to hang on: they are paid when a unit begins casting or channelling, via `onUnitActs`.

Everything is an event on one bus ([src/battle/events/index.ts](src/battle/events/index.ts)). `Check*` events are questions whose answer is a field the listeners mutate (`power`, `immune`, `priority`, `success`); `Unit*` events are things that happened. Listeners pick `EventPriority.Pre | Exact | Post` (or `AttackPriority`), where `Exact` is the mechanic's own answer and `Post` is everyone modifying it.

Effects register themselves and nothing else names them: no mechanic mentions an ability by id. An ability is `createAbility(id, setup)` from [src/battle/abilities/\_\_create.ts](src/battle/abilities/__create/index.ts), which starts its listeners only while some unit on the field holds it. Abilities that share one behaviour go through a `createXAbility` meta factory in that file rather than a local helper. A visual cue is `unit.triggerAbility(id)`, and the effect usually rides the resulting `UnitTriggerAbility` at `Exact`; a cue fires once per matching unit. Reuse a move rather than reimplementing its machinery where one exists (Drought casts Sunny Day; Cursed Body casts Disable).

[src/battle/setup.ts](src/battle/setup.ts) wires a battle: mechanics first, then moves, statuses, abilities, items, then the AI. Tests build one through `test/battle/harness.ts` (`createBattle`, `createUnit`, `pinRandom`) and drive time with `battle.tick(ms)`.

## Overworld

The map is never stored. A chunk's terrain, landmarks, spawns, stashes and raids are derived from the world seed plus the coordinates plus the clock, so two clients compute the same world without exchanging it. Anything that changes generation changes what every existing player sees.

## Reads, writes and the server boundary

- `src/auth/` runs in the browser: thin wrappers around server functions, for reads and writes alike. No browser code reaches the database.
- `src/server/` is privileged. Every module starts with `import 'server-only'` and reads and writes over the table-owner connection ([src/server/db.ts](src/server/db.ts)). There are no row policies, so a server function is what decides who may see or change a row.

The wrapper shape is fixed: an exported client function calls an inner function whose body opens with `'use server'`, passing an id token, and that inner function checks each of its arguments with `check` from [src/server/validate.ts](src/server/validate.ts) and then calls `requireUid(token)` (a write) or `requireReader(token)` (a read, see the `server-reads` skill) before anything in `src/server/`. Accounts are Better Auth's ([src/server/better-auth.ts](src/server/better-auth.ts)), and the token is its short-lived JWT. Live views follow table changes over the server's own socket (`src/server/live`). SolidStart's transform strips module-level imports that only the server function uses, so import server modules statically at the top of the file rather than dynamically inside it.

## UI

Solid with [terracotta](https://github.com/lxsmnsyc/terracotta) headless primitives; build controls on those rather than hand-rolled elements. Canvas is for the overworld and battle scenes only, and interface sprites are drawn as CSS background-images in the DOM. A component that calls `createResource` must not read it: the read belongs in a child under `Suspense`. Several skills cover dialogs, paging, resources and component layout in detail.
