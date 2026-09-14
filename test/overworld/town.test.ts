import { describe, expect, it } from 'vitest';
import World from '../../src/overworld/world';
import { Depth } from '../../src/overworld/depth';
import { CHUNK_CELLS, chunkOfCell } from '../../src/overworld/chunk';
import { ORTHOGONAL } from '../../src/overworld/grid';
import {
  TOWN_LANDMARKS,
  TOWN_RADIUS,
  TOWN_REGION,
  type Town,
  getTownLots,
  getTownRoads,
  isRoadAt,
  isTownAt,
  portalCellIn,
  portalSpot,
  townAt,
  townOfRegion,
} from '../../src/overworld/town';
import Landmark from '../../src/data/overworld/landmark';
import { isOpenSea } from '../../src/data/ids/biome';
import { readGround } from '../../src/overworld/ground';

/**
 * The towns, which are the one thing in the world that is laid out
 * rather than rolled.
 */

const SPAN = TOWN_REGION * CHUNK_CELLS;

/** How wide a town's own square of cells is, for anything walking one */
const FOOTPRINT = TOWN_RADIUS * 2 + 1;

/** The first region that settled, for anything asked of a town rather than of the siting */
function findTown(world: World): Town {
  for (let regionY = -6; regionY < 6; regionY++) {
    for (let regionX = -6; regionX < 6; regionX++) {
      const town = townOfRegion(world, regionX, regionY);

      if (town != null) {
        return town;
      }
    }
  }
  throw new Error('no town in range');
}

describe('siting a town', () => {
  const world = new World('overworld');

  it('puts at most one in a region, and keeps its footprint inside it', () => {
    for (let regionY = -6; regionY < 6; regionY++) {
      for (let regionX = -6; regionX < 6; regionX++) {
        const town = townOfRegion(world, regionX, regionY);

        if (town == null) {
          continue;
        }
        // A footprint that crossed a boundary would mean a cell had to
        // ask two regions which town it was in
        expect(town.x - TOWN_RADIUS).toBeGreaterThanOrEqual(regionX * SPAN);
        expect(town.x + TOWN_RADIUS).toBeLessThan((regionX + 1) * SPAN);
        expect(town.y - TOWN_RADIUS).toBeGreaterThanOrEqual(regionY * SPAN);
        expect(town.y + TOWN_RADIUS).toBeLessThan((regionY + 1) * SPAN);
      }
    }
  });

  it('settles most of the land and none of the open sea', () => {
    let sited = 0;
    let looked = 0;

    for (let regionY = -6; regionY < 6; regionY++) {
      for (let regionX = -6; regionX < 6; regionX++) {
        const town = townOfRegion(world, regionX, regionY);

        looked++;
        if (town == null) {
          continue;
        }
        sited++;
        expect(isOpenSea(world.getCellBiome(town.x, town.y))).toBe(false);
      }
    }
    // Much of the world is ocean, so a good half of the regions have
    // nowhere to build; what is left should mostly have a town
    expect(sited).toBeGreaterThan(looked / 3);
    expect(sited).toBeLessThan(looked);
  });

  it('answers the same for the same cell however it is asked', () => {
    const town = townOfRegion(world, 1, 1);

    expect(town).not.toBeNull();
    if (town == null) {
      return;
    }
    expect(townAt(world, town.x, town.y)).toEqual(town);
    expect(isTownAt(world, town.x, town.y)).toBe(true);
    // And nothing a radius and a bit away is in it
    expect(isTownAt(world, town.x + TOWN_RADIUS + 2, town.y)).toBe(false);
  });

  it('is not underneath itself, so a cave beneath one is not the town', () => {
    const town = townOfRegion(world, 1, 1);
    const below = new World(world.seed, Depth.Cave);

    expect(town).not.toBeNull();
    if (town == null) {
      return;
    }
    // Nobody has built anything underground, so walking beneath a
    // plaza is walking through rock: what reads the layer is what
    // keeps a cave crossing from announcing the town over it
    expect(townAt(below, town.x, town.y)).toBeNull();
    expect(isTownAt(below, town.x, town.y)).toBe(false);
  });
});

describe('what a town holds', () => {
  const world = new World('overworld');

  it('lays its lots out of the town pool, each with room around it', () => {
    let towns = 0;

    for (let regionY = -6; regionY < 6; regionY++) {
      for (let regionX = -6; regionX < 6; regionX++) {
        const town = townOfRegion(world, regionX, regionY);

        if (town == null) {
          continue;
        }
        towns++;

        const lots = getTownLots(world, town);
        const taken = new Set(lots.map((lot) => `${lot.x},${lot.y}`));

        expect(lots.length).toBeGreaterThan(0);
        for (const lot of lots) {
          expect(TOWN_LANDMARKS).toContain(lot.landmark);
          // Inside the footprint, and out of the plaza in the middle
          expect(Math.hypot(lot.x - town.x, lot.y - town.y)).toBeLessThanOrEqual(TOWN_RADIUS);
          // Nothing touches anything, diagonals included
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx !== 0 || dy !== 0) {
                expect(taken.has(`${lot.x + dx},${lot.y + dy}`)).toBe(false);
              }
            }
          }
        }
      }
    }
    expect(towns).toBeGreaterThan(0);
  });

  it('gives every town a portal and only some of them a gym', () => {
    const held = new Map<Landmark, number>();
    let towns = 0;

    for (let regionY = -8; regionY < 8; regionY++) {
      for (let regionX = -8; regionX < 8; regionX++) {
        const town = townOfRegion(world, regionX, regionY);

        if (town == null) {
          continue;
        }
        towns++;
        for (const kind of new Set(getTownLots(world, town).map((lot) => lot.landmark))) {
          held.set(kind, (held.get(kind) ?? 0) + 1);
        }
      }
    }

    // The portal stands on the plaza rather than on a lot, so no town
    // ever spends one of its lots on the thing every town has
    expect(held.get(Landmark.Portal) ?? 0).toBe(0);
    // And the lots are what makes one town worth walking to over
    // another: a place that has everything is a place nobody leaves
    for (const kind of [Landmark.GymLeader, Landmark.AuctionBoard, Landmark.GymSeat]) {
      expect(held.get(kind) ?? 0).toBeGreaterThan(0);
      expect(held.get(kind) ?? 0).toBeLessThan(towns);
    }
  });

  it('levels the ground it stands on, and stops at the shore', () => {
    let levelled = 0;

    for (let regionY = -4; regionY < 4; regionY++) {
      for (let regionX = -4; regionX < 4; regionX++) {
        const town = townOfRegion(world, regionX, regionY);

        if (town == null) {
          continue;
        }
        for (let step = -TOWN_RADIUS; step <= TOWN_RADIUS; step++) {
          const { biome, role } = readGround(world, town.x + step, town.y);

          if (!isTownAt(world, town.x + step, town.y)) {
            continue;
          }
          // Nothing to swim and nothing to climb, unless it is the sea,
          // which a town does not drain
          if (isOpenSea(biome)) {
            continue;
          }
          expect(role).toBe('ground');
          levelled++;
        }
      }
    }
    expect(levelled).toBeGreaterThan(0);
  });
});

describe('the portal network', () => {
  const world = new World('overworld');

  it('stands one portal in every region, wherever the region allows', () => {
    for (let regionY = -5; regionY < 5; regionY++) {
      for (let regionX = -5; regionX < 5; regionX++) {
        let found = 0;

        for (let y = 0; y < TOWN_REGION; y++) {
          for (let x = 0; x < TOWN_REGION; x++) {
            if (portalCellIn(world, regionX * TOWN_REGION + x, regionY * TOWN_REGION + y) != null) {
              found++;
            }
          }
        }
        // Even where no town could be built: the network is what makes
        // a far country reachable, so it does not depend on settlement
        expect(found).toBe(1);
      }
    }
  });

  it("puts a region's portal in its town when it has one", () => {
    let checked = 0;

    for (let regionY = -5; regionY < 5; regionY++) {
      for (let regionX = -5; regionX < 5; regionX++) {
        const town = townOfRegion(world, regionX, regionY);

        if (town == null) {
          continue;
        }

        // Dead centre, which is where every street of the town begins
        expect(portalSpot(world, regionX, regionY)).toEqual([town.x, town.y]);

        const chunk = world.getChunk(chunkOfCell(town.x), chunkOfCell(town.y));

        expect(chunk.getLandmarkCells().get(portalCellIn(world, chunk.x, chunk.y) ?? -1)).toBe(
          Landmark.Portal,
        );
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe("a town's streets", () => {
  it('paves the plaza and reaches every lot without paving it', () => {
    const world = new World('overworld');
    const town = findTown(world);
    const roads = getTownRoads(world, town);

    // The middle is paved, since it is where every street begins
    expect(isRoadAt(world, town.x, town.y)).toBe(true);

    // A street reaches every door without paving it: whoever stands
    // at a lot stands at their own place, not in the road
    for (const lot of getTownLots(world, town)) {
      expect(isRoadAt(world, lot.x, lot.y)).toBe(false);
      expect(ORTHOGONAL.some(([offX, offY]) => isRoadAt(world, lot.x + offX, lot.y + offY))).toBe(
        true,
      );
    }
    expect(roads.size).toBeGreaterThan(getTownLots(world, town).length);
  });

  it('walks back to the plaza from anywhere on it, in every town', () => {
    const world = new World('overworld');

    // The one thing a lot standing in a street would break: a street
    // that stops at somebody's back wall reads as a road blocked off,
    // whether or not a walk could step round it
    for (let regionY = -3; regionY < 3; regionY++) {
      for (let regionX = -3; regionX < 3; regionX++) {
        const town = townOfRegion(world, regionX, regionY);

        if (town == null) {
          continue;
        }

        const reached = new Set<number>();
        const edge: [number, number][] = [[town.x, town.y]];

        while (edge.length > 0) {
          const step = edge.pop();

          if (step == null) {
            break;
          }

          const [x, y] = step;
          const cell = (y - town.y) * FOOTPRINT + (x - town.x);

          if (reached.has(cell) || !isRoadAt(world, x, y)) {
            continue;
          }
          reached.add(cell);
          for (const [offX, offY] of ORTHOGONAL) {
            edge.push([x + offX, y + offY]);
          }
        }
        expect(reached.size).toBe(getTownRoads(world, town).size);
      }
    }
  });

  it('never runs a street diagonally', () => {
    const world = new World('overworld');
    const town = findTown(world);

    // A cell of road reached only across a diagonal is a corner no
    // walk could turn: every paved cell touches another squarely
    for (let dy = -TOWN_RADIUS; dy <= TOWN_RADIUS; dy++) {
      for (let dx = -TOWN_RADIUS; dx <= TOWN_RADIUS; dx++) {
        const x = town.x + dx;
        const y = town.y + dy;

        if (!isRoadAt(world, x, y)) {
          continue;
        }
        expect(ORTHOGONAL.some(([offX, offY]) => isRoadAt(world, x + offX, y + offY))).toBe(true);
      }
    }
  });

  it('keeps its streets inside the town', () => {
    const world = new World('overworld');
    const town = findTown(world);

    for (let dy = -TOWN_RADIUS * 2; dy <= TOWN_RADIUS * 2; dy++) {
      for (let dx = -TOWN_RADIUS * 2; dx <= TOWN_RADIUS * 2; dx++) {
        if (isRoadAt(world, town.x + dx, town.y + dy)) {
          expect(Math.hypot(dx, dy)).toBeLessThanOrEqual(TOWN_RADIUS);
        }
      }
    }
  });

  it('leaves the open country unpaved', () => {
    const world = new World('overworld');
    const town = findTown(world);

    // A long way out of any town, so nothing here is a street
    expect(isRoadAt(world, town.x + TOWN_RADIUS * 3, town.y)).toBe(false);
  });

  it('is a wash over the ground rather than a kind of it', () => {
    const world = new World('overworld');
    const town = findTown(world);

    // A road decides nothing about walking: the cell under it reads
    // as the levelled ground a town always is
    for (const lot of getTownLots(world, town)) {
      expect(readGround(world, lot.x, lot.y).role).toBe('ground');
    }
  });
});
