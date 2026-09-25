import { describe, expect, it } from 'vitest';
import registerGameData from '../../src/data/index';
import caveMouth from '../../src/overworld/cave';
import { CHUNK_CELLS } from '../../src/overworld/grid';
import pickStartPosition from '../../src/overworld/start';
import { levelAt } from '../../src/overworld/terrace';
import { getTownLots, getTownRoads, townOfRegion } from '../../src/overworld/town';
import World, { Depth, Generation } from '../../src/overworld/world';

/** FNV-1a over everything written into it, so one number stands for a region */
class Digest {
  private value = 0x811c9dc5;

  add(...parts: (number | string | null | undefined)[]): void {
    for (const part of parts) {
      const text = part == null ? '~' : String(part);

      for (let at = 0; at < text.length; at++) {
        this.value = Math.imul(this.value ^ text.charCodeAt(at), 16777619);
      }
      this.value = Math.imul(this.value ^ 0x2c, 16777619);
    }
  }

  get hex(): string {
    return (this.value >>> 0).toString(16).padStart(8, '0');
  }
}

/** A stretch by the origin and two far out, so both near and wrapped samples are pinned */
const ORIGINS: [number, number][] = [
  [-4, -4],
  [1500, -1700],
  [-2040, 2030],
];
const SPAN = 8;

/** A region's town, its lots and its roads */
function addTown(world: World, digest: Digest, regionX: number, regionY: number): void {
  const town = townOfRegion(world, regionX, regionY);

  digest.add('town', regionX, regionY, town?.x, town?.y, town?.biome, town?.seed);
  if (town == null) {
    return;
  }
  for (const lot of getTownLots(world, town)) {
    digest.add('lot', lot.x, lot.y, lot.landmark);
  }
  digest.add('roads', [...getTownRoads(world, town)].sort((a, b) => a - b).join(','));
}

/** Everything the ground decides over a stretch of one layer */
function fingerprint(world: World): string {
  const digest = new Digest();

  for (const [originX, originY] of ORIGINS) {
    for (let chunkY = originY; chunkY < originY + SPAN; chunkY++) {
      for (let chunkX = originX; chunkX < originX + SPAN; chunkX++) {
        const chunk = world.getChunk(chunkX, chunkY);

        digest.add('chunk', chunkX, chunkY, world.getChunkBiome(chunkX, chunkY));
        for (let cell = 0; cell < CHUNK_CELLS * CHUNK_CELLS; cell++) {
          const x = chunkX * CHUNK_CELLS + (cell % CHUNK_CELLS);
          const y = chunkY * CHUNK_CELLS + Math.floor(cell / CHUNK_CELLS);
          const climate = world.getCellClimate(x, y);

          digest.add(
            chunk.getCellRole(cell),
            chunk.getCellBiomes()[cell],
            levelAt(world, x, y),
            climate.humidity.toFixed(6),
            climate.temperature.toFixed(6),
            climate.elevation.toFixed(6),
          );
        }
        for (const [cell, landmark] of [...chunk.getLandmarkCells()].sort((a, b) => a[0] - b[0])) {
          digest.add('landmark', cell, landmark);
        }
        for (const [cell, decoration] of [...chunk.getDecorationCells()].sort(
          (a, b) => a[0] - b[0],
        )) {
          digest.add('decoration', cell, JSON.stringify(decoration));
        }

        const mouth = caveMouth(world, chunkX, chunkY);

        digest.add('mouth', mouth?.surface, mouth?.cave);
      }
    }
    for (
      let regionY = Math.floor(originY / 8) - 1;
      regionY <= Math.floor(originY / 8) + 1;
      regionY++
    ) {
      for (
        let regionX = Math.floor(originX / 8) - 1;
        regionX <= Math.floor(originX / 8) + 1;
        regionX++
      ) {
        addTown(world, digest, regionX, regionY);
      }
    }
  }

  const start = pickStartPosition(world, 'fingerprint-player');

  digest.add('start', JSON.stringify(start));
  return digest.hex;
}

describe('generation fingerprint', () => {
  it('keeps the first generation exactly as it was', () => {
    // The first generation is pinned so nothing drifts in it by
    // accident, the way the second one is
    registerGameData();

    const surface = new World('fingerprint-seed');

    expect(fingerprint(surface)).toBe('c75d9f55');
    expect(fingerprint(surface.at(Depth.Cave))).toBe('4351721d');
  });

  it('pins the second generation too, so a change to it is a decision', () => {
    registerGameData();

    const surface = new World('fingerprint-seed', Depth.Surface, Generation.Second);

    expect(fingerprint(surface)).toBe('dc10238f');
    expect(fingerprint(surface.at(Depth.Cave))).toBe('97acbe5f');
  });
});
