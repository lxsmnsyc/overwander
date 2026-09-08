import { describe, expect, it } from 'vitest';
import World from '../../src/overworld/world';
import { CHUNK_CELLS, chunkOfCell } from '../../src/overworld/chunk';
import {
  TOWN_LANDMARKS,
  TOWN_RADIUS,
  TOWN_REGION,
  getTownLots,
  isTownAt,
  portalCellIn,
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

    // The portal is what makes the network even, so it is not rolled
    expect(held.get(Landmark.Portal)).toBe(towns);
    // And the rest are what makes one town worth walking to over
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

        const [lot] = getTownLots(world, town);

        expect(lot.landmark).toBe(Landmark.Portal);

        const chunk = world.getChunk(chunkOfCell(lot.x), chunkOfCell(lot.y));

        expect(chunk.getLandmarkCells().get(portalCellIn(world, chunk.x, chunk.y) ?? -1)).toBe(
          Landmark.Portal,
        );
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});
