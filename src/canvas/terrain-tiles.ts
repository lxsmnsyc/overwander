import type Biome from '../data/ids/biome';
import { asNumber, asNumberArray, asRecord, asRecordArray, asString } from '../auth/__normalize';

/**
 * The ground, drawn from one sheet of thirteen tiles a terrain.
 *
 * A terrain is drawn as a 3x3 patch and a 2x2 corner: a fill, four
 * edges, four outer corners and four inner ones. Every one of the 47
 * neighbourhoods is four quarters of those, each quarter picked by the
 * three cells that touch that corner of the tile. A cliff is taken
 * whole instead, because its rim is most of a tile thick and quarters
 * would cut it in half.
 *
 * The artist drew each patch standing in grass. That rim is cut away
 * in the pack and kept beside it as a **skirt**, a grey of how it was
 * shaded, so it can be painted in whatever the terrain actually stands
 * beside: sand against snow reads as sand against snow, not as sand
 * against a green ghost.
 */

/** Where the pack lives. */
const SHEET = '/sprites/terrain/biome-tiles.png';
const DATA = '/sprites/terrain/biome-tiles.json';

export type TerrainRole = 'ground' | 'wall' | 'water' | 'paving' | 'face';

/** How many pixels square one tile of the pack is. */
export const TERRAIN_TILE = 16;

const ROLES: TerrainRole[] = ['ground', 'wall', 'water', 'paving', 'face'];

/** A colour to stand a rim in, as hue, saturation and lightness. */
export type Tone = [hue: number, saturation: number, lightness: number];

/** Which of the eight neighbours are the same terrain. */
export interface Around {
  n: boolean;
  s: boolean;
  e: boolean;
  w: boolean;
  nw: boolean;
  ne: boolean;
  sw: boolean;
  se: boolean;
}

type Rect = [x: number, y: number, width: number, height: number];

interface Piece {
  from: string;
  tone: Tone;
  fill: Rect;
  art: Rect | null;
  corner: Rect | null;
  skirt: Rect | null;
  cornerSkirt: Rect | null;
}

interface Entry {
  biome: number;
  role: TerrainRole;
  name: string;
  piece: number;
}

/** Every neighbour the same, which is the tile with no edge on it. */
export const SURROUNDED: Around = {
  n: true,
  s: true,
  e: true,
  w: true,
  nw: true,
  ne: true,
  sw: true,
  se: true,
};

/** Where each quarter of a tile is read from, by its corner. */
const QUARTER = {
  nw: { at: [0, 0], fill: [16, 16], side: [16, 0], flank: [0, 16], outer: [0, 0], inner: [16, 16] },
  ne: {
    at: [8, 0],
    fill: [24, 16],
    side: [24, 0],
    flank: [40, 16],
    outer: [40, 0],
    inner: [8, 16],
  },
  sw: {
    at: [0, 8],
    fill: [16, 24],
    side: [16, 40],
    flank: [0, 24],
    outer: [0, 40],
    inner: [16, 8],
  },
  se: {
    at: [8, 8],
    fill: [24, 24],
    side: [24, 40],
    flank: [40, 24],
    outer: [40, 40],
    inner: [8, 8],
  },
} as const;

/** The vertical neighbour, the horizontal one and the diagonal between. */
const SIDES = {
  nw: ['n', 'w', 'nw'],
  ne: ['n', 'e', 'ne'],
  sw: ['s', 'w', 'sw'],
  se: ['s', 'e', 'se'],
} as const;

function asRect(value: unknown): Rect | null {
  const numbers = asNumberArray(value);

  return numbers.length < 4 ? null : [numbers[0], numbers[1], numbers[2], numbers[3]];
}

function asTone(value: unknown): Tone {
  const numbers = asNumberArray(value);

  return numbers.length < 3 ? [0, 0, 0.5] : [numbers[0], numbers[1], numbers[2]];
}

function canvasOf(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/** One channel of an hsl colour, the standard conversion. */
function channel(p: number, q: number, t: number): number {
  let at = t;

  if (at < 0) {
    at += 1;
  }
  if (at > 1) {
    at -= 1;
  }
  if (at < 1 / 6) {
    return p + (q - p) * 6 * at;
  }
  if (at < 1 / 2) {
    return q;
  }
  if (at < 2 / 3) {
    return p + (q - p) * (2 / 3 - at) * 6;
  }
  return p;
}

function toRgb([hue, saturation, lightness]: Tone): [number, number, number] {
  const h = (((hue % 360) + 360) % 360) / 360;
  const l = Math.min(1, Math.max(0, lightness));

  if (saturation === 0) {
    const value = Math.round(l * 255);

    return [value, value, value];
  }
  const q = l < 0.5 ? l * (1 + saturation) : l + saturation - l * saturation;
  const p = 2 * l - q;

  return [
    Math.round(channel(p, q, h + 1 / 3) * 255),
    Math.round(channel(p, q, h) * 255),
    Math.round(channel(p, q, h - 1 / 3) * 255),
  ];
}

/**
 * A terrain's art with its rim painted in the ground it stands beside.
 *
 * The skirt is a grey where 128 is the rim's own average: anything
 * lighter or darker was drawn that much lighter or darker, and the
 * offset is carried onto the neighbour's lightness so the shading
 * survives the swap
 */
function stood(
  sheet: ImageData,
  sheetWidth: number,
  art: Rect,
  skirt: Rect | null,
  over: Tone | null,
): HTMLCanvasElement {
  const [ax, ay, width, height] = art;
  const canvas = canvasOf(width, height);
  const context = canvas.getContext('2d');

  if (context == null) {
    return canvas;
  }
  const painted = context.createImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const to = (y * width + x) * 4;

      if (skirt != null && over != null) {
        const from = ((skirt[1] + y) * sheetWidth + skirt[0] + x) * 4;

        if (sheet.data[from + 3] > 0) {
          const [r, g, b] = toRgb([over[0], over[1], over[2] + sheet.data[from] / 255 - 0.5]);

          painted.data[to] = r;
          painted.data[to + 1] = g;
          painted.data[to + 2] = b;
          painted.data[to + 3] = 255;
        }
      }
      const from = ((ay + y) * sheetWidth + ax + x) * 4;

      if (sheet.data[from + 3] === 0) {
        continue;
      }
      painted.data[to] = sheet.data[from];
      painted.data[to + 1] = sheet.data[from + 1];
      painted.data[to + 2] = sheet.data[from + 2];
      painted.data[to + 3] = 255;
    }
  }
  context.putImageData(painted, 0, 0);
  return canvas;
}

/** The eight neighbours of a cell, asked of one terrain. */
export function around(x: number, y: number, is: (x: number, y: number) => boolean): Around {
  return {
    n: is(x, y - 1),
    s: is(x, y + 1),
    e: is(x + 1, y),
    w: is(x - 1, y),
    nw: is(x - 1, y - 1),
    ne: is(x + 1, y - 1),
    sw: is(x - 1, y + 1),
    se: is(x + 1, y + 1),
  };
}

/** The eight, clockwise from north. */
const CLOCKWISE: (keyof Around)[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

/**
 * The same neighbourhood turned to face the camera.
 *
 * The art is drawn for one point of view: a rim hangs from the same
 * corner of the tile however the board is stood. Walk the camera round
 * a quarter and the cell that reads as north to the art is the one
 * that was west, so the neighbourhood is turned before a tile is
 * chosen for it
 */
export function turned(near: Around, turns: number): Around {
  const step = (((turns % 4) + 4) % 4) * 2;

  if (step === 0) {
    return near;
  }
  const spun = { ...near };

  CLOCKWISE.forEach((side, at) => {
    spun[side] = near[CLOCKWISE[(at - step + 8) % 8]];
  });
  return spun;
}

/** Whether a cell is walled in by its own kind, with nothing to draw. */
export function enclosed(near: Around): boolean {
  return near.n && near.s && near.e && near.w && near.nw && near.ne && near.sw && near.se;
}

function maskOf(near: Around): number {
  return (
    (near.n ? 1 : 0) |
    (near.e ? 2 : 0) |
    (near.s ? 4 : 0) |
    (near.w ? 8 : 0) |
    (near.nw ? 16 : 0) |
    (near.ne ? 32 : 0) |
    (near.sw ? 64 : 0) |
    (near.se ? 128 : 0)
  );
}

/** One terrain of one biome, as the board draws it. */
export class Terrain {
  readonly name: string;
  readonly role: TerrainRole;
  readonly tone: Tone;

  private readonly piece: Piece;
  private readonly sheet: ImageData;
  private readonly sheetWidth: number;
  private readonly built = new Map<string, HTMLCanvasElement>();
  private readonly tiles = new Map<string, HTMLCanvasElement>();

  constructor(entry: Entry, piece: Piece, sheet: ImageData, sheetWidth: number) {
    this.name = entry.name;
    this.role = entry.role;
    this.tone = piece.tone;
    this.piece = piece;
    this.sheet = sheet;
    this.sheetWidth = sheetWidth;
  }

  /** The plain material, with no edge on it. */
  fill(): HTMLCanvasElement {
    return this.standing('fill', null);
  }

  /** Whether this terrain was drawn with edges at all. */
  get drawn(): boolean {
    return this.piece.art != null;
  }

  private standing(what: 'fill' | 'art' | 'corner', over: Tone | null): HTMLCanvasElement {
    const key = `${what}|${over == null ? '' : over.join(',')}`;
    const known = this.built.get(key);

    if (known != null) {
      return known;
    }
    let rect = this.piece.fill;
    let skirt: Rect | null = null;

    if (what === 'art') {
      rect = this.piece.art ?? this.piece.fill;
      skirt = this.piece.skirt;
    } else if (what === 'corner') {
      rect = this.piece.corner ?? this.piece.fill;
      skirt = this.piece.cornerSkirt;
    }
    const made = stood(this.sheet, this.sheetWidth, rect, skirt, over);

    this.built.set(key, made);
    return made;
  }

  /**
   * The face of the cliff, for a wall standing between two levels.
   *
   * The bottom edge of the block is it: the side of the rock as it is
   * drawn where the ground below can be seen, which is what a board
   * laid back under the camera shows of a step up
   */
  face(over: Tone | null): HTMLCanvasElement {
    const key = `face|${over == null ? '' : over.join(',')}`;
    const known = this.tiles.get(key);

    if (known != null) {
      return known;
    }
    const made = canvasOf(16, 16);
    const context = made.getContext('2d');

    if (context == null || this.piece.art == null) {
      return this.fill();
    }
    context.drawImage(this.standing('art', over), 16, 32, 16, 16, 0, 0, 16, 16);
    this.tiles.set(key, made);
    return made;
  }

  /**
   * The tile this neighbourhood asks for, standing in `over`.
   *
   * `whole` takes one of the thirteen rather than four quarters of
   * them, which is what a cliff needs: its rim is most of a tile thick
   */
  tile(near: Around, over: Tone | null, whole = false): HTMLCanvasElement {
    const key = `${maskOf(near)}|${whole ? 'w' : 'q'}|${over == null ? '' : over.join(',')}`;
    const known = this.tiles.get(key);

    if (known != null) {
      return known;
    }
    const made = canvasOf(16, 16);
    const context = made.getContext('2d');

    if (context == null || this.piece.art == null) {
      return this.fill();
    }
    const art = this.standing('art', over);
    const inner = this.piece.corner == null ? null : this.standing('corner', over);

    if (whole || (inner != null && near.n && near.s && near.e && near.w)) {
      const spot = wholeAt(near, inner != null, whole);
      const from = spot.inner && inner != null ? inner : art;

      context.drawImage(from, spot.column * 16, spot.row * 16, 16, 16, 0, 0, 16, 16);
      this.tiles.set(key, made);
      return made;
    }
    for (const corner of ['nw', 'ne', 'sw', 'se'] as const) {
      const place = QUARTER[corner];
      const [up, across, diagonal] = SIDES[corner];
      let from = art;
      let at: readonly [number, number] = place.fill;

      if (!near[up] && !near[across]) {
        at = place.outer;
      } else if (!near[up]) {
        at = place.side;
      } else if (!near[across]) {
        at = place.flank;
      } else if (!near[diagonal] && inner != null) {
        from = inner;
        at = place.inner;
      }
      context.drawImage(from, at[0], at[1], 8, 8, place.at[0], place.at[1], 8, 8);
    }
    this.tiles.set(key, made);
    return made;
  }
}

/**
 * One of the thirteen, taken whole: which column and row of the block
 * this neighbourhood asks for, or of the corner piece where the sides
 * are all its own and a diagonal is not
 */
function wholeAt(
  near: Around,
  hasInner: boolean,
  only: boolean,
): { inner: boolean; column: number; row: number } {
  let column = 0;
  let row = 0;

  if (near.w) {
    column = near.e ? 1 : 2;
  }
  if (near.n) {
    row = near.s ? 1 : 2;
  }
  if (hasInner && column === 1 && row === 1) {
    const short = (['nw', 'ne', 'sw', 'se'] as const).filter((one) => !near[one]);

    if (short.length > 0 && (short.length === 1 || !only)) {
      const one = short[0];

      return {
        inner: true,
        column: one === 'nw' || one === 'sw' ? 1 : 0,
        row: one === 'nw' || one === 'ne' ? 1 : 0,
      };
    }
  }
  return { inner: false, column, row };
}

/** Every biome's terrains, loaded once. */
export class TerrainTiles {
  private readonly terrains = new Map<string, Terrain>();

  constructor(entries: Entry[], pieces: Piece[], sheet: ImageData, width: number) {
    for (const entry of entries) {
      if (entry.piece < 0 || entry.piece >= pieces.length) {
        continue;
      }
      const piece = pieces[entry.piece];

      this.terrains.set(`${entry.biome}|${entry.role}`, new Terrain(entry, piece, sheet, width));
    }
  }

  /** What a biome draws for one role, or null where it draws nothing. */
  of(biome: Biome, role: TerrainRole): Terrain | null {
    return this.terrains.get(`${biome}|${role}`) ?? null;
  }
}

async function pictureOf(source: string): Promise<HTMLImageElement> {
  const image = new Image();

  image.src = source;
  await image.decode();
  return image;
}

/** Load the pack, once, and read it into memory for the board. */
export default async function loadTerrainTiles(): Promise<TerrainTiles> {
  const [image, response] = await Promise.all([pictureOf(SHEET), fetch(DATA)]);
  const root = asRecord(await response.json());
  const canvas = canvasOf(image.width, image.height);
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (context == null) {
    throw new Error('no canvas to read the terrain pack with');
  }
  context.drawImage(image, 0, 0);

  const sheet = context.getImageData(0, 0, image.width, image.height);
  const pieces = asRecordArray(root.pieces).map((one) => ({
    from: asString(one.from),
    tone: asTone(one.tone),
    fill: asRect(one.fill) ?? [0, 0, 16, 16],
    art: asRect(one.art),
    corner: asRect(one.corner),
    skirt: asRect(one.skirt),
    cornerSkirt: asRect(one.cornerSkirt),
  }));
  const entries = asRecordArray(root.terrains).map((one) => ({
    biome: asNumber(one.biome),
    role: ROLES.find((role) => role === one.role) ?? 'ground',
    name: asString(one.name),
    piece: asNumber(one.piece),
  }));

  return new TerrainTiles(entries, pieces, sheet, image.width);
}
