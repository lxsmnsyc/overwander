# What the game loads at startup

Developer notes on the size of the startup bundle, so each change to how the game boots can report a before and after.

## Measuring

```bash
pnpm build
pnpm measure-boot            # the main page, src/routes/index.tsx
pnpm measure-boot battle/[id].tsx
```

[`scripts/measure-boot.ts`](../../scripts/measure-boot.ts) reads the client manifest the build writes (`.output/public/.vite/manifest.json`). It starts at `src/entry-client.tsx` and the route's chunk, and follows every static import, since the browser fetches all of those before the page runs. The total of that set is the startup cost. Each dynamic import made from that set is listed after it with what it adds on top. Other routes are left out.

Each file is measured raw, gzipped (level 9) and brotli-compressed. The gzip and brotli figures are the ones a player downloads.

Chunk names are the bundler's. A chunk named `facing` or `stats` holds whatever modules were grouped into it, not only that file, so read the source map before assuming what is inside.

## Baseline

Measured 2026-10-31 on `2afebb1e2` (after the locale work in #250), main page.

|         | Files | Raw        | gzip       | brotli    |
| ------- | ----- | ---------- | ---------- | --------- |
| Startup | 121   | 4792.1 KiB | 1200.8 KiB | 960.6 KiB |

The ten largest startup chunks:

| Chunk               | Raw        | gzip      | brotli    |
| ------------------- | ---------- | --------- | --------- |
| `species`           | 1625.6 KiB | 284.4 KiB | 203.5 KiB |
| `facing`            | 527.2 KiB  | 130.8 KiB | 107.2 KiB |
| `stats`             | 408.5 KiB  | 126.7 KiB | 85.0 KiB  |
| `index` (the route) | 285.4 KiB  | 87.4 KiB  | 72.3 KiB  |
| `moves`             | 232.2 KiB  | 46.6 KiB  | 36.4 KiB  |
| `items`             | 190.3 KiB  | 37.9 KiB  | 30.1 KiB  |
| `styled`            | 152.7 KiB  | 41.4 KiB  | 35.5 KiB  |
| `biome`             | 142.5 KiB  | 31.8 KiB  | 24.0 KiB  |
| `abilities`         | 115.8 KiB  | 33.6 KiB  | 28.3 KiB  |
| `trainers`          | 99.0 KiB   | 26.7 KiB  | 22.9 KiB  |

The data chunks among them (`species`, `facing`, `stats`, `moves`, `items`, `biome`, `abilities`, `trainers`) come to 3341.1 KiB raw and 718.5 KiB gzipped, about 60% of the gzipped startup.

Loaded later, on top of the startup set:

| Import                                        | Raw        | gzip           | brotli         |
| --------------------------------------------- | ---------- | -------------- | -------------- |
| `src/components/battle/battle-view/index.tsx` | 1311.5 KiB | 346.1 KiB      | 279.1 KiB      |
| `src/components/news/NewsTab.tsx`             | 917.0 KiB  | 111.2 KiB      | 81.4 KiB       |
| Each NPC's `interact` script                  | 3 to 9 KiB | 1.5 to 4.1 KiB | 1.4 to 3.7 KiB |

## Changes since the baseline

| Change                                                                                                                                                                                           | Startup gzip | Difference          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | ------------------- |
| Official ja and es names (i18n-official-names)                                                                                                                                                   | 1280.2 KiB   | +79.4 KiB (+6.6%)   |
| Learn sets on their own loader (boot-learnsets-loader), measured on `2e8cebe27`: 1554.0 KiB before, 1234.2 KiB brotli before and 1124.8 KiB after                                                | 1400.7 KiB   | -153.3 KiB (-9.9%)  |
| Moves, abilities and items on demand, with only the page's locale of their text (boot-lazy-registries), measured on `a34ff6ddb`: 1400.7 KiB before, 1124.7 KiB brotli before and 936.1 KiB after | 1150.3 KiB   | -250.4 KiB (-17.9%) |

The learn sets (`src/data/species/learnsets/`) now load as their own chunk (`learnsets`, 876.8 KiB raw, 154.4 KiB gzip), fetched after the first frame by `ensureLearnSets` in `src/data/learnset-data.ts`. `ensureBattleData` waits on it too, because the TMs are registered off every species' teachable list. The server and the tests take them at once through `registerGameData`.

## Recording a change

A change to what loads at boot runs `pnpm build && pnpm measure-boot` before and after, and puts both startup totals in its pull request. When a change moves the baseline for good, update the tables above with the date and commit.

## Moves, abilities and items

The three registries load through `src/data/<registry>/load.ts`, reached from `ensureBattleData` (`src/data/battle-data.ts`) by dynamic import. Each registry's `index.ts` keeps only the getters, so the 150 or so files that import it no longer pull the YAML in. The server, the tests and the scripts take every locale at once through `register.ts` (`registerGameData` does).

In the browser a load reads English (bundled with the registry) and the page's locale, one file per text file (`src/data/locale-text.ts`). Other locales are never fetched. A locale's text no longer costs a player who does not use it.

Before and after on the main page (`a34ff6ddb`, then the same plus this change):

| Chunk         | Startup before (gzip) | Startup after (gzip)                    | Loaded later (gzip)            |
| ------------- | --------------------- | --------------------------------------- | ------------------------------ |
| `moves`       | 99.6 KiB              | gone                                    | 48.7 KiB (`moves/load.ts`)     |
| `abilities`   | 94.2 KiB              | gone                                    | 34.4 KiB (`abilities/load.ts`) |
| `items`       | 70.0 KiB              | 5.5 KiB (getters, fossils and the like) | 31.7 KiB (`items/load.ts`)     |
| Startup total | 1400.7 KiB            | 1150.3 KiB                              |                                |

The loaded-later figures are on top of the startup set and hold English plus the files of one locale at most (`ja`, `es` text are not in them). `trainers` (55.7 KiB gzip) stays in the startup set: the overworld imports it directly.
