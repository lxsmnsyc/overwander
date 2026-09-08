import { Types } from '../../constants/types';
import { TrainerClass } from './classes';

/**
 * What each class fields, as the types that count as theirs.
 *
 * Most bring one, some bring the pair the mainline gives them, and
 * the Aces bring an empty list, which is every type there is: that is
 * what makes them the hard fight of the road. Two trades may want the
 * same type, since what tells a Beauty from a Lass is who they are
 * rather than what they carry
 */
const TRAINER_TYPES: Record<TrainerClass, Types[]> = {
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

export default TRAINER_TYPES;
