import AleaRNG from '../core/alea';
import { isOpenSea } from '../data/ids/biome';
import { isRock, isWaterAt } from './fields';
import Landmark from '../data/overworld/landmark';
import { CHUNK_CELLS } from './grid';
import type World from './world';

/**
 * The towns: the one place in the world that is laid out rather than
 * rolled.
 *
 * Everything else a player walks up to is scattered over the country
 * by the chunk it fell in, which made a chunk a shopping list and a
 * walk between two of them pointless. The services live in towns now,
 * and the country between them holds what you actually go out for:
 * things to forage, things to fight and lairs.
 *
 * Sited by region rather than searched for. The world is divided into
 * squares of chunks and each one hashes a single candidate spot, kept
 * well inside its own square, so a town never crosses a region
 * boundary and any cell need only ask about the one region it is in.
 */

/**
 * How many chunks to a region, which is how far apart towns stand:
 * about a minute's walk, so there is country between them worth
 * crossing and never so much that a player is lost in it
 */
export const TOWN_REGION = 8;

/** How wide a town is, from its middle out, in cells */
export const TOWN_RADIUS = 14;

/** How wide a region is, in cells */
const REGION_CELLS = TOWN_REGION * CHUNK_CELLS;

/**
 * How far from a region's edge a town's middle may be sited. Wide
 * enough that the footprint stays inside the region, so the region a
 * cell falls in is the only one that can hold the town covering it
 */
const SITE_INSET = REGION_CELLS / 4;

/** The middle of a town keeps a clear plaza: somewhere to arrive */
const PLAZA_RADIUS = 2;

/** How many lots a town holds */
const MIN_LOTS = 5;
const MAX_LOTS = 8;

/**
 * How many spots in a region are tried before it is left without a
 * town. A region is a hundred and twenty-eight cells across and much
 * of the world is ocean, so one hashed candidate landing in the sea
 * left whole stretches of good land unsettled
 */
const SITE_TRIES = 4;

/**
 * How much of the footprint may be water before the site is refused.
 * Some is fine, and a town with a lake at the end of the street is
 * better than one that could only ever be sited on a plain
 */
const WET_LIMIT = 4;
const WET_SAMPLES = 12;

/**
 * The landmarks a town holds. Services and the people who run them:
 * everything somebody stands behind a counter for, the region's title
 * fights, and the portals, which makes a town somewhere you travel
 * from as well as to
 */
export const TOWN_LANDMARKS: Landmark[] = [
  Landmark.Market,
  Landmark.AuctionBoard,
  Landmark.GymSeat,
  Landmark.GymLeader,
  Landmark.EliteFour,
  Landmark.Champion,
  Landmark.WanderingNpc,
  Landmark.Portal,
];

/**
 * What a town may hold, and how often it does.
 *
 * One of each at most, and not in every town: a place worth walking to
 * is one that has something the last one did not. A market and
 * somebody passing through are on every corner; a portal, a board or
 * a seat are worth the walk, and the ladder is what a badge run is
 * spent looking for
 */
const CHARTER: [kind: Landmark, chance: number][] = [
  [Landmark.GymSeat, 0.5],
  [Landmark.AuctionBoard, 0.5],
  [Landmark.GymLeader, 0.35],
  [Landmark.EliteFour, 0.15],
  [Landmark.Champion, 0.08],
];

/** And what fills whatever lots the charter left over */
const TRADES: Landmark[] = [Landmark.Market, Landmark.WanderingNpc];

/** One thing standing in a town, at the world cell it stands on */
export interface Lot {
  x: number;
  y: number;
  landmark: Landmark;
}

export interface Town {
  /** The world cell its middle sits on */
  x: number;
  y: number;
  seed: string;
}

/** Which region a world cell falls in */
function regionOf(cell: number): number {
  return Math.floor(cell / REGION_CELLS);
}

/**
 * Whether a site has enough dry, flat ground under it to build on.
 * Sampled rather than swept: a dozen points across the footprint says
 * as much as nine hundred, and this is asked of every region a player
 * walks through
 */
function isBuildable(world: World, x: number, y: number): boolean {
  const biome = world.getCellBiome(x, y);

  // Nothing is built at sea, and nothing is built on the one cell the
  // whole town is measured from being water or rock
  if (isOpenSea(biome) || isWaterAt(world, x, y, biome) || isRock(world, x, y, biome)) {
    return false;
  }

  let wet = 0;

  for (let step = 0; step < WET_SAMPLES; step++) {
    const angle = (step / WET_SAMPLES) * Math.PI * 2;
    const px = Math.round(x + Math.cos(angle) * TOWN_RADIUS * 0.7);
    const py = Math.round(y + Math.sin(angle) * TOWN_RADIUS * 0.7);
    const around = world.getCellBiome(px, py);

    if (isWaterAt(world, px, py, around) || isRock(world, px, py, around)) {
      wet += 1;
    }
  }
  return wet <= WET_LIMIT;
}

/**
 * What each world has worked out about its regions. Held against the
 * world rather than in the module so that two worlds in one page — a
 * demo beside the game — do not answer each other's questions
 */
const sited = new WeakMap<World, Map<number, Town | null>>();
const laid = new WeakMap<World, Map<number, Lot[]>>();

/**
 * A region as one number. Every cell of the world asks this on its
 * way to being read, so it is arithmetic rather than a string: a key
 * built with a template is an allocation per cell, and the ground is
 * read a couple of thousand cells at a time
 */
const REGION_SPAN = 4096;

function regionKey(regionX: number, regionY: number): number {
  return (regionX + REGION_SPAN) * REGION_SPAN * 2 + (regionY + REGION_SPAN);
}

/** The town of one region, or null where the ground refused one */
export function townOfRegion(world: World, regionX: number, regionY: number): Town | null {
  return townIn(world, regionX, regionY);
}

/** Which region a world cell falls in, for anything walking them */
export function regionOfCell(cell: number): number {
  return regionOf(cell);
}

function townIn(world: World, regionX: number, regionY: number): Town | null {
  const known = sited.get(world) ?? new Map<number, Town | null>();
  const key = regionKey(regionX, regionY);

  sited.set(world, known);
  if (known.has(key)) {
    return known.get(key) ?? null;
  }

  const seed = `${world.seed}town(${regionX}, ${regionY})`;
  const rng = new AleaRNG(seed);
  const spread = REGION_CELLS - SITE_INSET * 2;
  let town: Town | null = null;

  // Every draw is taken whether or not it is used, so the ground
  // deciding a site is unbuildable does not shift the ones after it
  for (let tried = 0; tried < SITE_TRIES; tried++) {
    const x = regionX * REGION_CELLS + SITE_INSET + Math.floor(rng.random() * spread);
    const y = regionY * REGION_CELLS + SITE_INSET + Math.floor(rng.random() * spread);

    if (town == null && isBuildable(world, x, y)) {
      town = { x, y, seed };
    }
  }

  known.set(key, town);
  return town;
}

/**
 * The town covering a world cell, if one does. A footprint never
 * leaves its own region, so this is one region's question
 */
export function townAt(world: World, x: number, y: number): Town | null {
  const town = townIn(world, regionOf(x), regionOf(y));

  return town != null && Math.hypot(x - town.x, y - town.y) <= TOWN_RADIUS ? town : null;
}

/**
 * How many spots are tried for a portal out in the country before it
 * is put down wherever the last one landed. A portal at sea is a gate
 * on the water and perfectly good; one inside a crag is not
 */
const PORTAL_TRIES = 6;

/**
 * Where the region's portal stands, as a world cell.
 *
 * Every region has exactly one, which is what makes the network worth
 * having: it is even, it is dense enough to search quickly, and every
 * country the world grows has one somewhere in it, the open seas
 * included. Where the region has a town the portal is in the town,
 * because that is what a town is for; where it has none the portal
 * stands out in the country
 */
export function portalSpot(world: World, regionX: number, regionY: number): [x: number, y: number] {
  const town = townIn(world, regionX, regionY);

  if (town != null) {
    // The portal is the first lot a town lays, so a town always has
    // one and it is always the same one
    const [lot] = getTownLots(world, town);

    return [lot.x, lot.y];
  }

  const rng = new AleaRNG(`${world.seed}portal(${regionX}, ${regionY})`);
  const spread = REGION_CELLS - SITE_INSET * 2;
  let spot: [number, number] = [regionX * REGION_CELLS, regionY * REGION_CELLS];

  for (let tried = 0; tried < PORTAL_TRIES; tried++) {
    const x = regionX * REGION_CELLS + SITE_INSET + Math.floor(rng.random() * spread);
    const y = regionY * REGION_CELLS + SITE_INSET + Math.floor(rng.random() * spread);

    spot = [x, y];
    if (!isRock(world, x, y, world.getCellBiome(x, y))) {
      break;
    }
  }
  return spot;
}

/**
 * Which cell of a chunk the region's portal stands on, or null when it
 * stands somewhere else. Asked without rolling anything the chunk
 * holds, since the portal network is walked a great many chunks at a
 * time and a landmark roll is not free
 */
export function portalCellIn(world: World, chunkX: number, chunkY: number): number | null {
  const [x, y] = portalSpot(world, regionOf(chunkX * CHUNK_CELLS), regionOf(chunkY * CHUNK_CELLS));
  const cellX = x - chunkX * CHUNK_CELLS;
  const cellY = y - chunkY * CHUNK_CELLS;

  return cellX < 0 || cellY < 0 || cellX >= CHUNK_CELLS || cellY >= CHUNK_CELLS
    ? null
    : cellY * CHUNK_CELLS + cellX;
}

/** Whether a world cell is inside a town */
export function isTownAt(world: World, x: number, y: number): boolean {
  return townAt(world, x, y) != null;
}

/** The town a chunk stands in, if the chunk touches one */
export function townOverChunk(world: World, chunkX: number, chunkY: number): Town | null {
  const town = townIn(world, regionOf(chunkX * CHUNK_CELLS), regionOf(chunkY * CHUNK_CELLS));

  if (town == null) {
    return null;
  }

  // The corner of the chunk nearest the town's middle: if that is
  // outside the footprint then no cell of the chunk is inside it
  const nearest = (middle: number, from: number): number =>
    Math.min(Math.max(middle, from), from + CHUNK_CELLS - 1);
  const cellX = nearest(town.x, chunkX * CHUNK_CELLS);
  const cellY = nearest(town.y, chunkY * CHUNK_CELLS);

  return Math.hypot(cellX - town.x, cellY - town.y) <= TOWN_RADIUS ? town : null;
}

/** The cells a lot keeps clear around itself, in world cells */
function ringOf(x: number, y: number): string[] {
  const cells: string[] = [];

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      cells.push(`${x + dx},${y + dy}`);
    }
  }
  return cells;
}

/**
 * Where a town's lots stand, as world cells.
 *
 * Laid out from the town's own seed the way a chunk lays out its
 * landmarks: an order over the buildable ground, and each lot keeping
 * the ring around it clear so there is always somewhere to stand
 * beside whatever a player walked over to. The middle is left as a
 * plaza, since arriving in a town on top of the gym is not arriving
 */
export function getTownLots(world: World, town: Town): Lot[] {
  const held = laid.get(world) ?? new Map<number, Lot[]>();
  const key = regionKey(regionOf(town.x), regionOf(town.y));

  laid.set(world, held);

  const known = held.get(key);

  if (known != null) {
    return known;
  }

  const rng = new AleaRNG(`${town.seed}lots`);
  const open: [number, number][] = [];

  for (let dy = -TOWN_RADIUS; dy <= TOWN_RADIUS; dy++) {
    for (let dx = -TOWN_RADIUS; dx <= TOWN_RADIUS; dx++) {
      const reach = Math.hypot(dx, dy);

      if (reach > TOWN_RADIUS - 1 || reach <= PLAZA_RADIUS) {
        continue;
      }

      const x = town.x + dx;
      const y = town.y + dy;

      // A town levels everything it stands on but the sea, so a lot
      // on the water is a stall nobody could reach
      if (isOpenSea(world.getCellBiome(x, y))) {
        continue;
      }
      open.push([x, y]);
    }
  }
  for (let at = open.length - 1; at > 0; at -= 1) {
    const pick = Math.floor(rng.random() * (at + 1));

    [open[at], open[pick]] = [open[pick], open[at]];
  }

  const count = MIN_LOTS + Math.floor(rng.random() * (MAX_LOTS - MIN_LOTS + 1));
  // What this town is: the portal first, since every region has one
  // and a town is where it stands, then its charter, so a town short
  // of room keeps what makes it worth walking to and loses a stall
  const chartered = CHARTER.filter(([, chance]) => rng.random() < chance).map(([kind]) => kind);
  const wanted = [
    Landmark.Portal,
    ...chartered,
    ...Array.from(
      { length: Math.max(0, count - chartered.length) },
      () => TRADES[Math.floor(rng.random() * TRADES.length)],
    ),
  ].slice(0, count);
  const lots: Lot[] = [];
  const taken = new Set<string>();

  for (const landmark of wanted) {
    const spot = open.find(([x, y]) => !taken.has(`${x},${y}`));

    if (spot == null) {
      break;
    }
    lots.push({ x: spot[0], y: spot[1], landmark });
    for (const cell of ringOf(spot[0], spot[1])) {
      taken.add(cell);
    }
  }
  held.set(key, lots);
  return lots;
}
