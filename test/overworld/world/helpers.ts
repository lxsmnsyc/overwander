import type Chunk from '../../../src/overworld/chunk';
import { chunkOfCell } from '../../../src/overworld/chunk';
import { getTownLots, townOfRegion } from '../../../src/overworld/town';
import type World from '../../../src/overworld/world';

/**
 * Biomes span whole regions, so a search for a specific one has to
 * cover far more ground than a handful of chunks
 */
export default function findChunk(world: World, matches: (chunk: Chunk) => boolean): Chunk | null {
  // The towns first, and by region rather than by chunk. A town is two
  // chunks across and one is sited to every eight, so a sweep that
  // steps over chunks steps over the towns, and everything a town
  // holds is exactly what a chunk of open country no longer does
  for (let regionY = -24; regionY < 24; regionY++) {
    for (let regionX = -24; regionX < 24; regionX++) {
      const town = townOfRegion(world, regionX, regionY);

      if (town == null) {
        continue;
      }

      const seen = new Set<string>();

      for (const lot of getTownLots(world, town)) {
        const key = `${chunkOfCell(lot.x)},${chunkOfCell(lot.y)}`;

        if (seen.has(key)) {
          continue;
        }
        seen.add(key);

        const candidate = world.getChunk(chunkOfCell(lot.x), chunkOfCell(lot.y));

        if (matches(candidate)) {
          return candidate;
        }
      }
    }
  }
  for (let y = -200; y < 200; y += 4) {
    for (let x = -200; x < 200; x += 4) {
      const candidate = world.getChunk(x, y);

      if (matches(candidate)) {
        return candidate;
      }
    }
  }
  return null;
}
