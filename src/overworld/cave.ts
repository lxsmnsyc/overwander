import { CHUNK_CELLS, ORTHOGONAL, worldCell } from './grid';
import { roleAt } from './ground';
import { portalCellIn } from './town';
import { isCaveFloor, isRock } from './fields';
import type Biome from '../data/ids/biome';
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
 * The mouth in a chunk, or null where the ground gives none.
 *
 * One to a chunk at most. A hillside is riddled with places a cave
 * could be entered and drawing them all would put a mouth against
 * every crag in sight, so the first the scan meets is the one that
 * counts, which keeps them about as far apart as the chunks are.
 *
 * Both cells have to be in the same chunk. A mouth straddling a
 * boundary would be a landmark one chunk staged and the next one
 * answered for, and the few that fall on an edge are not worth that
 */
export default function caveMouth(world: World, chunkX: number, chunkY: number): CaveMouth | null {
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
      // `roleAt` last: a town has levelled whatever the fields left it,
      // so rock inside one is not a hillside at all
      if (
        isCaveFloor(above, intoWorldX, intoWorldY, intoBiome) &&
        roleAt(above, x, y) === 'ground' &&
        roleAt(above, intoWorldX, intoWorldY) === 'wall'
      ) {
        mouth = { surface: cell, cave: into };
        break;
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
