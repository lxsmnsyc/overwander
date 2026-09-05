/**
 * The duelling classes, split by what each table answers: who they
 * are, what they are called, what they field, where they stand and
 * what they say.
 */

export { TRAINER_CLASSES, TRAINER_REGIONS, TrainerClass } from './classes';
export { TRAINER_BASE_NAMES, TRAINER_NAMES } from './names';
export { TRAINER_TRADE, TRAINER_TRADES, getTradeClasses } from './trades';
export { default as TRAINER_TYPES } from './types';
export { default as TRAINER_CHARSETS } from './charsets';
export { BIOME_TRAINERS, getBiomeTrainers } from './biomes';
export { default as TRAINER_QUOTES } from './quotes';
export {
  ACE_PARTY_SIZE,
  ACE_TRAINER_LEVELS,
  TYPE_TRAINER_LEVELS,
  TYPE_TRAINER_PARTY_MAX,
  TYPE_TRAINER_PARTY_MIN,
  getTrainerPool,
  isAceTrainer,
  trainerLevels,
} from './parties';
