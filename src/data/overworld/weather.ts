import Biome from '../ids/biome';
import { Types } from '../constants/types';
import { Weathers } from '../ids/status';

/**
 * The sky over a chunk.
 *
 * Weather is derived from the world seed the way the biomes are, out
 * of two noise channels read against the ground underneath. It is not
 * stored anywhere: everybody standing in the same place in the same
 * hour sees the same sky without asking the server, which is the rule
 * every other feature of a chunk follows.
 *
 * It reaches the game in two ways. A pokemon met under weather comes
 * with a floor under every one of its values, so a wet afternoon is
 * worth going out in. A trainer met out on the road is fought under
 * the sky that was over the road, which is the only kind of fight the
 * weather reaches: a raid, a duel and a league seat are all fought
 * under a clear sky whatever the world was doing. That one fight
 * keeps its sky on its own record, because the sky moves on and the
 * fight has to replay as it was fought.
 */

const enum Weather {
  Clear = 0,
  Cloudy = 1,
  Overcast = 2,
  Breezy = 3,
  Drizzle = 4,
  Rain = 5,
  Downpour = 6,
  Thunderstorm = 7,
  Mist = 8,
  Fog = 9,
  Haze = 10,
  Frost = 11,
  Snow = 12,
  Blizzard = 13,
  Hail = 14,
  Sandstorm = 15,
  DustHaze = 16,
  Heatwave = 17,
  FallingAsh = 18,
  Aurora = 19,
  Rainbow = 20,
  PollenDrift = 21,
  MeteorShower = 22,
}

export default Weather;

export const WEATHER_NAMES: Record<Weather, string> = {
  [Weather.Clear]: 'Clear',
  [Weather.Cloudy]: 'Cloudy',
  [Weather.Overcast]: 'Overcast',
  [Weather.Breezy]: 'Breezy',
  [Weather.Drizzle]: 'Drizzle',
  [Weather.Rain]: 'Rain',
  [Weather.Downpour]: 'Downpour',
  [Weather.Thunderstorm]: 'Thunderstorm',
  [Weather.Mist]: 'Mist',
  [Weather.Fog]: 'Fog',
  [Weather.Haze]: 'Haze',
  [Weather.Frost]: 'Frost',
  [Weather.Snow]: 'Snow',
  [Weather.Blizzard]: 'Blizzard',
  [Weather.Hail]: 'Hail',
  [Weather.Sandstorm]: 'Sandstorm',
  [Weather.DustHaze]: 'Dust Haze',
  [Weather.Heatwave]: 'Heatwave',
  [Weather.FallingAsh]: 'Falling Ash',
  [Weather.Aurora]: 'Aurora',
  [Weather.Rainbow]: 'Rainbow',
  [Weather.PollenDrift]: 'Pollen Drift',
  [Weather.MeteorShower]: 'Meteor Shower',
};

/**
 * One line on each sky, and only what a picture of it cannot say.
 *
 * What the sky favours is drawn as its types rather than written out,
 * and the floor is the same under every boosting sky, so neither is
 * repeated here
 */
export const WEATHER_DESCRIPTIONS: Record<Weather, string> = {
  [Weather.Clear]: 'An ordinary sky, and the one nothing is boosted under.',
  [Weather.Cloudy]: 'Cloud with no weather in it.',
  [Weather.Overcast]: 'A flat grey lid over the chunk.',
  [Weather.Breezy]: 'Moving air and nothing more.',
  [Weather.Drizzle]: 'Light rain.',
  [Weather.Rain]: 'Steady rain.',
  [Weather.Downpour]: 'Rain coming down hard.',
  [Weather.Thunderstorm]: 'Rain with thunder in it.',
  [Weather.Mist]: 'Air you cannot see far through.',
  [Weather.Fog]: 'Thick fog off the ground.',
  [Weather.Haze]: 'Hot, hanging air.',
  [Weather.Frost]: 'Cold enough to settle on everything.',
  [Weather.Snow]: 'Snow falling over the chunk.',
  [Weather.Blizzard]: 'Snow driven sideways. It chips at whatever is not built for it.',
  [Weather.Hail]: 'Ice falling hard enough to hurt. It chips at whatever is not built for it.',
  [Weather.Sandstorm]: 'Sand on the wind. It chips at whatever is not built for it.',
  [Weather.DustHaze]: 'Dust hanging on still air.',
  [Weather.Heatwave]: 'Heat with nothing behind it.',
  [Weather.FallingAsh]: 'Ash drifting down from somewhere.',
  [Weather.Aurora]: 'Light over the far north, and one of the rarest skies there is.',
  [Weather.Rainbow]: 'An arc over open water, and one of the rarest skies there is.',
  [Weather.PollenDrift]: 'Pollen carried through the trees.',
  [Weather.MeteorShower]: 'Something falling from a long way off, and the rarest sky there is.',
};

/**
 * The types each sky is kind to.
 *
 * Every type in the game is favoured by some sky, so no player is left
 * with weather that never means anything to what they are raising. A
 * plain sky favours nothing, which is what makes it plain.
 *
 * These are the world's own pairings rather than the battle engine's.
 * The engine knows four skies and what they do to Fire and Water; this
 * says which pokemon a sky is worth going out for, which is a question
 * the mainline has no answer to.
 *
 * The pairings are weighted by how often a sky actually turns up, not
 * only by what it looks like. The world is wet and cold, so its damp
 * skies are common and its storms are rare: a type hung on a sandstorm
 * alone is a type nobody is ever boosted for, which is why mist
 * carries the forest types and thunder carries three.
 */
export const WEATHER_TYPES: Record<Weather, Types[]> = {
  [Weather.Clear]: [],
  [Weather.Cloudy]: [],
  [Weather.Breezy]: [],
  [Weather.Overcast]: [Types.Dark, Types.Normal],
  [Weather.Drizzle]: [Types.Water, Types.Grass],
  [Weather.Rain]: [Types.Water, Types.Electric],
  [Weather.Downpour]: [Types.Water, Types.Grass],
  [Weather.Thunderstorm]: [Types.Electric, Types.Dragon, Types.Flying],
  [Weather.Mist]: [Types.Bug, Types.Grass],
  [Weather.Fog]: [Types.Ghost, Types.Dark, Types.Psychic],
  [Weather.Haze]: [Types.Fire, Types.Poison],
  [Weather.Frost]: [Types.Ice, Types.Steel],
  [Weather.Snow]: [Types.Ice, Types.Fairy],
  [Weather.Blizzard]: [Types.Ice, Types.Steel],
  [Weather.Hail]: [Types.Ice, Types.Rock],
  [Weather.Sandstorm]: [Types.Rock, Types.Ground, Types.Steel],
  [Weather.DustHaze]: [Types.Ground, Types.Rock, Types.Normal],
  [Weather.Heatwave]: [Types.Fire, Types.Fighting],
  [Weather.FallingAsh]: [Types.Fire, Types.Dark],
  [Weather.Aurora]: [Types.Psychic, Types.Fairy],
  [Weather.Rainbow]: [Types.Fairy, Types.Flying],
  [Weather.PollenDrift]: [Types.Grass, Types.Bug],
  [Weather.MeteorShower]: [Types.Dragon, Types.Psychic],
};

/**
 * What a sky is worth to the types it favours, on top of the floor
 * every boosting sky carries. A Water type met in rain comes out at
 * ten rather than five: going out in the right weather for what you
 * are looking for is the whole of the reward
 */
export const WEATHER_TYPE_MIN_IV = 5;

/** Whether this sky is kind to a pokemon carrying these types */
export function isWeatherFavored(weather: Weather, types: Types[]): boolean {
  const favored = new Set(WEATHER_TYPES[weather]);

  return types.some((type) => favored.has(type));
}

/**
 * The lowest every value of a pokemon met under weather comes out at.
 *
 * It is the whole of what weather is worth, so it has to be worth
 * something: a floor of five puts the worst possible roll a sixth of
 * the way up rather than at nothing. It **stacks** with the family
 * day's own floor rather than being beaten by it, so a raid on the
 * right day fought under weather is worth both
 */
export const WEATHER_MIN_IV = 5;

/**
 * The skies a biome can show, one per reading of the two channels.
 *
 * Six slots rather than a list, because the reading is continuous and
 * the slots are what it lands in. A front arriving reads through them
 * in order, clear then damp then wet then a storm, so the sky changes
 * the way weather does rather than jumping between unrelated states.
 *
 * The same reading against different ground is the same weather system
 * over a different country: the front that is a thunderstorm in the
 * rainforest is a sandstorm over the desert it crosses next
 */
export interface WeatherBands {
  /** Driest and calmest, which is most windows */
  clear: Weather;
  /** Dry, but the air is doing something */
  stirred: Weather;
  /** Damp and calm: the front on its way */
  damp: Weather;
  /** Wet and calm */
  wet: Weather;
  /** Wet and wild */
  storm: Weather;
  /**
   * Both channels at an extreme, which smooth noise reaches rarely and
   * in one place at a time. Null where a country has no showpiece of
   * its own
   */
  rare: Weather | null;
}

/**
 * What the reading has to reach for each band. A front is wet before
 * it is a storm, so the thresholds are ordered rather than even: most
 * of the field is dry and calm, which is what makes the rest worth
 * walking into
 */
const DAMP = 0.15;
const WET = 0.45;
const WILD = 0.4;

/** Both channels this far out, which is a corner of the field */
const RARE = 0.6;

/**
 * Nothing lives in `Beyond` and nothing happens over it, which is why
 * it is the one country with no sky
 */
export const BIOME_WEATHER: Record<Biome, WeatherBands> = {
  [Biome.DeepOcean]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.MeteorShower,
  },
  [Biome.Ocean]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.Rainbow,
  },
  [Biome.CoralReef]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Haze,
    wet: Weather.Rain,
    storm: Weather.Downpour,
    rare: Weather.Rainbow,
  },
  [Biome.Beach]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.Rainbow,
  },
  [Biome.Mangrove]: {
    clear: Weather.Cloudy,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Downpour,
    rare: null,
  },
  [Biome.Swamp]: {
    clear: Weather.Overcast,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: null,
  },
  [Biome.TropicalRainforest]: {
    clear: Weather.Cloudy,
    stirred: Weather.Haze,
    damp: Weather.Drizzle,
    wet: Weather.Downpour,
    storm: Weather.Thunderstorm,
    rare: Weather.PollenDrift,
  },
  [Biome.TropicalSeasonalForest]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Drizzle,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.PollenDrift,
  },
  [Biome.Savanna]: {
    clear: Weather.Heatwave,
    stirred: Weather.DustHaze,
    damp: Weather.Cloudy,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.MeteorShower,
  },
  [Biome.Desert]: {
    clear: Weather.Heatwave,
    stirred: Weather.Sandstorm,
    damp: Weather.DustHaze,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.MeteorShower,
  },
  [Biome.Shrubland]: {
    clear: Weather.Clear,
    stirred: Weather.DustHaze,
    damp: Weather.Cloudy,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: null,
  },
  [Biome.Grassland]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.Rainbow,
  },
  [Biome.TemperateForest]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.PollenDrift,
  },
  [Biome.TemperateRainforest]: {
    clear: Weather.Overcast,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Downpour,
    storm: Weather.Thunderstorm,
    rare: Weather.PollenDrift,
  },
  [Biome.ColdDesert]: {
    clear: Weather.Clear,
    stirred: Weather.DustHaze,
    damp: Weather.Frost,
    wet: Weather.Snow,
    storm: Weather.Blizzard,
    rare: Weather.MeteorShower,
  },
  [Biome.Taiga]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Frost,
    wet: Weather.Snow,
    storm: Weather.Blizzard,
    rare: Weather.Aurora,
  },
  [Biome.Tundra]: {
    clear: Weather.Frost,
    stirred: Weather.Breezy,
    damp: Weather.Snow,
    wet: Weather.Snow,
    storm: Weather.Blizzard,
    rare: Weather.Aurora,
  },
  [Biome.Mountain]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Hail,
    storm: Weather.Thunderstorm,
    rare: Weather.MeteorShower,
  },
  [Biome.AlpineTundra]: {
    clear: Weather.Frost,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Snow,
    storm: Weather.Blizzard,
    rare: Weather.Aurora,
  },
  [Biome.Glacier]: {
    clear: Weather.Frost,
    stirred: Weather.Breezy,
    damp: Weather.Snow,
    wet: Weather.Snow,
    storm: Weather.Blizzard,
    rare: Weather.Aurora,
  },
  [Biome.Woodland]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.PollenDrift,
  },
  [Biome.Steppe]: {
    clear: Weather.Clear,
    stirred: Weather.DustHaze,
    damp: Weather.Cloudy,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.MeteorShower,
  },
  [Biome.MontaneForest]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.PollenDrift,
  },
  [Biome.PolarOcean]: {
    clear: Weather.Frost,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Snow,
    storm: Weather.Blizzard,
    rare: Weather.Aurora,
  },
  [Biome.Beyond]: {
    clear: Weather.Clear,
    stirred: Weather.Clear,
    damp: Weather.Clear,
    wet: Weather.Clear,
    storm: Weather.Clear,
    rare: null,
  },
  [Biome.Volcano]: {
    clear: Weather.Haze,
    stirred: Weather.FallingAsh,
    damp: Weather.Fog,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.MeteorShower,
  },
  [Biome.Badlands]: {
    clear: Weather.Heatwave,
    stirred: Weather.DustHaze,
    damp: Weather.Haze,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.MeteorShower,
  },
  [Biome.RockyCoast]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.Rainbow,
  },
  [Biome.Bog]: {
    clear: Weather.Overcast,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Drizzle,
    storm: Weather.Thunderstorm,
    rare: null,
  },
  [Biome.KelpForest]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Downpour,
    rare: Weather.Rainbow,
  },
};

/**
 * The sky a reading lands on over this ground.
 *
 * `wetness` and `energy` both run from -1 to 1. The bands are read
 * from the outside in, so a showpiece beats a storm and a storm beats
 * the rain it is made of
 */
export function classifyWeather(biome: Biome, wetness: number, energy: number): Weather {
  const bands = BIOME_WEATHER[biome];

  if (bands.rare != null && wetness >= RARE && energy >= RARE) {
    return bands.rare;
  }
  if (wetness >= WET) {
    return energy >= WILD ? bands.storm : bands.wet;
  }
  if (wetness >= DAMP) {
    return bands.damp;
  }
  return energy >= WILD ? bands.stirred : bands.clear;
}

/**
 * Whether a sky is worth going out in.
 *
 * Everything but the plain skies boosts what is met under it. A clear
 * afternoon has to be the ordinary case or the floor is not a boost at
 * all, it is the game
 */
const PLAIN = new Set<Weather>([Weather.Clear, Weather.Cloudy, Weather.Breezy]);

export function isBoostingWeather(weather: Weather): boolean {
  return !PLAIN.has(weather);
}

/**
 * The battle sky an overworld one is fought under.
 *
 * Only the fights that happen out in the world read this: a trainer
 * standing on a rainy road is fought in the rain. Most skies have no
 * mainline counterpart and map to `None`, which is the honest answer.
 * Nothing maps to a primal sky either, since those refuse a whole type
 * outright and no walk should hand that to either side
 */
export const BATTLE_WEATHER: Record<Weather, Weathers> = {
  [Weather.Clear]: Weathers.None,
  [Weather.Cloudy]: Weathers.None,
  [Weather.Overcast]: Weathers.None,
  [Weather.Breezy]: Weathers.None,
  [Weather.Drizzle]: Weathers.Rain,
  [Weather.Rain]: Weathers.Rain,
  [Weather.Downpour]: Weathers.Rain,
  [Weather.Thunderstorm]: Weathers.Rain,
  [Weather.Mist]: Weathers.Fog,
  [Weather.Fog]: Weathers.Fog,
  [Weather.Haze]: Weathers.Sunny,
  [Weather.Frost]: Weathers.Snow,
  [Weather.Snow]: Weathers.Snow,
  [Weather.Blizzard]: Weathers.Hail,
  [Weather.Hail]: Weathers.Hail,
  [Weather.Sandstorm]: Weathers.Sandstorm,
  [Weather.DustHaze]: Weathers.Sandstorm,
  [Weather.Heatwave]: Weathers.Sunny,
  [Weather.FallingAsh]: Weathers.Sandstorm,
  // The showpieces are worth what they are met under, not what they
  // are fought under: none of the four has a sky the engine knows
  [Weather.Aurora]: Weathers.None,
  [Weather.Rainbow]: Weathers.None,
  [Weather.PollenDrift]: Weathers.None,
  [Weather.MeteorShower]: Weathers.None,
};

export function toBattleWeather(weather: Weather): Weathers {
  return BATTLE_WEATHER[weather];
}
