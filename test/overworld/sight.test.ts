import { describe, expect, it } from 'vitest';
import { Depth } from '../../src/overworld/depth';
import {
  JOIN_REACH,
  LEAVE_REACH,
  SECTOR_CELLS,
  SECTOR_SLACK,
  SIGHT_RANGE,
  type Sector,
  homeSector,
  inSight,
  reachToSector,
  sectorKey,
  sectorOf,
  sectorShift,
  sectorTopic,
  sectorsWithin,
} from '../../src/overworld/sight';

function keys(sectors: Sector[]): string[] {
  const found: string[] = [];

  for (const sector of sectors) {
    found.push(sectorKey(sector));
  }
  return found.sort();
}

describe('sectors', () => {
  it('are wider than sight, so at most three a side are ever in reach', () => {
    expect(SECTOR_CELLS).toBeGreaterThan(SIGHT_RANGE);
    expect(Math.floor((2 * JOIN_REACH) / SECTOR_CELLS) + 1).toBeLessThanOrEqual(3);
  });

  it('floor toward negative infinity, so the cells left of zero are not in sector zero', () => {
    expect(sectorOf(Depth.Surface, 0, 0)).toEqual({ depth: Depth.Surface, x: 0, y: 0 });
    expect(sectorOf(Depth.Surface, -1, -1)).toEqual({ depth: Depth.Surface, x: -1, y: -1 });
    expect(sectorOf(Depth.Cave, SECTOR_CELLS, -SECTOR_CELLS - 1)).toEqual({
      depth: Depth.Cave,
      x: 1,
      y: -2,
    });
  });

  it('name the generation and the layer in their topic', () => {
    expect(sectorTopic(1, { depth: Depth.Cave, x: -3, y: 4 })).toBe('sight:1:1:-3:4');
  });

  it('measure reach to their nearest edge', () => {
    const sector = { depth: Depth.Surface, x: 0, y: 0 };

    expect(reachToSector(sector, 5, 5)).toBe(0);
    expect(reachToSector(sector, -3, 5)).toBe(3);
    expect(reachToSector(sector, SECTOR_CELLS + 1, -7)).toBe(7);
  });

  it('are all found within a reach, and no more', () => {
    const found = sectorsWithin(Depth.Surface, 16, 16, 10);

    expect(keys(found)).toEqual(['0:0:0']);
    expect(sectorsWithin(Depth.Surface, 0, 0, 10)).toHaveLength(4);
  });
});

describe('moving between sectors', () => {
  it('joins what comes in reach and keeps what is still near', () => {
    const first = sectorShift([], Depth.Surface, 16, 16);

    expect(first.leave).toEqual([]);
    expect(keys(first.join)).toEqual(keys(sectorsWithin(Depth.Surface, 16, 16, JOIN_REACH)));

    // A step further east keeps every sector joined and adds nothing new
    const second = sectorShift(first.join, Depth.Surface, 17, 16);

    expect(second.join).toEqual([]);
    expect(second.leave).toEqual([]);
  });

  it('only lets a sector go past the slack', () => {
    const west = { depth: Depth.Surface, x: -1, y: 0 };
    // The sector ends at cell -1, so cell n is n + 1 away from it
    const near = LEAVE_REACH;

    // Just inside the leaving reach it is kept, one further it goes
    expect(sectorShift([west], Depth.Surface, near - 1, 16).leave).toEqual([]);
    expect(reachToSector(west, near, 16)).toBe(LEAVE_REACH + 1);
    expect(sectorShift([west], Depth.Surface, near, 16).leave).toEqual([west]);
  });

  it('leaves every sector on the other layer', () => {
    const above = sectorShift([], Depth.Surface, 16, 16).join;
    const below = sectorShift(above, Depth.Cave, 16, 16);

    expect(keys(below.leave)).toEqual(keys(above));
    for (const sector of below.join) {
      expect(sector.depth).toBe(Depth.Cave);
    }
  });
});

describe('the home sector', () => {
  it('is the sector underfoot when there is none yet', () => {
    expect(homeSector(null, Depth.Surface, 40, 3)).toEqual({ depth: Depth.Surface, x: 1, y: 0 });
  });

  it('holds until the player is the slack past its edge', () => {
    const home = { depth: Depth.Surface, x: 0, y: 0 };

    expect(homeSector(home, Depth.Surface, SECTOR_CELLS - 1 + SECTOR_SLACK, 5)).toBe(home);
    expect(homeSector(home, Depth.Surface, SECTOR_CELLS + SECTOR_SLACK, 5)).toEqual({
      depth: Depth.Surface,
      x: 1,
      y: 0,
    });
  });

  it('moves at once on a change of layer', () => {
    const home = { depth: Depth.Surface, x: 0, y: 0 };

    expect(homeSector(home, Depth.Cave, 5, 5)).toEqual({ depth: Depth.Cave, x: 0, y: 0 });
  });

  it('is always heard by anybody in sight of the player', () => {
    // However far the home trails, a listener in sight has joined it
    const home = { depth: Depth.Surface, x: 0, y: 0 };
    const walker = { x: SECTOR_CELLS - 1 + SECTOR_SLACK, y: 10 };
    const listener = { x: walker.x + SIGHT_RANGE, y: walker.y };

    expect(inSight(walker.x, walker.y, listener.x, listener.y)).toBe(true);
    expect(keys(sectorsWithin(Depth.Surface, listener.x, listener.y, JOIN_REACH))).toContain(
      sectorKey(homeSector(home, Depth.Surface, walker.x, walker.y)),
    );
  });
});
