import Regions from '../../ids/regions';

/**
 * The people who stand at a duelling landmark: the Ace Trainer, who
 * fields the best of anything, and the type experts, who each field
 * one type and nothing else.
 *
 * A class is rolled per stop per window the way a grunt's party is,
 * so the same cell is a Bug Catcher one afternoon and a Channeler the
 * next, out of the ones that country puts on the road. What a player
 * has put down is counted for life, and that count is what the
 * class' own title is worn off.
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
