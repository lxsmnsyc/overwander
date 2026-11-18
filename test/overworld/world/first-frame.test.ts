// What the overworld derives before the battle data and the learn sets
// arrive. The app registers only the world at boot (src/data/world.ts),
// so nothing a chunk works out may read a move, an ability, an item or
// a learn set. Every other test registers everything, which hides such
// a read, so this file registers what the browser does and no more.

import { describe, expect, it } from 'vitest';
import registerWorldData from '../../../src/data/world';
import ChunkSnapshot from '../../../src/overworld/chunk-snapshot';
import { DEPTHS } from '../../../src/overworld/depth';
import World from '../../../src/overworld/world';

registerWorldData();

const SPAN = 6;

const HOURS = [0, 6, 12, 18];

/** Each thing a chunk derives that the board draws or a sheet lists */
const READS: readonly [string, (snapshot: ChunkSnapshot) => unknown][] = [
  ['closed cells', (snapshot) => snapshot.getClosedCells()],
  ['spawns', (snapshot) => snapshot.getSpawnCells()],
  ['item caches', (snapshot) => snapshot.getItemCaches()],
  ['berry patches', (snapshot) => snapshot.getBerryPatches()],
  ['apricorn trees', (snapshot) => snapshot.getApricornTrees()],
  ['legendary lairs', (snapshot) => snapshot.getLegendaryLairs()],
  ['fallen lairs', (snapshot) => snapshot.getFallenLairs()],
  ['totems', (snapshot) => snapshot.getTotems()],
  ['Max Raids', (snapshot) => snapshot.getMaxRaids()],
  ['alpha raids', (snapshot) => snapshot.getAlphaRaids()],
  ['Tera Raids', (snapshot) => snapshot.getTeraRaids()],
  ['noble raids', (snapshot) => snapshot.getNobleRaids()],
  ['shadow lairs', (snapshot) => snapshot.getShadowLairs()],
  ['nests', (snapshot) => snapshot.getNests()],
  ['wandering npcs', (snapshot) => snapshot.getWanderingNpcs()],
  ['wanderer coats', (snapshot) => snapshot.getWandererCoats()],
  ['syndicate', (snapshot) => snapshot.getSyndicate()],
];

describe('the first frame', () => {
  it('derives every chunk with only the world registered', () => {
    const failures = new Set<string>();

    for (const depth of DEPTHS) {
      const world = new World('overworld', depth);

      for (let y = -SPAN; y < SPAN; y++) {
        for (let x = -SPAN; x < SPAN; x++) {
          const chunk = world.getChunk(x, y);

          for (const hour of HOURS) {
            const snapshot = new ChunkSnapshot(chunk, Date.UTC(2026, 10, 18, hour));

            for (const [name, read] of READS) {
              try {
                read(snapshot);
              } catch (error) {
                // One line per kind of read, not per chunk
                failures.add(`${name}: ${String(error).replaceAll(/\d+/g, 'N')}`);
              }
            }
          }
        }
      }
    }
    expect([...failures]).toEqual([]);
  });
});
