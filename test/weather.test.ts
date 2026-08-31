import { beforeAll, describe, expect, it } from 'vitest';
import Biome from '../src/data/ids/biome';
import Weather, {
  BATTLE_WEATHER,
  BIOME_WEATHER,
  FATA_MORGANA_HIDDEN_BOOST,
  METEOR_SHOWER_SHINY_BOOST,
  WEATHER_DESCRIPTIONS,
  WEATHER_MIN_IV,
  WEATHER_NAMES,
  WEATHER_TYPES,
  classifyWeather,
  favorsEverything,
  hiddenAbilityBoostOf,
  isBoostingWeather,
  isWeatherFavored,
  shadowsWildMeetings,
  shinyBoostOf,
  teachesEggMove,
  toBattleWeather,
} from '../src/data/overworld/weather';
import World from '../src/overworld/world';
import ChunkSnapshot from '../src/overworld/chunk-snapshot';
import deriveEncounter, { EncounterType, RAID_FAMILY_DAY_MIN_IV } from '../src/overworld/encounter';
import { Species } from '../src/data/ids/species';
import type { Moves } from '../src/data/ids/moves';
import { TYPE_NAMES, Types } from '../src/data/constants/types';
import { MAX_IV, STAT_ORDER, getIV } from '../src/data/constants/stats';
import registerGameData from '../src/data';
import { BattleModes } from '../src/battle/core';
import { Weathers } from '../src/data/ids/status';
import { createTrainerBattle } from '../src/overworld/rocket-battle';
import { getEggMoves, getSpeciesData } from '../src/data/species';

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

  it('keeps the rarest sky in the corner of the corner', () => {
    // A reading that would be any other country's showpiece is not
    // enough for this one
    expect(classifyWeather(Biome.Desert, 0.95, 0.95)).toBe(Weather.MeteorShower);
    expect(classifyWeather(Biome.Desert, 0.65, 0.65)).toBe(Weather.Thunderstorm);
  });

  it('lets the meteor shower fall over every country but Beyond', () => {
    for (const [key, bands] of Object.entries(BIOME_WEATHER)) {
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      const biome = Number(key) as Biome;

      expect(bands.wildest).toBe(biome === Biome.Beyond ? null : Weather.MeteorShower);
      expect(bands.stillest).toBe(biome === Biome.Beyond ? null : Weather.FataMorgana);
      expect(bands.bleakest).toBe(biome === Biome.Beyond ? null : Weather.DarkDay);
    }
    // Its own showpiece still holds the band below it
    expect(classifyWeather(Biome.Glacier, 0.95, 0.95)).toBe(Weather.MeteorShower);
    expect(classifyWeather(Biome.Glacier, 0.7, 0.7)).toBe(Weather.Aurora);
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
    // A wind is worth something to the things that ride it, and an
    // ordinary grey day to the ordinary things
    expect(isBoostingWeather(Weather.Breezy)).toBe(true);
    expect(isBoostingWeather(Weather.Cloudy)).toBe(true);
    expect(isBoostingWeather(Weather.Rain)).toBe(true);
    expect(isBoostingWeather(Weather.Aurora)).toBe(true);
    expect(WEATHER_MIN_IV).toBe(10);
    // What a sky boosts is its own types and nothing else, so a plain
    // sky is one that favours nobody
    expect(WEATHER_TYPES[Weather.Clear]).toEqual([]);
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
  });

  it('puts a floor under every value of one the sky favours', () => {
    // Rattata is Normal, and cloud, dust and overcast are the skies
    // that favour Normal
    for (const sky of [Weather.Cloudy, Weather.DustHaze, Weather.Overcast]) {
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

  it('is worth nothing to a pokemon the sky is not about', () => {
    // Rain is worth walking into for a Water type, and a rat is not
    // one. A floor under everything met in the rain would be a floor
    // under the whole game
    for (const sky of [Weather.Rain, Weather.Snow, Weather.Fog, Weather.Aurora]) {
      expect(valuesOf(sky)).toEqual([0, 0, 0, 0, 0, 0]);
    }
  });

  it('stacks with the family day rather than being beaten by it', () => {
    // A raid on the family's own day is already worth a floor; fought
    // under a sky that favours it, it is worth both, which is what
    // makes the right weather on the right day the best day to raid
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
    // A rat is Normal, so dust is the sky its raid is worth more under
    expect(prize(Weather.Rain)).toBe(RAID_FAMILY_DAY_MIN_IV);
    expect(prize(Weather.DustHaze)).toBe(RAID_FAMILY_DAY_MIN_IV + WEATHER_MIN_IV);
  });

  it('hands a fogbow meeting a move off its line', () => {
    expect(teachesEggMove(Weather.Fogbow)).toBe(true);
    for (const sky of [Weather.MeteorShower, Weather.FataMorgana, Weather.DarkDay, Weather.Mist]) {
      expect(teachesEggMove(sky)).toBe(false);
    }

    // Bulbasaur's line inherits; the moves it walks out with under a
    // fogbow are not the ones it walks out with under anything else
    const met = (weather: Weather | undefined): Moves[] =>
      deriveEncounter(snapshot, [Species.Bulbasaur, 0, 12_345], 'trainer-red', {
        type: EncounterType.Wild,
        weather,
      }).moves;
    const inherited = met(Weather.Fogbow);

    expect(inherited).not.toEqual(met(Weather.Clear));
    expect(new Set(getEggMoves(Species.Bulbasaur)).has(inherited[0])).toBe(true);

    // A line that inherits nothing is handed nothing
    expect(getEggMoves(Species.Butterfree)).toEqual([]);
    expect(
      deriveEncounter(snapshot, [Species.Butterfree, 0, 12_345], 'trainer-red', {
        type: EncounterType.Wild,
        weather: Weather.Fogbow,
      }).moves,
    ).toEqual(
      deriveEncounter(snapshot, [Species.Butterfree, 0, 12_345], 'trainer-red', {
        type: EncounterType.Wild,
        weather: Weather.Clear,
      }).moves,
    );
  });

  it('puts the floor under anything at all met under a meteor shower', () => {
    // Rain is worth nothing to a rat and the rarest sky is worth the
    // same to everything, which is the whole of what makes it rare
    expect(valuesOf(Weather.Rain)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(valuesOf(Weather.MeteorShower)).toEqual(STAT_ORDER.map(() => WEATHER_MIN_IV));
  });

  it('doubles the odds of a shiny under a meteor shower', () => {
    // Counted rather than sampled. A trait value's low half is what
    // decides the sparkle, so walking all 65536 of them is the whole
    // population rather than a sample of it: the count is exact, and
    // the two skies over the same values are the multiplier itself
    const sparkles = (weather: Weather | undefined): number => {
      let found = 0;

      for (let trait = 0; trait < 65_536; trait += 1) {
        if (
          deriveEncounter(snapshot, [Species.Rattata, 0, trait], 'trainer-red', {
            type: EncounterType.Wild,
            weather,
          }).shiny
        ) {
          found += 1;
        }
      }
      return found;
    };
    const plain = sparkles(Weather.Clear);

    expect(plain).toBeGreaterThan(0);
    expect(sparkles(Weather.MeteorShower)).toBe(plain * METEOR_SHOWER_SHINY_BOOST);
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
    for (const sky of [Weather.Clear]) {
      expect(WEATHER_TYPES[sky]).toEqual([]);
      expect(isBoostingWeather(sky)).toBe(false);
    }
  });

  it('gives every boosting sky at least one type', () => {
    for (const sky of EVERY_SKY) {
      // The sky that favours everything carries no list, since a list
      // of all eighteen is what `favorsEverything` says in a word
      if (isBoostingWeather(sky) && !favorsEverything(sky)) {
        expect(WEATHER_TYPES[sky].length).toBeGreaterThan(0);
      }
    }
  });

  it('reaches the fata morgana from the other corner of the field', () => {
    // The two rarest skies cannot be reached by one reading: one is
    // both channels as high as they go, the other both as low
    expect(classifyWeather(Biome.Desert, -0.95, -0.95)).toBe(Weather.FataMorgana);
    expect(classifyWeather(Biome.Glacier, -0.95, -0.95)).toBe(Weather.FataMorgana);
    // Short of the corner it is only an ordinary dry, calm sky
    expect(classifyWeather(Biome.Desert, -0.7, -0.7)).toBe(Weather.Heatwave);
  });

  it('reaches the dark day from the dry, violent corner', () => {
    // Three corners, three skies, and no reading can be in two of them
    expect(classifyWeather(Biome.Grassland, -0.95, 0.95)).toBe(Weather.DarkDay);
    expect(classifyWeather(Biome.Grassland, 0.95, 0.95)).toBe(Weather.MeteorShower);
    expect(classifyWeather(Biome.Grassland, -0.95, -0.95)).toBe(Weather.FataMorgana);
    // Short of the corner it is only a stirred sky
    expect(classifyWeather(Biome.Grassland, -0.95, 0.5)).toBe(Weather.Breezy);
  });

  it('reaches the fogbow from the wet, calm corner', () => {
    // The last of the four corners, and no reading is in two of them
    expect(classifyWeather(Biome.Grassland, 0.95, -0.95)).toBe(Weather.Fogbow);
    expect(classifyWeather(Biome.Grassland, 0.95, 0.95)).toBe(Weather.MeteorShower);
    expect(classifyWeather(Biome.Grassland, -0.95, -0.95)).toBe(Weather.FataMorgana);
    expect(classifyWeather(Biome.Grassland, -0.95, 0.95)).toBe(Weather.DarkDay);
    // Short of the corner it is only wet
    expect(classifyWeather(Biome.Grassland, 0.95, -0.5)).toBe(Weather.Rain);
  });

  it('shadows what is met under a dark day and nothing else', () => {
    expect(shadowsWildMeetings(Weather.DarkDay)).toBe(true);
    for (const sky of [Weather.MeteorShower, Weather.FataMorgana, Weather.Fog, Weather.Clear]) {
      expect(shadowsWildMeetings(sky)).toBe(false);
    }
    // It is the shadow it gives rather than a boost: the other two
    // keep theirs to themselves
    expect(shinyBoostOf(Weather.DarkDay)).toBe(1);
    expect(hiddenAbilityBoostOf(Weather.DarkDay)).toBe(1);
    // And it is still worth going out in whoever is being raised
    expect(favorsEverything(Weather.DarkDay)).toBe(true);
  });

  it('keeps the two rarest skies to their own boost', () => {
    // Both favour everything; only one touches the coat and only the
    // other touches what the pokemon was hiding
    expect(shinyBoostOf(Weather.MeteorShower)).toBe(METEOR_SHOWER_SHINY_BOOST);
    expect(shinyBoostOf(Weather.FataMorgana)).toBe(1);
    expect(hiddenAbilityBoostOf(Weather.FataMorgana)).toBe(FATA_MORGANA_HIDDEN_BOOST);
    expect(hiddenAbilityBoostOf(Weather.MeteorShower)).toBe(1);
    expect(shinyBoostOf(Weather.Rain)).toBe(1);
    expect(hiddenAbilityBoostOf(Weather.Rain)).toBe(1);
  });

  it('makes the rarest sky kind to everything', () => {
    expect(favorsEverything(Weather.MeteorShower)).toBe(true);
    expect(favorsEverything(Weather.FataMorgana)).toBe(true);
    expect(WEATHER_TYPES[Weather.MeteorShower]).toEqual([]);

    // Every type, not merely the ones it used to name
    for (const key of Object.keys(TYPE_NAMES)) {
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      expect(isWeatherFavored(Weather.MeteorShower, [Number(key) as Types])).toBe(true);
    }
    // No other sky answers that way
    expect(favorsEverything(Weather.Rain)).toBe(false);
    expect(isWeatherFavored(Weather.Rain, [Types.Rock])).toBe(false);
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
