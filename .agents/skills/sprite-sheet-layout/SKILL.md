---
name: sprite-sheet-layout
description: >
  Pokemon sheets hold each distinct picture once, cropped to the pixels
  that are lit, and every frame says which picture it is and where in
  its box that picture hangs. Applies whenever writing or reviewing
  sheet packing, sheet metadata, or anything that draws a species
  sprite.
---

**A sheet is a bag of pictures, not a grid.** Every distinct picture sits wherever the packer put it, at whatever size its own content needs. Nothing is laid out in rows and columns, and **a clip does not own a region** — the pictures belong to the pokemon, and two animations holding the same drawing point at one copy of it.

`{region}/meta/{species}.json` says it in three parts:

- `sheet.pictures` — every picture's rectangle and its marks, as `[x, y, width, height, [center, head, left, right]]`, for the whole sheet.
- a frame's `cell` and `flip` — which of those it draws, and whether it draws it mirrored.
- a frame's `at` — where that picture's corner sits inside its clip's box.

**The marks live on the picture, not on the frame.** A pose packed once and played by nine frames has its head in the same place in all nine, so head, centre and both hands are written once beside the picture and `marksOf` puts them back on a frame. Only the shadow is the frame's own, because a pokemon at the top of a hop is drawn the same as one on the ground and its shadow is not in the same place. A frame that disagrees with its picture carries its own marks in a fifth slot, which is about one frame in a hundred and fifty.

**An animation is a number, and a frame is an array.** A clip is keyed by [`SpriteAnim`](../../../src/data/ids/sprite-anims.ts) rather than by name, and a frame is written `[shadow, cell, flip, at]`, with `[..., marks]` where it overrides its picture — position is the contract, and `sprite-sheet.ts` names the slots. Both are about size, and so is the file being written without indentation: dropping the field names took the descriptions from 51.5MB to 7.2MB, and lifting the marks onto the pictures halved what was left, 9.0MB to 4.4MB.

**The file says which shape it is in.** `version: 2` is the shape above; a file with no version at all is version 1, which wrote all five marks on every frame, and `sprite-sheet.ts` still reads it. `scripts/lift-marks.ts` converts one to the other, and a tool that writes descriptions writes version 2.

`SpriteAnim`'s numbers are **append-only** — they are in every description on disk. A new animation takes the next free number; nothing already there ever moves.

## Rules

- **The clip's box is `frameWidth` × `frameHeight`.** It is the union of every frame of every direction, it does not change while a clip plays, and **every anchor is in its coordinates**. It is what a sprite is placed, measured and hit-tested by, and what the DOM sizes its element to.
- **`sourceFrameWidth`/`sourceFrameHeight` are the cell the artist drew in.** They are authored generously — a Hop is given room for a jump twice the height anything reaches — so they are never a layout measure. They are for the shadow's width and the sparkle's spread, which are facts about the pokemon's size.
- **Read a frame through the description, never by arithmetic on the grid.** `frame * frameWidth` is wrong: two frames of a clip are different sizes and sit in different places, and the picture may be somewhere another clip put it.
- **Pictures are compared across a pair of coats at once, and across every clip.** A coat and its shiny share one description, so two frames are the same picture only when they match in both; two clips share a picture only when they were compared across the same coats — see [`dedupe.ts`](../../../src/server/sprites/dedupe.ts).
- **A female is a sheet of its own.** It is a redrawing rather than a recolour, so it is packed apart from the plain coat and described in `meta/{species}_f.json`; nothing of the plain coat's layout is imposed on it. `spriteMetaPath(species, female)` is what picks between them.
- **A mirrored frame keeps its own place.** `flip` says the picture's pixels are reversed; `at` is still measured from the left of the box, and only a caller-requested flip turns it round.
- **Sheets are filed by region.** `public/sprites/pokemon/{region}/{regular,shiny,meta}` — `kanto` for the first hundred and fifty-one, `unknown` for Missingno, the egg and the substitute. Which region a pokemon is in comes from its dex number ([`getSpeciesRegion`](../../../src/data/species/regions.ts)), never from a list beside the files; `coats.json` stays at the root and says nothing about regions.
- **Clips keyed by name do not load at all.** A description older than `SpriteAnim`'s numbers reads as no clips; repack it rather than patching the file.

## Why

Cropping is most of a sheet, and sharing across clips is most of what is left. A clip's box has to hold its widest lunge, so every quieter frame rattles around inside a box drawn for one reach — and once cropped, two thirds of what remains turns out to be a drawing another clip already has. Packing the 154 sheets that ship this way took them from 171M pixels to 6M, 15.0MB to 2.1MB on disk, and 1752MB to 49MB decoded in a browser.

## Repacking

[`scripts/repack-sprites.ts`](../../../scripts/repack-sprites.ts) packs everything under `public/sprites/pokemon` again, in place, and is safe to run twice — a sheet already packed this way has nothing left to merge. It reads version 1 only, and leaves a version 2 description alone rather than cutting it up: repacking one of those means packing it again in the SpriteCollab checkout.

Run [`scripts/sprite-coats.ts`](../../../scripts/sprite-coats.ts) after it, and after anything else that writes sheets outside the processor, so the content stamps match what is on disk. Without it browsers go on drawing yesterday's sheet against today's description, which draws nothing at all.

## Source art

Pokemon sprites come from **SpriteCollab**, the PMD sprite collection. The working copy is the `SpriteCollab` checkout beside this repository (`../SpriteCollab`), a fork of [PMDCollab/SpriteCollab](https://github.com/PMDCollab/SpriteCollab) at [lxsmnsyc/SpriteCollab](https://github.com/lxsmnsyc/SpriteCollab), with the upstream on the `upstream` remote.

Go there for anything about which sprites exist and what shape they are in: `sprite/{dex}/` per pokemon with its `AnimData.xml` and the three images per animation, `tracker.json` for what is drawn and by whom, `credit_names.txt` for attribution. Read the answer out of that checkout rather than guessing from what is already packed under `public/sprites`, and pull the fork before deciding a sprite is missing.
