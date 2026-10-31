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

| Change | Startup gzip | Difference |
| --- | --- | --- |
| Official ja and es names (i18n-official-names) | 1280.2 KiB | +79.4 KiB (+6.6%) |

Every locale's registry text is bundled with English, so each locale costs every player its download, shown or not. `boot-lazy-registries` should load only the active locale's.

## Recording a change

A change to what loads at boot runs `pnpm build && pnpm measure-boot` before and after, and puts both startup totals in its pull request. When a change moves the baseline for good, update the tables above with the date and commit.
