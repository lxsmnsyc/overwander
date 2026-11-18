# Log: boot-lazy-registries

- Base `a34ff6ddb`, `pnpm build && pnpm measure-boot`: startup 140 files, 5326.4 KiB raw, 1400.7 KiB gzip, 1124.7 KiB brotli. In the startup set: `moves` 99.6 KiB gzip, `abilities` 94.2, `items` 70.0, `trainers` 55.7, and every locale's text inside those chunks. Reproduced.
- Split each of the three barrels: `index.ts` keeps the getters, `load.ts` has the globs, the fill function and the async browser loader, `register.ts` is the sync all-locale call for server and tests.
- Text: English eager, other locales a lazy glob, the active locale's files read by `readActiveText` (`src/data/locale-text.ts`).
- Registries were already empty until `ensureBattleData` before this change (the static imports only pulled the code in), so no first-frame reads changed.
- 36 test files and `src/data/index.ts` import `register` instead of the barrel for the register call (codemod).
- After: startup 144 files, 4169.8 KiB raw, 1147.7 KiB gzip, 929.7 KiB brotli (before the review fix; after it, 4174.3 raw, 1150.3 gzip, 936.1 brotli). Later: moves 48.7, items 31.7, abilities 34.4 KiB gzip.
- Checks: typecheck, oxlint exit 0, `vitest run test/data test/i18n test/model` 60 files pass, the 35 edited test files pass.
