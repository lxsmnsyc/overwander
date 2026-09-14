---
name: terraces
description: How a step between terrace levels works in the overworld, what a cliff tile is, and how both boards draw it. Applies whenever changing terrace levels, walkability, placement of anything on the ground, or how the board draws a step.
---

# Terraces and cliffs

`levelAt` in `src/overworld/terrace.ts` says how high a cell stands. A level only counts where the cell belongs to a 2x2 block standing at least that high, so a cliff is never one cell wide. The first step stands above the beaches and wetlands, so the sea and the low shore beside it are both level 0 and a coast meets open sea without a cliff.

## The edge tile is the cliff

A cell standing higher than **any** of its eight neighbours is a face (`isFace` in `src/overworld/cliff.ts`). Diagonals count: a cell touching lower ground only at a corner is where the ring's inside corner is drawn, and that tile is as much the cliff as a side.

- Nobody walks on a face, unless a seam runs through it (`blocksWalk`). Water on a face is always a seam: a pool never sits at a dry drop, so it pours into more water. A natural pass (`isPassAt`) is a band three cells wide crossing a cliff every twenty cells along it, offset by a seeded hash per stretch and level, so a walk beside a terrace is never far from a way up. A road, a route or a pass seams a face only where it leads somewhere (`leadsThrough`): lower ground straight beside it, and where the faces beside it turn a corner, every one of those faces a way through too. A face touching lower ground only at a diagonal, or a corner joined to a single other seam, reaches the high ground only diagonally, so it stays a cliff. Faces on two opposite sides are a straight cliff line, the usual way through.
- Underground every face is a seam (`isSeam` answers yes at `Depth.Cave`), corners included, so no cliff ever crosses a cave passage. A cave's rock walls are not faces: they are `wall` cells, raised a level only for drawing.
- Nothing is placed on a face, seamed or not: no scenery, no rolled landmark, no spawn, no phenomenon and no player start. `Chunk.getFaceCells()` is the set to leave out.

## Water at a step

Water is never a cliff unless the lower ground beside it, diagonals included, is water too. Then the two are one fall. Water that would stand at the lip of a dry drop is dried to ground by the lip rule in `src/overworld/ground.ts`. Every 2x2 block of water stands on one level, so a cell's water depends only on the water below it and the lip rule reads the finished answer there.

## Drawing it

The cliff art is the biome's `face` terrain: the 3x3 ring autotile and its inside corner piece. `terrainCell` lays it whole on a dry, unseamed face as the `cliffs` step, picked for the neighbours standing at least as high, after the paving and before the blends between two countries. A cliff tile never takes a blend on top of it. An open sea draws no shore of its own, so dry ground of another country beside it lays the sea's hollow `blend` ring at the `shore` step, turned with the camera like any shore. Both boards draw that same cell.

- **Flat board:** the ring lies on the edge tile like any other layer.
- **Laid-back board:** a cliff tile always comes from the bottom row of the ring (or the bottom of the inside corner piece), picked with the neighbourhood turned so the low side reads as south and drawn turned back, so the rock face looks the same whichever way the step falls. Every quad corner sinks to the lowest of the four cells meeting there. A face tile therefore runs from the ground above it to the ground below, stitched at both edges, with no wall and no gap. The WebGL scene (`src/canvas/three/board-scene.ts`) and the canvas fallback (`src/components/overworld/chunk-canvas/index.tsx`) follow the same rule, and so does picking a cell under the pointer.
