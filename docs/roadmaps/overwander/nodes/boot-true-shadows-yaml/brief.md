---
id: boot-true-shadows-yaml
title: True shadows as YAML
status: active
priority: could
type: refactor
outline: false
milestone: next
size: M
spike: false
verify: pnpm exec vitest run test/overworld/world/true-shadow.test.ts test/data/species.test.ts test/data/official-names.test.ts test/data/locale-text.test.ts
gate: false
owns:
  - src/data/species/true-shadow.ts
  - src/data/species/true-shadows.yaml
  - test/data/true-shadow-yaml.test.ts
shared:
  - src/data/species/yaml.ts
  - src/data/species/index.ts
reserves: []
provides: []
depends_on:
  - on: boot-learnsets-loader
    kind: hard
    why: Both edit src/data/species/yaml.ts and index.ts, and the learn set split changes what a species entry holds
---

# True shadows as YAML

## Goal

The 20 true shadows are written as species entries that say `inherits:` their counterpart, instead of a table of pairs plus a function that copies each record in TypeScript. The YAML reader gains `inherits:`, and `true-shadow.ts` keeps only the rules.

## Context

- Source: docs/todo.md (removed, see git history): Platform, Deferring data and runtime at boot ("Move the true shadow table to YAML once the YAML can say `inherits:`").
- State today: half of it is already YAML. `src/data/species/true-shadows.yaml` holds the `shadows` and `shapes` pairs (counterpart to shadow). `registerTrueShadowSpecies` (`src/data/species/true-shadow.ts:112`) builds each record from its counterpart with `extendRecord`: stats plus `TRUE_SHADOW_BONUS` (10), `biomes: []`, no held items, no egg cycles, `baseForm: false`, and a derived name (`XD-<dex>`). The species YAML (`src/data/species/yaml.ts`, WORLD schema at line 57) has no `inherits:`. Megas and Zeniths use the same `extendRecord` pattern in TypeScript and are not in scope.
- This node does not change what the game does and does not reduce the bundle. It moves a table next to its data. Value is small, so priority is `could`: skip it if the extra reader complexity is not worth it (write that in `outcome.md`).
- Skills: `data-yaml`, `species-forms`.

## Decisions

- Keep the +10 stat bonus, the name rule and the ability and shape rules in TypeScript. They are rules, not a table (`data-yaml`: behaviour and lines that follow a table stay in TypeScript).
- `inherits:` is read after every generation is registered, as the shadows are today. Fields the entry writes (`biomes`, `base-form`) override the copy. Everything else comes from the base through `extendRecord`, so a translated field keeps its accessor.
- A shadow of a worn shape (`KyogrePrimal`, `GroudonPrimal`, `RayquazaMega`) is an entry that inherits the shape. The `shapes` map the code asks for (`getTrueShadowShape`) is built from entries whose base is worn.

## Steps

- [ ] Add `inherits: Name` (optional) to the species world schema in `species/yaml.ts`, checked against `SPECIES_IDS`, with an error for a cycle and for a base that is not registered.
- [ ] Rewrite `true-shadows.yaml` as 20 entries (`ArticunoShadow: { inherits: Articuno, ... }`), in the dex order the file has today. Remove the pair tables from `true-shadow.ts`; derive `TRUE_SHADOWS`, `SHADOW_SHAPES` and the reverse maps from the entries.
- [ ] Keep every export of `true-shadow.ts` and its behaviour: the species, stats, names, `listTrueShadows` order.
- [ ] Add a test that reads the registry before and after the change and shows the records are equal (snapshot the old output once from the current code and pin it in the test).

## Acceptance

- [ ] Every record `registerTrueShadowSpecies` produces is deep-equal to the one before this change (stats, types, abilities, biomes, names in en, ja, es).
- [ ] An entry with a cycle or an unknown base fails the load with a message naming the file and the key.
- [ ] Fast check passes: `pnpm typecheck && pnpm exec oxlint src test` (read the exit code), then the verify command above.

## Sizing

M: two or three files and a test, a known pattern (`extendRecord`), medium blast radius (the species reader).

## Notes for the worker

- The pairs file is read at import in `true-shadow.ts` (module top level), before the generations register. Moving to entries means reading it in the register function or keeping a module-level parse of the YAML for the pair maps (`getTrueShadow` is called outside registration).
- Check `test/overworld/world/true-shadow.test.ts` for the dark day pool, which depends on `listTrueShadows` order.
