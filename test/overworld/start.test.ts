import { describe, expect, it } from 'vitest';
import { CHUNK_CELLS } from '../../src/overworld/chunk';
import { isFreeCell, nearestFreeCell } from '../../src/overworld/start';
import World from '../../src/overworld/world';

const world = new World('start-test');

/** A chunk near the origin with a piece of scenery in it, and that piece's cell */
function sceneryCell(): { chunkX: number; chunkY: number; cellX: number; cellY: number } {
  for (let chunkX = 0; chunkX < 32; chunkX++) {
    const { value: cell, done } = world.getChunk(chunkX, 0).getDecorationCells().keys().next();

    if (done !== true) {
      return {
        chunkX,
        chunkY: 0,
        cellX: cell % CHUNK_CELLS,
        cellY: Math.floor(cell / CHUNK_CELLS),
      };
    }
  }
  throw new Error('No scenery near the origin');
}

describe('nearestFreeCell', () => {
  it('moves a position off scenery onto the closest open cell', () => {
    const at = sceneryCell();
    const open = nearestFreeCell(world, at.chunkX, at.chunkY, at.cellX, at.cellY);

    expect(isFreeCell(world, at.chunkX, at.chunkY, at.cellX, at.cellY)).toBe(false);
    expect(isFreeCell(world, at.chunkX, at.chunkY, open.cellX, open.cellY)).toBe(true);
    // Scenery keeps a clear ring, so an open neighbour is always one step away
    expect(Math.abs(open.cellX - at.cellX) + Math.abs(open.cellY - at.cellY)).toBe(1);
  });

  it('leaves an open position where it is', () => {
    const at = sceneryCell();
    const open = nearestFreeCell(world, at.chunkX, at.chunkY, at.cellX, at.cellY);

    expect(nearestFreeCell(world, at.chunkX, at.chunkY, open.cellX, open.cellY)).toEqual(open);
  });
});
