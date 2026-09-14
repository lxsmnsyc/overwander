import { describe, expect, it } from 'vitest';
import shadeCell, { FACE, ROUTE } from '../../src/canvas/world-shade';
import { ORTHOGONAL } from '../../src/overworld/grid';
import { readGround } from '../../src/overworld/ground';
import { isRouteAt } from '../../src/overworld/route';
import { levelAt } from '../../src/overworld/terrace';
import { isTownAt } from '../../src/overworld/town';
import World from '../../src/overworld/world';

const world = new World('overworld');

/** The first cell of a wide square that answers, or null */
function findCell(test: (x: number, y: number) => boolean): [number, number] | null {
  for (let y = -256; y < 256; y++) {
    for (let x = -256; x < 256; x++) {
      if (test(x, y)) {
        return [x, y];
      }
    }
  }
  return null;
}

/** Whether nothing but the country itself decides a cell's colour */
function plain(x: number, y: number): boolean {
  return !isTownAt(world, x, y) && !isRouteAt(world, x, y);
}

describe('the world map shading', () => {
  it('draws a route in its own colour', () => {
    const cell = findCell((x, y) => isRouteAt(world, x, y) && !isTownAt(world, x, y));

    expect(cell).not.toBeNull();

    const [x, y] = cell ?? [0, 0];

    expect(shadeCell(world, x, y, { levels: false })).toEqual(ROUTE);
  });

  it('darkens the water against the ground of its own country', () => {
    const water = findCell((x, y) => readGround(world, x, y).role === 'water' && plain(x, y));

    expect(water).not.toBeNull();

    const [wx, wy] = water ?? [0, 0];
    const { biome } = readGround(world, wx, wy);
    const land = findCell((x, y) => {
      const ground = readGround(world, x, y);

      return ground.role === 'ground' && ground.biome === biome && plain(x, y);
    });

    expect(land).not.toBeNull();

    const [lx, ly] = land ?? [0, 0];
    const dry = shadeCell(world, lx, ly, { levels: false });

    expect(shadeCell(world, wx, wy, { levels: false })).toEqual(
      dry.map((one) => Math.round(one * 0.45)),
    );
  });

  it('draws the step up to higher ground dark, however far apart the map reads', () => {
    for (const reach of [1, 2]) {
      const cell = findCell((x, y) =>
        ORTHOGONAL.some(
          ([dx, dy]) => levelAt(world, x + dx * reach, y + dy * reach) > levelAt(world, x, y),
        ),
      );

      expect(cell).not.toBeNull();

      const [x, y] = cell ?? [0, 0];

      expect(shadeCell(world, x, y, { reach })).toEqual(FACE);
    }
  });
});
