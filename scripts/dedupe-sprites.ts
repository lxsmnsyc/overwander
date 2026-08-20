import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import type { Deduped, Pixels, Rect } from '../src/server/sprites/dedupe.ts';
import dedupe, { blankPixels, drawPictures, packedGrid } from '../src/server/sprites/dedupe.ts';
import pack from '../src/server/sprites/packing.ts';
import decode, { encodeSmallest } from '../src/server/sprites/png.ts';

/**
 * Packs every sheet that already ships to the pixels that are lit.
 *
 * A clip's box has to hold its widest lunge, so every quieter frame of
 * it rattles around inside a box drawn for one reach — about four
 * fifths of a sheet is empty by area. This crops each picture to what
 * is drawn in it, keeps one copy of each distinct one, and writes the
 * sheets and the description again with every frame saying which
 * picture it is and where in the box that picture sits.
 *
 * It replaces the files in place, which is safe to run twice: a sheet
 * already packed this way has nothing left to crop, and comes out the
 * same size it went in.
 */

const ROOT = 'public/sprites/pokemon';
const COATS = [
  { path: (stem: string) => `${ROOT}/regular/${stem}.png`, name: 'regular' },
  { path: (stem: string) => `${ROOT}/shiny/${stem}.png`, name: 'shiny' },
];

interface Frame extends Record<string, unknown> {
  cell?: number;
  flip?: boolean;
}

interface Sprite {
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  frames: Frame[];
  cells?: { columns: number; rows: number };
  pictures?: Rect[];
}

interface Box {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Sheet {
  sheet: { width: number; height: number; images: Box[] };
  // The description is read off disk, so a clip named in the layout
  // and missing from here is a file somebody edited by hand
  sprites: Record<string, Sprite | undefined>;
}

/** One clip, once its pictures have been cropped and laid out again. */
interface Packed {
  /** Where each kept picture is read from on the sheet as it stands. */
  pictures: Rect[];
  /** Where each of them goes inside the clip's new region. */
  spots: ({ x: number; y: number } | undefined)[];
  /** One a frame of the clip, in the description's own order. */
  frames: { cell: number; flip: boolean; at: [number, number] }[];
  width: number;
  height: number;
}

function say(message: string): void {
  process.stdout.write(`${message}\n`);
}

/** Every drawing of one pokemon: the plain coat, and whichever exist beside it. */
function coatsOf(species: string): { name: string; path: string }[] {
  const found: { name: string; path: string }[] = [];

  for (const suffix of ['', '_f']) {
    for (const coat of COATS) {
      const path = coat.path(`${species}${suffix}`);

      if (existsSync(path)) {
        found.push({ name: `${coat.name}${suffix}`, path });
      }
    }
  }
  return found;
}

/**
 * The clip's frames as they point at pictures today.
 *
 * A sheet packed before the repeats were found has no pictures of its
 * own: every frame is its own square in the grid, in reading order
 */
function pointersOf(sprite: Sprite): { cell: number; flip: boolean }[] {
  return sprite.frames.map((frame, at) => ({
    cell: typeof frame.cell === 'number' ? frame.cell : at,
    flip: frame.flip === true,
  }));
}

/**
 * Crops one clip's pictures and lays them out again.
 *
 * The sheet on disk is the source: its pictures are read as a grid,
 * cropped to what is drawn in them, and matched against each other
 * once more — cropping turns two poses that differ only in where they
 * sit into one picture the frames hang in different places
 */
function repack(sprite: Sprite, box: Box, drawings: Pixels[]): Packed {
  const columns = sprite.cells?.columns ?? sprite.columns;
  const rows = sprite.cells?.rows ?? sprite.rows;
  const grid = packedGrid(box.x, box.y, sprite.frameWidth, sprite.frameHeight, columns, rows);
  const found: Deduped = dedupe(drawings.map((raster) => ({ raster, grid })));
  const pointers = pointersOf(sprite);
  const frames = pointers.map((pointer) => {
    const held = found.frames[pointer.cell];
    const picture = found.pictures[held.cell];
    // A frame drawn from the other side of its picture sits as far from
    // the right edge of the box as the picture sat from the left
    const x = pointer.flip ? sprite.frameWidth - held.at[0] - picture.width : held.at[0];

    return {
      cell: held.cell,
      flip: held.flip !== pointer.flip,
      at: [x, held.at[1]] as [number, number],
    };
  });

  // A grid holds a square for every slot, and the last row of one is
  // usually part empty: those pictures are nothing any frame asks for
  const wanted = [...new Set(frames.map((frame) => frame.cell))].sort((one, two) => one - two);
  const moved = new Map(wanted.map((cell, at) => [cell, at]));
  const pictures = wanted.map((cell) => found.pictures[cell]);
  const inside = pack(pictures.map((picture, at) => ({ at, w: picture.width, h: picture.height })));
  const spots: ({ x: number; y: number } | undefined)[] = [];

  for (const { box: placed, x, y } of inside.placed) {
    spots[placed.at] = { x, y };
  }
  return {
    pictures,
    spots,
    frames: frames.map((frame) => ({ ...frame, cell: moved.get(frame.cell) ?? 0 })),
    width: inside.width,
    height: inside.height,
  };
}

let sheets = 0;
let before = 0;
let after = 0;
let wasArea = 0;
let isArea = 0;

for (const file of readdirSync(`${ROOT}/meta`).sort()) {
  // Both coats and both forms share one description, so a `_f` file
  // beside it is an older run's leftover: the game never reads one
  if (!file.endsWith('.json') || file.endsWith('_f.json')) {
    continue;
  }
  const species = file.replace('.json', '');
  const raw = readFileSync(`${ROOT}/meta/${file}`, 'utf8');

  if (raw.trim().length === 0) {
    continue;
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const meta = JSON.parse(raw) as Sheet;
  const coats = coatsOf(species);

  if (coats.length === 0) {
    say(`${species}: described but not drawn, left alone`);
    continue;
  }
  const drawings = coats.map((coat) => {
    const image = decode(readFileSync(coat.path));

    return { ...coat, raster: { width: image.width, height: image.height, data: image.rgba } };
  });
  const placed = new Map<string, Box>();

  for (const box of meta.sheet.images) {
    placed.set(box.name, box);
  }

  // What each clip keeps, worked out once and used for every coat
  const kept = new Map<string, Packed>();
  const boxes: { name: string; w: number; h: number }[] = [];

  for (const [name, sprite] of Object.entries(meta.sprites)) {
    const box = placed.get(name);

    if (box == null || sprite == null) {
      continue;
    }
    const found = repack(
      sprite,
      box,
      drawings.map((drawing) => drawing.raster),
    );

    kept.set(name, found);
    boxes.push({ name, w: found.width, h: found.height });
    wasArea += box.width * box.height;
    isArea += found.width * found.height;
  }

  const layout = pack(boxes);
  const images: Sheet['sheet']['images'] = [];

  for (const drawing of drawings) {
    const sheet = blankPixels(layout.width, layout.height);

    for (const { box, x, y } of layout.placed) {
      const found = kept.get(box.name);

      if (found == null) {
        continue;
      }
      drawPictures(sheet, drawing.raster, found.pictures, found.spots, { x, y });
      if (drawing === drawings[0]) {
        images.push({ name: box.name, x, y, width: box.w, height: box.h });
      }
    }
    const encoded = encodeSmallest({
      width: sheet.width,
      height: sheet.height,
      rgba: sheet.data,
    });

    before += readFileSync(drawing.path).length;
    after += encoded.bytes.length;
    writeFileSync(drawing.path, encoded.bytes);
  }

  for (const [name, sprite] of Object.entries(meta.sprites)) {
    const found = kept.get(name);

    if (found == null || sprite == null) {
      continue;
    }
    sprite.pictures = found.pictures.map((picture, at) => ({
      x: found.spots[at]?.x ?? 0,
      y: found.spots[at]?.y ?? 0,
      width: picture.width,
      height: picture.height,
    }));
    // The grid of squares is what the pictures replace
    sprite.cells = undefined;
    sprite.frames = sprite.frames.map((frame, at) => ({
      ...frame,
      cell: found.frames[at]?.cell ?? 0,
      flip: found.frames[at]?.flip ?? false,
      at: found.frames[at]?.at ?? [0, 0],
    }));
  }
  meta.sheet = { width: layout.width, height: layout.height, images };
  writeFileSync(`${ROOT}/meta/${file}`, `${JSON.stringify(meta, null, 2)}\n`);

  sheets += 1;
  say(
    `${species}: ${[...kept.values()].reduce((sum, found) => sum + found.pictures.length, 0)} pictures, ` +
      `${layout.width}×${layout.height}, ${drawings.length} coats`,
  );
}

say(
  `\n${sheets} sheets, ${(before / 1048576).toFixed(1)}MB → ${(after / 1048576).toFixed(1)}MB on disk, ` +
    `${(wasArea / 1e6).toFixed(0)}M → ${(isArea / 1e6).toFixed(0)}M pixels`,
);
