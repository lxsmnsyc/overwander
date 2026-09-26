import { describe, expect, it } from 'vitest';
import Biome, { isOpenSea } from '../../src/data/ids/biome';
import { type CellLook, layersAt } from '../../src/canvas/terrain-cell';
import type { TerrainRole, TerrainTiles } from '../../src/canvas/terrain-tiles';

const NAMES: Partial<Record<Biome, string>> = {
  [Biome.Ocean]: 'ocean',
  [Biome.KelpForest]: 'kelp-forest',
  [Biome.PolarOcean]: 'polar-ocean',
  [Biome.Tundra]: 'tundra',
};

/** A pack with names and edges only, which is all the layering reads */
/* oxlint-disable typescript/no-unsafe-type-assertion */
const pack = {
  of: (biome: Biome, role: TerrainRole) => {
    const name = NAMES[biome];

    if (name == null || role === 'deep') {
      return null;
    }
    return {
      name: `${name}-${role}`,
      role,
      tone: [0, 0, 0],
      // An open sea's water has no edge of its own
      drawn: !(isOpenSea(biome) && role === 'water'),
    };
  },
} as unknown as TerrainTiles;
/* oxlint-enable typescript/no-unsafe-type-assertion */

/** Every sea blend laid over dry ground in a window of cells */
function seaBlendsOnLand(look: CellLook): string[] {
  const found: string[] = [];

  for (let y = -2; y <= 3; y++) {
    for (let x = -2; x <= 3; x++) {
      if (look.role(x, y) === 'water') {
        continue;
      }
      for (const lay of layersAt(pack, look, x, y)) {
        const sea = [Biome.Ocean, Biome.KelpForest, Biome.PolarOcean].some(
          (biome) => lay.terrain.name === `${NAMES[biome]}-blend`,
        );

        if (sea) {
          found.push(`${x},${y} ${lay.terrain.name}`);
        }
      }
    }
  }
  return found;
}

describe('laying ground beside the open sea', () => {
  it('lays no water ring on an island where two seas meet', () => {
    const island: CellLook = {
      biome: (x) => (x <= 0 ? Biome.KelpForest : Biome.Ocean),
      role: (x, y) => (x >= 0 && x <= 1 && y >= 0 && y <= 1 ? 'ground' : 'water'),
      paved: () => false,
    };

    expect(seaBlendsOnLand(island)).toEqual([]);
  });

  it('lays no water ring on a cave floor under the sea', () => {
    const floor = (biome: (x: number) => Biome): CellLook => ({
      biome,
      role: () => 'ground',
      paved: () => false,
    });

    expect(seaBlendsOnLand(floor((x) => (x <= 0 ? Biome.KelpForest : Biome.Ocean)))).toEqual([]);
    expect(seaBlendsOnLand(floor((x) => (x <= 0 ? Biome.PolarOcean : Biome.Tundra)))).toEqual([]);
  });

  it('still rings the dry ground of a coast in the sea beside it', () => {
    const coast: CellLook = {
      biome: (x) => (x <= 0 ? Biome.Tundra : Biome.PolarOcean),
      role: (x) => (x <= 0 ? 'ground' : 'water'),
      paved: () => false,
    };

    expect(layersAt(pack, coast, 0, 0).map((lay) => lay.terrain.name)).toContain(
      'polar-ocean-blend',
    );
  });
});
