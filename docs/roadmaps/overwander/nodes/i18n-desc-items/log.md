# Log: i18n-desc-items

- Started on branch `i18n-desc-items` in its own worktree, on top of the status commit.
- Wrote the 277 descriptions and 28 template families per locale as one table per locale, checked by a script against the English keys and placeholders, then merged into the locale files beside the generated names (kept order, `templates:` first).
- First read of the built lines showed Spanish stat names ending in `Esp.` doubled the full stop (mints, vitamins, wings, the Oran-style nature berries) and "forma Eléctrico" in the plate line. Reworded so the stat does not close the sentence.
- `pnpm official-names` run twice: the first run only reordered keys and added the header to files that had none (no value changed, checked by comparing parsed YAML); the second run changed nothing, so the reordered files are committed.
- The full suite had one timeout (`tera-sites`), which passes alone.
