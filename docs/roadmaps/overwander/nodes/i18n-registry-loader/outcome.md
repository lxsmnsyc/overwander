# Outcome: i18n-registry-loader

## Built

- `splitLocales`, `readOverlays`, `localize` and `extendRecord` in `src/data/yaml.ts`, as the `registry-text` contract describes.
- Species, moves, abilities and items glob `text/*/` and lay every other locale over English. Species translate `name` and `category`, moves and abilities `name` and `description`, items `name` and a written `description`.
- A translated field is an accessor that reads `currentLocale()`, so the roughly 200 places that read `getXData(id).name` follow the locale unchanged.
- `test/data/locale-text.test.ts` lays a stand-in locale `xx` over the real files: one entry overrides English in that locale only, the rest stay English, and each way a locale can write what English lacks fails the load.

## Deviations

- No `getSpeciesName(id)` and friends. The accessor on the record gives the same result without changing every caller.
- "Same keys" is one-way: a locale may leave keys out (English fills them) but may not add any. With two-way checking, the brief's one-entry override test could not pass, and neither could batch 2, which writes names before batch 8 writes descriptions.
- Outside the owned paths: `registerMove` (`moves/__create.ts`) assigns onto the record instead of spreading it, the item describer in `items/index.ts` does the same, and `megas.ts`, `zeniths.ts` and `true-shadow.ts` copy their base with `extendRecord`. A spread would have kept one locale's text.
- `biome/yaml.ts` is unchanged: the spawn pools hold no text.

## Stubs left

- Item `templates:` are skipped in an overlay. Batch 3 (`i18n-templates`) turns built descriptions into messages.
- The `stringTable` files (types, natures, egg groups, biomes and the rest) still read `text/en` alone. `i18n-official-names` needs types and natures, so it wires `stringTable` the same way.

## Gotchas

- A translated field has no setter. Code that assigns to one throws, which is intended: copy with `extendRecord` or `Object.assign` onto the record instead.
- Every locale is globbed eagerly into the same chunk as English, so each locale added grows the startup bundle (see `docs/engine/boot.md`). `boot-lazy-registries` should load only the active locale.
- Names built in code from English (Zenith holders, true-shadow names) stay English until their batch.

## Verification

- `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test` (271 files, 5724 tests).
