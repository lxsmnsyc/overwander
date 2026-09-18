import { beforeAll, describe, expect, it } from 'vitest';
import { MAX_LEVEL } from '../../src/data/constants/levels';
import { Slots, getSlots } from '../../src/data/constants/slots';
import { MAX_IV, STAT_ORDER, getIV } from '../../src/data/constants/stats';
import { registerMoves } from '../../src/data/moves';
import type { Species } from '../../src/data/ids/species';
import Weather, { WEATHER_MIN_IV, isWeatherFavored } from '../../src/data/overworld/weather';
import {
  getBaseSpecies,
  getEggMoves,
  getLevelUpMoves,
  getRegisteredSpecies,
  getSpeciesAbilityPools,
  getSpeciesData,
  isFeaturedSpecies,
  registerSpecies,
} from '../../src/data/species';
import ChunkSnapshot from '../../src/overworld/chunk-snapshot';
import deriveNestEgg, {
  NEST_ABILITY_SLOTS,
  NEST_EGG_MOVES,
  NEST_ITEM_SLOTS,
  NEST_PERFECT_IVS,
  getChainEggMoves,
} from '../../src/overworld/nest-egg';
import World from '../../src/overworld/world';

beforeAll(() => {
  registerMoves();
  registerSpecies();
});

const world = new World('overworld');

/**
 * A species with at least this many egg moves and a hidden ability, for
 * the rolls that need them. Never the family featured at the start of
 * time, whose day already widens the hidden band
 */
function speciesWith(eggMoves: number): Species {
  for (const species of getRegisteredSpecies()) {
    if (
      !isFeaturedSpecies(species, 0) &&
      getBaseSpecies(species) === species &&
      getEggMoves(species).length >= eggMoves &&
      getSpeciesAbilityPools(species).hidden.length > 0
    ) {
      return species;
    }
  }
  throw new Error('No species has that many egg moves');
}

describe('a nest egg', () => {
  it('keeps what the sky handed it where the nest was claimed under a mirage', () => {
    // A nest is claimed under the sky rather than hatched out of
    // nowhere, so the mirage reaches it
    const mirage = new ChunkSnapshot(world.getChunk(-26, -40), 86_400_000);
    const species = speciesWith(2);

    expect(mirage.weather).toBe(Weather.FataMorgana);

    const counts = new Set<number>();

    for (let player = 0; player < 200; player += 1) {
      const egg = deriveNestEgg(mirage, 5, species, `player-${player}`, MAX_LEVEL);
      const abilities = egg.abilities ?? [egg.ability];

      counts.add(abilities.length);
      // Whatever it hatched with, it has the room for
      expect(abilities.length).toBeLessThanOrEqual(getSlots(egg.slots, Slots.Ability));
      expect(abilities[0]).toBe(egg.ability);
      expect(new Set(abilities).size).toBe(abilities.length);
    }
    // Most keep the one they rolled, and some a second off the hidden
    // pool
    expect(counts.has(1)).toBe(true);
    expect(counts.has(2)).toBe(true);
  });

  it('hatches with room to spare where the nest was claimed under a fogbow', () => {
    // A chunk and window the fogbow stands over, and the same nest
    // under a plain sky for comparison
    const fogbow = new ChunkSnapshot(world.getChunk(-3, -16), 7_200_000);
    const species = speciesWith(2);

    expect(fogbow.weather).toBe(Weather.Fogbow);

    const rooms = new Set<number>();
    let widest = 0;

    for (let player = 0; player < 200; player += 1) {
      const egg = deriveNestEgg(fogbow, 5, species, `player-${player}`, MAX_LEVEL);

      rooms.add(getSlots(egg.slots, Slots.Move));
      widest = Math.max(widest, egg.moves.length);
      // Whatever it hatched with, it has the room for
      expect(egg.moves.length).toBeLessThanOrEqual(getSlots(egg.slots, Slots.Move));
    }
    // Some of them gain a slot, some gain two, and most gain neither
    expect(rooms).toEqual(new Set([4, 5, 6]));
    expect(widest).toBe(6);
  });

  it('hatches with at least two perfect stats', () => {
    const snapshot = new ChunkSnapshot(world.getChunk(0, 0), 0);
    const species = speciesWith(2);

    for (let player = 0; player < 50; player += 1) {
      const egg = deriveNestEgg(snapshot, 5, species, `player-${player}`, 1);
      let perfect = 0;

      for (const stat of STAT_ORDER) {
        if (getIV(egg.ivs, stat) === MAX_IV) {
          perfect += 1;
        }
      }
      expect(perfect).toBeGreaterThanOrEqual(NEST_PERFECT_IVS);
    }
  });

  it('has a hidden ability about one time in five', () => {
    const snapshot = new ChunkSnapshot(world.getChunk(0, 0), 0);
    const species = speciesWith(1);
    const hidden = new Set(getSpeciesAbilityPools(species).hidden);
    let found = 0;
    const tries = 4000;

    for (let player = 0; player < tries; player += 1) {
      if (hidden.has(deriveNestEgg(snapshot, 5, species, `player-${player}`, 1).ability)) {
        found += 1;
      }
    }
    expect(found / tries).toBeGreaterThan(0.16);
    expect(found / tries).toBeLessThan(0.24);
  });

  it('knows two different egg moves, a chain-bred one first where the line has any', () => {
    const snapshot = new ChunkSnapshot(world.getChunk(0, 0), 0);
    const species = speciesWith(NEST_EGG_MOVES);
    const eggMoves = new Set(getEggMoves(species));
    const chained = new Set(getChainEggMoves(species));

    for (let player = 0; player < 50; player += 1) {
      const { moves } = deriveNestEgg(snapshot, 5, species, `player-${player}`, 1);

      expect(eggMoves.has(moves[0])).toBe(true);
      expect(eggMoves.has(moves[1])).toBe(true);
      expect(moves[0]).not.toBe(moves[1]);
      if (chained.size > 0) {
        expect(chained.has(moves[0])).toBe(true);
      }
    }
  });

  it('hatches with room for a second ability and a second held item', () => {
    const snapshot = new ChunkSnapshot(world.getChunk(0, 0), 0);
    const egg = deriveNestEgg(snapshot, 5, speciesWith(1), 'player', 1);

    expect(getSlots(egg.slots, Slots.Ability)).toBe(NEST_ABILITY_SLOTS);
    expect(getSlots(egg.slots, Slots.Item)).toBe(NEST_ITEM_SLOTS);
  });

  it('is the same egg every time it is derived', () => {
    const snapshot = new ChunkSnapshot(world.getChunk(0, 0), 0);
    const species = speciesWith(1);

    expect(deriveNestEgg(snapshot, 5, species, 'player', 1)).toEqual(
      deriveNestEgg(snapshot, 5, species, 'player', 1),
    );
  });

  it('takes the floor of the weather it was taken under', () => {
    // Walked through the windows until a sky favours some species that has egg moves
    for (let hour = 0; hour < 24 * 14; hour += 1) {
      const snapshot = new ChunkSnapshot(world.getChunk(0, 0), hour * 3_600_000);

      for (const species of getRegisteredSpecies()) {
        if (
          getBaseSpecies(species) !== species ||
          !isWeatherFavored(snapshot.weather, getSpeciesData(species).types)
        ) {
          continue;
        }
        const egg = deriveNestEgg(snapshot, 5, species, 'player', 1);

        for (const stat of STAT_ORDER) {
          expect(getIV(egg.ivs, stat)).toBeGreaterThanOrEqual(WEATHER_MIN_IV);
        }
        return;
      }
    }
    throw new Error('No sky in two weeks favoured anything');
  });
});

describe('chain-bred egg moves', () => {
  it('are egg moves no other line in the egg groups learns by levelling', () => {
    const species = speciesWith(2);
    const line = getBaseSpecies(species);
    const groups = new Set(getSpeciesData(species).eggGroups);
    const eggMoves = new Set(getEggMoves(species));

    for (const move of getChainEggMoves(species)) {
      expect(eggMoves.has(move)).toBe(true);
      for (const other of getRegisteredSpecies()) {
        let shares = false;

        for (const group of getSpeciesData(other).eggGroups) {
          shares ||= groups.has(group);
        }
        if (shares && getBaseSpecies(other) !== line) {
          expect(getLevelUpMoves(other, MAX_LEVEL)).not.toContain(move);
        }
      }
    }
  });
});
