import { SpawnRarity, getSpawnRarity } from '../biome';
import { Types } from '../constants/types';
import Biome from '../ids/biome';
import type Regions from '../ids/regions';
import { Species } from '../ids/species';
import { getSpeciesByRegion, getSpeciesData, isBaseForm } from '../species';
import { EVERY_LAIR, getLairSpecies } from './lair';

/**
 * The people who stand at a duelling landmark: the Ace Trainer, who
 * fields the best of anything, and the type experts, who each field
 * one type and nothing else.
 *
 * A class is rolled per stop per window the way a grunt's party is,
 * so the same cell is a Bug Catcher one afternoon and a Channeler the
 * next — out of the ones that country puts on the road. Which class a player has put down is counted for life, and
 * that count is what the class' own title is worn off.
 */

const enum TrainerClass {
  /** No specialty and the strongest roadside party there is */
  AceTrainer = 0,
  Lass = 1,
  BlackBelt = 2,
  BirdKeeper = 3,
  Biker = 4,
  Hiker = 5,
  PokeManiac = 6,
  BugCatcher = 7,
  Channeler = 8,
  Burglar = 9,
  Swimmer = 10,
  Rocker = 11,
  Psychic = 12,
}

export { TrainerClass };

/**
 * TODO: Grass, Ice and Dragon have no trainer class here because
 * Kanto has none to give — its grass and ice trainers are Lasses and
 * Beauties, and its only dragon is Lance. Add the three when a region
 * that names them arrives, with the sheets to draw them
 */
export const TRAINER_CLASSES: TrainerClass[] = [
  TrainerClass.AceTrainer,
  TrainerClass.Lass,
  TrainerClass.BlackBelt,
  TrainerClass.BirdKeeper,
  TrainerClass.Biker,
  TrainerClass.Hiker,
  TrainerClass.PokeManiac,
  TrainerClass.BugCatcher,
  TrainerClass.Channeler,
  TrainerClass.Burglar,
  TrainerClass.Swimmer,
  TrainerClass.Rocker,
  TrainerClass.Psychic,
];

export const TRAINER_NAMES: Record<TrainerClass, string> = {
  [TrainerClass.AceTrainer]: 'Ace Trainer',
  [TrainerClass.Lass]: 'Lass',
  [TrainerClass.BlackBelt]: 'Black Belt',
  [TrainerClass.BirdKeeper]: 'Bird Keeper',
  [TrainerClass.Biker]: 'Biker',
  [TrainerClass.Hiker]: 'Hiker',
  [TrainerClass.PokeManiac]: 'Poké Maniac',
  [TrainerClass.BugCatcher]: 'Bug Catcher',
  [TrainerClass.Channeler]: 'Channeler',
  [TrainerClass.Burglar]: 'Burglar',
  [TrainerClass.Swimmer]: 'Swimmer',
  [TrainerClass.Rocker]: 'Rocker',
  [TrainerClass.Psychic]: 'Psychic',
};

/**
 * The type each class fields. The Ace has none: they field the best
 * of anything, which is what makes them the hard fight of the road
 */
export const TRAINER_TYPES: Record<TrainerClass, Types | null> = {
  [TrainerClass.AceTrainer]: null,
  [TrainerClass.Lass]: Types.Normal,
  [TrainerClass.BlackBelt]: Types.Fighting,
  [TrainerClass.BirdKeeper]: Types.Flying,
  [TrainerClass.Biker]: Types.Poison,
  [TrainerClass.Hiker]: Types.Ground,
  [TrainerClass.PokeManiac]: Types.Rock,
  [TrainerClass.BugCatcher]: Types.Bug,
  [TrainerClass.Channeler]: Types.Ghost,
  [TrainerClass.Burglar]: Types.Fire,
  [TrainerClass.Swimmer]: Types.Water,
  [TrainerClass.Rocker]: Types.Electric,
  [TrainerClass.Psychic]: Types.Psychic,
};

/**
 * The charsets a class may be standing in, rolled per stop the way a
 * wanderer's style is
 */
export const TRAINER_CHARSETS: Record<TrainerClass, string[]> = {
  [TrainerClass.AceTrainer]: [
    'characters/frlg/ace-trainer-f',
    'characters/frlg/ace-trainer-m',
    'characters/lgpe/ace-trainer',
  ],
  [TrainerClass.Lass]: ['characters/frlg/lass', 'characters/lgpe/lass'],
  [TrainerClass.BlackBelt]: ['characters/lgpe/black-belt', 'characters/frlg/crush-girl'],
  [TrainerClass.BirdKeeper]: ['characters/lgpe/bird-keeper'],
  [TrainerClass.Biker]: ['characters/frlg/roughneck', 'characters/lgpe/punk'],
  [TrainerClass.Hiker]: ['characters/frlg/hiker', 'characters/lgpe/hiker'],
  [TrainerClass.PokeManiac]: ['characters/lgpe/poke-maniac', 'characters/frlg/ruin-maniac'],
  [TrainerClass.BugCatcher]: ['characters/frlg/bug-catcher', 'characters/lgpe/bug-catcher'],
  [TrainerClass.Channeler]: ['characters/lgpe/channeler'],
  [TrainerClass.Burglar]: ['characters/lgpe/burglar'],
  [TrainerClass.Swimmer]: ['characters/lgpe/swimmer-f', 'characters/lgpe/swimmer-m'],
  [TrainerClass.Rocker]: ['characters/frlg/rocker', 'characters/lgpe/rocker'],
  [TrainerClass.Psychic]: ['characters/lgpe/psychic', 'characters/lgpe/juggler'],
};

/**
 * Which type experts a country puts on the road. A Swimmer is met on
 * the water, a Hiker on hard ground, and neither is anywhere else —
 * the same rule the gyms follow, so a player hunting one class knows
 * which country to walk. The Ace Trainer is in none of the lists: they
 * field every type and travel everywhere
 */
export const BIOME_TRAINERS: Record<Biome, TrainerClass[]> = {
  [Biome.DeepOcean]: [TrainerClass.Swimmer, TrainerClass.BirdKeeper],
  [Biome.Ocean]: [TrainerClass.Swimmer, TrainerClass.BirdKeeper],
  [Biome.CoralReef]: [TrainerClass.Swimmer, TrainerClass.PokeManiac],
  [Biome.Beach]: [TrainerClass.Swimmer, TrainerClass.Lass, TrainerClass.BirdKeeper],
  [Biome.Mangrove]: [TrainerClass.Swimmer, TrainerClass.Biker, TrainerClass.BugCatcher],
  [Biome.KelpForest]: [TrainerClass.Swimmer, TrainerClass.Psychic],
  [Biome.PolarOcean]: [TrainerClass.Swimmer, TrainerClass.BirdKeeper],
  [Biome.Glacier]: [TrainerClass.Swimmer, TrainerClass.Hiker],
  [Biome.Tundra]: [TrainerClass.Hiker, TrainerClass.BirdKeeper, TrainerClass.Lass],
  [Biome.Swamp]: [TrainerClass.Biker, TrainerClass.Channeler, TrainerClass.BugCatcher],
  [Biome.Bog]: [TrainerClass.Biker, TrainerClass.Channeler],
  [Biome.TropicalSeasonalForest]: [
    TrainerClass.BugCatcher,
    TrainerClass.Lass,
    TrainerClass.BirdKeeper,
  ],
  [Biome.Grassland]: [TrainerClass.Lass, TrainerClass.BugCatcher, TrainerClass.BirdKeeper],
  [Biome.TemperateForest]: [TrainerClass.BugCatcher, TrainerClass.Lass, TrainerClass.Channeler],
  [Biome.Woodland]: [TrainerClass.BugCatcher, TrainerClass.Lass, TrainerClass.Hiker],
  [Biome.Savanna]: [TrainerClass.BirdKeeper, TrainerClass.Hiker, TrainerClass.BlackBelt],
  [Biome.Steppe]: [TrainerClass.BirdKeeper, TrainerClass.Hiker, TrainerClass.Rocker],
  [Biome.Desert]: [TrainerClass.Hiker, TrainerClass.PokeManiac, TrainerClass.Burglar],
  [Biome.Volcano]: [TrainerClass.Burglar, TrainerClass.PokeManiac, TrainerClass.Hiker],
  [Biome.ColdDesert]: [TrainerClass.Hiker, TrainerClass.PokeManiac],
  [Biome.Mountain]: [TrainerClass.Hiker, TrainerClass.PokeManiac, TrainerClass.BlackBelt],
  [Biome.AlpineTundra]: [TrainerClass.Hiker, TrainerClass.BirdKeeper],
  [Biome.Badlands]: [TrainerClass.PokeManiac, TrainerClass.Biker, TrainerClass.BlackBelt],
  [Biome.RockyCoast]: [TrainerClass.PokeManiac, TrainerClass.Swimmer, TrainerClass.BirdKeeper],
  [Biome.TemperateRainforest]: [
    TrainerClass.BugCatcher,
    TrainerClass.Channeler,
    TrainerClass.Psychic,
  ],
  [Biome.MontaneForest]: [TrainerClass.Psychic, TrainerClass.BugCatcher, TrainerClass.Hiker],
  [Biome.Beyond]: [TrainerClass.Psychic, TrainerClass.Channeler, TrainerClass.Rocker],
  [Biome.TropicalRainforest]: [TrainerClass.BugCatcher, TrainerClass.Psychic, TrainerClass.Biker],
  [Biome.Shrubland]: [TrainerClass.Lass, TrainerClass.BugCatcher, TrainerClass.Rocker],
  [Biome.Taiga]: [TrainerClass.Hiker, TrainerClass.BugCatcher, TrainerClass.BirdKeeper],
};

/**
 * Who may be duelling in this country: its own type experts, and the
 * Ace, who belongs to no country
 */
export function getBiomeTrainers(biome: Biome): TrainerClass[] {
  return [TrainerClass.AceTrainer, ...BIOME_TRAINERS[biome]];
}

/** What each says as the duel is put to the player */
export const TRAINER_QUOTES: Record<TrainerClass, string> = {
  [TrainerClass.AceTrainer]: 'I only travel with the best. Let us see what you travel with.',
  [TrainerClass.Lass]: 'Hi! Do you want to battle? I have been practising.',
  [TrainerClass.BlackBelt]: 'My pokemon train as hard as I do. Try them.',
  [TrainerClass.BirdKeeper]: 'My birds have been circling you since you came into view.',
  [TrainerClass.Biker]: 'Nice road. It is ours. Fight us for it.',
  [TrainerClass.Hiker]: 'I walked up here. You can walk through me.',
  [TrainerClass.PokeManiac]: 'You have not seen a rock type until you have seen mine!',
  [TrainerClass.BugCatcher]: 'I caught every one of these myself. Every single one!',
  [TrainerClass.Channeler]: 'Something is standing behind you. It is mine.',
  [TrainerClass.Burglar]: 'I take what I want. Today I want your win streak.',
  [TrainerClass.Swimmer]: 'I swam here. Fighting you is the easy part.',
  [TrainerClass.Rocker]: 'Turn it up! My pokemon like it loud and shocking.',
  [TrainerClass.Psychic]: 'You will decide to battle me. I have already seen it.',
};

/**
 * What the Ace fields: five fully-grown pokemon, and none of them the
 * biome's business
 */
export const ACE_PARTY_SIZE = 5;

export const ACE_TRAINER_LEVELS: [minimum: number, maximum: number] = [60, 80];

/**
 * What a type expert fields: three to five of their own type, the
 * count rolled with the party. They are the roadside fight a player
 * meets long before the Ace
 */
export const TYPE_TRAINER_PARTY_MIN = 3;
export const TYPE_TRAINER_PARTY_MAX = 5;

export const TYPE_TRAINER_LEVELS: [minimum: number, maximum: number] = [40, 60];

/** The level band a class fights in */
export function trainerLevels(trainer: TrainerClass): [minimum: number, maximum: number] {
  return trainer === TrainerClass.AceTrainer ? ACE_TRAINER_LEVELS : TYPE_TRAINER_LEVELS;
}

const LAIR_SPECIES = new Set(EVERY_LAIR.map(getLairSpecies));

/**
 * What a class may field: the region's fully-grown species of their
 * own type, or of any type for the Ace. Legendaries stay out — one
 * belongs to its raid — and so do the alternate forms and the egg
 */
export function getTrainerPool(region: Regions, trainer: TrainerClass): Species[] {
  const type = TRAINER_TYPES[trainer];

  return getSpeciesByRegion(region).filter((species) => {
    if (species === Species.Egg || LAIR_SPECIES.has(species) || !isBaseForm(species)) {
      return false;
    }
    // "Rare" is the shape of the line rather than the odds of meeting
    // one: a species nothing evolves into is what a trainer this far
    // along would be walking with
    if (getSpawnRarity(species) !== SpawnRarity.Rare) {
      return false;
    }
    return type == null || getSpeciesData(species).types.includes(type);
  });
}
