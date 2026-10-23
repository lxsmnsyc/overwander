# Pixel effects strategy

How the overworld and battle effects come to look like the sprites they are drawn over: blocky, with hard edges and few colours, instead of smooth vector shapes and soft gradients. This plan comes after [the translations](translations.md).

## Where things stand

The sprites are pixel art drawn with nearest-neighbour sampling. Most effects are not:

| Area | Where | How it draws today |
| --- | --- | --- |
| Move landings | `src/canvas/battle/moves/effect/` (about 30,600 lines) | Canvas 2D paths, arcs and gradients |
| Move landings, lit scene | `src/canvas/battle/moves/lit/` (about 27,900 lines), through `src/canvas/three/effect-batch.ts` | Quads in field units, each shaded per pixel by one fragment shader that knows 12 shapes (glow, ring, streak, star, shard, ribbon, bubble, leaf, pit, heart, pane, puff) |
| Move waits | `src/canvas/battle/moves/delay.ts` and `lit/delay.ts` | As above |
| Battle cues | `src/canvas/battle/cues/` and `cues/lit` | Canvas 2D shapes, and effect atlases for marks |
| Battle weather and field | `src/canvas/battle/weather.ts`, `field-weather.ts`, `battle-canvas/dynamax.ts` | Canvas 2D |
| Overworld auras and sparkle | `src/canvas/effects/` | Canvas 2D, radial gradients |
| Overworld sky and weather | `src/canvas/sky/` | Canvas 2D and small stretched buffers |
| Board lights | `src/canvas/overworld/beacon.ts`, `herald.ts` | Canvas 2D, radial gradients |

The painters stay. The rework changes how their output reaches the screen, not what each shape is.

## Decided

- **Route: a low-resolution buffer.** Effects are drawn into a buffer with one texel per sprite pixel, then scaled up with nearest-neighbour sampling. Every move changes at once, and no shape is redrawn by hand.
- **The grid is the sprites' own.**
  - One effect texel is the size of one sprite pixel on screen.
  - In battle, that is the pixel size of the pokemon at the front of the field.
  - On the board, it is the size of a tile's pixel at the current zoom.
  - The buffer is anchored to the same origin as the sprites, so a texel edge never falls halfway across a sprite pixel.
- **Hard edges and few colours.**
  - Alpha falls into a few steps instead of a ramp. A glow becomes rings of flat colour.
  - Soft falloff that needs more than a few steps is drawn with a 4×4 ordered dither, as the old handhelds did.
  - Each colour is cut to a small ramp: the effect's colour, one lighter and one darker.
- **Keep the look.** Shapes, timing, size, colour and where each effect sits stay as they are. Only the sampling changes.
- **No setting to turn it off.** One look, like the sprites. The smooth path goes as each batch lands, so there is only one path to keep correct.
- **Lights and washes keep their gradients.** Daylight, the world shade and the lighting pass tint the whole picture rather than draw a thing on it, so pixelating them only adds banding.

## The order

| # | Batch | Content |
| --- | --- | --- |
| 0 | Grid | One helper that answers the pixel size and origin for the battle field and for the board at any zoom, with tests |
| 1 | Lit scene | The fragment shader snaps each fragment to the grid before it shades, cuts alpha to steps with the dither, and cuts colour to the ramp. All 12 shapes change at once |
| 2 | Canvas 2D moves | `BattleCanvas` draws landings and waits into an offscreen canvas at grid size, then scales it up with smoothing off. Lines thinner than one texel are widened to one, so nothing vanishes |
| 3 | Battle cues | The cue shapes go through the same buffer. The atlas marks are already pixel art, and are drawn on the grid |
| 4 | Battle weather and field | Rain, snow, sand, terrains, screens and the Dynamax glow, on the battle's grid |
| 5 | Overworld auras and sparkle | `src/canvas/effects/`, on the board's grid |
| 6 | Overworld sky and weather | `src/canvas/sky/`: drops, flakes, flashes and curtains on the board's grid |
| 7 | Board lights | Beacons and heralds, on the board's grid |
| 8 | Max Raid and Totem sites | Redrawn as pixel art. They are painted with the 2D canvas today, and were always meant to be redone |

## What every batch does

1. **Branch** `pixel-<slug>`, stacked on the previous batch, linked with `gh stack link`.
2. **Change the path, not the painters.** A painter is edited only where its output breaks on the grid, such as a line under a texel wide or a gradient with no flat step.
3. **Check it in the demo pages** (`/demo/move`, `/demo/aura`, `/demo/weather`, `/demo/board`, `/demo/raid`) with `pnpm dev` and `pnpm db`. You judge the look yourself, so I send no screenshots.
4. **Speed:** the buffer is smaller than the screen, so each batch measures one busy frame before and after. A batch must not make a frame slower.
5. **Changeset**, `patch`.
6. **Checks:** `pnpm test`, `pnpm typecheck`, and `rtk proxy pnpm exec oxlint src test`, read by its exit code.

## Still to decide

- **How many alpha steps** before the dither takes over. The proposal is four (none, a third, two thirds, full), tuned in batch 1 against the demo.

## Pace

- **One batch per PR, stacked.** Batch 1 goes up alone first, since it decides the look every later batch copies.
