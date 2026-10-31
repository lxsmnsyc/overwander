# Outcome: boot-measure

## Built

- `scripts/measure-boot.ts`, run as `pnpm measure-boot [route]` after `pnpm build`. It walks the client manifest from `src/entry-client.tsx` and the route's chunk through every static import, prints each startup file raw, gzipped and brotli-compressed, largest first, and the total. Then it lists each dynamic import made from the startup set with what it adds on top. Other routes are left out.
- `docs/engine/boot.md`: how to measure, the baseline, and how a boot change reports before and after. Linked from `docs/engine.md`.

## Baseline

- Main page on `2afebb1e2`: 121 files, 4792.1 KiB raw, 1200.8 KiB gzip, 960.6 KiB brotli.
- The data chunks (`species`, `facing`, `stats`, `moves`, `items`, `biome`, `abilities`, `trainers`) are 718.5 KiB of the 1200.8 KiB gzipped, about 60%.
- The battle view adds 346.1 KiB gzipped when a fight opens, and the news tab 111.2 KiB.

## Deviations

- `package.json` gains the `measure-boot` script, and `docs/engine.md` a row, outside the owned paths.

## Stubs left

- None.

## Gotchas

- Chunk names are the bundler's. A chunk called `facing` or `stats` holds whatever rolldown grouped into it, so check the source before assuming what it holds.
- The script reads `.output/public`, so it measures whatever was built last. Build on the commit being measured.

## Verification

- `pnpm typecheck` passes, and oxlint reports no errors on the script (warnings only for its `console` output, as every script has).
- `pnpm build && pnpm measure-boot` prints the numbers above.
