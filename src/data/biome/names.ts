import type Biome from '../ids/biome';
import type { SpawnRarity, TimeOfDay } from '../ids/biome';
import { BIOME_IDS, SPAWN_RARITY_IDS, TIME_OF_DAY_IDS } from '../ids/names';
import { localeStringTable, stringTable } from '../yaml';
import colorsFile from './colors.yaml';

/** Display names for the biomes; the enum itself carries only ids */
export const BIOME_NAMES = localeStringTable<Biome>(
  BIOME_IDS,
  import.meta.glob('../text/*/biomes.yaml', { eager: true, import: 'default' }),
  'text/<locale>/biomes.yaml',
);

/** Map colors, roughly following the climate each biome sits in */
export const BIOME_COLORS = stringTable<Biome>(BIOME_IDS, colorsFile, 'biome/colors.yaml');

/** Display names for the day-cycle periods */
export const TIME_OF_DAY_NAMES = localeStringTable<TimeOfDay>(
  TIME_OF_DAY_IDS,
  import.meta.glob('../text/*/times-of-day.yaml', { eager: true, import: 'default' }),
  'text/<locale>/times-of-day.yaml',
);

/** How lucky a walk has to be, in a word */
export const SPAWN_RARITY_NAMES = localeStringTable<SpawnRarity>(
  SPAWN_RARITY_IDS,
  import.meta.glob('../text/*/spawn-rarities.yaml', { eager: true, import: 'default' }),
  'text/<locale>/spawn-rarities.yaml',
);
