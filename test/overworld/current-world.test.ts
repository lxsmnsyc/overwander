import { describe, expect, it } from 'vitest';
import getWorld, { getChunkOfSeed, getWorldOfChunk } from '../../src/overworld/current';
import { Depth } from '../../src/overworld/depth';

describe('a stored chunk', () => {
  it('is read back out of the world it was stored from', () => {
    const surface = getWorld(Depth.Surface).getChunk(-709, -815);
    const cave = getWorld(Depth.Cave).getChunk(-709, -815);

    // The same coordinates are two places, told apart by the seed
    expect(cave.seed).not.toBe(surface.seed);
    expect(getChunkOfSeed(-709, -815, cave.seed).seed).toBe(cave.seed);
    expect(getChunkOfSeed(-709, -815, surface.seed).seed).toBe(surface.seed);
    expect(getWorldOfChunk(-709, -815, cave.seed)).toBe(getWorld(Depth.Cave));
  });
});
