import { SpawnRarity, getSpawnRarity } from '../biome';
import { Types } from '../constants/types';
import Biome from '../ids/biome';
import Regions from '../ids/regions';
import { Species } from '../ids/species';
import { getSpeciesByRegion, getSpeciesData, isBaseForm } from '../species';
import { REGION_NAMES } from '../species/regions';
import { EVERY_LAIR, getLairResidents } from './lair';

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
  Sage = 13,
  Skier = 14,
  Scientist = 15,
  /** Johto's own of the trades both regions put on the road */
  JohtoPokeManiac = 16,
  JohtoBurglar = 17,
  JohtoAceTrainer = 18,
  JohtoLass = 19,
  JohtoBlackBelt = 20,
  JohtoBirdKeeper = 21,
  JohtoBiker = 22,
  JohtoBugCatcher = 23,
  JohtoSwimmer = 24,
  Firebreather = 25,
  Medium = 26,
  Teacher = 27,
  SchoolKid = 28,
  Youngster = 29,
  Camper = 30,
}

export { TrainerClass };

/**
 * A class belongs to a region, and the trades both regions have are
 * here twice: a Swimmer met on Kanto's water and one met on Johto's
 * are the same trade in two places, drawn differently and fielding
 * what their own region grows.
 *
 * Johto's own answer the types Kanto had nobody for besides: its
 * sages field the Bellsprout of Sprout Tower, its skiers the ice of
 * the north, its scientists the steel it is the first region to
 * grow, its maniacs the dragons of the Den, and its burglars the
 * dark that works the roads outside it
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
  TrainerClass.Sage,
  TrainerClass.Skier,
  TrainerClass.Scientist,
  TrainerClass.JohtoPokeManiac,
  TrainerClass.JohtoBurglar,
  TrainerClass.JohtoAceTrainer,
  TrainerClass.JohtoLass,
  TrainerClass.JohtoBlackBelt,
  TrainerClass.JohtoBirdKeeper,
  TrainerClass.JohtoBiker,
  TrainerClass.JohtoBugCatcher,
  TrainerClass.JohtoSwimmer,
  TrainerClass.Firebreather,
  TrainerClass.Medium,
  TrainerClass.Teacher,
  TrainerClass.SchoolKid,
  TrainerClass.Youngster,
  TrainerClass.Camper,
];

/**
 * What the mainline calls each of them. Two regions' worth of the
 * same trade share a name here; `TRAINER_NAMES` is what tells them
 * apart on a screen
 */
export const TRAINER_BASE_NAMES: Record<TrainerClass, string> = {
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
  [TrainerClass.Sage]: 'Sage',
  [TrainerClass.Skier]: 'Skier',
  [TrainerClass.Scientist]: 'Scientist',
  [TrainerClass.JohtoPokeManiac]: 'Poké Maniac',
  [TrainerClass.JohtoBurglar]: 'Burglar',
  [TrainerClass.JohtoAceTrainer]: 'Ace Trainer',
  [TrainerClass.JohtoLass]: 'Lass',
  [TrainerClass.JohtoBlackBelt]: 'Black Belt',
  [TrainerClass.JohtoBirdKeeper]: 'Bird Keeper',
  [TrainerClass.JohtoBiker]: 'Biker',
  [TrainerClass.JohtoBugCatcher]: 'Bug Catcher',
  [TrainerClass.JohtoSwimmer]: 'Swimmer',
  [TrainerClass.Firebreather]: 'Firebreather',
  [TrainerClass.Medium]: 'Medium',
  [TrainerClass.Teacher]: 'Teacher',
  [TrainerClass.SchoolKid]: 'School Kid',
  [TrainerClass.Youngster]: 'Youngster',
  [TrainerClass.Camper]: 'Camper',
};

/**
 * Which region's road each stands on, and whose species they field.
 * The class says this rather than the country they are met in: the
 * world is one map, and a Johto Swimmer brings Johto's water
 * wherever the water is
 */
export const TRAINER_REGIONS: Record<TrainerClass, Regions> = {
  [TrainerClass.AceTrainer]: Regions.Kanto,
  [TrainerClass.Lass]: Regions.Kanto,
  [TrainerClass.BlackBelt]: Regions.Kanto,
  [TrainerClass.BirdKeeper]: Regions.Kanto,
  [TrainerClass.Biker]: Regions.Kanto,
  [TrainerClass.Hiker]: Regions.Kanto,
  [TrainerClass.PokeManiac]: Regions.Kanto,
  [TrainerClass.BugCatcher]: Regions.Kanto,
  [TrainerClass.Channeler]: Regions.Kanto,
  [TrainerClass.Burglar]: Regions.Kanto,
  [TrainerClass.Swimmer]: Regions.Kanto,
  [TrainerClass.Rocker]: Regions.Kanto,
  [TrainerClass.Psychic]: Regions.Kanto,
  [TrainerClass.Sage]: Regions.Johto,
  [TrainerClass.Skier]: Regions.Johto,
  [TrainerClass.Scientist]: Regions.Johto,
  [TrainerClass.JohtoPokeManiac]: Regions.Johto,
  [TrainerClass.JohtoBurglar]: Regions.Johto,
  [TrainerClass.JohtoAceTrainer]: Regions.Johto,
  [TrainerClass.JohtoLass]: Regions.Johto,
  [TrainerClass.JohtoBlackBelt]: Regions.Johto,
  [TrainerClass.JohtoBirdKeeper]: Regions.Johto,
  [TrainerClass.JohtoBiker]: Regions.Johto,
  [TrainerClass.JohtoBugCatcher]: Regions.Johto,
  [TrainerClass.JohtoSwimmer]: Regions.Johto,
  [TrainerClass.Firebreather]: Regions.Johto,
  [TrainerClass.Medium]: Regions.Johto,
  [TrainerClass.Teacher]: Regions.Johto,
  [TrainerClass.SchoolKid]: Regions.Johto,
  [TrainerClass.Youngster]: Regions.Johto,
  [TrainerClass.Camper]: Regions.Johto,
};

/**
 * The trade a class is one region's version of.
 *
 * A Swimmer met on Kanto's water and one met on Johto's are the same
 * trade, and what is counted about a trade is counted once: the wins
 * add up to one line and one title. The coats do not, since a coat is
 * one region's own, and beating Kanto's swimmers never dressed
 * anybody as a Johto one
 */
export const TRAINER_TRADE: Record<TrainerClass, TrainerClass> = {
  [TrainerClass.AceTrainer]: TrainerClass.AceTrainer,
  [TrainerClass.Lass]: TrainerClass.Lass,
  [TrainerClass.BlackBelt]: TrainerClass.BlackBelt,
  [TrainerClass.BirdKeeper]: TrainerClass.BirdKeeper,
  [TrainerClass.Biker]: TrainerClass.Biker,
  [TrainerClass.Hiker]: TrainerClass.Hiker,
  [TrainerClass.PokeManiac]: TrainerClass.PokeManiac,
  [TrainerClass.BugCatcher]: TrainerClass.BugCatcher,
  [TrainerClass.Channeler]: TrainerClass.Channeler,
  [TrainerClass.Burglar]: TrainerClass.Burglar,
  [TrainerClass.Swimmer]: TrainerClass.Swimmer,
  [TrainerClass.Rocker]: TrainerClass.Rocker,
  [TrainerClass.Psychic]: TrainerClass.Psychic,
  [TrainerClass.Sage]: TrainerClass.Sage,
  [TrainerClass.Skier]: TrainerClass.Skier,
  [TrainerClass.Scientist]: TrainerClass.Scientist,
  [TrainerClass.JohtoPokeManiac]: TrainerClass.PokeManiac,
  [TrainerClass.JohtoBurglar]: TrainerClass.Burglar,
  [TrainerClass.JohtoAceTrainer]: TrainerClass.AceTrainer,
  [TrainerClass.JohtoLass]: TrainerClass.Lass,
  [TrainerClass.JohtoBlackBelt]: TrainerClass.BlackBelt,
  [TrainerClass.JohtoBirdKeeper]: TrainerClass.BirdKeeper,
  [TrainerClass.JohtoBiker]: TrainerClass.Biker,
  [TrainerClass.JohtoBugCatcher]: TrainerClass.BugCatcher,
  [TrainerClass.JohtoSwimmer]: TrainerClass.Swimmer,
  [TrainerClass.Firebreather]: TrainerClass.Firebreather,
  [TrainerClass.Medium]: TrainerClass.Medium,
  [TrainerClass.Teacher]: TrainerClass.Teacher,
  [TrainerClass.SchoolKid]: TrainerClass.SchoolKid,
  [TrainerClass.Youngster]: TrainerClass.Youngster,
  [TrainerClass.Camper]: TrainerClass.Camper,
};

/**
 * Every trade there is, each named by the class that stands for it.
 * This is what carries a line and a title; the classes are what
 * carry the coats
 */
export const TRAINER_TRADES: TrainerClass[] = TRAINER_CLASSES.filter(
  (trainer) => TRAINER_TRADE[trainer] === trainer,
);

/** The classes that are one trade, in class order */
export function getTradeClasses(trade: TrainerClass): TrainerClass[] {
  return TRAINER_CLASSES.filter((trainer) => TRAINER_TRADE[trainer] === trade);
}

/**
 * What a screen calls each class: the mainline name, with the region
 * after it only where both regions put the same trade on the road.
 * A name nobody shares is the mainline's own
 */
export const TRAINER_NAMES: Record<TrainerClass, string> = buildTrainerNames();

function buildTrainerNames(): Record<TrainerClass, string> {
  const seen = new Set<string>();
  const shared = new Set<string>();

  for (const trainer of TRAINER_CLASSES) {
    const name = TRAINER_BASE_NAMES[trainer];

    if (seen.has(name)) {
      shared.add(name);
    }
    seen.add(name);
  }

  const named: Record<TrainerClass, string> = { ...TRAINER_BASE_NAMES };

  for (const trainer of TRAINER_CLASSES) {
    const name = TRAINER_BASE_NAMES[trainer];
    const region = REGION_NAMES[TRAINER_REGIONS[trainer]];

    if (shared.has(name)) {
      named[trainer] = `${name} (${region.slice(0, 1).toUpperCase()}${region.slice(1)})`;
    }
  }
  return named;
}

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
  [TrainerClass.Sage]: Types.Grass,
  [TrainerClass.Skier]: Types.Ice,
  [TrainerClass.Scientist]: Types.Steel,
  // Johto's two answer the types Kanto has nobody for: the Den's
  // maniacs keep dragons, and its burglars work after dark
  [TrainerClass.JohtoPokeManiac]: Types.Dragon,
  [TrainerClass.JohtoBurglar]: Types.Dark,
  [TrainerClass.JohtoAceTrainer]: null,
  [TrainerClass.JohtoLass]: Types.Normal,
  [TrainerClass.JohtoBlackBelt]: Types.Fighting,
  [TrainerClass.JohtoBirdKeeper]: Types.Flying,
  [TrainerClass.JohtoBiker]: Types.Poison,
  [TrainerClass.JohtoBugCatcher]: Types.Bug,
  [TrainerClass.JohtoSwimmer]: Types.Water,
  [TrainerClass.Firebreather]: Types.Fire,
  [TrainerClass.Medium]: Types.Ghost,
  [TrainerClass.Teacher]: Types.Psychic,
  [TrainerClass.SchoolKid]: Types.Electric,
  [TrainerClass.Youngster]: Types.Ground,
  [TrainerClass.Camper]: Types.Rock,
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
  // The tower's sages and the two elders who keep it, who are the
  // same people a few decades apart
  [TrainerClass.Sage]: [
    'characters/hgss/sage',
    'characters/hgss/sage-1',
    'characters/hgss/sage-2',
    'characters/hgss/elder-1',
    'characters/hgss/elder-2',
  ],
  [TrainerClass.Skier]: ['characters/hgss/skier', 'characters/hgss/boarder'],
  [TrainerClass.Scientist]: ['characters/hgss/scientist', 'characters/lgpe/scientist'],
  [TrainerClass.JohtoPokeManiac]: ['characters/hgss/poke-maniac'],
  [TrainerClass.JohtoBurglar]: ['characters/hgss/burglar'],
  [TrainerClass.JohtoAceTrainer]: ['characters/hgss/ace-trainer', 'characters/hgss/ace-trainer-f'],
  [TrainerClass.JohtoLass]: ['characters/hgss/lass'],
  [TrainerClass.JohtoBlackBelt]: ['characters/hgss/black-belt'],
  [TrainerClass.JohtoBirdKeeper]: ['characters/hgss/bird-keeper'],
  [TrainerClass.JohtoBiker]: ['characters/hgss/biker'],
  [TrainerClass.JohtoBugCatcher]: ['characters/hgss/bug-catcher'],
  [TrainerClass.JohtoSwimmer]: ['characters/hgss/swimmer', 'characters/hgss/swimmer-f'],
  [TrainerClass.Firebreather]: ['characters/hgss/firebreather'],
  [TrainerClass.Medium]: ['characters/hgss/medium'],
  [TrainerClass.Teacher]: ['characters/hgss/teacher'],
  [TrainerClass.SchoolKid]: ['characters/hgss/school-kid'],
  [TrainerClass.Youngster]: ['characters/hgss/youngster'],
  // The two halves of one trade, the way the Black Belt keeps the
  // Crush Girl's sheet
  [TrainerClass.Camper]: ['characters/lgpe/camper', 'characters/lgpe/picnicker'],
};

/**
 * Which type experts a country puts on the road. A Swimmer is met on
 * the water, a Hiker on hard ground, and neither is anywhere else —
 * the same rule the gyms follow, so a player hunting one class knows
 * which country to walk. The Ace Trainer is in none of the lists: they
 * field every type and travel everywhere
 */
export const BIOME_TRAINERS: Record<Biome, TrainerClass[]> = {
  [Biome.DeepOcean]: [
    TrainerClass.Swimmer,
    TrainerClass.BirdKeeper,
    TrainerClass.JohtoPokeManiac,
    TrainerClass.JohtoSwimmer,
    TrainerClass.JohtoBirdKeeper,
  ],
  [Biome.Ocean]: [
    TrainerClass.Swimmer,
    TrainerClass.BirdKeeper,
    TrainerClass.JohtoSwimmer,
    TrainerClass.JohtoBirdKeeper,
  ],
  [Biome.CoralReef]: [TrainerClass.Swimmer, TrainerClass.PokeManiac, TrainerClass.JohtoSwimmer],
  [Biome.Beach]: [
    TrainerClass.Swimmer,
    TrainerClass.Lass,
    TrainerClass.BirdKeeper,
    TrainerClass.JohtoSwimmer,
    TrainerClass.JohtoLass,
    TrainerClass.JohtoBirdKeeper,
  ],
  [Biome.Mangrove]: [
    TrainerClass.Swimmer,
    TrainerClass.Biker,
    TrainerClass.BugCatcher,
    TrainerClass.JohtoSwimmer,
    TrainerClass.JohtoBiker,
    TrainerClass.JohtoBugCatcher,
  ],
  [Biome.KelpForest]: [
    TrainerClass.Swimmer,
    TrainerClass.Psychic,
    TrainerClass.JohtoSwimmer,
    TrainerClass.Teacher,
  ],
  [Biome.PolarOcean]: [
    TrainerClass.Swimmer,
    TrainerClass.BirdKeeper,
    TrainerClass.Skier,
    TrainerClass.JohtoSwimmer,
    TrainerClass.JohtoBirdKeeper,
  ],
  [Biome.Glacier]: [
    TrainerClass.Swimmer,
    TrainerClass.Hiker,
    TrainerClass.Skier,
    TrainerClass.JohtoSwimmer,
  ],
  [Biome.Tundra]: [
    TrainerClass.Hiker,
    TrainerClass.BirdKeeper,
    TrainerClass.Lass,
    TrainerClass.Skier,
    TrainerClass.JohtoBirdKeeper,
    TrainerClass.JohtoLass,
  ],
  [Biome.Swamp]: [
    TrainerClass.Biker,
    TrainerClass.Channeler,
    TrainerClass.BugCatcher,
    TrainerClass.JohtoBurglar,
    TrainerClass.JohtoBiker,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.Medium,
  ],
  [Biome.Bog]: [
    TrainerClass.Biker,
    TrainerClass.Channeler,
    TrainerClass.JohtoBurglar,
    TrainerClass.JohtoBiker,
    TrainerClass.Medium,
  ],
  [Biome.TropicalSeasonalForest]: [
    TrainerClass.BugCatcher,
    TrainerClass.Lass,
    TrainerClass.BirdKeeper,
    TrainerClass.Sage,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.JohtoLass,
    TrainerClass.JohtoBirdKeeper,
  ],
  [Biome.Grassland]: [
    TrainerClass.Lass,
    TrainerClass.BugCatcher,
    TrainerClass.BirdKeeper,
    TrainerClass.Sage,
    TrainerClass.JohtoLass,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.JohtoBirdKeeper,
    TrainerClass.Youngster,
  ],
  [Biome.TemperateForest]: [
    TrainerClass.BugCatcher,
    TrainerClass.Lass,
    TrainerClass.Channeler,
    TrainerClass.Sage,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.JohtoLass,
    TrainerClass.Medium,
  ],
  [Biome.Woodland]: [
    TrainerClass.BugCatcher,
    TrainerClass.Lass,
    TrainerClass.Hiker,
    TrainerClass.Sage,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.JohtoLass,
  ],
  [Biome.Savanna]: [
    TrainerClass.BirdKeeper,
    TrainerClass.Hiker,
    TrainerClass.BlackBelt,
    TrainerClass.JohtoBirdKeeper,
    TrainerClass.JohtoBlackBelt,
    TrainerClass.Youngster,
  ],
  [Biome.Steppe]: [
    TrainerClass.BirdKeeper,
    TrainerClass.Hiker,
    TrainerClass.Rocker,
    TrainerClass.JohtoBirdKeeper,
    TrainerClass.SchoolKid,
    TrainerClass.Youngster,
  ],
  [Biome.Desert]: [
    TrainerClass.Hiker,
    TrainerClass.PokeManiac,
    TrainerClass.Burglar,
    TrainerClass.Firebreather,
    TrainerClass.Youngster,
  ],
  [Biome.Volcano]: [
    TrainerClass.Burglar,
    TrainerClass.PokeManiac,
    TrainerClass.Hiker,
    TrainerClass.Scientist,
    TrainerClass.JohtoPokeManiac,
    TrainerClass.Firebreather,
  ],
  [Biome.ColdDesert]: [
    TrainerClass.Hiker,
    TrainerClass.PokeManiac,
    TrainerClass.Skier,
    TrainerClass.Scientist,
    TrainerClass.Camper,
  ],
  [Biome.Mountain]: [
    TrainerClass.Hiker,
    TrainerClass.PokeManiac,
    TrainerClass.BlackBelt,
    TrainerClass.Scientist,
    TrainerClass.JohtoPokeManiac,
    TrainerClass.JohtoBlackBelt,
    TrainerClass.Camper,
  ],
  [Biome.AlpineTundra]: [
    TrainerClass.Hiker,
    TrainerClass.BirdKeeper,
    TrainerClass.Skier,
    TrainerClass.JohtoBirdKeeper,
  ],
  [Biome.Badlands]: [
    TrainerClass.PokeManiac,
    TrainerClass.Biker,
    TrainerClass.BlackBelt,
    TrainerClass.Scientist,
    TrainerClass.JohtoBurglar,
    TrainerClass.JohtoBiker,
    TrainerClass.JohtoBlackBelt,
    TrainerClass.Firebreather,
    TrainerClass.Youngster,
    TrainerClass.Camper,
  ],
  [Biome.RockyCoast]: [
    TrainerClass.PokeManiac,
    TrainerClass.Swimmer,
    TrainerClass.BirdKeeper,
    TrainerClass.JohtoSwimmer,
    TrainerClass.JohtoBirdKeeper,
    TrainerClass.Camper,
  ],
  [Biome.TemperateRainforest]: [
    TrainerClass.BugCatcher,
    TrainerClass.Channeler,
    TrainerClass.Psychic,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.Medium,
    TrainerClass.Teacher,
  ],
  [Biome.MontaneForest]: [
    TrainerClass.Psychic,
    TrainerClass.BugCatcher,
    TrainerClass.Hiker,
    TrainerClass.Sage,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.Teacher,
  ],
  [Biome.Beyond]: [
    TrainerClass.Psychic,
    TrainerClass.Channeler,
    TrainerClass.Rocker,
    TrainerClass.Scientist,
    TrainerClass.JohtoPokeManiac,
    TrainerClass.JohtoBurglar,
    TrainerClass.Medium,
    TrainerClass.Teacher,
    TrainerClass.SchoolKid,
  ],
  [Biome.TropicalRainforest]: [
    TrainerClass.BugCatcher,
    TrainerClass.Psychic,
    TrainerClass.Biker,
    TrainerClass.Sage,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.JohtoBiker,
    TrainerClass.Teacher,
  ],
  [Biome.Shrubland]: [
    TrainerClass.Lass,
    TrainerClass.BugCatcher,
    TrainerClass.Rocker,
    TrainerClass.Sage,
    TrainerClass.JohtoLass,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.SchoolKid,
  ],
  [Biome.Taiga]: [
    TrainerClass.Hiker,
    TrainerClass.BugCatcher,
    TrainerClass.BirdKeeper,
    TrainerClass.Skier,
    TrainerClass.JohtoBurglar,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.JohtoBirdKeeper,
  ],
};

/**
 * Who may be duelling in this country: its own type experts, and the
 * Ace, who belongs to no country
 */
export function getBiomeTrainers(biome: Biome): TrainerClass[] {
  return [TrainerClass.AceTrainer, TrainerClass.JohtoAceTrainer, ...BIOME_TRAINERS[biome]];
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
  [TrainerClass.Sage]: 'The tower teaches patience. My pokemon have more of it than you.',
  [TrainerClass.Skier]: 'I came down this slope faster than you can think. Keep up.',
  [TrainerClass.Scientist]: 'My pokemon are steel. Yours are, at best, interesting data.',
  [TrainerClass.JohtoPokeManiac]:
    'I have raised dragons since I could walk. Show me what you raised.',
  [TrainerClass.JohtoBurglar]: 'Nothing good happens on this road after dark. I am the reason.',
  [TrainerClass.JohtoAceTrainer]: 'I have walked both regions. You have walked into me.',
  [TrainerClass.JohtoLass]: 'Everyone back home says I am the best. Let us find out!',
  [TrainerClass.JohtoBlackBelt]: 'I train at the falls under Chuck. You will feel it.',
  [TrainerClass.JohtoBirdKeeper]: 'My birds fly the whole coast. Yours have seen one road.',
  [TrainerClass.JohtoBiker]: 'We ride these roads at night. Move or fight.',
  [TrainerClass.JohtoBugCatcher]:
    'The contest is over but I never stopped catching. Look at these!',
  [TrainerClass.JohtoSwimmer]: 'The water is colder here. It has not slowed me down.',
  [TrainerClass.Firebreather]: 'I breathe fire for a living. My pokemon do it better.',
  [TrainerClass.Medium]: 'The dead are chatty tonight. They are all saying your name.',
  [TrainerClass.Teacher]: 'Class is in session. Today’s lesson is losing gracefully.',
  [TrainerClass.SchoolKid]: 'I did the maths on this battle. You will not like the answer.',
  [TrainerClass.Youngster]: 'I have been digging in the dirt since sunrise. Look what came up!',
  [TrainerClass.Camper]: 'Been up this mountain three days. Found rocks. Found these.',
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

/**
 * Whether this is one of the Aces. Each region has one, and what
 * makes them the hard fight of the road is the same in both: no type,
 * five fully-grown, and the levels and the purse to match
 */
export function isAceTrainer(trainer: TrainerClass): boolean {
  return trainer === TrainerClass.AceTrainer || trainer === TrainerClass.JohtoAceTrainer;
}

/** The level band a class fights in */
export function trainerLevels(trainer: TrainerClass): [minimum: number, maximum: number] {
  return isAceTrainer(trainer) ? ACE_TRAINER_LEVELS : TYPE_TRAINER_LEVELS;
}

const LAIR_SPECIES = new Set(EVERY_LAIR.flatMap(getLairResidents));

/**
 * What a class may field: their own region's fully-grown species of
 * their own type, or of any type for the Ace. The region is the
 * class', not the country they are standing in, which is what makes
 * a Johto Swimmer worth meeting on the same water as a Kanto one.
 *
 * Legendaries stay out, one belongs to its raid, and so do the
 * alternate forms and the egg
 */
export function getTrainerPool(trainer: TrainerClass): Species[] {
  const type = TRAINER_TYPES[trainer];

  return getSpeciesByRegion(TRAINER_REGIONS[trainer]).filter((species) => {
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
