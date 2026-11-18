---
id: boot-lazy-registries
title: Load moves, abilities and items on demand
status: todo
priority: should
type: refactor
outline: false
milestone: next
size: L
spike: false
verify: pnpm exec vitest run test/data test/i18n test/model
gate: false
owns:
  - src/data/moves/index.ts
  - src/data/moves/register.ts
  - src/data/abilities/index.ts
  - src/data/abilities/register.ts
  - src/data/items/index.ts
  - src/data/items/register.ts
  - src/data/battle-data.ts
  - src/components/app/BattleData.tsx
  - test/data/lazy-registries.test.ts
shared:
  - src/app.tsx
  - src/data/index.ts
  - src/server/game-data.ts
  - docs/engine/boot.md
reserves: []
provides: []
depends_on:
  - on: i18n-registry-loader
    kind: hard
    why: Text lives under src/data/text/<locale>/ and is read by each registry's yaml.ts, which this node splits for loading
  - on: boot-measure
    kind: hard
    why: Reports its before and after in docs/engine/boot.md
  - on: boot-learnsets-loader
    kind: hard
    why: Both edit src/data/index.ts, src/app.tsx and the gates, and learn sets leave the species chunk first
---

# Load moves, abilities and items on demand

## Goal

The moves, abilities and items, with every locale's text for them, stop being part of the first frame's download. The gate, the memoized loader and the server's eager registration already exist (`src/data/battle-data.ts`, `src/components/app/BattleData.tsx`, `src/server/game-data.ts`). What is missing is that most of the code statically imports each registry's barrel, so the bundler puts the data in the startup set anyway. In the browser only the active locale's text is loaded. The server keeps registering everything.

## Context

- Source: docs/todo.md (removed, see git history): Platform, Deferring data and runtime at boot.
- Evidence (build of 2026-11-04, `pnpm measure-boot`): the `moves` (99.6 KiB gzip), `abilities` (94.2), `items` (69.3) and `trainers` (55.7) chunks are all in the startup set of the main page. The manifest shows why: `_moves` is imported by `src/routes/index.tsx` itself and by about 20 shared chunks, because 115 files import `from '../data/moves'`, and that `index.ts` holds `registerMoves` with its `import.meta.glob(..., { eager: true })`. Same shape for `abilities/index.ts` (13 importers) and `items/index.ts` (36). The numbers are older than the last changes: rebuild first.
- The getters live in `__create.ts` beside the map. The registration, which pulls the YAML in, lives in `index.ts` beside the re-exports. The fix is to cut the barrel in two: `index.ts` keeps the getters, constants and small tables and imports no YAML, and a new `register.ts` per registry holds the glob and the `registerX` function. `battle-data.ts` imports the `register.ts` files dynamically, and `src/data/index.ts` (`registerGameData`) imports them statically for the server and tests.
- Items are bigger than a read: `items/index.ts` imports every `describeX` family module and builds descriptions. Those go behind the load too if they only run at registration.
- Text: each `yaml.ts` globs `../text/*/<registry>/**` for every locale. In `register.ts`, the browser loads English and the active locale only (`currentLocale()` is fixed per page: `chooseLocale` reloads). The server loads all, since it serves every locale. Make this a build-time or runtime branch that does not pull the other locales into the browser chunks (non-eager globs plus a filter on the key).
- Species text stays eager: the world is registered synchronously at boot and needs species names. Note this in `outcome.md` as the next step (`boot-load-by-id`).
- Skills: `data-yaml`, `resource-suspense`.

## Steps

- [ ] `pnpm build && pnpm measure-boot` and keep the totals. Find which static imports hold each registry in the startup set (the manifest's `imports`).
- [ ] Split each of the three barrels as above. Callers keep their import paths where the getters stay in `index.ts`.
- [ ] Audit runtime reads before the gate opens. A read of an unregistered move, ability or item throws (`Missing ... data`). Find reads on the first-frame path: grep the startup chunks' importers of `getMoveData`, `getAbilityData`, `getItemData` (`src/overworld/chunk-snapshot.ts` and `encounter/` use items, `src/data/overworld/*` too). For each, either it is on the server only, it runs after a gate, or it awaits `ensureBattleData()`. Fix the ones that do not.
- [ ] Locale: load only English and the active locale in the browser (see Context).
- [ ] Add `test/data/lazy-registries.test.ts`: registering the world alone leaves the three registries empty, `ensureBattleData` fills them, a read gives the active locale's text and a second locale stays out of the browser path.
- [ ] Rebuild, remeasure, add the row to "Changes since the baseline" in `docs/engine/boot.md`.

## Acceptance

- [ ] After `pnpm build`, `pnpm measure-boot` shows the moves, abilities and items chunks (and the other locales' text) out of the startup set. Both totals are in `docs/engine/boot.md` and the PR.
- [ ] The main page loads, walks, and opens the bag, a catch sheet and a battle with no thrown `Missing ... data` (one manual pass in `pnpm dev`, console open).
- [ ] The server still registers everything: `pnpm test` stays green, run once at the end.
- [ ] Fast check passes: `pnpm typecheck && pnpm exec oxlint src test` (read the exit code), then the verify command above.

## Sizing

L: blast radius high (three registry barrels and 160 importers), uncertainty medium (which first-frame code reads a registry), verifiability medium (a bundle number plus tests).

## Notes for the worker

- Do not rewrite the 115 imports unless needed. Keeping `index.ts` as the getters barrel is the point.
- Rolldown names chunks by what it groups. Judge by the manifest's `imports` list, not by chunk names.
- `trainers` (55.7 KiB gzip) is in the startup set too. If it is only reached through the moves chunk, it may fall out with this change. If not, leave it and note it.
- Never touch the `db` service or the root `.env`. Tests use `pnpm db` only.
