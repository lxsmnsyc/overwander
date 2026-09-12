import type Biome from '../data/ids/biome';
import type { Around, Terrain, TerrainTiles, Tone } from './terrain-tiles';
import { around, enclosed, turned } from './terrain-tiles';

/**
 * One cell of ground, built up in the order the ground is laid.
 *
 * Water everywhere first, the ground over it, the shore where the two
 * meet, paving, and last the seam where one country meets the next. A
 * cell is five layers at most and one tile at least, so it is composed
 * once into a 16x16 and kept: a board redrawn every frame asks for the
 * same few hundred cells over and over, and two cells alike ask for
 * the same picture.
 *
 * A step up is drawn by the board rather than here: the laid-back one
 * stands a wall between the levels, and nothing is laid over the
 * country's own ground at the lip.
 *
 * The board draws it laid back under the camera and the terrain demo
 * draws it flat, which is why the composing lives here rather than in
 * either of them.
 */

/** What a cell of the world is, as far as the ground is concerned. */
export interface CellLook {
  biome: (x: number, y: number) => Biome;
  role: (x: number, y: number) => 'ground' | 'water' | 'wall';
  /** Whether a street or a route runs over it. */
  paved: (x: number, y: number) => boolean;
  /** How high the ground stands, where the caller knows. */
  level?: (x: number, y: number) => number;
  /** Whether a way through a step runs here, where the caller knows. */
  seam?: (x: number, y: number) => boolean;
}

/** One tile to draw, and what to stand its rim in. */
interface Lay {
  terrain: Terrain;
  near: Around | null;
  over: Tone | null;
  whole: boolean;
  /** Which of the five steps laid it, so a caller can stop partway. */
  step: number;
}

/** The five steps, in the order the ground is laid. */
export const STEPS = ['water', 'ground', 'shore', 'paving', 'seams'] as const;

/**
 * The one step that follows the camera: the edge between water and
 * ground. Its art hangs a shore from one corner of the tile, so it
 * reads wrong from some angles unless it is picked in the camera's
 * frame and laid back again. Everything else keeps the world's own way
 * round, so walking the camera about leaves the country where it is
 */
const SHORE = STEPS.indexOf('shore');

/** One cell of ground, in pixels. */
const SIZE = 16;

/** How many composed cells are kept before the oldest are dropped. */
const KEPT = 4096;

const made = new Map<string, HTMLCanvasElement>();

function keyOf(lays: Lay[]): string {
  return lays
    .map((one) => {
      const near = one.near;
      const mask =
        near == null
          ? 'f'
          : `${near.n ? 1 : 0}${near.e ? 1 : 0}${near.s ? 1 : 0}${near.w ? 1 : 0}` +
            `${near.nw ? 1 : 0}${near.ne ? 1 : 0}${near.sw ? 1 : 0}${near.se ? 1 : 0}`;

      return `${one.terrain.name}:${mask}:${one.whole ? 'w' : 'q'}:${one.over == null ? '' : one.over.join(',')}`;
    })
    .join('|');
}

/** The eight neighbours, for the shore test. */
const ROUND: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/** Every tile a cell is made of, in the order they go down. */
export function layersAt(pack: TerrainTiles, look: CellLook, x: number, y: number): Lay[] {
  const wet = (cx: number, cy: number): boolean => look.role(cx, cy) === 'water';
  const dry = (cx: number, cy: number): boolean => !wet(cx, cy);
  const groundAt = (cx: number, cy: number): Terrain | null =>
    pack.of(look.biome(cx, cy), 'ground');
  const water = pack.of(look.biome(x, y), 'water');
  const ground = groundAt(x, y);
  const lays: Lay[] = [];

  if (water != null) {
    lays.push({ terrain: water, near: null, over: null, whole: false, step: 0 });
  }
  if (ground != null && (dry(x, y) || ROUND.some(([dx, dy]) => dry(x + dx, y + dy)))) {
    lays.push({ terrain: ground, near: null, over: null, whole: false, step: 1 });
  }
  // where the two meet. water with no edge of its own leaves the shore
  // to the ground, which is how a beach was drawn
  if (water != null && ground != null) {
    if (water.drawn && wet(x, y)) {
      const near = around(x, y, wet);

      if (!enclosed(near)) {
        lays.push({ terrain: water, near, over: ground.tone, whole: false, step: 2 });
      }
    } else if (!water.drawn && dry(x, y)) {
      const near = around(x, y, dry);

      if (!enclosed(near)) {
        lays.push({ terrain: ground, near, over: water.tone, whole: false, step: 2 });
      }
    }
  }
  // the road is one thing wherever it runs: its neighbourhood is asked
  // of the paving alone, so crossing a border changes only the ground
  // its rim is painted in
  if (look.paved(x, y)) {
    const road = pack.of(look.biome(x, y), 'paving');

    if (road != null) {
      lays.push({
        terrain: road,
        near: around(x, y, (cx, cy) => look.paved(cx, cy)),
        over: ground?.tone ?? null,
        whole: false,
        step: 3,
      });
    }
  }
  // and last the seam, drawn by whichever side sorts higher so that it
  // is drawn once rather than from both sides. Never over paving: a
  // road crossing a border is one road, and a seam laid on top of it
  // cuts it in two
  if (ground != null && dry(x, y) && !look.paved(x, y)) {
    let over: Tone | null = null;

    for (const [dx, dy] of ROUND.slice(0, 4)) {
      const other = groundAt(x + dx, y + dy);

      if (other != null && other.name !== ground.name && ground.name > other.name) {
        over = other.tone;
        break;
      }
    }
    if (over != null) {
      const near = around(x, y, (cx, cy) => groundAt(cx, cy)?.name === ground.name);

      if (!enclosed(near)) {
        lays.push({ terrain: ground, near, over, whole: false, step: 4 });
      }
    }
  }
  return lays;
}

/** The cell, composed and kept. */
export default function terrainCell(
  pack: TerrainTiles,
  look: CellLook,
  x: number,
  y: number,
  upto = STEPS.length - 1,
  turns = 0,
): HTMLCanvasElement | null {
  const lays = layersAt(pack, look, x, y).filter((one) => one.step <= upto);

  if (lays.length === 0) {
    return null;
  }
  // Nothing but a shore cares which way the camera is: a cell without
  // one is the same picture from every side, and keeping one copy of
  // it rather than four is most of what the cache holds
  const spun = lays.some((one) => one.step === SHORE) ? ((turns % 4) + 4) % 4 : 0;
  const turnedLays = lays.map((one) =>
    one.near == null || one.step !== SHORE ? one : { ...one, near: turned(one.near, spun) },
  );
  const key = `${spun}|${keyOf(turnedLays)}`;
  const known = made.get(key);

  if (known != null) {
    return known;
  }
  const canvas = document.createElement('canvas');

  canvas.width = SIZE;
  canvas.height = SIZE;

  const context = canvas.getContext('2d');

  if (context == null) {
    return null;
  }
  for (const one of turnedLays) {
    const art =
      one.near == null ? one.terrain.fill() : one.terrain.tile(one.near, one.over, one.whole);

    // The shore laid back by the quarter it was picked in, so its rim
    // lands on the side the water actually is
    if (one.step === SHORE && spun !== 0) {
      context.save();
      context.translate(SIZE / 2, SIZE / 2);
      context.rotate((-spun * Math.PI) / 2);
      context.drawImage(art, -SIZE / 2, -SIZE / 2);
      context.restore();
      continue;
    }
    context.drawImage(art, 0, 0);
  }
  if (made.size >= KEPT) {
    made.clear();
  }
  made.set(key, canvas);
  return canvas;
}
