# Outcome: i18n-templates

## Built

- Item templates by locale: `readItems` reads each locale's `templates:` into `FamilyText.translatedTemplates`, `registerItemTemplates` keeps them, and `itemText` fills in the active locale's template, or the English one where the locale has none.
- `deriveLocalized(record, field, derive)` in `src/data/yaml.ts`: the field is written by `derive` the first time each locale reads it, and kept. Item descriptions the family code writes, machine names and descriptions, and true-shadow names use it, so none is written once in the registering locale.
- `formatList(items, 'and' | 'or')` (`Intl.ListFormat`) and `joinSentences` (no gap in Japanese, a space otherwise) in `src/i18n/format.ts`; medicine and treats use them in place of joining by hand.
- Zenith form shapes copy their base with `extendRecord`, which #253 missed.
- Tests in `test/data/locale-text.test.ts` (a locale's template wins, English fills the rest; a derived line is written once per locale) and `test/data/official-names.test.ts` (every true shadow carries its code name in each locale).

## Deviations

- The templates stay in the item YAML rather than moving to Paraglide messages: they are registry text, laid over English like the rest of `text/<locale>/`.
- True-shadow names are in scope though the brief named only descriptions: they are built from translated names the same way.
- A true shadow whose counterpart's name is not translated (Primal Kyogre in Japanese) carries its code name alone in that locale, since the base name cannot be found inside it.

## Stubs left

- No locale writes item templates yet. Batch 8 (`i18n-descriptions`) does.
- Zenith names are built from English (`Zenith <holder>`) and stay English until batch 8.
- `article` in the Zenith shard template is English grammar; another locale's template can leave it out.

## Gotchas

- Anything a module computes once from translated text (a table, an index, a cache built at load) has the same problem. Build it per locale, or read the text when it is shown.

## Verification

- Every item's English name and description is the same as on main (1161 compared).
- `pnpm typecheck`, `rtk proxy pnpm exec oxlint src test` (exit 0), `pnpm test` (272 files, 5732 tests, 136 s).
