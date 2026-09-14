import type Biome from '../data/ids/biome';
import { isOpenSea } from '../data/ids/biome';
import type { Around, Terrain, TerrainTiles, Tone } from './terrain-tiles';
import { around, enclosed, turned } from './terrain-tiles';

/**
 * One cell of ground, built up in the order the ground is laid.
 *
 * Water everywhere first, the deep in the middle of a wide water, the
 * ground over it, the shore where the two meet, paving, the cliff, and
 * last the blend where one country meets the next. A cell is a handful
 * of layers at most and one tile at least, so it is composed
 * once into a 16x16 and kept: a board redrawn every frame asks for the
 * same few hundred cells over and over, and two cells alike ask for
 * the same picture.
 *
 * A step up is drawn here as well, where the caller knows the levels:
 * the edge tile of the higher ground is the cliff, and the laid-back
 * board only tilts that tile down to the ground below.
 *
 * The board draws it laid back under the camera and the terrain demo
 * draws it flat, which is why the composing lives here rather than in
 * either of them.
 */

/** What a cell of the world is, as far as the ground is concerned. */
export interface CellLook {
  biome: (x: number, y: number) => Biome;
  role: (x: number, y: number) => 'ground' | 'water' | 'wall';
  /** Whether a town's street or a building's plot is paved over it. */
  paved: (x: number, y: number) => boolean;
  /** Whether a route or a town's open ground is worn to a trail here, where the caller knows. */
  trail?: (x: number, y: number) => boolean;
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
  /** Which step laid it, so a caller can stop partway. */
  step: number;
  /** How many quarters the art was picked turned, and is drawn turned back by */
  spin?: number;
}

/** The steps, in the order the ground is laid. */
export const STEPS = ['water', 'deep', 'ground', 'shore', 'paving', 'cliffs', 'blends'] as const;

function stepOf(name: (typeof STEPS)[number]): number {
  return STEPS.indexOf(name);
}

/**
 * The one step that follows the camera: the edge between water and
 * ground. Its art hangs a shore from one corner of the tile, so it
 * reads wrong from some angles unless it is picked in the camera's
 * frame and laid back again. Everything else keeps the world's own way
 * round, so walking the camera about leaves the country where it is
 */
const SHORE = stepOf('shore');

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

      return `${one.terrain.name}:${mask}:${one.whole ? 'w' : 'q'}:${one.over == null ? '' : one.over.join(',')}:${one.spin ?? 0}`;
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

/**
 * How many quarters a cliff's neighbourhood is turned so its low side
 * reads as south, which picks from the bottom row of the ring, or the
 * bottom of the inside corner where only a diagonal is low
 */
function downhill(near: Around): number {
  for (let spin = 0; spin < 4; spin += 1) {
    if (!turned(near, spin).s) {
      return spin;
    }
  }
  for (let spin = 0; spin < 4; spin += 1) {
    const one = turned(near, spin);

    if (!one.se || !one.sw) {
      return spin;
    }
  }
  return 0;
}

/**
 * Every tile a cell is made of, in the order they go down. `standing` is
 * the laid-back board, where a cliff tile is tilted down its step: there
 * it always shows the face of the rock, turned to fall the way the step does
 */
export function layersAt(
  pack: TerrainTiles,
  look: CellLook,
  x: number,
  y: number,
  standing = false,
): Lay[] {
  const wet = (cx: number, cy: number): boolean => look.role(cx, cy) === 'water';
  const dry = (cx: number, cy: number): boolean => !wet(cx, cy);
  const groundAt = (cx: number, cy: number): Terrain | null =>
    pack.of(look.biome(cx, cy), 'ground');
  const water = pack.of(look.biome(x, y), 'water');
  const ground = groundAt(x, y);
  const lays: Lay[] = [];

  if (water != null) {
    lays.push({ terrain: water, near: null, over: null, whole: false, step: stepOf('water') });
  }
  // the deep, two cells or more from any shore: the pool darkens toward
  // its middle, and the rim of the deep fades out into the water round it.
  // Water in a country with no deep of its own is shallow, so the rim runs
  // along that border rather than the deep stopping dead against it
  const deep = pack.of(look.biome(x, y), 'deep');
  const open = (cx: number, cy: number): boolean =>
    pack.of(look.biome(cx, cy), 'deep') != null &&
    wet(cx, cy) &&
    ROUND.every(([dx, dy]) => wet(cx + dx, cy + dy));

  if (deep != null && open(x, y)) {
    lays.push({
      terrain: deep,
      near: around(x, y, open),
      over: null,
      whole: false,
      step: stepOf('deep'),
    });
  }
  // Under the water beside dry ground as well, but only where the water
  // draws the shore: a pool's rounded edge lets the ground show through.
  // Where the ground draws it instead, as an island does, the water beside
  // it stays water
  const underShore = water?.drawn === true && ROUND.some(([dx, dy]) => dry(x + dx, y + dy));

  if (ground != null && (dry(x, y) || underShore)) {
    lays.push({ terrain: ground, near: null, over: null, whole: false, step: stepOf('ground') });
  }
  // where the two meet. water with no edge of its own leaves the shore
  // to the ground, which is how a beach was drawn
  if (water != null && ground != null) {
    if (water.drawn && wet(x, y)) {
      const near = around(x, y, wet);

      if (!enclosed(near)) {
        lays.push({ terrain: water, near, over: ground.tone, whole: false, step: SHORE });
      }
    } else if (!water.drawn && dry(x, y)) {
      const near = around(x, y, dry);

      if (!enclosed(near)) {
        lays.push({ terrain: ground, near, over: water.tone, whole: false, step: SHORE });
      }
    }
  }
  // An open sea draws no edge of its own, so the dry ground of another
  // country beside it lays the sea's hollow ring, turned like any shore
  if (dry(x, y)) {
    const seas = new Set<Biome>();

    for (const [dx, dy] of ROUND) {
      const biome = look.biome(x + dx, y + dy);

      if (biome !== look.biome(x, y) && wet(x + dx, y + dy) && isOpenSea(biome)) {
        seas.add(biome);
      }
    }
    for (const sea of seas) {
      const ring = pack.of(sea, 'blend');

      if (ring != null) {
        const near = around(x, y, (cx, cy) => dry(cx, cy) || look.biome(cx, cy) !== sea);

        lays.push({ terrain: ring, near, over: null, whole: false, step: SHORE });
      }
    }
  }
  // the road is one thing wherever it runs: its neighbourhood is asked
  // of the paving alone, so crossing a border changes only the ground
  // its rim is painted in
  // a route and a town's open ground are a beaten trail, laid under the
  // paving so a street's rim meets worn earth. Nothing is drawn where a
  // route fords water
  const trailed = (cx: number, cy: number): boolean => look.trail?.(cx, cy) === true && dry(cx, cy);

  if (trailed(x, y)) {
    const trail = pack.of(look.biome(x, y), 'trail');

    if (trail != null) {
      lays.push({
        terrain: trail,
        near: around(x, y, (cx, cy) => trailed(cx, cy) || look.paved(cx, cy)),
        over: null,
        whole: false,
        step: stepOf('paving'),
      });
    }
  }
  if (look.paved(x, y)) {
    const road = pack.of(look.biome(x, y), 'paving');

    if (road != null) {
      lays.push({
        terrain: road,
        near: around(x, y, (cx, cy) => look.paved(cx, cy)),
        over: ground?.tone ?? null,
        whole: false,
        step: stepOf('paving'),
      });
    }
  }
  // the cliff, on the edge tile of the higher ground: the ring picked
  // for what stands at least as high around it. Not where a fall or a
  // road runs through the step, since those are the way down it
  const level = look.level;
  let cliff = false;

  if (level != null && dry(x, y) && look.seam?.(x, y) !== true) {
    const here = level(x, y);
    const near = around(x, y, (cx, cy) => level(cx, cy) >= here);
    const face = pack.of(look.biome(x, y), 'face');

    if (face != null && !enclosed(near)) {
      const spin = standing ? downhill(near) : 0;

      cliff = true;
      lays.push({
        terrain: face,
        near: turned(near, spin),
        over: ground?.tone ?? null,
        whole: true,
        step: stepOf('cliffs'),
        spin,
      });
    }
  }
  // and last the blend where one country meets the next: the ring of the
  // country that sorts lower, in its own ground, laid over this cell so
  // one side fades into the other. Only one side draws it, and never over
  // paving or a cliff: a road crossing a border is one road, and the rock
  // of a cliff is its own edge already. Land blends into land, and an open
  // sea's ring is its own water, so a sea blends into the sea beside it
  const kind = (cx: number, cy: number): 'land' | 'sea' | null => {
    if (dry(cx, cy)) {
      return 'land';
    }
    return isOpenSea(look.biome(cx, cy)) ? 'sea' : null;
  };
  const mine = kind(x, y);

  if (ground != null && mine != null && !look.paved(x, y) && !trailed(x, y) && !cliff) {
    const beside = new Map<string, Biome>();

    for (const [dx, dy] of ROUND) {
      const other = groundAt(x + dx, y + dy);

      if (other != null && other.name < ground.name && kind(x + dx, y + dy) === mine) {
        beside.set(other.name, look.biome(x + dx, y + dy));
      }
    }
    for (const name of [...beside.keys()].toSorted()) {
      const biome = beside.get(name);
      const blend = biome == null ? null : pack.of(biome, 'blend');
      const near = around(
        x,
        y,
        (cx, cy) => kind(cx, cy) !== mine || groundAt(cx, cy)?.name !== name,
      );

      if (blend != null && !enclosed(near)) {
        lays.push({ terrain: blend, near, over: null, whole: false, step: stepOf('blends') });
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
  standing = false,
): HTMLCanvasElement | null {
  const lays = layersAt(pack, look, x, y, standing).filter((one) => one.step <= upto);

  if (lays.length === 0) {
    return null;
  }
  // Nothing but a shore cares which way the camera is: a cell without
  // one is the same picture from every side, and keeping one copy of
  // it rather than four is most of what the cache holds
  const spun = lays.some((one) => one.step === SHORE) ? ((turns % 4) + 4) % 4 : 0;
  const turnedLays = lays.map((one) =>
    one.near == null || one.step !== SHORE
      ? one
      : { ...one, near: turned(one.near, spun), spin: spun },
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

    // Laid back by the quarter it was picked in, so a shore's rim lands on
    // the side the water actually is and a cliff's face on the low side
    if ((one.spin ?? 0) !== 0) {
      context.save();
      context.translate(SIZE / 2, SIZE / 2);
      context.rotate((-(one.spin ?? 0) * Math.PI) / 2);
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
