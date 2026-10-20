import type { Image } from '../src/server/sprites/png.ts';
import type { Drawn } from './atlas.ts';

/**
 * The Tera crystal, drawn on a grid rather than cut from the rip, which
 * has nothing like it: a cluster of faceted crystals grown out of a bed
 * of rock, one tall point and two leaning ones, lit with the rainbow a
 * Tera jewel throws. The rock is the cave's, and every pixel is solid
 * or not there, so it sits on the board like the pieces cut beside it.
 */

const WIDTH = 34;
const HEIGHT = 40;

/** Where the bed's middle is, which is the point that stands on the tile */
const MIDDLE: [number, number] = [17, 34];

const INK = {
  // The cave mouth's rock, darkest to lightest
  rockLine: '#423131',
  rockDeep: '#6c5757',
  rock: '#837070',
  rockLit: '#997f7b',
  rockTop: '#a69183',
  // The crystal, from its outline to the light on its faces
  line: '#2e3a6e',
  deep: '#4d63b0',
  face: '#7aa6e6',
  lit: '#b4dcf6',
  shine: '#f2fbff',
  // The colours it breaks the light into
  rose: '#f0a8d8',
  violet: '#a88ce8',
  mint: '#9ce8d0',
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

  lit(x: number, y: number): boolean {
    return (
      x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT && this.image.rgba[(y * WIDTH + x) * 4 + 3] > 0
    );
  }
}

/** Whether a point is inside an ellipse */
function within(x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean {
  return ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
}

/** The bed of rock the crystals grow out of, and the shadow it throws */
function bed(grid: Grid): void {
  const [cx, cy] = MIDDLE;

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (within(x, y, cx, cy + 1.5, 15.5, 4.5) && !within(x, y, cx, cy, 14, 4)) {
        grid.set(x, y, 'shadow');
      }
    }
  }
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (!within(x, y, cx, cy, 14, 4)) {
        continue;
      }
      if (!within(x, y, cx, cy, 13, 3)) {
        grid.set(x, y, 'rockLine');
      } else if (y < cy - 1) {
        grid.set(x, y, (x + y) % 5 === 0 ? 'rockLit' : 'rockTop');
      } else {
        grid.set(x, y, (x * 3 + y) % 7 === 0 ? 'rockDeep' : 'rock');
      }
    }
  }
}

interface Prism {
  /** Its foot's middle, and how far it leans across per row it rises */
  foot: [number, number];
  lean: number;
  /** Half its width, how tall its sides stand and how tall its point is */
  half: number;
  sides: number;
  point: number;
}

/** Where a pixel is across the prism, from -1 to 1, or null outside it */
function across(prism: Prism, x: number, y: number): number | null {
  const [fx, fy] = prism.foot;
  const rise = fy - y;

  if (rise < 0 || rise > prism.sides + prism.point) {
    return null;
  }

  const middle = fx + prism.lean * rise;
  const narrowed = rise <= prism.sides ? 1 : (prism.sides + prism.point - rise) / prism.point;
  const reach = prism.half * narrowed;
  const off = x + 0.5 - middle;

  return Math.abs(off) <= reach + 0.01 ? off / Math.max(reach, 0.5) : null;
}

/** One faceted crystal: lit on its left face, dark on its right, outlined */
function crystal(grid: Grid, prism: Prism): void {
  const inside = (x: number, y: number): boolean => across(prism, x, y) != null;

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const at = across(prism, x, y);

      if (at == null) {
        continue;
      }

      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1);
      const rise = prism.foot[1] - y;
      const tip = rise > prism.sides;

      if (edge) {
        grid.set(x, y, 'line');
      } else if (at < -0.35) {
        grid.set(x, y, tip ? 'shine' : 'lit');
      } else if (at < 0.3) {
        grid.set(x, y, tip ? 'lit' : 'face');
      } else {
        grid.set(x, y, 'deep');
      }
    }
  }

  // The rainbow caught along its middle face, a band of three
  const [fx, fy] = prism.foot;
  const band = Math.round(prism.sides * 0.45);
  const colours: Ink[] = ['rose', 'violet', 'mint'];

  for (const [step, ink] of colours.entries()) {
    const y = fy - band - step;
    const x = Math.round(fx + prism.lean * (fy - y));

    if (inside(x, y) && inside(x + 1, y)) {
      grid.set(x, y, ink);
    }
  }
}

/** A four-pointed glint off a facet */
function glint(grid: Grid, x: number, y: number): void {
  grid.set(x, y, 'shine');
  grid.set(x - 1, y, 'lit');
  grid.set(x + 1, y, 'lit');
  grid.set(x, y - 1, 'lit');
  grid.set(x, y + 1, 'lit');
}

/** The Tera crystal, ready to pack beside the pieces cut from the rip */
export default function drawTeraCrystal(): Drawn {
  const grid = new Grid();
  const [cx, cy] = MIDDLE;

  bed(grid);
  // The two leaning ones first, so the tall one stands in front of their feet
  crystal(grid, { foot: [cx - 7, cy - 1], lean: -0.35, half: 3.2, sides: 9, point: 5 });
  crystal(grid, { foot: [cx + 7, cy], lean: 0.3, half: 2.8, sides: 7, point: 4 });
  crystal(grid, { foot: [cx, cy], lean: 0, half: 5, sides: 18, point: 9 });
  glint(grid, cx - 2, cy - 22);
  glint(grid, cx - 9, cy - 10);

  if (!grid.lit(cx, cy)) {
    throw new Error('the crystal stands on nothing');
  }
  return { name: 'tera', image: grid.image, base: MIDDLE };
}
