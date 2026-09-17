import { CHUNK_CELLS, ORTHOGONAL, worldCell } from './grid';
import { isHillside, isSurfaceWater } from './surface';
import { portalCellIn } from './town';
import { isCaveFloor, isRock } from './fields';
import type Biome from '../data/ids/biome';
import { MOUTH_GAP, MOUTH_SEARCH } from '../data/overworld/cave';
import type World from './world';
import { Depth } from './depth';

/**
 * The way in and out of the caves.
 *
 * A cave is the same world one layer down, so a mouth is not a
 * destination: it is a **pair of cells**, the one a player stands on
 * to go in and the one they come out on underneath. Both are worked
 * out from the ground itself, so nothing about the network is stored
 * and both sides agree on where every entrance is.
 *
 * The surface cell is open ground with rock beside it, and the cave
 * cell is that rock. So a mouth is always cut into something a player
 * can see: walk up to the crag, step into the hillside. The two cells
 * touch, which means going down moves a player one cell rather than
 * teleporting them, and the far end of the walk underground comes out
 * exactly as far across the world as they actually walked.
 */

/** One way between the layers, as the two cells it joins */
export interface CaveMouth {
  /** The cell on the surface, which is open ground */
  surface: number;
  /** The cell underneath, which is the rock that ground stands beside */
  cave: number;
}

/**
 * What a chunk's mouths are held against. A mouth reads a dozen cells
 * of ground and a chunk is asked for its landmarks a great many times,
 * so the answer is kept against the world it was read from
 */
const cut = new WeakMap<World, Map<string, CaveMouth | null>>();

/**
 * Where a chunk's ground would take a mouth, before the chunks around
 * it have their say.
 *
 * One to a chunk at most. A hillside is riddled with places a cave
 * could be entered and drawing them all would put a mouth against
 * every crag in sight, so the first the scan meets is the one that
 * counts.
 *
 * Both cells have to be in the same chunk. A mouth straddling a
 * boundary would be a landmark one chunk staged and the next one
 * answered for, and the few that fall on an edge are not worth that
 */
function scanCaveMouth(world: World, chunkX: number, chunkY: number): CaveMouth | null {
  // Read off the surface whichever layer is asking: the two layers
  // have to name the same pair of cells or a player could go down
  // somewhere they could not come back up
  const above = world.at(Depth.Surface);
  const held = cut.get(above) ?? new Map<string, CaveMouth | null>();
  const key = `${chunkX},${chunkY}`;

  cut.set(above, held);
  if (held.has(key)) {
    return held.get(key) ?? null;
  }

  // The region's portal, which is placed before a mouth is and keeps
  // the ring around itself. Asked here rather than left to the chunk,
  // so both layers refuse the same cells: a mouth the surface had no
  // room for must not be staged underground either, or it would be a
  // way in with no way back out
  const gate = portalCellIn(above, chunkX, chunkY);
  const gateX = gate == null ? null : gate % CHUNK_CELLS;
  const gateY = gate == null ? null : Math.floor(gate / CHUNK_CELLS);
  let mouth: CaveMouth | null = null;
  // The country and the rock, read once per cell rather than once per
  // time a cell is looked at. Every cell of the chunk is its own
  // candidate and a neighbour of four others, so without this the
  // warped climate sample is taken five times over for each of them,
  // and every chunk in the world runs this scan
  const country = new Array<Biome | undefined>(CHUNK_CELLS * CHUNK_CELLS);
  const stone = new Array<boolean | undefined>(CHUNK_CELLS * CHUNK_CELLS);
  const biomeOf = (at: number, x: number, y: number): Biome =>
    (country[at] ??= above.getCellBiome(x, y));
  const rockAt = (at: number, x: number, y: number): boolean =>
    (stone[at] ??= isRock(above, x, y, biomeOf(at, x, y)));

  for (let cell = 0; cell < CHUNK_CELLS * CHUNK_CELLS && mouth == null; cell++) {
    const column = cell % CHUNK_CELLS;
    const row = Math.floor(cell / CHUNK_CELLS);

    if (
      gateX != null &&
      gateY != null &&
      Math.abs(column - gateX) <= 1 &&
      Math.abs(row - gateY) <= 1
    ) {
      continue;
    }
    const x = worldCell(chunkX, column);
    const y = worldCell(chunkY, row);

    // Cheapest first, and by a long way. `roleAt` reads the country,
    // the town, the water and sometimes floods a hollow to see whether
    // it runs anywhere; `isRock` is one sample of one field. Every
    // chunk in the world asks this, so the full reading is kept for
    // the few pairs that get past the sample
    if (rockAt(cell, x, y)) {
      continue;
    }

    for (const [dx, dy] of ORTHOGONAL) {
      const intoX = column + dx;
      const intoY = row + dy;

      if (intoX < 0 || intoY < 0 || intoX >= CHUNK_CELLS || intoY >= CHUNK_CELLS) {
        continue;
      }

      const into = intoY * CHUNK_CELLS + intoX;
      const intoWorldX = worldCell(chunkX, intoX);
      const intoWorldY = worldCell(chunkY, intoY);

      if (!rockAt(into, intoWorldX, intoWorldY)) {
        continue;
      }

      const intoBiome = biomeOf(into, intoWorldX, intoWorldY);

      // The rock it is cut into, which is the cave on the other side.
      // Both are asked, since the chambers are the rock but the veins
      // are not, and a vein under open ground is no hillside.
      //
      // The hillside last: a town has levelled whatever the fields
      // left it, so rock inside one is no hillside at all
      if (
        isCaveFloor(above, intoWorldX, intoWorldY, intoBiome) &&
        !isSurfaceWater(above, x, y, biomeOf(cell, x, y)) &&
        isHillside(above, intoWorldX, intoWorldY)
      ) {
        mouth = { surface: cell, cave: into };
        break;
      }
    }
  }

  held.set(key, mouth);
  return mouth;
}

/** The world cell a chunk's mouth stands on, for measuring the gap between two */
function mouthSpot(chunkX: number, chunkY: number, mouth: CaveMouth): { x: number; y: number } {
  return {
    x: worldCell(chunkX, mouth.surface % CHUNK_CELLS),
    y: worldCell(chunkY, Math.floor(mouth.surface / CHUNK_CELLS)),
  };
}

/** What the filtered answer is held against, once a chunk has been judged */
const cutOrNot = new WeakMap<World, Map<string, CaveMouth | null>>();

/**
 * Where a chunk stands in the queue for a mouth. A draw off the seed
 * and the coordinates, so every chunk agrees on who wins without any
 * of them being generated first
 */
function mouthRank(world: World, chunkX: number, chunkY: number): number {
  return world.draws(`${world.seed}mouth(${chunkX}, ${chunkY})`).random('rank');
}

/**
 * The mouth in a chunk, or null where the ground gives none.
 *
 * A mouth keeps the chunks around it clear of one, diagonals
 * included. The ground offers far more hillsides than the world wants
 * doors: two chunks that both cut one put a pair of entrances within
 * sight of each other, and the second is a walk to somewhere the
 * first already goes. Which of two neighbours keeps its own is a draw
 * off the seed rather than whichever was asked for first, so the
 * network is the same however a player walks into it
 */
export default function caveMouth(world: World, chunkX: number, chunkY: number): CaveMouth | null {
  const above = world.at(Depth.Surface);
  const held = cutOrNot.get(above) ?? new Map<string, CaveMouth | null>();
  const key = `${chunkX},${chunkY}`;

  cutOrNot.set(above, held);
  if (held.has(key)) {
    return held.get(key) ?? null;
  }
  // Held before the neighbours are read: nothing here asks for this
  // chunk again, and a miss is the common answer by far
  held.set(key, null);

  const mouth = scanCaveMouth(world, chunkX, chunkY);

  if (mouth == null) {
    return null;
  }

  const rank = mouthRank(world, chunkX, chunkY);
  const here = mouthSpot(chunkX, chunkY, mouth);

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) {
        continue;
      }
      // The neighbour's own ground only: asking for its finished
      // answer would ask this chunk for one right back
      const other = scanCaveMouth(world, chunkX + dx, chunkY + dy);

      if (other == null || mouthRank(world, chunkX + dx, chunkY + dy) <= rank) {
        continue;
      }
      const spot = mouthSpot(chunkX + dx, chunkY + dy, other);

      if (Math.max(Math.abs(spot.x - here.x), Math.abs(spot.y - here.y)) < MOUTH_GAP) {
        return null;
      }
    }
  }

  held.set(key, mouth);
  return mouth;
}

/**
 * The cell a chunk stages its mouth on, at the layer asked. Null for
 * a chunk with no way through, which is most of the world: a cave is
 * only ever inside the country that has rock in it
 */
export function caveMouthCellIn(world: World, chunkX: number, chunkY: number): number | null {
  const mouth = caveMouth(world, chunkX, chunkY);

  if (mouth == null) {
    return null;
  }
  return world.depth === Depth.Cave ? mouth.cave : mouth.surface;
}

/** How many chunks a side a stretch of cave is judged in, for what can be walked to */
const REACH_BLOCK = 4;
const BLOCK_CELLS = REACH_BLOCK * CHUNK_CELLS;

/** How many judged blocks a world keeps, oldest let go first */
const HELD_BLOCKS = 64;

const judged = new WeakMap<World, Map<string, Uint8Array>>();

/** The floor of one block a player can walk to from a mouth inside that same block */
function reachBlock(world: World, blockX: number, blockY: number): Uint8Array {
  const originX = blockX * BLOCK_CELLS;
  const originY = blockY * BLOCK_CELLS;
  const open = new Uint8Array(BLOCK_CELLS * BLOCK_CELLS);
  const kept = new Uint8Array(BLOCK_CELLS * BLOCK_CELLS);
  const stack: number[] = [];

  for (let at = 0; at < open.length; at++) {
    const x = originX + (at % BLOCK_CELLS);
    const y = originY + Math.floor(at / BLOCK_CELLS);

    open[at] = isCaveFloor(world, x, y, world.getCellBiome(x, y)) ? 1 : 0;
  }
  for (let chunkY = blockY * REACH_BLOCK; chunkY < (blockY + 1) * REACH_BLOCK; chunkY++) {
    for (let chunkX = blockX * REACH_BLOCK; chunkX < (blockX + 1) * REACH_BLOCK; chunkX++) {
      const mouth = caveMouth(world, chunkX, chunkY);

      if (mouth == null) {
        continue;
      }
      const at =
        (worldCell(chunkY, Math.floor(mouth.cave / CHUNK_CELLS)) - originY) * BLOCK_CELLS +
        (worldCell(chunkX, mouth.cave % CHUNK_CELLS) - originX);

      kept[at] = 1;
      stack.push(at);
    }
  }
  while (stack.length > 0) {
    const at = stack.pop() ?? 0;
    const column = at % BLOCK_CELLS;
    const row = Math.floor(at / BLOCK_CELLS);

    for (const [dx, dy] of ORTHOGONAL) {
      const x = column + dx;
      const y = row + dy;
      const next = y * BLOCK_CELLS + x;

      if (
        x >= 0 &&
        y >= 0 &&
        x < BLOCK_CELLS &&
        y < BLOCK_CELLS &&
        open[next] === 1 &&
        kept[next] === 0
      ) {
        kept[next] = 1;
        stack.push(next);
      }
    }
  }
  return kept;
}

/**
 * Whether a cave's floor runs here and a player can walk to it.
 *
 * The carving leaves pockets no mouth leads to, so floor only counts
 * where it joins a mouth without leaving its block. Judged per block
 * rather than across the network so the answer stays local, and
 * filling a sealed pocket in never leaves rock thinner than 2x2
 */
export function isCaveOpen(world: World, x: number, y: number): boolean {
  const blockX = Math.floor(x / BLOCK_CELLS);
  const blockY = Math.floor(y / BLOCK_CELLS);
  const key = `${blockX},${blockY}`;
  const held = judged.get(world) ?? new Map<string, Uint8Array>();
  let block = held.get(key);

  judged.set(world, held);
  if (block == null) {
    block = reachBlock(world, blockX, blockY);
    // A map keeps insertion order, so the first key is the block read longest ago
    const oldest = held.keys().next().value;

    if (held.size >= HELD_BLOCKS && oldest != null) {
      held.delete(oldest);
    }
  } else {
    held.delete(key);
  }
  held.set(key, block);
  return block[(y - blockY * BLOCK_CELLS) * BLOCK_CELLS + (x - blockX * BLOCK_CELLS)] === 1;
}

/** A way out, and the chunk it was found in */
export interface NearestMouth {
  chunkX: number;
  chunkY: number;
  mouth: CaveMouth;
}

/**
 * The nearest way up, ring by ring so the first found is the nearest
 * and a chunk with its own mouth costs one reading. Nearest by ring
 * rather than by true distance, which can prefer a corner to an edge
 * slightly closer. Null where nothing is within `MOUTH_SEARCH`
 */
export function nearestMouth(world: World, chunkX: number, chunkY: number): NearestMouth | null {
  for (let ring = 0; ring <= MOUTH_SEARCH; ring++) {
    for (let y = chunkY - ring; y <= chunkY + ring; y++) {
      for (let x = chunkX - ring; x <= chunkX + ring; x++) {
        // Only the ring's own edge: everything inside it was read by
        // the rounds before this one
        if (Math.max(Math.abs(x - chunkX), Math.abs(y - chunkY)) !== ring) {
          continue;
        }

        const mouth = caveMouth(world, x, y);

        if (mouth != null) {
          return { chunkX: x, chunkY: y, mouth };
        }
      }
    }
  }
  return null;
}

/** Where a player standing at a mouth comes out on the other side */
export function throughMouth(world: World, chunkX: number, chunkY: number): number | null {
  const mouth = caveMouth(world, chunkX, chunkY);

  if (mouth == null) {
    return null;
  }
  // Read backwards: going down lands on the cave cell, coming up
  // lands on the surface one
  return world.depth === Depth.Cave ? mouth.surface : mouth.cave;
}
