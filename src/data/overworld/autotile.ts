/**
 * Which of a terrain's tiles a cell gets, from what is around it.
 *
 * A dungeon rip does not hold one picture per terrain. It holds one
 * per *neighbourhood*: a wall with nothing north of it is drawn with a
 * lit top edge, a wall boxed in on all sides is drawn as solid rock.
 * The rip says which is which in its legend column, a 3x3 of black and
 * white squares that is exactly the bitmask below.
 */

/** One neighbour, as a bit. Clockwise from north. */
export const enum Around {
  North = 1,
  NorthEast = 2,
  East = 4,
  SouthEast = 8,
  South = 16,
  SouthWest = 32,
  West = 64,
  NorthWest = 128,
}

/** Every neighbour set, which is the tile with no edges at all. */
export const SURROUNDED = 255;

/** Nothing adjacent, which is the tile that is all edge. */
export const ALONE = 0;

/** The four diagonals, each with the two orthogonals beside it. */
const DIAGONALS: [diagonal: number, first: number, second: number][] = [
  [Around.NorthEast, Around.North, Around.East],
  [Around.SouthEast, Around.South, Around.East],
  [Around.SouthWest, Around.South, Around.West],
  [Around.NorthWest, Around.North, Around.West],
];

/**
 * The mask with the diagonals that cannot be seen struck out.
 *
 * A corner only shows where both edges beside it are already filled.
 * With the north cell empty, whether the north-east one is filled
 * changes nothing about how this tile is drawn, so counting it would
 * ask the artist for 256 pictures instead of 47.
 */
export function canonicalMask(mask: number): number {
  let kept = mask & 255;

  for (const [diagonal, first, second] of DIAGONALS) {
    if ((kept & first) === 0 || (kept & second) === 0) {
      kept &= ~diagonal;
    }
  }
  return kept;
}

/** The 47 masks an artist actually has to draw, ascending. */
export const AUTOTILE_CASES: number[] = ((): number[] => {
  const seen = new Set<number>();

  for (let mask = 0; mask < 256; mask += 1) {
    seen.add(canonicalMask(mask));
  }
  return [...seen].sort((one, other) => one - other);
})();

/** How many pictures one terrain is made of. */
export const AUTOTILE_COUNT = AUTOTILE_CASES.length;

const ROWS = new Map(AUTOTILE_CASES.map((mask, row) => [mask, row]));

/**
 * Which row of a terrain's block this neighbourhood is drawn from.
 * Any of the 256 raw masks lands on one of the 47
 */
export function autotileRow(mask: number): number {
  return ROWS.get(canonicalMask(mask)) ?? 0;
}

/**
 * The same neighbourhood turned a quarter at a time.
 *
 * The art in these tilesets is drawn for one point of view: a wall
 * shows its face on the south side, where the camera stands. Walk the
 * camera round the board and the face has to follow, so the
 * neighbourhood a tile is chosen for is turned to match before it is
 * looked up. Every direction moves two places round the eight, which
 * is a rotate of the byte
 */
export function rotateMask(mask: number, turns: number): number {
  const shift = (((turns % 4) + 4) % 4) * 2;
  const kept = mask & 255;

  return shift === 0 ? kept : ((kept << shift) | (kept >>> (8 - shift))) & 255;
}

/**
 * The same neighbourhood with its corners given up.
 *
 * The next best tile when the artist did not draw this one: a rip that
 * skips the ledge under a one-tile-wide wall still has the plain strip,
 * and that reads far better than a hole or a closed block
 */
export function withoutDiagonals(mask: number): number {
  return mask & ~(Around.NorthEast | Around.SouthEast | Around.SouthWest | Around.NorthWest);
}

/**
 * The 3x3 the rip draws its legend as, read left to right and top to
 * bottom, with the middle square skipped. `true` is a neighbour of the
 * same terrain
 */
export function maskFromGrid(cells: boolean[]): number {
  const bits = [
    Around.NorthWest,
    Around.North,
    Around.NorthEast,
    Around.West,
    0,
    Around.East,
    Around.SouthWest,
    Around.South,
    Around.SouthEast,
  ];
  let mask = 0;

  for (let at = 0; at < 9; at += 1) {
    if (cells[at]) {
      mask |= bits[at];
    }
  }
  return mask;
}

/** The reverse, for a test that wants to read a case back. */
export function gridFromMask(mask: number): boolean[] {
  return [
    Around.NorthWest,
    Around.North,
    Around.NorthEast,
    Around.West,
    0,
    Around.East,
    Around.SouthWest,
    Around.South,
    Around.SouthEast,
  ].map((bit, at) => (at === 4 ? true : (mask & bit) !== 0));
}
