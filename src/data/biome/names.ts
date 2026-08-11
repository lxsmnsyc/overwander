import Biome, { TimeOfDay } from '../ids/biome';

/**
 * Display names for the biomes; the enum itself carries only ids
 */
export const BIOME_NAMES: Record<Biome, string> = {
  [Biome.DeepOcean]: 'Deep Ocean',
  [Biome.Ocean]: 'Ocean',
  [Biome.CoralReef]: 'Coral Reef',
  [Biome.Beach]: 'Beach',
  [Biome.Mangrove]: 'Mangrove',
  [Biome.Swamp]: 'Swamp',
  [Biome.TropicalRainforest]: 'Tropical Rainforest',
  [Biome.TropicalSeasonalForest]: 'Tropical Seasonal Forest',
  [Biome.Savanna]: 'Savanna',
  [Biome.Desert]: 'Desert',
  [Biome.Shrubland]: 'Shrubland',
  [Biome.Grassland]: 'Grassland',
  [Biome.TemperateForest]: 'Temperate Forest',
  [Biome.TemperateRainforest]: 'Temperate Rainforest',
  [Biome.ColdDesert]: 'Cold Desert',
  [Biome.Taiga]: 'Taiga',
  [Biome.Tundra]: 'Tundra',
  [Biome.Mountain]: 'Mountain',
  [Biome.AlpineTundra]: 'Alpine Tundra',
  [Biome.Glacier]: 'Glacier',
  [Biome.Woodland]: 'Woodland',
  [Biome.Steppe]: 'Steppe',
  [Biome.MontaneForest]: 'Montane Forest',
  [Biome.PolarOcean]: 'Polar Ocean',
  [Biome.Beyond]: 'Beyond',
};

/**
 * Map colors, roughly following the climate each biome sits in:
 * blues for water, greens for the wooded belt, sand and ochre for
 * the dry regions, greys and whites for the cold and high ones
 */
export const BIOME_COLORS: Record<Biome, string> = {
  [Biome.DeepOcean]: '#123a63',
  [Biome.Ocean]: '#1d5b90',
  [Biome.CoralReef]: '#2e9ab5',
  [Biome.Beach]: '#e2d6a2',
  [Biome.Mangrove]: '#4a6b4a',
  [Biome.Swamp]: '#54604a',
  [Biome.TropicalRainforest]: '#14532d',
  [Biome.TropicalSeasonalForest]: '#3f7d3a',
  [Biome.Savanna]: '#b8a044',
  [Biome.Desert]: '#dcb96b',
  [Biome.Shrubland]: '#9aa458',
  [Biome.Grassland]: '#7cae4c',
  [Biome.TemperateForest]: '#3c7a4b',
  [Biome.TemperateRainforest]: '#2f6b58',
  [Biome.ColdDesert]: '#b9b099',
  [Biome.Taiga]: '#3f6156',
  [Biome.Tundra]: '#8fa39a',
  [Biome.Mountain]: '#7a7268',
  [Biome.AlpineTundra]: '#a8a89c',
  [Biome.Glacier]: '#dff0f5',
  [Biome.Woodland]: '#5f9147',
  [Biome.Steppe]: '#c2b566',
  [Biome.MontaneForest]: '#46705a',
  [Biome.PolarOcean]: '#7fa8c4',
  // Nowhere on the map is ever painted with it; it is here because a
  // record can carry the biome and something has to answer for it
  [Biome.Beyond]: '#1a1030',
};

/**
 * Display names for the day-cycle periods
 */
export const TIME_OF_DAY_NAMES: Record<TimeOfDay, string> = {
  [TimeOfDay.Morning]: 'Morning',
  [TimeOfDay.Day]: 'Day',
  [TimeOfDay.Evening]: 'Evening',
  [TimeOfDay.Night]: 'Night',
};
