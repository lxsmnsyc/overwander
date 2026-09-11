import { TRAINER_CLASSES, TrainerClass } from './classes';

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
