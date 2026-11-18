# Outcome: boot-true-shadows-yaml

## Built

Skipped. The brief allows it when `inherits:` would make the data harder to read or the reader more complex than the TypeScript it replaces. No code changed. Reasons:

- The data is already YAML and already short. `src/data/species/true-shadows.yaml` is 17 `shadows` pairs and 3 `shapes` pairs (20 in all), one line each. Rewritten as `ArticunoShadow: { inherits: Articuno }` entries it is the same length with more syntax, and it still would not carry any value of its own: the +10 bonus, the `XD-<dex>` name, `biomes: []`, no held items and no egg cycles are rules the brief keeps in TypeScript.
- A generic `inherits:` in the species reader (`species/yaml.ts`, WORLD schema) needs a resolution pass after every generation is registered, a cycle check, an unknown-base check, and merge rules for fields the entry overrides. The species reader builds records generation by generation and the true shadows are registered after all of them, so this would be a second reader path used by one file.
- `getTrueShadow`, `isTrueShadow`, `getShadowlessSpecies`, `getTrueShadowShape` and `listTrueShadows` are called outside registration and the pair maps are built at module load. The brief's split of "shape" entries is "entries whose base is worn", and `isWornForm` reads the registry, which is empty at that point. Keeping the maps would mean a second marker in the YAML (the `shapes` block we already have), so the entries would not remove the distinction either.
- `extendRecord` already does the copy in one call. What `registerTrueShadowSpecies` adds is the rules above, which stay either way. The brief itself says the node saves no bytes and changes no behaviour.
- The brief says the 20 shadows are written as a table of pairs plus a function. The file has 20 pairs and the function is about 30 lines of rules, so the TypeScript to be removed is small.

## Deviations

- None. The node is skipped on the brief's own allowance; only this file is added.

## Stubs left

- None.

## Gotchas

- The pairs file and `true-shadow.ts` are unchanged. A later node that wants `inherits:` for Megas and Zeniths (not in scope here) would be a better case for it than 20 pairs.

## Verification

- None run; no code changed.

## Size

- Estimated M, actual S: read-only assessment.
