import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import dedupe, { blankPixels, drawCells, packedGrid } from '../src/server/sprites/dedupe.ts';
import pack from '../src/server/sprites/packing.ts';
import decode, { encodeSmallest } from '../src/server/sprites/png.ts';

/**
 * Packs every sheet that already ships once instead of twice.
 *
 * A sheet holds each frame of each direction, and about half of those
 * are a picture the sheet already has — a pose held for ten frames, or
 * a row that is another row mirrored. This finds them by comparing
 * pixels across every coat of the pokemon, keeps one of each, and
 * writes the sheets and the description again with the frames pointing
 * at what they are drawn from.
 *
 * It replaces the files in place, which is safe to run twice: a sheet
 * already packed this way has nothing left to find, and comes out the
 * same size it went in.
 */

const ROOT = 'public/sprites/pokemon';
const COATS = [
  { path: (stem: string) => `${ROOT}/regular/${stem}.png`, name: 'regular' },
  { path: (stem: string) => `${ROOT}/shiny/${stem}.png`, name: 'shiny' },
];

interface Sprite {
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  frames: Record<string, unknown>[];
  cells?: { columns: number; rows: number };
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

let sheets = 0;
let before = 0;
let after = 0;

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
  const kept = new Map<string, ReturnType<typeof dedupe>>();
  const boxes: { name: string; w: number; h: number }[] = [];

  for (const [name, sprite] of Object.entries(meta.sprites)) {
    const box = placed.get(name);

    if (box == null || sprite == null) {
      continue;
    }
    const grid = packedGrid(
      box.x,
      box.y,
      sprite.frameWidth,
      sprite.frameHeight,
      sprite.columns,
      sprite.rows,
    );
    const found = dedupe(drawings.map((drawing) => ({ raster: drawing.raster, grid })));

    kept.set(name, found);
    boxes.push({
      name,
      w: found.columns * sprite.frameWidth,
      h: found.rows * sprite.frameHeight,
    });
  }

  const layout = pack(boxes);
  const images: Sheet['sheet']['images'] = [];

  for (const drawing of drawings) {
    const sheet = blankPixels(layout.width, layout.height);

    for (const { box, x, y } of layout.placed) {
      const sprite = meta.sprites[box.name];
      const found = kept.get(box.name);
      const was = placed.get(box.name);

      if (sprite == null || found == null || was == null) {
        continue;
      }
      drawCells(
        sheet,
        drawing.raster,
        packedGrid(
          was.x,
          was.y,
          sprite.frameWidth,
          sprite.frameHeight,
          sprite.columns,
          sprite.rows,
        ),
        { x, y },
        found,
      );
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
    sprite.cells = { columns: found.columns, rows: found.rows };
    sprite.frames = sprite.frames.map((frame, at) => ({
      ...frame,
      cell: found.frames[at]?.cell ?? 0,
      flip: found.frames[at]?.flip ?? false,
    }));
  }
  meta.sheet = { width: layout.width, height: layout.height, images };
  writeFileSync(`${ROOT}/meta/${file}`, `${JSON.stringify(meta, null, 2)}\n`);

  const cells = [...kept.values()].reduce((sum, found) => sum + found.cells.length, 0);
  const frames = [...kept.values()].reduce((sum, found) => sum + found.frames.length, 0);

  sheets += 1;
  say(
    `${species}: ${frames} frames → ${cells} pictures (${Math.round((1 - cells / frames) * 100)}% saved), ` +
      `${layout.width}×${layout.height}, ${drawings.length} coats`,
  );
}

say(
  `\n${sheets} sheets, ${(before / 1048576).toFixed(1)}MB → ${(after / 1048576).toFixed(1)}MB on disk`,
);
