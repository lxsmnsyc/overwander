import { describe, expect, it } from 'vitest';
import World from '../../src/overworld/world';
import { Depth } from '../../src/overworld/depth';
import { isOpenSea } from '../../src/data/ids/biome';
import { TOWN_RADIUS, isTownAt, townOfRegion } from '../../src/overworld/town';
import { ROUTE_WIDTH, isRouteAt, routesNear } from '../../src/overworld/route';
import registerGameData from '../../src/data';

registerGameData();

/** The regions a sweep covers, which is enough country to hold towns */
const SPAN = 4;

describe('the roads between towns', () => {
  const world = new World('overworld');

  it('joins a town to its neighbours, and lays each pair once', () => {
    let laid = 0;

    for (let ry = -SPAN; ry < SPAN; ry++) {
      for (let rx = -SPAN; rx < SPAN; rx++) {
        const town = townOfRegion(world, rx, ry);

        if (town == null) {
          continue;
        }
        for (const route of routesNear(world, town.x, town.y)) {
          laid++;
          // Both ends are real towns, and never the same one
          expect(route.from).not.toEqual(route.to);
          expect(townOfRegion(world, route.from.regionX, route.from.regionY)).toEqual(route.from);
          expect(townOfRegion(world, route.to.regionX, route.to.regionY)).toEqual(route.to);
        }
      }
    }
    expect(laid).toBeGreaterThan(0);
  });

  it('runs from one plaza to the other without a gap in the paving', () => {
    const town = townOfRegion(world, 1, 1);

    expect(town).not.toBeNull();
    if (town == null) {
      return;
    }

    const routes = routesNear(world, town.x, town.y);

    expect(routes.length).toBeGreaterThan(0);
    for (const route of routes) {
      // Every cell the line passes through is paved, which is what a
      // road has to be to be walked along
      for (const [x, y] of route.line) {
        const cell = { x: Math.round(x), y: Math.round(y) };
        const inTown =
          Math.hypot(cell.x - route.from.x, cell.y - route.from.y) <= TOWN_RADIUS ||
          Math.hypot(cell.x - route.to.x, cell.y - route.to.y) <= TOWN_RADIUS;

        expect(inTown || isRouteAt(world, cell.x, cell.y)).toBe(true);
      }
    }
  });

  it('keeps off the open sea, whatever it has to bridge', () => {
    for (let y = -256; y < 256; y += 3) {
      for (let x = -256; x < 256; x += 3) {
        if (isRouteAt(world, x, y)) {
          expect(isOpenSea(world.getCellBiome(x, y))).toBe(false);
        }
      }
    }
  });

  it('leaves the ground inside a town to the town', () => {
    const town = townOfRegion(world, 1, 1);

    expect(town).not.toBeNull();
    if (town == null) {
      return;
    }
    for (let at = 0; at < TOWN_RADIUS; at++) {
      expect(isRouteAt(world, town.x + at, town.y)).toBe(false);
      expect(isTownAt(world, town.x + at, town.y)).toBe(true);
    }
  });

  it('is not underground, where nobody has laid anything', () => {
    const below = world.at(Depth.Cave);

    for (let ry = -1; ry < 2; ry++) {
      for (let rx = -1; rx < 2; rx++) {
        const town = townOfRegion(world, rx, ry);

        if (town != null) {
          expect(isRouteAt(below, town.x, town.y)).toBe(false);
          expect(routesNear(below, town.x, town.y)).toEqual([]);
        }
      }
    }
  });

  it('is wide enough to walk and narrow enough to be a road', () => {
    expect(ROUTE_WIDTH).toBeGreaterThan(0.5);
    expect(ROUTE_WIDTH).toBeLessThan(4);
  });
});
