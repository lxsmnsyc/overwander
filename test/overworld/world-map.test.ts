import { describe, expect, it } from 'vitest';
import { townsInView } from '../../src/components/overworld/WorldMapCanvas';
import { CHUNK_CELLS } from '../../src/overworld/grid';
import { TOWN_RADIUS, TOWN_REGION, townOfRegion } from '../../src/overworld/town';
import getWorld from '../../src/overworld/current';

/** A view wide enough to cross several regions, in chunks */
const SPAN = 64;

describe('towns on the world map', () => {
  it('marks every town the view crosses', () => {
    const world = getWorld();
    const marks = townsInView(0, 0, SPAN);
    let expected = 0;

    for (let regionY = 0; regionY <= Math.floor(SPAN / TOWN_REGION); regionY++) {
      for (let regionX = 0; regionX <= Math.floor(SPAN / TOWN_REGION); regionX++) {
        if (townOfRegion(world, regionX, regionY) != null) {
          expected += 1;
        }
      }
    }
    expect(expected).toBeGreaterThan(0);
    expect(marks).toHaveLength(expected);
  });

  it('places a mark where its town stands, in chunks', () => {
    const world = getWorld();
    const marks = townsInView(0, 0, SPAN);

    for (const mark of marks) {
      const town = townOfRegion(
        world,
        Math.floor((mark.x * CHUNK_CELLS) / (TOWN_REGION * CHUNK_CELLS)),
        Math.floor((mark.y * CHUNK_CELLS) / (TOWN_REGION * CHUNK_CELLS)),
      );

      expect(town).not.toBeNull();
      expect(mark.x * CHUNK_CELLS).toBeCloseTo(town?.x ?? Number.NaN);
      expect(mark.y * CHUNK_CELLS).toBeCloseTo(town?.y ?? Number.NaN);
    }
  });

  it('draws a town at the size it really is', () => {
    const marks = townsInView(0, 0, SPAN);

    // Two chunks across, so a mark is a place on the map rather than
    // a square of it
    for (const mark of marks) {
      expect(mark.radius).toBeCloseTo(TOWN_RADIUS / CHUNK_CELLS);
    }
  });

  it('leaves out the towns the camera has panned away from', () => {
    const near = townsInView(0, 0, SPAN);
    const far = townsInView(400, 400, SPAN);

    expect(near.some((mark) => far.some((other) => other.x === mark.x && other.y === mark.y))).toBe(
      false,
    );
  });
});
