# Log: spawn-radius

- Branch feat/spawn-radius from batch/overwander. Nothing of the node existed.
- Fade constants added to `src/overworld/spawn-life/index.ts`; `DRAW_RADIUS` lives in `spawn-radius.ts` (it equals `BOARD_RADIUS`).
- Fade is computed per frame in the chunk view from a closure on the coat, so the board is not rebuilt for fades.
- Did not run `pnpm dev`: no browser check of the look.
