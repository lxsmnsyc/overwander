# Log: i18n-desc-moves-early

- Started on branch `i18n-desc-moves-early` in its own worktree.
- Dumped the 464 English lines with each move's official ja and es name, then wrote one table per locale and generation (key to line) and merged them into the locale files beside the generated `name`, with a script that also checked every key against English, every number in the English line against the translation, full stops, doubled `Esp..`, kanji in ja and em-dashes. The merge added 464 `description` lines per locale and removed none.
- `Attack` (the engine's cooldown filler) has no official name, so its ja and es entries hold a `description` only; the name falls back to English.
- Settled the recurring patterns once and recorded them in the term list (Move descriptions): stages, status chances, recoil, drain, binds, wind-ups, recharge, sides and teammates.
- Test: `REGISTRIES` gained the moves filed under gen-1 to gen-4, read from the English text folders; each entry has a `minimum` so an empty read cannot pass.
- Lint caught an unsorted import and two unsafe assertions in the test; fixed.
- The full suite had one timeout (`tera-sites`), which passes alone. `pnpm official-names` left no diff.
