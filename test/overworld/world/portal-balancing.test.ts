import { registerMoves } from '../../../src/data/moves';
import { describe, expect, it } from 'vitest';
import registerAbilities from '../../../src/data/abilities';
import registerBiomeSpawns, {
  BIOME_NAMES,
  getSpawnPool,
  getTownPool,
} from '../../../src/data/biome';
import type Biome from '../../../src/data/ids/biome';
import { TimeOfDay } from '../../../src/data/ids/biome';
import registerItems from '../../../src/data/items';
import { Species } from '../../../src/data/ids/species';
import { registerSpecies } from '../../../src/data/species';
import { townOverChunk } from '../../../src/overworld/town';
import ChunkSnapshot, {
  SNAPSHOT_INTERVAL,
  SPAWN_COUNT,
} from '../../../src/overworld/chunk-snapshot';
import Landmark from '../../../src/data/overworld/landmark';
import { LURE_SPAWN_BONUS } from '../../../src/overworld/abilities/__create';
import World from '../../../src/overworld/world';

// Spawn rolls read the species registry and the biome spawn pools;
// the berry patch reads the item registry to name what it grew, and
// the machines that registry generates read the move data
registerMoves();
registerSpecies();
registerItems();
registerAbilities();
registerBiomeSpawns();

describe('portal balancing', () => {
  it('never rolls a second of anything a chunk keeps one of', () => {
    const world = new World('overworld');
    const singletons = [
      Landmark.Portal,
      Landmark.GymLeader,
      Landmark.EliteFour,
      Landmark.Champion,
      Landmark.GymSeat,
      Landmark.AuctionBoard,
    ];

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 25; x++) {
        const landmarks = world.getChunk(x, y).getLandmarks();

        for (const singleton of singletons) {
          expect(landmarks.filter((kind) => kind === singleton).length).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('rolls a town street from the town pool', () => {
    const world = new World('overworld');
    const hours = [TimeOfDay.Morning, TimeOfDay.Day, TimeOfDay.Evening, TimeOfDay.Night];
    // A street holds something from the town pool at some hour, whichever
    // hour the window happens to land in
    const town = new Set(
      hours.flatMap((time) => {
        const pool = getTownPool(time);

        return [
          ...pool.base,
          ...pool.uncommon,
          ...pool.rare,
          ...(pool.scarce ?? []),
          ...(pool.elusive ?? []),
        ].map((entry) => entry.species);
      }),
    );
    let street = 0;

    for (let x = 0; x < 64 && street === 0; x++) {
      for (let y = 0; y < 64 && street === 0; y++) {
        if (townOverChunk(world, x, y) == null) {
          continue;
        }

        const chunk = world.getChunk(x, y);

        for (let window = 0; window < 16; window++) {
          const snapshot = new ChunkSnapshot(chunk, window * SNAPSHOT_INTERVAL);

          expect(snapshot.getSpawns(SPAWN_COUNT + LURE_SPAWN_BONUS).length).toBeLessThanOrEqual(
            SPAWN_COUNT + LURE_SPAWN_BONUS,
          );
          for (const [cell, spawn] of snapshot.getSpawnCells()) {
            if (chunk.isTownCell(cell)) {
              expect(town.has(spawn[0])).toBe(true);
              street++;
            }
          }
        }
      }
    }
    expect(street).toBeGreaterThan(0);
  });

  it('keeps porygon to the town streets', () => {
    for (const biome of Object.keys(BIOME_NAMES).map(Number) as Biome[]) {
      for (const time of [TimeOfDay.Morning, TimeOfDay.Day, TimeOfDay.Evening, TimeOfDay.Night]) {
        const pool = getSpawnPool(biome, time);

        for (const band of [pool.base, pool.uncommon, pool.rare, pool.special]) {
          expect(band.some((entry) => entry.species === Species.Porygon)).toBe(false);
        }
      }
    }
    // It stands on the streets instead, at every hour
    for (const time of [TimeOfDay.Morning, TimeOfDay.Day, TimeOfDay.Evening, TimeOfDay.Night]) {
      expect(getTownPool(time).base.some((entry) => entry.species === Species.Porygon)).toBe(true);
    }
  });
});
