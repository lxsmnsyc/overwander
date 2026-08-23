import { describe, expect, it } from 'vitest';
import { Around, SURROUNDED, canonicalMask } from '../../src/data/overworld/autotile';
import Landmark, { LANDMARKS } from '../../src/data/overworld/landmark';
import { joins } from '../../src/data/overworld/terrain';
import { CHUNK_CELLS } from '../../src/overworld/chunk';
import boardTerrain from '../../src/overworld/terrain';

const NOTHING = new Map<number, Landmark>();

/** The landmarks the board draws flat rather than as a block. */
const LYING = new Set<Landmark>([Landmark.Phenomenon, Landmark.Nest]);

function at(x: number, y: number): number {
  return y * CHUNK_CELLS + x;
}

describe('what a cell of the board is', () => {
  it('walks on ground everywhere the chunk is clear', () => {
    const land = boardTerrain({ landmarks: NOTHING, water: false });

    expect(land.at(0, 0)).toBe('ground');
    expect(land.at(8, 8)).toBe('ground');
    expect(land.at(CHUNK_CELLS - 1, CHUNK_CELLS - 1)).toBe('ground');
  });

  it('walks on water where the biome is water', () => {
    expect(boardTerrain({ landmarks: NOTHING, water: true }).at(8, 8)).toBe('water');
  });

  it('leaves the apron the same ground the chunk is', () => {
    const land = boardTerrain({ landmarks: NOTHING, water: false });

    // A threshold is a step into the chunk next door, not the end of
    // the world, so nothing about it is a wall
    expect(land.at(-1, 8)).toBe('ground');
    expect(land.at(CHUNK_CELLS, 8)).toBe('ground');
    expect(land.at(-1, -1)).toBe('ground');
    expect(land.at(-40, 60)).toBe('ground');
  });

  it('leaves what lies on the ground on the ordinary ground', () => {
    // Rippling water, a dust cloud, a hollow with an egg in it: none
    // of them has a body to build a block of rock for, and the mark
    // drawn on top is what says something is there
    for (const landmark of LYING) {
      const land = boardTerrain({ landmarks: new Map([[at(4, 5), landmark]]), water: false });

      expect(land.at(4, 5)).toBe('ground');
      expect(land.maskAt(4, 5)).toBe(SURROUNDED);
      expect(land.maskAt(5, 5)).toBe(SURROUNDED);
    }
  });

  it('walls every landmark that stands', () => {
    for (const landmark of LANDMARKS) {
      const land = boardTerrain({ landmarks: new Map([[at(4, 5), landmark]]), water: false });

      expect(land.at(4, 5)).toBe(LYING.has(landmark) ? 'ground' : 'wall');
    }
  });

  it('walls the cell a landmark stands on and the ring around it', () => {
    const land = boardTerrain({
      landmarks: new Map([[at(4, 5), Landmark.LegendaryLair]]),
      water: false,
    });

    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        expect(land.at(4 + dx, 5 + dy)).toBe('wall');
      }
    }
    // ...and stops there, which is exactly the space a chunk keeps
    // clear around every landmark it places
    expect(land.at(6, 5)).toBe('ground');
    expect(land.at(4, 7)).toBe('ground');
  });

  it('lets an outcrop against the rim reach into the apron', () => {
    const land = boardTerrain({
      landmarks: new Map([[at(0, 5), Landmark.LegendaryLair]]),
      water: false,
    });

    // A slice of rock cut off by the chunk boundary would read as a
    // wall somebody built along the edge
    expect(land.at(-1, 5)).toBe('wall');
    expect(land.at(-1, 4)).toBe('wall');
    expect(land.at(-1, 7)).toBe('ground');
  });
});

describe('which tile a cell gets', () => {
  it('draws open ground with no edges at all', () => {
    expect(boardTerrain({ landmarks: NOTHING, water: false }).maskAt(8, 8)).toBe(SURROUNDED);
  });

  it('draws the rim as open ground, edges and corners alike', () => {
    const land = boardTerrain({ landmarks: NOTHING, water: false });

    expect(land.maskAt(0, 8)).toBe(SURROUNDED);
    expect(land.maskAt(-1, 8)).toBe(SURROUNDED);
    expect(land.maskAt(-1, -1)).toBe(SURROUNDED);
  });

  it('draws an outcrop as solid in the middle and edged at the rim', () => {
    const land = boardTerrain({
      landmarks: new Map([[at(4, 5), Landmark.LegendaryLair]]),
      water: false,
    });

    // The cell the landmark stands on is boxed in on all sides, which
    // is what makes it rock rather than the pebble a lone cell drew
    expect(land.maskAt(4, 5)).toBe(SURROUNDED);
    // Its west face has nothing beyond it
    expect(land.maskAt(3, 5) & Around.West).toBe(0);
    expect(land.maskAt(3, 5) & Around.East).toBe(Around.East);
    // And the ground beside the outcrop is cut away toward it
    expect(land.maskAt(6, 5) & Around.West).toBe(0);
  });

  it('merges two outcrops whose rings meet into one piece of rock', () => {
    const land = boardTerrain({
      landmarks: new Map([
        [at(4, 5), Landmark.LegendaryLair],
        [at(6, 5), Landmark.Portal],
      ]),
      water: false,
    });

    // Two cells apart is the closest a chunk ever places them, and at
    // that distance the rings share a column
    expect(land.at(5, 5)).toBe('wall');
    expect(land.maskAt(5, 5)).toBe(SURROUNDED);
  });

  it('walls a landmark on the rim the same as one in the middle', () => {
    const land = boardTerrain({
      landmarks: new Map([[at(0, 0), Landmark.LegendaryLair]]),
      water: false,
    });

    expect(land.maskAt(0, 0)).toBe(SURROUNDED);
    expect(land.at(-1, -1)).toBe('wall');
  });

  it('leaves nothing but ground where every landmark lies flat', () => {
    const land = boardTerrain({
      landmarks: new Map([
        [at(4, 5), Landmark.Phenomenon],
        [at(9, 2), Landmark.Nest],
      ]),
      water: false,
    });

    for (let y = -1; y <= CHUNK_CELLS; y += 1) {
      for (let x = -1; x <= CHUNK_CELLS; x += 1) {
        expect(land.at(x, y)).toBe('ground');
        expect(land.maskAt(x, y)).toBe(SURROUNDED);
      }
    }
  });

  it('never asks for a neighbourhood the artist was not given', () => {
    const land = boardTerrain({
      landmarks: new Map([
        [at(4, 5), Landmark.LegendaryLair],
        [at(9, 2), Landmark.Portal],
      ]),
      water: false,
    });

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
