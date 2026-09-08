/**
 * How the world is squared off.
 *
 * The numbers a chunk is measured in, kept apart from the chunk
 * itself: what a chunk *holds* is derived from the ground and the
 * towns, and both of those have to be able to say where a cell is
 * without waiting on the chunk that would ask them.
 */

/**
 * A chunk is a 16x16 grid of cells; scenery, landmarks and snapshot
 * spawns each occupy one cell, never sharing
 */
export const CHUNK_CELLS = 16;

export const CELL_COUNT = CHUNK_CELLS * CHUNK_CELLS;

/**
 * Where one of a chunk's cells sits in the world's own cell grid.
 * The fields the ground is read from know nothing about chunks, so
 * everything that asks them speaks in these
 */
export function worldCell(chunk: number, cell: number): number {
  return chunk * CHUNK_CELLS + cell;
}

/**
 * Which chunk a world cell falls in, and where in that chunk it sits.
 * The board is a window on world cells now, so anything it wants from
 * a chunk has to be asked for in the chunk's own numbering
 */
export function chunkOfCell(cell: number): number {
  return Math.floor(cell / CHUNK_CELLS);
}

export function cellInChunk(cell: number): number {
  return ((cell % CHUNK_CELLS) + CHUNK_CELLS) % CHUNK_CELLS;
}
