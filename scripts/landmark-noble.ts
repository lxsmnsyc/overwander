import type { Image } from '../src/server/sprites/png.ts';
import type { Drawn } from './atlas.ts';

/**
 * The Noble Arena, drawn on a grid rather than cut from the rip, which
 * has nothing like it: a raised ring of worn flagstones with a gold
 * mark set in its floor, a red shrine gate standing at the back and a
 * brazier burning either side of the front. Every colour is one the
 * sheet already uses (the cave's rock, the board's reds, the seat's
 * gold and the lamps' flame), and every pixel is solid or not there.
 */

const WIDTH = 44;
const HEIGHT = 38;

/** Where the ring's middle is, which is the point that stands on the tile */
const MIDDLE: [number, number] = [22, 25];

const INK = {
  // The cave mouth's rock, darkest to lightest
  rockLine: '#423131',
  rockDeep: '#6c5757',
  rock: '#837070',
  rockLit: '#997f7b',
  rockTop: '#a69183',
  rockShine: '#b69c8d',
  // The gate's lacquer, off the reds the sheet's boards and roofs use
  gateDeep: '#7b301a',
  gateDark: '#8e381e',
  gate: '#ac402d',
  gateLit: '#c74934',
  // The seat's gold, for the mark and the gate's plaque
  goldDeep: '#a39669',
  gold: '#d8b860',
  goldLit: '#e8d080',
  // The braziers' iron and the fire in them
  iron: '#3c3c3c',
  ironLit: '#4e4e4e',
  ironShine: '#899696',
  flame: '#db5e39',
  flameLit: '#f38768',
  flameHot: '#e8d080',
  flameCore: '#f8e8a8',
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

  /** The sheet's soft shadow, only where nothing is drawn yet */
  shade(x: number, y: number): void {
    if (!this.lit(x, y)) {
      this.set(x, y, 'shadow');
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

/** Whether a point is inside an ellipse */
function within(x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean {
  return ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
}

/** A fixed scatter, so the worn stones come out the same every run */
function speckle(x: number, y: number, salt: number): number {
  let h = (x * 374761393 + y * 668265263 + salt * 2147483647) >>> 0;

  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) % 100;
}

/** How tall the ring's front face stands, in pixels */
const RISE = 4;

/** The shrine gate at the back, its feet on the ring's back rim */
function gate(grid: Grid): void {
  const rows = [
    'D                          D',
    'DLLLLLLLLLLLLLLLLLLLLLLLLLLD',
    ' DGGGGGGGGGGGGGGGGGGGGGGGGD ',
    '  DDDDDDDDDDDDDDDDDDDDDDDD  ',
    '     LG      YY      LG     ',
    '     LG      YY      LG     ',
    '   DLLLLLLLLLYYLLLLLLLLLD   ',
    '   DGGGGGGGGGGGGGGGGGGGGD   ',
    '     LG              LG     ',
    '     LG              LG     ',
    '     LG              LG     ',
    '     LG              LG     ',
    '     LG              LG     ',
    '     LG              LG     ',
    '     LG              LG     ',
    '     LG              LG     ',
    '     LG              LG     ',
    '     DD              DD     ',
  ];
  const left = 8;
  const top = 1;

  grid.stamp(left, top, rows, { D: 'gateDeep', L: 'gateLit', G: 'gate', Y: 'gold' });
  // The plaque's lit edge, and the beam's two up-turned tips
  grid.set(left + 13, top + 4, 'goldLit');
  grid.set(left + 13, top + 6, 'goldLit');
  grid.set(left - 1, top - 1 + 1, 'gateDark');
  grid.set(left + 28, top - 1 + 1, 'gateDark');
}

/** The raised ring: a floor of worn flagstones over a face of laid stone */
function ring(grid: Grid): void {
  const [cx, cy] = MIDDLE;
  const rx = 20.5;
  const ry = 7.5;

  // The front face first, a band below the floor's front half
  for (let x = 0; x < WIDTH; x++) {
    for (let y = 0; y < HEIGHT; y++) {
      if (!within(x, y - RISE, cx, cy, rx, ry) || within(x, y, cx, cy, rx, ry) || y < cy) {
        continue;
      }
      // Laid in courses: a joint every other row and staggered every five
      const course = (y - cy) % 2 === 0;
      const joint = (x + (Math.floor((y - cy) / 2) % 2) * 3) % 6 === 0;

      grid.set(x, y, course || joint ? 'rockLine' : 'rockDeep');
    }
  }
  for (let x = 0; x < WIDTH; x++) {
    for (let y = HEIGHT - 1; y >= 0; y--) {
      if (grid.lit(x, y)) {
        grid.set(x, y, 'rockLine');
        // The shadow it throws on the ground in front
        grid.shade(x, y + 1);
        break;
      }
    }
  }

  // The floor
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (!within(x, y, cx, cy, rx, ry)) {
        continue;
      }
      if (!within(x, y, cx, cy, rx - 1.2, ry - 1)) {
        // The rim, lit along the front where the light catches it
        grid.set(x, y, y >= cy ? 'rockShine' : 'rockTop');
        continue;
      }

      const flag = (Math.floor(x / 5) + Math.floor((y - cy) / 3)) % 2 === 0;
      const seam = x % 5 === 0 || (y - cy + 30) % 3 === 0;
      const worn = speckle(x, y, 4) < 10;

      if (seam) {
        grid.set(x, y, 'rock');
      } else if (worn) {
        grid.set(x, y, 'rockShine');
      } else {
        grid.set(x, y, flag ? 'rockTop' : 'rockLit');
      }
    }
  }

  // The gold mark set into the middle of the floor: a ring round a
  // four-pointed star, where the lord of the land is enshrined
  grid.stamp(
    cx - 6,
    cy - 2,
    ['   lllllll   ', ' gg   O   gg ', 'g    OYO    g', ' dd   O   dd ', '   ddddddd   '],
    { l: 'goldLit', g: 'gold', d: 'goldDeep', O: 'gold', Y: 'goldLit' },
  );
}

/** A brazier on its stand, the fire in its bowl */
function brazier(grid: Grid, left: number, top: number): void {
  grid.stamp(
    left,
    top,
    [
      '  h  ',
      ' hcf ',
      'hfcfh',
      'fcFcf',
      ' fFf ',
      'sIIIs',
      'IiiiI',
      ' III ',
      '  I  ',
      '  I  ',
      ' III ',
    ],
    {
      h: 'flameLit',
      f: 'flame',
      c: 'flameHot',
      F: 'flameCore',
      s: 'ironShine',
      I: 'iron',
      i: 'ironLit',
    },
  );
  grid.set(left + 1, top + 10, 'ironLit');
  grid.shade(left + 4, top + 11);
  grid.shade(left + 3, top + 11);
}

/** The Noble Arena, ready to pack beside the pieces cut from the rip */
export default function drawNobleArena(): Drawn {
  const grid = new Grid();

  gate(grid);
  ring(grid);
  brazier(grid, 2, 19);
  brazier(grid, 37, 19);

  return { name: 'noble', image: grid.image, base: MIDDLE };
}
