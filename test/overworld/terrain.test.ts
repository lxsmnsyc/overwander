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

  it('walls the rim away from the gates, corners included', () => {
    const land = boardTerrain({ water: false });

    expect(land.at(-1, 3)).toBe('wall');
    expect(land.at(CHUNK_CELLS, 3)).toBe('wall');
    expect(land.at(3, -1)).toBe('wall');
    expect(land.at(3, CHUNK_CELLS)).toBe('wall');
    expect(land.at(-1, -1)).toBe('wall');
    expect(land.at(CHUNK_CELLS, CHUNK_CELLS)).toBe('wall');
  });

  it('opens a four-cell gate in the middle of each side', () => {
    const land = boardTerrain({ water: false });

    for (const along of [6, 7, 8, 9]) {
      expect(land.at(-1, along)).toBe('ground');
      expect(land.at(CHUNK_CELLS, along)).toBe('ground');
      expect(land.at(along, -1)).toBe('ground');
      expect(land.at(along, CHUNK_CELLS)).toBe('ground');
    }
    // ...and only there
    expect(land.at(-1, 5)).toBe('wall');
    expect(land.at(-1, 10)).toBe('wall');
    expect(land.at(5, -1)).toBe('wall');
    expect(land.at(10, CHUNK_CELLS)).toBe('wall');
  });

  it('runs a gate outward as far as anybody asks', () => {
    const land = boardTerrain({ water: false });

    expect(land.at(-5, 7)).toBe('ground');
    expect(land.at(7, 200)).toBe('ground');
    // Off the gate's line it is wall all the way out
    expect(land.at(-40, 60)).toBe('wall');
    expect(land.at(200, 3)).toBe('wall');
  });

  it('gates a water chunk with water', () => {
    const land = boardTerrain({ water: true });

    expect(land.at(-1, 3)).toBe('wall');
    expect(land.at(-1, 7)).toBe('water');
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
    expect(land.maskAt(0, 3) & Around.West).toBe(0);
    expect(land.maskAt(0, 3) & Around.East).toBe(Around.East);
    expect(land.maskAt(CHUNK_CELLS - 1, 3) & Around.East).toBe(0);
  });

  it('keeps the ground whole through a gate', () => {
    const land = boardTerrain({ water: false });

    // The edge cell in front of a gate carries straight on out
    expect(land.maskAt(7, 0) & Around.North).toBe(Around.North);
    // The gate's own strip runs onward and sideways along itself,
    // and stops at the wall either side
    expect(land.maskAt(7, -1) & Around.South).toBe(Around.South);
    expect(land.maskAt(7, -1) & Around.East).toBe(Around.East);
    expect(land.maskAt(6, -1) & Around.West).toBe(0);
  });

  it('faces the frame inward and nowhere else', () => {
    const land = boardTerrain({ water: false });

    // The apron's outside is more wall for as far as anybody asks, so
    // its only edge is the one toward the chunk
    expect(land.maskAt(-1, 3) & Around.East).toBe(0);
    expect(land.maskAt(-1, 3) & Around.West).toBe(Around.West);
    expect(land.maskAt(-1, 3) & Around.North).toBe(Around.North);
  });

  it('ends the wall against a gate', () => {
    const land = boardTerrain({ water: false });

    // The wall beside the opening does not continue into it
    expect(land.maskAt(5, -1) & Around.East).toBe(0);
    expect(land.maskAt(10, -1) & Around.West).toBe(0);
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
