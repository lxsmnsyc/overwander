import registerPools from './yaml';

export {
  boostFamilyEntries,
  boostFamilyWeights,
  boostTypeEntries,
  boostTypeWeights,
  countLineStages,
  fitsSurface,
  getBiomeRoster,
  getClassPool,
  getSpawnClass,
  SpawnClass,
  getLineStage,
  getEggPool,
  getSpawnPool,
  hasSpawnPool,
  getSpawnRarity,
  getTownPool,
  isAwaitingBaby,
  isAwaitingEvolution,
  isGrownSpecies,
  isLegendarySpecies,
  getSpeciesHome,
  listSpeciesHabitats,
  listTownHabitats,
  TIMES_OF_DAY,
  isMythicalSpecies,
  isPrizedSpecies,
  pickFromEntries,
  pickSpawn,
  MYTHICAL_SPAWN_ODDS,
  PRIZED_SPAWN_ODDS,
  PRIZED_WEIGHT,
  registerCavePool,
  registerIcePool,
  registerSpawnPool,
  registerTownPool,
  registerWaterPool,
  spawnBand,
  spawnOdds,
  spawnRanks,
  SPAWN_BAND_KEYS,
  SPECIAL_SPAWN_ODDS,
  SpawnRarity,
} from './__create';
export type { SpawnEntry, SpawnPool, SpawnRarityGroups, SpeciesHabitat } from './__create';
export { BIOME_COLORS, BIOME_NAMES, SPAWN_RARITY_NAMES, TIME_OF_DAY_NAMES } from './names';

export default function registerBiomeSpawns(): void {
  // Written as YAML, a file per biome plus the cave's and the towns' (see ./yaml.ts)
  registerPools(import.meta.glob('./pools/*.yaml', { eager: true, import: 'default' }));
}
