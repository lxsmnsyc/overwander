import { describe, expect, it } from 'vitest';
import { CHUNK_CELLS } from '../../src/overworld/chunk';
import { nearestFreeCell } from '../../src/overworld/start';
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

    const decorations = world.getChunk(at.chunkX, at.chunkY).getDecorationCells();

    expect(open).not.toEqual({ cellX: at.cellX, cellY: at.cellY });
    expect(decorations.has(open.cellY * CHUNK_CELLS + open.cellX)).toBe(false);
    expect(nearestFreeCell(world, at.chunkX, at.chunkY, open.cellX, open.cellY)).toEqual(open);
  });

  it('leaves an open position where it is', () => {
    const at = sceneryCell();
    const open = nearestFreeCell(world, at.chunkX, at.chunkY, at.cellX, at.cellY);

    expect(nearestFreeCell(world, at.chunkX, at.chunkY, open.cellX, open.cellY)).toEqual(open);
  });
});
