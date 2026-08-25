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

  it('runs the ground on outward past every edge', () => {
    const land = boardTerrain({ water: false });

    expect(land.at(-1, 3)).toBe('ground');
    expect(land.at(CHUNK_CELLS, 3)).toBe('ground');
    expect(land.at(3, -1)).toBe('ground');
    expect(land.at(3, CHUNK_CELLS)).toBe('ground');
    expect(land.at(-1, -1)).toBe('ground');
    expect(land.at(CHUNK_CELLS, CHUNK_CELLS)).toBe('ground');
    // ...as far as anybody asks
    expect(land.at(-40, 60)).toBe('ground');
    expect(land.at(200, 3)).toBe('ground');
  });

  it('floods the chunk’s spots on land', () => {
    const spots = new Set([8 * CHUNK_CELLS + 8, 8 * CHUNK_CELLS + 7]);
    const land = boardTerrain({ water: false, spots });

    expect(land.at(8, 8)).toBe('water');
    expect(land.at(7, 8)).toBe('water');
    expect(land.at(6, 8)).toBe('ground');
  });

  it('raises the chunk’s spots as ground at sea', () => {
    const spots = new Set([8 * CHUNK_CELLS + 8, 8 * CHUNK_CELLS + 7]);
    const sea = boardTerrain({ water: true, spots });

    expect(sea.at(8, 8)).toBe('ground');
    expect(sea.at(7, 8)).toBe('ground');
    expect(sea.at(6, 8)).toBe('water');
  });

  it('stands a spot as rock where the caller says so', () => {
    const spots = new Set([8 * CHUNK_CELLS + 8]);
    const sea = boardTerrain({ water: true, spots, spotRole: 'wall' });

    expect(sea.at(8, 8)).toBe('wall');
    expect(sea.at(7, 8)).toBe('water');
  });

  it('mixes the shallows in as ground, swum like the rest', () => {
    const shallows = new Set([8 * CHUNK_CELLS + 8, 8 * CHUNK_CELLS + 9]);
    const sea = boardTerrain({ water: true, shallows });

    expect(sea.at(8, 8)).toBe('ground');
    expect(sea.at(9, 8)).toBe('ground');
    expect(sea.at(7, 8)).toBe('water');
    // The deep draws its own edge against the shelf
    expect(sea.maskAt(7, 8) & Around.East).toBe(0);
  });

  it('runs a water chunk outward as water', () => {
    const sea = boardTerrain({ water: true });

    expect(sea.at(-1, 3)).toBe('water');
    expect(sea.at(-1, 7)).toBe('water');
    expect(sea.at(0, 8)).toBe('water');
  });
});

describe('which tile a cell gets', () => {
  it('draws open ground with no edges at all', () => {
    expect(boardTerrain({ water: false }).maskAt(8, 8)).toBe(SURROUNDED);
  });

  it('keeps the ground whole across every edge', () => {
    const land = boardTerrain({ water: false });

    // The edge cells and the apron beyond them are all one ground
    expect(land.maskAt(0, 3)).toBe(SURROUNDED);
    expect(land.maskAt(CHUNK_CELLS - 1, 3)).toBe(SURROUNDED);
    expect(land.maskAt(7, 0)).toBe(SURROUNDED);
    expect(land.maskAt(7, -1)).toBe(SURROUNDED);
    expect(land.maskAt(-1, -1)).toBe(SURROUNDED);
  });

  it('shores a water spot on the water’s own side', () => {
    const spots = new Set([8 * CHUNK_CELLS + 8, 8 * CHUNK_CELLS + 7]);
    const land = boardTerrain({ water: false, spots });

    // The water draws its shoreline; the ground reads to the shore
    expect(land.maskAt(8, 8) & Around.East).toBe(0);
    expect(land.maskAt(8, 8) & Around.West).toBe(Around.West);
    expect(land.maskAt(6, 8) & Around.East).toBe(Around.East);
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
