import Biome from '../../ids/biome';
import Weather from './kinds';

/** Which skies a country gets, and which one two readings land on */
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
  /**
   * Both channels at their far end: the corner of the corner.
   *
   * Every country has the same one, and it is the only sky that is not
   * a country's own. The band rather than the map is what makes it
   * rare: it falls anywhere, and almost nowhere
   */
  wildest: Weather | null;
  /**
   * The opposite corner, both channels as low as they go: air that is
   * doing nothing at all.
   *
   * The field has four corners and this is the second of them worth a
   * sky. It is as rare as `wildest` by measurement rather than by
   * arrangement, the noise being near enough symmetric, and the two
   * cannot both be reached by one reading
   */
  stillest: Weather | null;
  /**
   * Dry as the still corner and as violent as the wild one: air with
   * nothing in it but force.
   *
   * The third corner worth a sky, and the only one that is not a gift.
   * What it hands over is a pokemon whose heart has closed, which is
   * worth having and worth undoing
   */
  bleakest: Weather | null;
  /**
   * Wet as the wild corner and as calm as the still one: air holding
   * all it can and nothing moving it.
   *
   * The last of the four, and the only one that gives a pokemon
   * something it was never going to be born with
   */
  thickest: Weather | null;
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
 * Further out again, and the narrowest band there is.
 *
 * It is set against the map rather than picked: the sky above it falls
 * over every country, so the band is the only thing holding it rare.
 * At this reading it lands on about one window in thirteen hundred,
 * which is half as often as the next rarest sky
 */
const RAREST = 0.92;

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
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Ocean]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.Rainbow,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.CoralReef]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Haze,
    wet: Weather.Rain,
    storm: Weather.Downpour,
    rare: Weather.Rainbow,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Beach]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.Rainbow,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Mangrove]: {
    clear: Weather.Cloudy,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Downpour,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Swamp]: {
    clear: Weather.Overcast,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.TropicalRainforest]: {
    clear: Weather.Cloudy,
    stirred: Weather.Haze,
    damp: Weather.Drizzle,
    wet: Weather.Downpour,
    storm: Weather.Thunderstorm,
    rare: Weather.PollenDrift,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.TropicalSeasonalForest]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Drizzle,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.PollenDrift,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Savanna]: {
    clear: Weather.Heatwave,
    stirred: Weather.DustHaze,
    damp: Weather.Cloudy,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Desert]: {
    clear: Weather.Heatwave,
    stirred: Weather.Sandstorm,
    damp: Weather.DustHaze,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Shrubland]: {
    clear: Weather.Clear,
    stirred: Weather.DustHaze,
    damp: Weather.Cloudy,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Grassland]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.Rainbow,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.TemperateForest]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.PollenDrift,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.TemperateRainforest]: {
    clear: Weather.Overcast,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Downpour,
    storm: Weather.Thunderstorm,
    rare: Weather.PollenDrift,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.ColdDesert]: {
    clear: Weather.Clear,
    stirred: Weather.Sandstorm,
    damp: Weather.Frost,
    wet: Weather.Snow,
    storm: Weather.Blizzard,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Taiga]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Frost,
    wet: Weather.Snow,
    storm: Weather.Blizzard,
    rare: Weather.Aurora,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Tundra]: {
    clear: Weather.Frost,
    stirred: Weather.Breezy,
    damp: Weather.Snow,
    wet: Weather.Snow,
    storm: Weather.Blizzard,
    rare: Weather.Aurora,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Mountain]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Hail,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.AlpineTundra]: {
    clear: Weather.Frost,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Snow,
    storm: Weather.Blizzard,
    rare: Weather.Aurora,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Glacier]: {
    clear: Weather.Frost,
    stirred: Weather.Breezy,
    damp: Weather.Snow,
    wet: Weather.Snow,
    storm: Weather.Blizzard,
    rare: Weather.Aurora,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Woodland]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.PollenDrift,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Steppe]: {
    clear: Weather.Clear,
    stirred: Weather.DustHaze,
    damp: Weather.Cloudy,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.MontaneForest]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.PollenDrift,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.PolarOcean]: {
    clear: Weather.Frost,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Snow,
    storm: Weather.Blizzard,
    rare: Weather.Aurora,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Beyond]: {
    clear: Weather.Clear,
    stirred: Weather.Clear,
    damp: Weather.Clear,
    wet: Weather.Clear,
    storm: Weather.Clear,
    rare: null,
    wildest: null,
    stillest: null,
    bleakest: null,
    thickest: null,
  },
  [Biome.Volcano]: {
    clear: Weather.Haze,
    stirred: Weather.FallingAsh,
    damp: Weather.Fog,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Badlands]: {
    clear: Weather.Heatwave,
    stirred: Weather.Sandstorm,
    damp: Weather.Haze,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.RockyCoast]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Rain,
    storm: Weather.Thunderstorm,
    rare: Weather.Rainbow,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.Bog]: {
    clear: Weather.Overcast,
    stirred: Weather.Breezy,
    damp: Weather.Fog,
    wet: Weather.Drizzle,
    storm: Weather.Thunderstorm,
    rare: null,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
  },
  [Biome.KelpForest]: {
    clear: Weather.Clear,
    stirred: Weather.Breezy,
    damp: Weather.Mist,
    wet: Weather.Rain,
    storm: Weather.Downpour,
    rare: Weather.Rainbow,
    wildest: Weather.MeteorShower,
    stillest: Weather.FataMorgana,
    bleakest: Weather.DarkDay,
    thickest: Weather.Fogbow,
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

  if (bands.wildest != null && wetness >= RAREST && energy >= RAREST) {
    return bands.wildest;
  }
  if (bands.stillest != null && wetness <= -RAREST && energy <= -RAREST) {
    return bands.stillest;
  }
  if (bands.bleakest != null && wetness <= -RAREST && energy >= RAREST) {
    return bands.bleakest;
  }
  if (bands.thickest != null && wetness >= RAREST && energy <= -RAREST) {
    return bands.thickest;
  }
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
 * Whether a sky is worth going out in at all, for somebody.
 *
 * It says nothing about any one pokemon: what a sky is worth is worth
 * only to the types it favours. Callers deciding a floor want
 * `isWeatherFavored`
 */
const PLAIN = new Set<Weather>([Weather.Clear]);

export function isBoostingWeather(weather: Weather): boolean {
  return !PLAIN.has(weather);
}
