import { describe, expect, it } from 'vitest';
import { asPositionRecord } from '../src/auth/position-record';
import { CHUNK_CELLS } from '../src/overworld/chunk';
import { WORLD_MAX, WORLD_MIN } from '../src/overworld/world';

describe('a stored position', () => {
  it('reads back what was written', () => {
    expect(
      asPositionRecord({
        player: 'walker',
        chunkX: -12,
        chunkY: 40,
        cellX: 3,
        cellY: 9,
        movedAt: 7,
      }),
    ).toEqual({ player: 'walker', chunkX: -12, chunkY: 40, cellX: 3, cellY: 9, movedAt: 7 });
  });

  it('puts nobody outside the world', () => {
    // The position is the player's own word for where they are, so
    // the one thing it is held to is being somewhere that exists
    const far = asPositionRecord({
      chunkX: WORLD_MAX + 1000,
      chunkY: WORLD_MIN - 1000,
      cellX: CHUNK_CELLS + 4,
      cellY: -3,
    });

    expect(far.chunkX).toBe(WORLD_MAX);
    expect(far.chunkY).toBe(WORLD_MIN);
    expect(far.cellX).toBe(CHUNK_CELLS - 1);
    expect(far.cellY).toBe(0);
  });

  it('reads a missing or malformed record as the origin', () => {
    const empty = asPositionRecord(null);

    expect(empty).toEqual({ player: '', chunkX: 0, chunkY: 0, cellX: 0, cellY: 0, movedAt: 0 });
    expect(asPositionRecord({ chunkX: '40', cellX: 2.7 })).toMatchObject({ chunkX: 0, cellX: 2 });
  });
});
