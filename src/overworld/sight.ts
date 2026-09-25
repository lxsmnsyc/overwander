import { VIEW_RADIUS } from './board';
import type { Depth } from './depth';

/**
 * Who can see whom on the overworld.
 *
 * The world is cut into square sectors, and each sector is one
 * realtime channel. A player speaks only on the sector they stand in
 * and listens to every sector within sight, so two players hear each
 * other exactly when they are near, and an empty stretch of the world
 * costs nothing however many people are online elsewhere.
 */

/**
 * How wide a sector is, in world cells. Two chunks, so a sector edge
 * is always a chunk edge. It is wider than `SIGHT_RANGE`, which keeps
 * the sectors in sight to at most three a side
 */
export const SECTOR_CELLS = 32;

/** How far another player can be and still be drawn, in cells */
export const SIGHT_RANGE = VIEW_RADIUS;

/**
 * How far past its sector a player walks before the sector is let
 * go. Pacing along an edge would otherwise leave and rejoin a channel
 * every step, and a join is far slower than a step
 */
export const SECTOR_SLACK = 4;

/**
 * How near a sector has to come before it is joined. A player's home
 * sector can trail them by the slack, so a listener reaches that much
 * further to still hear everybody in sight
 */
export const JOIN_REACH = SIGHT_RANGE + SECTOR_SLACK;

/** And how far it has to fall away before it is left again */
export const LEAVE_REACH = JOIN_REACH + SECTOR_SLACK;

export interface Sector {
  depth: Depth;
  x: number;
  y: number;
}

export function sectorOf(depth: Depth, x: number, y: number): Sector {
  return { depth, x: Math.floor(x / SECTOR_CELLS), y: Math.floor(y / SECTOR_CELLS) };
}

/** A sector as a string, for sets and maps */
export function sectorKey(sector: Sector): string {
  return `${sector.depth}:${sector.x}:${sector.y}`;
}

/**
 * The realtime topic a sector is heard on. The generation is part of
 * it: two builds reading different worlds must not see each other
 * standing inside rock
 */
export function sectorTopic(generation: number, sector: Sector): string {
  return `sight:${generation}:${sectorKey(sector)}`;
}

/** How far a cell is from the nearest cell of a sector, counting a diagonal as one */
export function reachToSector(sector: Sector, x: number, y: number): number {
  const left = sector.x * SECTOR_CELLS;
  const top = sector.y * SECTOR_CELLS;
  const dx = Math.max(left - x, 0, x - (left + SECTOR_CELLS - 1));
  const dy = Math.max(top - y, 0, y - (top + SECTOR_CELLS - 1));

  return Math.max(dx, dy);
}

/** Every sector that comes within `reach` of a cell */
export function sectorsWithin(depth: Depth, x: number, y: number, reach: number): Sector[] {
  const found: Sector[] = [];
  const top = Math.floor((y - reach) / SECTOR_CELLS);
  const bottom = Math.floor((y + reach) / SECTOR_CELLS);
  const left = Math.floor((x - reach) / SECTOR_CELLS);
  const right = Math.floor((x + reach) / SECTOR_CELLS);

  for (let sy = top; sy <= bottom; sy += 1) {
    for (let sx = left; sx <= right; sx += 1) {
      found.push({ depth, x: sx, y: sy });
    }
  }
  return found;
}

/**
 * Which sectors to join and which to leave for a player standing at a
 * cell, given the ones already joined. Another layer is always left:
 * the caves are the same coordinates, and nobody underground is in
 * sight of the surface
 */
export function sectorShift(
  joined: Iterable<Sector>,
  depth: Depth,
  x: number,
  y: number,
): { join: Sector[]; leave: Sector[] } {
  const kept = new Set<string>();
  const leave: Sector[] = [];

  for (const sector of joined) {
    if (sector.depth !== depth || reachToSector(sector, x, y) > LEAVE_REACH) {
      leave.push(sector);
    } else {
      kept.add(sectorKey(sector));
    }
  }

  const join: Sector[] = [];

  for (const sector of sectorsWithin(depth, x, y, JOIN_REACH)) {
    if (!kept.has(sectorKey(sector))) {
      join.push(sector);
    }
  }
  return { join, leave };
}

/**
 * The sector a player speaks on. It stays the one they had until they
 * are the slack past its edge, so walking along a border does not move
 * them between two channels every step
 */
export function homeSector(current: Sector | null, depth: Depth, x: number, y: number): Sector {
  if (current?.depth === depth && reachToSector(current, x, y) <= SECTOR_SLACK) {
    return current;
  }
  return sectorOf(depth, x, y);
}

/** Whether two cells are near enough for one to see the other */
export function inSight(ax: number, ay: number, bx: number, by: number): boolean {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by)) <= SIGHT_RANGE;
}
