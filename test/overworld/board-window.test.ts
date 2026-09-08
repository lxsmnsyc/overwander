import { describe, expect, it } from 'vitest';
import { CHUNK_CELLS, cellInChunk, chunkOfCell, worldCell } from '../../src/overworld/chunk';
import { boardChunks, viewChunks } from '../../src/components/overworld/overworld-tab/board-view';
import { BOARD_CENTER, BOARD_RADIUS } from '../../src/components/overworld/overworld-tab/metrics';

/**
 * The board is a window on world cells rather than a chunk, so what
 * has to hold is that the window and the chunk grid agree about which
 * chunk any given cell belongs to, however the two are laid over each
 * other.
 */

describe('a world cell and the chunk it belongs to', () => {
  it('splits and rejoins, on both sides of the origin', () => {
    for (const cell of [-33, -17, -16, -15, -1, 0, 1, 15, 16, 17, 4095, 65_535]) {
      expect(worldCell(chunkOfCell(cell), cellInChunk(cell))).toBe(cell);
      expect(cellInChunk(cell)).toBeGreaterThanOrEqual(0);
      expect(cellInChunk(cell)).toBeLessThan(CHUNK_CELLS);
    }
  });

  it('puts the cell before the origin in the chunk before it', () => {
    // The trap a plain remainder falls into: -1 is the last cell of
    // chunk -1, not the first cell of chunk 0
    expect(chunkOfCell(-1)).toBe(-1);
    expect(cellInChunk(-1)).toBe(CHUNK_CELLS - 1);
  });
});

describe('the chunks a board asks for windows on', () => {
  /** The square of cells the player can reach into */
  const REACH = Math.ceil(BOARD_RADIUS);
  const FROM = BOARD_CENTER - REACH;
  const SPAN = REACH * 2 + 1;

  /** How many chunks a run of that many cells can straddle */
  const ABREAST = Math.ceil((SPAN - 1) / CHUNK_CELLS) + 1;

  it('covers every cell the player can reach, and no more country than that', () => {
    for (let y = -20; y < 20; y++) {
      for (let x = -20; x < 20; x++) {
        const covered = boardChunks(x, y);

        expect(covered.length).toBeGreaterThanOrEqual(1);
        expect(covered.length).toBeLessThanOrEqual(ABREAST * ABREAST);
        for (const [cornerX, cornerY] of [
          [x + FROM, y + FROM],
          [x + FROM + SPAN - 1, y + FROM],
          [x + FROM, y + FROM + SPAN - 1],
          [x + FROM + SPAN - 1, y + FROM + SPAN - 1],
        ]) {
          expect(covered).toContainEqual([chunkOfCell(cornerX), chunkOfCell(cornerY)]);
        }
      }
    }
  });

  it('asks for fewer windows than the board draws country out of', () => {
    // The country past the reach is the chunk seeds' own answer: no
    // window is needed to draw a hillside somebody is not standing on
    for (const [x, y] of [
      [0, 0],
      [7, 3],
      [CHUNK_CELLS - 1, CHUNK_CELLS - 1],
    ]) {
      expect(boardChunks(x, y).length).toBeLessThan(viewChunks(x, y).length);
    }
  });
});
