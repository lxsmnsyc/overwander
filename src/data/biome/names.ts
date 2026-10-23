import type Biome from '../ids/biome';
import type { SpawnRarity, TimeOfDay } from '../ids/biome';
import { BIOME_IDS, SPAWN_RARITY_IDS, TIME_OF_DAY_IDS } from '../ids/names';
import biomeNamesFile from '../text/en/biomes.yaml';
import rarityNamesFile from '../text/en/spawn-rarities.yaml';
import timeNamesFile from '../text/en/times-of-day.yaml';
import { stringTable } from '../yaml';
import colorsFile from './colors.yaml';

/** Display names for the biomes; the enum itself carries only ids */
export const BIOME_NAMES = stringTable<Biome>(BIOME_IDS, biomeNamesFile, 'text/en/biomes.yaml');

/** Map colors, roughly following the climate each biome sits in */
export const BIOME_COLORS = stringTable<Biome>(BIOME_IDS, colorsFile, 'biome/colors.yaml');

/** Display names for the day-cycle periods */
export const TIME_OF_DAY_NAMES = stringTable<TimeOfDay>(
  TIME_OF_DAY_IDS,
  timeNamesFile,
  'text/en/times-of-day.yaml',
);

/** How lucky a walk has to be, in a word */
export const SPAWN_RARITY_NAMES = stringTable<SpawnRarity>(
  SPAWN_RARITY_IDS,
  rarityNamesFile,
  'text/en/spawn-rarities.yaml',
);
