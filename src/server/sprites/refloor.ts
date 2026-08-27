import type { Image } from './png';

/**
 * Standing a borrowed wall on the borrower's own floor.
 *
 * A dungeon rip draws a wall tile as the wall plus the floor showing
 * around it, so a wall column copied from another biome arrives with a
 * rectangle of that biome's ground baked into every tile. On the board
 * that reads as a pale card laid under each outcrop.
 *
 * The floor is found rather than guessed at: a flood fill in from the
 * edges the neighbourhood says are open stops at the wall's own hard
 * outline, and everything it reaches is repainted in the borrower's
 * ground. The donor's shading rides along as a brightness ratio, so the
 * shadow the artist drew under the wall lands as a shadow on grass.
 */

/**
 * How far apart two touching pixels may be, summed over the channels,
 * and still count as the same surface. Wide enough to walk a floor's
 * own dappling, narrow enough to stop at the wall's outline
 */
export const FLOOR_REACH = 70;

/**
 * How far a pixel may sit from the nearest colour the donor's ground
 * column draws, summed over the channels, and still be taken for floor.
 * A wall tile shades its floor a little differently from the plain
 * ground beside it, so this is a family likeness rather than a match
 */
export const FLOOR_KIN = 96;

/**
 * Neighbour bits, clockwise from north, as
 * [`autotile`](../../data/overworld/autotile.ts) numbers them. Copied
 * rather than imported: that module is a const enum, which the build
 * scripts cannot load
 */
const NORTH = 1;
const NORTH_EAST = 2;
const EAST = 4;
const SOUTH_EAST = 8;
const SOUTH = 16;
const SOUTH_WEST = 32;
const WEST = 64;
const NORTH_WEST = 128;

/** Every neighbour present, which is the tile with no edges at all. */
const SURROUNDED = 255;

function channelsApart(image: Image, one: number, other: number): number {
  return (
    Math.abs(image.rgba[one] - image.rgba[other]) +
    Math.abs(image.rgba[one + 1] - image.rgba[other + 1]) +
    Math.abs(image.rgba[one + 2] - image.rgba[other + 2])
  );
}

/** Every colour one tile column draws, packed one to a number. */
export function paletteOf(image: Image, tile: number, left: number, across: number): Set<number> {
  const found = new Set<number>();

  for (let y = 0; y < image.height; y += 1) {
    for (let x = left; x < left + across * tile; x += 1) {
      const at = (y * image.width + x) * 4;

      if (image.rgba[at + 3] > 0) {
        found.add((image.rgba[at] << 16) | (image.rgba[at + 1] << 8) | image.rgba[at + 2]);
      }
    }
  }
  return found;
}

function apartFrom(image: Image, at: number, palette: Set<number>): number {
  let nearest = Number.POSITIVE_INFINITY;

  for (const colour of palette) {
    const gap =
      Math.abs(image.rgba[at] - ((colour >> 16) & 0xff)) +
      Math.abs(image.rgba[at + 1] - ((colour >> 8) & 0xff)) +
      Math.abs(image.rgba[at + 2] - (colour & 0xff));

    if (gap < nearest) {
      nearest = gap;
    }
  }
  return nearest;
}

/**
 * Which pixels of one wall tile are the floor around it, as a flag per
 * pixel. Seeded from the tile edges the neighbourhood leaves open, so a
 * wall boxed in on all sides has no floor at all
 */
export function floorOf(
  image: Image,
  tile: number,
  left: number,
  top: number,
  mask: number,
  soil: Set<number>,
): boolean[] {
  const found: boolean[] = Array.from({ length: tile * tile }, () => false);
  const pending: number[] = [];
  const seed = (x: number, y: number): void => {
    if (!found[y * tile + x]) {
      found[y * tile + x] = true;
      pending.push(y * tile + x);
    }
  };

  for (let along = 0; along < tile; along += 1) {
    if ((mask & NORTH) === 0) {
      seed(along, 0);
    }
    if ((mask & SOUTH) === 0) {
      seed(along, tile - 1);
    }
    if ((mask & WEST) === 0) {
      seed(0, along);
    }
    if ((mask & EAST) === 0) {
      seed(tile - 1, along);
    }
  }
  // A corner shows its floor even where both edges beside it are wall
  if ((mask & NORTH_WEST) === 0) {
    seed(0, 0);
  }
  if ((mask & NORTH_EAST) === 0) {
    seed(tile - 1, 0);
  }
  if ((mask & SOUTH_WEST) === 0) {
    seed(0, tile - 1);
  }
  if ((mask & SOUTH_EAST) === 0) {
    seed(tile - 1, tile - 1);
  }

  while (pending.length > 0) {
    const spot = pending.pop() ?? 0;
    const x = spot % tile;
    const y = Math.floor(spot / tile);
    const here = ((top + y) * image.width + left + x) * 4;

    for (const [alongX, alongY] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nextX = x + alongX;
      const nextY = y + alongY;

      if (nextX < 0 || nextY < 0 || nextX >= tile || nextY >= tile || found[nextY * tile + nextX]) {
        continue;
      }
      const there = ((top + nextY) * image.width + left + nextX) * 4;

      if (channelsApart(image, here, there) > FLOOR_REACH) {
        continue;
      }
      if (apartFrom(image, there, soil) > FLOOR_KIN) {
        continue;
      }
      found[nextY * tile + nextX] = true;
      pending.push(nextY * tile + nextX);
    }
  }
  return found;
}

function brightness(image: Image, at: number): number {
  return 0.299 * image.rgba[at] + 0.587 * image.rgba[at + 1] + 0.114 * image.rgba[at + 2];
}

/** One wall column being copied onto another, and the floor it lands on. */
export interface Graft {
  donor: Image;
  /** Which tile column of the donor holds the wall. */
  lends: number;
  /** Which tile column of the donor holds the ground its wall stands on. */
  soil: number;
  target: Image;
  /** Which tile column of the target the wall is written over. */
  takes: number;
  /** Which tile column of the target holds the ground it stands on. */
  stands: number;
  tile: number;
  /** How many columns wide one terrain's block is. */
  variants: number;
  /** The neighbourhood each row is drawn for. */
  cases: number[];
}

/**
 * How much brighter than the plain floor a pixel may be and still be
 * repainted at that brightness. Past this it is a highlight the donor's
 * rip drew, not a lit patch of ground
 */
const BRIGHTEST = 2;

/**
 * One wall tile written over its counterpart, floor and all. Returns
 * how many of its pixels came out as ground
 */
function laid(
  graft: Graft,
  found: boolean[],
  row: number,
  variant: number,
  plainRow: number,
  plain: number,
): number {
  const { donor, target, tile } = graft;
  let repainted = 0;

  for (let y = 0; y < tile; y += 1) {
    for (let x = 0; x < tile; x += 1) {
      const from = ((row * tile + y) * donor.width + (graft.lends + variant) * tile + x) * 4;
      const onto = ((row * tile + y) * target.width + (graft.takes + variant) * tile + x) * 4;

      if (!found[y * tile + x]) {
        for (let channel = 0; channel < 4; channel += 1) {
          target.rgba[onto + channel] = donor.rgba[from + channel];
        }
        continue;
      }
      const ground =
        ((plainRow * tile + y) * target.width + (graft.stands + variant) * tile + x) * 4;
      const shade = plain > 0 ? Math.min(BRIGHTEST, brightness(donor, from) / plain) : 1;

      for (let channel = 0; channel < 3; channel += 1) {
        target.rgba[onto + channel] = Math.min(
          255,
          Math.round(target.rgba[ground + channel] * shade),
        );
      }
      target.rgba[onto + 3] = target.rgba[ground + 3];
      repainted += 1;
    }
  }
  return repainted;
}

/**
 * Writes the donor's wall over the target's, with every floor pixel
 * repainted in the target's own ground. Returns how many pixels that
 * came to, which is what says a graft did anything.
 *
 * Idempotent: nothing is read from the column being written, so a sheet
 * already grafted can be grafted again
 */
export default function refloor(graft: Graft): number {
  const { donor, tile, variants, cases } = graft;
  const soil = paletteOf(donor, tile, graft.soil * tile, variants);
  // The plain tile, which is what the cells around a wall draw: taking
  // the ground from the matching case row instead would put a different
  // scatter of flowers inside the wall tile than just outside it
  const plainRow = Math.max(0, cases.indexOf(SURROUNDED));
  const floors: boolean[][] = [];
  const lit: number[] = [];

  for (let row = 0; row < cases.length; row += 1) {
    for (let variant = 0; variant < variants; variant += 1) {
      const left = (graft.lends + variant) * tile;
      const found = floorOf(donor, tile, left, row * tile, cases[row], soil);

      floors.push(found);
      for (let spot = 0; spot < found.length; spot += 1) {
        if (found[spot]) {
          lit.push(
            brightness(
              donor,
              ((row * tile + Math.floor(spot / tile)) * donor.width + left + (spot % tile)) * 4,
            ),
          );
        }
      }
    }
  }
  lit.sort((one, other) => one - other);

  // The donor's floor at rest, so shading reads as a ratio against it
  const plain = lit[Math.floor(lit.length / 2)] ?? 0;
  let repainted = 0;

  for (let row = 0; row < cases.length; row += 1) {
    for (let variant = 0; variant < variants; variant += 1) {
      repainted += laid(graft, floors[row * variants + variant], row, variant, plainRow, plain);
    }
  }
  return repainted;
}
