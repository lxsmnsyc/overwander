import AleaRNG from '../core/alea';
import type { SettledBiome } from '../data/ids/biome';
import { isOpenSea, isSettledBiome } from '../data/ids/biome';
import nameTown from '../data/overworld/town-names';
import { isRock, isWaterAt } from './fields';
import Landmark from '../data/overworld/landmark';
import { CHUNK_CELLS, ORTHOGONAL } from './grid';
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

/**
 * How far the plaza reaches out of the middle, as a square. Nothing is
 * built on it but the portal at its centre, which is what a plaza is:
 * where a town is arrived in
 */
const PLAZA_RADIUS = 2;

/** How many lots a town holds */
const MIN_LOTS = 9;
const MAX_LOTS = 14;

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
  Landmark.PokemonCenter,
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
 * spent looking for. The centre is the one certainty, since walking
 * into a town has to mean a party comes out of it whole
 */
const CHARTER: [kind: Landmark, chance: number][] = [
  // Certain, and chartered first so a town with barely any room still
  // has one: being patched up is the service the rest of the game
  // assumes, and a town without it is a town a player has to leave
  [Landmark.PokemonCenter, 1],
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
  /** The region it was sited in, which is the key everything holds it by */
  regionX: number;
  regionY: number;
  /** The country it stands on, which is where its name comes from */
  biome: SettledBiome;
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
const paved = new WeakMap<World, Map<number, Set<number>>>();

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

    const biome = world.getCellBiome(x, y);

    // A town is named after its own country, so the country has to be
    // one a town can stand on. `isBuildable` refuses the open seas
    // anyway; this is the same refusal said in the type
    if (town == null && isSettledBiome(biome) && isBuildable(world, x, y)) {
      town = { x, y, regionX, regionY, biome, seed };
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

  // Dead centre of the plaza, which is where every one of its streets
  // begins: a player stepping out of the gate is looking down all of
  // them at once
  if (town != null) {
    return [town.x, town.y];
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

/**
 * What a town is called.
 *
 * Worked out from where it stands, so every client answers the same
 * thing without asking anybody and a town has a name before anyone has
 * been to it. Two towns can never share one: see
 * [`town-names.ts`](../data/overworld/town-names.ts), where the
 * county is what makes that true
 */
export function townName(town: Town): string {
  return nameTown(town.regionX, town.regionY, town.biome);
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
      // Off the rim, and off the whole of the paved plaza rather than
      // a circle inside it: a stall on a paved corner would be a stall
      // in the middle of the square
      if (
        Math.hypot(dx, dy) > TOWN_RADIUS - 1 ||
        Math.max(Math.abs(dx), Math.abs(dy)) <= PLAZA_RADIUS
      ) {
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
  // What this town is: its charter first, so a town short of room
  // keeps what makes it worth walking to and loses a stall. The portal
  // is no lot of theirs, it stands on the plaza
  const chartered = CHARTER.filter(([, chance]) => rng.random() < chance).map(([kind]) => kind);
  const wanted = [
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

/** How wide a town's own square of cells is, roads and all */
const FOOTPRINT = TOWN_RADIUS * 2 + 1;

/** A cell of a town as an offset into its footprint, so roads pack into numbers */
function pavedKey(town: Town, x: number, y: number): number {
  return (y - town.y + TOWN_RADIUS) * FOOTPRINT + (x - town.x + TOWN_RADIUS);
}

/**
 * The streets of a town, as offsets into its footprint.
 *
 * The plaza is paved whole and a street runs out of it to each lot,
 * stopping at the door rather than paving it, so a town is read by
 * following a road rather than by crossing an open field looking for
 * what is on it and nobody is ever standing in one. Streets only run
 * north, south, east or west, turning a square corner where they turn
 * at all, and no street crosses a lot: one that would goes round.
 *
 * They are laid over the ground rather than cut into it, so a road is
 * a thing to walk along and never a thing that decides where a player
 * may walk
 */
export function getTownRoads(world: World, town: Town): Set<number> {
  const held = paved.get(world) ?? new Map<number, Set<number>>();
  const key = regionKey(regionOf(town.x), regionOf(town.y));

  paved.set(world, held);

  const known = held.get(key);

  if (known != null) {
    return known;
  }

  const roads = new Set<number>();
  const lots = getTownLots(world, town);
  const doors = new Set(lots.map((lot) => pavedKey(town, lot.x, lot.y)));

  /**
   * Whether a street may run here: inside the town, off the water for
   * the reason the town stops at the shore, and off every lot. A
   * street that ran under a building would be a street a building
   * stood in the middle of
   */
  const open = (x: number, y: number): boolean =>
    Math.hypot(x - town.x, y - town.y) <= TOWN_RADIUS &&
    !isOpenSea(world.getCellBiome(x, y)) &&
    !doors.has(pavedKey(town, x, y));

  const lay = (path: [x: number, y: number][]): void => {
    for (const [x, y] of path) {
      roads.add(pavedKey(town, x, y));
    }
  };

  // A square rather than a disc: the streets meeting it are square,
  // and a round plaza between them reads as a mistake
  for (let dy = -PLAZA_RADIUS; dy <= PLAZA_RADIUS; dy++) {
    for (let dx = -PLAZA_RADIUS; dx <= PLAZA_RADIUS; dx++) {
      if (open(town.x + dx, town.y + dy)) {
        roads.add(pavedKey(town, town.x + dx, town.y + dy));
      }
    }
  }

  /** One straight run of street, ends included, which is the only kind a town has */
  const run = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
  ): [x: number, y: number][] => {
    const stepX = Math.sign(toX - fromX);
    const stepY = Math.sign(toY - fromY);
    // Every run is along one axis, so the two distances never add up
    // to anything but the one that moved
    const steps = Math.abs(toX - fromX) + Math.abs(toY - fromY);
    const cells: [number, number][] = [];

    for (let step = 0; step <= steps; step++) {
      cells.push([fromX + stepX * step, fromY + stepY * step]);
    }
    return cells;
  };

  /**
   * The plaza to a lot's door in two straight runs, turning once. The
   * long side first is what makes a town read as avenues out of the
   * plaza with short branches off them, rather than a lane per lot
   * fanning out of the middle
   */
  const elbow = (lot: Lot, alongX: boolean): [x: number, y: number][] => {
    const cornerX = alongX ? lot.x : town.x;
    const cornerY = alongX ? town.y : lot.y;

    return [
      ...run(town.x, town.y, cornerX, cornerY),
      ...run(cornerX, cornerY, lot.x, lot.y),
      // The door itself is never paved: whoever stands at a lot
      // stands at their own place rather than in the road
    ].slice(0, -1);
  };

  /**
   * A way round, for a lot neither elbow can reach: the street from
   * the plaza to its door that crosses the least fresh ground, and the
   * shortest of those. Paving already laid is free to walk, so a way
   * round joins the street it meets and runs along it rather than
   * laying a second lane one cell over
   */
  const around = (lot: Lot): [x: number, y: number][] | null => {
    const start = pavedKey(town, town.x, town.y);
    const fresh = new Map<number, number>([[start, 0]]);
    const walked = new Map<number, number>([[start, 0]]);
    const from = new Map<number, number>();
    // A deque: a step onto paving costs nothing and goes to the front,
    // so the cheapest ways out are always the ones walked next
    const queue: [x: number, y: number][] = [[town.x, town.y]];

    while (queue.length > 0) {
      const step = queue.shift();

      if (step == null) {
        break;
      }

      const [x, y] = step;
      const here = pavedKey(town, x, y);

      for (const [offX, offY] of ORTHOGONAL) {
        const stepX = x + offX;
        const stepY = y + offY;

        if (!open(stepX, stepY)) {
          continue;
        }

        const next = pavedKey(town, stepX, stepY);
        const paving = roads.has(next);
        const price = (fresh.get(here) ?? 0) + (paving ? 0 : 1);
        const steps = (walked.get(here) ?? 0) + 1;
        const cheapest = fresh.get(next);

        if (
          cheapest != null &&
          (cheapest < price || (cheapest === price && (walked.get(next) ?? 0) <= steps))
        ) {
          continue;
        }
        fresh.set(next, price);
        walked.set(next, steps);
        from.set(next, here);
        if (paving) {
          queue.unshift([stepX, stepY]);
        } else {
          queue.push([stepX, stepY]);
        }
      }
    }

    // The door is not walked to, it is arrived beside: the cheapest
    // cell that touches it is where the street ends
    let door: number | null = null;
    let cheapestDoor = Number.POSITIVE_INFINITY;
    let shortestDoor = Number.POSITIVE_INFINITY;

    for (const [offX, offY] of ORTHOGONAL) {
      const beside = pavedKey(town, lot.x + offX, lot.y + offY);
      const price = fresh.get(beside);
      const steps = walked.get(beside);

      if (price == null || steps == null) {
        continue;
      }
      if (price < cheapestDoor || (price === cheapestDoor && steps < shortestDoor)) {
        door = beside;
        cheapestDoor = price;
        shortestDoor = steps;
      }
    }
    if (door == null) {
      return null;
    }

    const path: [number, number][] = [];

    for (let cell = door; ; cell = from.get(cell) ?? start) {
      path.push([
        town.x + ((cell % FOOTPRINT) - TOWN_RADIUS),
        town.y + (Math.floor(cell / FOOTPRINT) - TOWN_RADIUS),
      ]);
      if (cell === start) {
        return path;
      }
    }
  };

  for (const lot of lots) {
    const alongX = Math.abs(lot.x - town.x) >= Math.abs(lot.y - town.y);
    const straight = [elbow(lot, alongX), elbow(lot, !alongX)].find((path) =>
      path.every(([x, y]) => open(x, y)),
    );

    lay(straight ?? around(lot) ?? []);
  }
  held.set(key, roads);
  return roads;
}

/** Whether a street runs through this world cell */
export function isRoadAt(world: World, x: number, y: number): boolean {
  const town = townAt(world, x, y);

  return town != null && getTownRoads(world, town).has(pavedKey(town, x, y));
}
