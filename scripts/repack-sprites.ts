import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import deduper, { blankPixels, drawPictures, packedGrid } from '../src/server/sprites/dedupe.ts';
import { packSmallest } from '../src/server/sprites/packing.ts';
import decode, { encodeSmallest } from '../src/server/sprites/png.ts';

/**
 * Packs every sheet that already ships once per **pokemon** rather than
 * once per clip.
 *
 * A pokemon standing still is drawn the same in its Idle, its Charge
 * and the first frame of its Attack, and cropping made those
 * comparable — they were different sizes while each carried its own
 * clip's padding. About two thirds of a sheet's pictures turn out to be
 * a picture another clip already has.
 *
 * The clips stop owning a region of the sheet: every picture is placed
 * on its own, `sheet.pictures` says where each of them landed, and a
 * frame names one of those wherever in the sheet it sits.
 *
 * It replaces the files in place, and is safe to run twice — a sheet
 * already packed this way has nothing left to merge.
 */

const ROOT = 'public/sprites/pokemon';
const SIDES = ['regular', 'shiny'];

/** Every region with sheets under it, whatever it is called. */
function regionsOf(): string[] {
  return readdirSync(ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/** A frame, as the description writes it. */
type Frame = [
  shadow: unknown,
  center: unknown,
  head: unknown,
  left: unknown,
  right: unknown,
  cell: number,
  flip: 0 | 1,
  at: [number, number],
];

interface Sprite {
  frames: Frame[];
  /** Where this clip's pictures are, inside its region. */
  pictures?: { x: number; y: number; width: number; height: number }[];
}

interface Region {
  name: number;
  x: number;
  y: number;
}

interface Meta {
  sheet: {
    width: number;
    height: number;
    images?: Region[];
    pictures?: [number, number, number, number][];
  };
  sprites: Record<string, Sprite>;
}

const FRAME_CELL = 5;
const FRAME_FLIP = 6;

function say(message: string): void {
  process.stdout.write(`${message}\n`);
}

/** Every drawing of one pokemon: the plain coat, and whichever exist beside it. */
function coatsOf(region: string, species: string): string[] {
  const found: string[] = [];

  for (const suffix of ['', '_f']) {
    for (const side of SIDES) {
      const path = `${ROOT}/${region}/${side}/${species}${suffix}.png`;

      if (existsSync(path)) {
        found.push(path);
      }
    }
  }
  return found;
}

/**
 * Every picture of a description, wherever it sits on the sheet, and
 * how a clip's frames reach them.
 *
 * A sheet packed per clip keeps its pictures inside the clip's region
 * and numbers them from zero for each; one packed this way has already
 * put them all in one list that every clip numbers into
 */
function picturesOf(meta: Meta): {
  pictures: { x: number; y: number; width: number; height: number }[];
  cellOf: (clip: number, cell: number) => number;
} {
  if (meta.sheet.pictures != null) {
    return {
      pictures: meta.sheet.pictures.map(([x, y, width, height]) => ({ x, y, width, height })),
      cellOf: (_clip, cell) => cell,
    };
  }
  const boxes = new Map((meta.sheet.images ?? []).map((image) => [image.name, image]));
  const pictures: { x: number; y: number; width: number; height: number }[] = [];
  const starts: number[] = [];

  for (const [name, sprite] of Object.entries(meta.sprites)) {
    const box = boxes.get(Number(name));

    starts.push(pictures.length);
    for (const picture of sprite.pictures ?? []) {
      pictures.push({ ...picture, x: picture.x + (box?.x ?? 0), y: picture.y + (box?.y ?? 0) });
    }
  }
  return { pictures, cellOf: (clip, cell) => (starts[clip] ?? 0) + cell };
}

let sheets = 0;
let before = 0;
let after = 0;
let was = 0;
let is = 0;

const DESCRIBED = regionsOf().flatMap((held) =>
  readdirSync(`${ROOT}/${held}/meta`)
    .sort()
    .map((name) => ({ region: held, file: name })),
);

for (const { region, file } of DESCRIBED) {
  if (!file.endsWith('.json')) {
    continue;
  }
  const species = file.replace('.json', '');
  const raw = readFileSync(`${ROOT}/${region}/meta/${file}`, 'utf8');

  if (raw.trim().length === 0) {
    continue;
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const meta = JSON.parse(raw) as Meta;
  const paths = coatsOf(region, species);

  if (paths.length === 0) {
    say(`${species}: described but not drawn, left alone`);
    continue;
  }
  const drawings = paths.map((path) => {
    const image = decode(readFileSync(path));

    return { path, raster: { width: image.width, height: image.height, data: image.rgba } };
  });
  // Taken whole rather than cropped again: every picture on a sheet
  // that ships is already tight, and cropping twice would move the
  // corner a frame hangs from
  const shared = deduper(false);
  const clips = Object.entries(meta.sprites);
  const held = picturesOf(meta);
  const moved = held.pictures.map((picture) => {
    const [kept] = shared.add(
      drawings.map((drawing) => ({
        raster: drawing.raster,
        grid: packedGrid(picture.x, picture.y, picture.width, picture.height, 1, 1),
      })),
      0,
      'sheet',
    );

    return kept;
  });

  was += held.pictures.length;
  is += shared.pictures.length;

  const layout = packSmallest(
    shared.pictures.map((picture, at) => ({ at, w: picture.width, h: picture.height })),
  );
  const spots: ({ x: number; y: number } | undefined)[] = [];

  for (const { box, x, y } of layout.placed) {
    spots[box.at] = { x, y };
  }

  for (const drawing of drawings) {
    const sheet = blankPixels(layout.width, layout.height);

    drawPictures(sheet, shared.pictures, spots, () => drawing.raster);

    const encoded = encodeSmallest({
      width: sheet.width,
      height: sheet.height,
      rgba: sheet.data,
    });

    before += readFileSync(drawing.path).length;
    after += encoded.bytes.length;
    writeFileSync(drawing.path, encoded.bytes);
  }

  for (let at = 0; at < clips.length; at += 1) {
    const [, sprite] = clips[at];

    sprite.pictures = undefined;
    for (const frame of sprite.frames) {
      const kept = moved[held.cellOf(at, frame[FRAME_CELL])];

      // A picture kept the other way round turns this frame over as
      // well; where it hangs does not move, since a mirror is the same
      // size as what it mirrors
      frame[FRAME_FLIP] = (frame[FRAME_FLIP] === 1) === kept.flip ? 0 : 1;
      frame[FRAME_CELL] = kept.cell;
    }
  }
  meta.sheet = {
    width: layout.width,
    height: layout.height,
    pictures: shared.pictures.map((picture, at) => [
      spots[at]?.x ?? 0,
      spots[at]?.y ?? 0,
      picture.width,
      picture.height,
    ]),
  };
  writeFileSync(`${ROOT}/${region}/meta/${file}`, JSON.stringify(meta));

  sheets += 1;
  say(`${region}/${species}: ${layout.width}×${layout.height}, ${shared.pictures.length} pictures`);
}

say(
  `\n${sheets} sheets, ${(before / 1048576).toFixed(1)}MB → ${(after / 1048576).toFixed(1)}MB on disk, ` +
    `${was} → ${is} pictures`,
);
