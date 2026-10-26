# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Overwander: a seed-generated Pokémon-style overworld with a real-time battle engine, on SolidStart 2 and Postgres, self-hosted in Docker. [README.md](README.md) covers setup, the stack and where things live; [docs/engine.md](docs/engine.md) covers the battle engine in depth. This file covers what those do not: the patterns that only show up after reading several files.

## Commands

`pnpm` only, never npm or yarn.

```bash
pnpm dev                                  # http://localhost:3000
pnpm test                                 # whole suite, once
pnpm exec vitest run test/data/species.test.ts   # one file
pnpm exec vitest run test/battle -t 'Tough Claws'   # one test by name
pnpm typecheck                            # type-check (tsc with the YAML content mapper)
pnpm exec oxlint src test                 # lint (never biome: this repo migrated off it)
pnpm exec oxfmt src test                  # format
```

The `db` service in `compose.yaml` (port 54322, `overwander`) is production, and on a machine that self-hosts the game it is the live player data: never reset, seed or experiment against it. The root `.env` is production's configuration and is not edited. The script's name says which settings it reads: `pnpm dev`, `pnpm db:*` and `pnpm seed` read the committed `.env.development`, which overrides every data, account and sign-in value; `pnpm start` and `pnpm migrate` read `.env`.

`pnpm db` starts the throwaway database development and the tests share (`compose.dev.yaml`, port 54324, `overwander_dev`), which keeps its data in memory. `pnpm test:db` and `pnpm test:e2e` start and migrate it themselves, reach it only through `TEST_DATABASE_URL`, and refuse a database not named `*_dev` ([test/test-database.ts](test/test-database.ts)); `pnpm seed` refuses the same. Run the two suites one at a time: the database suite clears game rows between cases and will delete the accounts the e2e browsers are signed in as. Every suite reads `test/env/.env.test` rather than the root `.env`.

## Conventions live in skills

`.claude/skills/*/SKILL.md` and `.agents/skills/*/SKILL.md` hold this project's conventions, and the two sets are not identical. List both and read whichever covers the task before starting; they are not all surfaced in a session's skill listing. The same rules are mirrored for other agents in `AGENTS.md`, `.opencode/AGENTS.md` and `.github/`, so a convention that changes has to change in each.

One rule touches nearly every change: prose anywhere (comments, docs, commit messages) avoids em-dashes in favour of commas, colons, parentheses or two sentences.

## Data registries

Everything in `src/data/` describes itself and registers itself; nothing is queryable until `registerGameData()` in [src/data/index.ts](src/data/index.ts) has run. A test that reads species, moves, abilities or items must call the registration functions first.

Each registry is a folder with `__create.ts` (the `Map`, the `registerX`/`getXData` pair, and any shared factories) and an `index.ts` that re-exports and registers. Species, moves, abilities, items, the per-move battle numbers (`src/data/battle/`) and the spawn pools (`src/data/biome/pools/`) are written as YAML, a folder per part of the record with the player-facing words under `src/data/text/en/`, read and checked by each registry's `yaml.ts` (the `data-yaml` skill). Behaviour, and any line that follows a table, stays in TypeScript beside `__create.ts`. Ids are `const enum`s in `src/data/ids/`. Every entry carries a required one-line player-facing `description`; a test asserts each ends in a full stop.

Ability pools have their own rules about what a species may reach, which the `ability-pools` skill states.

## Battle engine

Real time on one event bus. [src/battle/CLAUDE.md](src/battle/CLAUDE.md) holds its patterns and loads when working under that folder.

## Overworld

The map is never stored. A chunk's terrain, landmarks, spawns, stashes and raids are derived from the world seed plus the coordinates plus the clock, so two clients compute the same world without exchanging it. Anything that changes generation changes what every existing player sees.

## Reads, writes and the server boundary

- `src/auth/` runs in the browser: thin wrappers around server functions, for reads and writes alike. No browser code reaches the database.
- `src/server/` is privileged. Every module starts with `import 'server-only'` and reads and writes over the table-owner connection ([src/server/db.ts](src/server/db.ts)). There are no row policies, so a server function is what decides who may see or change a row.
- `src/model/` is what both sides share: each stored record's shape and normaliser (`*-record.ts`), the rules read off a record (health, eggs, stacks, the local clock), and the search parsers (`search/`). Nothing in it opens with `'use server'` or imports `server-only`.

The wrapper shape is fixed: an exported client function calls an inner function whose body opens with `'use server'`, passing an id token, and that inner function checks each of its arguments with `check` from [src/server/validate.ts](src/server/validate.ts) and then calls `requireUid(token)` (a write) or `requireReader(token)` (a read, see the `server-reads` skill) before anything in `src/server/`. Accounts are Better Auth's ([src/server/better-auth.ts](src/server/better-auth.ts)), and the token is its short-lived JWT. Live views follow table changes over the server's own socket (`src/server/live`). SolidStart's transform strips module-level imports that only the server function uses, so import server modules statically at the top of the file rather than dynamically inside it.

## Game logic and drawing

`src/game` holds the game's state and rules as plain TypeScript stores (`src/game/store.ts`), and `src/canvas` holds the draw loops as plain functions. Neither may import Solid or a component, which lint enforces. A component reads a store through `createStoreSignal` and forwards input as calls; the `app-logic` skill has the pattern.

## UI

Solid with terracotta primitives. [src/components/CLAUDE.md](src/components/CLAUDE.md) holds the UI rules and loads when working under that folder.
