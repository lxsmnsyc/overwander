import { BIOME_NAMES, TIMES_OF_DAY } from '../../src/data/biome';
import { SpawnSurface, type TimeOfDay } from '../../src/data/ids/biome';
import type Biome from '../../src/data/ids/biome';

export const SURFACES = [SpawnSurface.Land, SpawnSurface.Water, SpawnSurface.Ice];

/** Every biome, hour and surface that can hold a pool, as one flat walk */
export function* everyPool(): Generator<[Biome, TimeOfDay, SpawnSurface]> {
  for (const biome of Object.keys(BIOME_NAMES).map(Number) as Biome[]) {
    for (const time of TIMES_OF_DAY) {
      for (const surface of SURFACES) {
        yield [biome, time, surface];
      }
    }
  }
}
