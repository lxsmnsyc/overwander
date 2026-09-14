---
name: terraces
description: How a step between terrace levels works in the overworld, what a cliff tile is, and how both boards draw it. Applies whenever changing terrace levels, walkability, placement of anything on the ground, or how the board draws a step.
---

# Terraces and cliffs

`levelAt` in `src/overworld/terrace.ts` says how high a cell stands. A level only counts where the cell belongs to a 2x2 block standing at least that high, so a cliff is never one cell wide.

## The edge tile is the cliff

A cell standing higher than **any** of its eight neighbours is a face (`isFace` in `src/overworld/cliff.ts`). Diagonals count: a cell touching lower ground only at a corner is where the ring's inside corner is drawn, and that tile is as much the cliff as a side.

- Nobody walks on a face, unless a seam runs through it (`blocksWalk`). A seam is a road, a route, or water falling one way into more water.
- Nothing is placed on a face, seamed or not: no scenery, no rolled landmark, no spawn, no phenomenon and no player start. `Chunk.getFaceCells()` is the set to leave out.

## Water at a step

Water is never a cliff unless the lower ground beside it, diagonals included, is water too. Then the two are one fall. Water that would stand at the lip of a dry drop is dried to ground by the lip rule in `src/overworld/ground.ts`.

## Drawing it

The cliff art is the biome's `face` terrain: the 3x3 ring autotile and its inside corner piece. `terrainCell` lays it whole on a dry, unseamed face as the `cliffs` step, picked for the neighbours standing at least as high, after the paving and before the blends between two countries. A cliff tile never takes a blend on top of it. Both boards draw that same cell.

- **Flat board:** the ring lies on the edge tile like any other layer.
- **Laid-back board:** a cliff tile always comes from the bottom row of the ring (or the bottom of the inside corner piece), picked with the neighbourhood turned so the low side reads as south and drawn turned back, so the rock face looks the same whichever way the step falls. Every quad corner sinks to the lowest of the four cells meeting there. A face tile therefore runs from the ground above it to the ground below, stitched at both edges, with no wall and no gap. The WebGL scene (`src/canvas/three/board-scene.ts`) and the canvas fallback (`src/components/overworld/chunk-canvas/index.tsx`) follow the same rule, and so does picking a cell under the pointer.
