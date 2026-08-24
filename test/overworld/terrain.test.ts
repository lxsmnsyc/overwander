import { describe, expect, it } from 'vitest';
import { Around, SURROUNDED, canonicalMask } from '../../src/data/overworld/autotile';
import { joins } from '../../src/data/overworld/terrain';
import { CHUNK_CELLS } from '../../src/overworld/chunk';
import boardTerrain from '../../src/overworld/terrain';

describe('what a cell of the board is', () => {
  it('walks on ground everywhere inside the chunk', () => {
    const land = boardTerrain({ water: false });

    expect(land.at(0, 0)).toBe('ground');
    expect(land.at(8, 8)).toBe('ground');
    expect(land.at(CHUNK_CELLS - 1, CHUNK_CELLS - 1)).toBe('ground');
  });

  it('walks on water where the biome is water', () => {
    expect(boardTerrain({ water: true }).at(8, 8)).toBe('water');
  });

  it('walls the rim, edges and corners alike', () => {
    const land = boardTerrain({ water: false });

    expect(land.at(-1, 8)).toBe('wall');
    expect(land.at(CHUNK_CELLS, 8)).toBe('wall');
    expect(land.at(8, -1)).toBe('wall');
    expect(land.at(8, CHUNK_CELLS)).toBe('wall');
    expect(land.at(-1, -1)).toBe('wall');
    expect(land.at(CHUNK_CELLS, CHUNK_CELLS)).toBe('wall');
  });

  it('keeps walling everything past the apron', () => {
    const land = boardTerrain({ water: false });

    expect(land.at(-40, 60)).toBe('wall');
    expect(land.at(200, 8)).toBe('wall');
  });

  it('walls the rim of a water chunk the same way', () => {
    const land = boardTerrain({ water: true });

    expect(land.at(-1, 8)).toBe('wall');
    expect(land.at(0, 8)).toBe('water');
  });
});

describe('which tile a cell gets', () => {
  it('draws open ground with no edges at all', () => {
    expect(boardTerrain({ water: false }).maskAt(8, 8)).toBe(SURROUNDED);
  });

  it('cuts the ground away toward the rim', () => {
    const land = boardTerrain({ water: false });

    // A wall does not continue the ground, so the cell against the
    // rim loses the face that touches it
    expect(land.maskAt(0, 8) & Around.West).toBe(0);
    expect(land.maskAt(0, 8) & Around.East).toBe(Around.East);
    expect(land.maskAt(CHUNK_CELLS - 1, 8) & Around.East).toBe(0);
  });

  it('faces the frame inward and nowhere else', () => {
    const land = boardTerrain({ water: false });

    // The apron's outside is more wall for as far as anybody asks, so
    // its only edge is the one toward the chunk
    expect(land.maskAt(-1, 8) & Around.East).toBe(0);
    expect(land.maskAt(-1, 8) & Around.West).toBe(Around.West);
    expect(land.maskAt(-1, 8) & Around.North).toBe(Around.North);
  });

  it('never asks for a neighbourhood the artist was not given', () => {
    const land = boardTerrain({ water: false });

    for (let y = -1; y <= CHUNK_CELLS; y += 1) {
      for (let x = -1; x <= CHUNK_CELLS; x += 1) {
        expect(canonicalMask(land.maskAt(x, y))).toBe(land.maskAt(x, y));
      }
    }
  });
});

describe('water beside ground', () => {
  it('reads as ground to the shore, so no ledge is drawn along a coast', () => {
    expect(joins('ground', 'water')).toBe(true);
  });

  it('still gives the water its own shoreline', () => {
    expect(joins('water', 'ground')).toBe(false);
  });

  it('keeps a wall a wall against either of them', () => {
    expect(joins('wall', 'ground')).toBe(false);
    expect(joins('ground', 'wall')).toBe(false);
  });
});
