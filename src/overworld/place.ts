import { BIOME_NAMES } from '../data/biome';
import getWorld from './current';

/**
 * What a place is called, from its coordinates alone.
 *
 * A chunk has no name of its own — the world is noise and a seed — so
 * it is named by what it is and where: "Taiga (12, -3)". Every screen
 * that says where somebody is standing says it through here, since a
 * second phrasing of the same fact reads as a second place
 */
export default function namePlace(chunkX: number, chunkY: number): string {
  return `${BIOME_NAMES[getWorld().getChunkBiome(chunkX, chunkY)]} (${chunkX}, ${chunkY})`;
}
