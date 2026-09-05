import { isGrownSpecies } from '../biome';
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
  /** Johto's own of the trades Kanto already put on the road */
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
  Beauty = 31,
  Fisherman = 32,
  Sailor = 33,
  Gentleman = 34,
  SuperNerd = 35,
  Juggler = 36,
  Tamer = 37,
  Engineer = 38,
  Gambler = 39,
  JohtoGentleman = 40,
  JohtoSuperNerd = 41,
  JohtoJuggler = 42,
  Boarder = 43,

  /**
   * Hoenn's own three, and the only new **trades** it brings. A trade
   * carries a title numbered `300 + trade * 2`, and the professors'
   * titles start at 400, so a trade past 49 would answer to one of
   * theirs: new trades take the free low numbers, and every class
   * after them is one region's version of a trade that already exists
   */
  NinjaBoy = 44,
  Tuber = 45,
  PokeFan = 46,
  /** Hoenn's own of the trades already on the road, under its name for them */
  HoennAceTrainer = 47,
  HoennLass = 48,
  HoennBirdKeeper = 49,
  HoennBugCatcher = 50,
  HoennSwimmer = 51,
  HoennYoungster = 52,
  HoennSchoolKid = 53,
  HoennCamper = 54,
  HoennBeauty = 55,
  HoennFisherman = 56,
  HoennSailor = 57,
  HoennGentleman = 58,
  HoennScientist = 59,
  // The same trades under Hoenn's own names: a guitarist is a
  // rocker, an aroma lady a sage, a street thug a burglar
  Guitarist = 60,
  Kindler = 61,
  BattleGirl = 62,
  Expert = 63,
  RuinManiac = 64,
  StreetThug = 65,
  DragonTamer = 66,
  AromaLady = 67,
}

export { TrainerClass };

/**
 * A class belongs to a region, and a trade several regions have is
 * here once for each: a Swimmer met on Kanto's water, on Johto's and
 * on Hoenn's is the same trade in three places, drawn differently and
 * fielding what its own region grows.
 *
 * A region's own classes answer the types the ones before it had
 * nobody for: Johto's sages field the Bellsprout of Sprout Tower and
 * its skiers the ice of the north, and Hoenn's answer under local
 * names, so its guitarist is the rocker's trade and its aroma lady
 * the sage's
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
  TrainerClass.Beauty,
  TrainerClass.Fisherman,
  TrainerClass.Sailor,
  TrainerClass.Gentleman,
  TrainerClass.SuperNerd,
  TrainerClass.Juggler,
  TrainerClass.Tamer,
  TrainerClass.Engineer,
  TrainerClass.Gambler,
  TrainerClass.JohtoGentleman,
  TrainerClass.JohtoSuperNerd,
  TrainerClass.JohtoJuggler,
  TrainerClass.Boarder,
  TrainerClass.NinjaBoy,
  TrainerClass.Tuber,
  TrainerClass.PokeFan,
  TrainerClass.HoennAceTrainer,
  TrainerClass.HoennLass,
  TrainerClass.HoennBirdKeeper,
  TrainerClass.HoennBugCatcher,
  TrainerClass.HoennSwimmer,
  TrainerClass.HoennYoungster,
  TrainerClass.HoennSchoolKid,
  TrainerClass.HoennCamper,
  TrainerClass.HoennBeauty,
  TrainerClass.HoennFisherman,
  TrainerClass.HoennSailor,
  TrainerClass.HoennGentleman,
  TrainerClass.HoennScientist,
  TrainerClass.Guitarist,
  TrainerClass.Kindler,
  TrainerClass.BattleGirl,
  TrainerClass.Expert,
  TrainerClass.RuinManiac,
  TrainerClass.StreetThug,
  TrainerClass.DragonTamer,
  TrainerClass.AromaLady,
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
  [TrainerClass.Beauty]: 'Beauty',
  [TrainerClass.Fisherman]: 'Fisherman',
  [TrainerClass.Sailor]: 'Sailor',
  [TrainerClass.Gentleman]: 'Gentleman',
  [TrainerClass.SuperNerd]: 'Super Nerd',
  [TrainerClass.Juggler]: 'Juggler',
  [TrainerClass.Tamer]: 'Tamer',
  [TrainerClass.Engineer]: 'Engineer',
  [TrainerClass.Gambler]: 'Gambler',
  [TrainerClass.JohtoGentleman]: 'Gentleman',
  [TrainerClass.JohtoSuperNerd]: 'Super Nerd',
  [TrainerClass.JohtoJuggler]: 'Juggler',
  [TrainerClass.Boarder]: 'Boarder',
  [TrainerClass.NinjaBoy]: 'Ninja Boy',
  [TrainerClass.Tuber]: 'Tuber',
  [TrainerClass.PokeFan]: 'Poké Fan',
  [TrainerClass.HoennAceTrainer]: 'Ace Trainer',
  [TrainerClass.HoennLass]: 'Lass',
  [TrainerClass.HoennBirdKeeper]: 'Bird Keeper',
  [TrainerClass.HoennBugCatcher]: 'Bug Catcher',
  [TrainerClass.HoennSwimmer]: 'Swimmer',
  [TrainerClass.HoennYoungster]: 'Youngster',
  [TrainerClass.HoennSchoolKid]: 'School Kid',
  [TrainerClass.HoennCamper]: 'Camper',
  [TrainerClass.HoennBeauty]: 'Beauty',
  [TrainerClass.HoennFisherman]: 'Fisherman',
  [TrainerClass.HoennSailor]: 'Sailor',
  [TrainerClass.HoennGentleman]: 'Gentleman',
  [TrainerClass.HoennScientist]: 'Scientist',
  [TrainerClass.Guitarist]: 'Guitarist',
  [TrainerClass.Kindler]: 'Kindler',
  [TrainerClass.BattleGirl]: 'Battle Girl',
  [TrainerClass.Expert]: 'Expert',
  [TrainerClass.RuinManiac]: 'Ruin Maniac',
  [TrainerClass.StreetThug]: 'Street Thug',
  [TrainerClass.DragonTamer]: 'Dragon Tamer',
  [TrainerClass.AromaLady]: 'Aroma Lady',
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
  [TrainerClass.Beauty]: Regions.Kanto,
  [TrainerClass.Fisherman]: Regions.Kanto,
  [TrainerClass.Sailor]: Regions.Kanto,
  [TrainerClass.Gentleman]: Regions.Kanto,
  [TrainerClass.SuperNerd]: Regions.Kanto,
  [TrainerClass.Juggler]: Regions.Kanto,
  [TrainerClass.Tamer]: Regions.Kanto,
  [TrainerClass.Engineer]: Regions.Kanto,
  [TrainerClass.Gambler]: Regions.Kanto,
  [TrainerClass.JohtoGentleman]: Regions.Johto,
  [TrainerClass.JohtoSuperNerd]: Regions.Johto,
  [TrainerClass.JohtoJuggler]: Regions.Johto,
  [TrainerClass.Boarder]: Regions.Johto,
  [TrainerClass.NinjaBoy]: Regions.Hoenn,
  [TrainerClass.Tuber]: Regions.Hoenn,
  [TrainerClass.PokeFan]: Regions.Hoenn,
  [TrainerClass.HoennAceTrainer]: Regions.Hoenn,
  [TrainerClass.HoennLass]: Regions.Hoenn,
  [TrainerClass.HoennBirdKeeper]: Regions.Hoenn,
  [TrainerClass.HoennBugCatcher]: Regions.Hoenn,
  [TrainerClass.HoennSwimmer]: Regions.Hoenn,
  [TrainerClass.HoennYoungster]: Regions.Hoenn,
  [TrainerClass.HoennSchoolKid]: Regions.Hoenn,
  [TrainerClass.HoennCamper]: Regions.Hoenn,
  [TrainerClass.HoennBeauty]: Regions.Hoenn,
  [TrainerClass.HoennFisherman]: Regions.Hoenn,
  [TrainerClass.HoennSailor]: Regions.Hoenn,
  [TrainerClass.HoennGentleman]: Regions.Hoenn,
  [TrainerClass.HoennScientist]: Regions.Hoenn,
  [TrainerClass.Guitarist]: Regions.Hoenn,
  [TrainerClass.Kindler]: Regions.Hoenn,
  [TrainerClass.BattleGirl]: Regions.Hoenn,
  [TrainerClass.Expert]: Regions.Hoenn,
  [TrainerClass.RuinManiac]: Regions.Hoenn,
  [TrainerClass.StreetThug]: Regions.Hoenn,
  [TrainerClass.DragonTamer]: Regions.Hoenn,
  [TrainerClass.AromaLady]: Regions.Hoenn,
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
  [TrainerClass.Beauty]: TrainerClass.Beauty,
  [TrainerClass.Fisherman]: TrainerClass.Fisherman,
  [TrainerClass.Sailor]: TrainerClass.Sailor,
  [TrainerClass.Gentleman]: TrainerClass.Gentleman,
  [TrainerClass.SuperNerd]: TrainerClass.SuperNerd,
  [TrainerClass.Juggler]: TrainerClass.Juggler,
  [TrainerClass.Tamer]: TrainerClass.Tamer,
  [TrainerClass.Engineer]: TrainerClass.Engineer,
  [TrainerClass.Gambler]: TrainerClass.Gambler,
  [TrainerClass.JohtoGentleman]: TrainerClass.Gentleman,
  [TrainerClass.JohtoSuperNerd]: TrainerClass.SuperNerd,
  [TrainerClass.JohtoJuggler]: TrainerClass.Juggler,
  [TrainerClass.Boarder]: TrainerClass.Boarder,
  [TrainerClass.NinjaBoy]: TrainerClass.NinjaBoy,
  [TrainerClass.Tuber]: TrainerClass.Tuber,
  [TrainerClass.PokeFan]: TrainerClass.PokeFan,
  [TrainerClass.HoennAceTrainer]: TrainerClass.AceTrainer,
  [TrainerClass.HoennLass]: TrainerClass.Lass,
  [TrainerClass.HoennBirdKeeper]: TrainerClass.BirdKeeper,
  [TrainerClass.HoennBugCatcher]: TrainerClass.BugCatcher,
  [TrainerClass.HoennSwimmer]: TrainerClass.Swimmer,
  [TrainerClass.HoennYoungster]: TrainerClass.Youngster,
  [TrainerClass.HoennSchoolKid]: TrainerClass.SchoolKid,
  [TrainerClass.HoennCamper]: TrainerClass.Camper,
  [TrainerClass.HoennBeauty]: TrainerClass.Beauty,
  [TrainerClass.HoennFisherman]: TrainerClass.Fisherman,
  [TrainerClass.HoennSailor]: TrainerClass.Sailor,
  [TrainerClass.HoennGentleman]: TrainerClass.Gentleman,
  [TrainerClass.HoennScientist]: TrainerClass.Scientist,
  [TrainerClass.Guitarist]: TrainerClass.Rocker,
  [TrainerClass.Kindler]: TrainerClass.Firebreather,
  [TrainerClass.BattleGirl]: TrainerClass.BlackBelt,
  [TrainerClass.Expert]: TrainerClass.Psychic,
  [TrainerClass.RuinManiac]: TrainerClass.PokeManiac,
  [TrainerClass.StreetThug]: TrainerClass.Burglar,
  [TrainerClass.DragonTamer]: TrainerClass.Tamer,
  [TrainerClass.AromaLady]: TrainerClass.Sage,
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
 * after it only where more than one region puts that name on the
 * road. A name nobody shares is the mainline's own
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
 * What each class fields, as the types that count as theirs.
 *
 * Most bring one, some bring the pair the mainline gives them, and
 * the Aces bring an empty list, which is every type there is: that is
 * what makes them the hard fight of the road. Two trades may want the
 * same type, since what tells a Beauty from a Lass is who they are
 * rather than what they carry
 */
export const TRAINER_TYPES: Record<TrainerClass, Types[]> = {
  [TrainerClass.AceTrainer]: [],
  [TrainerClass.Lass]: [Types.Normal],
  [TrainerClass.BlackBelt]: [Types.Fighting],
  [TrainerClass.BirdKeeper]: [Types.Flying],
  [TrainerClass.Biker]: [Types.Poison],
  [TrainerClass.Hiker]: [Types.Ground],
  [TrainerClass.PokeManiac]: [Types.Rock],
  [TrainerClass.BugCatcher]: [Types.Bug],
  [TrainerClass.Channeler]: [Types.Ghost],
  [TrainerClass.Burglar]: [Types.Fire],
  [TrainerClass.Swimmer]: [Types.Water],
  [TrainerClass.Rocker]: [Types.Electric],
  [TrainerClass.Psychic]: [Types.Psychic],
  [TrainerClass.Sage]: [Types.Grass],
  [TrainerClass.Skier]: [Types.Ice],
  [TrainerClass.Scientist]: [Types.Steel],
  // Johto's two answer the types Kanto has nobody for: the Den's
  // maniacs keep dragons, and its burglars work after dark
  [TrainerClass.JohtoPokeManiac]: [Types.Dragon],
  [TrainerClass.JohtoBurglar]: [Types.Dark],
  [TrainerClass.JohtoAceTrainer]: [],
  [TrainerClass.JohtoLass]: [Types.Normal],
  [TrainerClass.JohtoBlackBelt]: [Types.Fighting],
  [TrainerClass.JohtoBirdKeeper]: [Types.Flying],
  [TrainerClass.JohtoBiker]: [Types.Poison],
  [TrainerClass.JohtoBugCatcher]: [Types.Bug],
  [TrainerClass.JohtoSwimmer]: [Types.Water],
  [TrainerClass.Firebreather]: [Types.Fire],
  [TrainerClass.Medium]: [Types.Ghost],
  [TrainerClass.Teacher]: [Types.Psychic],
  [TrainerClass.SchoolKid]: [Types.Electric],
  [TrainerClass.Youngster]: [Types.Ground],
  [TrainerClass.Camper]: [Types.Rock],
  // A type may be fielded by more than one trade: the mainline's
  // classes overlap, and what tells a Beauty from a Lass is who they
  // are rather than what they bring
  [TrainerClass.Beauty]: [Types.Normal, Types.Water],
  [TrainerClass.Fisherman]: [Types.Water],
  [TrainerClass.Sailor]: [Types.Water, Types.Fighting],
  [TrainerClass.Gentleman]: [Types.Fire, Types.Electric],
  [TrainerClass.SuperNerd]: [Types.Poison, Types.Electric],
  [TrainerClass.Juggler]: [Types.Psychic],
  [TrainerClass.Tamer]: [Types.Ground, Types.Poison],
  // Kanto's one steel line, which is a Magneton and nothing else
  [TrainerClass.Engineer]: [Types.Steel, Types.Electric],
  [TrainerClass.Gambler]: [Types.Normal, Types.Fire],
  [TrainerClass.JohtoGentleman]: [Types.Fire, Types.Electric],
  [TrainerClass.JohtoSuperNerd]: [Types.Poison, Types.Electric],
  [TrainerClass.JohtoJuggler]: [Types.Psychic],
  [TrainerClass.Boarder]: [Types.Ice],
  // Hoenn's own three: the ninja keeps what hides, the tuber what
  // the sea keeps cold, and the fan whatever is worth a photograph
  [TrainerClass.NinjaBoy]: [Types.Poison, Types.Ghost],
  [TrainerClass.Tuber]: [Types.Water, Types.Ice],
  [TrainerClass.PokeFan]: [Types.Normal, Types.Electric],
  [TrainerClass.HoennAceTrainer]: [],
  [TrainerClass.HoennLass]: [Types.Normal],
  [TrainerClass.HoennBirdKeeper]: [Types.Flying],
  [TrainerClass.HoennBugCatcher]: [Types.Bug],
  [TrainerClass.HoennSwimmer]: [Types.Water],
  [TrainerClass.HoennYoungster]: [Types.Ground],
  [TrainerClass.HoennSchoolKid]: [Types.Electric],
  [TrainerClass.HoennCamper]: [Types.Rock],
  [TrainerClass.HoennBeauty]: [Types.Normal, Types.Water],
  [TrainerClass.HoennFisherman]: [Types.Water],
  [TrainerClass.HoennSailor]: [Types.Water, Types.Fighting],
  [TrainerClass.HoennGentleman]: [Types.Fire, Types.Electric],
  // Devon's researchers, who are where Hoenn's steel is made
  [TrainerClass.HoennScientist]: [Types.Steel],
  [TrainerClass.Guitarist]: [Types.Electric],
  [TrainerClass.Kindler]: [Types.Fire],
  [TrainerClass.BattleGirl]: [Types.Fighting],
  // Hoenn has nobody who only reads minds, and its old masters
  // field the Medicham that is both
  [TrainerClass.Expert]: [Types.Psychic, Types.Fighting],
  [TrainerClass.RuinManiac]: [Types.Rock, Types.Ground],
  [TrainerClass.StreetThug]: [Types.Dark],
  [TrainerClass.DragonTamer]: [Types.Dragon],
  [TrainerClass.AromaLady]: [Types.Grass],
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
  [TrainerClass.Psychic]: ['characters/lgpe/psychic'],
  // The tower's sages and the two elders who keep it, who are the
  // same people a few decades apart
  [TrainerClass.Sage]: [
    'characters/hgss/sage',
    'characters/hgss/sage-1',
    'characters/hgss/sage-2',
    'characters/hgss/elder-1',
    'characters/hgss/elder-2',
  ],
  [TrainerClass.Skier]: ['characters/hgss/skier'],
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
  [TrainerClass.Beauty]: ['characters/frlg/beauty'],
  [TrainerClass.Fisherman]: ['characters/lgpe/fisherman'],
  [TrainerClass.Sailor]: ['characters/frlg/sailor', 'characters/lgpe/sailor'],
  [TrainerClass.Gentleman]: ['characters/frlg/gentleman', 'characters/lgpe/gentleman'],
  [TrainerClass.SuperNerd]: ['characters/lgpe/super-nerd'],
  [TrainerClass.Juggler]: ['characters/lgpe/juggler'],
  [TrainerClass.Tamer]: ['characters/frlg/tamer', 'characters/lgpe/tamer'],
  [TrainerClass.Engineer]: ['characters/lgpe/engineer'],
  [TrainerClass.Gambler]: ['characters/lgpe/gambler'],
  [TrainerClass.JohtoGentleman]: ['characters/hgss/gentleman', 'characters/hgss/gentleman-2'],
  [TrainerClass.JohtoSuperNerd]: ['characters/hgss/super-nerd'],
  [TrainerClass.JohtoJuggler]: ['characters/hgss/juggler'],
  [TrainerClass.Boarder]: ['characters/hgss/boarder'],
  [TrainerClass.NinjaBoy]: ['characters/oras/ninja-boy', 'characters/rse/ninja-boy'],
  [TrainerClass.Tuber]: ['characters/oras/tuber-f', 'characters/oras/tuber-m'],
  [TrainerClass.PokeFan]: ['characters/oras/pokefan-f', 'characters/oras/pokefan-m'],
  [TrainerClass.HoennAceTrainer]: ['characters/oras/ace-trainer', 'characters/oras/ace-trainer-f'],
  [TrainerClass.HoennLass]: ['characters/oras/lass'],
  [TrainerClass.HoennBirdKeeper]: ['characters/oras/bird-keeper'],
  [TrainerClass.HoennBugCatcher]: ['characters/oras/bug-catcher'],
  [TrainerClass.HoennSwimmer]: ['characters/oras/swimmer'],
  [TrainerClass.HoennYoungster]: ['characters/oras/youngster'],
  [TrainerClass.HoennSchoolKid]: ['characters/oras/schoolkid-f', 'characters/oras/schoolkid-m'],
  [TrainerClass.HoennCamper]: ['characters/oras/camper', 'characters/oras/picnicker'],
  [TrainerClass.HoennBeauty]: ['characters/oras/beauty'],
  [TrainerClass.HoennFisherman]: ['characters/oras/fisher'],
  [TrainerClass.HoennSailor]: ['characters/oras/sailor'],
  [TrainerClass.HoennGentleman]: ['characters/oras/gentleman'],
  [TrainerClass.HoennScientist]: ['characters/rse/devon-researcher'],
  [TrainerClass.Guitarist]: ['characters/oras/guitarist'],
  [TrainerClass.Kindler]: ['characters/oras/kindler'],
  [TrainerClass.BattleGirl]: ['characters/oras/battle-girl'],
  [TrainerClass.Expert]: ['characters/oras/expert'],
  [TrainerClass.RuinManiac]: ['characters/oras/ruin-maniac'],
  [TrainerClass.StreetThug]: ['characters/oras/street-thug'],
  [TrainerClass.DragonTamer]: ['characters/oras/dragon-tamer'],
  [TrainerClass.AromaLady]: ['characters/oras/aroma-lady'],
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
    TrainerClass.Fisherman,
    TrainerClass.Sailor,
    TrainerClass.HoennSwimmer,
    TrainerClass.HoennBirdKeeper,
    TrainerClass.HoennFisherman,
    TrainerClass.HoennSailor,
  ],
  [Biome.Ocean]: [
    TrainerClass.Swimmer,
    TrainerClass.BirdKeeper,
    TrainerClass.JohtoSwimmer,
    TrainerClass.JohtoBirdKeeper,
    TrainerClass.Fisherman,
    TrainerClass.Sailor,
    TrainerClass.HoennSwimmer,
    TrainerClass.HoennFisherman,
    TrainerClass.HoennSailor,
    TrainerClass.Tuber,
  ],
  [Biome.CoralReef]: [
    TrainerClass.Swimmer,
    TrainerClass.PokeManiac,
    TrainerClass.JohtoSwimmer,
    TrainerClass.Fisherman,
    TrainerClass.HoennSwimmer,
    TrainerClass.HoennFisherman,
    TrainerClass.Tuber,
  ],
  [Biome.Beach]: [
    TrainerClass.Swimmer,
    TrainerClass.Lass,
    TrainerClass.BirdKeeper,
    TrainerClass.JohtoSwimmer,
    TrainerClass.JohtoLass,
    TrainerClass.JohtoBirdKeeper,
    TrainerClass.Beauty,
    TrainerClass.Fisherman,
    TrainerClass.Sailor,
    TrainerClass.HoennSwimmer,
    TrainerClass.HoennLass,
    TrainerClass.HoennBeauty,
    TrainerClass.HoennSailor,
    TrainerClass.Tuber,
  ],
  [Biome.Mangrove]: [
    TrainerClass.Swimmer,
    TrainerClass.Biker,
    TrainerClass.BugCatcher,
    TrainerClass.JohtoSwimmer,
    TrainerClass.JohtoBiker,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.Fisherman,
    TrainerClass.SuperNerd,
    TrainerClass.JohtoSuperNerd,
    TrainerClass.HoennSwimmer,
    TrainerClass.HoennBugCatcher,
    TrainerClass.HoennFisherman,
    TrainerClass.NinjaBoy,
  ],
  [Biome.KelpForest]: [
    TrainerClass.Swimmer,
    TrainerClass.Psychic,
    TrainerClass.JohtoSwimmer,
    TrainerClass.Teacher,
    TrainerClass.Fisherman,
    TrainerClass.Juggler,
    TrainerClass.HoennSwimmer,
    TrainerClass.HoennFisherman,
    TrainerClass.Expert,
  ],
  [Biome.PolarOcean]: [
    TrainerClass.Swimmer,
    TrainerClass.BirdKeeper,
    TrainerClass.Skier,
    TrainerClass.JohtoSwimmer,
    TrainerClass.JohtoBirdKeeper,
    TrainerClass.Boarder,
    TrainerClass.HoennSwimmer,
    TrainerClass.HoennBirdKeeper,
    TrainerClass.Tuber,
  ],
  [Biome.Glacier]: [
    TrainerClass.Swimmer,
    TrainerClass.Hiker,
    TrainerClass.Skier,
    TrainerClass.JohtoSwimmer,
    TrainerClass.Boarder,
    TrainerClass.HoennSwimmer,
    TrainerClass.Tuber,
  ],
  [Biome.Tundra]: [
    TrainerClass.Hiker,
    TrainerClass.BirdKeeper,
    TrainerClass.Lass,
    TrainerClass.Skier,
    TrainerClass.JohtoBirdKeeper,
    TrainerClass.JohtoLass,
    TrainerClass.Boarder,
    TrainerClass.HoennBirdKeeper,
    TrainerClass.HoennLass,
    TrainerClass.Tuber,
  ],
  [Biome.Swamp]: [
    TrainerClass.Biker,
    TrainerClass.Channeler,
    TrainerClass.BugCatcher,
    TrainerClass.JohtoBurglar,
    TrainerClass.JohtoBiker,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.Medium,
    TrainerClass.SuperNerd,
    TrainerClass.JohtoSuperNerd,
    TrainerClass.HoennBugCatcher,
    TrainerClass.NinjaBoy,
    TrainerClass.StreetThug,
  ],
  [Biome.Bog]: [
    TrainerClass.Biker,
    TrainerClass.Channeler,
    TrainerClass.JohtoBurglar,
    TrainerClass.JohtoBiker,
    TrainerClass.Medium,
    TrainerClass.SuperNerd,
    TrainerClass.JohtoSuperNerd,
    TrainerClass.NinjaBoy,
    TrainerClass.StreetThug,
  ],
  [Biome.TropicalSeasonalForest]: [
    TrainerClass.BugCatcher,
    TrainerClass.Lass,
    TrainerClass.BirdKeeper,
    TrainerClass.Sage,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.JohtoLass,
    TrainerClass.JohtoBirdKeeper,
    TrainerClass.HoennBugCatcher,
    TrainerClass.HoennLass,
    TrainerClass.HoennBirdKeeper,
    TrainerClass.AromaLady,
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
    TrainerClass.Beauty,
    TrainerClass.Gambler,
    TrainerClass.HoennLass,
    TrainerClass.HoennBugCatcher,
    TrainerClass.HoennBirdKeeper,
    TrainerClass.HoennYoungster,
    TrainerClass.AromaLady,
    TrainerClass.PokeFan,
  ],
  [Biome.TemperateForest]: [
    TrainerClass.BugCatcher,
    TrainerClass.Lass,
    TrainerClass.Channeler,
    TrainerClass.Sage,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.JohtoLass,
    TrainerClass.Medium,
    TrainerClass.HoennBugCatcher,
    TrainerClass.HoennLass,
    TrainerClass.AromaLady,
    TrainerClass.NinjaBoy,
  ],
  [Biome.Woodland]: [
    TrainerClass.BugCatcher,
    TrainerClass.Lass,
    TrainerClass.Hiker,
    TrainerClass.Sage,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.JohtoLass,
    TrainerClass.Beauty,
    TrainerClass.HoennBugCatcher,
    TrainerClass.HoennLass,
    TrainerClass.HoennBeauty,
    TrainerClass.AromaLady,
  ],
  [Biome.Savanna]: [
    TrainerClass.BirdKeeper,
    TrainerClass.Hiker,
    TrainerClass.BlackBelt,
    TrainerClass.JohtoBirdKeeper,
    TrainerClass.JohtoBlackBelt,
    TrainerClass.Youngster,
    TrainerClass.Sailor,
    TrainerClass.Tamer,
    TrainerClass.HoennBirdKeeper,
    TrainerClass.HoennYoungster,
    TrainerClass.HoennSailor,
    TrainerClass.BattleGirl,
  ],
  [Biome.Steppe]: [
    TrainerClass.BirdKeeper,
    TrainerClass.Hiker,
    TrainerClass.Rocker,
    TrainerClass.JohtoBirdKeeper,
    TrainerClass.SchoolKid,
    TrainerClass.Youngster,
    TrainerClass.Tamer,
    TrainerClass.HoennBirdKeeper,
    TrainerClass.HoennYoungster,
    TrainerClass.HoennSchoolKid,
    TrainerClass.Guitarist,
  ],
  [Biome.Desert]: [
    TrainerClass.Hiker,
    TrainerClass.PokeManiac,
    TrainerClass.Burglar,
    TrainerClass.Firebreather,
    TrainerClass.Youngster,
    TrainerClass.Gentleman,
    TrainerClass.JohtoGentleman,
    TrainerClass.Tamer,
    TrainerClass.Gambler,
    TrainerClass.HoennYoungster,
    TrainerClass.HoennGentleman,
    TrainerClass.RuinManiac,
    TrainerClass.Kindler,
    TrainerClass.DragonTamer,
  ],
  [Biome.Volcano]: [
    TrainerClass.Burglar,
    TrainerClass.PokeManiac,
    TrainerClass.Hiker,
    TrainerClass.Scientist,
    TrainerClass.JohtoPokeManiac,
    TrainerClass.Firebreather,
    TrainerClass.Gentleman,
    TrainerClass.JohtoGentleman,
    TrainerClass.Engineer,
    TrainerClass.HoennGentleman,
    TrainerClass.HoennScientist,
    TrainerClass.RuinManiac,
    TrainerClass.Kindler,
  ],
  [Biome.ColdDesert]: [
    TrainerClass.Hiker,
    TrainerClass.PokeManiac,
    TrainerClass.Skier,
    TrainerClass.Scientist,
    TrainerClass.Camper,
    TrainerClass.Engineer,
    TrainerClass.Boarder,
    TrainerClass.HoennCamper,
    TrainerClass.HoennScientist,
    TrainerClass.RuinManiac,
  ],
  [Biome.Mountain]: [
    TrainerClass.Hiker,
    TrainerClass.PokeManiac,
    TrainerClass.BlackBelt,
    TrainerClass.Scientist,
    TrainerClass.JohtoPokeManiac,
    TrainerClass.JohtoBlackBelt,
    TrainerClass.Camper,
    TrainerClass.Sailor,
    TrainerClass.Tamer,
    TrainerClass.Engineer,
    TrainerClass.HoennCamper,
    TrainerClass.HoennScientist,
    TrainerClass.RuinManiac,
    TrainerClass.BattleGirl,
    TrainerClass.DragonTamer,
  ],
  [Biome.AlpineTundra]: [
    TrainerClass.Hiker,
    TrainerClass.BirdKeeper,
    TrainerClass.Skier,
    TrainerClass.JohtoBirdKeeper,
    TrainerClass.Boarder,
    TrainerClass.HoennBirdKeeper,
    TrainerClass.HoennCamper,
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
    TrainerClass.Tamer,
    TrainerClass.Engineer,
    TrainerClass.SuperNerd,
    TrainerClass.JohtoSuperNerd,
    TrainerClass.JohtoGentleman,
    TrainerClass.HoennYoungster,
    TrainerClass.HoennScientist,
    TrainerClass.RuinManiac,
    TrainerClass.BattleGirl,
    TrainerClass.Kindler,
    TrainerClass.StreetThug,
  ],
  [Biome.RockyCoast]: [
    TrainerClass.PokeManiac,
    TrainerClass.Swimmer,
    TrainerClass.BirdKeeper,
    TrainerClass.JohtoSwimmer,
    TrainerClass.JohtoBirdKeeper,
    TrainerClass.Camper,
    TrainerClass.Fisherman,
    TrainerClass.Sailor,
    TrainerClass.HoennSwimmer,
    TrainerClass.HoennFisherman,
    TrainerClass.HoennSailor,
    TrainerClass.HoennCamper,
    TrainerClass.RuinManiac,
  ],
  [Biome.TemperateRainforest]: [
    TrainerClass.BugCatcher,
    TrainerClass.Channeler,
    TrainerClass.Psychic,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.Medium,
    TrainerClass.Teacher,
    TrainerClass.Juggler,
    TrainerClass.JohtoJuggler,
    TrainerClass.HoennBugCatcher,
    TrainerClass.AromaLady,
    TrainerClass.NinjaBoy,
    TrainerClass.Expert,
  ],
  [Biome.MontaneForest]: [
    TrainerClass.Psychic,
    TrainerClass.BugCatcher,
    TrainerClass.Hiker,
    TrainerClass.Sage,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.Teacher,
    TrainerClass.Juggler,
    TrainerClass.JohtoJuggler,
    TrainerClass.HoennBugCatcher,
    TrainerClass.HoennCamper,
    TrainerClass.AromaLady,
    TrainerClass.Expert,
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
    TrainerClass.Juggler,
    TrainerClass.JohtoJuggler,
    TrainerClass.HoennSchoolKid,
    TrainerClass.HoennScientist,
    TrainerClass.Expert,
    TrainerClass.Guitarist,
    TrainerClass.StreetThug,
  ],
  [Biome.TropicalRainforest]: [
    TrainerClass.BugCatcher,
    TrainerClass.Psychic,
    TrainerClass.Biker,
    TrainerClass.Sage,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.JohtoBiker,
    TrainerClass.Teacher,
    TrainerClass.SuperNerd,
    TrainerClass.Juggler,
    TrainerClass.JohtoJuggler,
    TrainerClass.HoennBugCatcher,
    TrainerClass.AromaLady,
    TrainerClass.NinjaBoy,
    TrainerClass.Expert,
  ],
  [Biome.Shrubland]: [
    TrainerClass.Lass,
    TrainerClass.BugCatcher,
    TrainerClass.Rocker,
    TrainerClass.Sage,
    TrainerClass.JohtoLass,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.SchoolKid,
    TrainerClass.Beauty,
    TrainerClass.Gambler,
    TrainerClass.HoennLass,
    TrainerClass.HoennBugCatcher,
    TrainerClass.HoennSchoolKid,
    TrainerClass.AromaLady,
    TrainerClass.Guitarist,
    TrainerClass.PokeFan,
  ],
  [Biome.Taiga]: [
    TrainerClass.Hiker,
    TrainerClass.BugCatcher,
    TrainerClass.BirdKeeper,
    TrainerClass.Skier,
    TrainerClass.JohtoBurglar,
    TrainerClass.JohtoBugCatcher,
    TrainerClass.JohtoBirdKeeper,
    TrainerClass.Boarder,
    TrainerClass.HoennBugCatcher,
    TrainerClass.HoennBirdKeeper,
    TrainerClass.HoennCamper,
    TrainerClass.StreetThug,
  ],
};

/**
 * Who may be duelling in this country: its own type experts, and the
 * Ace, who belongs to no country
 */
export function getBiomeTrainers(biome: Biome): TrainerClass[] {
  return [
    TrainerClass.AceTrainer,
    TrainerClass.JohtoAceTrainer,
    TrainerClass.HoennAceTrainer,
    ...BIOME_TRAINERS[biome],
  ];
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
  [TrainerClass.Beauty]: 'You are staring. Battle me instead, it is less rude.',
  [TrainerClass.Fisherman]: 'I have been sat here since dawn. Something finally bit.',
  [TrainerClass.Sailor]: 'I have hauled rope in worse weather than you have walked in.',
  [TrainerClass.Gentleman]: 'A wager, then? No? A battle will do just as well.',
  [TrainerClass.SuperNerd]: 'I have read every paper on this. You have read none of them.',
  [TrainerClass.Juggler]: 'Keep your eyes on the balls. That was the trick, and you looked away.',
  [TrainerClass.Tamer]: 'Mine do as they are told. Let us see about yours.',
  [TrainerClass.Engineer]: 'I built half the machines on this road. Meet the rest.',
  [TrainerClass.Gambler]: 'Double or nothing on this one. You do not get a say.',
  [TrainerClass.JohtoGentleman]: 'I keep a house in Goldenrod and a temper on the road.',
  [TrainerClass.JohtoSuperNerd]: 'My notes say you lose in four minutes. Let us test that.',
  [TrainerClass.JohtoJuggler]: 'Six in the air, and not one of them dropped. Watch this.',
  [TrainerClass.Boarder]: 'I came down that face sideways. Standing still is the hard part.',
  [TrainerClass.NinjaBoy]: 'You walked past me twice. My pokemon did not move either time.',
  [TrainerClass.Tuber]: 'I am not getting out of the water. Battle me from the shore!',
  [TrainerClass.PokeFan]: 'I have a photograph of every one of these. Would you like to be in one?',
  [TrainerClass.HoennAceTrainer]:
    'I have crossed this region on foot. Nothing on the road has surprised me yet.',
  [TrainerClass.HoennLass]:
    'Mum said not to talk to strangers. She said nothing about battling them.',
  [TrainerClass.HoennBirdKeeper]:
    'Mine ride the sea wind. Yours have only felt the one off the road.',
  [TrainerClass.HoennBugCatcher]: 'The woods here are thick with them. I took the best three.',
  [TrainerClass.HoennSwimmer]: 'The current out here does half the work. The rest of it is mine.',
  [TrainerClass.HoennYoungster]:
    'I dug this one out from under the ash. I bet you have never seen one.',
  [TrainerClass.HoennSchoolKid]: 'We are testing conductivity today. You are the experiment.',
  [TrainerClass.HoennCamper]:
    'Three nights on this rock and the only thing I have missed is a battle.',
  [TrainerClass.HoennBeauty]: 'The sea air keeps them glossy. Do not let that fool you.',
  [TrainerClass.HoennFisherman]: 'Cast since dawn and caught nothing. You will do.',
  [TrainerClass.HoennSailor]: 'I have crossed to Slateport in worse weather than this. Try me.',
  [TrainerClass.HoennGentleman]: 'I keep a house on the coast and a temper on the road.',
  [TrainerClass.HoennScientist]: 'Devon pays for this field work. Consider yourself data.',
  [TrainerClass.Guitarist]: 'Plug in and stand back. This one gets loud.',
  [TrainerClass.Kindler]: 'The mountain is hot enough already. My pokemon make it worse.',
  [TrainerClass.BattleGirl]: 'I train under the falls at Dewford. You are about to feel it.',
  [TrainerClass.Expert]: 'I saw how this ends before you spoke. Come on anyway.',
  [TrainerClass.RuinManiac]: 'I dug these tunnels myself. Look what was sleeping in one.',
  [TrainerClass.StreetThug]: 'This road is ours after dark. You are paying the toll in wins.',
  [TrainerClass.DragonTamer]:
    'Raised from an egg out in the sand. It listens to me and nobody else.',
  [TrainerClass.AromaLady]: 'Breathe in. My pokemon grew up in this, and they are stronger for it.',
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
  return (
    trainer === TrainerClass.AceTrainer ||
    trainer === TrainerClass.JohtoAceTrainer ||
    trainer === TrainerClass.HoennAceTrainer
  );
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
  const types = new Set(TRAINER_TYPES[trainer]);

  return getSpeciesByRegion(TRAINER_REGIONS[trainer]).filter((species) => {
    if (species === Species.Egg || LAIR_SPECIES.has(species) || !isBaseForm(species)) {
      return false;
    }
    // "Rare" is the shape of the line rather than the odds of meeting
    // one: a species nothing evolves into is what a trainer this far
    // along would be walking with
    if (!isGrownSpecies(species)) {
      return false;
    }
    // An empty list is every type there is, which is the Ace's
    return types.size === 0 || getSpeciesData(species).types.some((one) => types.has(one));
  });
}
