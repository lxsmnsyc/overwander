---
name: sprite-sheet-layout
description: >
  Pokemon sheets hold each distinct picture once, cropped to the pixels
  that are lit, and every frame says which picture it is and where in
  its box that picture hangs. Applies whenever writing or reviewing
  sheet packing, sheet metadata, or anything that draws a species
  sprite.
---

**A sheet is a bag of pictures, not a grid.** Each clip has a region on the sheet, and inside it every distinct picture sits wherever the packer put it, at whatever size its own content needs. Nothing is laid out in rows and columns any more.

The description of one clip — `sprites[name]` in `meta/{species}.json` — says it in three parts:

- `pictures` — each kept picture's rectangle inside the clip's region.
- `frames[].cell` and `frames[].flip` — which picture a frame draws, and whether it draws it mirrored.
- `frames[].at` — where that picture's corner sits inside the clip's box.

## Rules

- **The clip's box is `frameWidth` × `frameHeight`.** It is the union of every frame of every direction, it does not change while a clip plays, and **every anchor is in its coordinates**. It is what a sprite is placed, measured and hit-tested by, and what the DOM sizes its element to.
- **`sourceFrameWidth`/`sourceFrameHeight` are the cell the artist drew in.** They are authored generously — a Hop is given room for a jump twice the height anything reaches — so they are never a layout measure. They are for the shadow's width and the sparkle's spread, which are facts about the pokemon's size.
- **Read a frame through the description, never by arithmetic on the grid.** `frame * frameWidth` is wrong: two frames of a clip are different sizes and sit in different places.
- **Pictures are compared across every coat at once.** Four coats share one description, so two frames are the same picture only when they match on all of them — see [`dedupe.ts`](../../../src/server/sprites/dedupe.ts).
- **A mirrored frame keeps its own place.** `flip` says the picture's pixels are reversed; `at` is still measured from the left of the box, and only a caller-requested flip turns it round.
- **Old sheets still read.** A description with `cells` and no `pictures` is the earlier uniform grid; the loader handles both, so do not assume one shape when reading a sheet you did not write.

## Why

Cropping is most of a sheet. A clip's box has to hold its widest lunge, and every quieter frame of it rattles around inside a box drawn for one reach: packing the 154 sheets that ship this way took them from 171M pixels to 16M, and from 15.0MB to 4.5MB on disk. Decoded in a browser that is the difference between a gigabyte of sprite and a hundred megabytes.

## Repacking

[`scripts/dedupe-sprites.ts`](../../../scripts/dedupe-sprites.ts) repacks everything under `public/sprites/pokemon` in place, and is safe to run twice — a sheet already packed this way has nothing left to crop. Run [`scripts/sprite-coats.ts`](../../../scripts/sprite-coats.ts) after it so the content stamps match, or browsers keep drawing yesterday's sheet against today's description.
