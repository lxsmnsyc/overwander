# Log: i18n-descriptions

- Started on branch `i18n-descriptions` in its own worktree, on top of the status commit.
- Generator: the merge is `keepWritten` in `scripts/i18n/keep-written.ts`, apart from the script because the script runs `main()` on import and a test cannot load it. The script was not run (it reads PokeAPI over the network); the unit test covers the merge.
- Stats and stages: English `stats.yaml` split into `stats.yaml` and `stages.yaml`. The three callers that read English names switched to `ENGLISH_STAT_NAMES`.
- Zenith names: the template sits under the key `name` in `zeniths.yaml`. The locale's holder is the base pokemon's name in that locale.
- First lint run had three errors in `zeniths.ts` (import order, a dynamic delete, a condition the types call always false), fixed before the last commit.
