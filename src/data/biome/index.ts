import registerAlpineTundraSpawns from './alpine-tundra';
import registerBeachSpawns from './beach';
import registerColdDesertSpawns from './cold-desert';
import registerCoralReefSpawns from './coral-reef';
import registerDeepOceanSpawns from './deep-ocean';
import registerDesertSpawns from './desert';
import registerGlacierSpawns from './glacier';
import registerGrasslandSpawns from './grassland';
import registerMangroveSpawns from './mangrove';
import registerMontaneForestSpawns from './montane-forest';
import registerMountainSpawns from './mountain';
import registerOceanSpawns from './ocean';
import registerPolarOceanSpawns from './polar-ocean';
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
import registerWoodlandSpawns from './woodland';

export {
  getSpawnPool,
  getSpawnRarity,
  isLegendarySpecies,
  pickSpawn,
  RARE_SPAWN_ODDS,
  registerSpawnPool,
  SPECIAL_SPAWN_ODDS,
  SpawnRarity,
} from './__create';
export type { SpawnEntry, SpawnPool } from './__create';
export { BIOME_COLORS, BIOME_NAMES, TIME_OF_DAY_NAMES } from './names';

export default function registerBiomeSpawns(): void {
  registerAlpineTundraSpawns();
  registerBeachSpawns();
  registerColdDesertSpawns();
  registerCoralReefSpawns();
  registerDeepOceanSpawns();
  registerDesertSpawns();
  registerGlacierSpawns();
  registerGrasslandSpawns();
  registerMangroveSpawns();
  registerMontaneForestSpawns();
  registerMountainSpawns();
  registerOceanSpawns();
  registerPolarOceanSpawns();
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
  registerWoodlandSpawns();
}
