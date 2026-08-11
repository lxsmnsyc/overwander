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
 * The day-cycle period a timestamp falls in, per the documented
 * hour ranges
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
  Biome.Mangrove,
  Biome.Swamp,
]);

/**
 * Whether the biome is water, for the mechanics that only apply
 * there (the Dive Ball, say)
 */
export function isWaterBiome(biome: Biome): boolean {
  return WATER_BIOMES.has(biome);
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
   * -1 (ocean floor) to 1 (highest peaks); sea level sits at 0
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
  [Biome.DeepOcean]: { humidity: 1, temperature: -0.2, elevation: -0.8 },
  [Biome.Ocean]: { humidity: 1, temperature: 0, elevation: -0.4 },
  [Biome.CoralReef]: { humidity: 1, temperature: 0.7, elevation: -0.2 },
  [Biome.Beach]: { humidity: 0.4, temperature: 0.4, elevation: 0 },

  // Wetlands: waterlogged lowlands just above sea level
  [Biome.Mangrove]: { humidity: 0.9, temperature: 0.8, elevation: 0.05 },
  [Biome.Swamp]: { humidity: 0.8, temperature: 0.3, elevation: 0.05 },

  // Tropical: hot lowlands, arranged wet to dry
  [Biome.TropicalRainforest]: { humidity: 0.9, temperature: 0.9, elevation: 0.2 },
  [Biome.TropicalSeasonalForest]: { humidity: 0.4, temperature: 0.8, elevation: 0.2 },
  [Biome.Savanna]: { humidity: -0.2, temperature: 0.8, elevation: 0.2 },
  [Biome.Desert]: { humidity: -0.9, temperature: 0.9, elevation: 0.2 },

  // Temperate: mild midlands, arranged dry to wet
  [Biome.Shrubland]: { humidity: -0.5, temperature: 0.4, elevation: 0.3 },
  [Biome.Grassland]: { humidity: -0.2, temperature: 0.2, elevation: 0.2 },
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
  [Biome.Woodland]: { humidity: 0.1, temperature: 0.3, elevation: 0.15 },
  // Eurasian-style dry cool grassland between prairie and cold desert
  [Biome.Steppe]: { humidity: -0.5, temperature: -0.1, elevation: 0.25 },
  // Humid cloud-forest slopes between rainforest and bare mountain
  [Biome.MontaneForest]: { humidity: 0.5, temperature: 0, elevation: 0.55 },
  // High-latitude seas so cold coasts don't jump straight to land
  [Biome.PolarOcean]: { humidity: 1, temperature: -0.8, elevation: -0.5 },
};

/**
 * Classify a climate sample into the biome with the nearest target
 * point (squared Euclidean distance over the three axes)
 */
export function getBiome(humidity: number, temperature: number, elevation: number): Biome {
  let nearest = Biome.DeepOcean;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const [key, config] of Object.entries(BIOME_CONFIGS)) {
    const dh = config.humidity - humidity;
    const dt = config.temperature - temperature;
    const de = config.elevation - elevation;
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
