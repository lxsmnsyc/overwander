# Log: i18n-people-places

- Started on branch `i18n-people-places` in the main checkout.
- Helpers first, in `src/data/yaml.ts`: `readLocaleText`, `localeFieldTable`, `localeLines`, `addLocaleText`, `localizeLine`, `localeFile`, `readEntryOverlays`, and `localeStringTable` grew a `section` and a `derived` argument. A table that stays a plain `Record<number, string>` was kept wherever callers index it, so no export changed its type.
- Town names: pinned a sample of 80 English towns in `test/data/town-names.test.ts` before touching the builder. The pin passes before and after.
- Megas: the Mega is named for the pokemon its key names (`FloetteMega` is Floette, though its base is the Eternal Flower form), else for its base.
- `pnpm official-names` was run: it exited 0 and left no diff.
- First lint run: three errors in the new test and one in `town-names.ts`, fixed. `oxfmt src test scripts` reformatted one unrelated test file, which was reverted.
- The Japanese `mega-names.yaml` comment first held kanji, which a test in `official-names.test.ts` forbids, so it is in kana.
