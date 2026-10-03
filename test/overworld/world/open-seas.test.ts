import { registerMoves } from '../../../src/data/moves';
import { describe, expect, it } from 'vitest';
import registerAbilities from '../../../src/data/abilities';
import registerBiomeSpawns from '../../../src/data/biome';
import { isOpenSea, isWaterBiome } from '../../../src/data/ids/biome';
import registerItems from '../../../src/data/items';
import { registerSpecies } from '../../../src/data/species';
import { Types } from '../../../src/data/constants/types';
import ChunkSnapshot from '../../../src/overworld/chunk-snapshot';
import { TRAINER_TYPES, isAceTrainer } from '../../../src/data/overworld/trainers';
import Landmark from '../../../src/data/overworld/landmark';
import { roleAt } from '../../../src/overworld/ground';
import World, { Generation } from '../../../src/overworld/world';
import { Depth } from '../../../src/overworld/depth';
import findChunk from './helpers';

// Spawn rolls read the species registry and the biome spawn pools;
// the berry patch reads the item registry to name what it grew, and
// the machines that registry generates read the move data
registerMoves();
registerSpecies();
registerItems();
registerAbilities();
registerBiomeSpawns();

describe('the open seas', () => {
  it('scatters islands, never a cell wide at the narrowest', () => {
    const world = new World('overworld');
    const dry = (x: number, y: number): boolean => roleAt(world, x, y) !== 'water';
    let sea = 0;
    let land = 0;

    for (let y = -120; y <= 120; y += 1) {
      for (let x = -120; x <= 120; x += 1) {
        if (!isOpenSea(world.getCellBiome(x, y))) {
          continue;
        }
        sea += 1;
        if (!dry(x, y)) {
          continue;
        }
        land += 1;
        // Built of 4x4 blocks, and where two islands, or an island and
        // the coast, stand too close for the water between, the ground
        // that joins them is widened rather than left a bridge
        const across = dry(x - 1, y) || dry(x + 1, y);
        const along = dry(x, y - 1) || dry(x, y + 1);

        expect(across && along, `${x},${y}`).toBe(true);
      }
    }
    // Somewhere to stand out there, and the sea is still the sea
    expect(sea).toBeGreaterThan(0);
    expect(land).toBeGreaterThan(0);
    expect(land / sea).toBeLessThan(0.1);
  });

  it('widens the ground between two islands a cell apart', () => {
    // Two islands a row apart overlapping by one column, which dried into a bridge a cell across
    const world = new World('lxsmnsyc', Depth.Surface, Generation.Second);
    const dry = (x: number, y: number): boolean => roleAt(world, x, y) !== 'water';

    expect(dry(-8311, -9227)).toBe(true);
    expect(dry(-8312, -9227) || dry(-8310, -9227)).toBe(true);
  });

  it('rolls no berry patch and no wandering npc afloat', () => {
    const world = new World('overworld');
    let seen = 0;

    for (let x = -100; x < 100 && seen < 12; x += 2) {
      for (let y = -100; y < 100 && seen < 12; y += 25) {
        const chunk = world.getChunk(x, y);

        if (!isOpenSea(chunk.biome)) {
          continue;
        }
        seen += 1;
        for (const landmark of chunk.getLandmarks()) {
          expect(landmark).not.toBe(Landmark.BerryPatch);
          expect(landmark).not.toBe(Landmark.WanderingNpc);
          // Nobody keeps a stall, a seat or a notice board out at sea
          expect(landmark).not.toBe(Landmark.Market);
          expect(landmark).not.toBe(Landmark.GymSeat);
          expect(landmark).not.toBe(Landmark.AuctionBoard);
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('puts a duel afloat, and only somebody who could be out there', () => {
    const world = new World('overworld');
    let duels = 0;
    let seen = 0;

    for (let x = -100; x < 100 && seen < 24; x += 2) {
      for (let y = -100; y < 100 && seen < 24; y += 25) {
        const chunk = world.getChunk(x, y);

        if (!isOpenSea(chunk.biome)) {
          continue;
        }
        seen += 1;

        const snapshot = new ChunkSnapshot(chunk, 0);

        for (const [cell, landmark] of chunk.getLandmarkCells()) {
          // A border runs through a chunk, so a sea chunk may hold a
          // cell of the coast beside it. Only what is actually at sea
          // is held to the sea's rule
          if (landmark !== Landmark.Trainer || !isOpenSea(snapshot.biomeAt(cell))) {
            continue;
          }
          duels += 1;

          const trainer = snapshot.getTrainerClass(cell);

          expect(trainer).not.toBeNull();
          if (trainer == null) {
            continue;
          }
          // A swimmer swims and a sailor has a boat. Nobody who needs
          // ground under them is met out here, the Aces included
          expect(new Set(TRAINER_TYPES[trainer]).has(Types.Water)).toBe(true);
          expect(isAceTrainer(trainer)).toBe(false);
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
    // The seas are not empty of them: the landmark rolls out here now
    expect(duels).toBeGreaterThan(0);
  });

  it('mixes shallows into the sea, and keeps them out of a field', () => {
    const world = new World('overworld');
    // A sea chunk with a shoal under it: the stone field runs where it
    // runs, so plenty of open water has none at all
    const chunk = findChunk(
      world,
      (candidate) => isOpenSea(candidate.biome) && candidate.getShallowCells().size > 0,
    );

    expect(chunk).not.toBeNull();
    if (chunk == null) {
      return;
    }

    const shallows = chunk.getShallowCells();

    // Nothing above ground is walled off, and the answer is the same
    // every time the chunk is resolved
    expect(chunk.getRockCells().size).toBe(0);
    expect(shallows.size).toBeGreaterThan(0);
    expect([...world.getChunk(chunk.x, chunk.y).getShallowCells()]).toEqual([...shallows]);

    // Shelf is the seas' and the wetlands' own look: a field with a
    // pond in it draws the pond with its own shoreline instead
    const land = findChunk(world, (candidate) => !isWaterBiome(candidate.biome));

    if (land != null) {
      expect(land.getShallowCells().size).toBe(0);
    }
  });
});
