/**
 * The duelling classes. Who they are, what they field and wear, what
 * they are called and say, and where they stand are data, read in
 * `classes.ts` and `biomes.ts`; what is worked out from them is here.
 */

export {
  TRAINER_BASE_NAMES,
  TRAINER_CHARSETS,
  TRAINER_CLASSES,
  TRAINER_QUOTES,
  TRAINER_REGIONS,
  TRAINER_TRADE,
  TRAINER_TYPES,
  TrainerClass,
} from './classes';
export { TRAINER_NAMES, TRAINER_SHEET_NAMES, trainerNameIn } from './names';
export { TRAINER_TRADES, getTradeClasses } from './trades';
export { BIOME_TRAINERS, getBiomeTrainers } from './biomes';
export {
  ACE_PARTY_SIZE,
  ACE_TRAINER_LEVELS,
  TYPE_TRAINER_LEVELS,
  TYPE_TRAINER_PARTY_MAX,
  TYPE_TRAINER_PARTY_MIN,
  getTrainerPool,
  isAceTrainer,
  isGrownInRegion,
  trainerLevels,
} from './parties';
