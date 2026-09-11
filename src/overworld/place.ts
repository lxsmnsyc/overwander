import { BIOME_NAMES } from '../data/biome';
import getWorld from './current';
import { townAt, townName } from './town';

/**
 * What a place is called, from its coordinates alone.
 *
 * A chunk has no name of its own — the world is noise and a seed — so
 * it is named by what it is and where: "Taiga (12, -3)". Every screen
 * that says where somebody is standing says it through here, since a
 * second phrasing of the same fact reads as a second place.
 *
 * A town is the exception, because a town is the one thing in the
 * world with a name of its own. Standing in one says the name instead
 * of the country, which is what makes a name worth telling somebody:
 * the portals travel by it
 */
export default function namePlace(chunkX: number, chunkY: number, x?: number, y?: number): string {
  const world = getWorld();
  // Named by the cell rather than the chunk, since a town's footprint
  // does not line up with one. A caller with only a chunk in hand gets
  // the country, which is what the chunk is
  const town = x == null || y == null ? null : townAt(world, x, y);

  if (town != null) {
    return `${townName(town)} (${chunkX}, ${chunkY})`;
  }
  return `${BIOME_NAMES[world.getChunkBiome(chunkX, chunkY)]} (${chunkX}, ${chunkY})`;
}
