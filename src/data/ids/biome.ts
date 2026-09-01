const enum Biome {
  // Aquatic
  DeepOcean = 0,
  Ocean = 1,
  CoralReef = 2,
  Beach = 3,
  // Wetlands
  Mangrove = 4,
  Swamp = 5,
  // Tropical
  TropicalRainforest = 6,
  TropicalSeasonalForest = 7,
  Savanna = 8,
  Desert = 9,
  // Temperate
  Shrubland = 10,
  Grassland = 11,
  TemperateForest = 12,
  TemperateRainforest = 13,
  // Cold
  ColdDesert = 14,
  Taiga = 15,
  Tundra = 16,
  // Highlands
  Mountain = 17,
  AlpineTundra = 18,
  Glacier = 19,
  // Gap fillers: climate-space regions the first set left to their
  // distant neighbors
  Woodland = 20,
  Steppe = 21,
  MontaneForest = 22,
  PolarOcean = 23,
  /**
   * The one place that is both hot and high. Everything else above
   * the tree line is cold, so a fire pokemon had nowhere of its own
   * to be until this
   */
  Volcano = 25,
  // The second set of gap fillers: the dry hot highland, the cool
  // shore, the cold wetland and the temperate shallow sea
  Badlands = 26,
  RockyCoast = 27,
  Bog = 28,
  KelpForest = 29,
  /**
   * Nowhere on the map: where a mythical comes from.
   *
   * A relic calls something out of a place the world does not
   * contain, and a catch has to say where it came from — the chunk
   * the player happened to be standing in would be a lie, since
   * walking back there finds nothing. `getBiome` never returns this
   * one, no spawn pool is registered for it, and nothing is ever
   * generated in it: it exists so a record can be honest about a
   * pokemon that came from beyond the known world
   */
  Beyond = 24,
}

export default Biome;

/**
 * Day-cycle periods of the main series (the Gen 2 morning/day/night
 * clock plus the later-gen evening split), as bit flags so a species
 * preference can combine several periods
 */
export const enum TimeOfDay {
  /**
   * Roughly 04:00-10:00
   */
  Morning = 1,
  /**
   * Roughly 10:00-17:00
   */
  Day = 2,
  /**
   * Roughly 17:00-20:00
   */
  Evening = 4,
  /**
   * Roughly 20:00-04:00
   */
  Night = 8,
}

/**
 * The full cycle, for species active around the clock
 */
export const AnyTimeOfDay = TimeOfDay.Morning | TimeOfDay.Day | TimeOfDay.Evening | TimeOfDay.Night;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/**
 * The day-cycle period a timestamp falls in, per the documented hour
 * ranges.
 *
 * The hours are read off the timestamp as UTC, so the caller passes a
 * **local** one — `toLocalTime(now, offset)`. Everything the world
 * derives per player does: a snapshot window is local, and a player
 * walking at night should meet the night pool wherever they are
 */
export function getTimeOfDay(timestamp: number): TimeOfDay {
  const hour = (timestamp % DAY) / HOUR;

  if (hour >= 4 && hour < 10) {
    return TimeOfDay.Morning;
  }
  if (hour >= 10 && hour < 17) {
    return TimeOfDay.Day;
  }
  if (hour >= 17 && hour < 20) {
    return TimeOfDay.Evening;
  }
  return TimeOfDay.Night;
}

/**
 * The biomes a player is in or on the water in: the open sea, the
 * reefs and the waterlogged wetlands. The beach is the shoreline
 * beside them, not water itself, so it stays out
 */
const WATER_BIOMES = new Set<Biome>([
  Biome.DeepOcean,
  Biome.Ocean,
  Biome.CoralReef,
  Biome.PolarOcean,
  Biome.KelpForest,
  Biome.Mangrove,
  Biome.Swamp,
  Biome.Bog,
]);

/**
 * Whether the biome is water, for the mechanics that only apply
 * there (the Dive Ball, say)
 */
export function isWaterBiome(biome: Biome): boolean {
  return WATER_BIOMES.has(biome);
}

/**
 * The open seas: water with no ground to stand on, as opposed to the
 * waterlogged wetlands. What cannot happen afloat — a berry bush, a
 * strolling npc — keeps to everywhere else
 */
const OPEN_SEAS = new Set<Biome>([
  Biome.DeepOcean,
  Biome.Ocean,
  Biome.CoralReef,
  Biome.PolarOcean,
  Biome.KelpForest,
]);

export function isOpenSea(biome: Biome): boolean {
  return OPEN_SEAS.has(biome);
}

export interface BiomeConfig {
  /**
   * Moisture level, -1 (arid) to 1 (saturated)
   */
  humidity: number;
  /**
   * -1 (polar cold) to 1 (equatorial heat)
   */
  temperature: number;
  /**
   * -1 (ocean floor) to 1 (highest peaks). The shoreline is
   * `SEA_LEVEL`, not zero: a third of the noise range is below it,
   * which is how much of the world is sea
   */
  elevation: number;
}

/**
 * Target climate point of each biome on the shared -1 to 1 noise
 * scale: sampling humidity/temperature/elevation noise at a world
 * position and picking the nearest target yields that position's
 * biome.
 *
 * `Beyond` is deliberately absent, and the type says so: it is not a
 * climate, so no sampling can land on it. Nothing is generated there
 */
export const BIOME_CONFIGS: { [key in Exclude<Biome, Biome.Beyond>]: BiomeConfig } = {
  // Aquatic: fully saturated, sorted by depth
  [Biome.DeepOcean]: { humidity: 1, temperature: -0.2, elevation: -0.85 },
  [Biome.Ocean]: { humidity: 1, temperature: 0, elevation: -0.5 },
  [Biome.CoralReef]: { humidity: 1, temperature: 0.7, elevation: -0.32 },
  [Biome.Beach]: { humidity: 0.4, temperature: 0.4, elevation: 0 },

  // Wetlands: waterlogged lowlands just above sea level
  [Biome.Mangrove]: { humidity: 0.9, temperature: 0.8, elevation: 0.05 },
  [Biome.Swamp]: { humidity: 0.8, temperature: 0.3, elevation: 0.05 },

  // Tropical: hot lowlands, arranged wet to dry
  [Biome.TropicalRainforest]: { humidity: 0.9, temperature: 0.9, elevation: 0.15 },
  [Biome.TropicalSeasonalForest]: { humidity: 0.4, temperature: 0.8, elevation: 0.15 },
  [Biome.Savanna]: { humidity: -0.2, temperature: 0.8, elevation: 0.18 },
  [Biome.Desert]: { humidity: -0.9, temperature: 0.9, elevation: 0.2 },

  // Temperate: mild midlands, arranged dry to wet
  [Biome.Shrubland]: { humidity: -0.5, temperature: 0.4, elevation: 0.3 },
  [Biome.Grassland]: { humidity: -0.2, temperature: 0.2, elevation: 0.18 },
  [Biome.TemperateForest]: { humidity: 0.4, temperature: 0.2, elevation: 0.3 },
  [Biome.TemperateRainforest]: { humidity: 0.8, temperature: 0.1, elevation: 0.3 },

  // Cold: high latitudes, arranged dry to wet
  [Biome.ColdDesert]: { humidity: -0.8, temperature: -0.3, elevation: 0.4 },
  [Biome.Taiga]: { humidity: 0.3, temperature: -0.5, elevation: 0.4 },
  [Biome.Tundra]: { humidity: -0.2, temperature: -0.8, elevation: 0.3 },

  // Highlands: climate driven by altitude
  [Biome.Mountain]: { humidity: 0, temperature: -0.2, elevation: 0.7 },
  [Biome.AlpineTundra]: { humidity: -0.1, temperature: -0.6, elevation: 0.85 },
  [Biome.Glacier]: { humidity: 0.2, temperature: -0.9, elevation: 0.9 },

  // Gap fillers
  // Open-canopy woodland sits near the climate origin, between
  // grassland and closed forest
  [Biome.Woodland]: { humidity: 0.1, temperature: 0.3, elevation: 0.12 },
  // Eurasian-style dry cool grassland between prairie and cold desert
  [Biome.Steppe]: { humidity: -0.5, temperature: -0.1, elevation: 0.25 },
  // Humid cloud-forest slopes between rainforest and bare mountain
  [Biome.MontaneForest]: { humidity: 0.5, temperature: 0, elevation: 0.55 },
  // High-latitude seas so cold coasts don't jump straight to land
  [Biome.PolarOcean]: { humidity: 1, temperature: -0.8, elevation: -0.6 },
  // Bare, baking and above everything: the corner of the climate
  // cube nothing else reaches
  [Biome.Volcano]: { humidity: -0.4, temperature: 0.9, elevation: 0.8 },
  // Hot dry highland between the desert floor and the volcano's rim
  [Biome.Badlands]: { humidity: -0.7, temperature: 0.7, elevation: 0.5 },
  // The cool shoreline; the warm one is the beach
  [Biome.RockyCoast]: { humidity: 0.5, temperature: -0.3, elevation: 0 },
  // Cold wetland, where the swamp's water sits under a colder sky
  [Biome.Bog]: { humidity: 0.8, temperature: -0.3, elevation: 0.05 },
  // The temperate shelf sea, between the open ocean and the shore
  [Biome.KelpForest]: { humidity: 1, temperature: 0.1, elevation: -0.35 },
};

/**
 * Every biome the world actually grows, in enum order. `Beyond` is
 * the one left out, since nothing is ever generated there: a species
 * that lives everywhere lives in these
 */
// tsc requires the assertion to produce Biomes from the record keys;
// tsgolint resolves the const enum to number
// oxlint-disable-next-line typescript/no-unnecessary-type-assertion
export const WILD_BIOMES: Biome[] = Object.keys(BIOME_CONFIGS).map(Number) as Biome[];

/**
 * Where the shoreline is on the elevation axis.
 *
 * It is a gate rather than a preference: a sample below it can only
 * be a water biome and one above it can only be a land biome, so a
 * dry, freezing trench is still a trench. Humidity and temperature
 * are independent noise fields, and left to argue on equal terms they
 * would put a Steppe on the ocean floor
 */
export const SEA_LEVEL = -0.25;

/**
 * How much harder elevation counts than the other two axes, within
 * one side of the shoreline: a place's height decides which band of
 * biomes it is choosing between, and how wet or warm it is picks from
 * that band
 */
export const ELEVATION_WEIGHT = 2;

/**
 * Classify a climate sample into the nearest biome on its own side of
 * the shoreline (squared Euclidean distance, elevation weighted)
 */
export function getBiome(humidity: number, temperature: number, elevation: number): Biome {
  let nearest = Biome.DeepOcean;
  let nearestDistance = Number.POSITIVE_INFINITY;

  const submerged = elevation < SEA_LEVEL;

  for (const [key, config] of Object.entries(BIOME_CONFIGS)) {
    // Never across the shoreline: the two sides are separate lists
    if (config.elevation < SEA_LEVEL !== submerged) {
      continue;
    }

    const dh = config.humidity - humidity;
    const dt = config.temperature - temperature;
    const de = (config.elevation - elevation) * ELEVATION_WEIGHT;
    const distance = dh * dh + dt * dt + de * de;

    if (distance < nearestDistance) {
      nearestDistance = distance;
      // tsc requires the assertion to produce a Biome from the
      // record key; tsgolint resolves the const enum to number
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      nearest = Number(key) as Biome;
    }
  }

  return nearest;
}
