import { beforeAll, describe, expect, it } from 'vitest';
import Biome from '../src/data/ids/biome';
import Weather, {
  BATTLE_WEATHER,
  BIOME_WEATHER,
  WEATHER_DESCRIPTIONS,
  WEATHER_MIN_IV,
  WEATHER_NAMES,
  WEATHER_TYPES,
  WEATHER_TYPE_MIN_IV,
  classifyWeather,
  isBoostingWeather,
  toBattleWeather,
} from '../src/data/overworld/weather';
import World from '../src/overworld/world';
import ChunkSnapshot from '../src/overworld/chunk-snapshot';
import deriveEncounter, { EncounterType, RAID_FAMILY_DAY_MIN_IV } from '../src/overworld/encounter';
import { Species } from '../src/data/ids/species';
import { TYPE_NAMES, Types } from '../src/data/constants/types';
import { MAX_IV, STAT_ORDER, getIV } from '../src/data/constants/stats';
import registerGameData from '../src/data';
import { BattleModes } from '../src/battle/core';
import { Weathers } from '../src/data/ids/status';
import { createTrainerBattle } from '../src/overworld/rocket';
import { getSpeciesData } from '../src/data/species';

/**
 * The sky is derived rather than stored, so what is worth testing is
 * that the derivation is the same for everybody, coherent across
 * neighbouring chunks, and actually moves.
 */

const SEED = 'overworld';

/** Every sky, as the enum rather than as the keys of a record */
// oxlint-disable-next-line typescript/no-unnecessary-type-assertion
const EVERY_SKY = Object.keys(WEATHER_NAMES).map((key) => Number(key) as Weather);

/** A field of chunks, so the shape of the weather can be measured */
function sweep(world: World, window: number, reach: number): Weather[][] {
  const rows: Weather[][] = [];

  for (let y = -reach; y <= reach; y++) {
    const row: Weather[] = [];

    for (let x = -reach; x <= reach; x++) {
      row.push(world.getWeather(x, y, window));
    }
    rows.push(row);
  }
  return rows;
}

describe('classifying a sky', () => {
  it('reads a front through its bands as it arrives', () => {
    const bands = BIOME_WEATHER[Biome.Grassland];

    // Dry and calm is the ordinary sky; the front is damp before it is
    // wet and wet before it is a storm
    expect(classifyWeather(Biome.Grassland, -0.5, -0.5)).toBe(bands.clear);
    expect(classifyWeather(Biome.Grassland, 0.25, -0.5)).toBe(bands.damp);
    expect(classifyWeather(Biome.Grassland, 0.55, -0.5)).toBe(bands.wet);
    expect(classifyWeather(Biome.Grassland, 0.55, 0.5)).toBe(bands.storm);
    expect(classifyWeather(Biome.Grassland, -0.5, 0.5)).toBe(bands.stirred);
  });

  it('gives the same reading a different sky over different ground', () => {
    // One front crossing a border is one weather system meeting two
    // countries, which is the whole reason the biome reads the numbers
    expect(classifyWeather(Biome.TropicalRainforest, 0.55, 0.5)).toBe(Weather.Thunderstorm);
    expect(classifyWeather(Biome.Glacier, 0.55, 0.5)).toBe(Weather.Blizzard);
    expect(classifyWeather(Biome.Desert, -0.5, 0.5)).toBe(Weather.Sandstorm);
  });

  it('keeps the showpieces in the corner of the field', () => {
    expect(classifyWeather(Biome.Glacier, 0.9, 0.9)).toBe(Weather.Aurora);
    // A reading short of the corner is only a storm
    expect(classifyWeather(Biome.Glacier, 0.55, 0.5)).toBe(Weather.Blizzard);
  });

  it('leaves Beyond with no sky at all', () => {
    for (const wetness of [-1, 0, 0.5, 1]) {
      expect(classifyWeather(Biome.Beyond, wetness, wetness)).toBe(Weather.Clear);
    }
  });

  it('names every sky it can show', () => {
    for (const bands of Object.values(BIOME_WEATHER)) {
      for (const sky of [bands.clear, bands.stirred, bands.damp, bands.wet, bands.storm]) {
        expect(WEATHER_NAMES[sky]).toBeTruthy();
      }
    }
  });

  it('boosts everything but the plain skies', () => {
    expect(isBoostingWeather(Weather.Clear)).toBe(false);
    expect(isBoostingWeather(Weather.Cloudy)).toBe(false);
    expect(isBoostingWeather(Weather.Rain)).toBe(true);
    expect(isBoostingWeather(Weather.Aurora)).toBe(true);
    expect(WEATHER_MIN_IV).toBe(5);
  });
});

describe('the weather field', () => {
  it('is the same for everybody, which is what makes it derivable', () => {
    const one = new World(SEED);
    const other = new World(SEED);

    expect(one.getWeather(12, -30, 400)).toBe(other.getWeather(12, -30, 400));
  });

  it('is a different sky under a different seed', () => {
    const skies = new Set<Weather>();

    for (const seed of ['overworld', 'other', 'third', 'fourth']) {
      skies.add(new World(seed).getWeather(0, 0, 0));
    }
    expect(skies.size).toBeGreaterThan(1);
  });

  it('holds a front together across neighbouring chunks', () => {
    const world = new World(SEED);
    const rows = sweep(world, 0, 6);
    let same = 0;
    let seen = 0;

    for (let y = 0; y < rows.length; y++) {
      for (let x = 1; x < rows[y].length; x++) {
        seen++;
        if (rows[y][x] === rows[y][x - 1]) {
          same++;
        }
      }
    }
    // A chunk is eight to a weather cell, so most neighbours share a
    // sky. Rolled per chunk instead of sampled this would be near zero,
    // which is the thing being ruled out
    expect(same / seen).toBeGreaterThan(0.6);
  });

  it('moves the field on, so standing still is not standing under one sky forever', () => {
    const world = new World(SEED);
    const skies = new Set<Weather>();

    for (let window = 0; window < 240; window++) {
      skies.add(world.getWeather(0, 0, window));
    }
    expect(skies.size).toBeGreaterThan(1);
  });

  it('leaves most windows plain, so a boosted one is worth walking into', () => {
    const world = new World(SEED);
    let boosting = 0;
    let seen = 0;

    for (let window = 0; window < 200; window++) {
      for (const row of sweep(world, window, 3)) {
        for (const sky of row) {
          seen++;
          if (isBoostingWeather(sky)) {
            boosting++;
          }
        }
      }
    }
    const share = boosting / seen;

    // Worth going out in, and not so often that going out is the whole
    // game. The band is wide because the ground decides too: a bog is
    // overcast far more often than a desert is
    expect(share).toBeGreaterThan(0.1);
    expect(share).toBeLessThan(0.6);
  });
});

describe('what weather is worth', () => {
  beforeAll(() => {
    registerGameData();
  });

  const world = new World(SEED);
  const snapshot = new ChunkSnapshot(world.getChunk(0, 0), 0);
  /**
   * A roll with nothing in it: every slice of the individual value is
   * zero, so untouched it is the worst pokemon the game can produce.
   * Anything above zero after this is the floor and nothing else
   */
  const hopeless = [Species.Rattata, 0, 0] as const;

  const valuesOf = (weather: Weather | undefined): number[] => {
    const met = deriveEncounter(snapshot, [...hopeless], 'trainer-red', {
      type: EncounterType.Wild,
      weather,
    });
    return STAT_ORDER.map((stat) => getIV(met.ivs, stat));
  };

  it('leaves a pokemon met under a plain sky exactly as it rolled', () => {
    expect(valuesOf(undefined)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(valuesOf(Weather.Clear)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(valuesOf(Weather.Cloudy)).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('puts a floor under every value of one met under weather', () => {
    for (const sky of [Weather.Rain, Weather.Snow, Weather.Fog, Weather.Aurora]) {
      expect(valuesOf(sky)).toEqual([
        WEATHER_MIN_IV,
        WEATHER_MIN_IV,
        WEATHER_MIN_IV,
        WEATHER_MIN_IV,
        WEATHER_MIN_IV,
        WEATHER_MIN_IV,
      ]);
    }
  });

  it('is worth twice as much to a type the sky is kind to', () => {
    // Rattata is Normal, and dust is the sky that favours Normal
    expect(valuesOf(Weather.DustHaze)[0]).toBe(WEATHER_MIN_IV + WEATHER_TYPE_MIN_IV);
    // Rain is worth going out in for a Water type, and a rat is not one
    expect(valuesOf(Weather.Rain)[0]).toBe(WEATHER_MIN_IV);
  });

  it('stacks with the family day rather than being beaten by it', () => {
    // A raid on the family's own day is already worth a floor; fought
    // under weather it is worth both, which is what makes a wet family
    // day the best day to raid
    // The day of the year that matches the family's own number is the
    // day it is featured on, which is the whole of the rule
    const day = new ChunkSnapshot(
      world.getChunk(0, 0),
      Date.UTC(2026, 0, 1) + getSpeciesData(Species.Rattata).family * 24 * 60 * 60 * 1000,
    );
    const prize = (weather: Weather | undefined): number =>
      getIV(
        deriveEncounter(day, [...hopeless], 'trainer-red', {
          type: EncounterType.LegendaryRaid,
          weather,
        }).ivs,
        STAT_ORDER[0],
      );

    expect(prize(undefined)).toBe(RAID_FAMILY_DAY_MIN_IV);
    expect(prize(Weather.Rain)).toBe(RAID_FAMILY_DAY_MIN_IV + WEATHER_MIN_IV);
  });

  it('never floors a pokemon above what the game can roll', () => {
    expect(Math.min(MAX_IV, RAID_FAMILY_DAY_MIN_IV + WEATHER_MIN_IV)).toBeLessThanOrEqual(MAX_IV);
  });
});

describe('what a fight under weather is', () => {
  const skyOf = (weather: Weather | undefined, mode: BattleModes): Weathers =>
    createTrainerBattle('battle-1', [], undefined, mode, weather).battle.weather.current;

  it('fights an overworld trainer under the sky that was over them', () => {
    expect(skyOf(Weather.Downpour, BattleModes.Npc)).toBe(Weathers.Rain);
    expect(skyOf(Weather.Blizzard, BattleModes.Npc)).toBe(Weathers.Hail);
    expect(skyOf(Weather.Heatwave, BattleModes.Npc)).toBe(Weathers.Sunny);
  });

  it('leaves two players under nothing, whatever the world was doing', () => {
    expect(skyOf(Weather.Downpour, BattleModes.PvP)).toBe(Weathers.None);
  });

  it('leaves a fight with no sky of its own clear', () => {
    expect(skyOf(undefined, BattleModes.Npc)).toBe(Weathers.None);
    expect(skyOf(Weather.Clear, BattleModes.Npc)).toBe(Weathers.None);
  });

  it('never hands either side a primal sky', () => {
    // Those refuse a whole type outright, which is not something a
    // walk down a road should decide
    for (const sky of Object.values(BATTLE_WEATHER)) {
      expect(sky).not.toBe(Weathers.ExtremeSunny);
      expect(sky).not.toBe(Weathers.HeavyRain);
    }
  });

  it('gives every sky a reading, plain ones included', () => {
    // A sky with no entry reads as undefined and would be set as the
    // battle's weather anyway, which is a field in no state at all
    for (const sky of EVERY_SKY) {
      expect(typeof toBattleWeather(sky)).toBe('number');
    }
  });
});

describe('the types a sky is kind to', () => {
  it('leaves no type without weather of its own', () => {
    // A player raising one type should have a sky worth going out in;
    // Unknown and Stellar belong to no pokemon that is met
    const covered = new Set(Object.values(WEATHER_TYPES).flat());
    const known = Object.keys(TYPE_NAMES)
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      .map((key) => Number(key) as Types)
      .filter((type) => type !== Types.Unknown && type !== Types.Stellar);
    const missing = known.filter((type) => !covered.has(type));

    expect(known.length).toBe(18);
    expect(missing.map((type) => TYPE_NAMES[type])).toEqual([]);
  });

  it('leaves the plain skies favouring nothing, which is what makes them plain', () => {
    for (const sky of [Weather.Clear, Weather.Cloudy, Weather.Breezy]) {
      expect(WEATHER_TYPES[sky]).toEqual([]);
      expect(isBoostingWeather(sky)).toBe(false);
    }
  });

  it('gives every boosting sky at least one type', () => {
    for (const sky of EVERY_SKY) {
      if (isBoostingWeather(sky)) {
        expect(WEATHER_TYPES[sky].length).toBeGreaterThan(0);
      }
    }
  });

  it('boosts no type far more often than another', () => {
    // A pairing reads fine and still means nothing: a type hung on a
    // sandstorm alone is a type whose weather turns up one window in
    // two thousand. What is worth holding is the spread of how often
    // each type is actually favoured, over a field of chunks and a
    // long stretch of windows
    const world = new World(SEED);
    const favored = new Map<Types, number>();
    let seen = 0;

    for (let window = 0; window < 120; window++) {
      for (let y = -40; y <= 40; y += 5) {
        for (let x = -40; x <= 40; x += 5) {
          seen++;
          for (const type of WEATHER_TYPES[world.getWeather(x, y, window)]) {
            favored.set(type, (favored.get(type) ?? 0) + 1);
          }
        }
      }
    }

    const shares = Object.keys(TYPE_NAMES)
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      .map((key) => Number(key) as Types)
      .filter((type) => type !== Types.Unknown && type !== Types.Stellar)
      .map((type) => (favored.get(type) ?? 0) / seen);
    const lowest = Math.min(...shares);
    const highest = Math.max(...shares);

    // Nobody starves, and nobody eats fifty times what the next one
    // does, which is where these pairings started
    expect(lowest).toBeGreaterThan(0.015);
    expect(highest / lowest).toBeLessThan(8);
  });

  it('says one short line about each, and leaves the types to the badges', () => {
    for (const line of Object.values(WEATHER_DESCRIPTIONS)) {
      expect(line.length).toBeGreaterThan(0);
      expect(line.length).toBeLessThan(90);
    }
  });
});
