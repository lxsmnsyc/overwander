import { describe, expect, it } from 'vitest';
import { Around, SURROUNDED, canonicalMask } from '../../src/data/overworld/autotile';
import type { TerrainRole } from '../../src/data/overworld/terrain';
import { joins } from '../../src/data/overworld/terrain';
import { CHUNK_CELLS } from '../../src/overworld/chunk';
import boardTerrain, { maskAround } from '../../src/overworld/terrain';

/** Open country, whichever cell is asked about */
const plain = boardTerrain((): TerrainRole => 'ground');

/** The same country with a two-cell pool in the middle of it */
const pool = boardTerrain((x, y): TerrainRole =>
  y === 8 && (x === 7 || x === 8) ? 'water' : 'ground',
);

describe('what a cell of the board is', () => {
  it('answers with whatever the world put there', () => {
    expect(plain.at(0, 0)).toBe('ground');
    expect(pool.at(8, 8)).toBe('water');
    expect(pool.at(6, 8)).toBe('ground');
  });

  it('answers past every edge, since the board is not where the world stops', () => {
    // The apron is the neighbouring chunks' own ground now, so it is
    // asked for the same way the chunk's own cells are
    expect(plain.at(-1, 3)).toBe('ground');
    expect(plain.at(CHUNK_CELLS, 3)).toBe('ground');
    expect(plain.at(-40, 60)).toBe('ground');
  });
});

describe('which tile a cell gets', () => {
  it('draws open ground with no edges at all', () => {
    expect(plain.maskAt(8, 8)).toBe(SURROUNDED);
  });

  it('keeps the ground whole across every edge', () => {
    expect(plain.maskAt(0, 3)).toBe(SURROUNDED);
    expect(plain.maskAt(CHUNK_CELLS - 1, 3)).toBe(SURROUNDED);
    expect(plain.maskAt(7, -1)).toBe(SURROUNDED);
    expect(plain.maskAt(-1, -1)).toBe(SURROUNDED);
  });

  it('shores a pool on the water’s own side', () => {
    // The water draws its shoreline; the ground reads to the shore
    expect(pool.maskAt(8, 8) & Around.East).toBe(0);
    expect(pool.maskAt(8, 8) & Around.West).toBe(Around.West);
    expect(pool.maskAt(6, 8) & Around.East).toBe(Around.East);
  });

  it('never asks for a neighbourhood the artist was not given', () => {
    for (let y = -1; y <= CHUNK_CELLS; y += 1) {
      for (let x = -1; x <= CHUNK_CELLS; x += 1) {
        expect(canonicalMask(pool.maskAt(x, y))).toBe(pool.maskAt(x, y));
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

describe('a street tiling itself', () => {
  /** A street running east from the middle, one cell wide */
  const road = (x: number, y: number): boolean => y === 8 && x >= 8 && x <= 11;

  it('joins the cells the street runs on and nothing else', () => {
    expect(maskAround(9, 8, road) & Around.East).toBe(Around.East);
    expect(maskAround(9, 8, road) & Around.West).toBe(Around.West);
    expect(maskAround(9, 8, road) & Around.North).toBe(0);
  });

  it('ends in a stub, since nothing carries on past the last cell', () => {
    expect(maskAround(11, 8, road) & Around.East).toBe(0);
    expect(maskAround(8, 8, road) & Around.West).toBe(0);
  });

  it('asks only for neighbourhoods the tiles were cut for', () => {
    for (let y = 6; y <= 10; y += 1) {
      for (let x = 6; x <= 13; x += 1) {
        expect(canonicalMask(maskAround(x, y, road))).toBe(maskAround(x, y, road));
      }
    }
  });

  it('reads a cell off the street as surrounded by nothing', () => {
    expect(maskAround(0, 0, road)).toBe(0);
  });
});
