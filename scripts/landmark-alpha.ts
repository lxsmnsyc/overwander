import type { Image } from '../src/server/sprites/png.ts';
import type { Drawn } from './atlas.ts';

/**
 * The Alpha's ground, drawn on a grid rather than cut from the rip,
 * which has nothing like it: a clearing trampled bare, a boulder raked
 * by claws and a beast's head daubed on it with red eyes. Every colour
 * is one the sheet already uses (the cave's rock, the board's earth,
 * the nest's grass, the cache's red), and every pixel is solid or not
 * there, so it sits on the board like the pieces cut beside it.
 */

const WIDTH = 40;
const HEIGHT = 30;

/** Where the clearing's middle is, which is the point that stands on the tile */
const MIDDLE: [number, number] = [20, 21];

const INK = {
  // The cave mouth's rock, darkest to lightest
  rockLine: '#423131',
  rockDeep: '#6c5757',
  rock: '#837070',
  rockLit: '#997f7b',
  rockTop: '#a69183',
  rockShine: '#b69c8d',
  paint: '#221a1d',
  // The notice board's earth
  earthDeep: '#4f402b',
  earthEdge: '#786040',
  earth: '#887050',
  earthLit: '#988060',
  earthDust: '#a09078',
  splinter: '#e0c8a8',
  // The nest's grass, flattened
  grassDeep: '#4a7121',
  grass: '#5a9a21',
  // The cache's red, for the eyes
  eye: '#ce4142',
  eyeLit: '#f38768',
  // The sheet's own soft shadow
  shadow: '#000000',
} as const;

type Ink = keyof typeof INK;

/** A blank picture, painted one pixel at a time */
class Grid {
  readonly image: Image = {
    width: WIDTH,
    height: HEIGHT,
    rgba: Buffer.alloc(WIDTH * HEIGHT * 4),
  };

  set(x: number, y: number, ink: Ink): void {
    if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) {
      return;
    }

    const at = (y * WIDTH + x) * 4;
    const hex = INK[ink];

    this.image.rgba[at] = Number.parseInt(hex.slice(1, 3), 16);
    this.image.rgba[at + 1] = Number.parseInt(hex.slice(3, 5), 16);
    this.image.rgba[at + 2] = Number.parseInt(hex.slice(5, 7), 16);
    // The sheet's shadows are black at 77, everything else is solid
    this.image.rgba[at + 3] = ink === 'shadow' ? 77 : 255;
  }

  /**
   * A soft shadow over whatever is there: the sheet's black at 77 on
   * bare ground, and the next darker earth where it falls on the
   * clearing, so the picture stays solid over its own ground
   */
  shade(x: number, y: number): void {
    if (!this.lit(x, y)) {
      this.set(x, y, 'shadow');
      return;
    }

    const at = (y * WIDTH + x) * 4;
    const hex = `#${[0, 1, 2].map((band) => this.image.rgba[at + band].toString(16).padStart(2, '0')).join('')}`;

    if (hex === INK.earthEdge) {
      this.set(x, y, 'earthDeep');
    } else if (hex === INK.earth || hex === INK.earthLit || hex === INK.earthDust) {
      this.set(x, y, 'earthEdge');
    }
  }

  lit(x: number, y: number): boolean {
    return (
      x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT && this.image.rgba[(y * WIDTH + x) * 4 + 3] > 0
    );
  }

  /** Rows of a little picture, one character a pixel and a space for none */
  stamp(left: number, top: number, rows: string[], key: Partial<Record<string, Ink>>): void {
    for (const [dy, row] of rows.entries()) {
      for (const [dx, mark] of row.split('').entries()) {
        const ink = key[mark];

        if (ink != null) {
          this.set(left + dx, top + dy, ink);
        }
      }
    }
  }
}

/** Whether a point is inside an ellipse about the middle */
function within(x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean {
  return ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
}

/** A fixed scatter, so the dust and the ragged rim come out the same every run */
function speckle(x: number, y: number, salt: number): number {
  let h = (x * 374761393 + y * 668265263 + salt * 2147483647) >>> 0;

  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) % 100;
}

/** The trampled clearing: bare earth with a worn rim and clods kicked out round it */
function clearing(grid: Grid): void {
  const [cx, cy] = MIDDLE;

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      // A rim that wanders a little, so it reads as worn rather than cut
      const ragged = speckle(x, y, 1) < 18 ? 0.94 : 1;

      if (!within(x, y, cx, cy, 19 * ragged, 8 * ragged)) {
        continue;
      }
      if (within(x, y, cx, cy - 1, 14, 5.2)) {
        grid.set(x, y, speckle(x, y, 2) < 8 ? 'earthDust' : 'earthLit');
      } else if (within(x, y, cx, cy - 0.5, 17, 6.8)) {
        grid.set(x, y, speckle(x, y, 3) < 25 ? 'earthLit' : 'earth');
      } else {
        grid.set(x, y, 'earthEdge');
      }
    }
  }
  // The rim's underside, where the earth was pushed out
  for (let x = 0; x < WIDTH; x++) {
    for (let y = HEIGHT - 1; y >= 0; y--) {
      if (grid.lit(x, y)) {
        grid.set(x, y, 'earthDeep');
        break;
      }
    }
  }
  // Clods kicked out past the rim, each a lit top over a dark foot
  for (const [x, y] of [
    [0, 19],
    [3, 15],
    [35, 15],
    [39, 20],
    [2, 26],
    [37, 25],
    [14, 29],
    [24, 29],
  ]) {
    grid.set(x, y, 'earthEdge');
    grid.set(x, y + 1, 'earthDeep');
  }
}

/** Three gouges dragged through the earth in front, the way a claw rakes */
function rakedEarth(grid: Grid): void {
  for (const start of [5, 9, 13]) {
    for (let step = 0; step < 6; step++) {
      const x = start + step;
      const y = 20 + Math.floor(step * 0.9);

      grid.set(x, y, 'earthDeep');
      grid.set(x, y + 1, 'splinter');
    }
  }
}

/** The boulder at the back, with its shadow, its claw scars and the mark */
function boulder(grid: Grid): void {
  // Shaded by row: the line, the deep side, the face and the lit top
  const rows = [
    '        LLLLL        ',
    '      LLSSTTLL       ',
    '     LSSTTTTTLL      ',
    '    LTTTTTTTRRLL     ',
    '   LTTTRRRRRRRRRL    ',
    '   LTRRRRRRRRRRRRL   ',
    '  LTRRRRRRRRRRRRRRL  ',
    '  LTRRRRRRRRRRRRRDL  ',
    ' LTRRRRRRRRRRRRRRDDL ',
    ' LRRRRRRRRRRRRRRRDDL ',
    ' LRRRRRRRRRRRRRRDDDL ',
    'LRRRRRRRRRRRRRRRDDDDL',
    'LDRRRRRRRRRRRRRRDDDDL',
    'LDDRRRRRRRRRRRRDDDDDL',
    ' LDDDDRRRRRRRDDDDDDL ',
    '  LLDDDDDDDDDDDDDLL  ',
    '    LLLLLLLLLLLLL    ',
  ];
  const left = 10;
  const top = 2;

  // Its soft shadow first, falling to the front right like the rest of the sheet's
  for (const [dy, row] of rows.entries()) {
    for (const [dx, mark] of row.split('').entries()) {
      if (mark !== ' ') {
        grid.shade(left + dx + 2, top + dy + 2);
      }
    }
  }
  grid.stamp(left, top, rows, {
    L: 'rockLine',
    S: 'rockShine',
    T: 'rockTop',
    R: 'rock',
    D: 'rockDeep',
  });
  // Lit flecks over the face, so it reads as stone rather than a blob
  for (const [x, y] of [
    [14, 9],
    [21, 8],
    [16, 13],
    [24, 12],
    [13, 15],
  ]) {
    grid.set(x, y, 'rockLit');
  }

  // Three claw scars slashed down its right shoulder: a pale gouge with a dark lip under it
  for (const start of [23, 27, 31]) {
    for (let step = 0; step < 7; step++) {
      const x = start - step;
      const y = 5 + step;

      if (grid.lit(x, y + 1)) {
        grid.set(x, y, 'rockShine');
        grid.set(x, y + 1, 'rockLine');
      }
    }
  }

  // The mark: a horned head daubed on the face, its eyes left red
  grid.stamp(
    11,
    7,
    ['P      P', 'PP    PP', 'PPPPPPPP', 'PEEPPEEP', 'PPPPPPPP', ' PPPPPP ', '  P  P  '],
    { P: 'paint', E: 'eye' },
  );
  grid.set(12, 10, 'eyeLit');
  grid.set(16, 10, 'eyeLit');
}

/** Stones knocked off the boulder, lying about the front of the clearing */
function chips(grid: Grid): void {
  for (const [x, y] of [
    [27, 23],
    [31, 21],
    [24, 26],
  ]) {
    grid.stamp(x, y, ['TR', 'LL'], { T: 'rockTop', R: 'rock', L: 'rockLine' });
  }
}

/** The Alpha's ground, ready to pack beside the pieces cut from the rip */
export default function drawAlphaSite(): Drawn {
  const grid = new Grid();

  clearing(grid);
  rakedEarth(grid);
  boulder(grid);
  chips(grid);

  return { name: 'alpha', image: grid.image, base: MIDDLE };
}
