import registerAlpineTundraSpawns from './alpine-tundra';
import registerBadlandsSpawns from './badlands';
import registerBeachSpawns from './beach';
import registerBogSpawns from './bog';
import registerColdDesertSpawns from './cold-desert';
import registerCoralReefSpawns from './coral-reef';
import registerDeepOceanSpawns from './deep-ocean';
import registerDesertSpawns from './desert';
import registerGlacierSpawns from './glacier';
import registerGrasslandSpawns from './grassland';
import registerKelpForestSpawns from './kelp-forest';
import registerMangroveSpawns from './mangrove';
import registerMontaneForestSpawns from './montane-forest';
import registerMountainSpawns from './mountain';
import registerOceanSpawns from './ocean';
import registerPolarOceanSpawns from './polar-ocean';
import registerRockyCoastSpawns from './rocky-coast';
import registerSavannaSpawns from './savanna';
import registerShrublandSpawns from './shrubland';
import registerSteppeSpawns from './steppe';
import registerSwampSpawns from './swamp';
import registerTaigaSpawns from './taiga';
import registerTemperateForestSpawns from './temperate-forest';
import registerTemperateRainforestSpawns from './temperate-rainforest';
import registerTropicalRainforestSpawns from './tropical-rainforest';
import registerTropicalSeasonalForestSpawns from './tropical-seasonal-forest';
import registerTundraSpawns from './tundra';
import registerVolcanoSpawns from './volcano';
import registerWoodlandSpawns from './woodland';

export {
  boostFamilyEntries,
  boostFamilyWeights,
  getEggPool,
  getSpawnPool,
  getSpawnRarity,
  isAwaitingBaby,
  isLegendarySpecies,
  listSpeciesHabitats,
  TIMES_OF_DAY,
  isMythicalSpecies,
  isPrizedSpecies,
  pickFromEntries,
  pickSpawn,
  PRIZED_SPAWN_ODDS,
  RARE_SPAWN_ODDS,
  registerSpawnPool,
  spawnBand,
  SPECIAL_SPAWN_ODDS,
  SpawnRarity,
} from './__create';
export type { SpawnEntry, SpawnPool, SpawnRarityGroups, SpeciesHabitat } from './__create';
export { BIOME_COLORS, BIOME_NAMES, SPAWN_RARITY_NAMES, TIME_OF_DAY_NAMES } from './names';

export default function registerBiomeSpawns(): void {
  registerAlpineTundraSpawns();
  registerBadlandsSpawns();
  registerBeachSpawns();
  registerBogSpawns();
  registerColdDesertSpawns();
  registerCoralReefSpawns();
  registerDeepOceanSpawns();
  registerDesertSpawns();
  registerGlacierSpawns();
  registerGrasslandSpawns();
  registerKelpForestSpawns();
  registerMangroveSpawns();
  registerMontaneForestSpawns();
  registerMountainSpawns();
  registerOceanSpawns();
  registerPolarOceanSpawns();
  registerRockyCoastSpawns();
  registerSavannaSpawns();
  registerShrublandSpawns();
  registerSteppeSpawns();
  registerSwampSpawns();
  registerTaigaSpawns();
  registerTemperateForestSpawns();
  registerTemperateRainforestSpawns();
  registerTropicalRainforestSpawns();
  registerTropicalSeasonalForestSpawns();
  registerTundraSpawns();
  registerVolcanoSpawns();
  registerWoodlandSpawns();
}
